---
description: Load plan file and orchestrate plan-driven implementation
---

Load plan file and begin plan-driven implementation:

## Overview

This command uses the **plan-tasks** tool for all task status operations in plan files. The tool provides:

- **`getTaskStatus`** - Get task status from plan file
- **`markInProgress`** - Mark task as in-progress
- **`markCompleted`** - Mark task as completed
- **`addNote`** - Add note to task

**Tool benefits:**
- Path validation (prevents directory traversal)
- Task index validation
- Consistent error handling
- Line ending preservation
- Automatic indentation handling

**All plan file operations now use the plan-tasks tool instead of manual editing.**

## Step 1: Find Plan File

The **find-plan** tool locates the most recent plan file in `.opencode/plans/`.

**Usage:**
- Call the tool with no arguments to automatically find the most recent plan file
- Or provide `planName` argument to get a specific plan (e.g., `example-plan.md`)

**Returns:**
- File path to plan on success (e.g., `.opencode/plans/example-plan.md`)
- Error string prefixed with "Error:" if no plans found or specified plan doesn't exist

**Error handling:**
Check if the returned string starts with "Error:":
- If it does (error detected):
  1. Display "❌ No plan file found. Usage: /pragmatic-implementation [plan-file.md]"
  2. Display the error message from the tool
  3. Exit workflow execution
- If it doesn't (success): Proceed to next step with the returned plan path

## Step 2: Pre-flight Validation

The **validate-git-state** tool checks for uncommitted changes in the repository.

**Usage:**
- Call the tool with no arguments to check for uncommitted changes
- Or provide `allowUncommitted: true` to skip the check

**Returns:**
- JSON string that must be parsed: `"{ \"valid\": boolean, \"message\": string, \"files\": string[] }"`
  - `valid`: `true` if git state is clean, `false` if uncommitted changes exist
  - `message`: Human-readable status message
  - `files`: Array of changed file paths (from `git status --short`)

**Error handling:**
Parse the JSON string returned by the tool and check `valid` field:
- If `valid` is `true`: Proceed to next step
- If `valid` is `false` (uncommitted changes detected):
  1. Display the list of changed files from the `files` field
  2. Display message from the `message` field
  3. Recommend user to commit or stash changes first
  4. Prompt user: "Continue anyway? (y/N):"
  5. Only proceed if user confirms with 'y' or 'Y'
  6. Otherwise exit workflow execution

## Step 3: Read & Parse Plan

1. **Read** the plan file (use Read tool)
2. **Parse** tasks (format: `- [ ] **Task Name** (SIZE)`):
   - Status: `[ ]` = pending, `[~]` = in-progress, `[x]` = completed
   - Size: `(Small)`, `(Medium)`, `(Large)`

**Note:** The command uses the plan-tasks tool for task status operations. The Read tool is still used to get the overall plan structure and context.

## Step 4: Show Plan Summary

```
📋 Loaded plan: .opencode/plans/example-plan.md

Tasks (4 total):
[x] 1. Completed task (Small)
[~] 2. Current task (Medium)  ← IN-PROGRESS
[ ] 3. Pending task (Large)
[ ] 4. Pending task (Small)
```

## Step 5: Implementation Loop

**Task Selection Priority:**
1. If any task has `[~]` (in-progress), start with that task (first in-progress task found)
2. If no `[~]` tasks, start with first `[ ]` (pending) task

For **each task** (prioritizing in-progress first):

### 5.1 Mark Task as In-Progress

Before invoking the developer agent, update the plan file to mark the task as in-progress:

Use the **plan-tasks** tool with the `markInProgress` operation:

```bash
# Use plan-tasks tool to mark task as in-progress
plan-tasks({
  operation: "markInProgress",
  planName: "example-plan.md",  // Or omit for most recent plan
  taskIndex: 0,  // Zero-based index of the task
})
```

