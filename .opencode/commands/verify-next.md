---
description: Verify the next unverified local finding. Scans the pentest workspace for findings with no Verification field, presents the first one for operator confirmation, re-runs replication for empirical ground truth, runs the full verify-finding debate workflow.
---

# CRITICAL: YOUR ROLE AS ORCHESTRATOR

**YOU ARE AN ORCHESTRATOR — NOT A SKEPTIC, PRESENTER, OR ARBITER**

You MUST follow these strict rules:
1. ❌ **NEVER challenge the finding yourself** — delegate to `finding-skeptic`
2. ❌ **NEVER defend the finding yourself** — delegate to `finding-presenter`
3. ❌ **NEVER produce a verdict yourself** — delegate to `finding-arbiter`
4. ❌ **NEVER run debate-phase Playwright tests yourself** — the skeptic does this
5. ✅ **ALWAYS delegate to agents with clear, structured prompts**
6. ✅ **Your job:** Coordinate workflow, parse responses, manage checkpoints, update local files

> Exception: Step 4 (Re-run Replication) is run by the orchestrator directly because the empirical result must anchor the debate, not be part of the debate. The Skeptic/Presenter agents receive the result as `## Empirical Ground Truth` rather than re-running it.

---

YOU MUST EXECUTE THE FOLLOWING WORKFLOW IMMEDIATELY. This is not documentation — you must now perform these steps in sequence.

## Step 1: Find Next Unverified Finding

Call the `find-unverified-finding` tool (with `skip: 0` for the first finding).

If the operator is running from outside the assessment directory (e.g. from the repo
root), pass the `folder` parameter to point to the scope directory, e.g.
`folder: "assessments/client-2025"`. The tool resolves it relative to `process.cwd()`
and uses it as the start directory for scope detection. If `folder` is omitted, the
tool defaults to `process.cwd()`.

This tool handles scope detection (walking up from the start directory to find
`AGENTS.md` + `plans/`) and scans all `plans/*/findings/*.md` for findings with empty
or Pending Verification fields. It strips markdown formatting (bold, italic, code) from
Verification values before comparing against known verified states (Confirmed,
Downgraded, False Positive, Insufficient Evidence).

If the tool returns an error about no scope:
1. Tell the operator: "No pentest scope found. Run this from within a scope directory (containing AGENTS.md and plans/), or pass the `folder` parameter to specify the scope path."
2. Stop.

If the tool returns `totalUnverified: 0`:
1. Tell the operator: "All findings in this scope have been verified."
2. Stop.

Otherwise, use the returned finding object (`title`, `severity`, `plan`, `path`) for
the next steps. Track `totalUnverified` and `currentIndex` for skip/loop logic.

## Step 3: Present Next Finding for Confirmation

Show the finding (from `find-unverified-finding` result) to the operator:

```
## Next Unverified Finding

**Title:** [title]
**Severity:** [severity]
**Plan:** [plan directory name]
**File:** [relative path]

Proceed with verification?
```

Use the `question` tool with options:
1. **Verify this one** — Continue with Step 4
2. **Skip** — Call `find-unverified-finding` with `skip: currentIndex + 1` (and same `folder` if used) and repeat Step 3
3. **Stop** — Exit without verifying

If "Skip" and the tool returns no more unverified findings, tell the operator and stop.

## Step 4: Re-run Replication (Mandatory Empirical Ground Truth)

Before any debate, the orchestrator re-runs the finding's `Steps to Reproduce`
field against the target. The result becomes empirical ground truth that
anchors the debate and arbiter verdict. A finding cannot be downgraded,
confirmed, or marked false positive on theoretical grounds alone.

### 4.1 Extract Replication Steps

Read the local finding file (already confirmed in Step 3). Parse the
`Steps to Reproduce` field into an ordered list of reproduction steps
(HTTP requests, CLI commands, navigation flows). If the field is empty or
non-actionable, classify as `Target Unavailable` and proceed directly to the
operator prompt.

### 4.2 Execute Against the Target

