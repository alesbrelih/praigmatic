import { tool } from "@opencode-ai/plugin";

const ALLOWED_DECISIONS = new Set(["approved", "changes_required"]);
const ALLOWED_SEVERITIES = new Set(["none", "low", "medium", "high", "critical"]);

function extractStructuredJson(output: string): unknown {
  const markerMatch = output.match(/## Structured Result\s*```json\s*([\s\S]*?)```/i);
  const fallbackMatch = output.match(/```json\s*([\s\S]*?)```/i);
  const payload = markerMatch?.[1] ?? fallbackMatch?.[1];

  if (!payload) {
    throw new Error("No structured JSON result block found");
  }

  return JSON.parse(payload);
}

export default tool({
  description: "Parse and validate the structured result block returned by reviewer agents",
  args: {
    output: tool.schema.string().describe("Full reviewer agent output"),
  },
  async execute({ output }) {
    try {
      const parsed = extractStructuredJson(output) as Record<string, unknown>;
      const decision = parsed.decision;
      const highestSeverity = parsed.highest_severity;
      const issues = parsed.issues;

      if (typeof decision !== "string" || !ALLOWED_DECISIONS.has(decision)) {
        throw new Error("Structured review result is missing a valid decision");
      }
      if (
        typeof highestSeverity !== "string" ||
        !ALLOWED_SEVERITIES.has(highestSeverity)
      ) {
        throw new Error("Structured review result is missing a valid highest_severity");
      }
      if (!Array.isArray(issues)) {
        throw new Error("Structured review result is missing issues array");
      }

      const normalizedIssues = issues.map((issue) => {
        if (!issue || typeof issue !== "object") {
          throw new Error("Each issue must be an object");
        }
        const candidate = issue as Record<string, unknown>;
        if (
          typeof candidate.severity !== "string" ||
          !ALLOWED_SEVERITIES.has(candidate.severity)
        ) {
          throw new Error("Each issue must include a valid severity");
        }
        if (typeof candidate.title !== "string" || !candidate.title) {
          throw new Error("Each issue must include a title");
        }
        return {
          severity: candidate.severity,
          title: candidate.title,
          summary: typeof candidate.summary === "string" ? candidate.summary : "",
          recommendation:
            typeof candidate.recommendation === "string"
              ? candidate.recommendation
              : "",
        };
      });

      return JSON.stringify({
        decision,
        highest_severity: highestSeverity,
        summary: typeof parsed.summary === "string" ? parsed.summary : "",
        issues: normalizedIssues,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Failed to parse review result: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
