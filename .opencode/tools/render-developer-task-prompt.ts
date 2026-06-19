import { tool } from "@opencode-ai/plugin";
import {
  renderDeveloperTaskPrompt,
} from "./lib/implementation-prompts.js";
import type { DeveloperTaskPacket } from "./lib/implementation-context.js";

function parseDeveloperTaskPacket(value: string): DeveloperTaskPacket {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("developerTaskPacketJson must be a JSON object");
  }

  const packet = parsed as Record<string, unknown>;
  if (packet.kind !== "developer_task_packet") {
    throw new Error("developerTaskPacketJson must be a developer_task_packet");
  }
  if (typeof packet.taskName !== "string" || typeof packet.purpose !== "string") {
    throw new Error("developerTaskPacketJson is missing taskName or purpose");
  }
  if (!Array.isArray(packet.steps) || !Array.isArray(packet.files) || !Array.isArray(packet.dependencies)) {
    throw new Error("developerTaskPacketJson is missing required arrays");
  }

  return parsed as DeveloperTaskPacket;
}

export default tool({
  description:
    "Render the first-pass pragmatic developer prompt from a structured developer task packet",
  args: {
    developerTaskPacketJson: tool.schema
      .string()
      .describe("JSON from build-developer-task-packet"),
  },
  async execute({ developerTaskPacketJson }) {
    try {
      return renderDeveloperTaskPrompt(parseDeveloperTaskPacket(developerTaskPacketJson));
    } catch (error) {
      return `ERROR: Failed to render developer task prompt: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
