import { tool } from "@opencode-ai/plugin";
import { buildQaRetryPacket } from "./lib/implementation-context.js";

type QaIssueRow = {
  type: "new" | "preexisting";
  effort?: "small" | "medium" | "large";
  severity: string;
  description: string;
  evidence: string;
};

function extractStatus(output: string): "passed" | "partial" | "failed" {
  if (/QA Passed/i.test(output)) return "passed";
  if (/QA Partial/i.test(output)) return "partial";
  return "failed";
}

function extractSummary(output: string): string {
  const summaryMatch = output.match(/\*\*Summary:\*\*\s*(.+)/i);
  if (summaryMatch) return summaryMatch[1].trim();

  const blockerMatch = output.match(/\*\*Blocker:\*\*\s*(.+?)(?:\s+\|\s+\*\*Error:\*\*|$)/i);
  const errorMatch = output.match(/\*\*Error:\*\*\s*(.+)/i);
  if (blockerMatch || errorMatch) {
    return [blockerMatch?.[1], errorMatch?.[1]].filter(Boolean).join(" | ").trim();
  }

  return "";
}

function parseIssueTable(output: string): QaIssueRow[] {
  const issuesSectionMatch = output.match(
    /\*\*Issues Found:\*\*\s*([\s\S]*?)(?:\n\*\*Issue Classification:\*\*|\n\*\*Summary:\*\*|$)/i,
  );
  if (!issuesSectionMatch) return [];

  const rows = issuesSectionMatch[1]
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"));

  const dataRows = rows.slice(2);
  return dataRows
    .map((row) => row.split("|").map((cell) => cell.trim()).filter(Boolean))
    .filter((cells) => cells.length >= 6)
    .map((cells) => {
      const type = cells[1].toLowerCase() === "preexisting" ? "preexisting" : "new";
      const effortValue = cells[2].toLowerCase();
      return {
        type,
        effort:
          effortValue === "small" || effortValue === "medium" || effortValue === "large"
            ? effortValue
            : undefined,
        severity: cells[3],
        description: cells[4],
        evidence: cells[5],
      };
    });
}

function classifyIssues(rows: QaIssueRow[]) {
  const fixableIssues = [];
  const skippedIssues = [];

  for (const row of rows) {
    const normalized = {
      title: `${row.severity} runtime issue`,
      summary: row.description,
      recommendation: row.evidence ? `Investigate evidence: ${row.evidence}` : "",
      type: row.type,
      effort: row.effort,
    };

    if (row.type === "preexisting" && row.effort === "large") {
      skippedIssues.push(normalized);
      continue;
    }

    fixableIssues.push(normalized);
  }

  return { fixableIssues, skippedIssues };
}

function extractFilesOrAreas(output: string): string[] {
  const matches = output.match(
    /(?:[A-Za-z0-9_.-]+\/)+[A-Za-z0-9_.-]+|[A-Za-z0-9_.-]+\.(?:ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|json|ya?ml|toml|md)/g,
  );

  return [...new Set((matches ?? []).map((item) => item.trim()).filter(Boolean))];
}

export default tool({
  description:
    "Parse pragmatic-qa output into a structured QA retry packet with fixable and skipped issues",
  args: {
    output: tool.schema.string().describe("Full QA agent output"),
  },
  async execute({ output }) {
    try {
      const status = extractStatus(output);
      const summary = extractSummary(output);
      const issueRows = parseIssueTable(output);
      const { fixableIssues, skippedIssues } = classifyIssues(issueRows);

      if (status === "failed" && fixableIssues.length === 0 && skippedIssues.length === 0) {
        const blockerMatch = output.match(/\*\*Blocker:\*\*\s*(.+?)(?:\s+\|\s+\*\*Error:\*\*|$)/i);
        const errorMatch = output.match(/\*\*Error:\*\*\s*(.+)/i);

        fixableIssues.push({
          title: "QA blocker",
          summary: blockerMatch?.[1]?.trim() ?? "Runtime validation failed.",
          recommendation: errorMatch?.[1]?.trim() ?? "",
          type: "new",
        });
      }

      const packet = buildQaRetryPacket({
        status,
        summary,
        fixable_issues: fixableIssues,
        skipped_issues: skippedIssues,
        files_or_areas_implicated: extractFilesOrAreas(output),
      });

      return JSON.stringify({
        kind: packet.kind,
        status: packet.status,
        summary: packet.summary,
        fixable_issues: packet.fixableIssues,
        skipped_issues: packet.skippedIssues,
        files_or_areas_implicated: packet.filesOrAreasImplicated,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Failed to parse QA result: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
