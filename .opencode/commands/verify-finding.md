---
description: Adversarial verification of a pentest finding. Fetches finding from SysReptor, re-runs replication for empirical ground truth, runs skeptic-presenter debate, produces verified verdict with operator confirmation, and patches SysReptor.
---

# CRITICAL: YOUR ROLE AS ORCHESTRATOR

**YOU ARE AN ORCHESTRATOR — NOT A SKEPTIC, PRESENTER, OR ARBITER**

You MUST follow these strict rules:
1. ❌ **NEVER challenge the finding yourself** — delegate to `finding-skeptic`
2. ❌ **NEVER defend the finding yourself** — delegate to `finding-presenter`
3. ❌ **NEVER produce a verdict yourself** — delegate to `finding-arbiter`
4. ❌ **NEVER run debate-phase Playwright tests yourself** — the skeptic does this
5. ✅ **ALWAYS delegate to agents with clear, structured prompts**
6. ✅ **Your job:** Coordinate workflow, parse responses, manage checkpoints, patch SysReptor

> Exception: Step 4 (Re-run Replication) is run by the orchestrator directly because the empirical result must anchor the debate, not be part of the debate. The Skeptic/Presenter agents receive the result as `## Empirical Ground Truth` rather than re-running it.

---

YOU MUST EXECUTE THE FOLLOWING WORKFLOW IMMEDIATELY. This is not documentation — you must now perform these steps in sequence.

## Input

The operator provides one of:
- A SysReptor finding ID (e.g., `abc123-def456`)
- Inline finding content (title, CVSS, description, etc.)

Optional: Business context about the application (purpose, user base, data classification).

## Workflow Steps

### 1. Initialize History Directory

Create the debate history directory in the current working directory (the assessment project):

```bash
mkdir -p .verify-finding
```

All debate records for this assessment will be stored in `.verify-finding/`.

### 2. Fetch Finding

If a SysReptor finding ID is provided:
1. Call `reptor_get_finding(finding_id)` to retrieve the full finding
2. Extract all fields: title, cvss, affected_components, summary, description, impact, recommendation, replication, references

If inline content is provided:
1. Parse the inline content into the same field structure

If neither is provided:
1. List findings with `reptor_list_findings()`
2. Ask the operator to select a finding ID
3. Fetch the selected finding

### 3. Check Business Context (Required)

Determine the scope root by walking up from the current working directory to find
the directory containing `AGENTS.md`.

Read `context.md` in the scope root directory.

**If `context.md` exists and has substantive content** (not just comments/headers):
1. Use its contents as business context for all agents.
2. Proceed to Step 4.

**If `context.md` is missing or empty** (only comments/headers, no filled-in content):
1. **STOP.** Do not proceed with the debate.
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

### 4. Re-run Replication (Mandatory Empirical Ground Truth)

Before any debate, the orchestrator re-runs the finding's `replication` field
against the target. The result becomes empirical ground truth that anchors the
debate and arbiter verdict. A finding cannot be downgraded, confirmed, or marked
false positive on theoretical grounds alone.

#### 4.1 Extract Replication Steps

Read the finding's `replication` field (already fetched in Step 2). Parse it
into an ordered list of reproduction steps (HTTP requests, CLI commands,
navigation flows). If `replication` is empty or non-actionable, classify as
`Target Unavailable` and proceed directly to the operator prompt.

#### 4.2 Execute Against the Target

Run the steps using the appropriate tool:
- **HTTP/JSON/fetch** → `playwright_browser_*` or `http_*` tools
- **SQL/CLI** → `bash` with the documented command
- **Navigation flows** → `playwright_browser_navigate`, `playwright_browser_type`, etc.
- **Multi-step chains** → sequence calls; capture the final response/output

For destructive or side-effecting tests, attempt to run in a sandboxed context
if possible. Otherwise, document the side effect in the audit trail.

#### 4.3 Classify Result

Classify the result into one of four states:

| State | Definition |
|-------|------------|
| **Reproducible** | The vulnerability triggers as described; full exploit path works |
| **Partially Reproducible** | Some steps succeed; the issue is real but only under specific conditions, or the full exploit chain is incomplete |
| **Not Reproducible** | The vulnerability does not trigger; the target behaviour contradicts the claim |
| **Target Unavailable** | Target is offline, credentials missing, test would be destructive without sandbox, or `replication` field is non-actionable |

#### 4.4 Operator Confirmation (Mandatory)

**ALWAYS** present the result to the operator. The verdict cannot be changed
without an explicit confirmation. Silent skip is not allowed.

