import { tool } from "@opencode-ai/plugin";
import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, dirname, join } from "node:path";

const VERIFIED_STATES = new Set([
  "confirmed",
  "downgraded",
  "false positive",
  "insufficient evidence",
]);

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

function stripMarkdown(text: string): string {
  return text.replace(/\*{1,2}(.*?)\*{1,2}/g, "$1").replace(/_{1,2}(.*?)_{1,2}/g, "$1").replace(/`{1,3}(.*?)`{1,3}/g, "$1").trim();
}

function parseVerification(content: string): string {
  const tableRowRegex = /\|\s*Verification\s*\|\s*(.*?)\s*\|/i;
  const tableMatch = content.match(tableRowRegex);
  if (tableMatch) return stripMarkdown(tableMatch[1].trim());
  const boldRegex = /\*\*Verification\*\*:?\s*:?\s*([^\n*]+)/mi;
  const boldMatch = content.match(boldRegex);
  return boldMatch ? stripMarkdown(boldMatch[1].trim()) : "";
}

function parseTitle(content: string): string {
  const match = content.match(/^#\s+(.+)$/m);
  return match ? match[1].trim() : "";
}

function parseSeverity(content: string): string {
  const tableMatch = content.match(/\|\s*Severity\s*\|\s*(.*?)\s*\|/i);
  if (tableMatch) return tableMatch[1].trim();
  const boldMatch = content.match(/\*\*Severity\*\*.?\s*:?\s*([^\n*]+)/mi);
  return boldMatch ? boldMatch[1].trim() : "";
}

function isUnverified(verification: string): boolean {
  if (!verification) return true;
  if (/^pending$/i.test(verification)) return true;
  const lower = verification.toLowerCase();
  for (const state of VERIFIED_STATES) {
    if (lower === state || lower.startsWith(state + " ") || lower.startsWith(state + "(")) {
      return false;
    }
  }
  return true;
}

export default tool({
  description: "Find the next unverified finding in a pentest scope. Scans plans/*/findings/*.md for findings with empty or Pending Verification field. Accepts a skip parameter to skip N unverified findings, and a folder parameter to specify the scope directory (useful when running from outside the assessment directory).",
  args: {
    skip: tool
      .schema
      .number()
      .optional()
      .default(0)
      .describe("Number of unverified findings to skip before returning the next one"),
    folder: tool
      .schema
      .string()
      .optional()
      .describe("Directory to start scope search from (defaults to process.cwd()). Use when running from outside the assessment directory, e.g. 'assessments/client-2025'"),
  },
  async execute({ skip = 0, folder }) {
    try {
      const startDir = folder ? resolve(process.cwd(), folder) : process.cwd();
      const scopeRoot = await findScopeRoot(startDir);

      if (!scopeRoot) {
        return JSON.stringify({
          error: "No pentest scope found. Run this from within a scope directory (containing AGENTS.md and plans/).",
        });
      }

      const plansDir = resolve(scopeRoot, "plans");
      let planEntries: string[];
      try {
        planEntries = await readdir(plansDir);
      } catch {
        return JSON.stringify({
          scopeRoot,
          error: "plans/ directory does not exist or is not readable.",
        });
      }

      const findings: Array<{
        title: string;
        severity: string;
        verification: string;
        plan: string;
        path: string;
      }> = [];

      for (const planDir of planEntries) {
        const findingsDir = resolve(plansDir, planDir, "findings");
        let findingFiles: string[];
        try {
          const s = await stat(findingsDir);
          if (!s.isDirectory()) continue;
          findingFiles = await readdir(findingsDir);
        } catch {
          continue;
        }

        for (const file of findingFiles) {
          if (!file.endsWith(".md")) continue;
          const filePath = resolve(findingsDir, file);
          const content = await readFile(filePath, "utf-8");
          const verification = parseVerification(content);
          const title = parseTitle(content);
          const severity = parseSeverity(content);

          if (isUnverified(verification)) {
            findings.push({
              title,
              severity,
              verification,
              plan: planDir,
              path: join("plans", planDir, "findings", file),
            });
          }
        }
      }

      if (findings.length === 0) {
        return JSON.stringify({
          scopeRoot,
          totalUnverified: 0,
          message: "All findings in this scope have been verified.",
        });
      }

      const index = skip;
      if (index >= findings.length) {
        return JSON.stringify({
          scopeRoot,
          totalUnverified: findings.length,
          error: `Skip value ${skip} exceeds total unverified findings (${findings.length}).`,
        });
      }

      const finding = findings[index];
      return JSON.stringify({
        scopeRoot,
        finding: {
          title: finding.title,
          severity: finding.severity,
          verification: finding.verification || "(empty)",
          plan: finding.plan,
          path: finding.path,
        },
        totalUnverified: findings.length,
        currentIndex: index,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Error finding unverified finding: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
