import { tool } from "@opencode-ai/plugin";
import { execSync } from "node:child_process";

export default tool({
  description: "Validate git state - check for uncommitted changes",
  args: {
    allowUncommitted: tool.schema.boolean().optional().describe("Whether to allow uncommitted changes"),
  },
  async execute({ allowUncommitted }) {
    try {
      if (allowUncommitted) {
        return JSON.stringify({
          valid: true,
          message: "Uncommitted changes allowed",
          files: [],
        });
      }

      const status = execSync("git status --short", { encoding: "utf-8" });
      const files = status
        .split("\n")
        .map((line) => line.trimEnd())
        .filter((line) => line);

      if (files.length === 0) {
        return JSON.stringify({
          valid: true,
          message: "Git state is clean",
          files: [],
        });
      }

      return JSON.stringify({
        valid: false,
        message: "Uncommitted changes detected",
        files,
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
