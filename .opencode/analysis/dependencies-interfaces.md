# Analysis: Current Dependencies and Interfaces

## Date
2026-01-21

## Plan
refactor-agent-architecture.md

## Overview
Analysis of current architecture to identify plan-specific logic that should be moved from pragmatic-developer.md to pragmatic-implementation.md

## 1. Plan-Specific Logic in pragmatic-developer.md

### Checkbox State Management
- **Phase 2 Step 1** (Lines 153-165): Mark task in-progress
  - Reads plan file to locate current task
  - Edits checkbox: `- [ ]` → `- [~]`
  - Verifies edit by reading plan file back

- **Phase 4 Step 1** (Lines 240-252): Update task to complete
  - Edits checkbox: `- [~]` → `- [x]`
  - Verifies edit by reading plan file back

- **Phase 4 Step 5** (Lines 297-304): Archive plan
  - Uses bash: `mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"`

### Purpose Context
- **Phase 3 Step 2** (Lines 216-221): Read plan for code review context
  - Reads plan file to extract Purpose section
  - Reads plan to extract current task's Purpose field
  - Passes both to code reviewer

## 2. Git-Related Logic in pragmatic-developer.md

### Calling pragmatic-committer
- **Phase 4 Step 2** (Lines 254-260): Commit after task
  - Invokes: `task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Completed task '[Task Name]'")`
  - Assumes files are already staged

### Loop Logic
- **Phase 4 Step 3** (Lines 262-276): Check for more tasks
  - Reads plan file to find next unchecked task (`- [ ]`)
  - Proceeds to Phase 1 for next task if found
  - Otherwise continues to holistic review

### Holistic Review
- **Phase 4 Step 4** (Lines 278-295): After all tasks complete
  - Runs `git log --oneline -n [number_of_tasks]`
  - Invokes pragmatic-code-reviewer with commit history
  - Passes plan name, task list, and commits

## 3. Data Flow: Command → Developer → Committer

### Command → Developer
**Current implementation:**
- No direct invocation
- pragmatic-implementation.md says "Follow pragmatic-developer agent workflow"
- LLM reads developer's instructions and executes them
- No explicit parameters passed

### Developer → Committer
**Invocation format:**
```
task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit staged changes. Context: Completed task '[Task Name]'")
```

**Context passed:** Task name only (minimal)

**Prerequisite:** Files must already be staged (developer does `git add` in Phase 3 Step 1)

### Developer → Code Reviewer
**Invocation format:**
```
task(agent: "pragmatic-code-reviewer", prompt: "Review STAGED changes for: [description]. **Plan Purpose:** [...] **Task Purpose:** [...]")
```

**Context passed:** Overall plan purpose, specific task purpose

**Prerequisite:** Files staged in Phase 3 Step 1

## 4. Current Interface: Command → Developer

**Current state:**
- **Parameters:** None (command says "follow workflow", developer reads plan file itself)
- **Contract:** Developer manages its own plan state and git operations
- **Coupling:** High - developer knows about plan file format and git workflow

## 5. Current Interface: Developer → Command

**Current state:**
- **Return value:** None (developer doesn't explicitly return status)
- **Implicit success:** If no error occurred, assume task completed
- **Blocking:** Not defined in current implementation

## 6. Current Interface: Developer → Committer

**Parameters:**
- `prompt`: "[SUBAGENT] Commit staged changes. Context: Completed task '[Task Name]'"

**Return:**
- Success: `✅ Committed: type(scope): subject`
- Failure: `❌ Commit Failed: [Reason]`

**Prerequisites:**
- Files staged by developer (Phase 3 Step 1)
- Committer analyzes changes and creates Conventional Commit

## 7. Key Issues Identified

### Problem 1: Developer Owns Workflow State
- Checkbox updates (in-progress, complete)
- Archive plan
- Loop logic (find next task)
- Holistic review orchestration

**Issue:** This is orchestration logic, not development logic. Should be in the command.

### Problem 2: Developer Knows About Plan File Format
- Reads plan file multiple times (Phase 2, Phase 3, Phase 4)
- Parses checkboxes, Purpose section
- Violates single responsibility principle

**Issue:** Developer should not know about plan file format. Should receive task context as parameters.

### Problem 3: Tight Coupling Between Command and Developer
- Command just says "follow workflow"
- Developer reads plan file directly
- No clear contract or interface
- Can't use developer standalone without passing plan file

**Issue:** Developer should be usable for non-plan tasks. Should have clear input/output contract.

### Problem 4: Git State Management Scattered
- Developer stages files (for review)
- Developer calls committer
- Developer runs git log (for holistic review)
- Developer archives plan (file system operation)

**Issue:** Command should orchestrate git state management, not developer.

### Problem 5: No Explicit Task Status
- No explicit "Task completed" or "Task blocked" return
- Success inferred from absence of errors
- Blocking not defined

**Issue:** Command needs explicit status to make orchestration decisions.

## 8. Recommendations for New Architecture

### New Interface: Command → Developer
**Parameters:**
- `task_name`: string
- `task_purpose`: string
- `plan_purpose`: string (optional, for context)
- `task_number`: integer (optional)

**Return:**
```json
{
  "status": "completed" | "failed" | "blocked",
  "files_modified": ["file1.ts", "file2.ts"],
  "error": "Error message (if failed)",
  "blocker": "Blocker description (if blocked)"
}
```

### Responsibilities
**Command (pragmatic-implementation.md):**
- Read plan file
- Manage checkbox state (in-progress, complete, blocked)
- Loop through tasks
- Call developer for each task
- Call committer after successful tasks
- Handle failures and blockers
- Perform holistic review after all tasks complete
- Archive plan

**Developer (pragmatic-developer.md):**
- Execute Phase 1-3 (Analysis, Implementation, Code Review)
- Return explicit status
- Don't manage checkboxes
- Don't call committer
- Don't read plan file
- Don't orchestrate loops

## 9. Files to Modify
1. `pragmatic-implementation.md`: Add orchestration logic
2. `pragmatic-developer.md`: Remove plan-specific logic
3. `README.md`: Update architecture documentation
