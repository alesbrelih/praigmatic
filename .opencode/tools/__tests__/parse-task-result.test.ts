import { describe, expect, it } from "vitest";
import parseTaskResult from "../parse-task-result.js";

describe("parse-task-result tool", () => {
  it("parses a valid structured developer result", async () => {
    const result = JSON.parse(
      await parseTaskResult.execute({
        output: `✅ **Task Completed:** Build parser

## Structured Result
\`\`\`json
{
  "status": "completed",
  "task_name": "Build parser",
  "files_modified": [
    { "path": ".opencode/tools/parse-plan.ts", "description": "Added parsing tool" }
  ],
  "discoveries": ["Existing workflow depends on markdown parsing"],
  "summary": "Implemented the parser",
  "scope_verification": {
    "files_match_specification": true,
    "changes_limited_to_task": true,
    "additional_out_of_scope_changes": []
  }
}
\`\`\`
`,
      }),
    );

    expect(result.status).toBe("completed");
    expect(result.task_name).toBe("Build parser");
    expect(result.files_modified[0].path).toBe(".opencode/tools/parse-plan.ts");
  });

  it("returns a structured error for malformed results", async () => {
    const result = JSON.parse(
      await parseTaskResult.execute({
        output: "✅ **Task Completed:** Missing block",
      }),
    );

    expect(result.error).toContain("Failed to parse developer result");
  });
});
