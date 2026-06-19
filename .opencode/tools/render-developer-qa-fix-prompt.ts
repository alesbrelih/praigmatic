import { tool } from "@opencode-ai/plugin";
import {
  renderDeveloperQaFixPrompt,
  type QaRetryPacketOutput,
} from "./lib/implementation-prompts.js";

function parseQaRetryPacket(value: string): QaRetryPacketOutput {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("qaRetryPacketJson must be a JSON object");
  }

  const packet = parsed as Record<string, unknown>;
  if (packet.kind !== "qa_retry_packet") {
    throw new Error("qaRetryPacketJson must be a qa_retry_packet");
  }
  if (
    typeof packet.status !== "string" ||
    typeof packet.summary !== "string" ||
    !Array.isArray(packet.fixable_issues) ||
    !Array.isArray(packet.skipped_issues)
  ) {
    throw new Error("qaRetryPacketJson is missing required QA retry fields");
  }

  return parsed as QaRetryPacketOutput;
}

function parseRelevantFiles(value?: string): string[] | undefined {
  if (!value) return undefined;
  const parsed = JSON.parse(value) as unknown;
  if (!Array.isArray(parsed)) {
    throw new Error("relevantFilesJson must be a JSON array");
  }
  return parsed.filter(
    (item): item is string => typeof item === "string" && item.trim().length > 0,
  );
}

export default tool({
  description:
    "Render the pragmatic developer QA fix prompt from a structured QA retry packet",
  args: {
    qaRetryPacketJson: tool.schema.string().describe("JSON from parse-qa-result"),
    planPurpose: tool.schema.string().optional().describe("Optional plan purpose summary"),
    relevantFilesJson: tool.schema
      .string()
      .optional()
      .describe("Optional JSON array of relevant files modified during implementation"),
  },
  async execute({ qaRetryPacketJson, planPurpose, relevantFilesJson }) {
    try {
      return renderDeveloperQaFixPrompt(parseQaRetryPacket(qaRetryPacketJson), {
        planPurpose,
        relevantFiles: parseRelevantFiles(relevantFilesJson),
      });
    } catch (error) {
      return `ERROR: Failed to render developer QA fix prompt: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
