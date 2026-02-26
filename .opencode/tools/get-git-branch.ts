import { tool } from "@opencode-ai/plugin";
import { execSync } from "node:child_process";

export default tool({
  description: "Returns the current git branch name",
  args: {},
  async execute() {
    try {
      const branch = execSync("git branch --show-current", {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }).trim();
      return branch || "HEAD";
    } catch {
      return "Unknown";
    }
  },
});