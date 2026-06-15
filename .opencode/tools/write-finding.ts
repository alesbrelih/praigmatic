import { tool } from "@opencode-ai/plugin";
import { readdir, stat, mkdir, writeFile } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";

const VALID_SEVERITIES = new Set(["Critical", "High", "Medium", "Low", "Info"]);

async function findScopeRoot(startDir: string): Promise<string | null> {
  let dir = startDir;
  const root = resolve("/");
  while (dir !== root) {
    const hasAgents = stat(resolve(dir, "AGENTS.md")).then(() => true).catch(() => false);
    const hasPlans = stat(resolve(dir, "plans")).then((s) => s.isDirectory()).catch(() => false);
    const [a, p] = await Promise.all([hasAgents, hasPlans]);
    if (a && p) return dir;
    dir = dirname(dir);
  }
  return null;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function nextFindingNumber(findingsDir: string): Promise<number> {
  let existing: string[];
  try {
    existing = await readdir(findingsDir);
  } catch {
    return 1;
  }
  let max = 0;
  for (const file of existing) {
    const match = file.match(/^(\d{3})-/);
    if (match) {
      const n = parseInt(match[1], 10);
      if (n > max) max = n;
    }
  }
  return max + 1;
}

function buildContent(opts: {
  title: string;
  severity: string;
  affectedAsset: string;
  description: string;
  stepsToReproduce: string;
  evidenceReferences: string[];
  impact: string;
  remediation: string;
  retestInstructions: string;
  extras: Record<string, string>;
}): string {
  const tableRows = [
    `| Severity | ${opts.severity} |`,
    `| Affected Asset | ${opts.affectedAsset} |`,
    `| Status | New |`,
    `| Verification |  |`,
    `| Verified |  |`,
    `| SysReptor ID |  |`,
    `| Debate Record |  |`,
  ];

  for (const [key, value] of Object.entries(opts.extras)) {
    tableRows.push(`| ${key} | ${value} |`);
  }

  const evidenceSection = opts.evidenceReferences
    .map((ref) => `- \`${ref}\``)
    .join("\n");

  return `# ${opts.title}

| Field | Value |
|-------|-------|
${tableRows.join("\n")}

## Description

${opts.description}

## Steps to Reproduce

${opts.stepsToReproduce}

## Evidence References

${evidenceSection}

## Impact

${opts.impact}

## Remediation

${opts.remediation}

## Retest Instructions

${opts.retestInstructions}
`;
}

export default tool({
  description: "Write a pentest finding file with the canonical template format. Validates required fields and auto-generates a numbered filename under the specified plan's findings/ directory.",
  args: {
    plan: tool.schema.string().describe("Plan directory name under plans/ (e.g. '01-reconnaissance')"),
    title: tool.schema.string().describe("One-line finding synopsis (becomes H1 heading)"),
    severity: tool.schema.string().describe("Severity level: Critical, High, Medium, Low, or Info"),
    affectedAsset: tool.schema.string().describe("Concrete host, URL, endpoint, parameter, or service affected"),
    description: tool.schema.string().describe("Technical explanation of the issue (markdown)"),
    stepsToReproduce: tool.schema.string().describe("Numbered reproduction steps with commands/endpoints/payloads (markdown)"),
    evidenceReferences: tool.schema.array(tool.schema.string()).describe("List of evidence file paths (at least one required, e.g. ['evidence/20260611-sqli.md'])"),
    impact: tool.schema.string().describe("Realistic business/technical consequence (markdown)"),
    remediation: tool.schema.string().describe("Specific fix guidance (markdown)"),
    retestInstructions: tool.schema.string().describe("Exact steps so someone else can independently confirm the finding (markdown)"),
    extras: tool.schema.record(tool.schema.string(), tool.schema.string()).optional().describe("Additional key-value pairs to add as table rows (e.g. { Source: 'config/app.json' })"),
    folder: tool.schema.string().optional().describe("Directory to start scope search from (defaults to process.cwd())"),
  },
  async execute({ plan, title, severity, affectedAsset, description, stepsToReproduce, evidenceReferences, impact, remediation, retestInstructions, extras, folder }) {
    try {
      if (!VALID_SEVERITIES.has(severity)) {
        return JSON.stringify({
          error: `Invalid severity '${severity}'. Must be one of: ${[...VALID_SEVERITIES].join(", ")}`,
        });
      }

      if (!evidenceReferences || evidenceReferences.length === 0) {
        return JSON.stringify({
          error: "At least one evidence reference is required.",
        });
      }

      const startDir = folder ? resolve(process.cwd(), folder) : process.cwd();
      const scopeRoot = await findScopeRoot(startDir);

      if (!scopeRoot) {
        return JSON.stringify({
          error: "No pentest scope found. Run this from within a scope directory (containing AGENTS.md and plans/).",
        });
      }

      const planDir = resolve(scopeRoot, "plans", plan);
      try {
        const s = await stat(planDir);
        if (!s.isDirectory()) {
          return JSON.stringify({ error: `Plan directory not found: plans/${plan}` });
        }
      } catch {
        return JSON.stringify({ error: `Plan directory not found: plans/${plan}` });
      }

      const findingsDir = resolve(planDir, "findings");
      await mkdir(findingsDir, { recursive: true });

      const num = await nextFindingNumber(findingsDir);
      const slug = slugify(title) || "finding";
      const filename = `${String(num).padStart(3, "0")}-${slug}.md`;
      const filePath = resolve(findingsDir, filename);

      const content = buildContent({
        title,
        severity,
        affectedAsset,
        description,
        stepsToReproduce,
        evidenceReferences,
        impact,
        remediation,
        retestInstructions,
        extras: extras ?? {},
      });

      await writeFile(filePath, content, "utf-8");

      return JSON.stringify({
        path: join("plans", plan, "findings", filename),
        filename,
        number: num,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Error writing finding: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
