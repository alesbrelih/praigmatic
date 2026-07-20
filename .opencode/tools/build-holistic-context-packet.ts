import { tool } from "@opencode-ai/plugin";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  buildHolisticContext,
  type CompletedTaskExecution,
} from "./lib/implementation-context.js";
import { parsePlanContent } from "./lib/plan-workflow.js";

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
    return {
      title: typeof candidate.title === "string" ? candidate.title : "",
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
    "Build a compressed holistic review packet from plan context and accumulated execution state",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file"),
    completedTasksJson: tool.schema
      .string()
      .describe("JSON array of completed task execution summaries"),
  },
  async execute({ planPath, completedTasksJson }, context) {
    try {
      const directory = context?.directory ?? process.cwd();
      const absolutePath = resolve(directory, planPath);
      const content = await readFile(absolutePath, "utf-8");
      const plan = parsePlanContent(content, absolutePath);
      const completedTasks = parseCompletedTasks(completedTasksJson);

      return JSON.stringify(buildHolisticContext(plan, completedTasks));
    } catch (error) {
      return JSON.stringify({
        error: `Failed to build holistic context packet: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
