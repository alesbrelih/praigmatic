import { describe, expect, it } from "vitest";
import renderCodeReviewPrompt from "../render-code-review-prompt.js";
import renderDeveloperQaFixPrompt from "../render-developer-qa-fix-prompt.js";
import renderDeveloperRetryPrompt from "../render-developer-retry-prompt.js";
import renderDeveloperTaskPrompt from "../render-developer-task-prompt.js";

const minimalDeveloperTaskPacket = {
  kind: "developer_task_packet",
  taskName: "Add pilot overlay",
  purpose: "Add the pilot values overlay.",
  steps: ["Create overlay file", "Wire it into Helmfile"],
  acceptance: "Pilot rendering uses the new overlay.",
  files: ["deploy/pilot/values.yaml", "helmfile.yaml"],
  dependencies: [],
  dependencyContext: [],
  otherCompletedSummary: null,
  relevantDiscoveries: [],
  planContext: {},
  flags: {
    architectureSensitive: false,
    dependencySensitive: false,
    backwardsCompatSensitive: false,
    securitySensitive: false,
    interfaceSensitive: false,
  },
};

const richerDeveloperTaskPacket = {
  ...minimalDeveloperTaskPacket,
  dependencies: ["Add release bundle metadata"],
  dependencyContext: [
    {
      title: "Add release bundle metadata",
      filesModified: ["release/bundle.json"],
      summary: "Added bundle metadata for pinned pilot images.",
      discoveries: ["Bundle versions must stay explicit for reproducible deploys."],
    },
  ],
  otherCompletedSummary: "Other completed work: Update docs",
  relevantDiscoveries: ["Values overlays should not default to mutable image tags."],
  planContext: {
    architectureOverview: "The orchestrator assembles packets before subagent invocation.",
    technicalDecisions: "- Keep packet builders and renderers separate.",
    backwardsCompatibility: "**Required:** Yes",
    securityConsiderations: "Secrets and auth paths require explicit review.",
  },
};

const firstPassReviewPacket = {
  kind: "review_packet",
  taskName: "Add pilot overlay",
  purpose: "Add the pilot values overlay.",
  steps: ["Create overlay file", "Wire it into Helmfile"],
  acceptance: "Pilot rendering uses the new overlay.",
  files: ["deploy/pilot/values.yaml", "helmfile.yaml"],
  dependencies: [],
  dependents: [],
  stagedFiles: ["deploy/pilot/values.yaml", "helmfile.yaml"],
  reviewPass: 1,
  previousReviewSummary: null,
  recheckIssues: [],
  relevantUpcomingTasks: [],
  planContext: {},
  flags: {
    architectureSensitive: false,
    dependencySensitive: false,
    backwardsCompatSensitive: false,
    securitySensitive: false,
    interfaceSensitive: false,
  },
};

const reReviewPacket = {
  ...firstPassReviewPacket,
  reviewPass: 2,
  previousReviewSummary: "Verify that mutable image defaults were removed.",
  recheckIssues: [
    {
      severity: "medium",
      title: "Mutable latest tags in pilot image defaults",
      summary: "latest tags still allow drift from the release bundle.",
      recommendation: "Pin the default image tags to the bundle version.",
    },
  ],
  dependents: [{ title: "Publish pilot release notes", purpose: "Document pilot deploy defaults." }],
  relevantUpcomingTasks: [{ title: "Publish pilot release notes", purpose: "Document pilot deploy defaults." }],
  planContext: {
    technicalDecisions: "- Default all deployable pilot images to pinned bundle tags.",
  },
};

const retryPacket = {
  kind: "retry_packet",
  summary: "One review issue remains.",
  highestSeverity: "medium",
  issues: [
    {
      severity: "medium",
      title: "Mutable latest tags in pilot image defaults",
      summary: "latest tags still allow drift from the release bundle.",
      recommendation: "Pin the default image tags to the bundle version.",
    },
  ],
};

const qaRetryPacket = {
  kind: "qa_retry_packet",
  status: "failed",
  summary: "Pilot startup fails because the image tag is missing.",
  fixable_issues: [
    {
      title: "QA blocker",
      summary: "Pilot container crashes on startup.",
      recommendation: "Set an explicit pilot image tag.",
      type: "new",
    },
  ],
  skipped_issues: [
    {
      title: "Legacy dashboard timeout",
      summary: "The old admin dashboard still times out.",
      recommendation: "Leave this for separate cleanup.",
      type: "preexisting",
      effort: "large",
    },
  ],
  files_or_areas_implicated: ["deploy/pilot/values.yaml"],
};

