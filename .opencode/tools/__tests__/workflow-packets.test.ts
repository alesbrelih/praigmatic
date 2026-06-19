import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import buildDeveloperTaskPacket from "../build-developer-task-packet.js";
import buildHolisticContextPacket from "../build-holistic-context-packet.js";
import buildRetryPacket from "../build-retry-packet.js";
import buildReviewPacket from "../build-review-packet.js";
import parseQaResult from "../parse-qa-result.js";

const PLAN_CONTENT = `# Packetized Workflow

## Purpose
Keep context passing explicit and deterministic.

## Architecture Overview
The orchestrator owns packet construction and workflow state.

## Technical Decisions
- Use task metadata to force context instead of broad inference.

## Backwards Compatibility
**Required:** Yes | **Rationale:** Existing plans should keep working.

## Security Considerations
Security-tagged work should carry explicit constraints into implementation.

## Testing Strategy
- Unit test packet tools

## Tasks
- [ ] **Define schema contract** (Medium)
  - Purpose: Define an interface payload used later in the workflow
  - Acceptance: The contract is documented for downstream consumers
  - Steps:
    - Add schema contract
  - Files: src/contracts/schema.ts
  - Dependencies: None
  - Context Tags: interface, architecture
  - Produces: schema-contract-v2

- [ ] **Wire downstream consumer** (Medium)
  - Purpose: Consume the new schema contract in the worker path
  - Acceptance: Downstream code points to the new schema
  - Steps:
    - Wire consumer
  - Files: src/worker/consumer.ts
  - Dependencies: None
  - Context Tags: integration
  - Consumes: schema-contract-v2

- [ ] **Rotate secret docs** (Small)
  - Purpose: Document a sensitive secret rotation workflow
  - Acceptance: Docs cover the secret rotation sequence
  - Steps:
    - Update runbook
  - Files: docs/runbooks/secrets.md
  - Dependencies: None
  - Context Tags: security, backwards_compat
`;

