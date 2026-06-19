import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskSize = "Small" | "Medium" | "Large";
export type ContextTag =
  | "architecture"
  | "security"
  | "backwards_compat"
  | "interface"
  | "integration";

export interface ParsedPlanTask {
  title: string;
  status: TaskStatus;
  size: TaskSize;
  purpose: string;
  acceptance: string;
  steps: string[];
  files: string[];
  dependencies: string[];
  contextTags: ContextTag[];
  produces: string[];
  consumes: string[];
  refs: string[];
  commitNotes?: string;
  actualFiles: string[];
  notes?: string;
  runtimeWarnings: string[];
  startLine: number;
  endLineExclusive: number;
}

export interface ParsedPlan {
  path: string;
  title: string;
  purpose: string;
  references: string[];
  architectureOverview: string;
  technicalDecisions: string;
  backwardsCompatibility: string;
  securityConsiderations: string;
  testingStrategy: string;
  tasks: ParsedPlanTask[];
  qaRequired: boolean;
}

export interface PlanInspection {
  plan: ParsedPlan | null;
  violations: string[];
}

const TASK_HEADER_RE = /^- \[( |~|x)\] \*\*(.+?)\*\* \((Small|Medium|Large)\)$/;
const SECTION_RE = /^##\s+(.+)$/;
const FIELD_RE = /^  - ([A-Za-z][A-Za-z ]+):\s*(.*)$/;
const LIST_TASK_FIELDS = new Set([
  "Steps",
  "Files",
  "Dependencies",
  "Context Tags",
  "Produces",
  "Consumes",
  "Refs",
  "Actual Files",
]);
const ALLOWED_CONTEXT_TAGS = new Set<ContextTag>([
  "architecture",
  "security",
  "backwards_compat",
  "interface",
  "integration",
]);

const REQUIRED_TASK_FIELDS = ["Purpose", "Acceptance", "Steps", "Files", "Dependencies"] as const;
const OPTIONAL_TASK_FIELDS = [
  "Context Tags",
  "Produces",
  "Consumes",
  "Refs",
  "Commit Notes",
  "Actual Files",
  "Notes",
] as const;
const ALLOWED_TASK_FIELDS = new Set<string>([
  ...REQUIRED_TASK_FIELDS,
  ...OPTIONAL_TASK_FIELDS,
]);

function normalizeLineEndings(content: string): string {
  return content.replace(/\r\n/g, "\n");
}

function splitInlineList(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map(stripTicks);
}

function stripTicks(value: string): string {
  return value.replace(/^`+|`+$/g, "").trim();
}

function isListTaskField(field: string): boolean {
  return LIST_TASK_FIELDS.has(field);
}

function symbolToStatus(symbol: string): TaskStatus {
  if (symbol === "~") return "in_progress";
  if (symbol === "x") return "completed";
  return "pending";
}

function statusToSymbol(status: TaskStatus): string {
  if (status === "in_progress") return "~";
  if (status === "completed") return "x";
  return " ";
}

function buildSections(lines: string[]): Array<{ title: string; start: number; end: number }> {
  const headings: Array<{ title: string; start: number; end: number }> = [];

  for (let i = 0; i < lines.length; i += 1) {
    const match = lines[i].match(SECTION_RE);
    if (!match) continue;
    headings.push({ title: match[1].trim(), start: i, end: lines.length });
  }

  for (let i = 0; i < headings.length; i += 1) {
    const next = headings[i + 1];
    headings[i].end = next ? next.start : lines.length;
  }

  return headings;
}

function readSectionBody(
  lines: string[],
  section: { start: number; end: number } | undefined,
): string {
  if (!section) return "";

  return lines
    .slice(section.start + 1, section.end)
    .map((line) => line.trimEnd())
    .join("\n")
    .trim();
}

function parseMetadataSection(
  lines: string[],
  section: { start: number; end: number } | undefined,
  violations: string[],
): string[] {
  if (!section) return [];

  const references: string[] = [];

  for (let i = section.start + 1; i < section.end; i += 1) {
    const line = lines[i].trim();
    if (!line) continue;

    const match = line.match(/^\*\*References:\*\*\s*(.+)$/);
    if (match) {
      references.push(...splitInlineList(match[1]));
      continue;
    }

    violations.push(`Unsupported metadata line in ## Metadata: "${line}"`);
  }

  return references;
}