Run the steps using the appropriate tool:
- **HTTP/JSON/fetch** → `playwright_browser_*` or `http_*` tools
- **SQL/CLI** → `bash` with the documented command
- **Navigation flows** → `playwright_browser_navigate`, `playwright_browser_type`, etc.
- **Multi-step chains** → sequence calls; capture the final response/output

For destructive or side-effecting tests, attempt to run in a sandboxed context
if possible. Otherwise, document the side effect in the audit trail.

### 4.3 Classify Result

Classify the result into one of four states:

| State | Definition |
|-------|------------|
| **Reproducible** | The vulnerability triggers as described; full exploit path works |
| **Partially Reproducible** | Some steps succeed; the issue is real but only under specific conditions, or the full exploit chain is incomplete |
| **Not Reproducible** | The vulnerability does not trigger; the target behaviour contradicts the claim |
| **Target Unavailable** | Target is offline, credentials missing, test would be destructive without sandbox, or `Steps to Reproduce` is non-actionable |

### 4.4 Operator Confirmation (Mandatory)

**ALWAYS** present the result to the operator. The verdict cannot be changed
without an explicit confirmation. Silent skip is not allowed.

Use `question` tool:
```
**Replication Result: [state]**

**Steps executed:** [list with key outputs]
**Evidence captured:** [paths, screenshots, response bodies]
**Time elapsed:** [duration]

Accept this result and proceed to debate?
1. ✅ Accept — Result is [state], proceed to Step 8 (Run Verification Debate)
2. 🔄 Re-run — Repeat with different parameters or sandbox
[3. ⏭️ Skip with audit — Proceed without empirical ground truth; record skip reason in debate history] ← only shown when result is NOT Reproducible
```

**Process operator response:**
- **Accept** → Store result. Include it in the Skeptic's task packet (Template A) and Presenter's task packet (Template B) as `## Empirical Ground Truth`. Proceed to Step 8.
- **Re-run** → Return to Step 4.2 with new parameters.
- **Skip with audit** → Store `replication: skipped, reason: [operator-provided reason]`. Include this in the debate history and a note in the Skeptic's task packet that empirical ground truth is unavailable. Proceed to Step 8.

**Skip policy:** Skip is not available when the result is **Reproducible** —
fresh empirical confirmation is the strongest possible evidence and cannot be
bypassed. The operator must Accept or Re-run in that case. For other states
(Partially Reproducible, Not Reproducible, Target Unavailable), Skip with
audit is allowed but requires a reason, which is written to
`.verify-finding/{slug}.md`, the Skeptic's task packet, and the debate
history. This prevents silent re-classification of a finding on theoretical
grounds alone while still allowing the operator to override when they have
business context (e.g., known false positive in this codebase, target
behavior recently changed, time constraint).

## Step 5: Check Business Context (Required)

Read `context.md` in the scope root directory (detected in Step 1).

**If `context.md` exists and has substantive content** (not just comments/headers):
1. Use its contents as business context for all agents.
2. Proceed to Step 6.

**If `context.md` is missing or empty** (only comments/headers, no filled-in content):
1. **STOP.** Do not proceed with finding verification.
2. Tell the operator:

   ```
   Business Context is required before verification can proceed.

   Create `context.md` in the scope root at [scope-root-path] with the
   application's purpose, user base, and data classification.

   Use this template:
   - Application Purpose: What does this application do?
   - User Base: Who uses it? Internal, public, partners?
   - Data Classification: What kind of data does it handle?
   - Key Business Context: Any "by design" behavior, compensating controls,
     regulatory requirements?

   Once context.md is filled in, re-run this command.
   ```

3. Do NOT prompt for context interactively — the operator must write the file.
   This avoids repetitive prompting across multiple findings in the same scope.

The verify commands read `context.md` fresh each run, so the operator can update
it as the assessment progresses and new context emerges.

## Step 6: Initialize History Directory

Create the debate history directory relative to the scope root:

```bash
mkdir -p .verify-finding
```

## Step 7: Read and Parse Local Finding