Use `question` tool:
```
**Replication Result: [state]**

**Steps executed:** [list with key outputs]
**Evidence captured:** [paths, screenshots, response bodies]
**Time elapsed:** [duration]

Accept this result and proceed to debate?
1. ✅ Accept — Result is [state], proceed to Step 5 (Skeptic)
2. 🔄 Re-run — Repeat with different parameters or sandbox
[3. ⏭️ Skip with audit — Proceed without empirical ground truth; record skip reason in debate history] ← only shown when result is NOT Reproducible
```

**Process operator response:**
- **Accept** → Store result. Include it in the Skeptic's task packet (Template A) and Presenter's task packet (Template B) as `## Empirical Ground Truth`. Proceed to Step 5.
- **Re-run** → Return to Step 4.2 with new parameters.
- **Skip with audit** → Store `replication: skipped, reason: [operator-provided reason]`. Include this in the debate history and a note in the Skeptic's task packet that empirical ground truth is unavailable. Proceed to Step 5.

**Skip policy:** Skip is not available when the result is **Reproducible** —
fresh empirical confirmation is the strongest possible evidence and cannot be
bypassed. The operator must Accept or Re-run in that case. For other states
(Partially Reproducible, Not Reproducible, Target Unavailable), Skip with
audit is allowed but requires a reason, which is written to
`.verify-finding/{finding_id}.md`, the Skeptic's task packet, and the
debate history. This prevents silent re-classification of a finding on
theoretical grounds alone while still allowing the operator to override
when they have business context (e.g., known false positive in this
codebase, target behavior recently changed, time constraint).

### 5. Round 1 — Skeptic Challenges

Build prompt for the skeptic using **Template A (Skeptic Prompt)** below.
Include the **Empirical Ground Truth** result from Step 4 so the skeptic
can ground challenges in fresh evidence rather than the original report.

Invoke: `task(agent: "finding-skeptic", prompt: "[populated template]")`

**⚠️ CRITICAL: Do NOT invoke the presenter (Step 6) until this skeptic task completes and its response is parsed.** Skeptic and presenter MUST run sequentially within each round — NEVER in parallel.

**Parse the response** for:
- Challenge table (challenge, severity, category, evidence needed, empirical test)
- Empirical test results (test, target, result, details)
- Business context assessment
- Preliminary verdict recommendation

**Display to operator:**
```
## Round 1 — Skeptic Challenges

[Formatted challenge table and test results from skeptic]

[Business context assessment]
[Preliminary verdict recommendation]
```

### 6. Round 1 — Presenter Defends

Build prompt for the presenter using **Template B (Presenter Prompt)** below.
Include the full skeptic output so the presenter knows what to respond to.
Also include the **Empirical Ground Truth** result from Step 4.

Invoke: `task(agent: "finding-presenter", prompt: "[populated template]")`

**⚠️ CRITICAL: Do NOT invoke the skeptic (Step 7) until this presenter task completes and its response is parsed.** Presenter and skeptic MUST run sequentially — NEVER in parallel.

**Parse the response** for:
- Defense against each challenge (defended/conceded/partially defended)
- Concessions
- Strengthened claims
- Evidence added
- Remaining weaknesses

**Display to operator:**
```
## Round 1 — Presenter Defense

[Defense table, concessions, strengthened claims]

[Remaining weaknesses]
```

### 7. Round 2 — Skeptic Challenges Remaining

Build prompt for the skeptic using **Template C (Skeptic Round 2 Prompt)** below.
Include:
- The original finding
- Round 1 skeptic output
- Round 1 presenter output (with concessions and defenses)
- Business context (if provided)
- **Empirical ground truth from Step 4** (or the audit entry if operator skipped replication)

Focus the skeptic on points NOT conceded by the presenter.

Invoke: `task(agent: "finding-skeptic", prompt: "[populated template]")`

**⚠️ CRITICAL: Do NOT invoke the presenter (Step 8) until this skeptic task completes and its response is parsed.** Skeptic and presenter MUST run sequentially within each round — NEVER in parallel.

**Parse and display** same as Step 5.

### 8. Round 2 — Presenter Responds

Build prompt for the presenter using **Template D (Presenter Round 2 Prompt)** below.
Include:
- The original finding
- Both rounds of skeptic output
- Round 1 presenter output (for continuity)
- Round 2 skeptic challenges (focus on remaining)
- **Empirical ground truth from Step 4** (or the audit entry if operator skipped replication)

