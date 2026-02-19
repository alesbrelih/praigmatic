import { tool } from "@opencode-ai/plugin";
import { execSync } from "node:child_process";

export default tool({
  description: "Validate git state - check for uncommitted changes",
  args: {
    allowUncommitted: tool.schema.boolean().optional().describe("Whether to allow uncommitted changes"),
  },
  async execute({ allowUncommitted }) {
    try {
      // Check for uncommitted changes
      let hasChanges: boolean;
      try {
        execSync("git diff-index --quiet HEAD --", { stdio: "pipe" });
        hasChanges = false;
      } catch {
        hasChanges = true;
      }

      if (allowUncommitted) {
        return JSON.stringify({
          valid: true,
          message: "Uncommitted changes allowed",
          files: [],
        });
      }

      if (!hasChanges) {
        return JSON.stringify({
          valid: true,
          message: "Git state is clean",
          files: [],
        });
      }

      // Get changed files
      const status = execSync("git status --short", { encoding: "utf-8" });
      const files = status.trim().split('\n').filter(f => f);

      return JSON.stringify({
        valid: false,
        message: "Uncommitted changes detected",
        files: files,
      });
    } catch (error) {
      return JSON.stringify({
        valid: false,
        message: `Error checking git state: ${error instanceof Error ? error.message : String(error)}`,
        files: [],
      });
    }
  },
});
