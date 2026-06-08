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

## Step 1: Detect Scope

Walk up from the current working directory to find the scope root — the directory
containing `AGENTS.md` and a `plans/` subdirectory. This is the same detection
logic the penetration-tester skill uses.

If no scope is found:
1. Tell the operator: "No pentest scope found. Run this from within a scope directory (containing AGENTS.md and plans/)."
2. Stop.

## Step 2: Scan for Unverified Findings

Scan all `plans/*/findings/*.md` files within the scope. For each file:

1. Read the file content
2. Check the `Verification` field in the front table:
   - **Empty or missing** → unverified (candidate)
   - **Pending** → unverified (candidate)
   - **Confirmed / Downgraded / False Positive / Insufficient Evidence** → verified (skip)
3. Collect all unverified findings with their metadata (title, severity, plan name, file path)

If no unverified findings found:
1. Tell the operator: "All findings in this scope have been verified."
2. Stop.

## Step 3: Present Next Finding for Confirmation

Show the first unverified finding to the operator:

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
2. **Skip** — Move to the next unverified finding (repeat Step 3)
3. **Stop** — Exit without verifying

If the operator chooses "Skip" and there are more findings, present the next one.
If "Skip" and no more findings, tell the operator and stop.

## Step 4: Initialize History Directory

Create the debate history directory relative to the scope root:

```bash
mkdir -p .verify-finding
```

## Step 5: Read and Parse Local Finding

Read the confirmed finding file. Parse the markdown into the field structure:

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

## Step 6: Gather Business Context (Optional)

Ask the operator:
```
**Business Context (optional):**
What does this application do? What is its purpose and user base?
This helps evaluate "by design" arguments and CVSS environmental metrics.

Provide context now, or press Enter to skip (you'll be asked again if needed).
```

## Step 7: Run Verification Debate

Execute the full verify-finding debate workflow (Steps 4–9 from the `/verify-finding`
command):

1. **Round 1 — Skeptic** → `task(agent: "finding-skeptic")`
2. **Round 1 — Presenter** → `task(agent: "finding-presenter")`
3. **Round 2 — Skeptic** → `task(agent: "finding-skeptic")`
4. **Round 2 — Presenter** → `task(agent: "finding-presenter")`
5. **Checkpoint** — If contested, pause for operator input
6. **Arbiter** → `task(agent: "finding-arbiter")`

Use the same templates (A–E) from the `/verify-finding` command, populated with
the local finding's parsed fields.

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

If the file already exists (re-verification), append a new section with timestamp.

Add `.verify-finding/` to the scope's `.gitignore` if it doesn't already exist.

## Step 11: Loop or Exit

Ask the operator:

```
**Verification complete for: [title]**

Unverified findings remaining: [count]

Continue with next unverified finding?
```

Use `question` tool:
1. **Next finding** — Return to Step 3 (skip already-verified)
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

For findings without a CVSS vector (only a severity level like "High"), pass the
severity level as the CVSS reference and note that exact vector recalculation
may be needed during the debate.