Invoke: `task(agent: "finding-presenter", prompt: "[populated template]")`

**⚠️ CRITICAL: Do NOT proceed to Step 9 until this presenter task completes and its response is parsed.**

**Parse and display** same as Step 6.

### 9. Checkpoint — Contestation Check

**Evaluate whether the debate is still contested:**

- If the presenter conceded ALL challenges → Not contested, proceed to Step 10
- If the skeptic's preliminary verdict is "Confirmed" and presenter agrees → Not contested
- If critical or high challenges remain unconceded → **Contested**

**If contested:**

Pause for operator input using `question` tool:

```
**Checkpoint: Debate Still Contested**

The following points remain unresolved:
[List unconceded critical/high challenges]

1. **Provide business context** — Help resolve "by design" or impact questions
2. **Accept skeptic's position** — The challenges are valid
3. **Accept presenter's position** — The defense is sufficient
4. **Provide additional evidence** — Share information that resolves the debate
5. **Override** — State your own verdict
```

**Process operator input:**
- Business context → Add to arbiter's context, continue to Step 10
- Accept skeptic → Use skeptic's verdict as the working verdict, skip to Step 10
- Accept presenter → Finding is Confirmed, skip to Step 9 with note
- Additional evidence → Re-run Round 2 with new evidence (Step 6 again)
- Override → Use operator's verdict, skip to Step 10

**If not contested:** Proceed to Step 10.

### 10. Arbiter Verdict

Build prompt for the arbiter using **Template E (Arbiter Prompt)** below.
Include:
- The original finding (full field data)
- Round 1 skeptic output (full)
- Round 1 presenter output (full)
- Round 2 skeptic output (full)
- Round 2 presenter output (full)
- Business context (if provided)
- Operator checkpoint input (if any)
- **Empirical ground truth from Step 4** (or the audit entry if operator skipped replication)

Invoke: `task(agent: "finding-arbiter", prompt: "[populated template]")`

**Parse the response** for:
- Verdict (Confirmed/Downgraded/False Positive/Insufficient Evidence)
- Rationale
- Final CVSS (and comparison to original)
- Recommended SysReptor patches (field-by-field)

**Display to operator:**
```
## Arbiter Verdict

**Verdict:** [verdict]
**CVSS:** [original] → [final] ([rationale])

[Rationale summary]

### Proposed SysReptor Patches
[Field-by-field changes table]
```

**Quality pass for prose patches:** If any proposed patch targets a
client-facing prose field (`description`, `impact`, `recommendation`,
`replication`, `summary`), include in the arbiter's task packet the
requirement to load the `pentest-report-writing` skill and apply its
anti-AI and deinternalization guidance before finalizing the patch value.
The skill's quality rubric, writing rules, and final anti-AI pass must be
applied to the proposed prose before it is shown to the operator.

### 11. Operator Confirmation (MANDATORY)

**ALWAYS** pause for operator confirmation before patching SysReptor.

Use `question` tool:
```
**Operator Confirmation Required**

The arbiter proposes: **[verdict]**

[Patch summary if any]

Do you accept this verdict?
1. ✅ Accept — Patch SysReptor
2. 🔄 Modify — Adjust the verdict or fields before patching
3. ❌ Reject — Don't patch, finding stays as-is
```

**Process operator response:**
- Accept → Proceed to Step 12 (Check for Overlap)
- Modify → Ask what to change, update patches, then proceed to Step 12.
  If the change targets a client-facing prose field (`description`, `impact`,
  `recommendation`, `replication`, `summary`), load the
  `pentest-report-writing` skill and apply its anti-AI and deinternalization
  pass to the new value before proceeding.
- Reject → End workflow, no patches applied

### 12. Check for Overlap (SysReptor + Local)

Before patching the current SysReptor finding, scan for findings that describe
the same vulnerability. This prevents patching a duplicate when the canonical
record lives elsewhere, and protects against losing information by updating
the wrong SysReptor finding.

#### 12.1 Build Candidate List

**SysReptor findings (excluding current):**
- Call `reptor_list_findings()` and exclude the current `finding_id`
- For each remaining finding, extract: title, severity, affected_components

**Local findings:**
- Use `glob` to find all `plans/*/findings/*.md` under the scope root
- For each file, read it and extract: title, severity, affected asset

#### 12.2 Apply 4-Signal Comparison

Same 4-signal comparison as `/verify-next` Step 10.2 (title, affected asset,
severity, vulnerability type) with a 3-of-4 match threshold.

#### 12.3 Present to Operator

