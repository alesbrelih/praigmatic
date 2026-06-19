import type { ContextTag, ParsedPlan, ParsedPlanTask } from "./plan-workflow.js";

export interface CompletedTaskExecution {
  title: string;
  filesModified: string[];
  summary: string;
  discoveries: string[];
}

export interface ContextSelectionFlags {
  architectureSensitive: boolean;
  dependencySensitive: boolean;
  backwardsCompatSensitive: boolean;
  securitySensitive: boolean;
  interfaceSensitive: boolean;
}

export interface SelectedPlanContext {
  architectureOverview?: string;
  technicalDecisions?: string;
  backwardsCompatibility?: string;
  securityConsiderations?: string;
  testingStrategy?: string;
}

export interface DeveloperTaskPacket {
  kind: "developer_task_packet";
  taskName: string;
  purpose: string;
  steps: string[];
  acceptance: string;
  files: string[];
  dependencies: string[];
  dependencyContext: CompletedTaskExecution[];
  otherCompletedSummary: string | null;
  relevantDiscoveries: string[];
  planContext: SelectedPlanContext;
  flags: ContextSelectionFlags;
}

export interface ReviewPacket {
  kind: "review_packet";
  taskName: string;
  purpose: string;
  steps: string[];
  acceptance: string;
  files: string[];
  dependencies: string[];
  dependents: Array<{ title: string; purpose: string }>;
  stagedFiles: string[];
  reviewPass: number;
  previousReviewSummary: string | null;
  recheckIssues: RetryIssue[];
  relevantUpcomingTasks: Array<{ title: string; purpose: string }>;
  planContext: SelectedPlanContext;
  flags: ContextSelectionFlags;
}

export interface RetryIssue {
  severity: "none" | "low" | "medium" | "high" | "critical";
  title: string;
  summary: string;
  recommendation: string;
}

export interface RetryPacket {
  kind: "retry_packet";
  summary: string;
  highestSeverity: "none" | "low" | "medium" | "high" | "critical";
  issues: RetryIssue[];
}

export interface HolisticContextPacket {
  kind: "holistic_context_packet";
  planName: string;
  planPurpose: string;
  completedTaskSummaries: CompletedTaskExecution[];
  accumulatedDiscoveries: string[];
  planContext: SelectedPlanContext;
}

export interface QaRetryIssue {
  title: string;
  summary: string;
  recommendation: string;
  type?: "new" | "preexisting";
  effort?: "small" | "medium" | "large";
}

export interface QaRetryPacket {
  kind: "qa_retry_packet";
  status: "passed" | "partial" | "failed";
  summary: string;
  fixableIssues: QaRetryIssue[];
  skippedIssues: QaRetryIssue[];
  filesOrAreasImplicated: string[];
}

const SECURITY_KEYWORDS = [
  "auth",
  "token",
  "crypto",
  "secret",
  "security",
  "permission",
  "jwt",
  "oauth",
  "middleware",
  "credential",
  "encryption",
];
const INTERFACE_KEYWORDS = [
  "api",
  "interface",
  "contract",
  "schema",
  "public",
  "route",
  "endpoint",
  "request",
  "response",
  "export",
];
const ARCHITECTURE_KEYWORDS = [
  "architecture",
  "integration",
  "migration",
  "pipeline",
  "adapter",
  "repository",
  "service",
  "middleware",
  "shared",
  "core",
];

function tokenize(value: string): string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);
}

function collectTaskCorpus(task: ParsedPlanTask): string {
  return [
    task.title,
    task.purpose,
    task.acceptance,
    task.steps.join(" "),
    task.files.join(" "),
    task.dependencies.join(" "),
    task.contextTags.join(" "),
    task.produces.join(" "),
    task.consumes.join(" "),
  ].join(" ");
}

function hasKeywordMatch(corpus: string, keywords: string[]): boolean {
  const haystack = corpus.toLowerCase();
  return keywords.some((keyword) => haystack.includes(keyword));
}

function overlapsTaskTerms(value: string, task: ParsedPlanTask): boolean {
  const taskTerms = new Set(tokenize(collectTaskCorpus(task)));
  const valueTerms = tokenize(value);
  return valueTerms.some((term) => taskTerms.has(term));
}

