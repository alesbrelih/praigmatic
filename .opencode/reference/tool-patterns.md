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

## TodoWrite Tool

**Usage: Task tracking and planner-developer coordination**

### Basic Todo Creation

```
TodoWrite({
  todos: [
    {
      content: "Install dependencies (NO_TTD) (Small)",
      status: "pending",
      activeForm: "Installing dependencies"
    },
    {
      content: "Implement user authentication (TTD_REQUIRED) (Large)",
      status: "pending",
      activeForm: "Implementing user authentication"
    },
    {
      content: "Write integration tests (TTD_REQUIRED) (Medium)",
      status: "pending",
      activeForm: "Writing integration tests"
    }
  ]
})
```

### Todo Status Updates

```
# Mark task as in_progress (developer picks up task)
TodoWrite({
  todos: [
    {
      content: "Implement user authentication (TTD_REQUIRED) (Large)",
      status: "in_progress",
      activeForm: "Implementing user authentication"
    },
    # ... other todos
  ]
})

# Mark task as completed (developer finishes task)
TodoWrite({
  todos: [
    {
      content: "Implement user authentication (TTD_REQUIRED) (Large)",
      status: "completed",
      activeForm: "Implementing user authentication"
    },
    # ... other todos
  ]
})
```

### Todo Format Standards

**Required fields:**
- `content`: Imperative form - "Install Auth0 SDK", "Update database schema"
- `status`: "pending" | "in_progress" | "completed"
- `activeForm`: Present continuous - "Installing Auth0 SDK", "Updating database schema"

**Optional metadata in content:**
- TTD requirement: "(TTD_REQUIRED)" or "(NO_TTD)"
- Size estimate: "(Small)" for <1hr, "(Medium)" for 1-4hr, "(Large)" for 4hr+
- Blocker status: "(BLOCKED: waiting for X)" if dependencies unmet

**Examples:**
```
# Good todo content examples:
"Install Auth0 SDK (NO_TTD) (Small)"
"Update database schema for OAuth fields (TTD_REQUIRED) (Medium)"
"Implement JWT validation middleware (TTD_REQUIRED) (Large)"
"Write integration tests (TTD_REQUIRED) (Medium)"
"Debug authentication flow (NO_TTD) (Small) (BLOCKED: waiting for API key)"
```

### Planner Usage Pattern

```
# Step 1: Create todos for implementation plan
TodoWrite({
  todos: [
    { content: "Task 1 (NO_TTD) (Small)", status: "pending", activeForm: "Doing Task 1" },
    { content: "Task 2 (TTD_REQUIRED) (Medium)", status: "pending", activeForm: "Doing Task 2" },
    { content: "Task 3 (TTD_REQUIRED) (Large)", status: "pending", activeForm: "Doing Task 3" }
  ]
})

# Step 2: Write plan file
write(".opencode/plans/add-oauth-authentication.md", [plan content])

# Step 3: Return control to user (DO NOT spawn developer)
# Output summary for user:
✅ Planning complete!

Created 3 tasks for OAuth2 authentication.
Plan saved at: .opencode/plans/add-oauth-authentication.md

Todos:
1. Task 1 (NO_TTD) (Small)
2. Task 2 (TTD_REQUIRED) (Medium)
3. Task 3 (TTD_REQUIRED) (Large)

---

Next steps:
1. Switch to @pragmatic-developer
2. Say "Continue" or "Implement the plan"
```

### Developer Usage Pattern

```
# User manually switches to @pragmatic-developer and says "Continue"

# Phase 0: Auto-detect plan and todos
bash(command: "ls .opencode/plans/*.md 2>/dev/null | grep -v README")
# Finds: .opencode/plans/add-oauth-authentication.md

read(".opencode/plans/add-oauth-authentication.md")
# Todos are already in system from planner

# Output acknowledgment:
📋 Found plan: .opencode/plans/add-oauth-authentication.md
📝 Found 3 pending todos

Starting implementation...

# Phase 1-3: Work on first pending task
TodoWrite - Mark first task as "in_progress"
# ... implement task ...

# Phase 4: Complete task and move to next
TodoWrite - Mark current task as "completed"
TodoWrite - Mark next task as "in_progress"
# ... loop until all tasks done ...

# When all tasks completed:
bash(command: "mv .opencode/plans/add-oauth-authentication.md .opencode/plans/archive/add-oauth-authentication-$(date +%Y-%m-%d).md")
```

### Handling Task Failures

```
# If task blocked or fails:
TodoWrite({
  todos: [
    {
      content: "Implement OAuth callback (TTD_REQUIRED) (Large)",
      status: "in_progress",  # Keep as in_progress
      activeForm: "Implementing OAuth callback"
    },
    {
      content: "Debug missing Auth0 credentials before continuing OAuth callback",
      status: "pending",  # New blocker task
      activeForm: "Debugging missing Auth0 credentials"
    },
    # ... other todos ...
  ]
})
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
