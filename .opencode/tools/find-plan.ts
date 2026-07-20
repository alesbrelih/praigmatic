import { tool } from "@opencode-ai/plugin";
import { readdir, stat } from "node:fs/promises";
import { resolve } from "node:path";

export default tool({
  description: "Find the most recent plan file in .opencode/plans/ or use provided name",
  args: {
    planName: tool.schema.string().optional().describe("Optional plan file name (without .opencode/plans/ prefix)"),
    plansDir: tool.schema.string().optional().describe("Optional plans directory (default: .opencode/plans/)"),
  },
  async execute({ planName, plansDir: plansDirArg }, context) {
    try {
      const directory = context?.directory ?? process.cwd();
      const plansDir = resolve(directory, plansDirArg ?? ".opencode/plans");

      if (planName) {
        const path = resolve(plansDir, planName);
        try {
          await stat(path);
          return path;
        } catch {
          return `Error: Plan file not found: ${path}`;
        }
      }

      let entries: string[];

      try {
        entries = await readdir(plansDir);
      } catch {
        return `Error: Plans directory does not exist (looked in ${plansDir})`;
      }

      const mdFiles = entries.filter(
        (name) => name.endsWith(".md") && name !== "README.md"
      );

      if (mdFiles.length === 0) {
        return `Error: No plan files found in ${plansDir}`;
      }

      const filesWithStats = await Promise.all(
        mdFiles.map(async (name) => {
          const path = resolve(plansDir, name);
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
