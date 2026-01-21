import { tool } from "@opencode-ai/plugin";
import { readdir, stat } from "node:fs/promises";

export default tool({
  description: "Find the most recent plan file in .opencode/plans/ or use provided name",
  args: {
    planName: tool.schema.string().optional().describe("Optional plan file name (without .opencode/plans/ prefix)"),
  },
  async execute({ planName }) {
    try {
      if (planName) {
        const path = `.opencode/plans/${planName}`;
        try {
          await stat(path);
          return path;
        } catch {
          return `Error: Plan file not found: ${path}`;
        }
      }

      const plansDir = ".opencode/plans";
      let entries: string[];
      
      try {
        entries = await readdir(plansDir);
      } catch {
        return "Error: .opencode/plans/ directory does not exist";
      }

      const mdFiles = entries.filter(
        (name) => name.endsWith(".md") && name !== "README.md"
      );

      if (mdFiles.length === 0) {
        return "Error: No plan files found in .opencode/plans/";
      }

      const filesWithStats = await Promise.all(
        mdFiles.map(async (name) => {
          const path = `${plansDir}/${name}`;
          const stats = await stat(path);
          return { path, mtimeMs: stats.mtimeMs };
        })
      );

      const mostRecent = filesWithStats.sort((a, b) => b.mtimeMs - a.mtimeMs)[0];
      return mostRecent.path;
    } catch (error) {
      return `Error finding plan: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