describe("workflow packet tools", () => {
  const originalCwd = process.cwd;
  let rootDir: string;
  let planPath: string;

  beforeEach(() => {
    rootDir = mkdtempSync(join(tmpdir(), "workflow-packets-"));
    mkdirSync(join(rootDir, ".opencode", "plans"), { recursive: true });
    planPath = join(rootDir, ".opencode", "plans", "workflow.md");
    writeFileSync(planPath, PLAN_CONTENT, "utf-8");
    process.cwd = () => rootDir;
  });

  afterEach(() => {
    process.cwd = originalCwd;
    rmSync(rootDir, { recursive: true, force: true });
  });

  it("builds a developer packet that honors explicit context tags", async () => {
    const result = JSON.parse(
      await buildDeveloperTaskPacket.execute({
        planPath: ".opencode/plans/workflow.md",
        taskName: "Rotate secret docs",
        completedTasksJson: "[]",
      }),
    );

    expect(result.kind).toBe("developer_task_packet");
    expect(result.flags.securitySensitive).toBe(true);
    expect(result.flags.backwardsCompatSensitive).toBe(true);
    expect(result.planContext.securityConsiderations).toContain("Security-tagged work");
    expect(result.planContext.backwardsCompatibility).toContain("Required:** Yes");
  });

  it("builds a review packet using produces and consumes metadata", async () => {
    const result = JSON.parse(
      await buildReviewPacket.execute({
        planPath: ".opencode/plans/workflow.md",
        taskName: "Define schema contract",
        stagedFiles: ["src/contracts/schema.ts"],
        reviewPass: 1,
      }),
    );

    expect(result.kind).toBe("review_packet");
    expect(result.relevantUpcomingTasks).toEqual([
      {
        title: "Wire downstream consumer",
        purpose: "Consume the new schema contract in the worker path",
      },
    ]);
    expect(result.recheckIssues).toEqual([]);
    expect(result.previousReviewSummary).toBeNull();
  });

  it("builds a re-review packet with explicit issues to re-check", async () => {
    const result = JSON.parse(
      await buildReviewPacket.execute({
        planPath: ".opencode/plans/workflow.md",
        taskName: "Define schema contract",
        stagedFiles: ["src/contracts/schema.ts"],
        reviewPass: 2,
        previousReviewJson: JSON.stringify({
          decision: "changes_required",
          highest_severity: "medium",
          summary: "Verify that the contract diff no longer drags unrelated prompt context.",
          issues: [
            {
              severity: "medium",
              title: "Prompt payload still too broad",
              summary: "The previous review found unrelated plan text in the packet.",
              recommendation: "Limit the review packet to task and dependency context.",
            },
          ],
        }),
      }),
    );

    expect(result.reviewPass).toBe(2);
    expect(result.previousReviewSummary).toContain("no longer drags unrelated prompt context");
    expect(result.recheckIssues).toEqual([
      {
        severity: "medium",
        title: "Prompt payload still too broad",
        summary: "The previous review found unrelated plan text in the packet.",
        recommendation: "Limit the review packet to task and dependency context.",
      },
    ]);
  });

  it("builds a compact retry packet from parsed review JSON", async () => {
    const result = JSON.parse(
      await buildRetryPacket.execute({
        parsedReviewJson: JSON.stringify({
          decision: "changes_required",
          highest_severity: "medium",
          summary: "Two issues remain.",
          issues: [
            {
              severity: "medium",
              title: "Trim prompt payload",
              summary: "The review packet still carries extra context.",
              recommendation: "Pass only the structured packet fields.",
            },
          ],
        }),
      }),
    );

    expect(result).toMatchObject({
      kind: "retry_packet",
      highestSeverity: "medium",
      summary: "Two issues remain.",
    });
    expect(result.issues).toHaveLength(1);
  });

  it("builds a holistic packet from accumulated execution state", async () => {
    const result = JSON.parse(
      await buildHolisticContextPacket.execute({
        planPath: ".opencode/plans/workflow.md",
        completedTasksJson: JSON.stringify([
          {
            title: "Define schema contract",
            filesModified: ["src/contracts/schema.ts"],
            summary: "Added the new schema contract.",
            discoveries: ["Downstream workers only need the schema identifier, not the full plan."],
          },
        ]),
      }),
    );

    expect(result.kind).toBe("holistic_context_packet");
    expect(result.completedTaskSummaries).toHaveLength(1);
    expect(result.planContext.testingStrategy).toContain("Unit test packet tools");
  });

  it("parses partial QA results into fixable and skipped issue sets", async () => {
    const result = JSON.parse(
      await parseQaResult.execute({
        output: `⚠️ **QA Partial:** Runtime validation

**Test Suite:** npx vitest — 10 passed, 1 failed | Failures: worker consumer integration
**Runtime Validation:** App startup: ✅ | Worker consumer: ❌ returned 500

**Issues Found:**
| # | Type | Effort | Severity | Description | Evidence |
|---|------|--------|----------|-------------|----------|
| 1 | New | — | Critical | Consumer returns 500 for the new schema | src/worker/consumer.ts |
| 2 | Preexisting | Large | Medium | Legacy admin endpoint still times out | src/admin/routes.ts |

**Issue Classification:** New = in Files Modified list.
**Summary:** 1/2 behaviors verified. 2 issues need attention.`,
      }),
    );

    expect(result.status).toBe("partial");
    expect(result.fixable_issues).toHaveLength(1);
    expect(result.skipped_issues).toHaveLength(1);
    expect(result.files_or_areas_implicated).toContain("src/worker/consumer.ts");
  });

  it("parses failed QA results into a retryable blocker packet", async () => {
    const result = JSON.parse(
      await parseQaResult.execute({
        output: `❌ **QA Failed:** Runtime validation
**Blocker:** App never becomes healthy | **Error:** ECONNREFUSED on /health
**Root Cause Assessment:** Startup wiring regression.`,
      }),
    );

    expect(result.status).toBe("failed");
    expect(result.fixable_issues).toEqual([
      expect.objectContaining({
        title: "QA blocker",
        summary: "App never becomes healthy",
      }),
    ]);
  });

  it("updates docs to reference packet-building tools and structured QA parsing", () => {
    const commandDoc = readFileSync(
      new URL("../../commands/pragmatic-implementation.md", import.meta.url),
      "utf-8",
    );
    const templateDoc = readFileSync(
      new URL("../../reference/implementation-templates.md", import.meta.url),
      "utf-8",
    );

    expect(commandDoc).toContain("build-developer-task-packet");
    expect(commandDoc).toContain("build-review-packet");
    expect(commandDoc).toContain("previousReviewJson");
    expect(commandDoc).toContain("build-retry-packet");
    expect(commandDoc).toContain("build-holistic-context-packet");
    expect(commandDoc).toContain("parse-qa-result");
    expect(commandDoc).toContain("render-developer-task-prompt");
    expect(commandDoc).toContain("render-code-review-prompt");
    expect(commandDoc).toContain("render-developer-retry-prompt");
    expect(commandDoc).toContain("render-developer-qa-fix-prompt");
    expect(templateDoc).toContain("Produced by: `render-developer-task-prompt");
    expect(templateDoc).toContain("Produced by: `render-code-review-prompt");
    expect(templateDoc).toContain("Produced by: `render-developer-retry-prompt");
    expect(templateDoc).toContain("Produced by: `render-developer-qa-fix-prompt");
    expect(templateDoc).toContain("fixable_issues");
    expect(templateDoc).toContain("files_or_areas_implicated");
    expect(templateDoc).toContain("Issues To Re-check");
  });
});
