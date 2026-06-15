import { describe, it, expect, vi, beforeEach } from "vitest";
import { execFileSync } from "node:child_process";
import gitCommit from "../git-commit.js";

vi.mock("node:child_process", () => ({
  execFileSync: vi.fn(),
}));

describe("git-commit tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(execFileSync).mockReturnValue("[main abc123] test\n" as any);
  });

  it("builds a conventional commit without using a shell", async () => {
    const result = JSON.parse(
      await gitCommit.execute({
        type: "feat",
        scope: "auth",
        subject: "add login flow",
      }),
    );

    expect(result.success).toBe(true);
    expect(execFileSync).toHaveBeenCalledWith(
      "git",
      ["commit", "-m", "feat(auth): add login flow"],
      expect.objectContaining({
        encoding: "utf-8",
        stdio: ["pipe", "pipe", "pipe"],
      }),
    );
  });

  it("preserves quoted and shell-like content as plain commit message text", async () => {
    await gitCommit.execute({
      type: "fix",
      subject: 'handle "$(rm -rf /)" input',
      body: 'Keep "quoted" text intact',
      refs: "GH-123",
      noVerify: true,
    });

    expect(execFileSync).toHaveBeenCalledWith(
      "git",
      [
        "commit",
        "--no-verify",
        "-m",
        'fix: handle "$(rm -rf /)" input',
        "-m",
        'Keep "quoted" text intact',
        "-m",
        "Refs: GH-123",
      ],
      expect.any(Object),
    );
  });

  it("returns a structured failure response when git commit fails", async () => {
    vi.mocked(execFileSync).mockImplementation(() => {
      throw new Error("commit failed");
    });

    const result = JSON.parse(
      await gitCommit.execute({
        type: "fix",
        subject: "broken",
      }),
    );

    expect(result.success).toBe(false);
    expect(result.error).toContain("commit failed");
  });
});
