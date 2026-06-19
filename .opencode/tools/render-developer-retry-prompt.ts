import { tool } from "@opencode-ai/plugin";
import { renderDeveloperRetryPrompt } from "./lib/implementation-prompts.js";
import type {
  DeveloperTaskPacket,
  RetryPacket,
} from "./lib/implementation-context.js";

function parseRetryPacket(value: string): RetryPacket {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("retryPacketJson must be a JSON object");
  }

  const packet = parsed as Record<string, unknown>;
  if (packet.kind !== "retry_packet") {
    throw new Error("retryPacketJson must be a retry_packet");
  }
  if (typeof packet.summary !== "string" || !Array.isArray(packet.issues)) {
    throw new Error("retryPacketJson is missing summary or issues");
  }

  return parsed as RetryPacket;
}

function parseDeveloperTaskPacket(value: string): DeveloperTaskPacket {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("developerTaskPacketJson must be a JSON object");
  }

  const packet = parsed as Record<string, unknown>;
  if (packet.kind !== "developer_task_packet") {
    throw new Error("developerTaskPacketJson must be a developer_task_packet");
  }
  if (typeof packet.taskName !== "string" || !Array.isArray(packet.steps)) {
    throw new Error("developerTaskPacketJson is missing taskName or steps");
  }

  return parsed as DeveloperTaskPacket;
}

export default tool({
  description:
    "Render the pragmatic developer retry prompt from a retry packet and the current developer task packet",
  args: {
    retryPacketJson: tool.schema.string().describe("JSON from build-retry-packet"),
    developerTaskPacketJson: tool.schema
      .string()
      .describe("JSON from build-developer-task-packet for the same task"),
  },
  async execute({ retryPacketJson, developerTaskPacketJson }) {
    try {
      return renderDeveloperRetryPrompt(
        parseRetryPacket(retryPacketJson),
        parseDeveloperTaskPacket(developerTaskPacketJson),
      );
    } catch (error) {
      return `ERROR: Failed to render developer retry prompt: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
