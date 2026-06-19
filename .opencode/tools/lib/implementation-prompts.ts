import type {
  DeveloperTaskPacket,
  QaRetryIssue,
  RetryIssue,
  RetryPacket,
  ReviewPacket,
} from "./implementation-context.js";

export interface QaRetryPacketOutput {
  kind: "qa_retry_packet";
  status: "passed" | "partial" | "failed";
  summary: string;
  fixable_issues: QaRetryIssue[];
  skipped_issues: QaRetryIssue[];
  files_or_areas_implicated: string[];
}

function formatInlineList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "None";
}

function formatBulletList(items: string[], tick = true): string {
  if (items.length === 0) return "- None";
  return items.map((item) => `- ${tick ? `\`${item}\`` : item}`).join("\n");
}

function formatNumberedList(items: string[]): string {
  if (items.length === 0) return "1. None";
  return items.map((item, index) => `${index + 1}. ${item}`).join("\n");
}

function formatIssues(issues: RetryIssue[]): string {
  return issues
    .map(
      (issue) =>
        `- **[${issue.severity}] ${issue.title}**: ${issue.summary}\n  Recommendation: ${issue.recommendation || "None"}`,
    )
    .join("\n");
}

function formatQaIssues(issues: QaRetryIssue[]): string {
  return issues
    .map((issue) => {
      const qualifiers = [issue.type, issue.effort].filter(Boolean).join(", ");
      const qualifierLine = qualifiers ? ` (${qualifiers})` : "";
      return `- **${issue.title}**${qualifierLine}: ${issue.summary}\n  Recommendation: ${issue.recommendation || "None"}`;
    })
    .join("\n");
}

function buildOptionalSections(
  sections: Array<{ title: string; body: string | null | undefined }>,
): string[] {
  return sections.flatMap((section) => {
    if (!section.body) return [];
    return [`### ${section.title}`, section.body];
  });
}

function renderDependencyContext(packet: DeveloperTaskPacket): string | null {
  if (packet.dependencyContext.length === 0) return null;

  return packet.dependencyContext
    .map(
      (dependency, index) =>
        `${index + 1}. **${dependency.title}**: ${dependency.summary}\n   Files: ${formatInlineList(dependency.filesModified)}\n   Discoveries: ${dependency.discoveries.length > 0 ? dependency.discoveries.join("; ") : "None"}`,
    )
    .join("\n");
}

function renderPlanContextSections(
  planContext: DeveloperTaskPacket["planContext"] | ReviewPacket["planContext"],
): Array<{ title: string; body: string | null }> {
  return [
    {
      title: "Architecture Constraints",
      body: planContext.architectureOverview ?? null,
    },
    {
      title: "Decision Constraints",
      body: planContext.technicalDecisions ?? null,
    },
    {
      title: "Backwards Compatibility Constraints",
      body: planContext.backwardsCompatibility ?? null,
    },
    {
      title: "Security Constraints",
      body: planContext.securityConsiderations ?? null,
    },
  ];
}

function renderRegressionConstraints(packet: DeveloperTaskPacket): string | null {
  const sections = buildOptionalSections(renderPlanContextSections(packet.planContext));
  return sections.length > 0 ? sections.join("\n\n") : null;
}

export function renderDeveloperTaskPrompt(packet: DeveloperTaskPacket): string {
  const optionalSections = [
    {
      title: "Dependency Context",
      body: renderDependencyContext(packet),
    },
    {
      title: "Other Completed Work",
      body: packet.otherCompletedSummary,
    },
    {
      title: "Relevant Discoveries",
      body:
        packet.relevantDiscoveries.length > 0
          ? formatBulletList(packet.relevantDiscoveries, false)
          : null,
    },
    ...renderPlanContextSections(packet.planContext),
  ];

  const renderedOptionalSections = buildOptionalSections(optionalSections);

  return [
    "# Task Execution Request",
    "",
    "## Developer Task Packet",
    `**Task Name:** ${packet.taskName}`,
    `**Purpose:** ${packet.purpose}`,
    `**Dependencies:** ${formatInlineList(packet.dependencies)}`,
    "",
    "## Core Task Data",
    "### Task Steps",
    formatNumberedList(packet.steps),
    "",
    "### Acceptance Criteria",
    packet.acceptance,
    "",
    "### Files to Modify",
    formatBulletList(packet.files),
    "",
    "### Code Style Requirements",
    "- Follow existing code style in this repo if it aligns with best practices",
    "- Unify style across the project - match similar patterns",
    "- If project conventions conflict with best practices, follow best practices",
    ...(renderedOptionalSections.length > 0
      ? ["", "## Optional Packet Context", ...renderedOptionalSections]
      : []),
    "",
    "## Output Contract",
    "Return the normal human-readable completion message AND a `## Structured Result` section with a fenced `json` block matching the developer contract. Handle this task only; do not stage, commit, or orchestrate follow-up steps.",
  ].join("\n");
}

