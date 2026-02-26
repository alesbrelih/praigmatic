import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Returns the current date in YYYY-MM-DD format",
  args: {},
  async execute() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  },
});