function parseTaskBlock(
  title: string,
  status: TaskStatus,
  size: TaskSize,
  lines: string[],
  startLine: number,
  endLineExclusive: number,
  violations: string[],
): ParsedPlanTask {
  const scalars = new Map<string, string>();
  const lists = new Map<string, string[]>();
  const runtimeWarnings: string[] = [];
  let currentField: string | null = null;

  for (let i = startLine + 1; i < endLineExclusive; i += 1) {
    const line = lines[i];

    if (!line.trim()) continue;

    if (/^  (?:- )?⚠️ /.test(line)) {
      runtimeWarnings.push(line.trim().replace(/^- /, ""));
      currentField = null;
      continue;
    }

    const fieldMatch = line.match(FIELD_RE);
    if (fieldMatch) {
      const field = fieldMatch[1].trim();
      const rawValue = fieldMatch[2].trim();

      if (!ALLOWED_TASK_FIELDS.has(field)) {
        violations.push(`Task "${title}" has unsupported field "${field}"`);
        currentField = null;
        continue;
      }

      currentField = field;

      if (isListTaskField(field)) {
        if (field === "Dependencies" && rawValue.toLowerCase() === "none") {
          lists.set(field, []);
        } else {
          lists.set(field, rawValue ? splitInlineList(rawValue) : []);
        }
      } else {
        scalars.set(field, rawValue);
      }

      continue;
    }

    const nestedMatch = line.match(/^    - (.+)$/);
    if (nestedMatch) {
      if (!currentField || !isListTaskField(currentField)) {
        violations.push(`Task "${title}" has nested list item without a list field: "${line.trim()}"`);
        continue;
      }

      const items = lists.get(currentField) ?? [];
      items.push(stripTicks(nestedMatch[1]));
      lists.set(currentField, items);
      continue;
    }

    const continuationMatch = line.match(/^    (.+)$/);
    if (continuationMatch && currentField && !isListTaskField(currentField)) {
      const previous = scalars.get(currentField) ?? "";
      scalars.set(currentField, previous ? `${previous}\n${continuationMatch[1].trim()}` : continuationMatch[1].trim());
      continue;
    }

    violations.push(`Task "${title}" has unrecognized line: "${line.trim()}"`);
  }

  for (const field of REQUIRED_TASK_FIELDS) {
    if (field === "Steps" || field === "Files" || field === "Dependencies") {
      const items = lists.get(field) ?? [];
      if (field === "Dependencies") {
        if (items.length === 0 && (scalars.get(field) ?? "").toLowerCase() !== "none") {
          // no-op; dependencies are validated below from derived value
        }
      }
      if (field !== "Dependencies" && items.length === 0) {
        violations.push(`Task "${title}" is missing required field "${field}"`);
      }
      continue;
    }

    const value = scalars.get(field)?.trim();
    if (!value) {
      violations.push(`Task "${title}" is missing required field "${field}"`);
    }
  }

  const dependencies = (() => {
    const inline = scalars.get("Dependencies");
    const listed = lists.get("Dependencies");
    if (listed && listed.length > 0) return listed;
    if (!inline || inline.toLowerCase() === "none") return [];
    return splitInlineList(inline);
  })();

  const files = (() => {
    const listed = lists.get("Files");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Files");
    return inline ? splitInlineList(inline) : [];
  })();

  const steps = (() => {
    const listed = lists.get("Steps");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Steps");
    return inline ? [inline] : [];
  })();

  const refs = (() => {
    const listed = lists.get("Refs");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Refs");
    return inline ? splitInlineList(inline) : [];
  })();

  const contextTags = (() => {
    const listed = lists.get("Context Tags");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Context Tags");
    return inline ? splitInlineList(inline) : [];
  })();

  const invalidContextTags = contextTags.filter(
    (tag): tag is string => !ALLOWED_CONTEXT_TAGS.has(tag as ContextTag),
  );
  for (const tag of invalidContextTags) {
    violations.push(
      `Task "${title}" has invalid Context Tags entry "${tag}" (allowed: ${[...ALLOWED_CONTEXT_TAGS].join(", ")})`,
    );
  }

  const produces = (() => {
    const listed = lists.get("Produces");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Produces");
    return inline ? splitInlineList(inline) : [];
  })();

  const consumes = (() => {
    const listed = lists.get("Consumes");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Consumes");
    return inline ? splitInlineList(inline) : [];
  })();

  const actualFiles = (() => {
    const listed = lists.get("Actual Files");
    if (listed && listed.length > 0) return listed;
    const inline = scalars.get("Actual Files");
    return inline ? splitInlineList(inline) : [];
  })();

  return {
    title,
    status,
    size,
    purpose: scalars.get("Purpose")?.trim() ?? "",
    acceptance: scalars.get("Acceptance")?.trim() ?? "",
    steps,
    files,
    dependencies,
    contextTags: uniqueList(contextTags).filter((tag): tag is ContextTag =>
      ALLOWED_CONTEXT_TAGS.has(tag as ContextTag),
    ),
    produces: uniqueList(produces),
    consumes: uniqueList(consumes),
    refs,
    commitNotes: scalars.get("Commit Notes")?.trim() || undefined,
    actualFiles,
    notes: scalars.get("Notes")?.trim() || undefined,
    runtimeWarnings,
    startLine,
    endLineExclusive,
  };
}

