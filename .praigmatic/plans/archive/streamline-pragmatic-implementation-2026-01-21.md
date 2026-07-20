# Streamline pragmatic-implementation Command Documentation

## Purpose

Reduce the verbosity of `.opencode/commands/pragmatic-implementation.md` from 652 lines to ~150-200 lines by removing redundant tool descriptions, excessive examples, and duplicated content while preserving all essential workflow logic.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** Only one command file exists (pragmatic-implementation.md), so no patterns to compare. The interface design document (new-command-developer-interface.md) has already been reviewed and provides the necessary context for the command-to-developer contract.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** The user's request is sufficiently clear. They agree the file is bulky and want it streamlined. Target line count and specific preservation decisions can be made during implementation based on what's actually necessary.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None - analyzed the file structure and identified specific redundant sections
**Complexity assessment:** Small - This is a straightforward documentation refactoring with clear remove/condense targets

### Phase 4: Research
**Decision:** SKIP
**Rationale:** All necessary context is available from the initial file review and the interface design document. No external research or additional command files exist.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted that requires synthesis. The critical analysis identified clear areas for reduction.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 2
**Task size distribution:** Small: 2, Medium: 0, Large: 0

## Tasks

- [x] **Create streamlined version of pragmatic-implementation.md** (Small)
  - Purpose: Produce a concise version (~150-200 lines) that preserves all workflow logic while removing verbosity
  - Steps:
    1. Remove all tool benefit descriptions (lines 9-23) - LLMs learn from system context
    2. Simplify tool usage sections (find-plan, validate-git-state, markInProgress, markCompleted, archive-plan) to 1-2 lines each - remove JSON response formats and detailed parameter explanations
    3. Remove redundant JSON response examples (lines 103-123, 398-413) - LLMs discover these through tool usage
    4. Condense developer response examples (lines 173-290) from detailed markdown to 1-line summaries
    5. Streamline self-correcting loop (lines 292-388) from 96 lines to ~20 lines - keep logic, remove excessive detail
    6. Define task prompt template once (reference interface design doc) - remove duplication between initial and retry prompts
    7. Remove or condense Best Practices section (lines 622-651) - most points are redundant with workflow steps
    8. Remove Command-to-Developer Interface section (lines 643-651) - simply references another doc
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: None

- [x] **Validate streamlined version preserves essential functionality** (Small)
  - Purpose: Verify the refactored document still contains all critical information for the command to function correctly
  - Steps:
    1. Review the streamlined version to ensure all workflow steps are present (find plan, validate git, task loop, code review, commit, archive)
    2. Verify detection patterns are documented (Success: `✅ **Task Completed:**`, Failed: `❌ **Task Failed:**`, Blocked: `⚠️ **Task Blocked:**`)
    3. Confirm the task prompt template reference is present (links to interface design doc or includes the template once)
    4. Ensure error handling logic is preserved (how to handle failed/blocked/max-retries tasks)
    5. Verify edge cases are documented (parallel tasks, resume capability)
    6. Check that the command-to-developer contract is still clear (input format, output format)
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 1

## Architecture Overview

The pragmatic-implementation command orchestrates plan-driven development by:
1. Finding and loading plan files
2. Executing tasks sequentially with status tracking
3. Invoking developer agent with structured prompts
4. Managing code review loop with retries
5. Committing completed work
6. Archiving completed plans

The command file serves as **executable documentation** for LLMs, describing the workflow in natural language that the LLM parses and executes.

## Technical Decisions

### Decision 1: Remove all JSON response format documentation
- **Options Considered:** Keep JSON formats for clarity vs. Remove as unnecessary
- **Selected:** Remove JSON response format documentation
- **Rationale:** LLMs discover tool response formats through actual tool usage. The system prompt already contains tool definitions. Including JSON examples in the command file is redundant and adds ~50 lines.
- **Trade-offs:** Slightly less human-readable for developers reviewing the file, but LLMs don't need this information