**Returns:** JSON string with task information:
```json
{
  "planPath": ".opencode/plans/example-plan.md",
  "lineIndex": 10,
  "status": "IN_PROGRESS",
  "content": "Task Name",
  "note": null
}
```

**Error handling:**
- If the return value starts with "Error:", display the error and stop execution
- If the task is already in-progress or done, the tool will return an error
- The tool validates task index and plan path automatically

### 5.2 Invoke Developer Agent

Construct a structured prompt for the developer agent using the information from the plan file. Follow the interface format defined in `.opencode/design/new-command-developer-interface.md`:

```markdown
# Task Execution Request

## Task Information
**Task Name:** [Extract from plan: **Task Name**]
**Purpose:** [Extract from plan: Purpose field]

## Context
### Architecture
[If plan has Architecture or Design section, include relevant parts]

### Decisions
[If plan has Decisions section or prior task decisions, include relevant parts]

### Security Considerations
[If task involves security-sensitive operations, include relevant requirements]

## Task Steps
[Extract and format from plan: Steps section as numbered list]

## Files to Modify
[Extract from plan: Files section as markdown list with descriptions]

## Additional Context
[Any other relevant information from the plan]
```

**Invoke the developer agent:**

```bash
task(agent: "pragmatic-developer", prompt: "[Paste the structured prompt above]")
```

### 5.3 Handle Developer Response

The developer agent will return one of three completion statuses. The command detects these by parsing the developer's output for specific patterns.

#### Detection Patterns

The command searches for these exact patterns in the developer's response:
- **Success**: `✅ **Task Completed:**`
- **Failed**: `❌ **Task Failed:**`
- **Blocked**: `⚠️ **Task Blocked:**`

#### ✅ Task Completed

If the developer returns success:
1. **Collect file list** from the developer's response (Files Modified section)
2. **Stage changes** for commit:
   ```bash
   git add [file1] [file2] [file3]
   ```
3. **Proceed to Step 5.4** (Self-Correcting Code Review Loop - MANDATORY)

**Note:** Do NOT skip code review. Every task must go through the code review loop before commit.

**Example developer response:**
```markdown
✅ **Task Completed:** Add user authentication

**Files Modified:**
- `src/auth.ts` - Created authentication service
- `src/middleware/auth.ts` - Created JWT verification middleware

**Summary:** Implemented JWT-based authentication with bcrypt password hashing.
```

**Handling:**
- Extract file list: `src/auth.ts`, `src/middleware/auth.ts`
- Stage changes: `git add src/auth.ts src/middleware/auth.ts`
- Continue to commit

#### ❌ Task Failed

If the developer returns failure:
1. **Document the failure** using the plan-tasks tool:

```bash
# Use plan-tasks tool to add a failure note
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",  // Or omit for most recent plan
  taskIndex: 0,  // Zero-based index of the task
  note: "FAILED: [Extracted error from developer's Error section]"
})
```

**Note format:** The note should start with "FAILED:" followed by the error message. The tool will automatically add the "⚠️" prefix and proper indentation.

2. **Do not commit** the changes (developer may have partial changes)
3. **Stop the loop** - require user intervention to resolve the failure
4. **Inform the user** of the failure and next steps needed

**Example developer response:**
```markdown
❌ **Task Failed:** Add user authentication

**Error:** Cannot find module 'bcrypt' after running npm install

**Attempted Changes:**
- `src/auth.ts` - Created authentication service (imports bcrypt)

**Next Steps:** Install bcrypt dependency or check npm configuration
```

**Resulting plan file update:**
```markdown
- [ ] **Add user authentication** (Medium)
  - ⚠️ FAILED: Cannot find module 'bcrypt' after running npm install
```

#### ⚠️ Task Blocked

If the developer returns blocked status:
1. **Document the blocker** using the plan-tasks tool:

