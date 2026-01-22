# Fix plan-tasks.ts for New Plan Format

## Purpose

The `plan-tasks.ts` tool stopped working after the planner format was updated to use markdown bolding for task names and text-based size markers. This plan updates the parsing logic to correctly handle the new format while maintaining backward compatibility.

## Problem Analysis

**Root Cause:** The `parseTaskLine()` function in `plan-tasks.ts` doesn't handle:
1. Markdown bolding `**Task Name**` in task names
2. Text-based size markers `(Small)`, `(Medium)`, `(Large)` vs the old numeric format `(3 points)`

**Impact:**
- Task name searches fail due to markdown symbols not being stripped
- Size extraction fails because regex only matches numeric formats
- Task status tracking and find-by-name operations are broken

**Current Format (from pragmatic-planner.md):**
```markdown
- [x] **Task Name** (Medium)
```

**Old Format (likely):**
```markdown
- [x] Task Name (3 points)
```

## Solution Overview

Update the `parseTaskLine()` function to:
1. Strip markdown bolding (`**` and `__`) from task names when extracting them
2. Support both numeric sizes `(3 points)` and text sizes `(Small|Medium|Large)`
3. Ensure `findTaskIndex()` correctly matches names regardless of formatting

## Phase Decisions

- **Phase 1 (Exploration):** SKIP - Problem is already identified in the source files
- **Phase 2 (Clarification):** SKIP - Requirements are clear: fix parsing to match the documented format
- **Phase 3 (Task Analysis):** COMPLETE
  - Unknowns: None - the issue is clearly understood
  - Complexity: Small - focused change to one function with clear requirements
- **Phase 4 (Research):** SKIP - No external research needed, this is internal logic fix
- **Phase 5 (Synthesis):** SKIP - No research to synthesize
- **Phase 6 (Task Breakdown):** COMPLETE - 3 small tasks identified
- **Phase 7 (Create Plan File):** COMPLETE - This plan file

## Tasks

### - [x] Update size extraction regex (Small)
**Purpose:** Add support for text-based size markers `(Small)`, `(Medium)`, `(Large)` while maintaining backward compatibility with numeric formats.

**Steps:**
1. Modify the `sizeMatch` regex in `parseTaskLine()` to match both formats:
   - Text: `\((Small|Medium|Large)\)\s*$/i`
   - Numeric: `\((\d+)\s*(?:point|points|pt|pts)?\)\s*$/i`
2. Combine into a single regex pattern using alternation
3. Update the `size` variable to store the matched value correctly for both formats
4. Test with both formats to ensure backward compatibility

**Files:**
- `.opencode/tools/plan-tasks.ts` (lines ~231-234)

**Dependencies:** None

### - [x] Update task name extraction to strip markdown bolding (Small)
**Purpose:** Ensure task names are extracted without markdown symbols so searches match correctly.

**Steps:**
1. After removing the size marker, strip markdown bolding from the task name:
   - Remove `**` (asterisk bold)
   - Remove `__` (underscore bold)
   - Trim whitespace after removal
2. Update the `taskName` calculation in `parseTaskLine()`
3. Verify the extraction produces clean task names (e.g., "Implement feature" not "**Implement feature**")

**Files:**
- `.opencode/tools/plan-tasks.ts` (lines ~231-239)

**Dependencies:** Task 1 (size regex update) - should be done together as they're adjacent code

### - [x] Add test coverage for new format (Small)
**Purpose:** Ensure the fix works correctly and prevent regressions with comprehensive tests.

**Steps:**
1. Verify existing tests pass by running the test suite:
   - `npm test` or `vitest` for `.opencode/tools/__tests__/plan-tasks.test.ts`
   - All existing tests should continue to pass (backward compatibility)
2. Test parsing against `.opencode/plans/test/test-plan.md`:
   - Parse the file and verify all tasks are found
   - Check that task names are correctly extracted (bolding stripped)
   - Verify size markers are extracted correctly
3. Add new test cases for the new format to the existing test file:
   - `"- [ ] **Task Name** (Small)"` → name: "Task Name", size: "(Small)"
   - `"- [ ] **Another Task** (3 points)"` → name: "Another Task", size: "(3 points)"
   - `"- [ ] __Underscore Bold__ (Medium)"` → name: "Underscore Bold", size: "(Medium)"
   - `"- [ ] No bolding (Large)"` → name: "No bolding", size: "(Large)"
