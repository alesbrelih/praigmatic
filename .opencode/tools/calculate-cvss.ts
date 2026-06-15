import { tool } from "@opencode-ai/plugin";

const AV: Record<string, number> = { N: 0.85, A: 0.62, L: 0.55, P: 0.2 };
const AC: Record<string, number> = { L: 0.77, H: 0.44 };
const UI: Record<string, number> = { N: 0.85, R: 0.62 };
const CIA: Record<string, number> = { H: 0.56, L: 0.22, N: 0 };
const E_VAL: Record<string, number> = { X: 1, H: 1, F: 0.97, P: 0.94, U: 0.91 };
const RL_VAL: Record<string, number> = { X: 1, U: 1, W: 0.97, T: 0.96, O: 0.95 };
const RC_VAL: Record<string, number> = { X: 1, C: 1, R: 0.96, U: 0.92 };
const CIR: Record<string, number> = { X: 1, H: 1.5, M: 1, L: 0.5 };

const VALID: Record<string, string[]> = {
  AV: ["N", "A", "L", "P"],
  AC: ["L", "H"],
  PR: ["N", "L", "H"],
  UI: ["N", "R"],
  S: ["U", "C"],
  C: ["H", "L", "N"],
  I: ["H", "L", "N"],
  A: ["H", "L", "N"],
  E: ["X", "H", "F", "P", "U"],
  RL: ["X", "U", "W", "T", "O"],
  RC: ["X", "C", "R", "U"],
  CR: ["X", "H", "M", "L"],
  IR: ["X", "H", "M", "L"],
  AR: ["X", "H", "M", "L"],
  MAV: ["X", "N", "A", "L", "P"],
  MAC: ["X", "L", "H"],
  MPR: ["X", "N", "L", "H"],
  MUI: ["X", "N", "R"],
  MS: ["X", "U", "C"],
  MC: ["X", "N", "L", "H"],
  MI: ["X", "N", "L", "H"],
  MA: ["X", "N", "L", "H"],
};

const BASE_KEYS = ["AV", "AC", "PR", "UI", "S", "C", "I", "A"];
const OPT_ORDER = [
  "E", "RL", "RC",
  "CR", "IR", "AR",
  "MAV", "MAC", "MPR", "MUI", "MS", "MC", "MI", "MA",
];

function prVal(pr: string, scopeChanged: boolean): number {
  if (pr === "N") return 0.85;
  return scopeChanged
    ? (pr === "L" ? 0.68 : 0.5)
    : (pr === "L" ? 0.62 : 0.27);
}

function roundup(input: number): number {
  const i = Math.round(input * 100000);
  if (i % 10000 === 0) return i / 100000;
  return (Math.floor(i / 10000) + 1) / 10;
}

function severity(s: number): string {
  if (s === 0) return "None";
  if (s < 4.0) return "Low";
  if (s < 7.0) return "Medium";
  if (s < 9.0) return "High";
  return "Critical";
}

function parse(v: string): Map<string, string> {
  const clean = v.replace(/^CVSS:3\.1\/?/i, "");
  const m = new Map<string, string>();
  for (const p of clean.split("/")) {
    const idx = p.indexOf(":");
    if (idx > 0) m.set(p.substring(0, idx), p.substring(idx + 1));
  }
  return m;
}

function resolve(
  m: Map<string, string>,
  mod: string,
  base: string,
  map: Record<string, number>,
): number {
  if (m.has(mod) && m.get(mod) !== "X") {
    return map[m.get(mod)!] ?? 0;
  }
  return map[m.get(base)!] ?? 0;
}

function calcBase(m: Map<string, string>): number {
  const av = AV[m.get("AV")!] ?? 0;
  const ac = AC[m.get("AC")!] ?? 0;
  const pr = prVal(m.get("PR")!, m.get("S") === "C");
  const ui = UI[m.get("UI")!] ?? 0;
  const c = CIA[m.get("C")!] ?? 0;
  const i = CIA[m.get("I")!] ?? 0;
  const a = CIA[m.get("A")!] ?? 0;
  const sc = m.get("S") === "C";

  const iss = 1 - ((1 - c) * (1 - i) * (1 - a));
  const impact = sc
    ? 7.52 * (iss - 0.029) - 3.25 * Math.pow(iss - 0.02, 15)
    : 6.42 * iss;

  if (impact <= 0) return 0;

  const exp = 8.22 * av * ac * pr * ui;
  return sc
    ? roundup(Math.min(1.08 * (impact + exp), 10))
    : roundup(Math.min(impact + exp, 10));
}

