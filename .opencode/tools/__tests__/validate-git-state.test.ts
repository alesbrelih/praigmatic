import { describe, it, expect, vi, beforeEach } from "vitest";
import { execSync } from "node:child_process";
import validateGitState from "../validate-git-state.js";

vi.mock("node:child_process", () => ({
  execSync: vi.fn(),
}));

describe("validate-git-state tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return valid when git state is clean", async () => {
    vi.mocked(execSync).mockReturnValue(Buffer.from(""));

    const result = JSON.parse(await validateGitState.execute({}));

    expect(result.valid).toBe(true);
    expect(result.message).toBe("Git state is clean");
    expect(result.files).toEqual([]);
  });

  it("should return invalid when uncommitted changes exist", async () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => {
        throw new Error("exit code 1");
      })
      .mockReturnValueOnce("M file1.ts\n?? file2.ts\n" as any);

    const result = JSON.parse(await validateGitState.execute({}));

    expect(result.valid).toBe(false);
    expect(result.message).toBe("Uncommitted changes detected");
    expect(result.files).toEqual(["M file1.ts", "?? file2.ts"]);
  });

  it("should return valid when allowUncommitted is true regardless of state", async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("exit code 1");
    });

    const result = JSON.parse(
      await validateGitState.execute({ allowUncommitted: true })
    );

    expect(result.valid).toBe(true);
    expect(result.message).toBe("Uncommitted changes allowed");
  });

  it("should handle git errors gracefully", async () => {
    vi.mocked(execSync).mockImplementation(() => {
      throw new Error("fatal: not a git repository");
    });

    const result = JSON.parse(
      await validateGitState.execute({ allowUncommitted: true })
    );

    // With allowUncommitted, should still return valid
    expect(result.valid).toBe(true);
  });

  it("should filter empty lines from status output", async () => {
    vi.mocked(execSync)
      .mockImplementationOnce(() => {
        throw new Error("exit code 1");
      })
      .mockReturnValueOnce("M file1.ts\n\n\n" as any);

    const result = JSON.parse(await validateGitState.execute({}));

    expect(result.files).toEqual(["M file1.ts"]);
  });
});
