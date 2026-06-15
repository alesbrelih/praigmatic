import { tool } from "@opencode-ai/plugin";
import { readFile, stat } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectPlanContent, resolvePlanPath } from "./lib/plan-workflow.js";

export default tool({
  description: "Parse a plan file into structured JSON using the canonical executable task contract",
  args: {
    planName: tool.schema.string().optional().describe("Optional plan file name in .opencode/plans/; defaults to the most recent plan"),
  },
  async execute({ planName }) {
    try {
      const planPath = await resolvePlanPath(process.cwd(), planName);
      await stat(planPath);
      const content = await readFile(planPath, "utf-8");
      const inspection = inspectPlanContent(content, planPath);

      if (inspection.violations.length > 0 || !inspection.plan) {
        return JSON.stringify({
          error: "Plan validation failed",
          planPath,
          violations: inspection.violations,
        });
      }

      return JSON.stringify(inspection.plan);
    } catch (error) {
      return JSON.stringify({
        error: `Failed to parse plan: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
