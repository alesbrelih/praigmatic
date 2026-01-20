# Tool Patterns

Correct usage patterns for OpenCode/MCP tools.

## ⚠️ CRITICAL: Background Processes

**ALWAYS use `run_in_background: true` for servers and long-running processes:**

```bash
# ✅ CORRECT - Servers
bash(command: "go run main.go", run_in_background: true)
bash(command: "npm run dev", run_in_background: true)
bash(command: "python app.py", run_in_background: true)
bash(command: "docker-compose up", run_in_background: true)

# Wait for startup
bash(command: "sleep 3")

# Test the service
bash(command: "curl http://localhost:8080/health")

# ❌ WRONG - Will timeout
bash(command: "go run main.go")  # Blocks for 120s then fails
```

## Context7 MCP Tools

```
# Resolve library to Context7 ID
resolve-library-id(query: "Next.js authentication")
→ Returns: "/vercel/next.js"

# Query documentation
get-library-docs(libraryId: "/vercel/next.js", query: "middleware")
→ Returns: Documentation with code examples
```

## File System Tools

```
# Search file contents
grep(pattern: "func.*Auth", include: "*.go")

# Find files by pattern
glob(pattern: "**/*_test.go")

# Read file contents
read(path: "src/auth/handler.go")
```

## Web Tools

```
# Search the web
websearch(query: "OAuth2 best practices 2025")

# Fetch URL content
webfetch(url: "https://docs.example.com/api")
```

## Task Delegation

```
# Spawn subagent for research
task(agent: "pragmatic-researcher", prompt: "Research OAuth2 providers")

# Spawn subagent for code review
task(agent: "pragmatic-code-reviewer", prompt: "Review auth changes")
```

## Plan File Handling

### Find Plan File

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
```

### Read Plan File

```
# Load full plan content
read(filePath: ".opencode/plans/feature-name.md")

# Parse task format: `- [ ] **Task Name** (TTD) (SIZE)`
```

### Parse Tasks

Task format pattern: `- [ ] **Task Name** (METADATA)`

```
# Extract task components:
# - Status: `- [ ]` = pending, `- [x]` = completed
# - Task name: Text between `**` markers
# - TTD: `(TTD_REQUIRED)` or `(NO_TTD)`
# - Size: `(Small)`, `(Medium)`, `(Large)`

# Example tasks:
- [ ] **Implement user authentication** (TTD_REQUIRED) (Medium)
- [x] **Install dependencies** (NO_TTD) (Small)
- [ ] **Add database migrations** (TTD_REQUIRED) (Large)
```

### Find Next Task

```bash
# Find first unchecked task line
grep -n "^\- \[ \]" "$PLAN_FILE" | head -1

# Returns: line_number:- [ ] **Task Name** (METADATA)
```

### Update Task Checkbox (Mark Complete)

```
# Use Edit tool to change checkbox from unchecked to checked
edit(
  filePath: ".opencode/plans/feature-name.md",
  oldString: "- [ ] **Task Name** (TTD_REQUIRED) (Medium)",
  newString: "- [x] **Task Name** (TTD_REQUIRED) (Medium)"
)

# CRITICAL: Verify edit succeeded
read(filePath: ".opencode/plans/feature-name.md")
# Check that `- [x]` appears in the file
```

### Verify Plan File State

```bash
# Check if all tasks are completed
if grep -q "^\- \[ \]" "$PLAN_FILE"; then
  echo "Plan has pending tasks"
else
  echo "All tasks completed"
fi
```

### Archive Completed Plan

```bash
TIMESTAMP=$(date +%Y-%m-%d)
PLAN_NAME=$(basename "$PLAN_FILE" .md)
mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
```

### Add Blocker Note

```
# Add sub-item under task for blocker
edit(
  filePath: ".opencode/plans/feature-name.md",
  oldString: "- [ ] **Task Name** (TTD_REQUIRED) (Medium)",
  newString: "- [ ] **Task Name** (TTD_REQUIRED) (Medium)
  - ⚠️ BLOCKED: Missing dependency X"
)
```

### Complete Task Workflow

```bash
# 1. Read plan to find current task
read(filePath: ".opencode/plans/feature-name.md")

# 2. Edit checkbox to completed
edit(filePath: ".opencode/plans/feature-name.md", ...)

# 3. Verify edit succeeded (CRITICAL)
read(filePath: ".opencode/plans/feature-name.md")

# 4. Commit changes
git add .opencode/plans/feature-name.md [other files]
git commit -m "feat: Task Name"

# 5. Find next unchecked task
grep "^\- \[ \]" ".opencode/plans/feature-name.md" | head -1
# If none found, all tasks completed → archive plan
```

### Pre-flight Validation

```bash
# Check git working directory
if ! git diff-index --quiet HEAD --; then
  echo "⚠️  WARNING: You have uncommitted changes"
  git status --short
  # Prompt user to commit or continue
fi
```

## Background Processes

```
# Run blocking operations in background
bash(command: "go run main.go", run_in_background: true)
bash(command: "npm run dev", run_in_background: true)
bash(command: "docker-compose up", run_in_background: true)

# Then test the running service
bash(command: "sleep 2 && curl http://localhost:8080")
```
