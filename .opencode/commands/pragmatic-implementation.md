---
description: Load plan file and orchestrate plan-driven implementation
---

# CRITICAL: YOUR ROLE AS ORCHESTRATOR

**YOU ARE AN ORCHESTRATOR - NOT A DEVELOPER**

1. ❌ **NEVER edit, write, or modify code files yourself**
2. ❌ **NEVER fix code review issues directly**
3. ✅ **ALWAYS delegate code changes to `pragmatic-developer` agent**
4. ✅ **ALWAYS delegate code review to `pragmatic-code-reviewer` agent**
5. ✅ **Your job:** Coordinate workflow, parse responses, manage git state

---

YOU MUST EXECUTE THE FOLLOWING WORKFLOW IMMEDIATELY.

## Workflow Steps

### 1. Find Plan
Use `find-plan` tool to locate most recent plan file (or specify planName argument). If error returned, display usage message and exit.

### 2. Validate Git State
Use `validate-git-state` tool to check for uncommitted changes. If changes found, display files and prompt user to continue (y/N). Only proceed if user confirms.

### 3. Validate and Parse Plan
1. Run `validate-plan(planPath)` on the selected plan file.
2. If validation fails, stop and show the violations. Do NOT try to execute an invalid plan.
3. Run `parse-plan(planName?)` and use its structured JSON as the source of truth for:
   - plan metadata
   - ordered tasks
   - task status and size
   - task fields (`Purpose`, `Steps`, `Acceptance`, `Files`, `Dependencies`)
   - plan-level `References`
4. Do NOT scrape raw markdown for task fields if the parsed JSON is available.

### 4. Implementation Loop

**Context Accumulation:** Track each completed task's name, files modified, summary, and discoveries. Pass accumulated context to subsequent developer invocations, code reviews, and holistic review.

**Context Budget** (prevents context overflow on large plans):
- **Last 3 completed tasks:** full detail (files, summary, discoveries)
- **Older tasks:** single-line: `- **Task N: [Name]** — ✅ ([file count] files, [1-sentence summary])`
- **All discoveries** from any task always included regardless of age

The holistic review receives full context for all tasks (no budget cap).

**Task Selection:** Prioritize `[~]` (in-progress) over `[ ]` (pending). Execute sequentially.

For each task:

#### 4.1 Mark In-Progress
Use `update-plan-task(planPath, taskName, action: "mark_in_progress")` before invoking developer.

#### 4.2 Invoke Developer

**REMINDER:** ❌ You are the orchestrator. Do NOT implement the task yourself.

Build prompt using **Template 1 (Developer Task Prompt)** from `~/.config/opencode/reference/implementation-templates.md`. Populate all placeholders from plan context and accumulated task data.

Invoke: `task(agent: "pragmatic-developer", prompt: "[populated template]")`

#### 4.3 Handle Developer Response

1. Run `parse-task-result(output)` on the full developer response.
2. If parsing fails, use `update-plan-task(..., action: "annotate_failure")` with a message like `Developer output missing valid structured result`, then stop.
3. If `status` is `failed`, annotate failure and stop.
4. If `status` is `blocked`, use `update-plan-task(..., action: "annotate_blocked")` with the structured blocker fields, then stop.
5. If `status` is `completed` or `deviated`, stage only the files from `files_modified` using `git add [exact file list]`.
6. The orchestrator owns staging. The developer only reports files.

#### 4.4 Code Review (ADAPTIVE ROUTING)

**Task-size-based routing:**
- **Small tasks (1-3 steps):** Skip code review. Developer self-reviewed. Proceed to commit (4.5).
- **Medium/Large tasks:** Run code review loop below.
- **Security override:** If ANY task touches security-critical files (auth, crypto, middleware, secrets), force code review regardless of size.

**Code Review Flow (for Medium/Large tasks):**

1. Ask `pragmatic-code-reviewer` to review the staged changes using **Template 2 (Code Review Prompt)**.
2. Run `parse-review-result(output)` on the reviewer response.
3. If the review result cannot be parsed, stop and treat it as review failure.
4. If the reviewer returns `decision: "approved"` or no issue above `low`, proceed to commit (4.5).
5. If the reviewer finds issues, ask `pragmatic-developer` to fix them using **Template 3 (Developer Retry Prompt)**. ❌ DO NOT FIX CODE YOURSELF.
6. Parse that developer retry response with `parse-task-result(output)`.
7. If the developer succeeds, stage the reported files with `git add`, then re-run `pragmatic-code-reviewer` on the staged changes.
8. If critical, high, or medium issues still remain after that one developer fix attempt, stop and handle it as review failure (4.6).
9. If the developer fails or is blocked while fixing review issues, stop and handle it as failure (4.6).

#### 4.5 Commit and Accumulate Context