If 0 candidates match: log `No overlap detected.` and proceed to Step 13.

If 1+ candidates match, display a table and pause for operator input:

```
## Overlap Check

**Current finding:** [finding_id] — [title] — [affected asset] — [severity]
**Verdict being applied:** [Confirmed / Downgraded / False Positive / Insufficient Evidence]
**Patches pending:** [list of arbiter's proposed SysReptor field patches]

**This finding overlaps with:**

| # | Source | Identifier | Title | Affected Asset | Severity | Match Reasons |
|---|--------|------------|-------|----------------|----------|---------------|
| 1 | SysReptor | def789-ghi012 | [title] | [asset] | [sev] | [signals] |
| 2 | Local | plans/02-auth/findings/007-xss-login.md | [title] | [asset] | [sev] | [signals] |
```

Use `question` tool with one option per overlap target plus the universal
choices:

1. **Proceed** — Patch the current SysReptor finding as planned (genuinely separate)
2. **Merge into #1** — Apply the arbiter's patches to the SysReptor overlap, delete the current SysReptor finding
3. **Merge into #2** — Apply the verdict to the local overlap (using the local field mapping), delete the current SysReptor finding
4. **Merge into all** — Apply the verdict/patches to every overlap, delete the current SysReptor finding
5. **Link** — Patch the current SysReptor finding AND add the overlap identifier(s) to the `references` field
6. **Skip** — Delete the current SysReptor finding (the overlap already covers it)

**Process the operator's choice:**
- **Proceed** → continue to Step 13 (Patch SysReptor) with the current finding
- **Merge into [target]** →
  - If target is a SysReptor finding: redirect the arbiter's `reptor_patch_finding` calls to the target's `finding_id` instead of the current one
  - If target is a local file: apply the verdict to the local file's `Verification` / `Verified` / `Debate Record` fields (same as `/verify-next` Step 11)
  - Then `reptor_delete_finding(current_finding_id)` — **requires explicit re-confirmation** (see safety check below)
  - Skip to Step 14 (Write Debate History)
- **Link** → continue to Step 13; orchestrator includes the overlap identifier(s) in the `references` field patch
- **Skip** → `reptor_delete_finding(current_finding_id)` — **requires explicit re-confirmation**, then skip to Step 14

**SysReptor deletion safety:** Unlike local files, SysReptor findings cannot
be recovered from version control. The debate record in
`.verify-finding/{finding_id}.md` is the only remaining audit trail. When the
operator's choice involves `reptor_delete_finding`, the orchestrator must
re-confirm the deletion explicitly before calling the tool:

```
**This will PERMANENTLY DELETE SysReptor finding `abc123-def456`.**
The verdict will be applied to [target] instead.
The debate record is saved to `.verify-finding/abc123-def456.md` for audit.

Confirm permanent deletion?
1. Yes, delete
2. No, link instead (keep both, cross-reference)
3. Cancel
```

This re-confirmation is required for any merge or skip that targets a
SysReptor deletion. Local-file deletion via `bash rm` is recoverable from
`git` and does not require re-confirmation.

### 13. Patch SysReptor

