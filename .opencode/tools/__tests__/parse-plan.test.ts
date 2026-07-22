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

## Architecture Overview
The orchestrator coordinates execution while worker agents stay focused.

## Technical Decisions
- Use packet helpers instead of broad prompt assembly.

## Backwards Compatibility
**Required:** Yes | **Rationale:** Existing workflow users expect the current command shape.

## Security Considerations
Security-sensitive tasks still carry explicit constraints into prompts.

## Testing Strategy
- Unit: Packet helpers
- Integration: Command/template compatibility

## Tasks
- [ ] **Build parser** (Medium)
  - Purpose: Parse plan files safely
  - Acceptance: Returns structured plan data
  - Steps:
    - Add shared parser helper
    - Add parse-plan tool
  - Files: .opencode/tools/lib/plan-workflow.ts, .opencode/tools/parse-plan.ts
  - Dependencies: None
  - Context Tags: architecture, integration
  - Produces: plan-parser-json
  - Refs: TASK-1
  - Commit Notes: Implements the parsing contract

- [~] **Validate contract** (Small)
  - Purpose: Validate plan structure
  - Acceptance: Rejects malformed plans
  - Steps:
    - Add validate-plan tool
  - Files: .opencode/tools/validate-plan.ts
  - Dependencies: Build parser
  - Consumes: plan-parser-json

## QA Required
Run QA after implementation.
`;

describe("parse-plan tool", () => {
  const originalCwd = process.cwd;
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "parse-plan-"));
    mkdirSync(join(rootDir, ".praigmatic", "plans"), { recursive: true });
    process.cwd = () => rootDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("parses a valid plan into structured JSON", async () => {
    writeFileSync(join(rootDir, ".praigmatic", "plans", "workflow.md"), VALID_PLAN, "utf-8");

    const result = JSON.parse(await parsePlan.execute({ planName: "workflow.md" }));

    expect(result.title).toBe("Harden Workflow");
    expect(result.references).toEqual(["JIRA-123", "GH-9"]);
    expect(result.architectureOverview).toContain("orchestrator coordinates execution");
    expect(result.technicalDecisions).toContain("packet helpers");
    expect(result.backwardsCompatibility).toContain("Required:** Yes");
    expect(result.securityConsiderations).toContain("Security-sensitive tasks");
    expect(result.testingStrategy).toContain("Unit: Packet helpers");
    expect(result.qaRequired).toBe(true);
    expect(result.tasks).toHaveLength(2);
    expect(result.tasks[0]).toMatchObject({
      title: "Build parser",
      status: "pending",
      size: "Medium",
      contextTags: ["architecture", "integration"],
      produces: ["plan-parser-json"],
      refs: ["TASK-1"],
      commitNotes: "Implements the parsing contract",
    });
    expect(result.tasks[1]).toMatchObject({
      title: "Validate contract",
      status: "in_progress",
      size: "Small",
      dependencies: ["Build parser"],
      consumes: ["plan-parser-json"],
    });
  });

  it("returns structured violations when the plan is malformed", async () => {
    writeFileSync(
      join(rootDir, ".praigmatic", "plans", "broken.md"),
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

  it("rejects invalid context tag values", async () => {
    writeFileSync(
      join(rootDir, ".praigmatic", "plans", "invalid-tags.md"),
      `# Invalid Tags

## Purpose
Reject invalid metadata.

## Tasks
- [ ] **Bad task** (Small)
  - Purpose: Exercise validation
  - Acceptance: Validator rejects unsupported tags
  - Steps:
    - Run validation
  - Files: .opencode/tools/lib/plan-workflow.ts
  - Dependencies: None
  - Context Tags: architecture, risky
`,
      "utf-8",
    );

    const result = JSON.parse(await parsePlan.execute({ planName: "invalid-tags.md" }));

    expect(result.error).toBe("Plan validation failed");
    expect(result.violations.join(" | ")).toContain('invalid Context Tags entry "risky"');
  });

  it("keeps legacy plans without context metadata backward compatible", async () => {
    writeFileSync(
      join(rootDir, ".praigmatic", "plans", "legacy.md"),
      `# Legacy Plan

## Purpose
Support older plans.

## Tasks
- [ ] **Legacy task** (Small)
  - Purpose: Keep old format valid
  - Acceptance: Plan still parses
  - Steps:
    - Parse the plan
  - Files: README.md
  - Dependencies: None
`,
      "utf-8",
    );

    const result = JSON.parse(await parsePlan.execute({ planName: "legacy.md" }));

    expect(result.tasks[0]).toMatchObject({
      title: "Legacy task",
      contextTags: [],
      produces: [],
      consumes: [],
    });
  });
});
