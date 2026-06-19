import { tool } from "@opencode-ai/plugin";
import { renderCodeReviewPrompt } from "./lib/implementation-prompts.js";
import type { ReviewPacket } from "./lib/implementation-context.js";

function parseReviewPacket(value: string): ReviewPacket {
  const parsed = JSON.parse(value) as unknown;
  if (!parsed || typeof parsed !== "object") {
    throw new Error("reviewPacketJson must be a JSON object");
  }

  const packet = parsed as Record<string, unknown>;
  if (packet.kind !== "review_packet") {
    throw new Error("reviewPacketJson must be a review_packet");
  }
  if (typeof packet.taskName !== "string" || typeof packet.purpose !== "string") {
    throw new Error("reviewPacketJson is missing taskName or purpose");
  }
  if (!Array.isArray(packet.stagedFiles) || !Array.isArray(packet.steps)) {
    throw new Error("reviewPacketJson is missing stagedFiles or steps");
  }

  return parsed as ReviewPacket;
}

export default tool({
  description:
    "Render the pragmatic code review prompt from a structured review packet",
  args: {
    reviewPacketJson: tool.schema.string().describe("JSON from build-review-packet"),
  },
  async execute({ reviewPacketJson }) {
    try {
      return renderCodeReviewPrompt(parseReviewPacket(reviewPacketJson));
    } catch (error) {
      return `ERROR: Failed to render code review prompt: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});
