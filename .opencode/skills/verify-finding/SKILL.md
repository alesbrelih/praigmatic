---
name: verify-finding
description: Adversarial finding verification with empirical testing. Load when acting as skeptic, presenter, or arbiter in the /verify-finding workflow. Provides false positive patterns, Playwright empirical testing guide, debate templates, and CVSS calibration for finding verification.
---

# Finding Verification

Adversarial multi-agent debate to verify pentest findings. One finding at a time,
operator-driven, with human checkpoints and empirical validation.

## Quick Start

- Load [references/false-positive-patterns.md](references/false-positive-patterns.md)
  when challenging a finding as a skeptic.
- Load [references/empirical-testing-guide.md](references/empirical-testing-guide.md)
  when planning Playwright tests for a finding.
- Load [references/debate-templates.md](references/debate-templates.md)
  when formatting skeptic, presenter, or arbiter output, or writing debate history.
- Load `~/.agents/skills/pentest-report-writing/references/cvss-calibration.md`
  when recalibrating CVSS after a downgrade.

## Core Principles

1. **No assumption** — Every claim must be verified. XSS in a meta tag is not a
   vulnerability unless the browser actually renders and executes it.
2. **Empirical first** — If a finding can be browser-tested, it must be
   browser-tested before any theoretical argument is accepted.
3. **Business context matters** — "By design" and business purpose directly
   affect CIA triad assessment and CVSS scoring.
4. **Consensus is not correctness** — The Refute-or-Promote study showed 80+
   agents unanimously endorsing a non-existent vulnerability, caught only by
   empirical testing. Debate rigor does not substitute for evidence.
5. **One finding at a time** — No batch processing. Each finding gets full
   attention and complete debate.

## Roles

### Skeptic

Challenges the finding. Has the burden of proof for challenges — must show why
a claim is wrong, not just assert it. Uses Playwright for empirical validation.
Evaluates business reasoning.

### Presenter

Defends the finding as written. Can only use evidence, not speculation. May
concede points that cannot be defended. May strengthen claims with new evidence
gathered during debate.

### Arbiter

Synthesizes the debate into a verdict. Does not introduce new arguments.
Weighs evidence quality, concession strength, and empirical test results.

### Operator

Human in the loop. Confirms verdicts. Provides business context. Overrides
when needed. Makes final call before SysReptor is patched.

## Workflow

```
┌─────────────────────────────────────────────┐
│ 1. Finding input (SysReptor ID or inline)   │
│    + optional business context              │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 2. ROUND 1: Skeptic challenges              │
│    → Playwright empirical tests (if applicable)│
│    → Business reasoning assessment           │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 3. ROUND 1: Presenter defends              │
│    → Concedes or strengthens                │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 4. ROUND 2: Skeptic challenges remaining    │
│    → Focus on unconceded points             │
│    → Additional Playwright tests if needed  │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 5. ROUND 2: Presenter responds             │
│    → Final concessions or strengthened defense│
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 6. CHECKPOINT: Still contested?            │
│    → Yes: Pause for operator input          │
│    → No: Proceed to arbiter                 │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 7. Arbiter proposes verdict                │
│    → Confirmed / Downgraded / False Positive│
│    → / Insufficient Evidence                │
│    → Adjusted CVSS if Downgraded            │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 8. CHECKPOINT: Operator confirms verdict   │
│    → May override, provide context, or accept│
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│ 9. Patch SysReptor with verified finding   │
└─────────────────────────────────────────────┘
```

## Verdict Definitions

| Verdict | Meaning | SysReptor Action |
|---------|---------|-------------------|
| Confirmed | Finding is accurate as stated or with minor improvements | Patch improvements only |
| Downgraded | Finding is real but severity or scope is overstated | Patch title, CVSS, impact, description |
| False Positive | Finding is not a vulnerability (by design, not exploitable, etc.) | Delete finding or mark with status |
| Insufficient Evidence | Cannot determine if finding is valid — needs more testing | No patch; flag for re-testing |

## Empirical Testing Scope

**Always test with Playwright when the finding involves:**
- Reflected/stored XSS (does the payload execute?)
- Open redirect (does it actually redirect externally?)
- CSS injection (does the injected CSS render and leak data?)
- Error-based information disclosure (does the error contain sensitive data?)
- File inclusion (can you actually read/execute the included file?)
- DOM-based vulnerabilities (does the DOM mutation actually occur?)

**Skip browser testing for:**
- Logic flaws (business logic bypasses, authorization issues)
- Configuration findings (missing headers, TLS issues)
- Informational findings (version disclosure, commentary)
- Timing-based blind injection (requires different tooling)

## Debate History

Every verification produces a debate record stored in the assessment project
directory at `.verify-finding/{finding_id}.md`. This provides:

- **Defense record** — Justify downgrades or false positive verdicts to clients
- **Audit trail** — Shows empirical test results, concessions, and operator input
- **Pattern learning** — Reveals recurring false positive patterns per assessment type
- **Re-verification context** — Previous debate state if a finding needs re-testing

If re-verifying, the new debate is appended with a timestamp. The `.verify-finding/`
directory should be in the project's `.gitignore` since records may contain
vulnerability details and payloads.

## Local Finding Mode

When verifying a finding from a local file (e.g., from a penetration-tester
workspace at `plans/NN/findings/*.md`), the workflow adapts:

### Reading a Local Finding

Parse the markdown table and sections from the finding file. Map to the same
field structure used by SysReptor:

| Local field | Maps to |
|-------------|---------|
| Title (H1) | `title` |
| Severity | `cvss` (note: local files may lack a vector — use severity level) |
| Affected Asset | `affected_components` |
| Description | `description` |
| Steps to Reproduce | `replication` |
| Impact | `impact` |
| Remediation | `recommendation` |
| Evidence References | `references` |

### Updating After Verdict

After the operator confirms the verdict, update the local finding file:

1. **Set `Verification`** to the verdict (Confirmed / Downgraded / False Positive / Insufficient Evidence)
2. **Set `Verified`** to the current ISO date
3. **Set `Debate Record`** to the path of the written debate record (relative to scope root: `.verify-finding/{slug}.md`)

For `Downgraded` verdicts, also update `Severity` if the CVSS/severity changed.

If the finding has a `SysReptor ID` filled in, additionally patch SysReptor using
`reptor_patch_finding` as described below.

### Debate Records

Written to `.verify-finding/{finding-slug}.md` where `{finding-slug}` is derived
from the finding filename (without `.md`). The scope root is determined by walking
up from the finding file location to find the directory containing `AGENTS.md`.

## SysReptor Integration

When findings have a SysReptor ID (pushed after verification), patch these fields:

- `title` — string, required
- `cvss` — cvss vector, required
- `affected_components` — list of strings, required
- `summary` — markdown, required
- `description` — markdown, required
- `impact` — markdown, required
- `recommendation` — markdown, required
- `replication` — markdown, required
- `references` — list of strings, optional

Use `reptor_patch_finding` to update individual fields after operator confirms
verdict. Use `reptor_get_finding_schema` to verify field names before patching
(schemas vary by project).
