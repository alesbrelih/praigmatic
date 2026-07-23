import { tool } from "@opencode-ai/plugin";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";

function isPathTraversal(p: string): boolean {
  return p.includes("..");
}

export default tool({
  description: "Read and return the full content of a named knowledge file from .praigmatic/knowledge/",
  args: {
    file: tool.schema.string().describe("Knowledge file name (e.g., agents.md)"),
    knowledgeDir: tool.schema.string().optional().describe("Optional knowledge directory (default: .praigmatic/knowledge/)"),
  },
  async execute({ file, knowledgeDir: knowledgeDirArg }, context) {
    try {
      if (!file) {
        return "Error: 'file' argument is required.";
      }

      if (!file.endsWith(".md")) {
        return `Error: 'file' must end with .md (received: ${file})`;
      }

      if (isPathTraversal(file)) {
        return `Error: Path traversal ('..') is not allowed in file argument (received: ${file})`;
      }

      const directory = context?.directory ?? process.cwd();
      const knowledgeDir = resolve(directory, knowledgeDirArg ?? ".praigmatic/knowledge");
      const filePath = resolve(knowledgeDir, file);

      // Verify resolved path is still inside the knowledge directory
      if (!filePath.startsWith(resolve(knowledgeDir) + "/")) {
        return "Error: Resolved path escapes the knowledge directory.";
      }

      let content: string;
      try {
        content = await readFile(filePath, "utf-8");
      } catch {
        // File not found — list available files
        let entries: string[];
        try {
          entries = await readdir(knowledgeDir);
        } catch {
          return `Error: Knowledge file '${file}' not found and the knowledge directory does not exist (looked in ${knowledgeDir})`;
        }

        const mdFiles = entries.filter((name) => name.endsWith(".md")).sort();
        const available = mdFiles.map((name) => `  - ${name}`).join("\n");
        return `Error: Knowledge file '${file}' not found in ${knowledgeDir}\n\nAvailable files:\n${available}`;
      }

      return content;
    } catch (error) {
      return `Error reading knowledge file: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
