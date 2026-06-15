import { tool } from "@opencode-ai/plugin";
import { execSync } from "node:child_process";

export default tool({
  description: "Returns the current git commit hash (short form)",
  args: {
    full: tool.schema.boolean().optional().describe("Return full 40-character hash"),
  },
  async execute({ full }) {
    try {
      const args = full ? "HEAD" : "--short HEAD";
      const commit = execSync(`git rev-parse ${args}`, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      return commit || "Unknown";
    } catch {
      return "Unknown";
    }
  },
});