export function renderCodeReviewPrompt(packet: ReviewPacket): string {
  const additionalPlanSections = buildOptionalSections([
    {
      title: "Upcoming Tasks",
      body:
        packet.relevantUpcomingTasks.length > 0
          ? packet.relevantUpcomingTasks
              .map((task) => `- **${task.title}:** ${task.purpose}`)
              .join("\n")
          : null,
    },
    ...renderPlanContextSections(packet.planContext),
  ]);

  const issuesToRecheck =
    packet.recheckIssues.length > 0
      ? [
          "## Issues To Re-check",
          ...(packet.previousReviewSummary
            ? [`**Previous Review Summary:** ${packet.previousReviewSummary}`]
            : []),
          formatIssues(packet.recheckIssues),
          "",
        ]
      : [];

  return [
    `[SUBAGENT] Review the orchestrator-provided staged diff and review packet for: ${packet.taskName}.`,
    "",
    "# Review Packet",
    `**Task Name:** ${packet.taskName}`,
    `**Purpose:** ${packet.purpose}`,
    `**Steps:** ${formatNumberedList(packet.steps)}`,
    `**Acceptance:** ${packet.acceptance}`,
    `**Files Modified:** ${formatInlineList(packet.stagedFiles)}`,
    `**Review Pass:** ${packet.reviewPass}`,
    "",
    ...issuesToRecheck,
    "## Task Relationships",
    `- This task depends on: ${formatInlineList(packet.dependencies)}`,
    `- Tasks that depend on this: ${packet.dependents.length > 0 ? packet.dependents.map((task) => task.title).join(", ") : "None"}`,
    ...(additionalPlanSections.length > 0
      ? ["", "## Additional Plan Context (only if relevant)", ...additionalPlanSections]
      : []),
    "",
    "# Review Focus",
    "- Alignment with planned architecture",
    "- Support for upcoming tasks, conflicts with future work",
    '- Backwards Compatibility: Flag breaking changes ONLY if "Required: Yes"',
    "- Code Style: Verify code follows existing patterns; flag inconsistencies",
    "",
    "Do NOT suggest features planned for upcoming tasks.",
    "",
    `**Review pass ${packet.reviewPass}**: ${packet.reviewPass > 1 ? "Verify previous issues were fixed AND check for regressions." : "Perform the initial review and flag any critical, high, or medium issues."}`,
    "",
    "## Output Contract",
    "Return the normal human-readable review AND a `## Structured Result` section with a fenced `json` block matching the reviewer contract. This is advisory only; do not modify files or direct workflow state changes.",
  ].join("\n");
}

export function renderDeveloperRetryPrompt(
  retryPacket: RetryPacket,
  developerTaskPacket: DeveloperTaskPacket,
): string {
  const regressionConstraints = renderRegressionConstraints(developerTaskPacket);

  return [
    "# Task Execution Request (CODE REVIEW RETRY)",
    "",
    "## Retry Issue Packet",
    `**Task Name:** ${developerTaskPacket.taskName}`,
    `**Purpose:** ${developerTaskPacket.purpose}`,
    `**Highest Severity:** ${retryPacket.highestSeverity}`,
    `**Summary:** ${retryPacket.summary}`,
    "",
    "## Unresolved Issues",
    formatIssues(retryPacket.issues),
    "",
    "## Current Task Packet",
    `**Task Name:** ${developerTaskPacket.taskName}`,
    `**Purpose:** ${developerTaskPacket.purpose}`,
    `**Dependencies:** ${formatInlineList(developerTaskPacket.dependencies)}`,
    "### Task Steps",
    formatNumberedList(developerTaskPacket.steps),
    "",
    "### Acceptance Criteria",
    developerTaskPacket.acceptance,
    "",
    "### Files to Modify",
    formatBulletList(developerTaskPacket.files),
    ...(regressionConstraints
      ? ["", "## Regression-Sensitive Constraints", regressionConstraints]
      : []),
    "",
    "## Instructions",
    "1. Review the retry issue packet only",
    "2. Fix all critical AND high AND medium issues from THIS iteration",
    "3. Make incremental fixes on staged changes (DO NOT start from scratch)",
    "4. Ensure fixes don't break existing functionality or introduce regressions",
    "5. Follow code style - match existing patterns",
    "6. Return completion status with ✅, ❌, or ⚠️",
    "7. Include the `## Structured Result` JSON block required by the developer contract",
  ].join("\n");
}

export function renderDeveloperQaFixPrompt(
  qaRetryPacket: QaRetryPacketOutput,
  options?: {
    planPurpose?: string;
    relevantFiles?: string[];
  },
): string {
  const files = [
    ...(options?.relevantFiles ?? []),
    ...qaRetryPacket.files_or_areas_implicated,
  ];
  const uniqueFiles = [...new Set(files)];

  return [
    "# Task Execution Request (QA FIX)",
    "",
    "## Task Information",
    "**Task Name:** QA Issue Fix",
    "**Purpose:** Fix runtime issues discovered during QA validation",
    "",
    "## QA Feedback",
    `**Status:** ${qaRetryPacket.status}`,
    `**Summary:** ${qaRetryPacket.summary || "Runtime validation found issues that must be fixed."}`,
    "",
    "## QA Issue Packet",
    "**Fixable Issues:**",
    qaRetryPacket.fixable_issues.length > 0
      ? formatQaIssues(qaRetryPacket.fixable_issues)
      : "- None",
    "",
    "**Skipped Issues:**",
    qaRetryPacket.skipped_issues.length > 0
      ? formatQaIssues(qaRetryPacket.skipped_issues)
      : "- None",
    "",
    "## Implementation Context",
    `**Plan Purpose:** ${options?.planPurpose ?? "Not provided"}`,
    "**Files or Areas Implicated:**",
    formatBulletList(uniqueFiles),
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
    "9. Include the `## Structured Result` JSON block required by the developer contract",
    "",
    "**Key:** These are RUNTIME failures, not static analysis. Focus on logic errors, missing config, incorrect wiring, and integration issues.",
  ].join("\n");
}
