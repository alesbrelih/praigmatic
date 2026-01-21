import { tool } from "@opencode-ai/plugin";
import { rename, mkdir, access, constants } from "node:fs/promises";
import { basename, dirname } from "node:path";
import { existsSync } from "node:fs";

export default tool({
  description: "Move a plan file to the archive directory with a timestamp suffix",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file to archive"),
  },
  async execute(args) {
    try {
      // Validate that source file exists and is readable
      await access(args.planPath, constants.R_OK);

      // Extract the basename from the plan path using Node.js path utilities
      // Remove .md extension to prevent double extension (e.g., plan.md-2026-01-21.md)
      const sourceBasename = basename(args.planPath, '.md');

      // Generate timestamp for the archive file using JavaScript Date API
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

      // Generate new archive filename with timestamp before .md extension
      const archiveFilename = `${sourceBasename}-${timestamp}.md`;
      const archivePath = `.opencode/plans/archive/${archiveFilename}`;

      // Check if archive already exists to prevent overwrites
      if (existsSync(archivePath)) {
        throw new Error(`Archive file already exists: ${archivePath}`);
      }

      // Ensure archive directory exists using Node.js mkdir with recursive flag
      await mkdir(dirname(archivePath), { recursive: true });

      // Move the plan file to archive using Node.js rename API (prevents shell injection)
      await rename(args.planPath, archivePath);

      return archivePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to archive plan: ${message}`);
    }
  },
});
