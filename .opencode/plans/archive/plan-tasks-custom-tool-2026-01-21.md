# Plan Tasks Custom Tool Implementation Plan

## Purpose

Create a custom tool (`plan-tasks.ts`) that provides a structured API for managing tasks in plan markdown files. This replaces fragile manual Edit tool operations in the pragmatic-implementation command with reliable, testable tool operations.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** New feature requiring understanding of existing tools, plan format, and integration patterns.

**Exploration Findings:**
- `.opencode/tools/` has 3 existing tools using TypeScript with `@opencode-ai/plugin` v1.1.23
- Runtime: Bun + Node.js `fs/promises` APIs
- Plan format: Markdown with checkboxes `- [ ] **Task Name** (Size)` and sub-bullets
- Tool pattern: `tool()` helper with args schema, async `execute()`, JSON-serializable returns

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Request is clear - create custom tools for plan task management. User confirmed the approach. No ambiguity.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:**
- Best approach for markdown parsing (regex vs markdown parser vs line-by-line)
- How to preserve formatting when updating checkboxes
- Edge cases in plan task formats

**Complexity assessment:** Medium (involves parsing logic, multiple operations, integration work)

### Phase 4: Research
**Decision:** RUN
**Rationale:** Unknowns identified require understanding best practices for markdown parsing and checkbox manipulation.

**Research Findings:**
- **Recommended approach:** Line-by-line regex processing with explicit pattern reconstruction
- **Pattern:** `^(\s*)([-*+])\s+(\[[ xX]\])\s+(.*)$` extracts indent, bullet, checkbox, content
- **Checkbox update:** Simple string replacement preserves formatting
- **Edge cases:** Multiple similar names, nested bullets, checkbox variations (`[ ]`, `[x]`, `[~]`), mixed content
- **No external libraries needed** - regex + line processing is sufficient and widely used in production

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** Single research source with clear, actionable findings. No contradictions or complex decisions needed.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 10
**Task size distribution:** Small: 7, Medium: 3

## Tasks

- [x] **Create tool file and basic structure** (Small)
  - Purpose: Set up the foundation for plan-tasks tool with TypeScript imports and basic structure
  - Steps:
    - Create `.opencode/tools/plan-tasks.ts`
    - Import `@opencode-ai/plugin` and required Node.js modules
    - Define TypeScript interfaces for task data structures
    - Set up tool registration pattern matching existing tools
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: None

- [x] **Implement helper functions for parsing** (Medium)
  - Purpose: Create reusable functions to parse task lines and identify task state
  - Steps:
    - Implement `parseTaskLine()` function using regex pattern `^(\s*)([-*+])\s+(\[[ xX~]\])\s+(.*)$`
    - Extract and return structured data: indent, bullet, checkbox, content, task name, size, status
    - Implement `parsePlanFile()` to read and parse entire plan file into tasks array
    - Add validation to handle malformed lines and edge cases
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Task 1

- [x] **Implement task finding logic** (Medium)
  - Purpose: Create robust logic to find specific tasks by name in the plan
  - Steps:
    - Implement `findTaskIndex()` to locate task by exact name match
    - Handle edge cases: multiple similar names, whitespace variations, case sensitivity
    - Implement `findNextPendingTask()` to get first `[ ]` task
    - Implement `findInProgressTask()` to get first `[~]` task (resume capability)
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Task 2

- [x] **Implement checkbox update logic** (Small)
  - Purpose: Create functions to update task checkboxes while preserving formatting
  - Steps:
    - Implement `updateTaskCheckbox()` to change checkbox state (preserve indent, bullet, content)
    - Handle checkbox variations: `[ ]` → `[~]` → `[x]`
    - Implement `reconstructTaskLine()` to build line from components
    - Test with various indentation and bullet types
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Task 2

