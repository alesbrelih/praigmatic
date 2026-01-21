import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Find the most recent plan file in .opencode/plans/ or use provided name",
  args: {
    planName: tool.schema.string().optional().describe("Optional plan file name (without .opencode/plans/ prefix)"),
  },
  async execute({ planName }) {
    try {
      if (planName) {
        const path = `.opencode/plans/${planName}`;
        const exists = await Bun.file(path).exists();
        if (!exists) {
          return `Error: Plan file not found: ${path}`;
        }
        return path;
      }

      // Find most recent .md file using Bun file system API
      const plansDir = ".opencode/plans";
      const dirExists = await Bun.file(plansDir).exists();

      if (!dirExists) {
        return "Error: .opencode/plans/ directory does not exist";
      }

      // Read directory entries
      const entries: string[] = [];
      for await (const entry of Bun.fs.scan(plansDir, { recursive: false })) {
        if (!entry.isDirectory && entry.name.endsWith(".md") && entry.name !== "README.md") {
          entries.push(entry.path);
        }
      }

      if (entries.length === 0) {
        return "Error: No plan files found in .opencode/plans/";
      }

      // Get file stats to sort by modification time
      const filesWithStats = await Promise.all(
        entries.map(async (path) => {
          const stat = await Bun.file(path).stat();
          return { path, mtimeMs: stat.mtimeMs };
        })
      );

      // Sort by modification time (most recent first) and get the first one
      const mostRecent = filesWithStats
        .sort((a, b) => b.mtimeMs - a.mtimeMs)[0];

      return mostRecent.path;
    } catch (error) {
      return `Error finding plan: ${error.message}`;
    }
  },
});
