import { tool } from "@opencode-ai/plugin";
import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  findTask,
  parsePlanContent,
  renderTaskBlock,
  replaceTaskInContent,
  uniqueList,
} from "./lib/plan-workflow.js";

type UpdateAction =
  | "mark_pending"
  | "mark_in_progress"
  | "mark_completed"
  | "annotate_execution"
  | "annotate_failure"
  | "annotate_blocked"
  | "annotate_review_failed"
  | "annotate_holistic_failed"
  | "annotate_qa_failed";

function appendWarning(existing: string[], nextWarning: string): string[] {
  return uniqueList([...existing.filter((line) => line !== nextWarning), nextWarning]);
}

export default tool({
  description: "Safely update task execution state and annotations inside a plan file",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file to update"),
    taskName: tool.schema.string().describe("Exact task title to update"),
    action: tool.schema
      .string()
      .describe("One of: mark_pending, mark_in_progress, mark_completed, annotate_execution, annotate_failure, annotate_blocked, annotate_review_failed, annotate_holistic_failed, annotate_qa_failed"),
    actualFiles: tool.schema.array(tool.schema.string()).optional().describe("Actual files modified for annotate_execution"),
    notes: tool.schema.string().optional().describe("Execution notes for annotate_execution"),
    summary: tool.schema.string().optional().describe("Summary text for failure/review annotations"),
    blocker: tool.schema.string().optional().describe("Blocker text for annotate_blocked"),
    requiredAction: tool.schema.string().optional().describe("Required action text for annotate_blocked"),
  },
  async execute({ planPath, taskName, action, actualFiles, notes, summary, blocker, requiredAction }) {
    try {
      const normalizedAction = action as UpdateAction;
      const absolutePath = resolve(process.cwd(), planPath);
      const content = await readFile(absolutePath, "utf-8");
      const plan = parsePlanContent(content, absolutePath);
      const task = findTask(plan, taskName);

      let nextBlock = renderTaskBlock(task);

      if (normalizedAction === "mark_pending") {
        nextBlock = renderTaskBlock(task, { status: "pending" });
      } else if (normalizedAction === "mark_in_progress") {
        nextBlock = renderTaskBlock(task, { status: "in_progress" });
      } else if (normalizedAction === "mark_completed") {
        nextBlock = renderTaskBlock(task, { status: "completed" });
      } else if (normalizedAction === "annotate_execution") {
        nextBlock = renderTaskBlock(task, {
          actualFiles: uniqueList(actualFiles ?? []),
          notes: notes?.trim() || undefined,
        });
      } else if (normalizedAction === "annotate_failure") {
        nextBlock = renderTaskBlock(task, {
          runtimeWarnings: appendWarning(task.runtimeWarnings, `⚠️ FAILED: ${summary?.trim() || "Unknown failure"}`),
        });
      } else if (normalizedAction === "annotate_blocked") {
        const warning = requiredAction?.trim()
          ? `⚠️ BLOCKED: ${blocker?.trim() || "Blocked"} — Required: ${requiredAction.trim()}`
          : `⚠️ BLOCKED: ${blocker?.trim() || "Blocked"}`;
        nextBlock = renderTaskBlock(task, {
          runtimeWarnings: appendWarning(task.runtimeWarnings, warning),
        });
      } else if (normalizedAction === "annotate_review_failed") {
        nextBlock = renderTaskBlock(task, {
          runtimeWarnings: appendWarning(
            task.runtimeWarnings,
            `⚠️ CODE_REVIEW_FAILED_AFTER_RETRIES: ${summary?.trim() || "Review issues remain"}`,
          ),
        });
      } else if (normalizedAction === "annotate_holistic_failed") {
        nextBlock = renderTaskBlock(task, {
          runtimeWarnings: appendWarning(
            task.runtimeWarnings,
            `⚠️ HOLISTIC_REVIEW_FAILED: ${summary?.trim() || "Holistic review issues remain"}`,
          ),
        });
      } else if (normalizedAction === "annotate_qa_failed") {
        nextBlock = renderTaskBlock(task, {
          runtimeWarnings: appendWarning(
            task.runtimeWarnings,
            `⚠️ QA_VALIDATION_FAILED: ${summary?.trim() || "QA validation issues remain"}`,
          ),
        });
      } else {
        return JSON.stringify({
          error: `Unsupported action: ${action}`,
        });
      }

      const updatedContent = replaceTaskInContent(content, task, nextBlock);
      await writeFile(absolutePath, updatedContent, "utf-8");
      const updatedPlan = parsePlanContent(updatedContent, absolutePath);
      const updatedTask = findTask(updatedPlan, taskName);

      return JSON.stringify({
        planPath: absolutePath,
        task: updatedTask,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Failed to update plan task: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