describe("prompt renderer tools", () => {
  it("renders a minimal developer task prompt and omits empty optional sections", async () => {
    const output = await renderDeveloperTaskPrompt.execute({
      developerTaskPacketJson: JSON.stringify(minimalDeveloperTaskPacket),
    });

    expect(output).not.toContain("## Optional Packet Context");
    expect(output.split("\n")).toMatchInlineSnapshot(`
      [
        "# Task Execution Request",
        "",
        "## Developer Task Packet",
        "**Task Name:** Add pilot overlay",
        "**Purpose:** Add the pilot values overlay.",
        "**Dependencies:** None",
        "",
        "## Core Task Data",
        "### Task Steps",
        "1. Create overlay file",
        "2. Wire it into Helmfile",
        "",
        "### Acceptance Criteria",
        "Pilot rendering uses the new overlay.",
        "",
        "### Files to Modify",
        "- \`deploy/pilot/values.yaml\`",
        "- \`helmfile.yaml\`",
        "",
        "### Code Style Requirements",
        "- Follow existing code style in this repo if it aligns with best practices",
        "- Unify style across the project - match similar patterns",
        "- If project conventions conflict with best practices, follow best practices",
        "",
        "## Output Contract",
        "Return the normal human-readable completion message AND a \`## Structured Result\` section with a fenced \`json\` block matching the developer contract. Handle this task only; do not stage, commit, or orchestrate follow-up steps.",
      ]
    `);
  });

  it("renders the first-pass review prompt without issues to re-check", async () => {
    const output = await renderCodeReviewPrompt.execute({
      reviewPacketJson: JSON.stringify(firstPassReviewPacket),
    });

    expect(output).not.toContain("## Issues To Re-check");
    expect(output.split("\n")).toMatchInlineSnapshot(`
      [
        "[SUBAGENT] Review the orchestrator-provided staged diff and review packet for: Add pilot overlay.",
        "",
        "# Review Packet",
        "**Task Name:** Add pilot overlay",
        "**Purpose:** Add the pilot values overlay.",
        "**Steps:** 1. Create overlay file",
        "2. Wire it into Helmfile",
        "**Acceptance:** Pilot rendering uses the new overlay.",
        "**Files Modified:** deploy/pilot/values.yaml, helmfile.yaml",
        "**Review Pass:** 1",
        "",
        "## Task Relationships",
        "- This task depends on: None",
        "- Tasks that depend on this: None",
        "",
        "# Review Focus",
        "- Alignment with planned architecture",
        "- Support for upcoming tasks, conflicts with future work",
        "- Backwards Compatibility: Flag breaking changes ONLY if "Required: Yes"",
        "- Code Style: Verify code follows existing patterns; flag inconsistencies",
        "",
        "Do NOT suggest features planned for upcoming tasks.",
        "",
        "**Review pass 1**: Perform the initial review and flag any critical, high, or medium issues.",
        "",
        "## Output Contract",
        "Return the normal human-readable review AND a \`## Structured Result\` section with a fenced \`json\` block matching the reviewer contract. This is advisory only; do not modify files or direct workflow state changes.",
      ]
    `);
  });

  it("renders the re-review prompt with prior issues verbatim", async () => {
    const output = await renderCodeReviewPrompt.execute({
      reviewPacketJson: JSON.stringify(reReviewPacket),
    });

    expect(output).toContain("## Issues To Re-check");
    expect(output).toContain("Mutable latest tags in pilot image defaults");
    expect(output).toContain("Pin the default image tags to the bundle version.");
    expect(output.split("\n")).toMatchInlineSnapshot(`
      [
        "[SUBAGENT] Review the orchestrator-provided staged diff and review packet for: Add pilot overlay.",
        "",
        "# Review Packet",
        "**Task Name:** Add pilot overlay",
        "**Purpose:** Add the pilot values overlay.",
        "**Steps:** 1. Create overlay file",
        "2. Wire it into Helmfile",
        "**Acceptance:** Pilot rendering uses the new overlay.",
        "**Files Modified:** deploy/pilot/values.yaml, helmfile.yaml",
        "**Review Pass:** 2",
        "",
        "## Issues To Re-check",
        "**Previous Review Summary:** Verify that mutable image defaults were removed.",
        "- **[medium] Mutable latest tags in pilot image defaults**: latest tags still allow drift from the release bundle.",
        "  Recommendation: Pin the default image tags to the bundle version.",
        "",
        "## Task Relationships",
        "- This task depends on: None",
        "- Tasks that depend on this: Publish pilot release notes",
        "",
        "## Additional Plan Context (only if relevant)",
        "### Upcoming Tasks",
        "- **Publish pilot release notes:** Document pilot deploy defaults.",
        "### Decision Constraints",
        "- Default all deployable pilot images to pinned bundle tags.",
        "",
        "# Review Focus",
        "- Alignment with planned architecture",
        "- Support for upcoming tasks, conflicts with future work",
        "- Backwards Compatibility: Flag breaking changes ONLY if "Required: Yes"",
        "- Code Style: Verify code follows existing patterns; flag inconsistencies",
        "",
        "Do NOT suggest features planned for upcoming tasks.",
        "",
        "**Review pass 2**: Verify previous issues were fixed AND check for regressions.",
        "",
        "## Output Contract",
        "Return the normal human-readable review AND a \`## Structured Result\` section with a fenced \`json\` block matching the reviewer contract. This is advisory only; do not modify files or direct workflow state changes.",
      ]
    `);
  });

  it("renders the developer retry prompt from only the normalized unresolved issues", async () => {
    const output = await renderDeveloperRetryPrompt.execute({
      retryPacketJson: JSON.stringify(retryPacket),
      developerTaskPacketJson: JSON.stringify(richerDeveloperTaskPacket),
    });

    expect(output).toContain("Mutable latest tags in pilot image defaults");
    expect(output).not.toContain("Listener docs still refer to LISTEN_INTERFACE");
    expect(output.split("\n")).toMatchInlineSnapshot(`
      [
        "# Task Execution Request (CODE REVIEW RETRY)",
        "",
        "## Retry Issue Packet",
        "**Task Name:** Add pilot overlay",
        "**Purpose:** Add the pilot values overlay.",
        "**Highest Severity:** medium",
        "**Summary:** One review issue remains.",
        "",
        "## Unresolved Issues",
        "- **[medium] Mutable latest tags in pilot image defaults**: latest tags still allow drift from the release bundle.",
        "  Recommendation: Pin the default image tags to the bundle version.",
        "",
        "## Current Task Packet",
        "**Task Name:** Add pilot overlay",
        "**Purpose:** Add the pilot values overlay.",
        "**Dependencies:** Add release bundle metadata",
        "### Task Steps",
        "1. Create overlay file",
        "2. Wire it into Helmfile",
        "",
        "### Acceptance Criteria",
        "Pilot rendering uses the new overlay.",
        "",
        "### Files to Modify",
        "- \`deploy/pilot/values.yaml\`",
        "- \`helmfile.yaml\`",
        "",
        "## Regression-Sensitive Constraints",
        "### Architecture Constraints",
        "",
        "The orchestrator assembles packets before subagent invocation.",
        "",
        "### Decision Constraints",
        "",
        "- Keep packet builders and renderers separate.",
        "",
        "### Backwards Compatibility Constraints",
        "",
        "**Required:** Yes",
        "",
        "### Security Constraints",
        "",
        "Secrets and auth paths require explicit review.",
        "",
        "## Instructions",
        "1. Review the retry issue packet only",
        "2. Fix all critical AND high AND medium issues from THIS iteration",
        "3. Make incremental fixes on staged changes (DO NOT start from scratch)",
        "4. Ensure fixes don't break existing functionality or introduce regressions",
        "5. Follow code style - match existing patterns",
        "6. Return completion status with ✅, ❌, or ⚠️",
        "7. Include the \`## Structured Result\` JSON block required by the developer contract",
      ]
    `);
  });

  it("renders the QA fix prompt with only fixable issues actionable and skipped issues preserved separately", async () => {
    const output = await renderDeveloperQaFixPrompt.execute({
      qaRetryPacketJson: JSON.stringify(qaRetryPacket),
      planPurpose: "Ship a reproducible pilot deployment overlay.",
      relevantFilesJson: JSON.stringify(["helmfile.yaml", "deploy/pilot/values.yaml"]),
    });

    expect(output).toContain("**Fixable Issues:**");
    expect(output).toContain("**Skipped Issues:**");
    expect(output).not.toContain("Issues Found:");
    expect(output.split("\n")).toMatchInlineSnapshot(`
      [
        "# Task Execution Request (QA FIX)",
        "",
        "## Task Information",
        "**Task Name:** QA Issue Fix",
        "**Purpose:** Fix runtime issues discovered during QA validation",
        "",
        "## QA Feedback",
        "**Status:** failed",
        "**Summary:** Pilot startup fails because the image tag is missing.",
        "",
        "## QA Issue Packet",
        "**Fixable Issues:**",
        "- **QA blocker** (new): Pilot container crashes on startup.",
        "  Recommendation: Set an explicit pilot image tag.",
        "",
        "**Skipped Issues:**",
        "- **Legacy dashboard timeout** (preexisting, large): The old admin dashboard still times out.",
        "  Recommendation: Leave this for separate cleanup.",
        "",
        "## Implementation Context",
        "**Plan Purpose:** Ship a reproducible pilot deployment overlay.",
        "**Files or Areas Implicated:**",
        "- \`helmfile.yaml\`",
        "- \`deploy/pilot/values.yaml\`",
        "",
        "## Instructions",
        "1. Analyze QA feedback - focus on concrete failures (test failures, HTTP errors, startup crashes)",
        "2. Read failing code paths to understand root cause",
        "3. Fix ALL normalized fixable issues from this packet",
        "4. Do NOT fix skipped large preexisting issues - report them as skipped",
        "5. Make incremental fixes (DO NOT start from scratch)",
        "6. Follow code style",
        "7. Run relevant tests locally to verify fixes",
        "8. Return completion status with ✅, ❌, or ⚠️ and include a resolution summary",
        "9. Include the \`## Structured Result\` JSON block required by the developer contract",
        "",
        "**Key:** These are RUNTIME failures, not static analysis. Focus on logic errors, missing config, incorrect wiring, and integration issues.",
      ]
    `);
  });
});