4. Test `findTaskIndex()` to verify searches work:
   - Search for "Task Name" should match `**Task Name**`
   - Search for "No bolding" should match the unbolded version
   - Search for task names from test-plan.md should match successfully
5. Verify backward compatibility with old numeric format

**Files:**
- `.opencode/tools/__tests__/plan-tasks.test.ts` (add new test cases)
- `.opencode/tools/plan-tasks.ts` (add inline tests if needed)

**Dependencies:** Tasks 1 and 2 (parsing logic must be fixed first)

## Architecture Overview

The `plan-tasks.ts` tool provides plan file parsing and task management operations. The core parsing logic lives in:

- `parseTaskLine()` - Extracts structured data from a single task line
- `findTaskIndex()` - Searches for tasks by name
- `updateTaskCheckbox()` - Updates checkbox state while preserving formatting

The tool is used by other agents to track plan progress during implementation.

## Technical Decisions

1. **Support both size formats:** Instead of breaking backward compatibility, the regex will match both numeric `(3 points)` and text `(Small|Medium|Large)` formats.

2. **Strip markdown in extraction only:** We strip markdown symbols when extracting the `taskName` field for comparison, but we preserve the original formatting in the `content` field. This ensures:
   - Searches work correctly
   - Original formatting is preserved when reconstructing lines
   - No data loss in the plan file

3. **Minimal changes:** Only the `parseTaskLine()` function needs changes. Other functions (`reconstructTaskLine()`, `updateTaskCheckbox()`, `findTaskIndex()`) use the parsed data and don't need modifications.

## Integration Points

- Used by: All agents that interact with plan files (pragmatic-developer, pragmatic-committer, etc.)
- Parses: Files in `.opencode/plans/*.md` following the template format
- Exports: `findTaskIndex()`, `findNextPendingTask()`, `findInProgressTask()`, `updateTaskCheckbox()`

## Security Considerations

- No security implications - this is a parsing logic fix
- Input validation already exists (string checks, null handling)
- No new attack vectors introduced

## Testing Strategy

1. **Unit tests for parsing:**
   - Test all three checkbox states: `[ ]`, `[~]`, `[x]`
   - Test all bullet types: `-`, `*`, `+`
   - Test with and without markdown bolding
   - Test all size formats: `(Small)`, `(Medium)`, `(Large)`, `(3 points)`, `(1 pt)`

2. **Unit tests for search:**
   - Verify `findTaskIndex()` matches names with/without bolding
   - Verify case-insensitive matching works
   - Verify exact match (not substring) behavior

3. **Regression tests:**
   - Ensure old numeric format still works
   - Ensure unbolded tasks still work

## Risk Points

- **Risk:** Breaking backward compatibility with existing plans
  - **Mitigation:** Regex supports both old and new formats; tests verify old format still works

- **Risk:** Over-stripping markdown (e.g., if task name legitimately contains `**`)
  - **Mitigation:** This is unlikely given the plan format guidelines, and the pragmatic planner controls plan generation

- **Risk:** Size extraction edge cases (e.g., task names with parentheses)
  - **Mitigation:** Size regex anchors to end of line with `$`, minimizing false matches

## Dependencies

- Node.js fs/promises module (already imported)
- No external dependencies - pure TypeScript/JavaScript

## Implementation Notes

**Key regex patterns to implement:**

```javascript
// Combined size regex (matches both text and numeric formats)
const SIZE_PATTERN = /\(((?:Small|Medium|Large)|(?:\d+\s*(?:point|points|pt|pts)?))\)\s*$/i;

// Markdown bolding removal
taskName = taskName
  .replace(/\*\*/g, '')   // Remove ** bolding
  .replace(/__/g, '')      // Remove __ bolding
  .trim();                 // Clean up whitespace
```

**Expected behavior:**

```javascript
parseTaskLine("  - [ ] **Implement feature** (Medium)");
// Returns:
// {
//   indent: "  ",
//   bullet: "-",
//   checkbox: "[ ]",
//   content: "**Implement feature** (Medium)",
//   taskName: "Implement feature",    // Bolded and size stripped
//   size: "(Medium)",
//   status: "pending"
// }
```

```javascript
findTaskIndex("Implement feature", tasks);  // Should match
findTaskIndex("implement feature", tasks);  // Should match (case-insensitive)
findTaskIndex("Implement", tasks);          // Should NOT match (not substring)
```
