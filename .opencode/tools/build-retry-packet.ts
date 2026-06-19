import { tool } from "@opencode-ai/plugin";
import { buildRetryIssuePacket } from "./lib/implementation-context.js";

type ParsedReview = {
  summary: string;
  highest_severity: "none" | "low" | "medium" | "high" | "critical";
  issues: Array<{
    severity: "none" | "low" | "medium" | "high" | "critical";
    title: string;
    summary: string;
    recommendation: string;
  }>;
};

function parseReview(value: string): ParsedReview {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("parsedReviewJson must be a JSON object");
  }

  const candidate = parsed as Record<string, unknown>;
  if (typeof candidate.summary !== "string") {
    throw new Error("parsedReviewJson is missing summary");
  }
  if (typeof candidate.highest_severity !== "string") {
    throw new Error("parsedReviewJson is missing highest_severity");
  }
  if (!Array.isArray(candidate.issues)) {
    throw new Error("parsedReviewJson is missing issues array");
  }

  return {
    summary: candidate.summary,
    highest_severity: candidate.highest_severity as ParsedReview["highest_severity"],
    issues: candidate.issues.map((issue) => {
      if (!issue || typeof issue !== "object") {
        throw new Error("Each review issue must be an object");
      }

      const reviewIssue = issue as Record<string, unknown>;
      if (
        typeof reviewIssue.severity !== "string" ||
        typeof reviewIssue.title !== "string"
      ) {
        throw new Error("Each review issue must include severity and title");
      }

      return {
        severity: reviewIssue.severity as ParsedReview["issues"][number]["severity"],
        title: reviewIssue.title,
        summary: typeof reviewIssue.summary === "string" ? reviewIssue.summary : "",
        recommendation:
          typeof reviewIssue.recommendation === "string"
            ? reviewIssue.recommendation
            : "",
      };
    }),
  };
}

export default tool({
  description: "Build a compact structured retry packet from a parsed review result",
  args: {
    parsedReviewJson: tool.schema
      .string()
      .describe("Structured JSON returned by parse-review-result"),
  },
  async execute({ parsedReviewJson }) {
    try {
      return JSON.stringify(buildRetryIssuePacket(parseReview(parsedReviewJson)));
    } catch (error) {
      return JSON.stringify({
        error: `Failed to build retry packet: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
