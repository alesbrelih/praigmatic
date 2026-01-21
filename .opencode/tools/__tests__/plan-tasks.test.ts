import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readFile, writeFile, readdir, stat } from 'node:fs/promises';
import planTasks from '../plan-tasks.js';
import { parseTaskLine, updateTaskCheckbox, reconstructTaskLine } from '../plan-tasks.js';

// Mock file system operations
vi.mock('node:fs/promises', () => ({
  readFile: vi.fn(),
  writeFile: vi.fn(),
  readdir: vi.fn(),
  stat: vi.fn(),
}));

describe('plan-tasks tool', () => {
  const mockPlanContent = `# Test Plan

## Tasks

- [ ] First task
  Some description

- [ ] Second task with note <!-- Note: This is important -->

- [~] Third task in progress

- [x] Fourth task completed

- [X] Fifth task completed (uppercase X)

## More Tasks

- [ ] Sixth task
- [ ] Seventh task

`;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTaskStatus operation', () => {
    it('should successfully retrieve task status for TODO task', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('TODO');
      expect(task.content).toBe('First task');
      expect(task.planPath).toContain('test-plan.md');
      expect(task.note).toBeUndefined();
    });

    it('should successfully retrieve task status for IN_PROGRESS task', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 2,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('IN_PROGRESS');
      expect(task.content).toBe('Third task in progress');
    });

    it('should successfully retrieve task status for DONE task', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 3,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('DONE');
      expect(task.content).toBe('Fourth task completed');
    });

    it('should retrieve task with note', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 1,
      });

      const task = JSON.parse(result);
      expect(task.note).toBe('This is important');
    });

    it('should throw error when task index not found', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'test-plan.md',
          taskIndex: 99,
        })
      ).rejects.toThrow('Failed to get task status');
    });

    it('should throw error when plan file not found', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'nonexistent.md',
          taskIndex: 0,
        })
      ).rejects.toThrow('Plan file not found');
    });

    it('should use most recent plan when no plan name provided', async () => {
      vi.mocked(readdir).mockResolvedValue([
        'plan1.md',
        'plan2.md',
        'README.md',
      ]);
      vi.mocked(stat)
        .mockResolvedValueOnce({ mtimeMs: 1000 } as any)
        .mockResolvedValueOnce({ mtimeMs: 2000 } as any)
        .mockResolvedValueOnce({ mtimeMs: 2000 } as any);
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.planPath).toContain('plan2.md');
      expect(task.status).toBe('TODO');
    });
  });

  describe('markInProgress operation', () => {
    it('should successfully mark TODO task as in-progress', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'markInProgress',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('IN_PROGRESS');
      expect(task.content).toBe('First task');
      expect(writeFile).toHaveBeenCalled();
    });

    it('should preserve indentation when marking in-progress', async () => {
      const indentedContent = `
# Plan

  - [ ] Indented task
    - [ ] Nested task

- [ ] Normal task
`;
      vi.mocked(readFile).mockResolvedValue(indentedContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await planTasks.execute({
        operation: 'markInProgress',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      expect(writtenContent).toContain('  - [~] Indented task');
    });

    it('should throw error when marking already in-progress task', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'markInProgress',
          planName: 'test-plan.md',
          taskIndex: 2,
        })
      ).rejects.toThrow('already marked as in-progress');
    });

    it('should throw error when marking DONE task as in-progress', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'markInProgress',
          planName: 'test-plan.md',
          taskIndex: 3,
        })
      ).rejects.toThrow('already done');
    });

    it('should throw error when task index not found', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'markInProgress',
          planName: 'test-plan.md',
          taskIndex: 99,
        })
      ).rejects.toThrow('Failed to mark task as in-progress');
    });
  });

  describe('markCompleted operation', () => {
    it('should successfully mark TODO task as completed', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'markCompleted',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('DONE');
      expect(task.content).toBe('First task');
      expect(writeFile).toHaveBeenCalled();
    });

    it('should successfully mark IN_PROGRESS task as completed', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'markCompleted',
        planName: 'test-plan.md',
        taskIndex: 2,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('DONE');
      expect(task.content).toBe('Third task in progress');
      expect(writeFile).toHaveBeenCalled();
    });

    it('should preserve indentation when marking completed', async () => {
      const indentedContent = `
# Plan

  - [ ] Indented task
    - [ ] Nested task

- [ ] Normal task
`;
      vi.mocked(readFile).mockResolvedValue(indentedContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await planTasks.execute({
        operation: 'markCompleted',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      expect(writtenContent).toContain('  - [x] Indented task');
    });

    it('should throw error when marking already completed task', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'markCompleted',
          planName: 'test-plan.md',
          taskIndex: 3,
        })
      ).rejects.toThrow('already marked as completed');
    });

    it('should throw error when task index not found', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'markCompleted',
          planName: 'test-plan.md',
          taskIndex: 99,
        })
      ).rejects.toThrow('Failed to mark task as completed');
    });
  });

  describe('addNote operation', () => {
    it('should successfully add note to task', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'addNote',
        planName: 'test-plan.md',
        taskIndex: 0,
        note: 'This is a test note',
      });

      const addNoteResult = JSON.parse(result);
      expect(addNoteResult.addedNote).toBe('This is a test note');
      expect(addNoteResult.noteIndentation).toBe('  ');
      expect(writeFile).toHaveBeenCalled();

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      expect(writtenContent).toContain('- ⚠️ NOTE: This is a test note');
    });

    it('should trim whitespace from note', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'addNote',
        planName: 'test-plan.md',
        taskIndex: 0,
        note: '  Whitespace note  ',
      });

      const addNoteResult = JSON.parse(result);
      expect(addNoteResult.addedNote).toBe('Whitespace note');
    });

    it('should add note with proper indentation for indented task', async () => {
      const indentedContent = `
# Plan

  - [ ] Indented task
    - [ ] Nested task

- [ ] Normal task
`;
      vi.mocked(readFile).mockResolvedValue(indentedContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'addNote',
        planName: 'test-plan.md',
        taskIndex: 0,
        note: 'Indented note',
      });

      const addNoteResult = JSON.parse(result);
      expect(addNoteResult.noteIndentation).toBe('    ');

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      const writtenContent = writeCall[1] as string;
      expect(writtenContent).toContain('    - ⚠️ NOTE: Indented note');
    });

    it('should throw error for empty note', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'addNote',
          planName: 'test-plan.md',
          taskIndex: 0,
          note: '   ',
        })
      ).rejects.toThrow('Invalid note: note cannot be empty');
    });

    it('should throw error for note exceeding maximum length', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const longNote = 'a'.repeat(2001);
      await expect(
        planTasks.execute({
          operation: 'addNote',
          planName: 'test-plan.md',
          taskIndex: 0,
          note: longNote,
        })
      ).rejects.toThrow('Invalid note: note exceeds maximum length of 2000 characters');
    });

    it('should throw error when note parameter is missing', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'addNote',
          planName: 'test-plan.md',
          taskIndex: 0,
        } as any)
      ).rejects.toThrow('Note is required for addNote operation');
    });

    it('should throw error when task index not found', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'addNote',
          planName: 'test-plan.md',
          taskIndex: 99,
          note: 'Test note',
        })
      ).rejects.toThrow('Failed to add note to task');
    });
  });

  describe('validateAndResolvePlanPath - Path validation', () => {
    it('should accept valid plan name with .md extension', async () => {
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.planPath).toContain('test-plan.md');
    });

    it('should find most recent plan when no name provided', async () => {
      vi.mocked(readdir).mockResolvedValue([
        'old-plan.md',
        'new-plan.md',
        'README.md',
      ]);
      vi.mocked(stat)
        .mockResolvedValueOnce({ mtimeMs: 1000 } as any)
        .mockResolvedValueOnce({ mtimeMs: 2000 } as any);
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.planPath).toContain('new-plan.md');
    });

    it('should throw error for path traversal attempt with ..', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: '../etc/passwd',
          taskIndex: 0,
        })
      ).rejects.toThrow();
    });

    it('should throw error when plans directory does not exist', async () => {
      vi.mocked(readdir).mockRejectedValue(new Error('Directory not found'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          taskIndex: 0,
        })
      ).rejects.toThrow('.opencode/plans/ directory does not exist');
    });

    it('should throw error when no plan files found', async () => {
      vi.mocked(readdir).mockResolvedValue(['README.md']);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          taskIndex: 0,
        })
      ).rejects.toThrow('No plan files found in .opencode/plans/');
    });

    it('should throw error for non-existent plan file', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'nonexistent.md',
          taskIndex: 0,
        })
      ).rejects.toThrow('Plan file not found');
    });
  });

  describe('validateTaskIndex - Index validation', () => {
    it('should accept valid task indices', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('TODO');
    });

    it('should throw error for negative index', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'test-plan.md',
          taskIndex: -1,
        })
      ).rejects.toThrow('Invalid task index: must be a non-negative integer');
    });

    it('should throw error for non-integer index', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'test-plan.md',
          taskIndex: 1.5,
        } as any)
      ).rejects.toThrow('Invalid task index: must be a non-negative integer');
    });

    it('should throw error for index exceeding maximum', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'test-plan.md',
          taskIndex: 10001,
        })
      ).rejects.toThrow('Invalid task index: exceeds maximum allowed value (10000)');
    });
  });

  describe('parseTaskStatus - Status parsing', () => {
    it('should parse TODO status [ ]', async () => {
      const todoContent = `- [ ] TODO task`;
      vi.mocked(readFile).mockResolvedValue(todoContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('TODO');
    });

    it('should parse IN_PROGRESS status [~]', async () => {
      const progressContent = `- [~] In progress task`;
      vi.mocked(readFile).mockResolvedValue(progressContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('IN_PROGRESS');
    });

    it('should parse DONE status [x] (lowercase)', async () => {
      const doneContent = `- [x] Done task`;
      vi.mocked(readFile).mockResolvedValue(doneContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('DONE');
    });

    it('should parse DONE status [X] (uppercase)', async () => {
      const doneContent = `- [X] Done task`;
      vi.mocked(readFile).mockResolvedValue(doneContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('DONE');
    });

    it('should ignore non-task lines', async () => {
      const mixedContent = `# Header

Some text

- [ ] Only task

More text
`;
      vi.mocked(readFile).mockResolvedValue(mixedContent);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.status).toBe('TODO');
      expect(task.content).toBe('Only task');
    });
  });

  describe('Task finding helper functions', () => {
    const mockTasks: Array<ReturnType<typeof parseTaskLine> & { lineIndex: number }> = [
      {
        indent: '',
        bullet: '-',
        checkbox: '[ ]',
        content: 'First task',
        taskName: 'First task',
        size: null,
        status: 'pending',
        lineIndex: 0,
      },
      {
        indent: '',
        bullet: '-',
        checkbox: '[ ]',
        content: 'Second task',
        taskName: 'Second task',
        size: null,
        status: 'pending',
        lineIndex: 1,
      },
      {
        indent: '',
        bullet: '-',
        checkbox: '[~]',
        content: 'Third task in progress',
        taskName: 'Third task in progress',
        size: null,
        status: 'in-progress',
        lineIndex: 2,
      },
      {
        indent: '',
        bullet: '-',
        checkbox: '[x]',
        content: 'Fourth task completed',
        taskName: 'Fourth task completed',
        size: null,
        status: 'completed',
        lineIndex: 3,
      },
    ];

    describe('findTaskIndex', () => {
      it('should find task by exact name match', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('Second task', mockTasks);
        expect(index).toBe(1);
      });

      it('should return -1 if task not found', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('Nonexistent task', mockTasks);
        expect(index).toBe(-1);
      });

      it('should handle case-insensitive matching', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('SECOND TASK', mockTasks);
        expect(index).toBe(1);
      });

      it('should normalize whitespace in comparison', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('  Second task  ', mockTasks);
        expect(index).toBe(1);
      });

      it('should return first match for multiple similar names', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const tasksWithDuplicates = [
          ...mockTasks,
          {
            indent: '',
            bullet: '-',
            checkbox: '[ ]',
            content: 'Second task (duplicate)',
            taskName: 'Second task',
            size: null,
            status: 'pending',
            lineIndex: 4,
          },
        ];
        const index = findTaskIndex('Second task', tasksWithDuplicates);
        expect(index).toBe(1); // Should return first match
      });

      it('should not match substrings', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('Second', mockTasks);
        expect(index).toBe(-1); // Should not match partial name
      });

      it('should handle empty task name', async () => {
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('', mockTasks);
        expect(index).toBe(-1);
      });

      it('should handle tasks with size annotations', async () => {
        const tasksWithSize = [
          {
            indent: '',
            bullet: '-',
            checkbox: '[ ]',
            content: 'Task with size (3 points)',
            taskName: 'Task with size',
            size: '(3 points)',
            status: 'pending' as const,
            lineIndex: 0,
          },
        ];
        const { findTaskIndex } = await import('../plan-tasks.js');
        const index = findTaskIndex('Task with size', tasksWithSize);
        expect(index).toBe(0);
      });
    });

    describe('findNextPendingTask', () => {
      it('should find first pending task', async () => {
        const { findNextPendingTask } = await import('../plan-tasks.js');
        const task = findNextPendingTask(mockTasks);
        expect(task).not.toBeNull();
        expect(task?.taskName).toBe('First task');
        expect(task?.status).toBe('pending');
      });

      it('should find first pending task after completed tasks', async () => {
        const tasksWithCompletedFirst: Array<ReturnType<typeof parseTaskLine> & { lineIndex: number }> = [
          {
            indent: '',
            bullet: '-',
            checkbox: '[x]',
            content: 'Completed task',
            taskName: 'Completed task',
            size: null,
            status: 'completed',
            lineIndex: 0,
          },
          {
            indent: '',
            bullet: '-',
            checkbox: '[ ]',
            content: 'Pending task',
            taskName: 'Pending task',
            size: null,
            status: 'pending',
            lineIndex: 1,
          },
        ];
        const { findNextPendingTask } = await import('../plan-tasks.js');
        const task = findNextPendingTask(tasksWithCompletedFirst);
        expect(task?.taskName).toBe('Pending task');
      });

      it('should return null if no pending tasks', async () => {
        const { findNextPendingTask } = await import('../plan-tasks.js');
        const allCompletedTasks = mockTasks.filter(t => t.status !== 'pending');
        const task = findNextPendingTask(allCompletedTasks);
        expect(task).toBeNull();
      });

      it('should return null for empty tasks array', async () => {
        const { findNextPendingTask } = await import('../plan-tasks.js');
        const task = findNextPendingTask([]);
        expect(task).toBeNull();
      });
    });

    describe('findInProgressTask', () => {
      it('should find first in-progress task', async () => {
        const { findInProgressTask } = await import('../plan-tasks.js');
        const task = findInProgressTask(mockTasks);
        expect(task).not.toBeNull();
        expect(task?.taskName).toBe('Third task in progress');
        expect(task?.status).toBe('in-progress');
      });

      it('should find in-progress task after pending tasks', async () => {
        const tasksWithPendingFirst: Array<ReturnType<typeof parseTaskLine> & { lineIndex: number }> = [
          {
            indent: '',
            bullet: '-',
            checkbox: '[ ]',
            content: 'Pending task',
            taskName: 'Pending task',
            size: null,
            status: 'pending',
            lineIndex: 0,
          },
          {
            indent: '',
            bullet: '-',
            checkbox: '[~]',
            content: 'In-progress task',
            taskName: 'In-progress task',
            size: null,
            status: 'in-progress',
            lineIndex: 1,
          },
        ];
        const { findInProgressTask } = await import('../plan-tasks.js');
        const task = findInProgressTask(tasksWithPendingFirst);
        expect(task?.taskName).toBe('In-progress task');
      });

      it('should return null if no in-progress tasks', async () => {
        const { findInProgressTask } = await import('../plan-tasks.js');
        const noInProgressTasks = mockTasks.filter(t => t.status !== 'in-progress');
        const task = findInProgressTask(noInProgressTasks);
        expect(task).toBeNull();
      });

      it('should return null for empty tasks array', async () => {
        const { findInProgressTask } = await import('../plan-tasks.js');
        const task = findInProgressTask([]);
        expect(task).toBeNull();
      });
    });
  });

  describe('parseTaskContent - Content parsing', () => {
    it('should parse simple task content', async () => {
      const content = `- [ ] Simple task`;
      vi.mocked(readFile).mockResolvedValue(content);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.content).toBe('Simple task');
    });

    it('should parse task with description', async () => {
      const content = `- [ ] Task with additional description`;
      vi.mocked(readFile).mockResolvedValue(content);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.content).toBe('Task with additional description');
    });

    it('should handle different indentation levels', async () => {
      const content = `
  - [ ] Indented task
    - [ ] Nested task
`;
      vi.mocked(readFile).mockResolvedValue(content);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.content).toBe('Indented task');
    });

    it('should handle tasks with notes', async () => {
      const content = `- [ ] Task with note <!-- Note: Important -->`;
      vi.mocked(readFile).mockResolvedValue(content);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await planTasks.execute({
        operation: 'getTaskStatus',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const task = JSON.parse(result);
      expect(task.content).toBe('Task with note <!-- Note: Important -->');
      expect(task.note).toBe('Important');
    });
  });

  describe('Line ending preservation', () => {
    it('should preserve LF line endings', async () => {
      const lfContent = `- [ ] Task\n- [ ] Another task`;
      vi.mocked(readFile).mockResolvedValue(lfContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await planTasks.execute({
        operation: 'markCompleted',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      expect(writeCall[2]).toBe('utf-8');
    });

    it('should preserve CRLF line endings', async () => {
      const crlfContent = `- [ ] Task\r\n- [ ] Another task`;
      vi.mocked(readFile).mockResolvedValue(crlfContent);
      vi.mocked(writeFile).mockResolvedValue();
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await planTasks.execute({
        operation: 'markCompleted',
        planName: 'test-plan.md',
        taskIndex: 0,
      });

      const writeCall = vi.mocked(writeFile).mock.calls[0];
      expect(writeCall[2]).toBe('utf-8');
    });
  });

  describe('Error handling and edge cases', () => {
    it('should handle file read errors gracefully', async () => {
      vi.mocked(readFile).mockRejectedValue(new Error('Read error'));
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'test-plan.md',
          taskIndex: 0,
        })
      ).rejects.toThrow('Failed to get task status');
    });

    it('should handle file write errors gracefully', async () => {
      vi.mocked(readFile).mockResolvedValue(mockPlanContent);
      vi.mocked(writeFile).mockRejectedValue(new Error('Write error'));
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'markInProgress',
          planName: 'test-plan.md',
          taskIndex: 0,
        })
      ).rejects.toThrow('Failed to mark task as in-progress');
    });

    it('should handle directory read errors gracefully', async () => {
      vi.mocked(readdir).mockRejectedValue(new Error('Permission denied'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          taskIndex: 0,
        })
      ).rejects.toThrow('.opencode/plans/ directory does not exist');
    });

    it('should handle empty plan file', async () => {
      vi.mocked(readFile).mockResolvedValue('');
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'empty.md',
          taskIndex: 0,
        })
      ).rejects.toThrow('Failed to get task status');
    });
  });

  describe('Security tests', () => {
    it('should prevent path traversal with ../', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: '../../../etc/passwd',
          taskIndex: 0,
        })
      ).rejects.toThrow();
    });

    it('should prevent path traversal with absolute path', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('File not found'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: '/etc/passwd',
          taskIndex: 0,
        })
      ).rejects.toThrow();
    });

    it('should reject non-markdown files', async () => {
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: 'test.txt',
          taskIndex: 0,
        })
      ).rejects.toThrow('must be a .md file');
    });

    it('should ensure path is within .opencode/plans directory', async () => {
      vi.mocked(stat).mockRejectedValue(new Error('Path outside directory'));

      await expect(
        planTasks.execute({
          operation: 'getTaskStatus',
          planName: '../outside.md',
          taskIndex: 0,
        })
      ).rejects.toThrow();
    });
  });

  describe('updateTaskCheckbox', () => {
    describe('Checkbox updates with hyphen bullet', () => {
      it('should update checkbox to in-progress with hyphen bullet', () => {
        const result = updateTaskCheckbox("- [ ] Task", "in-progress");
        expect(result).toBe("- [~] Task");
      });

      it('should update checkbox to completed with hyphen bullet', () => {
        const result = updateTaskCheckbox("- [~] Task", "completed");
        expect(result).toBe("- [x] Task");
      });

      it('should update checkbox to pending with hyphen bullet', () => {
        const result = updateTaskCheckbox("- [x] Task", "pending");
        expect(result).toBe("- [ ] Task");
      });
    });

    describe('Checkbox updates with asterisk bullet', () => {
      it('should update checkbox to in-progress with asterisk bullet', () => {
        const result = updateTaskCheckbox("* [ ] Task", "in-progress");
        expect(result).toBe("* [~] Task");
      });

      it('should update checkbox to completed with asterisk bullet', () => {
        const result = updateTaskCheckbox("* [~] Task", "completed");
        expect(result).toBe("* [x] Task");
      });

      it('should update checkbox to pending with asterisk bullet', () => {
        const result = updateTaskCheckbox("* [x] Task", "pending");
        expect(result).toBe("* [ ] Task");
      });
    });

    describe('Checkbox updates with plus bullet', () => {
      it('should update checkbox to in-progress with plus bullet', () => {
        const result = updateTaskCheckbox("+ [ ] Task", "in-progress");
        expect(result).toBe("+ [~] Task");
      });

      it('should update checkbox to completed with plus bullet', () => {
        const result = updateTaskCheckbox("+ [~] Task", "completed");
        expect(result).toBe("+ [x] Task");
      });

      it('should update checkbox to pending with plus bullet', () => {
        const result = updateTaskCheckbox("+ [x] Task", "pending");
        expect(result).toBe("+ [ ] Task");
      });
    });

    describe('Indentation preservation', () => {
      it('should preserve single-space indentation', () => {
        const result = updateTaskCheckbox(" - [ ] Indented task", "in-progress");
        expect(result).toBe(" - [~] Indented task");
      });

      it('should preserve two-space indentation', () => {
        const result = updateTaskCheckbox("  - [ ] Indented task", "in-progress");
        expect(result).toBe("  - [~] Indented task");
      });

      it('should preserve four-space indentation', () => {
        const result = updateTaskCheckbox("    - [ ] Indented task", "in-progress");
        expect(result).toBe("    - [~] Indented task");
      });

      it('should preserve tab indentation', () => {
        const result = updateTaskCheckbox("\t- [ ] Indented task", "in-progress");
        expect(result).toBe("\t- [~] Indented task");
      });
    });

    describe('Content preservation', () => {
      it('should preserve content with special characters', () => {
        const result = updateTaskCheckbox("- [ ] Task with (3 points)", "completed");
        expect(result).toBe("- [x] Task with (3 points)");
      });

      it('should preserve content with numbers', () => {
        const result = updateTaskCheckbox("- [ ] Task version 2.0", "in-progress");
        expect(result).toBe("- [~] Task version 2.0");
      });

      it('should preserve content with parentheses', () => {
        const result = updateTaskCheckbox("- [ ] Task (priority: high)", "completed");
        expect(result).toBe("- [x] Task (priority: high)");
      });

      it('should preserve content with multiple words', () => {
        const result = updateTaskCheckbox("- [ ] Implement the feature completely", "in-progress");
        expect(result).toBe("- [~] Implement the feature completely");
      });
    });

    describe('Checkbox state transitions', () => {
      it('should handle pending to in-progress transition', () => {
        expect(updateTaskCheckbox("- [ ] Task", "in-progress")).toBe("- [~] Task");
      });

      it('should handle in-progress to completed transition', () => {
        expect(updateTaskCheckbox("- [~] Task", "completed")).toBe("- [x] Task");
      });

      it('should handle completed to pending transition', () => {
        expect(updateTaskCheckbox("- [x] Task", "pending")).toBe("- [ ] Task");
      });

      it('should handle direct pending to completed transition', () => {
        expect(updateTaskCheckbox("- [ ] Task", "completed")).toBe("- [x] Task");
      });

      it('should handle direct completed to pending transition', () => {
        expect(updateTaskCheckbox("- [x] Task", "pending")).toBe("- [ ] Task");
      });

      it('should handle uppercase [X] to lowercase [x]', () => {
        expect(updateTaskCheckbox("- [X] Task", "pending")).toBe("- [ ] Task");
      });
    });

    describe('Error handling', () => {
      it('should return null for non-task lines', () => {
        const result = updateTaskCheckbox("Not a task line", "in-progress");
        expect(result).toBeNull();
      });

      it('should return null for empty string', () => {
        const result = updateTaskCheckbox("", "in-progress");
        expect(result).toBeNull();
      });

      it('should return null for plain text', () => {
        const result = updateTaskCheckbox("# Header", "in-progress");
        expect(result).toBeNull();
      });

      it('should return null for list without checkbox', () => {
        const result = updateTaskCheckbox("- Just a list item", "in-progress");
        expect(result).toBeNull();
      });
    });
  });

  describe('reconstructTaskLine', () => {
    describe('Line reconstruction with different statuses', () => {
      it('should reconstruct line with pending status', () => {
        const result = reconstructTaskLine(
          { indent: "  ", bullet: "-", content: "Task" },
          "pending"
        );
        expect(result).toBe("  - [ ] Task");
      });

      it('should reconstruct line with in-progress status', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "*", content: "Task" },
          "in-progress"
        );
        expect(result).toBe("* [~] Task");
      });

      it('should reconstruct line with completed status', () => {
        const result = reconstructTaskLine(
          { indent: "    ", bullet: "+", content: "Task" },
          "completed"
        );
        expect(result).toBe("    + [x] Task");
      });
    });

    describe('Line reconstruction with different bullets', () => {
      it('should reconstruct line with hyphen bullet', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "-", content: "Task" },
          "in-progress"
        );
        expect(result).toBe("- [~] Task");
      });

      it('should reconstruct line with asterisk bullet', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "*", content: "Task" },
          "in-progress"
        );
        expect(result).toBe("* [~] Task");
      });

      it('should reconstruct line with plus bullet', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "+", content: "Task" },
          "in-progress"
        );
        expect(result).toBe("+ [~] Task");
      });
    });

    describe('Line reconstruction with content preservation', () => {
      it('should reconstruct line with complex content', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "-", content: "Implement feature (3 points)" },
          "in-progress"
        );
        expect(result).toBe("- [~] Implement feature (3 points)");
      });

      it('should reconstruct line with special characters', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "-", content: "Fix bug #123 (priority: high)" },
          "completed"
        );
        expect(result).toBe("- [x] Fix bug #123 (priority: high)");
      });

      it('should reconstruct line with emoji', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "-", content: "Add 🎉 celebration" },
          "completed"
        );
        expect(result).toBe("- [x] Add 🎉 celebration");
      });
    });

    describe('Line reconstruction with indentation', () => {
      it('should reconstruct line with no indentation', () => {
        const result = reconstructTaskLine(
          { indent: "", bullet: "-", content: "Task" },
          "pending"
        );
        expect(result).toBe("- [ ] Task");
      });

      it('should reconstruct line with spaces', () => {
        const result = reconstructTaskLine(
          { indent: "    ", bullet: "-", content: "Task" },
          "pending"
        );
        expect(result).toBe("    - [ ] Task");
      });

      it('should reconstruct line with tabs', () => {
        const result = reconstructTaskLine(
          { indent: "\t\t", bullet: "-", content: "Task" },
          "pending"
        );
        expect(result).toBe("\t\t- [ ] Task");
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid status', () => {
        expect(() =>
          reconstructTaskLine({ indent: "", bullet: "-", content: "Task" }, "invalid" as any)
        ).toThrow("Invalid status: invalid");
      });

      it('should throw error with detailed message for invalid status', () => {
        expect(() =>
          reconstructTaskLine({ indent: "", bullet: "-", content: "Task" }, "unknown" as any)
        ).toThrow("Must be one of: pending, in-progress, completed");
      });
    });
  });
});
