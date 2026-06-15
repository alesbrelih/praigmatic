import { describe, it, expect } from "vitest";
import calculateCvss from "../calculate-cvss.js";

async function exec(vector: string) {
  return JSON.parse(
    await (calculateCvss as any).execute({ vectorString: vector }),
  );
}

describe("calculate-cvss", () => {
  describe("base score calculation", () => {
    it("AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H → 9.8 Critical", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
      expect(r.baseScore).toBe(9.8);
      expect(r.baseSeverity).toBe("Critical");
      expect(r.temporalScore).toBeNull();
      expect(r.environmentalScore).toBeNull();
    });

    it("AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H → 10.0 Critical", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H");
      expect(r.baseScore).toBe(10.0);
      expect(r.baseSeverity).toBe("Critical");
    });

    it("AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N → 0.0 None", async () => {
      const r = await exec("CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N");
      expect(r.baseScore).toBe(0);
      expect(r.baseSeverity).toBe("None");
    });

    it("AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N → 7.5 High", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N");
      expect(r.baseScore).toBe(7.5);
      expect(r.baseSeverity).toBe("High");
    });

    it("PR:L depends on Scope — S:U uses 0.62, S:C uses 0.68", async () => {
      const u = await exec("CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:H/A:H");
      const c = await exec("CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H");
      expect(c.baseScore).toBeGreaterThan(u.baseScore);
    });

    it("PR:H depends on Scope — S:U uses 0.27, S:C uses 0.5", async () => {
      const u = await exec("CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:L/A:N");
      const c = await exec("CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:C/C:H/I:L/A:N");
      expect(c.baseScore).toBeGreaterThan(u.baseScore);
    });

    it("all severity ratings mapped correctly", async () => {
      const cases: [string, number, string][] = [
        ["CVSS:3.1/AV:P/AC:H/PR:H/UI:R/S:U/C:N/I:N/A:N", 0, "None"],
        ["CVSS:3.1/AV:L/AC:H/PR:L/UI:R/S:U/C:L/I:L/A:N", 3.3, "Low"],
        ["CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:L/I:L/A:N", 5.4, "Medium"],
        ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N", 7.5, "High"],
        ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 9.8, "Critical"],
      ];
      for (const [vector, score, sev] of cases) {
        const r = await exec(vector);
        expect(r.baseScore).toBe(score);
        expect(r.baseSeverity).toBe(sev);
      }
    });
  });

  describe("vector string parsing", () => {
    it("accepts full CVSS:3.1/ prefix", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
      expect(r.baseScore).toBe(9.8);
    });

    it("accepts metrics without prefix", async () => {
      const r = await exec("AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
      expect(r.baseScore).toBe(9.8);
    });

    it("accepts metrics in non-standard order", async () => {
      const r = await exec("CVSS:3.1/S:U/C:H/I:H/A:H/AV:N/AC:L/PR:N/UI:N");
      expect(r.baseScore).toBe(9.8);
    });

    it("normalizes vector string in output", async () => {
      const r = await exec("CVSS:3.1/S:U/C:H/I:H/A:H/AV:N/AC:L/PR:N/UI:N");
      expect(r.vectorString).toBe("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
    });
  });

  describe("validation", () => {
    it("rejects missing base metric", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H");
      expect(r.error).toContain("Missing required base metric: A");
    });

    it("rejects invalid metric value", async () => {
      const r = await exec("CVSS:3.1/AV:X/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
      expect(r.error).toContain("Invalid value for AV");
    });

    it("rejects invalid temporal value", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:Z");
      expect(r.error).toContain("Invalid value for E");
    });
  });

  describe("temporal score", () => {
    it("null when no temporal metrics provided", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
      expect(r.temporalScore).toBeNull();
    });

    it("null when all temporal metrics are X", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:X/RL:X/RC:X");
      expect(r.temporalScore).toBeNull();
    });

    it("calculates with E:F (0.97)", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:F");
      expect(r.temporalScore).toBe(9.6);
      expect(r.temporalSeverity).toBe("Critical");
    });

    it("calculates with E:U/RL:O/RC:C", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:U/RL:O/RC:C",
      );
      expect(r.temporalScore).toBe(8.5);
      expect(r.temporalSeverity).toBe("High");
    });
  });

  describe("environmental score", () => {
    it("null when no environmental metrics", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H");
      expect(r.environmentalScore).toBeNull();
    });

    it("null when all environmental metrics are X", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N/CR:X/IR:X/AR:X",
      );
      expect(r.environmentalScore).toBeNull();
    });

    it("CR:H increases environmental score above base", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N/CR:H",
      );
      expect(r.environmentalScore).toBeGreaterThan(r.baseScore);
    });

    it("AR:L decreases environmental score below base", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:L/AR:L",
      );
      expect(r.environmentalScore).toBeLessThan(r.baseScore);
    });

    it("MC:N overrides base C:H to None → lower env score", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:N/MC:N",
      );
      const rBase = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:L/A:N");
      expect(r.environmentalScore).toBe(rBase.baseScore);
    });

    it("environmental with temporal metrics", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:N/CR:H/E:F",
      );
      expect(r.environmentalScore).not.toBeNull();
      expect(r.temporalScore).not.toBeNull();
    });

    it("all CIA High + all requirements High caps MISS at 0.915", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/CR:H/IR:H/AR:H",
      );
      expect(r.environmentalScore).not.toBeNull();
    });

    it("Modified Scope Changed with MPR", async () => {
      const r = await exec(
        "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/MS:C/MPR:L",
      );
      expect(r.environmentalScore).not.toBeNull();
    });
  });

  describe("roundup function", () => {
    it("4.02 rounds up to 4.1", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:L/I:L/A:L");
      expect(typeof r.baseScore).toBe("number");
      expect(r.baseScore).not.toBeNaN();
    });

    it("roundup preserves exact 1-decimal values", async () => {
      const r = await exec("CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:U/C:N/I:L/A:L");
      expect(r.baseScore).toBe(4.6);
    });
  });

  describe("FIRST official CVSS 3.1 examples", () => {
    const vectors: [string, number][] = [
      ["CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:L/A:N", 6.4],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N", 3.1],
      ["CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H", 9.9],
      ["CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:L/I:L/A:L", 4.2],
      ["CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H", 7.2],
      ["CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H", 7.8],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N", 7.5],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 9.8],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:N/I:H/A:N", 6.8],
      ["CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 6.8],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N", 5.8],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:N/I:L/A:N", 5.8],
      ["CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:H", 9.3],
      ["CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:H", 9.0],
      ["CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H", 7.8],
      ["CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H", 8.8],
      ["CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N", 4.6],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H", 8.8],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:N", 7.4],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:N/A:N", 5.3],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H", 9.6],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H", 8.8],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:N", 6.8],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:H", 7.5],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N", 6.1],
      ["CVSS:3.1/AV:L/AC:L/PR:N/UI:R/S:U/C:H/I:H/A:H", 7.8],
      ["CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:L/A:L", 8.6],
      ["CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H", 8.2],
      ["CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:N/I:H/A:H", 6.0],
      ["CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H", 7.6],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:H/I:H/A:H", 7.5],
      ["CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:L/A:N", 4.2],
    ];

    for (const [vector, expected] of vectors) {
      it(`${vector} → ${expected}`, async () => {
        const r = await exec(vector);
        if (r.error) {
          throw new Error(`Tool returned error: ${r.error}`);
        }
        expect(r.baseScore).toBe(expected);
      });
    }
  });
});
