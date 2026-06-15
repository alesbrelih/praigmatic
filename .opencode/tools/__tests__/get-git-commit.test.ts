import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import getGitCommit from "../get-git-commit.js";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("get-git-commit tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the short commit hash by default", async () => {
    vi.mocked(execSync).mockReturnValue("abc123\n" as any);

    const result = await getGitCommit.execute({});

    expect(result).toBe("abc123");
    expect(execSync).toHaveBeenCalledWith(
      "git rev-parse --short HEAD",
      expect.any(Object),
    );
  });

  it("returns the full commit hash when requested", async () => {
    vi.mocked(execSync).mockReturnValue("1234567890abcdef\n" as any);

    const result = await getGitCommit.execute({ full: true });

    expect(result).toBe("1234567890abcdef");
    expect(execSync).toHaveBeenCalledWith(
      "git rev-parse HEAD",
      expect.any(Object),
    );
  });

  it("returns Unknown when git fails", async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("fatal");
    });

    const result = await getGitCommit.execute({});

    expect(result).toBe("Unknown");
  });
});