### Decision 2: Condense tool usage sections to minimal descriptions
- **Options Considered:** Detailed usage with all parameters vs. Minimal 1-2 line description
- **Selected:** Minimal descriptions (e.g., "Call find-plan() to locate most recent plan file")
- **Rationale:** Tools are already described in the system context. The command only needs to specify when to call them, not how.
- **Trade-offs:** Less explicit documentation for edge cases, but LLMs rely on tool definitions in system prompt

### Decision 3: Define task prompt template once, not twice
- **Options Considered:** Duplicate prompt template for initial and retry cases vs. Reference single template
- **Selected:** Define once, reference for both cases
- **Rationale:** Reduces duplication and makes the file shorter. The retry prompt is the same template with additional code review feedback section.
- **Trade-offs:** Slightly less explicit for the retry case, but clearly documented as "same template + review feedback"

### Decision 4: Keep detection patterns explicit
- **Options Considered:** Rely on LLM to infer vs. Document explicit patterns
- **Selected:** Document explicit regex patterns for Success/Failed/Blocked
- **Rationale:** These are fragile string matching patterns that must be exact. Documentation ensures the LLM knows what to look for.
- **Trade-offs:** None - essential for correct command behavior

## Integration Points

- **Interface Design Document:** `.opencode/design/new-command-developer-interface.md` - Defines the contract for command-to-developer communication. The streamlined command should reference this rather than duplicating the prompt template.
- **Tool Definitions:** System prompt includes all tool definitions (find-plan, validate-git-state, plan-tasks, archive-plan). The command should not duplicate these.
- **Developer Agent:** The command invokes `pragmatic-developer` with structured prompts. The interface design doc specifies expected output formats.

## Security Considerations

No security implications. This is a documentation refactoring that doesn't change any code or execution paths.

## Testing Strategy

- **Manual Review:** Verify all workflow steps are present and logically ordered
- **Test Execution:** Run `/pragmatic-implementation` with a sample plan to ensure the command still works
- **Edge Cases:** Verify error handling (blocked tasks, failed tasks, max retries) is still clear

## Risk Points

- **Risk 1:** Removing too much detail could make the workflow ambiguous
  - **Mitigation:** Review the streamlined version against a mental checklist of all required operations
  - **Fallback:** Keep the original file as backup, restore if issues found

- **Risk 2:** The refactored file might be harder for humans to understand
  - **Mitigation:** Focus on preserving the workflow narrative; remove only technical details LLMs don't need
  - **Fallback:** Add brief human-readable summaries at each step if needed

## Dependencies

- Task 2 depends on Task 1 completing first
- No external dependencies

## Implementation Notes

**Current file structure (652 lines):**
- Lines 9-23: Tool benefits (REMOVE)
- Lines 25-68: Detailed tool usage (CONDENSE)
- Lines 70-90: Plan file structure (KEEP)
- Lines 92-160: Implementation loop overview (CONDENSE)
- Lines 292-388: Self-correcting loop (CONDENSE from 96 to ~20 lines)
- Lines 622-651: Best practices (REMOVE or MERGE)

**Target structure (~150-200 lines):**
1. Overview (1-2 lines: what the command does)
2. Workflow steps (find plan → validate git → task loop → archive)
3. Detection patterns (Success/Failed/Blocked)
4. Task prompt template (reference interface design doc)
5. Error handling (blocked/failed/max-retries)
6. Edge cases (parallel tasks, resume capability)

**Key preservation points:**
- All workflow logic must remain intact
- Detection patterns must be exact
- Error handling must be clear
- The command-to-developer contract must be maintained

**Remove entirely:**
- Tool benefit descriptions
- JSON response format examples
- Detailed tool usage documentation
- Duplicated prompt templates
- Most of Best Practices section (redundant)
- Command-to-Developer Interface section (just references doc)