function calcTemporal(base: number, m: Map<string, string>): number | null {
  const e = E_VAL[m.get("E") ?? "X"] ?? 1;
  const rl = RL_VAL[m.get("RL") ?? "X"] ?? 1;
  const rc = RC_VAL[m.get("RC") ?? "X"] ?? 1;
  if (e === 1 && rl === 1 && rc === 1) return null;
  return roundup(base * e * rl * rc);
}

function calcEnv(m: Map<string, string>): number | null {
  const envKeys = ["CR", "IR", "AR", "MAV", "MAC", "MPR", "MUI", "MS", "MC", "MI", "MA"];
  if (!envKeys.some((k) => m.has(k) && m.get(k) !== "X")) return null;

  const cr = CIR[m.get("CR") ?? "X"] ?? 1;
  const ir = CIR[m.get("IR") ?? "X"] ?? 1;
  const ar = CIR[m.get("AR") ?? "X"] ?? 1;
  const mav = resolve(m, "MAV", "AV", AV);
  const mac = resolve(m, "MAC", "AC", AC);
  const mui = resolve(m, "MUI", "UI", UI);
  const msVal = (m.has("MS") && m.get("MS") !== "X") ? m.get("MS")! : m.get("S")!;
  const msc = msVal === "C";
  const mpr = (m.has("MPR") && m.get("MPR") !== "X")
    ? prVal(m.get("MPR")!, msc)
    : prVal(m.get("PR")!, m.get("S") === "C");
  const mc = resolve(m, "MC", "C", CIA);
  const mi = resolve(m, "MI", "I", CIA);
  const ma = resolve(m, "MA", "A", CIA);

  const miss = Math.min(
    1 - ((1 - cr * mc) * (1 - ir * mi) * (1 - ar * ma)),
    0.915,
  );
  const modImpact = msc
    ? 7.52 * (miss - 0.029) - 3.25 * Math.pow(miss * 0.9731 - 0.02, 13)
    : 6.42 * miss;

  if (modImpact <= 0) return 0;

  const modExp = 8.22 * mav * mac * mpr * mui;
  const e = E_VAL[m.get("E") ?? "X"] ?? 1;
  const rl = RL_VAL[m.get("RL") ?? "X"] ?? 1;
  const rc = RC_VAL[m.get("RC") ?? "X"] ?? 1;

  const envBase = msc
    ? roundup(Math.min(1.08 * (modImpact + modExp), 10))
    : roundup(Math.min(modImpact + modExp, 10));

  return roundup(envBase * e * rl * rc);
}

export default tool({
  description:
    "Calculate CVSS 3.1 base, temporal, and environmental scores from a CVSS vector string",
  args: {
    vectorString: tool.schema
      .string()
      .describe(
        'CVSS:3.1 vector string, e.g. "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"',
      ),
  },
  async execute({ vectorString }) {
    const m = parse(vectorString);

    for (const key of BASE_KEYS) {
      if (!m.has(key)) {
        return JSON.stringify({ error: `Missing required base metric: ${key}` });
      }
      if (!VALID[key]?.includes(m.get(key)!)) {
        return JSON.stringify({
          error: `Invalid value for ${key}: ${m.get(key)}. Valid: ${VALID[key]?.join(",")}`,
        });
      }
    }
    for (const [key, val] of m) {
      if (VALID[key] && !VALID[key].includes(val)) {
        return JSON.stringify({
          error: `Invalid value for ${key}: ${val}. Valid: ${VALID[key].join(",")}`,
        });
      }
    }

    const baseScore = calcBase(m);
    const temporalScore = calcTemporal(baseScore, m);
    const environmentalScore = calcEnv(m);

    const parts = ["CVSS:3.1"];
    for (const key of BASE_KEYS) parts.push(`${key}:${m.get(key)}`);
    for (const key of OPT_ORDER) {
      if (m.has(key) && m.get(key) !== "X") parts.push(`${key}:${m.get(key)}`);
    }

    return JSON.stringify({
      vectorString: parts.join("/"),
      baseScore,
      baseSeverity: severity(baseScore),
      temporalScore,
      temporalSeverity: temporalScore !== null ? severity(temporalScore) : null,
      environmentalScore,
      environmentalSeverity: environmentalScore !== null
        ? severity(environmentalScore)
        : null,
    });
  },
});
