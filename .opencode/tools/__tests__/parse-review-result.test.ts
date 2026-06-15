import { describe, expect, it } from "vitest";
import parseReviewResult from "../parse-review-result.js";

describe("parse-review-result tool", () => {
  it("parses a valid structured reviewer result", async () => {
    const result = JSON.parse(
      await parseReviewResult.execute({
        output: `## Code Review: Parser

## Structured Result
\`\`\`json
{
  "decision": "changes_required",
  "highest_severity": "medium",
  "summary": "One medium issue remains",
  "issues": [
    {
      "severity": "medium",
      "title": "Missing tests",
      "summary": "Parser lacks malformed-case coverage",
      "recommendation": "Add invalid plan tests"
    }
  ]
}
\`\`\`
`,
      }),
    );

    expect(result.decision).toBe("changes_required");
    expect(result.highest_severity).toBe("medium");
    expect(result.issues[0].title).toBe("Missing tests");
  });

  it("returns a structured error for invalid review output", async () => {
    const result = JSON.parse(
      await parseReviewResult.execute({
        output: "## Code Review\nNo structured block",
      }),
    );

    expect(result.error).toContain("Failed to parse review result");
  });
});