- [x] **Implement getTaskStatus operation** (Small)
  - Purpose: Provide API to query all tasks with their status from a plan file
  - Steps:
    - Create `getTaskStatus` tool operation using `tool()` helper
    - Define args schema: `planPath` (string, required)
    - Parse plan file and return structured array of tasks with status
    - Return format: `{ tasks: [{ index, name, status, size, purpose }] }`
    - Add error handling for missing files and parse failures
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Tasks 2, 3

- [x] **Implement markInProgress operation** (Small)
  - Purpose: Mark a specific task as in-progress by changing checkbox to `[~]`
  - Steps:
    - Create `markInProgress` tool operation
    - Define args schema: `planPath` (string), `taskName` (string)
    - Find task by name, update checkbox to `[~]`, write file back
    - Return success message or error if task not found
    - Verify file write succeeded before returning
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Tasks 3, 4

- [x] **Implement markCompleted operation** (Small)
  - Purpose: Mark a specific task as completed by changing checkbox to `[x]`
  - Steps:
    - Create `markCompleted` tool operation
    - Define args schema: `planPath` (string), `taskName` (string)
    - Find task by name, update checkbox to `[x]`, write file back
    - Return success message or error if task not found
    - Handle both `[ ]` and `[~]` initial states
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Tasks 3, 4

- [x] **Implement addNote operation** (Medium)
  - Purpose: Add notes to tasks (failure messages, blockers, review issues)
  - Steps:
    - Create `addNote` tool operation
    - Define args schema: `planPath` (string), `taskName` (string), `note` (string)
    - Find task by name, add note as indented sub-bullet under task
    - Preserve existing notes, append new note with appropriate indentation
    - Return success message or error if task not found
  - Files: `.opencode/tools/plan-tasks.ts`
  - Dependencies: Tasks 2, 3

- [x] **Write comprehensive unit tests** (Medium)
  - Purpose: Validate tool behavior across various plan formats and edge cases
  - Steps:
    - Create test plan files with various formats (completed, pending, in-progress tasks)
    - Test edge cases: similar task names, nested bullets, extra whitespace
    - Test each operation: getTaskStatus, markInProgress, markCompleted, addNote
    - Test error handling: missing files, invalid plan paths, task not found
    - Verify formatting preservation after operations
  - Files: `.opencode/tools/plan-tasks.test.ts` or inline tests
  - Dependencies: Tasks 1-8

- [x] **Update pragmatic-implementation command** (Small)
  - Purpose: Replace manual Edit tool calls with new plan-tasks operations
  - Steps:
    - Update Step 5.1 (Mark Task as In-Progress): Replace Edit with `plan-tasks_markInProgress`
    - Update Step 5.5 (Update Plan & Commit): Replace Edit with `plan-tasks_markCompleted`
    - Update Step 5.3 (Handle Failure): Replace Edit with `plan-tasks_addNote`
    - Update Step 5.4.1 (Code Review): Use `plan-tasks_getTaskStatus` if needed
    - Test the updated command with a sample plan file
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 9

## Architecture Overview

The plan-tasks tool integrates with the existing pragmatic workflow:

```
User → /pragmatic-implementation command → plan-tasks tools → plan files
                                           ↓
                                    pragmatic-developer
                                           ↓
                                    pragmatic-committer
```

**Key Components:**
- **Helper functions**: Parse plan files, find tasks, update checkboxes
- **Tool operations**: getTaskStatus, markInProgress, markCompleted, addNote
- **Integration points**: pragmatic-implementation command (replaces Edit tool calls)
- **Data flow**: Command → plan-tasks → plan file (read/write operations)

**Existing Tools Pattern:**
- All tools follow same structure: `tool()` helper, args schema, async `execute()`
- Use Node.js `fs/promises` for file operations
- Return JSON-serializable results (strings or objects)
- Include error handling with structured messages

## Technical Decisions