Read the confirmed finding file. Store the **absolute file path** as a workflow
variable (used in Finding Source sections and for re-reading the file later).

Parse the markdown into the field structure:

| Local field | Maps to |
|-------------|---------|
| Title (H1) | `title` |
| Severity | `cvss` (if no vector, use severity level as reference) |
| Affected Asset | `affected_components` |
| Description | `description` |
| Steps to Reproduce | `replication` |
| Impact | `impact` |
| Remediation | `recommendation` |
| Evidence References | `references` |

## Step 8: Run Verification Debate

Execute the full verify-finding debate workflow (Steps 5–10 from the
`/verify-finding` command):

**⚠️ CRITICAL: Within each round, skeptic and presenter MUST run sequentially — NEVER in parallel.** The presenter's prompt includes the skeptic's full output, so the skeptic task must complete and its response must be parsed before invoking the presenter task.

1. **Round 1 — Skeptic** → `task(agent: "finding-skeptic")`
   ⏳ **WAIT for skeptic to complete and parse its response before continuing.**
2. **Round 1 — Presenter** → `task(agent: "finding-presenter")`
   ⏳ **WAIT for presenter to complete and parse its response before continuing.**
3. **Round 2 — Skeptic** → `task(agent: "finding-skeptic")`
   ⏳ **WAIT for skeptic to complete and parse its response before continuing.**
4. **Round 2 — Presenter** → `task(agent: "finding-presenter")`
5. **Checkpoint** — If contested, pause for operator input
6. **Arbiter** → `task(agent: "finding-arbiter")`

Use the same templates (A–E) from the `/verify-finding` command, populated with
the local finding's parsed fields.

**Important:** In each template, populate the `## Finding Source` section with:

```
## Finding Source

**Type:** Local file
**Path:** [absolute path to finding file]
**Plan:** [plan directory name from Step 1]
```

Replace `[finding_id]` references with the finding filename slug (filename
without `.md`). This lets agents re-read the source file for evidence or
context not captured in the field mapping.

## Step 9: Operator Confirmation (MANDATORY)

**ALWAYS** pause for operator confirmation before updating files.

Use `question` tool:
```
**Operator Confirmation Required**

The arbiter proposes: **[verdict]**

[Summary of changes if any]

Do you accept this verdict?
1. ✅ Accept — Update finding file
2. 🔄 Modify — Adjust the verdict or fields before updating
3. ❌ Reject — Don't update, finding stays as-is
```

## Step 10: Check for Overlap (Local + SysReptor)

Before updating the local finding file, scan the rest of the scope (other local
findings + SysReptor) for findings that describe the same vulnerability. This
prevents creating duplicate records or writing to the wrong file.

### 10.1 Build Candidate List

**Local findings (excluding current):**
- Use `glob` to find all `plans/*/findings/*.md` under the scope root
- Exclude the current finding's path (from Step 1)
- For each remaining file, read it and extract: title, severity, affected asset

**SysReptor findings:**
- Call `reptor_list_findings()`
- For each finding, extract: title, severity, affected_components

### 10.2 Apply 4-Signal Comparison

Compare the current finding (parsed fields from Step 7) against each candidate
on four signals:

| Signal | Match rule |
|--------|------------|
| Title | Substring, exact, or near-duplicate phrasing (case-insensitive) |
| Affected asset | Exact or partial match (e.g., `api.example.com /api/login`) |
| Severity | Same severity level (Critical / High / Medium / Low / Info) |
| Vulnerability type | Same class — XSS, SQLi, IDOR, SSRF, auth bypass, info disclosure, etc. |

Flag a candidate as overlap when **at least 3 of 4 signals match**.

### 10.3 Present to Operator

If 0 candidates match: log `No overlap detected.` and proceed to Step 11.

If 1+ candidates match, display a table and pause for operator input:

