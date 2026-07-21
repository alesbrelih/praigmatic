import { tool } from "@opencode-ai/plugin";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { findTask, parsePlanContent, uniqueList } from "./lib/plan-workflow.js";

export default tool({
  description: "Resolve commit refs and notes from plan-level and task-level metadata",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file"),
    taskName: tool.schema.string().optional().describe("Task title for task-scoped metadata extraction"),
    kind: tool.schema
      .string()
      .optional()
      .describe("Commit kind: task, holistic_fix, qa_fix, kg_update, archive. Defaults to task."),
  },
  async execute({ planPath, taskName, kind }, context) {
    try {
      const commitKind = kind ?? "task";
      const directory = context?.directory ?? process.cwd();
      const absolutePath = resolve(directory, planPath);
      const content = await readFile(absolutePath, "utf-8");
      const plan = parsePlanContent(content, absolutePath);

      const baseRefs = [...plan.references];
      let body: string | undefined;

      if (commitKind === "task") {
        if (!taskName) {
          return JSON.stringify({
            error: "taskName is required when kind is task",
          });
        }

        const task = findTask(plan, taskName);
        const refs = uniqueList([...baseRefs, ...task.refs]);
        body = task.commitNotes;

        return JSON.stringify({
          kind: commitKind,
          refs,
          refsText: refs.length > 0 ? refs.join(", ") : null,
          body: body ?? null,
        });
      }

      const refs = uniqueList(baseRefs);
      return JSON.stringify({
        kind: commitKind,
        refs,
        refsText: refs.length > 0 ? refs.join(", ") : null,
        body: null,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Failed to extract commit metadata: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