- **Decision 1**: Use line-by-line regex processing instead of markdown parser library
  - Rationale: Preserves exact formatting, zero external dependencies, fast for typical plan files
  - Trade-offs: Must handle edge cases manually; parsers would handle edge cases automatically but add overhead

- **Decision 2**: Match tasks by name instead of index
  - Rationale: More resilient to task order changes, clearer API (`taskName` vs `taskIndex`)
  - Trade-offs: Ambiguous if multiple tasks have similar names; mitigated by exact matching + error handling

- **Decision 3**: Implement 4 separate tool operations instead of one monolithic operation
  - Rationale: Clear separation of concerns, easier to test, follows existing tool patterns
  - Trade-offs: More code to maintain; individual operations are simpler and more reusable

- **Decision 4**: Write tool in TypeScript matching existing tools
  - Rationale: Consistency with codebase, type safety, tool pattern established
  - Trade-offs: None - TypeScript is already used for all existing tools

- **Decision 5**: No external markdown parsing libraries
  - Rationale: Research showed regex + line processing is sufficient and production-proven
  - Trade-offs: Must implement parsing logic manually; avoids dependency overhead

## Integration Points

**Files to Modify:**
- `.opencode/tools/plan-tasks.ts` - **NEW** - Main tool implementation
- `.opencode/commands/pragmatic-implementation.md` - **UPDATE** - Replace Edit tool calls with plan-tasks operations

**Tool Operations Exposed:**
- `plan-tasks_getTaskStatus(planPath)` - Query all tasks
- `plan-tasks_markInProgress(planPath, taskName)` - Mark task as `[~]`
- `plan-tasks_markCompleted(planPath, taskName)` - Mark task as `[x]`
- `plan-tasks_addNote(planPath, taskName, note)` - Add note to task

**Command Integration Points:**
- **Step 5.1** (lines 79-92): Replace Edit tool with `markInProgress`
- **Step 5.5** (lines 330-335): Replace Edit tool with `markCompleted`
- **Step 5.3** (lines 172-229): Replace Edit tool with `addNote` for failures/blockers

