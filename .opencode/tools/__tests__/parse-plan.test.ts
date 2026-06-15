import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import parsePlan from "../parse-plan.js";

const VALID_PLAN = `# Harden Workflow

## Purpose
Make the workflow safer and easier to execute.

## Metadata
**References:** JIRA-123, GH-9

## Tasks
- [ ] **Build parser** (Medium)
  - Purpose: Parse plan files safely
  - Acceptance: Returns structured plan data
  - Steps:
    - Add shared parser helper
    - Add parse-plan tool
  - Files: .opencode/tools/lib/plan-workflow.ts, .opencode/tools/parse-plan.ts
  - Dependencies: None
  - Refs: TASK-1
  - Commit Notes: Implements the parsing contract

- [~] **Validate contract** (Small)
  - Purpose: Validate plan structure
  - Acceptance: Rejects malformed plans
  - Steps:
    - Add validate-plan tool
  - Files: .opencode/tools/validate-plan.ts
  - Dependencies: Build parser

## QA Required
Run QA after implementation.
`;

describe("parse-plan tool", () => {
  const originalCwd = process.cwd;
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "parse-plan-"));
    mkdirSync(join(rootDir, ".opencode", "plans"), { recursive: true });
    process.cwd = () => rootDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("parses a valid plan into structured JSON", async () => {
    writeFileSync(join(rootDir, ".opencode", "plans", "workflow.md"), VALID_PLAN, "utf-8");

    const result = JSON.parse(await parsePlan.execute({ planName: "workflow.md" }));

    expect(result.title).toBe("Harden Workflow");
    expect(result.references).toEqual(["JIRA-123", "GH-9"]);
    expect(result.qaRequired).toBe(true);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toMatchObject({
      title: "Build parser",
      status: "pending",
      size: "Medium",
      refs: ["TASK-1"],
      commitNotes: "Implements the parsing contract",
    });
    expect(result.tasks[1]).toMatchObject({
      title: "Validate contract",
      status: "in_progress",
      size: "Small",
      dependencies: ["Build parser"],
    });
  });

  it("returns structured violations when the plan is malformed", async () => {
    writeFileSync(
      join(rootDir, ".opencode", "plans", "broken.md"),
      `# Broken

## Purpose
Bad plan

## Tasks
- [ ] **Missing fields** (Small)
  - Purpose: Oops
`,
      "utf-8",
    );

    const result = JSON.parse(await parsePlan.execute({ planName: "broken.md" }));

    expect(result.error).toBe("Plan validation failed");
    expect(result.violations.join(" | ")).toContain('missing required field "Acceptance"');
  });
});
