---
description: Load plan file and orchestrate plan-driven implementation
---

Load plan file and begin plan-driven implementation:

## Step 1: Find Plan File

```bash
if [ -n "$1" ]; then
  PLAN_FILE=".opencode/plans/$1"
else
  PLAN_FILE=$(ls -t .opencode/plans/*.md 2>/dev/null | grep -v README | head -1)
fi

if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
  echo "❌ No plan file found. Usage: /pragmatic-implementation [plan-file.md]"
  exit 1
fi
echo "📋 Found plan: $PLAN_FILE"
```

## Step 2: Pre-flight Validation

```bash
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  WARNING: Uncommitted changes detected"
  git status --short
  echo "Recommended: Commit or stash changes first"
  read -p "Continue anyway? (y/N): " confirm
  [ "$confirm" != "y" ] && [ "$confirm" != "Y" ] && exit 1
fi
echo "✅ Pre-flight checks passed"
```

## Step 3: Read & Parse Plan

1. **Read** the plan file (use Read tool)
2. **Parse** tasks (format: `- [ ] **Task Name** (SIZE)`):
   - Status: `[ ]` = pending, `[~]` = in-progress, `[x]` = completed
   - Size: `(Small)`, `(Medium)`, `(Large)`

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

1. **Edit** the plan file: Change checkbox from `- [ ]` to `- [~]`
2. **Verify** the edit: Read the plan file to confirm the change was saved

```bash
# Example using Edit tool:
# Edit tool: Replace `- [ ] **Task Name**` with `- [~] **Task Name**`

# Then verify:
# Read tool: Read the plan file to confirm the change
```

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

The developer agent will return one of three completion statuses. Handle each appropriately:

#### ✅ Task Completed

If the developer returns success:
1. **Collect file list** from the developer's response (Files Modified section)
2. **Stage changes** for commit:
   ```bash
   git add [file1] [file2] [file3]
   ```
3. **Proceed to Step 5.4** (Update Plan & Commit)

#### ❌ Task Failed

If the developer returns failure:
1. **Document the failure** in the plan file by adding a sub-item:
   ```markdown
   - [ ] **Task Name**
     - ⚠️ FAILED: [Error message from developer]
   ```
2. **Do not commit** the changes (developer may have partial changes)
3. **Stop the loop** - require user intervention to resolve the failure
4. **Inform the user** of the failure and next steps needed

#### ⚠️ Task Blocked

If the developer returns blocked status:
1. **Document the blocker** in the plan file:
   ```markdown
   - [ ] **Task Name**
     - ⚠️ BLOCKED: [Blocker description from developer]
     - Required: [Required action from developer's response]
   ```
2. **Do not commit** the changes (task not completed)
3. **Stop the loop** - require user to provide missing information or resolve blocker
4. **Inform the user** of what's blocking and what's needed

### 5.4 Update Plan & Commit (for Successful Tasks)

1. **Update checkbox**: Change from `- [~]` to `- [x]`
2. **Verify edit**: Read plan file to confirm
3. **Commit changes**:
   ```bash
   task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Completed task '[Task Name]'. Files: [list of files from developer]")
   ```

### 5.5 Continue to Next Task

1. **Read the plan file** to find the next unchecked task (`- [ ]` or `[~]`)
2. **Prioritize in-progress tasks** (`[~]`) over pending tasks (`[ ]`)
3. **Repeat from Step 5.1** for the next task

### 5.2 Update Plan & Commit
1. Edit checkbox: `- [~]` → `- [x]` (or `- [ ]` → `- [x]` if no in-progress was set)
2. Verify edit (Read plan file)
3. Commit changes (use pragmatic-committer)
4. Find next unchecked task, repeat from 5.1

### 5.3 All Tasks Completed
- Verify all checkboxes: `- [x]`
- Perform holistic code review
- Archive plan:
  ```bash
  TIMESTAMP=$(date +%Y-%m-%d)
  PLAN_NAME=$(basename "$PLAN_FILE" .md)
  mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
  echo "✅ Plan archived: .opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
  ```
- Stage and commit the archive move:
  ```bash
  git add ".opencode/plans/${PLAN_NAME}.md" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
  task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Plan '${PLAN_NAME}' completed and archived")
  ```

### 5.6 All Tasks Completed

If all tasks have checkbox `[x]` (completed):

#### Step 5.6.1: Holistic Code Review

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

#### Step 5.6.2: Archive Plan

After successful holistic review, move the plan file to the archive:

```bash
TIMESTAMP=$(date +%Y-%m-%d)
PLAN_NAME=$(basename "$PLAN_FILE" .md)
mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
echo "✅ Plan archived: .opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
```

Stage and commit the archive move:

```bash
git add ".opencode/plans/${PLAN_NAME}.md" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Plan '${PLAN_NAME}' completed and archived")
```

#### Step 5.6.3: Final Summary

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
1. Keep task checkbox as `- [ ]`
2. Add blocker note as sub-item:
   ```markdown
   - [ ] **Task Name**
     - ⚠️ BLOCKED: Missing dependency X
   ```
3. Stop the implementation loop
4. Do not commit partial changes
5. Inform user of blocker and required action

### Parallel Tasks

If the plan has tasks that can be executed in parallel:
1. Display a note in the summary
2. Let the user choose execution order
3. Execute tasks in the order specified by user
4. Update checkboxes as tasks complete

### Failed Task

**Handling:**
1. Keep task checkbox as `- [ ]`
2. Add failure note to plan file:
   ```markdown
   - [ ] **Task Name**
     - ⚠️ FAILED: [Error message]
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