**No Breaking Changes:**
- Plan file format unchanged (backward compatible)
- Command interface unchanged (users see same behavior)
- Agent configs unchanged (pragmatic-developer doesn't touch plans)

## Security Considerations

- **File path validation**: Validate `planPath` to prevent directory traversal attacks
  - Risk: Malicious path could access files outside `.opencode/plans/`
  - Mitigation: Validate path starts with `.opencode/plans/` or is relative to project root

- **Task name validation**: Sanitize `taskName` and `note` parameters
  - Risk: Malicious input could corrupt plan file structure
  - Mitigation: Escape special markdown characters, validate input length

- **File write atomicity**: Write to temp file then rename to prevent corruption
  - Risk: Partial write could corrupt plan file during power failure
  - Mitigation: Use `fs/promises` with atomic operations or backup original

- **No code execution**: Tool only does string manipulation and file I/O
  - Risk: N/A - tool doesn't execute user-provided code
  - Mitigation: N/A

## Testing Strategy

**Unit Tests:**
- Test helper functions with various plan formats (completed, pending, in-progress tasks)
- Test edge cases: similar task names, nested bullets, extra whitespace, different bullets (`-`, `*`, `+`)
- Test checkbox updates preserve formatting (indentation, bullet type, content)
- Test each tool operation with valid and invalid inputs

**Integration Tests:**
- Test tool operations with real plan files from `.opencode/plans/`
- Test command integration by running pragmatic-implementation with sample plan
- Test resume capability (find `[~]` tasks)
- Test error handling (missing files, invalid paths, task not found)

**Edge Cases to Cover:**
- Multiple tasks with similar names (match exact, not substring)
- Tasks with special characters in names (regex escaping)
- Empty plan files or missing Tasks section
- Plan files with mixed content (code blocks, tables, blockquotes)
- Checkbox variations (`[ ]`, `[x]`, `[~]`, `[X]`, trailing spaces)

**Test Plan Files:**
- Simple plan: Basic tasks without dependencies
- Complex plan: Tasks with many sub-bullets, long steps
- Edge case plan: Similar names, nested tasks, special characters

## Risk Points

- **Risk 1**: Task name matching could fail with whitespace variations
  - Mitigation: Normalize whitespace when comparing task names, use exact match on parsed content
  - Fallback: If task not found, return structured error with available task names

- **Risk 2**: File write could fail or corrupt plan file
  - Mitigation: Use atomic write operations (write to temp file, then rename)
  - Fallback: Keep backup of original file before modifications

- **Risk 3**: Regex pattern might not match all task format variations
  - Mitigation: Research multiple task patterns, test with existing plans, make pattern flexible
  - Fallback: Log parse failures, provide clear error messages

- **Risk 4**: Integration with pragmatic-implementation could have bugs
  - Mitigation: Test with sample plan files before and after command integration
  - Fallback: Roll back command changes if issues arise, keep old Edit tool calls as comments

- **Risk 5**: Multiple tasks with identical names could cause ambiguity
  - Mitigation: Use exact line matching + index, return error if multiple matches found
  - Fallback: Update plan files to ensure unique task names before using tool

## Dependencies

**Task Dependencies:**
- Task 2 (helper functions) depends on Task 1 (tool structure)
- Tasks 5-8 (tool operations) depend on Tasks 2, 3, 4 (helper logic)
- Task 9 (tests) depends on Tasks 1-8 (implementation complete)
- Task 10 (command integration) depends on Task 9 (testing complete)

**External Dependencies:**
- `@opencode-ai/plugin` v1.1.23 - Already in use by existing tools
- Node.js `fs/promises`, `node:path`, `node:fs` - Standard Node.js APIs
- Bun runtime - Already in use by existing tools
- No new npm packages needed

**System Dependencies:**
- None - tool uses only standard Node.js APIs and OpenCode plugin SDK

## Implementation Notes

**Existing Tool Patterns to Follow:**

From `find-plan.ts`:
```typescript
import { tool } from "@opencode-ai/plugin";
import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";

export default tool({
  description: "Find most recent plan file",
  args: {
    planName: tool.schema.string().optional().describe("Optional plan name")
  },
  async execute(args) {
    // Implementation
    return result;
  }
});
```

**Task Line Regex Pattern:**
```typescript
const TASK_LINE_PATTERN = /^(\s*)([-*+])\s+(\[[ xX~]\])\s+(.*)$/;
// Groups: 1=indent, 2=bullet, 3=checkbox, 4=content
```

**Checkbox State Mapping:**
- `[ ]` → status: "pending"
- `[~]` → status: "in-progress"
- `[x]` or `[X]` → status: "completed"

**Error Handling Pattern:**
```typescript
try {
  // Implementation
  return { success: true, ... };
} catch (error) {
  if (error instanceof Error) {
    return { success: false, error: error.message };
  }
  return { success: false, error: "Unknown error" };
}
```

**File Write Pattern:**
```typescript
await writeFile(planPath, updatedContent, "utf-8");
// Or use temp file + rename for atomicity
const tempPath = `${planPath}.tmp`;
await writeFile(tempPath, updatedContent, "utf-8");
await rename(tempPath, planPath);
```

**Testing Approach:**
- Create test plan files in a test fixtures directory
- Test with `Bun test` or similar testing framework
- Cover happy paths and edge cases
- Verify formatting preservation with diff comparisons

**Command Integration Pattern:**

Replace:
```bash
# Old: Edit tool
edit(filePath, oldString, newString)
```

With:
```bash
# New: plan-tasks tool
plan-tasks_markInProgress(planPath, "Task Name")
```

Note: The tool needs to be exported with a name that makes it callable. Check existing tools for export pattern - they use `export default tool()` so the operation name is the file name.
