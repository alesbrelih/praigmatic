import { tool } from "@opencode-ai/plugin";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  selectReviewContext,
  type RetryIssue,
} from "./lib/implementation-context.js";
import { findTask, parsePlanContent } from "./lib/plan-workflow.js";

function parsePreviousReview(
  value?: string,
): { summary: string; issues: RetryIssue[] } | undefined {
  if (!value) return undefined;

  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("previousReviewJson must be a JSON object");
  }

  const candidate = parsed as Record<string, unknown>;
  const rawIssues = candidate.issues;
  if (!Array.isArray(rawIssues)) {
    throw new Error("previousReviewJson must include an issues array");
  }

  const issues = rawIssues.map((issue) => {
    if (!issue || typeof issue !== "object") {
      throw new Error("Each previous review issue must be an object");
    }

    const reviewIssue = issue as Record<string, unknown>;
    if (
      typeof reviewIssue.severity !== "string" ||
      typeof reviewIssue.title !== "string"
    ) {
      throw new Error("Each previous review issue must include severity and title");
    }

    return {
      severity: reviewIssue.severity as RetryIssue["severity"],
      title: reviewIssue.title,
      summary: typeof reviewIssue.summary === "string" ? reviewIssue.summary : "",
      recommendation:
        typeof reviewIssue.recommendation === "string"
          ? reviewIssue.recommendation
          : "",
    };
  });

  const summarySource =
    typeof candidate.summary === "string"
      ? candidate.summary
      : typeof candidate.highestSeverity === "string"
        ? `Re-review focus: ${candidate.highestSeverity} issues from previous pass`
        : "";

  return {
    summary: summarySource,
    issues,
  };
}

export default tool({
  description:
    "Build a structured review packet for the current task, staged files, and review pass",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file"),
    taskName: tool.schema.string().describe("Exact task title from the plan"),
    stagedFiles: tool.schema
      .array(tool.schema.string())
      .describe("Exact list of staged files for the current review"),
    reviewPass: tool.schema.number().describe("Current review pass number"),
    previousReviewJson: tool.schema
      .string()
      .optional()
      .describe("Optional parsed prior review result or retry packet JSON for re-review"),
  },
  async execute({ planPath, taskName, stagedFiles, reviewPass, previousReviewJson }, context) {
    try {
      const directory = context?.directory ?? process.cwd();
      const absolutePath = resolve(directory, planPath);
      const content = await readFile(absolutePath, "utf-8");
      const plan = parsePlanContent(content, absolutePath);
      const task = findTask(plan, taskName);
      const previousReview = parsePreviousReview(previousReviewJson);

      return JSON.stringify(
        selectReviewContext(plan, task, stagedFiles, reviewPass, previousReview),
      );
    } catch (error) {
      return JSON.stringify({
        error: `Failed to build review packet: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