For each field that needs patching (from the arbiter's recommendation):

1. Call `reptor_patch_finding(finding_id, field_name, field_value)` for each field
2. Verify each patch by checking the response
3. After all patches, call `reptor_get_finding(finding_id)` to confirm the final state

**Display to operator:**
```
## SysReptor Patched ✅

**Finding:** [title]
**Fields updated:** [list of patched fields]
**Verdict applied:** [verdict]
**CVSS:** [original] → [final]

[If False Positive: Note that the finding was not deleted — operator should set status separately]
[If Insufficient Evidence: Note that no patches were applied — finding flagged for re-testing]
```

### 14. Write Debate History

Write the complete debate record to the assessment project directory.

Create file: `.verify-finding/{finding_id}.md`

If the file already exists (re-verification), append a new section with timestamp.

Use **Template F (Debate History)** below.

This file serves as:
- **Defense record** — If a client challenges a downgrade, the debate record shows
  the reasoning and evidence behind every decision
- **Audit trail** — Shows empirical test results, concessions, operator input, and
  the replication result (or skip-audit entry) from Step 4
- **Pattern learning** — Over time, debate records reveal recurring false positive
  patterns specific to this assessment type
- **Re-verification context** — If a finding needs re-testing later, the history
  provides the previous debate state

**Also add `.verify-finding/` to the assessment project's `.gitignore`** if it
doesn't already exist, since debate records may contain vulnerability details and
payloads that shouldn't be committed to version control.

### 15. Summary

```
## Finding Verification Complete

**Finding:** [title]
**Finding ID:** [finding_id]
**Verdict:** [Confirmed / Downgraded / False Positive / Insufficient Evidence]
**CVSS:** [original] → [final]
**Replication result:** [Reproducible / Partial / Not Reproducible / Target Unavailable / Skipped (audited)]
**Rounds:** 2
**Empirical tests run:** [count]
**Operator checkpoints:** [count]
**SysReptor patches:** [count] fields updated
```

---

## Templates

### Template A: Skeptic Prompt (Round 1)

```markdown
# Skeptic Challenge — Round 1

## Finding

**Title:** [title]
**CVSS:** [cvss]
**Affected Components:** [affected_components]

**Summary:**
[summary]

**Description:**
[description]

**Impact:**
[impact]

**Recommendation:**
[recommendation]

**Replication:**
[replication]

**References:** [references]

## Empirical Ground Truth (from Step 4)

**Replication result:** [Reproducible / Partially Reproducible / Not Reproducible / Target Unavailable / Skipped (audited)]
**Steps executed:** [list with key outputs]
**Evidence captured:** [paths, screenshots, response bodies]
**Skip reason (if applicable):** [operator-provided reason]

## Finding Source

**Type:** SysReptor
**Finding ID:** [finding_id]

## Debate Record

### Round 1 — Skeptic
[Full Round 1 skeptic output]

### Round 1 — Presenter
[Full Round 1 presenter output]

### Round 2 — Skeptic
[Full Round 2 skeptic output]

### Round 2 — Presenter
[Full Round 2 presenter output]

## Business Context
[business_context if provided, or "Not provided"]

## Operator Input (if any)
[operator checkpoint response if applicable]

## Your Task

Synthesize the debate into a verdict. You do NOT introduce new arguments or
evidence. You weigh what was presented.

**Decision framework:**
- Empirical test results override theoretical arguments
- The Step 4 replication result is the highest-trust evidence; treat any conflict
  between it and the original report as the replication result being correct
- Conceded points are fact — they cannot be restored
- "By design" arguments are valid when supported by business context
- CVSS must match demonstrated impact, not theoretical impact

**Verdict options:**
- **Confirmed** — Finding is accurate as stated
- **Downgraded** — Finding is real but severity/scope is overstated
- **False Positive** — Finding is not a vulnerability
- **Insufficient Evidence** — Cannot determine validity

For Downgraded verdicts, provide the adjusted CVSS with explicit rationale for
every changed metric. Specify exact SysReptor field patches.

Use the output format from Template 5 (Arbiter Verdict) in the verify-finding
skill references.
```

### Template F: Debate History

```markdown
# Finding Verification: [title]

**Source:** SysReptor finding [finding_id]
**Date:** [YYYY-MM-DD HH:MM]
**Original CVSS:** [cvss]

---

## Empirical Ground Truth (Step 4)

**Replication result:** [Reproducible / Partially Reproducible / Not Reproducible / Target Unavailable / Skipped (audited)]
**Steps executed:** [list with key outputs]
**Evidence captured:** [paths, screenshots, response bodies]
**Skip reason (if applicable):** [operator-provided reason]

## Finding (Original)

**Title:** [title]
**CVSS:** [cvss]
**Affected Components:** [affected_components]

**Summary:**
[summary]

**Description:**
[description]

**Impact:**
[impact]

**Recommendation:**
[recommendation]

**Replication:**
[replication]

**References:** [references]

## Business Context

[business_context or "Not provided at start; prompted at checkpoint"]

---

## Round 1 — Skeptic

[Full skeptic challenge output]

## Round 1 — Presenter

[Full presenter defense output]

## Round 2 — Skeptic

[Full skeptic round 2 output]

## Round 2 — Presenter

[Full presenter round 2 output]

---

## Checkpoint

**Contested:** [Yes/No]
**Operator input:** [summary or "Not required"]

---

## Arbiter Verdict

[Full arbiter verdict output]

---

## Final Result

**Verdict:** [Confirmed / Downgraded / False Positive / Insufficient Evidence]
**CVSS:** [original] → [final]
**SysReptor patches applied:** [list of fields, or "None"]
**Replication result:** [Reproducible / Partial / Not Reproducible / Target Unavailable / Skipped (audited)]
**Empirical tests run:** [count] ([PASSED/FAILED/INCONCLUSIVE counts])
**Operator confirmations:** [count]
```
