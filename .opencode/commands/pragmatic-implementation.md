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

### 5.1 Execute Phases 1-4
Follow `pragmatic-developer` agent workflow:
- **Phase 1**: Analysis (Security, Skills, TTD - **repeat for each task**)
- **Phase 2**: Implementation
- **Phase 3**: Code Review
- **Phase 4**: Task Completion

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
  ```

## Edge Cases

**Blocked task**: Keep `- [ ]`, add sub-item:
```markdown
- [ ] **Task Name**
  - ⚠️ BLOCKED: Missing dependency X
```

**Parallel tasks**: Note in summary, user chooses execution order

**Failed task**: Don't mark complete, document in plan, remains active until success

**Plan state**: All tracking via checkboxes + git history = single source of truth
