---
description: Verify the next unverified local finding. Scans the pentest workspace for findings with no Verification field, presents the first one for operator confirmation, then runs the full verify-finding debate workflow.
---

# CRITICAL: YOUR ROLE AS ORCHESTRATOR

**YOU ARE AN ORCHESTRATOR — NOT A SKEPTIC, PRESENTER, OR ARBITER**

You MUST follow these strict rules:
1. ❌ **NEVER challenge the finding yourself** — delegate to `finding-skeptic`
2. ❌ **NEVER defend the finding yourself** — delegate to `finding-presenter`
3. ❌ **NEVER produce a verdict yourself** — delegate to `finding-arbiter`
4. ❌ **NEVER run Playwright tests yourself** — the skeptic does this
5. ✅ **ALWAYS delegate to agents with clear, structured prompts**
6. ✅ **Your job:** Coordinate workflow, parse responses, manage checkpoints, update local files

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

## Step 4: Check Business Context (Required)

Read `context.md` in the scope root directory (detected in Step 1).

**If `context.md` exists and has substantive content** (not just comments/headers):
1. Use its contents as business context for all agents.
2. Proceed to Step 5.

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

## Step 5: Initialize History Directory

Create the debate history directory relative to the scope root:

```bash
mkdir -p .verify-finding
```

## Step 6: Read and Parse Local Finding

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

## Step 7: Run Verification Debate

Execute the full verify-finding debate workflow (Steps 4–9 from the `/verify-finding`
command):

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

## Step 8: Operator Confirmation (MANDATORY)

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

## Step 9: Update Local Finding File

Read the original finding file again (to get fresh content), then update:

1. **Set `Verification`** to the verdict value
2. **Set `Verified`** to the current ISO date (YYYY-MM-DD)
3. **Set `Debate Record`** to `.verify-finding/{slug}.md` (where slug = finding filename without .md)
4. If **Downgraded**: update `Severity` if the severity level changed

Use the edit tool to update the table in the finding file.

## Step 10: Write Debate History

Write the complete debate record to `.verify-finding/{finding-slug}.md` relative
to the scope root. Use **Template F** from the `/verify-finding` command.

Populate the header as:

```
**Source:** Local file at [absolute path]
```

instead of the SysReptor-style `**Source:** SysReptor finding [finding_id]`.

If the file already exists (re-verification), append a new section with timestamp.

Add `.verify-finding/` to the scope's `.gitignore` if it doesn't already exist.

## Step 11: Loop or Exit

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
