import { describe, it, expect, vi, beforeEach } from "vitest";
import { rename, mkdir, access } from "node:fs/promises";
import { existsSync } from "node:fs";
import archivePlan from "../archive-plan.js";

vi.mock("node:fs/promises", () => ({
  rename: vi.fn(),
  mkdir: vi.fn(),
  access: vi.fn(),
  constants: { R_OK: 4 },
}));

vi.mock("node:fs", () => ({
  existsSync: vi.fn(),
}));

describe("archive-plan tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(existsSync).mockReturnValue(false);
    vi.mocked(access).mockResolvedValue(undefined);
    vi.mocked(mkdir).mockResolvedValue(undefined);
    vi.mocked(rename).mockResolvedValue(undefined);
  });

  it("should archive a plan file with timestamp suffix", async () => {
    const result = await archivePlan.execute({
      planPath: ".opencode/plans/my-feature.md",
    });

    expect(result).toContain("archive");
    expect(result).toContain("my-feature");
    expect(result).toMatch(/\d{4}-\d{2}-\d{2}\.md$/);
    expect(rename).toHaveBeenCalled();
    expect(mkdir).toHaveBeenCalled();
  });

  it("should throw when source file does not exist", async () => {
    vi.mocked(access).mockRejectedValue(new Error("ENOENT"));

    await expect(
      archivePlan.execute({ planPath: "nonexistent.md" })
    ).rejects.toThrow("Failed to archive plan");
  });

  it("should throw when archive already exists", async () => {
    vi.mocked(existsSync).mockReturnValue(true);

    await expect(
      archivePlan.execute({ planPath: ".opencode/plans/existing.md" })
    ).rejects.toThrow("Archive file already exists");
  });

  it("should not create double .md extension", async () => {
    const result = await archivePlan.execute({
      planPath: ".opencode/plans/test.md",
    });

    expect(result).not.toContain(".md-");
    expect(result).toMatch(/test-\d{4}-\d{2}-\d{2}\.md$/);
  });

  it("should create archive directory recursively", async () => {
    await archivePlan.execute({
      planPath: ".opencode/plans/test.md",
    });

    expect(mkdir).toHaveBeenCalledWith(
      expect.stringContaining("archive"),
      { recursive: true }
    );
  });
});
