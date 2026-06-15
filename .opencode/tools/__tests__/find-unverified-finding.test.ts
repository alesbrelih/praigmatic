import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { readdir, stat, readFile } from "node:fs/promises";
import findUnverifiedFinding from "../find-unverified-finding.js";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  readFile: vi.fn(),
}));

const makeContent = (opts: {
  title?: string;
  severity?: string;
  verification?: string;
} = {}) =>
  `# ${opts.title || "Test Finding"}

| Field | Value |
|-------|-------|
| Severity | ${opts.severity || "High"} |
| Affected Asset | api.example.com |
| Status | New |
| Verification | ${opts.verification ?? ""} |
| Verified | |
| SysReptor ID | |
| Debate Record | |

## Description

Test description.
`;

const makeBoldContent = (opts: {
  title?: string;
  severity?: string;
  verification?: string;
} = {}) =>
  `# ${opts.title || "Test Finding"}

**Severity**: ${opts.severity || "Medium (CVSS 5.8)"}
**Verification**: ${opts.verification ?? ""}
**Verified**: 2026-06-11
**Debate Record**: .verify-finding/test.md
**Source**: config/appconfig.json
**Evidence**: evidence/01-test.md

## Description

Test description.
`;

describe("find-unverified-finding tool", () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = () => "/scope";
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  describe("scope detection", () => {
    it("should return error when no scope root found", async () => {
      vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("No pentest scope found");
    });

    it("should find scope root with AGENTS.md and plans/", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return { isDirectory: () => false } as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.includes("/plans/")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir).mockResolvedValue(["plan-01"] as any);

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.scopeRoot).toBe("/scope");
    });
  });

  describe("finding scanning", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
    });

    it("should return unverified finding with empty Verification field", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["xss-reflected.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "XSS Reflected", severity: "High" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.title).toBe("XSS Reflected");
      expect(parsed.finding.severity).toBe("High");
      expect(parsed.finding.verification).toBe("(empty)");
      expect(parsed.totalUnverified).toBe(1);
      expect(parsed.currentIndex).toBe(0);
    });

    it("should return unverified finding with Pending Verification", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["sqli.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "SQLi", verification: "Pending" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.title).toBe("SQLi");
      expect(parsed.totalUnverified).toBe(1);
    });

    it("should skip verified findings (Confirmed, Downgraded, False Positive, Insufficient Evidence)", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md", "b.md", "c.md", "d.md"] as any);
      vi.mocked(readFile)
        .mockResolvedValueOnce(makeContent({ verification: "Confirmed" }))
        .mockResolvedValueOnce(makeContent({ verification: "Downgraded" }))
        .mockResolvedValueOnce(makeContent({ verification: "False Positive" }))
        .mockResolvedValueOnce(makeContent({ verification: "Insufficient Evidence" }));

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
      expect(parsed.message).toContain("All findings");
    });

    it("should skip verified findings with markdown bold formatting", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md", "b.md", "c.md", "d.md"] as any);
      vi.mocked(readFile)
        .mockResolvedValueOnce(makeContent({ verification: "**Confirmed**" }))
        .mockResolvedValueOnce(makeContent({ verification: "**Downgraded**" }))
        .mockResolvedValueOnce(makeContent({ verification: "**False Positive**" }))
        .mockResolvedValueOnce(makeContent({ verification: "**Insufficient Evidence**" }));

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
      expect(parsed.message).toContain("All findings");
    });

    it("should skip verified findings with italic formatting", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ verification: "_Downgraded_" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
      expect(parsed.message).toContain("All findings");
    });

    it("should skip verified findings with inline code formatting", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ verification: "`Confirmed`" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
      expect(parsed.message).toContain("All findings");
    });

    it("should still treat Pending as unverified even with markdown formatting", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ verification: "**Pending**" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(1);
      expect(parsed.finding.verification).toBe("Pending");
    });

    it("should skip non-md files in findings directory", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["finding.md", "evidence.txt", "screenshot.png"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "Real Finding" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.title).toBe("Real Finding");
      expect(parsed.totalUnverified).toBe(1);
    });
  });

  describe("skip parameter", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
    });

    it("should skip N findings and return the next one", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["first.md", "second.md", "third.md"] as any);
      vi.mocked(readFile)
        .mockResolvedValueOnce(makeContent({ title: "First" }))
        .mockResolvedValueOnce(makeContent({ title: "Second" }))
        .mockResolvedValueOnce(makeContent({ title: "Third" }));

      const result = await findUnverifiedFinding.execute({ skip: 1 });
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.title).toBe("Second");
      expect(parsed.totalUnverified).toBe(3);
      expect(parsed.currentIndex).toBe(1);
    });

    it("should return error when skip exceeds total unverified", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["only.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "Only One" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 5 });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("exceeds total unverified");
    });

    it("should default skip to 0", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["finding.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "First Finding" })
      );

      const result = await findUnverifiedFinding.execute({});
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.title).toBe("First Finding");
      expect(parsed.currentIndex).toBe(0);
    });
  });

  describe("multiple plans", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        if (s.includes("/evidence")) return { isDirectory: () => false } as any;
        throw new Error("ENOENT");
      });
    });

    it("should scan findings across multiple plan directories", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01", "plan-02"] as any)
        .mockResolvedValueOnce(["a.md"] as any)
        .mockResolvedValueOnce(["b.md"] as any);
      vi.mocked(readFile)
        .mockResolvedValueOnce(makeContent({ title: "From Plan 1" }))
        .mockResolvedValueOnce(makeContent({ title: "From Plan 2" }));

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(2);
      expect(parsed.finding.title).toBe("From Plan 1");
    });

    it("should skip plan directories without findings/", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.includes("plan-01/findings")) return { isDirectory: () => true } as any;
        if (s.includes("plan-02/findings")) throw new Error("ENOENT");
        throw new Error("ENOENT");
      });
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01", "plan-02"] as any)
        .mockResolvedValueOnce(["finding.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "Only In Plan 1" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(1);
      expect(parsed.finding.plan).toBe("plan-01");
    });
  });

  describe("folder parameter", () => {
    it("should use folder as start directory instead of process.cwd()", async () => {
      process.cwd = () => "/root";
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s === "/root/assessments/client-2025/AGENTS.md") return {} as any;
        if (s === "/root/assessments/client-2025/plans") return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["finding.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "From Folder Arg" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0, folder: "assessments/client-2025" });
      const parsed = JSON.parse(result as string);
      expect(parsed.scopeRoot).toBe("/root/assessments/client-2025");
      expect(parsed.finding.title).toBe("From Folder Arg");
    });

    it("should find scope when folder is an absolute path", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s === "/abs/scope/AGENTS.md") return {} as any;
        if (s === "/abs/scope/plans") return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["finding.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "Absolute Path" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0, folder: "/abs/scope" });
      const parsed = JSON.parse(result as string);
      expect(parsed.scopeRoot).toBe("/abs/scope");
      expect(parsed.finding.title).toBe("Absolute Path");
    });

    it("should default to process.cwd() when folder is omitted", async () => {
      process.cwd = () => "/scope";
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["finding.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeContent({ title: "Default CWD" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.scopeRoot).toBe("/scope");
      expect(parsed.finding.title).toBe("Default CWD");
    });

    it("should return error when folder does not lead to a scope", async () => {
      process.cwd = () => "/root";
      vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

      const result = await findUnverifiedFinding.execute({ skip: 0, folder: "nonexistent/path" });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("No pentest scope found");
    });
  });

  describe("parsing edge cases", () => {
    it("should handle finding with no title", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["notitle.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        `| Field | Value |
|-------|-------|
| Severity | Medium |
| Verification | |`
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.title).toBe("");
      expect(parsed.finding.severity).toBe("Medium");
    });

    it("should handle finding with no table at all", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["notable.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce("# No Table Finding\n\nJust prose.");

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(1);
      expect(parsed.finding.verification).toBe("(empty)");
    });
  });

  describe("bold key-value format", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        const s = p as string;
        if (s.endsWith("/AGENTS.md")) return {} as any;
        if (s.endsWith("/plans")) return { isDirectory: () => true } as any;
        if (s.endsWith("/findings")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
    });

    it("should skip verified finding with bold Downgraded format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ verification: "Downgraded (from Critical)" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
      expect(parsed.message).toContain("All findings");
    });

    it("should skip verified finding with bold Confirmed format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ verification: "Confirmed" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
    });

    it("should skip verified finding with bold False Positive format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ verification: "False Positive" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
    });

    it("should skip verified finding with bold Insufficient Evidence format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ verification: "Insufficient Evidence" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(0);
    });

    it("should treat Pending as unverified in bold format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ verification: "Pending" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(1);
      expect(parsed.finding.verification).toBe("Pending");
    });

    it("should treat empty Verification as unverified in bold format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ verification: "" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.totalUnverified).toBe(1);
      expect(parsed.finding.verification).toBe("(empty)");
    });

    it("should parse severity with CVSS from bold format", async () => {
      vi.mocked(readdir)
        .mockResolvedValueOnce(["plan-01"] as any)
        .mockResolvedValueOnce(["a.md"] as any);
      vi.mocked(readFile).mockResolvedValueOnce(
        makeBoldContent({ severity: "Medium (CVSS 5.8)", verification: "Pending" })
      );

      const result = await findUnverifiedFinding.execute({ skip: 0 });
      const parsed = JSON.parse(result as string);
      expect(parsed.finding.severity).toBe("Medium (CVSS 5.8)");
    });
  });
});
