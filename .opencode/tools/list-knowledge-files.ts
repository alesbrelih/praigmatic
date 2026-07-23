import { tool } from "@opencode-ai/plugin";
import { readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";

export default tool({
  description: "List all knowledge files in .praigmatic/knowledge/ with their document titles",
  args: {
    knowledgeDir: tool.schema.string().optional().describe("Optional knowledge directory (default: .praigmatic/knowledge/)"),
  },
  async execute({ knowledgeDir: knowledgeDirArg }, context) {
    try {
      const directory = context?.directory ?? process.cwd();
      const knowledgeDir = resolve(directory, knowledgeDirArg ?? ".praigmatic/knowledge");

      let entries: string[];

      try {
        entries = await readdir(knowledgeDir);
      } catch {
        return `Error: Knowledge directory does not exist (looked in ${knowledgeDir})`;
      }

      const mdFiles = entries
        .filter((name) => name.endsWith(".md"))
        .sort();

      if (mdFiles.length === 0) {
        return "No knowledge files found.";
      }

      const lines = await Promise.all(
        mdFiles.map(async (name) => {
          try {
            const content = await readFile(resolve(knowledgeDir, name), "utf-8");
            const titleMatch = content.match(/^#\s+(.+)$/m);
            if (titleMatch) {
              return `${name}: ${titleMatch[1].trim()}`;
            }
            return name;
          } catch {
            return name;
          }
        })
      );

      return lines.join("\n");
    } catch (error) {
      return `Error listing knowledge files: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
