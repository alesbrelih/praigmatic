---
description: Read plan file and start plan-file-only implementation
---

Load plan file and begin plan-file-only implementation:

## Step 1: Find Plan File

Check for plan file:

```bash
# If argument provided, use it
if [ -n "$1" ]; then
  PLAN_FILE=".opencode/plans/$1"
else
  # Auto-detect most recent plan
  PLAN_FILE=$(ls -t .opencode/plans/*.md 2>/dev/null | grep -v README | head -1)
fi

# Verify file exists
if [ -z "$PLAN_FILE" ] || [ ! -f "$PLAN_FILE" ]; then
  echo "❌ No plan file found."
  echo "Usage: /pragmatic-implementation [plan-file.md]"
  exit 1
fi

echo "📋 Found plan: $PLAN_FILE"
```

## Step 1.5: Pre-flight Validation

Before starting implementation, verify the baseline is clean and stable.

### Check 1: Git Working Directory

```bash
# Check for uncommitted changes
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  WARNING: You have uncommitted changes"
  git status --short
  echo ""
  echo "Recommended actions:"
  echo "  1. Commit your changes: git commit -am 'msg'"
  echo "  2. Stash your changes: git stash"
  echo "  3. Continue anyway (not recommended)"
  read -p "Continue with implementation? (y/N): " confirm
  if [ "$confirm" != "y" ] && [ "$confirm" != "Y" ]; then
    echo "❌ Implementation aborted. Clean your working directory first."
    exit 1
  fi
fi
```

### Pre-flight Summary

```bash
echo ""
echo "✅ Pre-flight checks passed"
echo "   - Working directory verified"
echo ""
echo "Ready to begin implementation."
echo ""
```

**Note:** These checks prevent starting implementation on a broken baseline, which makes debugging much harder and can lead to wasted time.

## Step 2: Read Plan File

Use Read tool to load the full plan file content.

The plan file contains:
- **Tasks section** with markdown checkboxes: `- [ ] **Task Name** (TTD) (SIZE)`
- **Architecture overview** for context
- **Technical decisions** and rationale
- **Security considerations**
- **Testing strategy**
- **Risk points**

## Step 3: Parse Plan Tasks

Parse tasks from plan file to understand what needs to be done:

For each task line (format: `- [ ] **Task Name** (METADATA)`):

1. **Extract task components**:
   - Status: `- [ ]` = pending, `- [x]` = completed
   - Task name: Text between `**` markers
   - TTD metadata: `(TTD_REQUIRED)` or `(NO_TTD)`
   - Size estimate: `(Small)`, `(Medium)`, or `(Large)`

2. **Identify first pending task**:
   - Find the first task with status `- [ ]`
   - This will be the current implementation task

## Step 4: Show Acknowledgment

Display a summary of the plan and current task:

```
📋 Loaded plan: .opencode/plans/add-oauth-authentication.md

Plan Tasks (4 total):
[x] 1. Completed task (NO_TTD) (Small)
[→] 2. Current task (TTD_REQUIRED) (Medium)  ← CURRENT
[ ] 3. Pending task (TTD_REQUIRED) (Large)
[ ] 4. Pending task (NO_TTD) (Small)

Architecture context loaded. Starting implementation...
```

**Note:** The plan file itself tracks all task state via checkboxes. No separate todo system is needed.

## Step 5: Start Implementation

1. **Begin implementation** using the plan context:
   - Reference architecture overview for design decisions
   - Follow technical decisions documented in plan
   - Apply security considerations
   - Use testing strategy as guide

2. **As each task completes**:
   - **Update Plan**: Edit plan file to change `- [ ]` to `- [x]` for that task
   - **Verify**: Read the plan file back to confirm checkbox is marked
   - **Commit**: Run `git add . && git commit -m "feat: [Task Name]"`

3. **Move to next task**:
   - Find the next unchecked task (`- [ ]`)
   - Repeat implementation from step 5.1

4. **When all tasks are completed**:
   - Verify all plan checkboxes are marked: `- [x]`
   - Archive plan file:
      ```bash
      TIMESTAMP=$(date +%Y-%m-%d)
      PLAN_NAME=$(basename "$PLAN_FILE" .md)
      mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
      ```

5. **Proceed with implementation workflow**:
   - Follow Phase 1-4 from pragmatic-developer agent
   - Use plan context for architectural alignment
   - Apply TTD requirements as specified
   - Complete all tasks sequentially (unless parallelization is noted)

## Implementation Notes

**Task Workflow:**
```
1. Read plan file
2. Find first unchecked task (`- [ ]`)
3. Implement task (using plan context)
4. Edit checkbox to completed (`- [x]`)
5. Verify edit succeeded
6. Commit changes
7. Repeat from step 2
```

**Handling blockers:**
If a task becomes blocked:
- Keep task checkbox as unchecked `- [ ]`
- Add blocker note as sub-item in plan file:
  ```markdown
  - [ ] **Task Name**
    - ⚠️ BLOCKED: Missing dependency X
  ```
- Resolve blocker, then continue task

**Parallel tasks:**
If plan indicates tasks can run in parallel:
- Note in acknowledgment: "Tasks 4 & 5 can run in parallel"
- User can choose to execute in parallel or sequentially

**Error recovery:**
If implementation fails:
- Don't mark checkbox as completed
- Document failure in plan file as sub-item
- Plan remains active (not archived) until all tasks succeed

**Plan File as Single Source of Truth:**
- All task state tracked via checkboxes
- Git history provides audit trail
- No dual synchronization issues
- Simple and reliable

Begin implementation now.
