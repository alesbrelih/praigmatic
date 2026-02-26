import { tool } from "@opencode-ai/plugin";

export default tool({
  description: "Returns the current year as a number",
  args: {},
  async execute() {
    return new Date().getFullYear();
  },
});