function overlapsTaskFiles(value: string, task: ParsedPlanTask): boolean {
  const fileTerms = new Set(tokenize(task.files.join(" ")));
  const valueTerms = tokenize(value);
  return valueTerms.some((term) => fileTerms.has(term));
}

function summarizeOtherCompletedTasks(tasks: CompletedTaskExecution[]): string | null {
  if (tasks.length === 0) return null;
  const names = tasks.slice(0, 3).map((task) => task.title);
  const suffix = tasks.length > 3 ? ` (+${tasks.length - 3} more)` : "";
  return `Other completed work: ${names.join(", ")}${suffix}`;
}

function normalizeInterfaceLabel(value: string): string {
  return value.trim().toLowerCase();
}

function collectExplicitContextTags(task: ParsedPlanTask): Set<ContextTag> {
  return new Set(task.contextTags);
}

function hasSharedInterface(
  producedValues: string[],
  consumedValues: string[],
): boolean {
  if (producedValues.length === 0 || consumedValues.length === 0) return false;

  const produced = new Set(producedValues.map(normalizeInterfaceLabel));
  return consumedValues.some((value) => produced.has(normalizeInterfaceLabel(value)));
}

function hasKeywordDependentRelationship(
  sourceTask: ParsedPlanTask,
  candidateTask: ParsedPlanTask,
): boolean {
  const sourceTerms = new Set(tokenize([
    sourceTask.title,
    sourceTask.files.join(" "),
    sourceTask.produces.join(" "),
  ].join(" ")));
  const candidateTerms = tokenize([
    candidateTask.title,
    candidateTask.purpose,
    candidateTask.acceptance,
    candidateTask.steps.join(" "),
    candidateTask.files.join(" "),
    candidateTask.consumes.join(" "),
  ].join(" "));

  let overlapCount = 0;
  for (const term of candidateTerms) {
    if (sourceTerms.has(term)) {
      overlapCount += 1;
    }
    if (overlapCount >= 2) {
      return true;
    }
  }

  return false;
}

function backwardsCompatibilityRequired(plan: ParsedPlan): boolean {
  return /required[^a-z0-9]*:[^a-z0-9]*yes/i.test(plan.backwardsCompatibility);
}

function selectPlanContext(
  plan: ParsedPlan,
  flags: ContextSelectionFlags,
  options?: { includeTestingStrategy?: boolean },
): SelectedPlanContext {
  const context: SelectedPlanContext = {};

  if (
    flags.architectureSensitive ||
    flags.dependencySensitive ||
    flags.interfaceSensitive
  ) {
    if (plan.architectureOverview) {
      context.architectureOverview = plan.architectureOverview;
    }
    if (plan.technicalDecisions) {
      context.technicalDecisions = plan.technicalDecisions;
    }
  }

  if (flags.backwardsCompatSensitive && plan.backwardsCompatibility) {
    context.backwardsCompatibility = plan.backwardsCompatibility;
  }

  if (flags.securitySensitive && plan.securityConsiderations) {
    context.securityConsiderations = plan.securityConsiderations;
  }

  if (options?.includeTestingStrategy && plan.testingStrategy) {
    context.testingStrategy = plan.testingStrategy;
  }

  return context;
}

