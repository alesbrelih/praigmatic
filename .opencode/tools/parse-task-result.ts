import { tool } from "@opencode-ai/plugin";

type TaskResultStatus = "completed" | "deviated" | "failed" | "blocked";

function extractStructuredJson(output: string): unknown {
  const markerMatch = output.match(/## Structured Result\s*```json\s*([\s\S]*?)```/i);
  const fallbackMatch = output.match(/```json\s*([\s\S]*?)```/i);
  const payload = markerMatch?.[1] ?? fallbackMatch?.[1];

  if (!payload) {
    throw new Error("No structured JSON result block found");
  }

  return JSON.parse(payload);
}

export default tool({
  description: "Parse and validate the structured result block returned by pragmatic-developer",
  args: {
    output: tool.schema.string().describe("Full developer agent output"),
  },
  async execute({ output }) {
    try {
      const parsed = extractStructuredJson(output) as Record<string, unknown>;
      const status = parsed.status;
      const taskName = parsed.task_name;
      const summary = parsed.summary;
      const filesModified = parsed.files_modified;

      if (!status || !["completed", "deviated", "failed", "blocked"].includes(String(status))) {
        throw new Error("Structured result is missing a valid status");
      }
      if (!taskName || typeof taskName !== "string") {
        throw new Error("Structured result is missing task_name");
      }
      if (!summary || typeof summary !== "string") {
        throw new Error("Structured result is missing summary");
      }
      if (!Array.isArray(filesModified)) {
        throw new Error("Structured result is missing files_modified array");
      }

      const normalizedFiles = filesModified.map((file) => {
        if (typeof file === "string") {
          return { path: file, description: "" };
        }
        if (
          file &&
          typeof file === "object" &&
          typeof (file as { path?: unknown }).path === "string"
        ) {
          return {
            path: (file as { path: string }).path,
            description:
              typeof (file as { description?: unknown }).description === "string"
                ? (file as { description: string }).description
                : "",
          };
        }
        throw new Error("files_modified entries must be strings or { path, description } objects");
      });

      return JSON.stringify({
        status: status as TaskResultStatus,
        task_name: taskName,
        summary,
        files_modified: normalizedFiles,
        discoveries: Array.isArray(parsed.discoveries) ? parsed.discoveries : [],
        scope_verification:
          parsed.scope_verification && typeof parsed.scope_verification === "object"
            ? parsed.scope_verification
            : null,
        root_cause: typeof parsed.root_cause === "string" ? parsed.root_cause : null,
        error: typeof parsed.error === "string" ? parsed.error : null,
        required_action:
          typeof parsed.required_action === "string" ? parsed.required_action : null,
      });
    } catch (error) {
      return JSON.stringify({
        error: `Failed to parse developer result: ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  },
});
