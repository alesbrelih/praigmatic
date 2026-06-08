---
description: Adversarial verification of a pentest finding. Fetches finding from SysReptor, runs skeptic-presenter debate with empirical Playwright testing, produces verified verdict with operator confirmation, and patches SysReptor.
---

# CRITICAL: YOUR ROLE AS ORCHESTRATOR

**YOU ARE AN ORCHESTRATOR — NOT A SKEPTIC, PRESENTER, OR ARBITER**

You MUST follow these strict rules:
1. ❌ **NEVER challenge the finding yourself** — delegate to `finding-skeptic`
2. ❌ **NEVER defend the finding yourself** — delegate to `finding-presenter`
3. ❌ **NEVER produce a verdict yourself** — delegate to `finding-arbiter`
4. ❌ **NEVER run Playwright tests yourself** — the skeptic does this
5. ✅ **ALWAYS delegate to agents with clear, structured prompts**
6. ✅ **Your job:** Coordinate workflow, parse responses, manage checkpoints, patch SysReptor

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

### 3. Gather Business Context (Optional)

Ask the operator:
```
**Business Context (optional):**
What does this application do? What is its purpose and user base?
This helps evaluate "by design" arguments and CVSS environmental metrics.

Provide context now, or press Enter to skip (you'll be asked again if needed).
```

Store the context. It will be passed to all agents and used at checkpoints if the skeptic raises business reasoning questions.

### 4. Round 1 — Skeptic Challenges

Build prompt for the skeptic using **Template A (Skeptic Prompt)** below.

Invoke: `task(agent: "finding-skeptic", prompt: "[populated template]")`

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

### 5. Round 1 — Presenter Defends

Build prompt for the presenter using **Template B (Presenter Prompt)** below.
Include the full skeptic output so the presenter knows what to respond to.

Invoke: `task(agent: "finding-presenter", prompt: "[populated template]")`

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

### 6. Round 2 — Skeptic Challenges Remaining

Build prompt for the skeptic using **Template C (Skeptic Round 2 Prompt)** below.
Include:
- The original finding
- Round 1 skeptic output
- Round 1 presenter output (with concessions and defenses)
- Business context (if provided)

Focus the skeptic on points NOT conceded by the presenter.

Invoke: `task(agent: "finding-skeptic", prompt: "[populated template]")`

**Parse and display** same as Step 3.

### 7. Round 2 — Presenter Responds

Build prompt for the presenter using **Template D (Presenter Round 2 Prompt)** below.
Include:
- The original finding
- Both rounds of skeptic output
- Round 1 presenter output (for continuity)
- Round 2 skeptic challenges (focus on remaining)

Invoke: `task(agent: "finding-presenter", prompt: "[populated template]")`

**Parse and display** same as Step 4.

### 8. Checkpoint — Contestation Check

**Evaluate whether the debate is still contested:**

- If the presenter conceded ALL challenges → Not contested, proceed to Step 8
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
- Business context → Add to arbiter's context, continue to Step 8
- Accept skeptic → Use skeptic's verdict as the working verdict, skip to Step 9
- Accept presenter → Finding is Confirmed, skip to Step 8 with note
- Additional evidence → Re-run Round 2 with new evidence (Step 5 again)
- Override → Use operator's verdict, skip to Step 9

**If not contested:** Proceed to Step 8.

### 9. Arbiter Verdict

Build prompt for the arbiter using **Template E (Arbiter Prompt)** below.
Include:
- The original finding (full field data)
- Round 1 skeptic output (full)
- Round 1 presenter output (full)
- Round 2 skeptic output (full)
- Round 2 presenter output (full)
- Business context (if provided)
- Operator checkpoint input (if any)

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

### 10. Operator Confirmation (MANDATORY)

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
- Accept → Proceed to Step 10
- Modify → Ask what to change, update patches, then proceed to Step 10
- Reject → End workflow, no patches applied

### 11. Patch SysReptor

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

### 12. Write Debate History

Write the complete debate record to the assessment project directory.

Create file: `.verify-finding/{finding_id}.md`

If the file already exists (re-verification), append a new section with timestamp.

Use **Template F (Debate History)** below.

This file serves as:
- **Defense record** — If a client challenges a downgrade, the debate record shows
  the reasoning and evidence behind every decision
- **Audit trail** — Shows empirical test results, concessions, and operator input
- **Pattern learning** — Over time, debate records reveal recurring false positive
  patterns specific to this assessment type