```
## Overlap Check

**Current finding:** [title] — [affected asset] — [severity]
**Verdict being applied:** [Confirmed / Downgraded / False Positive / Insufficient Evidence]

**This finding overlaps with:**

| # | Source | Identifier | Title | Affected Asset | Severity | Match Reasons |
|---|--------|------------|-------|----------------|----------|---------------|
| 1 | Local | plans/02-auth/findings/007-xss-login.md | [title] | [asset] | [sev] | [e.g., same asset, same vuln class, same severity] |
| 2 | SysReptor | abc123-def456 | [title] | [asset] | [sev] | [e.g., title substring, same CWE] |
```

Use `question` tool with one option per overlap target plus the universal
choices:

1. **Proceed** — Update the current finding as planned (genuinely separate)
2. **Merge into #1** — Apply the verdict to the first overlap, delete the current local file
3. **Merge into #2** — Apply the verdict to the second overlap, delete the current local file
4. **Merge into all** — Apply the verdict to every overlap, delete the current local file
5. **Link** — Update the current finding AND add a `Related Findings` row to its table referencing the overlap identifier(s)
6. **Skip** — Delete the current local file (the overlap already covers it)

**Process the operator's choice:**
- **Proceed** → continue to Step 11 with the current finding
- **Merge into [target]** → apply the verdict to the target (using Step 11's field mapping: `Verification`, `Verified`, `Debate Record`), then `bash rm` the current local file, then skip to Step 12 (Write Debate History)
- **Link** → continue to Step 11; orchestrator adds a `Related Findings` row to the local table referencing each overlap identifier
- **Skip** → `bash rm` the current local file, skip to Step 12

For local-file deletion via `bash rm`, the file is recoverable from `git`
history if needed, so no extra confirmation is required.

## Step 11: Update Local Finding File

Read the original finding file again (to get fresh content), then update:

1. **Set `Verification`** to the verdict value
2. **Set `Verified`** to the current ISO date (YYYY-MM-DD)
3. **Set `Debate Record`** to `.verify-finding/{slug}.md` (where slug = finding filename without .md)
4. If **Downgraded**: update `Severity` if the severity level changed
5. If **Linked** (from Step 10): add a `Related Findings` row to the table with the overlap identifier(s)
6. If any client-facing prose field (`description`, `impact`, `recommendation`, `replication`, `summary`) is being modified: load the `pentest-report-writing` skill and apply its anti-AI and deinternalization pass to the new content before saving.

Use the edit tool to update the table in the finding file.

## Step 12: Write Debate History

Write the complete debate record to `.verify-finding/{finding-slug}.md` relative
to the scope root. Use **Template F** from the `/verify-finding` command.

Populate the header as:

```
**Source:** Local file at [absolute path]
```

instead of the SysReptor-style `**Source:** SysReptor finding [finding_id]`.

If the file already exists (re-verification), append a new section with timestamp.

Add `.verify-finding/` to the scope's `.gitignore` if it doesn't already exist.

## Step 13: Loop or Exit

Ask the operator:

```
**Verification complete for: [title]**

Unverified findings remaining: [count from find-unverified-finding totalUnverified minus verified this session]

Continue with next unverified finding?
```

Use `question` tool:
1. **Next finding** — Call `find-unverified-finding` with incremented `skip` value (and same `folder` if used), return to Step 3
2. **Done** — Exit

Display final summary before exiting:

```
## Verification Session Complete

**Scope:** [scope name]
**Findings verified this session:** [count]
**Remaining unverified:** [count]
**Findings verified:**
- [title] → [verdict] ([date])
- ...
```

---

## Templates

Use the same templates A–F from the `/verify-finding` command. When populating,
use the parsed local finding fields instead of SysReptor API responses.

**Finding Source overrides for all templates (A–F):**

Replace the `## Finding Source` section in each template with:

```markdown
## Finding Source

**Type:** Local file
**Path:** [absolute path to finding file]
**Plan:** [plan directory name]
```

For Template F (Debate History), replace the header line:
`**Source:** SysReptor finding [finding_id]`
with:
`**Source:** Local file at [absolute path]`

For findings without a CVSS vector (only a severity level like "High"), pass the
severity level as the CVSS reference and note that exact vector recalculation
may be needed during the debate.