1. Use `update-plan-task(..., action: "mark_completed")`.
2. Use `update-plan-task(..., action: "annotate_execution", actualFiles, notes)` to record actual files and summary.
3. Use `extract-commit-metadata(planPath, taskName, kind: "task")` to resolve merged refs and commit notes.
4. **Commit using `git-commit` tool directly** (no committer agent):
   - Task commits: pass `type`, `scope`, `subject`, plus `refs`/`body` from `extract-commit-metadata`
   - Holistic/QA fix commits: resolve plan-level refs with `kind: "holistic_fix"` or `kind: "qa_fix"`
   - Archive commits: resolve plan-level refs with `kind: "archive"`
   - **Commit failure:** Do NOT treat the task as fully complete. Keep staged, inform user, stop loop.
5. **Accumulate** task name, files, summary, discoveries for subsequent tasks.

#### 4.6 Handle Max Retries / Failure

Use `update-plan-task(..., action: "annotate_review_failed")` with the reviewer summary.
Do not commit. Keep files staged. Inform user of remaining issues and next steps.

#### 4.7 Continue to Next Task
Read plan, find next unchecked task. Prioritize `[~]` over `[ ]`. Repeat from 4.1.

#### 4.8 All Tasks Complete — Holistic Review

Run holistic review only if ANY of the following are true:
- the parsed plan contains more than one task
- the plan changes public interfaces or explicitly requires backwards-compatibility care
- the work touches security-sensitive behavior or files

1. Get commits: `git log --oneline --all --grep="[Plan Name]"`
2. Build prompt using **Template 4 (Holistic Review Prompt)**. Invoke `task(agent: "pragmatic-code-reviewer", prompt: "...")`.

**Holistic Improvement Flow (conditional):**

1. Run the holistic review with **Template 4**.
2. Parse the holistic review with `parse-review-result(output)`.
3. If the reviewer finds no critical, high, or medium issues, skip to archive.
4. If issues are found, ask `pragmatic-developer` to fix them using **Template 5**. ❌ DO NOT FIX CODE YOURSELF.
5. Parse that developer response with `parse-task-result(output)`.
6. If the developer succeeds, stage the reported files and re-run the holistic review.
7. Repeat this fix-and-re-review cycle for up to 3 developer fix attempts.
8. If issues still remain after the third developer fix attempt, use `update-plan-task(..., action: "annotate_holistic_failed")`, keep staged changes, inform the user, and proceed to archive with notes.
9. If the developer fails or is blocked during a holistic fix attempt, use `update-plan-task(..., action: "annotate_holistic_failed")`, keep staged changes, inform the user, and proceed to archive with notes.

**Commit Holistic Fixes (success):**
If files staged: resolve refs with `extract-commit-metadata(kind: "holistic_fix")`, then `git-commit(type: "fix", subject: "holistic review fixes for [plan name]")`. No files staged: proceed to archive.

#### 4.9 QA Validation Loop (OPT-IN)

QA validation is **optional** — only run if:
- User requests via flag (`/pragmatic-implementation --qa`)
- Plan contains a `## QA Required` section
- Default: skip QA, proceed directly to archive

If QA is requested:

1. Build prompt using **Template 7 (QA Validation Prompt)**. Invoke: `task(agent: "pragmatic-qa", prompt: "[populated template]")`

2. **Handle QA Response:**
   - `✅ **QA Passed:**` — Proceed to archive
   - `⚠️ **QA Partial:**` or `❌ **QA Failed:**` — Classify issues:
     - **Fixable:** New issues OR Preexisting with Small/Medium effort
     - **Skipped:** Preexisting with Large effort
   - Only Skipped issues remain → treat as passed with warning
   - Fixable issues exist → continue below

3. **QA Fix Flow:** Build prompt using **Template 8** and ask `pragmatic-developer` to fix the QA issues.
4. Parse that developer response with `parse-task-result(output)`.
5. If the developer succeeds, stage the reported files and re-run QA with **Template 7**.
6. Repeat this QA fix-and-revalidate cycle for up to 2 developer fix attempts.
7. If fixable issues still remain after the second developer fix attempt, use `update-plan-task(..., action: "annotate_qa_failed")`, keep staged changes, inform the user, and proceed to archive with notes.
8. If the developer fails or is blocked while fixing QA issues, use `update-plan-task(..., action: "annotate_qa_failed")`, keep staged changes, inform the user, and proceed to archive with notes.

9. **Commit QA Fixes:** resolve refs with `extract-commit-metadata(kind: "qa_fix")`, then `git-commit(type: "fix", subject: "qa fixes for [plan name]")`

**Archive:**
Use `archive-plan` tool with planPath. Then stage the moved plan files, resolve archive commit refs with `extract-commit-metadata(kind: "archive")`, and create the archive commit with `git-commit`.

**Final Summary:**
```markdown
## Implementation Complete: [Plan Name]

### Tasks: [X/Y completed]
| Task | Status | Files | Notes |
|------|--------|-------|-------|
| [Task Name] | ✅ | [files] | [summary] |

### Code Reviews: [X total retry iterations]
### Holistic Review: [Passed / X retry iterations]
### QA Validation: [Skipped / Passed / Partial / Failed]

### Commits
[commit hashes with messages]

### Discoveries
[all accumulated discoveries, or "None"]
```
