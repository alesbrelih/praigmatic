import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import extractCommitMetadata from "../extract-commit-metadata.js";

const PLAN_WITH_METADATA = `# Workflow

## Purpose
Exercise commit metadata extraction.

## Metadata
**References:** JIRA-10, GH-2

## Tasks
- [ ] **Task One** (Small)
  - Purpose: Do task one
  - Acceptance: Task one is done
  - Steps:
    - Implement task one
  - Files: src/task-one.ts
  - Dependencies: None
  - Refs: TASK-1, GH-2
  - Commit Notes: Add task-specific body
`;

describe("extract-commit-metadata tool", () => {
  const originalCwd = process.cwd;
  let rootDir: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "extract-commit-metadata-"));
    mkdirSync(join(rootDir, ".opencode", "plans"), { recursive: true });
    writeFileSync(join(rootDir, ".opencode", "plans", "workflow.md"), PLAN_WITH_METADATA, "utf-8");
    process.cwd = () => rootDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("merges plan-level and task-level refs for task commits", async () => {
    const result = JSON.parse(
      await extractCommitMetadata.execute({
        planPath: ".opencode/plans/workflow.md",
        taskName: "Task One",
        kind: "task",
      }),
    );

    expect(result.refs).toEqual(["JIRA-10", "GH-2", "TASK-1"]);
    expect(result.refsText).toBe("JIRA-10, GH-2, TASK-1");
    expect(result.body).toBe("Add task-specific body");
  });

  it("uses only plan-level refs for archive commits", async () => {
    const result = JSON.parse(
      await extractCommitMetadata.execute({
        planPath: ".opencode/plans/workflow.md",
        kind: "archive",
      }),
    );

    expect(result.refs).toEqual(["JIRA-10", "GH-2"]);
    expect(result.body).toBeNull();
  });
});
