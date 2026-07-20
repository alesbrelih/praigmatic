import { tool } from "@opencode-ai/plugin";
import { rename, mkdir, access, constants } from "node:fs/promises";
import { basename, dirname, resolve } from "node:path";
import { existsSync } from "node:fs";

export default tool({
  description: "Move a plan file to the archive directory with a timestamp suffix",
  args: {
    planPath: tool.schema.string().describe("Path to the plan file to archive"),
    archiveDir: tool.schema.string().optional().describe("Optional archive directory (default: .opencode/plans/archive/)"),
  },
  async execute(args, context) {
    try {
      const directory = context?.directory ?? process.cwd();
      const planPath = resolve(directory, args.planPath);

      // Validate that source file exists and is readable
      await access(planPath, constants.R_OK);

      const sourceBasename = basename(planPath, '.md');
      const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const archiveFilename = `${sourceBasename}-${timestamp}.md`;
      const archiveDir = resolve(directory, args.archiveDir ?? ".opencode/plans/archive");
      const archivePath = resolve(archiveDir, archiveFilename);

      if (existsSync(archivePath)) {
        throw new Error(`Archive file already exists: ${archivePath}`);
      }

      await mkdir(archiveDir, { recursive: true });
      await rename(planPath, archivePath);

      return archivePath;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to archive plan: ${message}`);
    }
  },
});
