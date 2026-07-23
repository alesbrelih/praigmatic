import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import readKnowledgeFile from "../read-knowledge-file.js";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

describe("read-knowledge-file tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should read and return file content for a valid file", async () => {
    vi.mocked(readFile).mockResolvedValue("# Test File\n\nContent here.\n");

    const result = await readKnowledgeFile.execute({ file: "test.md" });
    expect(result).toBe("# Test File\n\nContent here.\n");
  });

  it("should return error when file is not found and list available files", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(readdir).mockResolvedValue(["agents.md", "decisions.md"] as any);

    const result = await readKnowledgeFile.execute({ file: "missing.md" });
    expect(result).toContain("Error: Knowledge file 'missing.md' not found");
    expect(result).toContain("Available files:");
    expect(result).toContain("agents.md");
    expect(result).toContain("decisions.md");
  });

  it("should return error when file not found and directory does not exist", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));

    const result = await readKnowledgeFile.execute({ file: "missing.md" });
    expect(result).toContain("Error: Knowledge file 'missing.md' not found");
    expect(result).toContain("knowledge directory does not exist");
  });

  it("should return error when 'file' argument is empty", async () => {
    const result = await readKnowledgeFile.execute({ file: "" });
    expect(result).toContain("Error: 'file' argument is required.");
  });

  it("should reject non-.md file extensions", async () => {
    const result = await readKnowledgeFile.execute({ file: "data.json" });
    expect(result).toContain("Error: 'file' must end with .md");
    expect(result).toContain("data.json");
  });

  it("should reject path traversal with '..' prefix", async () => {
    const result = await readKnowledgeFile.execute({ file: "../secret.md" });
    expect(result).toContain("Error: Path traversal");
  });

  it("should reject path traversal with '..' in the middle", async () => {
    const result = await readKnowledgeFile.execute({ file: "subdir/../secret.md" });
    expect(result).toContain("Error: Path traversal");
  });

  it("should reject filenames containing '..' even if not actual traversal", async () => {
    const result = await readKnowledgeFile.execute({ file: "foo..md" });
    expect(result).toContain("Error: Path traversal");
  });

  it("should reject absolute paths that escape knowledge directory", async () => {
    const result = await readKnowledgeFile.execute({ file: "/etc/passwd.md" });
    expect(result).toContain("Error: Resolved path escapes the knowledge directory");
  });

  it("should accept custom knowledgeDir argument", async () => {
    vi.mocked(readFile).mockResolvedValue("# Custom\nContent\n");

    const result = await readKnowledgeFile.execute({
      file: "custom.md",
      knowledgeDir: "/custom/path",
    });
    expect(result).toBe("# Custom\nContent\n");
  });

  it("should list available files sorted alphabetically when file not found", async () => {
    vi.mocked(readFile).mockRejectedValue(new Error("ENOENT"));
    vi.mocked(readdir).mockResolvedValue(["zebra.md", "apple.md"] as any);

    const result = await readKnowledgeFile.execute({ file: "missing.md" });
    const availableSection = result.split("Available files:")[1];
    const lines = availableSection!.split("\n").map((l) => l.trim()).filter(Boolean);
    expect(lines[0]).toBe("- apple.md");
    expect(lines[1]).toBe("- zebra.md");
  });
});
