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
 * Helper function to wrap errors with context
 * Provides consistent error handling across all operations
 */
function wrapError(error: unknown, context: string): Error {
  const message = error instanceof Error ? error.message : String(error);
  return new Error(`${context}: ${message}`);
}

/**
 * Parse task status from markdown checkbox pattern
 */
function parseTaskStatus(line: string): TaskStatus | null {
  const taskMatch = line.match(/^\s*-\s\[[xX~ ]\]\s/);
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
  const match = line.match(/^\s*-\s\[[xX~ ]\]\s*(.*)/);
  return match ? match[1].trim() : "";
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

export default tool({
  description: "Read or modify task status in plan files. Operations include getting task status or marking tasks as in-progress.",
  args: {
    operation: tool.schema.enum(["getTaskStatus", "markInProgress"]).describe("Operation to perform on the task"),
    planName: tool.schema.string().optional().describe("Plan file name (without .opencode/plans/ prefix). If not provided, uses the most recent plan file."),
    taskIndex: tool.schema.number().describe("Zero-based index of the task within the plan"),
  },
  async execute({ operation, planName, taskIndex }) {
    // Validate inputs
    validateTaskIndex(taskIndex);

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

      default:
        // TypeScript should prevent this, but for runtime safety
        throw new Error(`Unknown operation: ${operation}`);
    }
  },
});
