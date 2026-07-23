import { describe, it, expect, vi, beforeEach } from "vitest";
import { readdir, readFile } from "node:fs/promises";
import listKnowledgeFiles from "../list-knowledge-files.js";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  readFile: vi.fn(),
}));

describe("list-knowledge-files tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should list files with their # heading", async () => {
    vi.mocked(readdir).mockResolvedValue(["agents.md", "decisions.md"] as any);
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      if (path.includes("agents.md")) return "# AI Agents\nContent about agents.\n";
      if (path.includes("decisions.md")) return "# Technical Decisions\nContent about decisions.\n";
      return "";
    });

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("agents.md: AI Agents\ndecisions.md: Technical Decisions");
  });

  it("should fall back to filename when file has no # heading", async () => {
    vi.mocked(readdir).mockResolvedValue(["readme.md"] as any);
    vi.mocked(readFile).mockResolvedValue("Just some content without a heading.\n");

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("readme.md");
  });

  it("should return mixed results when some files have headings and some don't", async () => {
    vi.mocked(readdir).mockResolvedValue(["has-heading.md", "no-heading.md"] as any);
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      if (path.includes("has-heading.md")) return "# Has Heading\nContent.\n";
      return "no heading here.\n";
    });

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("has-heading.md: Has Heading\nno-heading.md");
  });

  it("should fall back to filename when readFile fails for a file", async () => {
    vi.mocked(readdir).mockResolvedValue(["bad.md", "good.md"] as any);
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      if (path.includes("good.md")) return "# Good File\nContent.\n";
      throw new Error("ENOENT");
    });

    const result = await listKnowledgeFiles.execute({});
    // Sorted alphabetically: bad.md (readFile fails → filename), good.md (heading)
    expect(result).toBe("bad.md\ngood.md: Good File");
  });

  it("should return 'No knowledge files found' when directory contains no .md files", async () => {
    vi.mocked(readdir).mockResolvedValue(["notes.txt", "data.json"] as any);

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("No knowledge files found.");
  });

  it("should return 'No knowledge files found' when directory is empty", async () => {
    vi.mocked(readdir).mockResolvedValue([] as any);

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("No knowledge files found.");
  });

  it("should return error when knowledge directory does not exist", async () => {
    vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));

    const result = await listKnowledgeFiles.execute({});
    expect(result).toContain("Error: Knowledge directory does not exist");
  });

  it("should sort files alphabetically", async () => {
    vi.mocked(readdir).mockResolvedValue(["zebra.md", "apple.md", "banana.md"] as any);
    vi.mocked(readFile).mockResolvedValue("");

    const result = await listKnowledgeFiles.execute({});
    const lines = result.split("\n");
    expect(lines[0]).toContain("apple.md");
    expect(lines[1]).toContain("banana.md");
    expect(lines[2]).toContain("zebra.md");
  });

  it("should handle heading with leading/trailing whitespace", async () => {
    vi.mocked(readdir).mockResolvedValue(["spaced.md"] as any);
    vi.mocked(readFile).mockResolvedValue("#   Spaced Heading   \nContent.\n");

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("spaced.md: Spaced Heading");
  });

  it("should handle empty file content", async () => {
    vi.mocked(readdir).mockResolvedValue(["empty.md"] as any);
    vi.mocked(readFile).mockResolvedValue("");

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("empty.md");
  });

  it("should accept custom knowledgeDir argument", async () => {
    vi.mocked(readdir).mockResolvedValue(["custom.md"] as any);
    vi.mocked(readFile).mockResolvedValue("# Custom File\n");

    const result = await listKnowledgeFiles.execute({ knowledgeDir: "/custom/path" });
    expect(result).toBe("custom.md: Custom File");
  });

  it("should handle heading that contains '#' characters", async () => {
    vi.mocked(readdir).mockResolvedValue(["complex.md"] as any);
    vi.mocked(readFile).mockResolvedValue("# JavaScript: The #1 Language\nContent.\n");

    const result = await listKnowledgeFiles.execute({});
    expect(result).toBe("complex.md: JavaScript: The #1 Language");
  });
});
