# Plan File Handling Patterns

Patterns for working with plan files in `.opencode/plans/`.

## Find Plan File

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
  echo "No plan file found."
  exit 1
fi
```

## Parse Tasks

Task format pattern: `- [ ] **Task Name** (METADATA)`

```
# Extract task components:
# - Status: `- [ ]` = pending, `- [x]` = completed
# - Task name: Text between `**` markers
# - Size: `(Small)`, `(Medium)`, `(Large)`
```

## Find Next Task

```bash
grep -n "^\- \[ \]" "$PLAN_FILE" | head -1
```

## Update Task Checkbox

```
edit(
  filePath: ".opencode/plans/feature-name.md",
  oldString: "- [ ] **Task Name** (Medium)",
  newString: "- [x] **Task Name** (Medium)"
)

# CRITICAL: Verify edit succeeded
read(filePath: ".opencode/plans/feature-name.md")
```

## Archive Completed Plan

```bash
TIMESTAMP=$(date +%Y-%m-%d)
PLAN_NAME=$(basename "$PLAN_FILE" .md)
mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
```

## Add Blocker Note

```
edit(
  filePath: ".opencode/plans/feature-name.md",
  oldString: "- [ ] **Task Name** (Medium)",
  newString: "- [ ] **Task Name** (Medium)
  - BLOCKED: Missing dependency X"
)
```