function buildContextFlags(
  plan: ParsedPlan,
  task: ParsedPlanTask,
  dependents: Array<{ title: string; purpose: string }>,
): ContextSelectionFlags {
  const taskCorpus = collectTaskCorpus(task);
  const backwardsCompatRequired = backwardsCompatibilityRequired(plan);
  const explicitTags = collectExplicitContextTags(task);
  const hasExplicitTags = explicitTags.size > 0;

  const inferredInterfaceSensitive =
    hasKeywordMatch(taskCorpus, INTERFACE_KEYWORDS) || dependents.length > 0;
  const inferredSecuritySensitive =
    hasKeywordMatch(taskCorpus, SECURITY_KEYWORDS) ||
    task.files.some((file) => hasKeywordMatch(file, SECURITY_KEYWORDS)) ||
    hasKeywordMatch(plan.securityConsiderations, SECURITY_KEYWORDS);
  const inferredArchitectureSensitive =
    inferredInterfaceSensitive ||
    hasKeywordMatch(taskCorpus, ARCHITECTURE_KEYWORDS) ||
    task.files.some((file) => hasKeywordMatch(file, ARCHITECTURE_KEYWORDS));
  const inferredBackwardsCompatSensitive = backwardsCompatRequired;
  const inferredDependencySensitive = task.dependencies.length > 0;

  return {
    architectureSensitive: hasExplicitTags
      ? explicitTags.has("architecture") || explicitTags.has("integration")
      : inferredArchitectureSensitive,
    dependencySensitive: inferredDependencySensitive,
    backwardsCompatSensitive: hasExplicitTags
      ? explicitTags.has("backwards_compat")
      : inferredBackwardsCompatSensitive,
    securitySensitive: hasExplicitTags
      ? explicitTags.has("security")
      : inferredSecuritySensitive,
    interfaceSensitive: hasExplicitTags
      ? explicitTags.has("interface") || explicitTags.has("integration")
      : inferredInterfaceSensitive,
  };
}

function findDependents(plan: ParsedPlan, task: ParsedPlanTask): Array<{ title: string; purpose: string }> {
  const taskIndex = plan.tasks.findIndex((candidate) => candidate.title === task.title);
  return plan.tasks
    .filter((candidate, candidateIndex) => {
      if (candidate.title === task.title) return false;
      if (taskIndex >= 0 && candidateIndex <= taskIndex) return false;

      if (hasSharedInterface(task.produces, candidate.consumes)) {
        return true;
      }

      if (candidate.dependencies.includes(task.title)) {
        return true;
      }

      if (task.produces.length > 0 || candidate.consumes.length > 0) {
        return false;
      }

      return hasKeywordDependentRelationship(task, candidate);
    })
    .map((candidate) => ({
      title: candidate.title,
      purpose: candidate.purpose,
    }));
}

export function selectTaskContext(
  plan: ParsedPlan,
  task: ParsedPlanTask,
  completedTasks: CompletedTaskExecution[],
): DeveloperTaskPacket {
  const dependents = findDependents(plan, task);
  const flags = buildContextFlags(plan, task, dependents);
  const dependencyContext = completedTasks.filter((completedTask) =>
    task.dependencies.includes(completedTask.title),
  );
  const otherCompletedTasks = completedTasks.filter(
    (completedTask) => !task.dependencies.includes(completedTask.title),
  );

  const dependencyDiscoveries = dependencyContext.flatMap(
    (completedTask) => completedTask.discoveries,
  );
  const matchedDiscoveries = completedTasks
    .flatMap((completedTask) => completedTask.discoveries)
    .filter(
      (discovery) =>
        overlapsTaskFiles(discovery, task) ||
        task.produces.some((item) =>
          discovery.toLowerCase().includes(item.toLowerCase()),
        ) ||
        task.consumes.some((item) =>
          discovery.toLowerCase().includes(item.toLowerCase()),
        ) ||
        task.dependencies.some((dependency) =>
          discovery.toLowerCase().includes(dependency.toLowerCase()),
        ),
    );

  const relevantDiscoveries = [...new Set([...dependencyDiscoveries, ...matchedDiscoveries])];

  return {
    kind: "developer_task_packet",
    taskName: task.title,
    purpose: task.purpose,
    steps: task.steps,
    acceptance: task.acceptance,
    files: task.files,
    dependencies: task.dependencies,
    dependencyContext,
    otherCompletedSummary: summarizeOtherCompletedTasks(otherCompletedTasks),
    relevantDiscoveries,
    planContext: selectPlanContext(plan, flags),
    flags,
  };
}

