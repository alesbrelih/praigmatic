import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdir, stat } from "node:fs/promises";
import findPlan from "../find-plan.js";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
}));

describe("find-plan tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("with planName provided", () => {
    it("should return resolved path when plan file exists", async () => {
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await findPlan.execute({ planName: "my-plan.md" });
      expect(result).toContain("my-plan.md");
      expect(result).toContain(".praigmatic/plans");
    });

    it("should return error when plan file does not exist", async () => {
      vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

      const result = await findPlan.execute({ planName: "nonexistent.md" });
      expect(result).toContain("Error: Plan file not found");
    });
  });

  describe("without planName (auto-detect)", () => {
    it("should return the most recently modified plan", async () => {
      vi.mocked(readdir).mockResolvedValue(["old.md", "new.md", "README.md"] as any);
      vi.mocked(stat)
        .mockResolvedValueOnce({ mtimeMs: 1000 } as any) // old.md
        .mockResolvedValueOnce({ mtimeMs: 2000 } as any); // new.md

      const result = await findPlan.execute({});
      expect(result).toContain("new.md");
    });

    it("should exclude README.md from results", async () => {
      vi.mocked(readdir).mockResolvedValue(["README.md", "plan.md"] as any);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await findPlan.execute({});
      expect(result).toContain("plan.md");
      expect(result).not.toContain("README.md");
    });

    it("should return error when plans directory does not exist", async () => {
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));

      const result = await findPlan.execute({});
      expect(result).toContain("Error: Plans directory does not exist");
    });

    it("should return error when no plan files found", async () => {
      vi.mocked(readdir).mockResolvedValue(["README.md"] as any);

      const result = await findPlan.execute({});
      expect(result).toContain("Error: No plan files found in");
    });

    it("should return error when directory is empty", async () => {
      vi.mocked(readdir).mockResolvedValue([] as any);

      const result = await findPlan.execute({});
      expect(result).toContain("Error: No plan files found in");
    });

    it("should handle single plan file", async () => {
      vi.mocked(readdir).mockResolvedValue(["only-plan.md"] as any);
      vi.mocked(stat).mockResolvedValue({ mtimeMs: 1000 } as any);

      const result = await findPlan.execute({});
      expect(result).toContain("only-plan.md");
    });
  });
});
