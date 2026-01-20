# In-Progress Task Tracking Implementation Plan

## Purpose

Enable resuming from mid-task when context is cleared by adding an in-progress `[~]` status marker to plan file tasks.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** Task involves modifying existing agent/command configuration files that are already reviewed. No new codebase patterns or integrations needed.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear: add `[~]` in-progress marker, auto-detect and resume, no extra metadata needed.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Small

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Changes are straightforward syntax additions to markdown files. No new technologies or patterns required.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted, no contradictions to resolve.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 3
**Task size distribution:** Small: 3, Medium: 0, Large: 0

## Tasks

- [x] **Update pragmatic-developer.md to mark in-progress tasks** (Small)
  - Purpose: Ensure tasks are marked as in-progress before starting implementation, enabling resume capability
  - Steps:
    - Locate "Phase 2: Implementation" section in pragmatic-developer.md
    - Add step at beginning of Phase 2 to mark current task as `[~]` in plan file
    - Update "Step 1: Update Plan File (CRITICAL)" in Phase 4 to change `[~]` to `[x]` instead of `[ ]` to `[x]`
    - Verify the logic handles marking in-progress on task start and completed on finish
  - Files: .opencode/agent/pragmatic-developer.md
  - Dependencies: None

- [x] **Update pragmatic-implementation.md to detect and resume in-progress tasks** (Small)
  - Purpose: Automatically detect in-progress tasks and continue from them instead of restarting
  - Steps:
    - Update "Step 3: Read & Parse Plan" to include `[~]` as a valid status (in-progress)
    - Update "Step 4: Show Plan Summary" to display `[~]` tasks with "← IN-PROGRESS" indicator
    - Update "Step 5: Implementation Loop" to prioritize in-progress tasks over pending tasks
    - Add detection logic: if any task has `[~]`, start with that task; otherwise, start with first pending task
  - Files: .opencode/commands/pragmatic-implementation.md
  - Dependencies: None

- [x] **Update pragmatic-planner.md to document in-progress status** (Small)
  - Purpose: Document the new `[~]` status marker in plan file format reference
  - Steps:
    - Locate "Plan file template" section around line 307-428
    - Add `[~]` status to task format documentation alongside `[ ]` and `[x]`
    - Update task format example to show all three states
    - Ensure Phase 7 task checklist section mentions the in-progress capability
  - Files: .opencode/agent/pragmatic-planner.md
  - Dependencies: None

## Architecture Overview

The in-progress tracking is a simple state machine for task checkboxes:

```
[ ] (pending) → [~] (in-progress) → [x] (completed)
```

- **pragmatic-developer**: Transitions `[ ]` → `[~]` at Phase 2 start, `[~]` → `[x]` at Phase 4 completion
- **pragmatic-implementation**: Reads plan, detects `[~]`, continues from that task; if no `[~]`, starts from first `[ ]`
- **pragmatic-planner**: Documents the status for reference only (always creates `[ ]` tasks initially)

## Technical Decisions

- **Status marker syntax**: Use `[~]` for in-progress - visually distinct from `[ ]` and `[x]`, easy to parse
- **Auto-resume**: Automatically detect and continue from in-progress task without user confirmation
- **No metadata**: Keep it simple - just the status marker, no timestamps or agent info
- **Resilience**: If context is lost mid-task, next `/pragmatic-implementation` will resume from the in-progress task

## Integration Points

- **.opencode/agent/pragmatic-developer.md**: Line 148-188 (Phase 2 start), Line 220-236 (Phase 4 completion)
- **.opencode/commands/pragmatic-implementation.md**: Line 36-54 (Parse and display), Line 56-71 (Implementation loop)
- **.opencode/agent/pragmatic-planner.md**: Line 307-438 (Plan file template and format)

## Security Considerations

None - this is a workflow enhancement that only modifies markdown plan file syntax.

## Testing Strategy

**Manual testing approach (NO_TTD):**
1. Create a test plan with multiple tasks
2. Start implementation, observe first task marked `[~]`
3. Simulate context loss by stopping mid-task
4. Re-run `/pragmatic-implementation`, verify it resumes from `[~]` task
5. Complete task, verify it becomes `[x]`
6. Verify summary correctly shows `[~]` status during implementation

## Risk Points

- **Race condition**: If multiple agents try to update the same plan file, last write wins
  - Mitigation: Single-agent workflow by design - only one pragmatic-developer instance per plan at a time
- **Corrupted state**: If `[~]` is set but implementation crashes, task stays in-progress indefinitely
  - Fallback: Manual edit of plan file to reset to `[ ]` if needed
- **Parser edge cases**: Extra whitespace or formatting around `[~]` could break detection
  - Mitigation: Use robust regex pattern matching for task status parsing

## Dependencies

- All tasks are independent and can be completed in any order
- Recommended order: pragmatic-developer → pragmatic-implementation → pragmatic-planner (follows the workflow direction)

## Implementation Notes

**Parsing pattern for task status:**
- Regex should match: `- [ ]`, `- [~]`, `- [x]`
- Case-sensitive (only lowercase brackets matter)
- Ignore sub-bullets (nested items with extra indentation)

**Summary display format:**
```
📋 Loaded plan: .opencode/plans/example-plan.md

Tasks (4 total):
[x] 1. Completed task (NO_TTD) (Small)
[~] 2. Current task (TTD_REQUIRED) (Medium)  ← IN-PROGRESS
[ ] 3. Pending task (TTD_REQUIRED) (Large)
[ ] 4. Pending task (NO_TTD) (Small)
```

**Implementation loop priority:**
1. If any task has `[~]` → start with that task (first in-progress task found)
2. If no `[~]` → start with first `[ ]` task (pending)
3. Only one task should be `[~]` at any time (enforce by setting `[~]` immediately when starting a task)
