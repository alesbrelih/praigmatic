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
  indent: string;
  bullet: string;
  checkbox: string;
  content: string;
  taskName: string;
  size: string | null;
  status: "pending" | "in-progress" | "completed";
}

/**
 * Regex pattern for parsing task lines
 * Groups: 1=indent, 2=bullet, 3=checkbox, 4=content
 */
const TASK_LINE_PATTERN = /^(\s*)([-*+])\s+(\[[ xX~]\])\s+(.*)$/;

/**
 * Parse a single task line and extract structured data.
 * Supports multiple bullet types (-, *, +) and all checkbox states.
 * Extracts size info when present at end of content (e.g., "(3 points)").
 *
 * This function provides more comprehensive parsing than parseTaskStatus() which
 * only handles dash bullets and returns TaskStatus enum values.
 *
 * @param line - The task line to parse (must be a string)
 * @returns Parsed task information or null if line doesn't match task pattern or input is invalid
 * @example
 * parseTaskLine("  - [ ] Implement feature (3 points)");
 * // Returns:
 * // {
 * //   indent: "  ",
 * //   bullet: "-",
 * //   checkbox: "[ ]",
 * //   content: "Implement feature (3 points)",
 * //   taskName: "Implement feature",
 * //   size: "(3 points)",
 * //   status: "pending"
 * // }
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

  const [, indent, bullet, checkbox, content] = match;

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
  // The regex is defensive: only captures if the number and optional "point(s)" appear together
  const sizeMatch = content.match(/\((\d+)\s*(?:point|points|pt|pts)?\)\s*$/i);
  const size = sizeMatch ? sizeMatch[0] : null;

  // Extract task name by removing size if present, otherwise use trimmed content
  // Note: This may not handle all edge cases (e.g., multiple parentheticals)
  // The size extraction is best-effort and expects the size to be the last parenthetical
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
 * Parse an entire plan file and extract all tasks
 * @param planPath - Path to the plan file
 * @returns Array of parsed task lines with their line indices
 * @throws {Error} If file cannot be read
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
 * Performs case-insensitive matching and normalizes whitespace.
 *
 * @param taskName - The task name to search for (trimmed before comparison)
 * @param tasks - Array of parsed task lines with line indices
 * @returns Line index of the task, or -1 if not found
 */
