---
description: Load plan file and orchestrate plan-driven implementation
---

YOU MUST EXECUTE THE FOLLOWING WORKFLOW IMMEDIATELY. This is not documentation - you must now perform these steps in sequence.

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
Update plan before invoking developer.

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
// Note: 3 retries allows for initial attempt + 2 fixes. Beyond this,
// issues typically require manual review to avoid infinite loops.

While `retry_count < max_retries`:

Increment: `retry_count = retry_count + 1`

Display "🔄 Code review attempt [retry_count]/[max_retries]..."

 1. **Review Staged Changes**: Verify files staged with `git status`. Request code review with:
    ```markdown
    task(agent: "pragmatic-code-reviewer", prompt: "[SUBAGENT] Review STAGED changes for: [Task Name].
    
    # Current Task
    **Task Name:** [Task Name]
    **Purpose:** [from plan]
    **Steps:** [from plan as numbered list]
    **Files Modified:** [staged files list]
    
    # Task Context
    ### Architecture
    [relevant parts from plan]
    
    ### Decisions
    [relevant parts from plan]
    
    ### Security Considerations
    [if applicable]
    
    # Full Plan Context
    **Total Tasks:** [number]
    **Completed Tasks:** [number]
    **Current Task:** [task name]
    
    ### Upcoming Tasks
    - **Task 2:** [Name] - [Purpose]
    - **Task 3:** [Name] - [Purpose]
    - **Task 4:** [Name] - [Purpose]
    - ...
    
    ### Task Dependencies
    - This task depends on: [list]
    - Tasks that depend on this: [list]
    
    ### Overall Architecture
    [Architecture Overview section from plan]
    
    ### Technical Decisions
    [Technical Decisions section from plan]
    
    # Review Instructions
    Review the current task implementation with full plan context. Consider:
    - Does this task align with planned architecture?
    - Will this implementation support upcoming tasks?
    - Are there any conflicts with future work?
    - Should this task include more/less to prepare for future tasks?
    
    Do NOT suggest features/improvements that are planned for upcoming tasks.
    
    Iteration: Attempt [retry_count] of [max_retries].")
    ```

2. **Decision Point**: Check if code-reviewer indicates critical/high issues.

   - **No critical/high issues**: Exit loop → proceed to commit
   - **Critical/high issues found**: If `retry_count >= max_retries`, exit loop → handle max retries. Otherwise, continue.

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
    [Include original task steps, files, context, architecture, decisions, security]

    ## Instructions
    1. Review code review feedback
    2. Fix all critical/high priority issues
    3. Make incremental fixes on staged changes (DO NOT start from scratch)
    4. Ensure fixes don't break existing functionality
    5. Stage additional changes
    6. Return completion status with ✅, ❌, or ⚠️
    ```

   Invoke developer.
   - **If success**: Loop back to step 1
   - **If failed/blocked**: Exit loop immediately → do NOT continue to next task → proceed to handle max retries path (even if max_retries not reached)

   (Note: Similar to holistic loop, developer failure/blocked ends the task execution. The "max retries" limit only applies to successful iteration cycles where developer completes work but code-reviewer still finds critical/high issues.)

#### 4.5 Commit (Success Path)

Mark task completed. Commit with:
```markdown
task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes.

## Task Context
**Task Name:** [Task Name]
**Purpose:** [from plan task]

## Plan Context
**Plan Name:** [from plan]

