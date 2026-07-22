import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import updatePlanTask from "../update-plan-task.js";

const PLAN_CONTENT = `# Workflow

## Purpose
Exercise plan mutations.

## Tasks
- [ ] **Task One** (Small)
  - Purpose: Do task one
  - Acceptance: Task one is done
  - Steps:
    - Implement task one
  - Files: src/task-one.ts
  - Dependencies: None
`;

describe("update-plan-task tool", () => {
  const originalCwd = process.cwd;
  let rootDir: string;
  let planPath: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "update-plan-task-"));
    mkdirSync(join(rootDir, ".praigmatic", "plans"), { recursive: true });
    planPath = join(rootDir, ".praigmatic", "plans", "workflow.md");
    writeFileSync(planPath, PLAN_CONTENT, "utf-8");
    process.cwd = () => rootDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("transitions task status and annotates execution details", async () => {
    await updatePlanTask.execute({
      planPath: ".praigmatic/plans/workflow.md",
      taskName: "Task One",
      action: "mark_in_progress",
    });
    await updatePlanTask.execute({
      planPath: ".praigmatic/plans/workflow.md",
      taskName: "Task One",
      action: "annotate_execution",
      actualFiles: ["src/task-one.ts", "src/helper.ts"],
      notes: "Implemented the task cleanly",
    });
    await updatePlanTask.execute({
      planPath: ".praigmatic/plans/workflow.md",
      taskName: "Task One",
      action: "mark_completed",
    });

    const content = readFileSync(planPath, "utf-8");
    expect(content).toContain("- [x] **Task One** (Small)");
    expect(content).toContain("  - Actual Files: src/task-one.ts, src/helper.ts");
    expect(content).toContain("  - Notes: Implemented the task cleanly");
  });

  it("adds runtime warnings for blocked and review-failed states", async () => {
    await updatePlanTask.execute({
      planPath: ".praigmatic/plans/workflow.md",
      taskName: "Task One",
      action: "annotate_blocked",
      blocker: "Missing dependency",
      requiredAction: "Install the package",
    });
    await updatePlanTask.execute({
      planPath: ".praigmatic/plans/workflow.md",
      taskName: "Task One",
      action: "annotate_review_failed",
      summary: "Reviewer still found medium issues",
    });

    const content = readFileSync(planPath, "utf-8");
    expect(content).toContain("⚠️ BLOCKED: Missing dependency — Required: Install the package");
    expect(content).toContain("⚠️ CODE_REVIEW_FAILED_AFTER_RETRIES: Reviewer still found medium issues");
  });
});