export function findTaskIndex(
  taskName: string,
  tasks: Array<ParsedTaskLine & { lineIndex: number }>
): number {
  // Validate input
  if (typeof taskName !== "string" || !Array.isArray(tasks)) {
    return -1;
  }

  // Normalize the search task name (trim and lowercase)
  const normalizedName = taskName.trim().toLowerCase();

  // Handle empty task name
  if (normalizedName.length === 0) {
    return -1;
  }

  // Search for exact match (not substring)
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
 * Find the first pending task (status: "pending").
 * Scans from the beginning of the tasks array.
 *
 * @param tasks - Array of parsed task lines with line indices
 * @returns First pending task object or null if none found
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
 * Find the first in-progress task (status: "in-progress").
 * Enables resume capability for interrupted work.
 * Scans from the beginning of the tasks array.
 *
 * @param tasks - Array of parsed task lines with line indices
 * @returns First in-progress task object or null if none found
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
 * Parse task status from markdown checkbox pattern.
 * Lightweight function for dash-only tasks, returns TaskStatus enum values.
 * For comprehensive parsing (multiple bullets, size extraction), use parseTaskLine().
 *
 * @param line - The task line to parse
 * @returns TaskStatus enum value or null if line doesn't match pattern
 */
function parseTaskStatus(line: string): TaskStatus | null {
  const taskMatch = line.match(/^\s*-\s\[([xX~ ])\]\s/);
  if (!taskMatch) {
    return null;
  }

  const statusChar = taskMatch[1];
  if (statusChar === " ") {
    return TaskStatus.TODO;
  } else if (statusChar === "~") {
    return TaskStatus.IN_PROGRESS;
  } else {
    return TaskStatus.DONE;
  }
}

/**
 * Extract task content from markdown line
 */
function parseTaskContent(line: string): string {
  const match = line.match(/^\s*-\s\[([xX~ ])\]\s*(.*)/);
  return match ? match[2].trim() : "";
}

/**
 * Check if task line has a note
 */
function hasTaskNote(line: string): boolean {
  return line.includes("<!-- Note:");
}

/**
 * Extract note content from task line
 */
function extractTaskNote(line: string): string | undefined {
  const match = line.match(/<!--\s*Note:\s*(.*?)\s*-->/);
  return match ? match[1].trim() : undefined;
}

/**
 * Get task status from a plan file
 */
async function getTaskStatus(planPath: string, taskIndex: number): Promise<PlanTask> {
  try {
    const content = await readFile(planPath, "utf-8");
    const lines = content.split("\n");

    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const status = parseTaskStatus(lines[i]);
      if (status !== null) {
        if (taskCount === taskIndex) {
          const content = parseTaskContent(lines[i]);
          const note = hasTaskNote(lines[i]) ? extractTaskNote(lines[i]) : undefined;

          return {
            planPath,
            lineIndex: i,
            status,
            content,
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
 * @throws {Error} If task doesn't exist or is already in progress/done
 */
async function markInProgress(planPath: string, taskIndex: number): Promise<PlanTask> {
  try {
    const { writeFile } = await import("node:fs/promises");
    const content = await readFile(planPath, "utf-8");
    const lines = content.split("\n");

    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const status = parseTaskStatus(lines[i]);
      if (status !== null) {
        if (taskCount === taskIndex) {
          // Check if task is already in progress or done
          if (status === TaskStatus.IN_PROGRESS) {
            throw new Error(`Task ${taskIndex} is already marked as in-progress`);
          }
          if (status === TaskStatus.DONE) {
            throw new Error(`Cannot mark task ${taskIndex} as in-progress: it is already done`);
          }

          // Replace `- [ ]` with `- [~]` preserving indentation
          const updatedLine = lines[i].replace(/^(\s*-\s\[)\s(\])/, "$1~$2");
          lines[i] = updatedLine;

          // Write the modified content back to the file
          await writeFile(planPath, lines.join("\n"), "utf-8");

          // Return the updated task information
          const taskContent = parseTaskContent(lines[i]);
          const note = hasTaskNote(lines[i]) ? extractTaskNote(lines[i]) : undefined;

          return {
            planPath,
            lineIndex: i,
            status: TaskStatus.IN_PROGRESS,
            content: taskContent,
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
 * @throws {Error} If task doesn't exist or is already done
 */
async function markCompleted(planPath: string, taskIndex: number): Promise<PlanTask> {
  try {
    const { writeFile } = await import("node:fs/promises");
    const content = await readFile(planPath, "utf-8");
    const lines = content.split("\n");

    let taskCount = 0;
    for (let i = 0; i < lines.length; i++) {
      const status = parseTaskStatus(lines[i]);
      if (status !== null) {
        if (taskCount === taskIndex) {
          // Check if task is already done
          if (status === TaskStatus.DONE) {
            throw new Error(`Task ${taskIndex} is already marked as completed`);
          }

          // Replace `- [ ]` or `- [~]` with `- [x]` preserving indentation
          const updatedLine = lines[i].replace(/^(\s*-\s\[)[ ~xX](\])/, "$1x$2");
          lines[i] = updatedLine;

          // Write the modified content back to the file
          await writeFile(planPath, lines.join("\n"), "utf-8");

          // Return the updated task information
          const taskContent = parseTaskContent(lines[i]);
          const note = hasTaskNote(lines[i]) ? extractTaskNote(lines[i]) : undefined;

          return {
            planPath,
            lineIndex: i,
            status: TaskStatus.DONE,
            content: taskContent,
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
 * @throws {Error} If task doesn't exist
 */
async function addNote(planPath: string, taskIndex: number, note: string): Promise<AddNoteResult> {
  try {
    // Validate the note
    validateNote(note);
    const trimmedNote = note.trim();

    const { writeFile } = await import("node:fs/promises");
    const content = await readFile(planPath, "utf-8");
    // Detect line endings to preserve them (CRLF or LF)
    const lineEnding = content.includes("\r\n") ? "\r\n" : "\n";
    const lines = content.split(lineEnding);

    let taskCount = 0;
    let taskLineIndex = -1;
    let taskIndentation = "";

    // First pass: find the task and determine its indentation
    for (let i = 0; i < lines.length; i++) {
      const status = parseTaskStatus(lines[i]);
      if (status !== null) {
        if (taskCount === taskIndex) {
          taskLineIndex = i;
          // Extract indentation (leading whitespace before the dash)
          const indentMatch = lines[i].match(/^(\s*)/);
          taskIndentation = indentMatch ? indentMatch[1] : "";
          break;
        }
        taskCount++;
      }
    }

    if (taskLineIndex === -1) {
      throw new Error(`Task index ${taskIndex} not found in plan`);
    }

    // Calculate indentation for the note (one level deeper than the task)
    // We add two more spaces for the nested level
    const noteIndentation = taskIndentation + "  ";
    const noteLine = `${noteIndentation}- ⚠️ NOTE: ${trimmedNote}`;

    // Insert the note line after the task line
    lines.splice(taskLineIndex + 1, 0, noteLine);

    // Write the modified content back to the file, preserving original line endings
    await writeFile(planPath, lines.join(lineEnding), "utf-8");

    // Return the result of the addNote operation
    return {
      planPath,
      taskIndex,
      taskLineIndex,
      addedNote: trimmedNote,
      noteIndentation,
    };
  } catch (error) {
    throw wrapError(error, "Failed to add note to task");
  }
}

export default tool({
  description: "Read or modify task status in plan files. Operations include getting task status, marking tasks as in-progress, marking tasks as completed, or adding notes to tasks.",
  args: {
    operation: tool.schema.enum(["getTaskStatus", "markInProgress", "markCompleted", "addNote"]).describe("Operation to perform on the task"),
    planName: tool.schema.string().optional().describe("Plan file name (without .opencode/plans/ prefix). If not provided, uses the most recent plan file."),
    taskIndex: tool.schema.number().describe("Zero-based index of the task within the plan"),
    note: tool.schema.string().optional().describe("Note text (required for addNote operation). Maximum 2000 characters."),
  },
  async execute({ operation, planName, taskIndex, note }) {
    // Validate inputs
    validateTaskIndex(taskIndex);

    // Validate note for addNote operation
    if (operation === "addNote") {
      if (!note) {
        throw new Error("Note is required for addNote operation");
      }
      validateNote(note);
    }

    // Resolve and validate plan path
    const planPath = await validateAndResolvePlanPath(planName);

    // Execute the requested operation
    switch (operation) {
      case "getTaskStatus": {
        const task = await getTaskStatus(planPath, taskIndex);
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
        // TypeScript should prevent this, but for runtime safety
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});