## Commit Metadata
**Files:** [file list]
**References:** [Plan-level References + Task-level Refs, if any]
**Commit Notes:** [Task-level Commit Notes, if any]")
```

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
2. Request holistic review:
   ```markdown
   task(agent: "pragmatic-code-reviewer", prompt: "[SUBAGENT] Perform holistic review of entire functionality.
   
   # Plan Overview
   **Plan Name:** [from plan]
   **Plan Purpose:** [from plan]
   **Total Tasks:** [number]
   **All Tasks Completed:** [Yes/No]
   
   # Completed Tasks
   1. **Task 1:** [Name] - [Purpose] - Status: ✅
   2. **Task 2:** [Name] - [Purpose] - Status: ✅
   ...
   
   # Architecture & Decisions
   [Architecture Overview section from plan]
   [Technical Decisions section from plan]
   
   # Implementation Context
   [Commits from git log]
   
   # Review Focus
   - Consistency across all completed tasks
   - Architecture coherence with plan
   - Integration issues between tasks
   - Overall quality, security, maintainability
   
   **Note:** Only review completed work. Do not suggest features planned for future tasks.")
   ```

**Holistic Improvement Loop (Conditional):**
Initialize: `holistic_retry_count = 0`, `max_holistic_retries = 3`
// Note: 3 retries allows for initial attempt + 2 fixes. Beyond this,
// issues typically require manual review to avoid infinite loops.

Store holistic review output for potential retry use.

**Severity Check:** Parse code-reviewer output for `### Critical Issues` and `### High Issues` sections. Check if either section contains any issues (not empty).

**Decision Point:**

- **No critical/high issues**: Skip improvement loop → proceed to archive
- **Critical/high issues found**: Display "🔍 Holistic review found critical/high issues. Initiating improvement loop..." → enter retry loop

While `holistic_retry_count < max_holistic_retries` and critical/high issues present:

Increment: `holistic_retry_count = holistic_retry_count + 1`

Display "🔄 Holistic improvement attempt [holistic_retry_count]/[max_holistic_retries]..."

 1. **Re-invoke Developer with Holistic Feedback:**
    Build retry prompt:
    ```markdown
     # Holistic Review Improvement Request (Attempt [holistic_retry_count] of [max_holistic_retries])

    ## Plan Information
    **Plan Name:** [from plan]
    **Plan Purpose:** [from plan]
    **Tasks Completed:** [count]

    ## Holistic Review Feedback
    **Status:** Previous implementation has critical/high issues that must be fixed.

    [Paste ENTIRE code-reviewer output here]

    ## Implementation Context
    [Relevant commits from git log]
    [Task list from plan]

    **Note:** Changes to address cross-cutting issues may span multiple tasks and files. Review all affected areas.

    ## Instructions
    1. Review holistic review feedback for critical/high issues
    2. Fix cross-cutting architectural, integration, or security issues
    3. Make incremental changes on staged changes (DO NOT start from scratch)
    4. Ensure fixes don't break functionality from completed tasks
    5. Stage additional changes
    6. Return completion status with ✅, ❌, or ⚠️
    ```

   Invoke developer: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`

   2. **Handle Developer Response:**

      Parse response for completion status:
      - **Success**: Stage changes with `git add`. Request new holistic review.
      - **Failed/Blocked**: Exit loop immediately → do NOT continue retrying → proceed to failure path below

      (Note: Developer failure/blocked status immediately ends the improvement loop, regardless of retry count remaining. The "max retries" limit only applies to successful iteration cycles where the developer completes work but the code-reviewer still finds critical/high issues.)

 3. **Request Updated Holistic Review:**

    ```markdown
    task(agent: "pragmatic-code-reviewer", prompt: "[SUBAGENT] Perform holistic review again.
    
    # Plan Overview
    **Plan Name:** [from plan]
    **Plan Purpose:** [from plan]
    **Total Tasks:** [number]
    **All Tasks Completed:** [Yes/No]
    
    # Completed Tasks
    [Same task list as initial review]
    
    # Architecture & Decisions
    [Architecture Overview section from plan]
    [Technical Decisions section from plan]
    
    # Implementation Context
    [Commits from updated git log]
    
    # Review Focus
    Focus on whether previous critical/high issues were resolved.
    Review for consistency, architecture coherence, integration issues, overall quality, security.
    
    **Note:** Only review completed work. Do not suggest features planned for future tasks.")
    ```

 4. **Severity Check (Loop Continuation):**

    Parse updated review output for `### Critical Issues` and `### High Issues` sections.

    - **No critical/high issues**: Exit loop → proceed to commit fixes
    - **Critical/high issues found**: If `holistic_retry_count >= max_holistic_retries`, exit loop → handle max retries. Otherwise, continue loop.

**Commit Holistic Fixes (Success Path):**
Check if any files are staged with `git status`.
- **If no files staged**: Skip commit, display "ℹ️ Holistic review resolved without code changes. Proceeding to archive."
- **If files staged**: Commit with:
  ```markdown
  task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes.

  ## Holistic Fix Context
  **Plan Name:** [Plan Name]
  **Fix Type:** Holistic review issues
  **Iterations:** [holistic_retry_count] of [max_holistic_retries]

  ## Commit Metadata
  **Files:** [file list]
  **References:** [Plan-level References, if any]")
  ```

**Note:** All staged changes from retry iterations are included in a single commit. For complex holistic fixes spanning multiple issues, consider manual commit breakdown for better auditability.

**Handle Max Retries Exceeded / Developer Failed-Blocked (Failure Path):**

This section is triggered when:
- Max retries exceeded (`holistic_retry_count >= max_holistic_retries`) AND critical/high issues remain
- Developer returned "Failed" status during holistic retry
- Developer returned "Blocked" status during holistic retry

**Document Issues in Plan:**

Add notes to plan using `plan-tasks` → `addNote`:
- "HOLISTIC_REVIEW_FAILED: [summary of remaining issues from code-reviewer or developer]"
- "Attempts: [holistic_retry_count] iterations completed"
- "Required: Manual review and fixes needed"

**Staged Changes Handling:**

Do not commit any changes. Keep all staged changes for user manual review.

**User Notification:**

Display: "⚠️ Holistic review max retries reached. Some issues remain. Reviewing staged changes..."

Inform user of:
1. Summary of remaining issues (from code-reviewer output or developer response)
2. Number of retry attempts completed
3. Staged changes available for review
4. Next steps: User should review staged changes and decide whether to:
   - Manually fix remaining issues and re-run implementation
   - Proceed to archive with current state

After displaying this information, the plan will be archived with the failure notes for future reference.

**Archive Decision:**
Proceed to archive plan after user notification (changes remain staged, plan contains failure notes). Archive summary will include warnings about unresolved issues.

**Archive Plan:**
Use `archive-plan` tool with planPath. Stage and commit archive move:
```markdown
git add "[plan]" "[archive]" && task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes.

## Archive Context
**Plan Name:** [Name]
**Action:** Plan completed and archived

## Commit Metadata
**Files:** [plan path, archive path]
**References:** [Plan-level References, if any]")
```

**Final Summary:**

Display summary what was done.

## Edge Cases

**Blocked Task:** Add blocker note with `plan-tasks` → `addNote`. Stop loop. Do not commit. Inform user.

**Failed Task:** Add failure note with `plan-tasks` → `addNote`. Stop loop. Do not commit. Inform user.

**Holistic Review Failed:** Add failure note with `plan-tasks` → `addNote` (HOLISTIC_REVIEW_FAILED, attempts, manual fix required). Keep changes staged. Proceed to archive with warnings in summary.

**Parallel Tasks:** Display note in summary. Let user choose execution order. Execute in specified order.

**Resume Capability:** Automatically resumes from tasks with `[~]` (in-progress) before any `[ ]` (pending) tasks.

**Plan State Tracking:** Checkboxes track task state, git tracks code changes, one commit per task.

**Empty Holistic Review Output:** If code-reviewer returns no Critical/High sections, skip improvement loop and proceed to archive.

**Staged Changes from Previous Iteration:** If a previous iteration had staged changes that weren't committed, those changes remain staged when next iteration begins.