```bash
# Add first note for the blocker
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",  // Or omit for most recent plan
  taskIndex: 0,  // Zero-based index of the task
  note: "BLOCKED: [Extracted blocker from developer's Blocker section]"
})

# Add second note for the required action
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",
  taskIndex: 0,
  note: "Required: [Extracted required action from developer's Required Action section]"
})
```

**Note format:** The notes should clearly indicate the blocker and the required action. The tool will automatically add the "⚠️" prefix and proper indentation.

2. **Do not commit** the changes (task not completed)
3. **Stop the loop** - require user to provide missing information or resolve blocker
4. **Inform the user** of what's blocking and what's needed

**Example developer response:**
```markdown
⚠️ **Task Blocked:** Add OAuth authentication

**Blocker:** Missing client credentials configuration

**Attempts Made:** Attempted to use environment variables but none found (OAUTH_CLIENT_ID, OAUTH_CLIENT_SECRET)

**Required Action:** User must provide OAuth client credentials via environment variables
```

**Resulting plan file update:**
```markdown
- [ ] **Add OAuth authentication** (Medium)
  - ⚠️ BLOCKED: Missing client credentials configuration
  - Required: User must provide OAuth client credentials via environment variables
```

### 5.4 Self-Correcting Code Review Loop (MANDATORY)

After successful task completion, enter a self-correcting loop to ensure code quality:

**Initialize Loop State:**
- `retry_count = 0`
- `max_retries = 3`
- `review_issues = null`

**Loop: While retry_count < max_retries**

#### Step 5.4.1: Code Review

**Verify Staged Changes:**
```bash
git status
```
If no files are staged, this indicates a developer error. Document and stop.

**Request Review:**
```bash
task(agent: "pragmatic-code-reviewer", prompt: "Review STAGED changes for: [Task Name].

**Task Purpose:** [Extract from plan: Purpose field]
**Iteration:** Attempt [retry_count + 1] of [max_retries]

Focus on implementation according to the task requirements.")
```

**Analyze Review Findings:**
The code-reviewer returns findings categorized by severity:
- **Critical**: Security vulnerabilities, data corruption, broken functionality
- **High**: Difficult to maintain, missing error handling, poor architecture
- **Medium/Low**: Style, optimizations, nice-to-haves

#### Step 5.4.2: Decision Point

**Determine if critical/high issues exist:**

Read the code-reviewer output to identify if there are any critical or high severity issues mentioned. This is a simple check - you don't need to parse or extract the issues, just determine if the review indicates critical/high problems.

**If NO Critical or High Issues:**
- Exit loop → Proceed to Step 5.5 (Update Plan & Commit)

**If Critical or High Issues Found:**
- Increment `retry_count`
- If `retry_count >= max_retries`:
  - Exit loop → Proceed to Step 5.6 (Handle Max Retries Exceeded)
- Else:
  - Proceed to Step 5.4.3 (Re-invoke Developer with entire code-reviewer output)

#### Step 5.4.3: Re-invoke Developer with Issues

**Note:** Do NOT unstage the current changes. The developer will make incremental fixes on top of the existing staged work.

