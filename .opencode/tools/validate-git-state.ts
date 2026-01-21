import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Validate git state - check for uncommitted changes",
  args: {
    allowUncommitted: tool.schema.boolean().optional().describe("Whether to allow uncommitted changes"),
  },
  async execute({ allowUncommitted }) {
    try {
      // Check for uncommitted changes
      const code = await Bun.$`git diff-index --quiet HEAD --`.exitCode;

      // If allowUncommitted is true, always return valid
      if (allowUncommitted) {
        return JSON.stringify({
          valid: true,
          message: "Uncommitted changes allowed",
          files: [],
        });
      }

      if (code === 0) {
        return JSON.stringify({
          valid: true,
          message: "Git state is clean",
          files: [],
        });
      }

      // Get changed files
      const status = await Bun.$`git status --short`.text();

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
