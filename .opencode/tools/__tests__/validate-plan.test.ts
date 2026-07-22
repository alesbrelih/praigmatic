import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import validatePlan from "../validate-plan.js";

describe("validate-plan tool", () => {
  const originalCwd = process.cwd;
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "validate-plan-"));
    mkdirSync(join(rootDir, ".praigmatic", "plans"), { recursive: true });
    process.cwd = () => rootDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("accepts the canonical executable task contract", async () => {
    const planPath = join(rootDir, ".praigmatic", "plans", "valid.md");
    writeFileSync(
      planPath,
      `# Valid

## Purpose
Do valid things.

## Tasks
- [ ] **Task One** (Small)
  - Purpose: Ship task one
  - Acceptance: Task one is done
  - Steps:
    - Do the work
  - Files: src/task-one.ts
  - Dependencies: None
`,
      "utf-8",
    );

    const result = JSON.parse(
      await validatePlan.execute({ planPath: ".praigmatic/plans/valid.md" }),
    );

    expect(result.valid).toBe(true);
    expect(result.violations).toEqual([]);
  });

  it("rejects duplicate task names and unsupported metadata", async () => {
    const planPath = join(rootDir, ".praigmatic", "plans", "invalid.md");
    writeFileSync(
      planPath,
      `# Invalid

## Purpose
Break validation.

## Tasks
- [ ] **Repeat Me** (Small)
  - Purpose: First
  - Acceptance: First done
  - Steps:
    - One
  - Files: src/one.ts
  - Dependencies: None
  - Surprise: no thanks

- [ ] **Repeat Me** (Medium)
  - Purpose: Second
  - Acceptance: Second done
  - Steps:
    - Two
  - Files: src/two.ts
  - Dependencies: Repeat Me
`,
      "utf-8",
    );

    const result = JSON.parse(
      await validatePlan.execute({ planPath: ".praigmatic/plans/invalid.md" }),
    );

    expect(result.valid).toBe(false);
    expect(result.violations.join(" | ")).toContain('Duplicate task title "Repeat Me"');
    expect(result.violations.join(" | ")).toContain('unsupported field "Surprise"');
  });

  it("rejects tasks with unsupported sizes", async () => {
    const planPath = join(rootDir, ".praigmatic", "plans", "bad-size.md");
    writeFileSync(
      planPath,
      `# Invalid Size

## Purpose
Reject unsupported sizes.

## Tasks
- [ ] **Task One** (XL)
  - Purpose: Too big
  - Acceptance: Never valid
  - Steps:
    - Nope
  - Files: src/task.ts
  - Dependencies: None
`,
      "utf-8",
    );

    const result = JSON.parse(
      await validatePlan.execute({ planPath: ".praigmatic/plans/bad-size.md" }),
    );

    expect(result.valid).toBe(false);
    expect(result.violations.join(" | ")).toContain("Unexpected content in ## Tasks section");
  });
});
