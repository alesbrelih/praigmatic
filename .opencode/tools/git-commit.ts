import { tool } from "@opencode-ai/plugin";
import { execSync } from "node:child_process";

export default tool({
  description: "Creates a git commit with proper multiline message handling",
  args: {
    type: tool.schema.string().describe("Commit type: feat, fix, docs, style, refactor, test, chore"),
    scope: tool.schema.string().optional().describe("Optional scope"),
    subject: tool.schema.string().describe("Commit subject line (short description)"),
    body: tool.schema.string().optional().describe("Commit body - longer explanation"),
    refs: tool.schema.string().optional().describe("References (e.g., JIRA-123, GitHub #456)"),
    noVerify: tool.schema.boolean().optional().describe("Skip pre-commit hooks"),
  },
  async execute({ type, scope, subject, body, refs, noVerify }) {
    try {
      const verifyFlag = noVerify ? "--no-verify" : "";
      
      const subjectLine = scope 
        ? `${type}(${scope}): ${subject}` 
        : `${type}: ${subject}`;

      let cmd = `git commit ${verifyFlag} -m "${subjectLine}"`;
      
      if (body) {
        cmd += ` -m "${body}"`;
      }
      
      if (refs) {
        cmd += ` -m "Refs: ${refs}"`;
      }

      const result = execSync(cmd, {
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
        shell: true,
      });

      return JSON.stringify({
        success: true,
        message: `Committed: ${subjectLine}`,
        output: result,
      });
    } catch (error) {
      return JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
});