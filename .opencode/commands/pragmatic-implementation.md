---
description: Load plan file and orchestrate plan-driven implementation
---

Orchestrates plan-driven implementation: find plan → validate git → execute tasks → archive.

## Workflow Steps

### 1. Find Plan
Use `find-plan` tool to locate most recent plan file (or specify planName argument). If error returned, display usage message and exit.

### 2. Validate Git State
Use `validate-git-state` tool to check for uncommitted changes. If changes found, display files and prompt user to continue (y/N). Only proceed if user confirms.

### 3. Parse Plan
Read plan file and parse tasks (format: `- [ ] **Task Name** (SIZE)`). Status: `[ ]` = pending, `[~]` = in-progress, `[x]` = completed. Sizes: `(Small)`, `(Medium)`, `(Large)`.

### 4. Implementation Loop

**Task Selection:** Prioritize in-progress tasks `[~]` over pending `[ ]`. Execute tasks sequentially.

For each task:

#### 4.1 Mark In-Progress
Use `plan-tasks` with `markInProgress` operation and task index. Update plan before invoking developer.

#### 4.2 Invoke Developer
Construct task prompt following format in `.opencode/design/new-command-developer-interface.md`:
```markdown
# Task Execution Request

## Task Information
**Task Name:** [from plan]
**Purpose:** [from plan]

## Context
### Architecture
[relevant parts from plan]

### Decisions
[relevant parts from plan]

### Security Considerations
[if applicable]

## Task Steps
[from plan as numbered list]

## Files to Modify
[from plan as markdown list]

## Additional Context
[any other relevant info]
```

Invoke with: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`

#### 4.3 Handle Developer Response

Parse response for completion status patterns:
- **Success**: `✅ **Task Completed:**`
- **Failed**: `❌ **Task Failed:**`
- **Blocked**: `⚠️ **Task Blocked:**`

**Success:** Collect file list from response, stage changes with `git add`, proceed to code review loop.

**Failed:** Add failure note to plan using `plan-tasks` → `addNote` with "FAILED: [error]". Do not commit. Stop loop and inform user.

**Blocked:** Add blocker and required action notes to plan. Do not commit. Stop loop and inform user.

#### 4.4 Code Review Loop (MANDATORY)

Initialize: `retry_count = 0`, `max_retries = 3`

While `retry_count < max_retries`:

1. **Review Staged Changes**: Verify files staged with `git status`. Request code review with `task(agent: "pragmatic-code-reviewer", prompt: "Review STAGED changes for: [Task Name]. Task Purpose: [from plan]. Iteration: Attempt [retry_count + 1] of [max_retries]. Focus on implementation according to task requirements.")`

2. **Decision Point**: Check if code-reviewer indicates critical/high issues.

   - **No critical/high issues**: Exit loop → proceed to commit
   - **Critical/high issues found**: Increment `retry_count`. If `retry_count >= max_retries`, exit loop → handle max retries. Otherwise, continue.

3. **Re-invoke Developer** (if issues found and retries remain):
   Build retry prompt:
   ```markdown
   # Task Execution Request (CODE REVIEW RETRY - Attempt [retry_count] of [max_retries])

   ## Task Information
   **Task Name:** [original task name]
   **Purpose:** [original purpose]

   ## Code Review Feedback
   **Status:** Previous implementation had critical/high issues that must be fixed.

   [Paste ENTIRE code-reviewer output here]

   ## Previous Implementation Context
   [Include original task steps, files, context]

   ## Instructions
   1. Review code review feedback
   2. Fix all critical/high priority issues
   3. Make incremental fixes on staged changes (DO NOT start from scratch)
   4. Ensure fixes don't break existing functionality
   5. Stage additional changes
   6. Return completion status
   ```

   Invoke developer. If success, loop back to step 1. If failed/blocked, exit loop and document.

#### 4.5 Commit (Success Path)

Mark task completed with `plan-tasks` → `markCompleted`. Commit with: `task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Completed task '[Task Name]'. Files: [file list]")`

#### 4.6 Handle Max Retries Exceeded (Failure Path)

Add notes to plan using `plan-tasks` → `addNote`:
- "CODE_REVIEW_FAILED_AFTER_RETRIES: [summary of issues]"
- "Attempts: [retry_count] iterations completed"
- "Required: Manual review and fixes needed"

Do not commit. Keep files staged for user review. Inform user of remaining issues and next steps.

#### 4.7 Continue to Next Task

Read plan to find next unchecked task. Prioritize `[~]` over `[ ]`. Repeat from step 4.1.

#### 4.8 All Tasks Complete

**Holistic Review:**
1. Identify relevant commits with `git log --oneline --all --grep="[Plan Name]"`
2. Request holistic review: `task(agent: "pragmatic-code-reviewer", prompt: "Perform holistic review of entire functionality. Plan: [Name], Purpose: [purpose], Tasks: [list], Commits: [paste git log]. Review for consistency, architecture coherence, integration issues, overall quality, security.")`

**Archive Plan:**
Use `archive-plan` tool with planPath. Stage and commit archive move: `git add "[plan]" "[archive]" && task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Plan '[Name]' completed and archived")`

**Final Summary:**
```
✅ All tasks completed successfully!
Plan: [Name], Tasks: [N] completed, Commits: [N] made, Files: [N] modified
Archived to: .opencode/plans/archive/[plan]-[date].md
```

## Edge Cases

**Blocked Task:** Add blocker note with `plan-tasks` → `addNote`. Stop loop. Do not commit. Inform user.

**Parallel Tasks:** Display note in summary. Let user choose execution order. Execute in specified order.

**Failed Task:** Add failure note with `plan-tasks` → `addNote`. Stop loop. Do not commit. Inform user.

**Resume Capability:** Automatically resumes from tasks with `[~]` (in-progress) before any `[ ]` (pending) tasks.

**Plan State Tracking:** Checkboxes track task state, git tracks code changes, one commit per task.