export function inspectPlanContent(content: string, planPath: string): PlanInspection {
  const normalized = normalizeLineEndings(content);
  const lines = normalized.split("\n");
  const violations: string[] = [];
  const seenTaskTitles = new Set<string>();

  const titleMatch = lines.find((line) => /^#\s+/.test(line))?.match(/^#\s+(.+)$/);
  if (!titleMatch) {
    return {
      plan: null,
      violations: ['Plan is missing a top-level "# Title" heading'],
    };
  }

  const sections = buildSections(lines);
  const findSection = (title: string) => sections.find((section) => section.title === title);

  const purposeSection = findSection("Purpose");
  const tasksSection = findSection("Tasks");
  const metadataSection = findSection("Metadata");
  const architectureOverviewSection = findSection("Architecture Overview");
  const technicalDecisionsSection = findSection("Technical Decisions");
  const backwardsCompatibilitySection = findSection("Backwards Compatibility");
  const securityConsiderationsSection = findSection("Security Considerations");
  const testingStrategySection = findSection("Testing Strategy");
  const qaRequired = Boolean(findSection("QA Required"));

  if (!purposeSection) {
    violations.push('Plan is missing required "## Purpose" section');
  }
  if (!tasksSection) {
    violations.push('Plan is missing required "## Tasks" section');
  }

  const purpose = purposeSection ? readSectionBody(lines, purposeSection) : "";

  if (purposeSection && !purpose) {
    violations.push('Plan "## Purpose" section must not be empty');
  }

  const references = parseMetadataSection(lines, metadataSection, violations);

  const tasks: ParsedPlanTask[] = [];

  if (tasksSection) {
    let index = tasksSection.start + 1;

    while (index < tasksSection.end) {
      const line = lines[index];
      if (!line.trim()) {
        index += 1;
        continue;
      }

      const headerMatch = line.match(TASK_HEADER_RE);
      if (!headerMatch) {
        violations.push(`Unexpected content in ## Tasks section: "${line.trim()}"`);
        index += 1;
        continue;
      }

      const status = symbolToStatus(headerMatch[1]);
      const title = headerMatch[2].trim();
      const size = headerMatch[3] as TaskSize;

      if (seenTaskTitles.has(title)) {
        violations.push(`Duplicate task title "${title}"`);
      } else {
        seenTaskTitles.add(title);
      }

      let end = index + 1;
      while (end < tasksSection.end && !lines[end].match(TASK_HEADER_RE)) {
        end += 1;
      }

      tasks.push(parseTaskBlock(title, status, size, lines, index, end, violations));
      index = end;
    }
  }

  if (tasks.length === 0) {
    violations.push("Plan must contain at least one task in the ## Tasks section");
  }

  return {
    plan: {
      path: planPath,
      title: titleMatch[1].trim(),
      purpose,
      references,
      architectureOverview: readSectionBody(lines, architectureOverviewSection),
      technicalDecisions: readSectionBody(lines, technicalDecisionsSection),
      backwardsCompatibility: readSectionBody(lines, backwardsCompatibilitySection),
      securityConsiderations: readSectionBody(lines, securityConsiderationsSection),
      testingStrategy: readSectionBody(lines, testingStrategySection),
      tasks,
      qaRequired,
    },
    violations,
  };
}

export function parsePlanContent(content: string, planPath: string): ParsedPlan {
  const inspection = inspectPlanContent(content, planPath);
  if (inspection.violations.length > 0 || !inspection.plan) {
    throw new Error(inspection.violations.join(" | "));
  }
  return inspection.plan;
}

export async function resolvePlanPath(cwd: string, planName?: string): Promise<string> {
  const plansDir = resolve(cwd, ".opencode/plans");

  if (planName) {
    return resolve(plansDir, planName);
  }

  const entries = await readdir(plansDir);
  const mdFiles = entries.filter((name) => name.endsWith(".md") && name !== "README.md");

  if (mdFiles.length === 0) {
    throw new Error("No plan files found in .opencode/plans/");
  }

  const files = await Promise.all(
    mdFiles.map(async (name) => {
      const path = resolve(plansDir, name);
      const stats = await stat(path);
      return {
        path,
        mtimeMs: stats.mtimeMs,
      };
    }),
  );

  return files.sort((a, b) => b.mtimeMs - a.mtimeMs)[0].path;
}

export function findTask(plan: ParsedPlan, taskName: string): ParsedPlanTask {
  const task = plan.tasks.find((candidate) => candidate.title === taskName);
  if (!task) {
    throw new Error(`Task not found: ${taskName}`);
  }
  return task;
}

function formatInlineList(items: string[]): string {
  return items.length > 0 ? items.join(", ") : "None";
}

export function renderTaskBlock(task: ParsedPlanTask, overrides?: Partial<ParsedPlanTask>): string[] {
  const next: ParsedPlanTask = {
    ...task,
    ...overrides,
    refs: overrides?.refs ?? task.refs,
    steps: overrides?.steps ?? task.steps,
    files: overrides?.files ?? task.files,
    dependencies: overrides?.dependencies ?? task.dependencies,
    contextTags: overrides?.contextTags ?? task.contextTags,
    produces: overrides?.produces ?? task.produces,
    consumes: overrides?.consumes ?? task.consumes,
    actualFiles: overrides?.actualFiles ?? task.actualFiles,
    runtimeWarnings: overrides?.runtimeWarnings ?? task.runtimeWarnings,
  };

  const lines = [
    `- [${statusToSymbol(next.status)}] **${next.title}** (${next.size})`,
    `  - Purpose: ${next.purpose}`,
    `  - Acceptance: ${next.acceptance}`,
    "  - Steps:",
    ...next.steps.map((step) => `    - ${step}`),
    `  - Files: ${formatInlineList(next.files)}`,
    `  - Dependencies: ${formatInlineList(next.dependencies)}`,
  ];

  if (next.contextTags.length > 0) {
    lines.push(`  - Context Tags: ${formatInlineList(next.contextTags)}`);
  }

  if (next.produces.length > 0) {
    lines.push(`  - Produces: ${formatInlineList(next.produces)}`);
  }

  if (next.consumes.length > 0) {
    lines.push(`  - Consumes: ${formatInlineList(next.consumes)}`);
  }

  if (next.refs.length > 0) {
    lines.push(`  - Refs: ${formatInlineList(next.refs)}`);
  }

  if (next.commitNotes) {
    const noteLines = next.commitNotes.split("\n");
    lines.push(`  - Commit Notes: ${noteLines[0]}`);
    for (const continuation of noteLines.slice(1)) {
      lines.push(`    ${continuation}`);
    }
  }

  if (next.actualFiles.length > 0) {
    lines.push(`  - Actual Files: ${formatInlineList(next.actualFiles)}`);
  }

  if (next.notes) {
    const noteLines = next.notes.split("\n");
    lines.push(`  - Notes: ${noteLines[0]}`);
    for (const continuation of noteLines.slice(1)) {
      lines.push(`    ${continuation}`);
    }
  }

  for (const warning of next.runtimeWarnings) {
    lines.push(`  ${warning}`);
  }

  return lines;
}

export function replaceTaskInContent(content: string, task: ParsedPlanTask, nextBlock: string[]): string {
  const normalized = normalizeLineEndings(content);
  const lines = normalized.split("\n");
  lines.splice(task.startLine, task.endLineExclusive - task.startLine, ...nextBlock);
  return `${lines.join("\n")}${normalized.endsWith("\n") ? "\n" : ""}`;
}

export function uniqueList(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}
