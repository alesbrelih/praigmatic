import { tool } from "@opencode-ai/plugin";
import { readFile, stat } from "node:fs/promises";
import { resolve, normalize } from "node:path";

/**
 * Task status enumeration
 */
enum TaskStatus {
  TODO = "TODO",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

/**
 * Validate and construct plan file path
 * Prevents path traversal attacks by ensuring the path is within .opencode/plans/
 * @param planName - Optional plan name (without .opencode/plans/ prefix)
 * @returns The validated, resolved path to the plan file
 * @throws {Error} If the path is outside .opencode/plans/ or doesn't exist
 */
async function validateAndResolvePlanPath(planName?: string): Promise<string> {
  let planPath: string;

  if (planName) {
    // Construct path from plan name
    planPath = `.opencode/plans/${planName}`;
  } else {
    // Find most recent plan if no name provided
    const { readdir } = await import("node:fs/promises");
    const plansDir = ".opencode/plans";
    let entries: string[];

    try {
      entries = await readdir(plansDir);
    } catch {
      throw new Error(".opencode/plans/ directory does not exist");
    }

    const mdFiles = entries.filter((name) => name.endsWith(".md") && name !== "README.md");

    if (mdFiles.length === 0) {
      throw new Error("No plan files found in .opencode/plans/");
    }

    const filesWithStats = await Promise.all(
      mdFiles.map(async (name) => {
        const path = `${plansDir}/${name}`;
        const stats = await stat(path);
        return { path, mtimeMs: stats.mtimeMs };
      })
    );

    const mostRecent = filesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
    planPath = mostRecent.path;
  }

  // Normalize and resolve the path to prevent traversal attacks
  const normalizedPath = normalize(resolve(planPath));

  // Ensure the path is within the .opencode/plans directory
  const plansDir = resolve(".opencode/plans");
  if (!normalizedPath.startsWith(plansDir)) {
    throw new Error("Invalid plan path: must be within .opencode/plans/ directory");
  }

  // Ensure it's a markdown file
  if (!normalizedPath.endsWith(".md")) {
    throw new Error("Invalid plan path: must be a .md file");
  }

  // Verify the file exists
  try {
    await stat(normalizedPath);
  } catch {
    throw new Error(`Plan file not found: ${planPath}`);
  }

  return normalizedPath;
}

/**
 * Validate task index
 * @param index - The task index to validate
 * @throws {Error} If the index is invalid
 */
function validateTaskIndex(index: number): void {
  if (!Number.isInteger(index) || index < 0) {
    throw new Error("Invalid task index: must be a non-negative integer");
  }
  if (index > 10000) {
    throw new Error("Invalid task index: exceeds maximum allowed value (10000)");
  }
}

/**
 * Validate note content
 * @param note - The note text to validate
 * @throws {Error} If the note is invalid
 */
function validateNote(note: string): void {
  const trimmed = note.trim();

  if (trimmed.length === 0) {
    throw new Error("Invalid note: note cannot be empty");
  }

  if (trimmed.length > 2000) {
    throw new Error("Invalid note: note exceeds maximum length of 2000 characters");
  }

  // Basic sanitization: remove leading/trailing whitespace for storage
  // We keep the trimmed version
}

/**
 * Parsed task line information
 */
interface TaskLine {
  lineIndex: number;
  status: TaskStatus;
  content: string;
  hasNote: boolean;
}

/**
 * Plan task data structure
 */
interface PlanTask {
  planPath: string;
  lineIndex: number;
  status: TaskStatus;
  content: string;
  note?: string;
}

/**
 * Result of adding a note to a task
 */
interface AddNoteResult {
  planPath: string;
  taskIndex: number;
  taskLineIndex: number;
  addedNote: string;
  noteIndentation: string;
}

/**
 * Helper function to wrap errors with context
 * Provides consistent error handling across all operations
 */
function wrapError(error: unknown, context: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${context}: ${message}`);
}

/**
 * Task line parsing result
 */
interface ParsedTaskLine {
  indent: string; // Includes indentation AND any header prefix (e.g. "### ")
  bullet: string;
  checkbox: string;
  content: string;
  taskName: string;
  size: string | null;
  status: "pending" | "in-progress" | "completed";
}

/**
 * Regex pattern for parsing task lines
 * Groups: 1=indent/prefix, 2=bullet, 3=checkbox, 4=content
 * Supports optional header prefix (e.g. "### - [ ]")
 */
const TASK_LINE_PATTERN = /^(\s*(?:#+\s+)?)?([-*+])\s+(\[[ xX~]\])\s+(.*)$/;

/**
 * Parse a single task line and extract structured data.
 * Supports multiple bullet types (-, *, +) and all checkbox states.
 * Supports Markdown headers as task lines (e.g. "### - [ ] Task").
 * Extracts size info when present at end of content (e.g., "(3 points)").
 *
 * @param line - The task line to parse (must be a string)
 * @returns Parsed task information or null if line doesn't match task pattern or input is invalid
 */
function parseTaskLine(line: string): ParsedTaskLine | null {
  // Input validation: handle null, undefined, and non-string inputs
  if (typeof line !== "string") {
    return null;
  }

  // Handle empty strings early
  if (line.trim().length === 0) {
    return null;
  }

  const match = line.match(TASK_LINE_PATTERN);
  if (!match) {
    return null;
  }

  const [, indentOrPrefix, bullet, checkbox, content] = match;
  const indent = indentOrPrefix || ""; // Group 1 is optional

  // Determine status from checkbox
  let status: "pending" | "in-progress" | "completed";
  const checkboxContent = checkbox.trim();
  if (checkboxContent === "[ ]") {
    status = "pending";
  } else if (checkboxContent === "[~]") {
    status = "in-progress";
  } else if (checkboxContent === "[x]" || checkboxContent === "[X]") {
    status = "completed";
  } else {
    // This should not happen given the regex pattern
    status = "pending";
  }

  // Extract task name and size from content
  // Size is expected at the END of content with parentheses like "(1 point)" or "(3 pts)"
  const sizeMatch = content.match(/\((\d+)\s*(?:point|points|pt|pts)?\)\s*$/i);
  const size = sizeMatch ? sizeMatch[0] : null;

  const taskName = size ? content.replace(sizeMatch![0], "").trim() : content.trim();

  return {
    indent,
    bullet,
    checkbox,
    content,
    taskName,
    size,
    status,
  };
}

/**
 * Checkbox state mapping
 * Maps status strings to their checkbox representations
 */
const CHECKBOX_MAP: Record<"pending" | "in-progress" | "completed", string> = {
  "pending": "[ ]",
  "in-progress": "[~]",
  "completed": "[x]",
};

/**
 * Reconstruct a task line from parsed components with a new checkbox state.
 * Preserves all original formatting (indentation, bullet type, content).
 */
export function reconstructTaskLine(
  components: Pick<ParsedTaskLine, "indent" | "bullet" | "content">
,
  newStatus: "pending" | "in-progress" | "completed"
): string {
  // Validate newStatus
  if (!(newStatus in CHECKBOX_MAP)) {
    throw new Error(`Invalid status: ${newStatus}. Must be one of: pending, in-progress, completed`);
  }

  const newCheckbox = CHECKBOX_MAP[newStatus];

  // Reconstruct line: indent + bullet + " " + newCheckbox + " " + content
  return `${components.indent}${components.bullet} ${newCheckbox} ${components.content}`;
}

/**
 * Update the checkbox state of a task line while preserving all formatting.
 */
export function updateTaskCheckbox(
  line: string,
  newStatus: "pending" | "in-progress" | "completed"
): string | null {
  // Parse the line to extract components
  const parsed = parseTaskLine(line);

  // Return null for invalid lines (not matching task pattern)
  if (!parsed) {
    return null;
  }

  // Reconstruct the line with the new checkbox state
  try {
    return reconstructTaskLine(
      {
        indent: parsed.indent,
        bullet: parsed.bullet,
        content: parsed.content,
      },
      newStatus
    );
  } catch (error) {
    console.error('Failed to reconstruct task line:', error);
    return null;
  }
}

/**
 * Parse an entire plan file and extract all tasks
 */
async function parsePlanFile(planPath: string): Promise<Array<ParsedTaskLine & { lineIndex: number }>> {
  try {
    const content = await readFile(planPath, "utf-8");
    // Detect and preserve line endings (CRLF or LF) for consistency
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(lineEnding);

    const tasks: Array<ParsedTaskLine & { lineIndex: number }> = [];

    for (let i = 0; i < lines.length; i++) {
      const parsed = parseTaskLine(lines[i]);
      if (parsed) {
        tasks.push({
          ...parsed,
          lineIndex: i,
        });
      }
    }

    return tasks;
  } catch (error) {
    if (error instanceof Error && error.message.includes("ENOENT")) {
      throw new Error(`Plan file not found: ${planPath}`);
    }
    throw wrapError(error, "Failed to parse plan file");
  }
}

/**
 * Find task index by exact name match (not substring).
 */
export function findTaskIndex(
  taskName: string,
  tasks: Array<ParsedTaskLine & { lineIndex: number }>
): number {
  if (typeof taskName !== "string" || !Array.isArray(tasks)) {
    return -1;
  }

  const normalizedName = taskName.trim().toLowerCase();

  if (normalizedName.length === 0) {
    return -1;
  }

  for (let i = 0; i < tasks.length; i++) {
    const task = tasks[i];
    const normalizedTaskName = task.taskName.toLowerCase();
    if (normalizedTaskName === normalizedName) {
      return task.lineIndex;
    }
  }

  return -1;
}

/**
 * Find the first pending task
 */
export function findNextPendingTask(
  tasks: Array<ParsedTaskLine & { lineIndex: number }>
): (ParsedTaskLine & { lineIndex: number }) | null {
  if (!Array.isArray(tasks)) {
    return null;
  }

  for (const task of tasks) {
    if (task.status === "pending") {
      return task;
    }
  }

  return null;
}

/**
 * Find the first in-progress task
 */
export function findInProgressTask(
  tasks: Array<ParsedTaskLine & { lineIndex: number }>
): (ParsedTaskLine & { lineIndex: number }) | null {
  if (!Array.isArray(tasks)) {
    return null;
  }

  for (const task of tasks) {
    if (task.status === "in-progress") {
      return task;
    }
  }

  return null;
}

/**
 * Helper to extract note from the next line if it exists
 */
function getTaskNote(lines: string[], lineIndex: number): string | undefined {
  if (lineIndex + 1 >= lines.length) {
    return undefined;
  }
  const nextLine = lines[lineIndex + 1];
  // Note pattern: optional whitespace + bullet + ⚠️ NOTE: + content
  const noteMatch = nextLine.match(/^\s*[-*+]\s+⚠️\s+NOTE:\s+(.*)$/);
  return noteMatch ? noteMatch[1].trim() : undefined;
}

/**
 * Convert parsed status to TaskStatus enum
 */
function toTaskStatus(status: "pending" | "in-progress" | "completed"): TaskStatus {
  switch (status) {
    case "pending": return TaskStatus.TODO;
    case "in-progress": return TaskStatus.IN_PROGRESS;
    case "completed": return TaskStatus.DONE;
  }
}

/**
 * Get status of a single task from a plan file
 */
async function getSingleTaskStatus(planPath: string, taskIndex: number): Promise<PlanTask> {
  try {
    const content = await readFile(planPath, "utf-8");
    const lines = content.split(/\r?\n/); // Handle mixed line endings for reading

    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseTaskLine(lines[i]);
      if (parsed) {
        if (taskCount === taskIndex) {
          const note = getTaskNote(lines, i);
          return {
            planPath,
            lineIndex: i,
            status: toTaskStatus(parsed.status),
            content: parsed.content,
            note,
          };
        }
        taskCount++;
      }
    }

    throw new Error(`Task index ${taskIndex} not found in plan`);
  } catch (error) {
    throw wrapError(error, "Failed to get task status");
  }
}

/**
 * Mark a task as in-progress
 */
async function markInProgress(planPath: string, taskIndex: number): Promise<PlanTask> {
  try {
    const { writeFile } = await import("node:fs/promises");
    const content = await readFile(planPath, "utf-8");
    // Detect line endings to preserve them
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(lineEnding);

    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseTaskLine(lines[i]);
      if (parsed) {
        if (taskCount === taskIndex) {
          if (parsed.status === "in-progress") {
            throw new Error(`Task ${taskIndex} is already marked as in-progress`);
          }
          if (parsed.status === "completed") {
            throw new Error(`Cannot mark task ${taskIndex} as in-progress: it is already done`);
          }

          // Update the line
          const updatedLine = reconstructTaskLine(parsed, "in-progress");
          lines[i] = updatedLine;

          await writeFile(planPath, lines.join(lineEnding), "utf-8");

          const note = getTaskNote(lines, i);
          return {
            planPath,
            lineIndex: i,
            status: TaskStatus.IN_PROGRESS,
            content: parsed.content,
            note,
          };
        }
        taskCount++;
      }
    }

    throw new Error(`Task index ${taskIndex} not found in plan`);
  } catch (error) {
    throw wrapError(error, "Failed to mark task as in-progress");
  }
}

/**
 * Mark a task as completed
 */
async function markCompleted(planPath: string, taskIndex: number): Promise<PlanTask> {
  try {
    const { writeFile } = await import("node:fs/promises");
    const content = await readFile(planPath, "utf-8");
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(lineEnding);

    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const parsed = parseTaskLine(lines[i]);
      if (parsed) {
        if (taskCount === taskIndex) {
          if (parsed.status === "completed") {
            throw new Error(`Task ${taskIndex} is already marked as completed`);
          }

          const updatedLine = reconstructTaskLine(parsed, "completed");
          lines[i] = updatedLine;

          await writeFile(planPath, lines.join(lineEnding), "utf-8");

          const note = getTaskNote(lines, i);
          return {
            planPath,
            lineIndex: i,
            status: TaskStatus.DONE,
            content: parsed.content,
            note,
          };
        }
        taskCount++;
      }
    }

    throw new Error(`Task index ${taskIndex} not found in plan`);
  } catch (error) {
    throw wrapError(error, "Failed to mark task as completed");
  }
}

/**
 * Add a note to a task as a nested sub-item
 */
async function addNote(planPath: string, taskIndex: number, note: string): Promise<AddNoteResult> {
  try {
    validateNote(note);
    const trimmedNote = note.trim();

    const { writeFile } = await import("node:fs/promises");
    const content = await readFile(planPath, "utf-8");
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(lineEnding);

    let taskCount = 0;
    let taskLineIndex = -1;
    let noteIndent = "";

    for (let i = 0; i < lines.length; i++) {
      const parsed = parseTaskLine(lines[i]);
      if (parsed) {
        if (taskCount === taskIndex) {
          taskLineIndex = i;
          
          // Calculate note indentation
          // If task is a header (e.g. "### "), we want the note to be indented visually suitable.
          // We'll strip the '#' chars but keep the leading whitespace, and add 2 spaces.
          
          if (parsed.indent.includes("#")) {
             const leadSpaceMatch = parsed.indent.match(/^\s*/);
             const leadSpace = leadSpaceMatch ? leadSpaceMatch[0] : "";
             noteIndent = leadSpace + "  ";
          } else {
             // Normal list item, just indent 2 spaces deeper
             noteIndent = parsed.indent + "  ";
          }
          break;
        }
        taskCount++;
      }
    }

    if (taskLineIndex === -1) {
      throw new Error(`Task index ${taskIndex} not found in plan`);
    }

    const noteLine = `${noteIndent}- ⚠️ NOTE: ${trimmedNote}`;

    // Insert the note line after the task line
    lines.splice(taskLineIndex + 1, 0, noteLine);

    await writeFile(planPath, lines.join(lineEnding), "utf-8");

    return {
      planPath,
      taskIndex,
      taskLineIndex,
      addedNote: trimmedNote,
      noteIndentation: noteIndent,
    };
  } catch (error) {
    throw wrapError(error, "Failed to add note to task");
  }
}

/**
 * Get status of all tasks from a plan file
 */
async function getAllTaskStatus(
  planPath: string
): Promise<{
  planPath: string;
  tasks: Array<{ 
    lineIndex: number;
    status: "pending" | "in-progress" | "completed";
    content: string;
    taskName: string;
    size: string | null;
  }>;
}> {
  try {
    const tasks = await parsePlanFile(planPath);

    return {
      planPath,
      tasks: tasks.map((task) => ({
        lineIndex: task.lineIndex,
        status: task.status,
        content: task.content,
        taskName: task.taskName,
        size: task.size,
      })),
    };
  } catch (error) {
    throw wrapError(error, "Failed to get all task statuses");
  }
}

export default tool({
  description: "Read or modify task status in plan files. Operations include getting all task statuses, getting a single task status, marking tasks as in-progress, marking tasks as completed, or adding notes to tasks.",
  args: {
    operation: tool.schema.enum(["getAllTaskStatus", "getTaskStatus", "markInProgress", "markCompleted", "addNote"]).describe("Operation to perform on the task"),
    planName: tool.schema.string().optional().describe("Plan file name (without .opencode/plans/ prefix). If not provided, uses the most recent plan file."),
    taskIndex: tool.schema.number().describe("Zero-based index of the task within the plan (required for getTaskStatus, markInProgress, markCompleted, and addNote operations)"),
    note: tool.schema.string().optional().describe("Note text (required for addNote operation). Maximum 2000 characters."),
  },
  async execute({ operation, planName, taskIndex, note }) {
    if (operation !== "getAllTaskStatus") {
      validateTaskIndex(taskIndex);
    }

    if (operation === "addNote") {
      if (!note) {
        throw new Error("Note is required for addNote operation");
      }
      validateNote(note);
    }

    const planPath = await validateAndResolvePlanPath(planName);

    switch (operation) {
      case "getAllTaskStatus": {
        const result = await getAllTaskStatus(planPath);
        return JSON.stringify(result, null, 2);
      }

      case "getTaskStatus": {
        const task = await getSingleTaskStatus(planPath, taskIndex);
        return JSON.stringify(task, null, 2);
      }

      case "markInProgress": {
        const task = await markInProgress(planPath, taskIndex);
        return JSON.stringify(task, null, 2);
      }

      case "markCompleted": {
        const task = await markCompleted(planPath, taskIndex);
        return JSON.stringify(task, null, 2);
      }

      case "addNote": {
        const result = await addNote(planPath, taskIndex, note!);
        return JSON.stringify(result, null, 2);
      }

      default:
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});