export function selectReviewContext(
  plan: ParsedPlan,
  task: ParsedPlanTask,
  stagedFiles: string[],
  reviewPass: number,
  previousReview?: {
    summary?: string;
    issues?: RetryIssue[];
  },
): ReviewPacket {
  const dependents = findDependents(plan, task);
  const flags = buildContextFlags(plan, task, dependents);

  return {
    kind: "review_packet",
    taskName: task.title,
    purpose: task.purpose,
    steps: task.steps,
    acceptance: task.acceptance,
    files: task.files,
    dependencies: task.dependencies,
    dependents,
    stagedFiles,
    reviewPass,
    previousReviewSummary: previousReview?.summary?.trim() || null,
    recheckIssues: previousReview?.issues ?? [],
    relevantUpcomingTasks:
      dependents.length > 0 &&
      (flags.interfaceSensitive || flags.architectureSensitive || flags.backwardsCompatSensitive)
        ? dependents
        : [],
    planContext: selectPlanContext(plan, flags),
    flags,
  };
}

export function buildRetryIssuePacket(reviewResult: {
  summary: string;
  highest_severity: "none" | "low" | "medium" | "high" | "critical";
  issues: RetryIssue[];
}): RetryPacket {
  return {
    kind: "retry_packet",
    summary: reviewResult.summary,
    highestSeverity: reviewResult.highest_severity,
    issues: reviewResult.issues.map((issue) => ({
      severity: issue.severity,
      title: issue.title,
      summary: issue.summary,
      recommendation: issue.recommendation,
    })),
  };
}

export function buildHolisticContext(
  plan: ParsedPlan,
  completedTasks: CompletedTaskExecution[],
): HolisticContextPacket {
  return {
    kind: "holistic_context_packet",
    planName: plan.title,
    planPurpose: plan.purpose,
    completedTaskSummaries: completedTasks.map((task) => ({
      title: task.title,
      filesModified: task.filesModified,
      summary: task.summary,
      discoveries: task.discoveries,
    })),
    accumulatedDiscoveries: [...new Set(completedTasks.flatMap((task) => task.discoveries))],
    planContext: selectPlanContext(
      plan,
      {
        architectureSensitive: true,
        dependencySensitive: true,
        backwardsCompatSensitive: backwardsCompatibilityRequired(plan),
        securitySensitive: Boolean(plan.securityConsiderations),
        interfaceSensitive: true,
      },
      { includeTestingStrategy: true },
    ),
  };
}

function normalizeQaStatus(value: string): "passed" | "partial" | "failed" {
  const normalized = value.trim().toLowerCase();
  if (normalized.includes("pass")) return "passed";
  if (normalized.includes("partial")) return "partial";
  return "failed";
}

function normalizeQaEffort(value: unknown): "small" | "medium" | "large" | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "small" || normalized === "medium" || normalized === "large") {
    return normalized;
  }
  return undefined;
}

function normalizeQaType(value: unknown): "new" | "preexisting" | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim().toLowerCase();
  if (normalized === "new" || normalized === "preexisting") {
    return normalized;
  }
  return undefined;
}

export function buildQaRetryPacket(qaResult: {
  status: string;
  summary?: string;
  fixable_issues?: Array<Record<string, unknown>>;
  skipped_issues?: Array<Record<string, unknown>>;
  files_or_areas_implicated?: string[];
}): QaRetryPacket {
  const normalizeIssueList = (issues: Array<Record<string, unknown>> = []): QaRetryIssue[] =>
    issues.map((issue) => ({
      title: typeof issue.title === "string" ? issue.title : "Untitled QA issue",
      summary: typeof issue.summary === "string" ? issue.summary : "",
      recommendation:
        typeof issue.recommendation === "string"
          ? issue.recommendation
          : "",
      type: normalizeQaType(issue.type),
      effort: normalizeQaEffort(issue.effort),
    }));

  return {
    kind: "qa_retry_packet",
    status: normalizeQaStatus(qaResult.status),
    summary: qaResult.summary?.trim() ?? "",
    fixableIssues: normalizeIssueList(qaResult.fixable_issues),
    skippedIssues: normalizeIssueList(qaResult.skipped_issues),
    filesOrAreasImplicated: Array.isArray(qaResult.files_or_areas_implicated)
      ? [...new Set(qaResult.files_or_areas_implicated.filter((item): item is string => typeof item === "string" && item.trim().length > 0))]
      : [],
  };
}

export function estimatePacketSize(packet: unknown): number {
  return JSON.stringify(packet).length;
}
