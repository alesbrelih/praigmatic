import { describe, it, expect, vi, beforeEach, afterAll } from "vitest";
import { readdir, stat, mkdir, writeFile } from "node:fs/promises";
import writeFinding from "../write-finding.js";

vi.mock("node:fs/promises", () => ({
  readdir: vi.fn(),
  stat: vi.fn(),
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

const BASE_ARGS = {
  plan: "01-auth-testing",
  title: "SQL Injection in Login Form",
  severity: "Critical",
  affectedAsset: "api.example.com /api/login",
  description: "The login endpoint is vulnerable to SQL injection via the `user` parameter.",
  stepsToReproduce: "1. Send POST /api/login with body `{\"user\":\"admin' OR 1=1--\",\"pass\":\"x\"}`\n2. Observe HTTP 200 with valid session token",
  evidenceReferences: ["evidence/20260611-sqli-login.md"],
  impact: "An attacker can bypass authentication and access any user account.",
  remediation: "Use parameterized queries for all database interactions.",
  retestInstructions: "1. Send the same payload\n2. Verify HTTP 401 is returned",
};

describe("write-finding tool", () => {
  const originalCwd = process.cwd;

  beforeEach(() => {
    vi.clearAllMocks();
    process.cwd = () => "/scope";
  });

  afterAll(() => {
    process.cwd = originalCwd;
  });

  describe("validation", () => {
    it("should reject invalid severity", async () => {
      const result = await writeFinding.execute({ ...BASE_ARGS, severity: "Extreme" });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("Invalid severity");
      expect(parsed.error).toContain("Extreme");
    });

    it("should accept all valid severities", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(mkdir).mockResolvedValue(undefined as any);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      for (const sev of ["Critical", "High", "Medium", "Low", "Info"]) {
        vi.clearAllMocks();
        vi.mocked(stat).mockImplementation(async (p: string) => {
          if ((p as string).endsWith("/AGENTS.md")) return {} as any;
          if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
          if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
          throw new Error("ENOENT");
        });
        vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
        vi.mocked(mkdir).mockResolvedValue(undefined as any);
        vi.mocked(writeFile).mockResolvedValue(undefined);

        const result = await writeFinding.execute({ ...BASE_ARGS, severity: sev });
        const parsed = JSON.parse(result as string);
        expect(parsed.error).toBeUndefined();
        expect(parsed.filename).toBeDefined();
      }
    });

    it("should reject empty evidence references", async () => {
      const result = await writeFinding.execute({ ...BASE_ARGS, evidenceReferences: [] });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("At least one evidence reference");
    });

    it("should reject null evidence references", async () => {
      const result = await writeFinding.execute({ ...BASE_ARGS, evidenceReferences: null as any });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("At least one evidence reference");
    });
  });

  describe("scope detection", () => {
    it("should return error when no scope root found", async () => {
      vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("No pentest scope found");
    });

    it("should return error when plan directory does not exist", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });

      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("Plan directory not found");
    });

    it("should return error when plan path is a file not a directory", async () => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => false } as any;
        throw new Error("ENOENT");
      });

      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("Plan directory not found");
    });
  });

  describe("auto-numbering", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(mkdir).mockResolvedValue(undefined as any);
      vi.mocked(writeFile).mockResolvedValue(undefined);
    });

    it("should assign 001 when findings directory is empty", async () => {
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));

      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed.filename).toBe("001-sql-injection-in-login-form.md");
      expect(parsed.number).toBe(1);
    });

    it("should assign 001 when no numbered files exist", async () => {
      vi.mocked(readdir).mockResolvedValue(["some-file.md", "another.md"] as any);

      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed.filename).toBe("001-sql-injection-in-login-form.md");
    });

    it("should increment from highest existing number", async () => {
      vi.mocked(readdir).mockResolvedValue(["001-xss.md", "002-csrf.md", "005-idor.md"] as any);

      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed.filename).toBe("006-sql-injection-in-login-form.md");
      expect(parsed.number).toBe(6);
    });
  });

  describe("slug generation", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(mkdir).mockResolvedValue(undefined as any);
      vi.mocked(writeFile).mockResolvedValue(undefined);
    });

    it("should slugify title with special characters", async () => {
      const result = await writeFinding.execute({ ...BASE_ARGS, title: "XSS: <script> in Search!" });
      const parsed = JSON.parse(result as string);
      expect(parsed.filename).toBe("001-xss-script-in-search.md");
    });

    it("should collapse multiple hyphens", async () => {
      const result = await writeFinding.execute({ ...BASE_ARGS, title: "IDOR   in   /api/users" });
      const parsed = JSON.parse(result as string);
      expect(parsed.filename).toBe("001-idor-in-api-users.md");
    });

    it("should use 'finding' as fallback slug for non-latin titles", async () => {
      const result = await writeFinding.execute({ ...BASE_ARGS, title: "  " });
      const parsed = JSON.parse(result as string);
      expect(parsed.filename).toBe("001-finding.md");
    });
  });

  describe("content generation", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(mkdir).mockResolvedValue(undefined as any);
      vi.mocked(writeFile).mockResolvedValue(undefined);
    });

    it("should generate content matching the canonical template format", async () => {
      await writeFinding.execute(BASE_ARGS);

      const writtenContent = vi.mocked(writeFile).mock.calls[0][1] as string;

      expect(writtenContent).toContain("# SQL Injection in Login Form");
      expect(writtenContent).toContain("| Severity | Critical |");
      expect(writtenContent).toContain("| Affected Asset | api.example.com /api/login |");
      expect(writtenContent).toContain("| Status | New |");
      expect(writtenContent).toContain("| Verification |  |");
      expect(writtenContent).toContain("| Verified |  |");
      expect(writtenContent).toContain("| SysReptor ID |  |");
      expect(writtenContent).toContain("| Debate Record |  |");
      expect(writtenContent).toContain("## Description");
      expect(writtenContent).toContain("## Steps to Reproduce");
      expect(writtenContent).toContain("## Evidence References");
      expect(writtenContent).toContain("## Impact");
      expect(writtenContent).toContain("## Remediation");
      expect(writtenContent).toContain("## Retest Instructions");
    });

    it("should include evidence references as backtick-wrapped list items", async () => {
      await writeFinding.execute({
        ...BASE_ARGS,
        evidenceReferences: ["evidence/20260611-sqli.md", "evidence/20260611-sqli-2.md"],
      });

      const writtenContent = vi.mocked(writeFile).mock.calls[0][1] as string;
      expect(writtenContent).toContain("- `evidence/20260611-sqli.md`");
      expect(writtenContent).toContain("- `evidence/20260611-sqli-2.md`");
    });

    it("should include extras as additional table rows", async () => {
      await writeFinding.execute({
        ...BASE_ARGS,
        extras: { Source: "config/app.json", CVE: "CVE-2026-1234" },
      });

      const writtenContent = vi.mocked(writeFile).mock.calls[0][1] as string;
      expect(writtenContent).toContain("| Source | config/app.json |");
      expect(writtenContent).toContain("| CVE | CVE-2026-1234 |");
    });

    it("should not include extras table rows when extras is undefined", async () => {
      await writeFinding.execute({ ...BASE_ARGS, extras: undefined });

      const writtenContent = vi.mocked(writeFile).mock.calls[0][1] as string;
      expect(writtenContent).not.toContain("| Source |");
    });

    it("should write file to correct path", async () => {
      await writeFinding.execute(BASE_ARGS);

      const writtenPath = vi.mocked(writeFile).mock.calls[0][0] as string;
      expect(writtenPath).toBe("/scope/plans/01-auth-testing/findings/001-sql-injection-in-login-form.md");
    });

    it("should create findings directory if it does not exist", async () => {
      await writeFinding.execute(BASE_ARGS);

      const mkdirPath = vi.mocked(mkdir).mock.calls[0][0] as string;
      expect(mkdirPath).toBe("/scope/plans/01-auth-testing/findings");
    });
  });

  describe("folder parameter", () => {
    it("should use folder as start directory instead of process.cwd()", async () => {
      process.cwd = () => "/root";
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string) === "/root/assessments/client-2025/AGENTS.md") return {} as any;
        if ((p as string) === "/root/assessments/client-2025/plans") return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(mkdir).mockResolvedValue(undefined as any);
      vi.mocked(writeFile).mockResolvedValue(undefined);

      const result = await writeFinding.execute({ ...BASE_ARGS, folder: "assessments/client-2025" });
      const parsed = JSON.parse(result as string);
      expect(parsed.path).toBe("plans/01-auth-testing/findings/001-sql-injection-in-login-form.md");
    });

    it("should return error when folder does not lead to a scope", async () => {
      process.cwd = () => "/root";
      vi.mocked(stat).mockRejectedValue(new Error("ENOENT"));

      const result = await writeFinding.execute({ ...BASE_ARGS, folder: "nonexistent" });
      const parsed = JSON.parse(result as string);
      expect(parsed.error).toContain("No pentest scope found");
    });
  });

  describe("return value", () => {
    beforeEach(() => {
      vi.mocked(stat).mockImplementation(async (p: string) => {
        if ((p as string).endsWith("/AGENTS.md")) return {} as any;
        if ((p as string).endsWith("/plans")) return { isDirectory: () => true } as any;
        if ((p as string).includes("/01-auth-testing")) return { isDirectory: () => true } as any;
        throw new Error("ENOENT");
      });
      vi.mocked(readdir).mockRejectedValue(new Error("ENOENT"));
      vi.mocked(mkdir).mockResolvedValue(undefined as any);
      vi.mocked(writeFile).mockResolvedValue(undefined);
    });

    it("should return relative path, filename, and number", async () => {
      const result = await writeFinding.execute(BASE_ARGS);
      const parsed = JSON.parse(result as string);
      expect(parsed).toEqual({
        path: "plans/01-auth-testing/findings/001-sql-injection-in-login-form.md",
        filename: "001-sql-injection-in-login-form.md",
        number: 1,
      });
    });
  });
});