**Build enhanced task prompt:**
```markdown
# Task Execution Request (CODE REVIEW RETRY - Attempt [retry_count] of [max_retries])

## Task Information
**Task Name:** [Original task name]
**Purpose:** [Original purpose]

## Code Review Feedback
**Status:** Previous implementation had critical/high issues that must be fixed.

The code-reviewer provided the following feedback:

```
[Paste ENTIRE code-reviewer output here - don't parse or filter]
```

## Previous Implementation Context
[Include original task steps, files, context]

## Instructions
1. Review the code review feedback above
2. Identify and fix all critical and high priority issues
3. Make incremental fixes on top of your existing staged changes (DO NOT start from scratch)
4. Ensure the fixes don't break existing functionality
5. Stage any additional changes you make
6. Return completion status

**Important:** Focus on fixing the review issues while maintaining the task's original purpose. You are building on top of your previous work - don't discard partial progress.
```

**Re-invoke developer:**
```bash
task(agent: "pragmatic-developer", prompt: "[Enhanced task prompt above]")
```

**Handle developer response:**
- If SUCCESS: Loop back to Step 5.4.1 (Code Review)
- If FAILED: Exit loop, document failure in plan file (similar to Step 5.3 Task Failed), and stop
- If BLOCKED: Exit loop, document blocker in plan file (similar to Step 5.3 Task Blocked), and stop

**End Loop**

### 5.5 Update Plan & Commit (SUCCESS PATH)

This step is reached when the code review loop exits successfully (no critical/high issues found).

1. **Mark task as completed** using the plan-tasks tool:

```bash
# Use plan-tasks tool to mark task as completed
plan-tasks({
  operation: "markCompleted",
  planName: "example-plan.md",  // Or omit for most recent plan
  taskIndex: 0,  // Zero-based index of the task
})
```

**Returns:** JSON string with task information:
```json
{
  "planPath": ".opencode/plans/example-plan.md",
  "lineIndex": 10,
  "status": "DONE",
  "content": "Task Name",
  "note": null
}
```

**Error handling:**
- If the return value starts with "Error:", display the error and stop execution
- The tool validates task index and plan path automatically

2. **Commit changes**:
   ```bash
   task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Completed task '[Task Name]'. Files: [list of files from developer]")
   ```

After successful commit, proceed to next task (Step 5.8: Continue to Next Task).

### 5.6 Handle Max Retries Exceeded (FAILURE PATH)

This step is reached when the code review loop exits because max_retries was reached (developer couldn't fix critical/high issues after 3 attempts).

1. **Document in plan file** using the plan-tasks tool:

```bash
# Add note for the code review failure
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",  // Or omit for most recent plan
  taskIndex: 0,  // Zero-based index of the task
  note: "CODE_REVIEW_FAILED_AFTER_RETRIES: [Summary of remaining critical/high issues]"
})

# Add note for attempts count
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",
  taskIndex: 0,
  note: "Attempts: [retry_count] iterations completed"
})

# Add note for required action
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",
  taskIndex: 0,
  note: "Required: Manual review and fixes needed"
})
```

**Note format:** Each note should be added separately to create a clear record of the failure, attempts, and required action.

2. **Do NOT commit** the changes
3. **Keep files staged** for user to review and fix
4. **Stop the loop** - require user intervention
5. **Inform the user:**
   ```
   ⚠️ Code review failed after [retry_count] attempts for task: [Task Name]

   Remaining Critical/High Issues:
   [Paste remaining issues from final code-reviewer output]

   The developer attempted to fix these issues [retry_count] times but was unable to resolve them.

   Next Steps:
   - Review the staged changes (git diff --staged)
   - Manually fix the remaining critical/high issues
   - Re-run the implementation command to retry this task
   ```

### 5.8 Continue to Next Task

1. **Read the plan file** to find the next unchecked task (`- [ ]` or `[~]`)
2. **Prioritize in-progress tasks** (`[~]`) over pending tasks (`[ ]`)
3. **Repeat from Step 5.1** for the next task

### 5.9 All Tasks Completed

If all tasks have checkbox `[x]` (completed):

#### Step 5.9.1: Holistic Code Review

After all tasks complete, perform a holistic review of the entire feature:

1. **Identify relevant commits**: Use `git log` to find commits related to the plan:
   ```bash
   git log --oneline --all --grep="[Plan Name]" -n [number of tasks]
   ```
   Or use date range if the plan has a start date:
   ```bash
   git log --oneline --since="[start date]" --until="now"
   ```

2. **Request holistic review**:
   ```bash
   task(agent: "pragmatic-code-reviewer", prompt: "Perform a holistic review of the entire functionality implemented by this plan.

   Context:
   - Plan: [Plan Name]
   - Purpose: [Overall purpose from plan file]
   - Tasks completed: [List of all task names]
   - Relevant commits:
   [Paste git log results here]

   Review the system as a whole for:
   - Consistency across tasks
   - Architecture coherence
   - Cross-task integration issues
   - Overall code quality
   - Security considerations across the feature")
   ```

#### Step 5.9.2: Archive Plan

After successful holistic review, move the plan file to the archive.

The **archive-plan** tool moves plan files to the archive directory with a timestamp.

**Usage:**
- Call the tool with required `planPath` argument (e.g., `.opencode/plans/example-plan.md`)

**Returns:**
- New archive path (e.g., `.opencode/plans/archive/example-plan-2026-01-21.md`)

**Throws:**
- Error if the move operation fails (file not found, permission denied, etc.)

After archiving, stage and commit the archive move:

```bash
git add ".opencode/plans/[PLAN_NAME].md" ".opencode/plans/archive/[PLAN_NAME]-[TIMESTAMP].md"
task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Plan '[PLAN_NAME]' completed and archived")
```

#### Step 5.9.3: Final Summary

Provide a final summary to the user:

```
✅ All tasks completed successfully!

Plan: [Plan Name]
Tasks: [number of tasks] completed
Commits: [number of commits] made
Files modified: [count based on git status]

Plan archived to: .opencode/plans/archive/[plan-name]-[date].md
```

## Step 6: Edge Cases

### Blocked Task

**Handling:**
1. Keep task checkbox as `- [ ]` (not modified)
2. Use plan-tasks tool to add a blocker note:

```bash
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",
  taskIndex: 0,
  note: "BLOCKED: Missing dependency X"
})
```

3. Stop the implementation loop
4. Do not commit partial changes
5. Inform user of blocker and required action

### Parallel Tasks

If the plan has tasks that can be executed in parallel:
1. Display a note in the summary
2. Let the user choose execution order
3. Execute tasks in the order specified by user
4. Use plan-tasks tool to mark tasks as in-progress and completed as they finish

### Failed Task

**Handling:**
1. Keep task checkbox as `- [ ]` (not modified)
2. Use plan-tasks tool to add a failure note:

```bash
plan-tasks({
  operation: "addNote",
  planName: "example-plan.md",
  taskIndex: 0,
  note: "FAILED: [Error message]"
})
```

3. Do not commit changes (may be partial/incorrect)
4. Stop the implementation loop
5. Inform user of error and recovery steps

### Resume Capability

The command automatically resumes from in-progress tasks:
- Any task with `[~]` is executed first (before any `[ ]` tasks)
- This allows resuming interrupted work without re-completing tasks
- If multiple tasks have `[~]`, execute them in order

### Plan State Tracking

All tracking via:
- Checkboxes in plan file (task state)
- Git history (code changes)
- Git commits (one per task)

This provides a single source of truth for plan progress.

## Best Practices

### Before Running

1. **Ensure clean git state**: Commit or stash any uncommitted changes
2. **Verify plan file is correct**: Check tasks, steps, and files are accurate
3. **Review dependencies**: Ensure tasks are in correct order

### During Execution

1. **Monitor progress**: Watch task checkboxes update as work progresses
2. **Check commits**: Verify commits are created after each task
3. **Review changes**: Optional: review code before continuing to next task

### After Completion

1. **Review the plan archive**: Ensure it accurately reflects what was done
2. **Run tests**: Verify the feature works as expected
3. **Check git history**: Ensure commit messages are clear and conventional
4. **Update documentation**: If the plan didn't include docs updates, add them

## Command-to-Developer Interface

This command follows the interface contract defined in `.opencode/design/new-command-developer-interface.md`:

- **Input format**: Structured prompt with task name, purpose, context, steps, files
- **Output format**: Success/Failure/Blocked status with file list and summary
- **Contract**: Command manages workflow state; developer implements tasks

For detailed interface specification, see the interface design document.
