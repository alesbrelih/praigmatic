import { tool } from "@opencode-ai/plugin";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { inspectPlanContent } from "./lib/plan-workflow.js";

export default tool({
  description: "Validate a plan file against the canonical executable task contract",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file to validate"),
  },
  async execute({ planPath }, context) {
    const directory = context?.directory ?? process.cwd();
    try {
      const absolutePath = resolve(directory, planPath);
      const content = await readFile(absolutePath, "utf-8");
      const inspection = inspectPlanContent(content, absolutePath);

      return JSON.stringify({
        valid: inspection.violations.length === 0,
        planPath: absolutePath,
        violations: inspection.violations,
      });
    } catch (error) {
      return JSON.stringify({
        valid: false,
        planPath: resolve(directory, planPath),
        violations: [
          `Failed to validate plan: ${error instanceof Error ? error.message : String(error)}`,
        ],
      });
    }
  },
});
