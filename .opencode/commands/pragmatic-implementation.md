---
description: Read plan file, create todos, and start implementation
---

Load plan file and create execution todos:

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

## Step 3: Parse Tasks and Create Todos

For each task line in the plan (format: `- [ ] **Task Name** (METADATA)`):

1. **Extract task components**:
   - Status: `- [ ]` = pending, `- [x]` = completed
   - Task name: Text between `**` markers
   - TTD metadata: `(TTD_REQUIRED)` or `(NO_TTD)`
   - Size estimate: `(Small)`, `(Medium)`, or `(Large)`

2. **Create todo using TodoWrite**:
   ```json
   {
     "content": "Task name (TTD_STATUS) (SIZE)",
     "status": "pending",  // or "completed" if plan shows [x]
     "activeForm": "Task name in present continuous form"
   }
   ```

3. **Link todo to plan file**:
   - Store plan file path as metadata reference
   - This enables updating plan checkboxes when todos complete

## Step 4: Show Acknowledgment

Display a summary:

```
📋 Loaded plan: .opencode/plans/add-oauth-authentication.md
📝 Created 5 todos from plan

Tasks:
[→] 1. Install Auth0 SDK (NO_TTD) (Small)
[ ] 2. Update database schema (TTD_REQUIRED) (Medium)
[ ] 3. Implement callback handler (TTD_REQUIRED) (Large)
[ ] 4. Add auth middleware (TTD_REQUIRED) (Medium)
[ ] 5. Integration tests (TTD_REQUIRED) (Medium)

Architecture context loaded. Starting implementation...
```

## Step 5: Start Implementation

1. **Mark first pending task as "in_progress"** using TodoWrite

2. **Begin implementation** using the plan context:
   - Reference architecture overview for design decisions
   - Follow technical decisions documented in plan
   - Apply security considerations
   - Use testing strategy as guide

3. **As each task completes**:
   - **Update Plan**: Edit plan file to change `- [ ]` to `- [x]` for that task
   - **Update Todo**: Mark current task as "completed" using TodoWrite
   - **Commit**: Run `git add . && git commit -m "feat: [Task Name]"`
   - **Next Task**: Mark next pending task as "in_progress" using TodoWrite

4. **When all tasks are completed**:
   - Verify all plan checkboxes are marked: `- [x]`
   - Archive plan file:
     ```bash
     TIMESTAMP=$(date +%Y-%m-%d)
     PLAN_NAME=$(basename "$PLAN_FILE" .md)
     mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
     ```

5. **Proceed with implementation workflow**:
   - Follow Phase 1-4 from current agent's workflow
   - Use plan context for architectural alignment
   - Apply TTD requirements as specified
   - Complete all tasks sequentially (unless parallelization is noted)

## Implementation Notes

**Handling blockers:**
If a task becomes blocked:
- Keep task status as "in_progress" (don't mark completed)
- Add blocker note to plan file:
  ```markdown
  - [ ] **Task Name**
    - ⚠️ BLOCKED: Missing dependency X
  ```
- Create new todo: "Resolve blocker: [description]"
- After blocker resolved, continue original task

**Parallel tasks:**
If plan indicates tasks can run in parallel:
- Note in acknowledgment: "Tasks 4 & 5 can run in parallel"
- User can choose to execute in parallel or sequentially

**Error recovery:**
If implementation fails:
- Don't mark task as completed
- Document failure in plan file
- Create recovery task if needed
- Plan remains active (not archived) until all tasks succeed

Begin implementation now.