- **Re-verification context** — If a finding needs re-testing later, the history
  provides the previous debate state

**Also add `.verify-finding/` to the assessment project's `.gitignore`** if it
doesn't already exist, since debate records may contain vulnerability details and
payloads that shouldn't be committed to version control.

### 13. Summary

```
## Finding Verification Complete

**Finding:** [title]
**Verdict:** [Confirmed / Downgraded / False Positive / Insufficient Evidence]
**CVSS:** [original] → [final]
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

## Business Context (if provided)
[business_context]

## Your Task

Challenge this finding. For every claim that can be questioned:

1. **Technical accuracy** — Does the exploit actually work? Is the impact demonstrated?
2. **Business reasoning** — Is this functionality "by design"? Does business context reduce the risk?
3. **CVSS accuracy** — Does the vector match demonstrated impact?
4. **Evidence quality** — Is there enough evidence to support the claim?

**CRITICAL: If this finding can be browser-tested, you MUST run Playwright tests.**
Do not assume — test. XSS must execute, redirects must land externally, errors
must disclose sensitive data. If the test fails, the claim fails.

Use the output format from Template 1 (Skeptic Challenge — Round 1) in the
verify-finding skill references.
```

### Template B: Presenter Prompt (Round 1)

```markdown
# Presenter Defense — Round 1

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

## Skeptic Challenges (Round 1)

[Full skeptic output from Step 3]

## Business Context (if provided)
[business_context]

## Your Task

Defend this finding against the skeptic's challenges. For each challenge:

1. **Strong defense** — If you have evidence that directly refutes the challenge
2. **Partial defense** — If the challenge has merit but the finding is still partially valid
3. **Concession** — If the challenge is valid and cannot be rebutted

You may gather new evidence to strengthen your defense, but you MUST NOT:
- Inflate claims beyond what the evidence shows
- Argue that theoretical impact equals demonstrated impact
- Dismiss valid "by design" arguments without counter-evidence

Use the output format from Template 2 (Presenter Defense — Round 1) in the
verify-finding skill references.
```

### Template C: Skeptic Prompt (Round 2)

```markdown
# Skeptic Challenge — Round 2

## Finding

**Title:** [title]
**CVSS:** [cvss]

## Round 1 Summary

**Your challenges:**
[Round 1 skeptic challenges]

**Presenter's defense:**
[Round 1 presenter defense — which challenges were defended, conceded, partially defended]

**Conceded points:**
[List of points the presenter conceded]

## Business Context (if provided or updated)
[business_context]

## Your Task

Focus on the points the presenter did NOT concede. Challenge the remaining
weaknesses:

1. Were the defenses convincing? Or do they rely on theoretical arguments?
2. Run additional Playwright tests if the presenter claimed the exploit works
   but your Round 1 test was inconclusive
3. If the presenter conceded key points, how does that affect the verdict?

**Do not re-challenge conceded points.** Focus on what's still disputed.

Use the output format from Template 3 (Skeptic Challenge — Round 2) in the
verify-finding skill references.
```

### Template D: Presenter Prompt (Round 2)

```markdown
# Presenter Response — Round 2

## Finding

**Title:** [title]
**CVSS:** [cvss]

## Debate History

**Round 1 — Skeptic challenges:**
[Round 1 skeptic challenges]

**Round 1 — Your defense:**
[Round 1 presenter defense]

**Round 2 — Remaining skeptic challenges:**
[Round 2 skeptic challenges — focus on unconceded points]

**Conceded points (across both rounds):**
[All conceded points]

## Business Context (if provided or updated)
[business_context]

## Your Task

Respond to the remaining challenges. This is your final chance to defend the
finding before the arbiter makes a verdict.

1. **Defend** — If you have evidence for the remaining challenges
2. **Concede** — If you cannot defend, acknowledge honestly
3. **Identify operator questions** — If a point requires business context only the
   operator can provide

Use the output format from Template 4 (Presenter Response — Round 2) in the
verify-finding skill references.
```

### Template E: Arbiter Prompt

```markdown
# Arbiter Verdict

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

**Finding ID:** [finding_id]
**Date:** [YYYY-MM-DD HH:MM]
**Original CVSS:** [cvss]

---

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
**Empirical tests run:** [count] ([PASSED/FAILED/INCONCLUSIVE counts])
**Operator confirmations:** [count]
```
