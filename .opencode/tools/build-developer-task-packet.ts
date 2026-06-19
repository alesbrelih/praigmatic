import { tool } from "@opencode-ai/plugin";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  selectTaskContext,
  type CompletedTaskExecution,
} from "./lib/implementation-context.js";
import { findTask, parsePlanContent } from "./lib/plan-workflow.js";

function parseCompletedTasks(value: string): CompletedTaskExecution[] {
  const parsed = JSON.parse(value) as unknown;

  if (!Array.isArray(parsed)) {
    throw new Error("completedTasksJson must be a JSON array");
  }

  return parsed.map((item) => {
    if (!item || typeof item !== "object") {
      throw new Error("Each completed task entry must be an object");
    }

    const candidate = item as Record<string, unknown>;
    if (typeof candidate.title !== "string" || !candidate.title.trim()) {
      throw new Error("Each completed task entry must include title");
    }

    return {
      title: candidate.title,
      filesModified: Array.isArray(candidate.filesModified)
        ? candidate.filesModified.filter(
            (file): file is string => typeof file === "string" && file.trim().length > 0,
          )
        : [],
      summary: typeof candidate.summary === "string" ? candidate.summary : "",
      discoveries: Array.isArray(candidate.discoveries)
        ? candidate.discoveries.filter(
            (entry): entry is string => typeof entry === "string" && entry.trim().length > 0,
          )
        : [],
    };
  });
}

export default tool({
  description:
    "Build a structured developer task packet from a validated plan task and completed-task execution state",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file"),
    taskName: tool.schema.string().describe("Exact task title from the plan"),
    completedTasksJson: tool.schema
      .string()
      .describe("JSON array of completed task execution summaries"),
  },
  async execute({ planPath, taskName, completedTasksJson }) {
    try {
      const absolutePath = resolve(process.cwd(), planPath);
      const content = await readFile(absolutePath, "utf-8");
      const plan = parsePlanContent(content, absolutePath);
      const task = findTask(plan, taskName);
      const completedTasks = parseCompletedTasks(completedTasksJson);

      return JSON.stringify(selectTaskContext(plan, task, completedTasks));
    } catch (error) {
      return JSON.stringify({
        error: `Failed to build developer task packet: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
