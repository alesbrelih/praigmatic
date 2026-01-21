# Remove TTD Labels from Planning Workflow

## Purpose

Remove TTD_REQUIRED and NO_TTD labels from plan file task metadata to eliminate confusion. These labels add no value since TTD decisions are now made by the developer in Phase 1, not during planning.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** Task requires understanding data flow, parsing dependencies, and impact of removing TTD labels across multiple files.

**Key findings:**
- TTD labels are used only for display in pragmatic-implementation (no conditional logic)
- Developer makes independent TTD decision in Phase 1, doesn't read plan's TTD label
- Keep ttd-criteria.md - still needed for Phase 1 decision-making
- 5 active files require mandatory updates
- Low risk - no dependencies on TTD labels for execution logic

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Request is clear and specific. User confirmed the analysis and approach.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None (exploration revealed all dependencies)
**Complexity assessment:** Medium (multiple files require coordinated updates, changes are straightforward, low risk)

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Exploration provided all necessary information. Identified all files using TTD labels, confirmed no conditional logic depends on TTD, determined safe to remove from task format, identified ttd-criteria.md should be kept. No additional research needed.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research phase was conducted. Single exploration source with clear findings. No contradictions or complex decisions to resolve.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 6
**Task size distribution:** Small: 6, Medium: 0, Large: 0

## Tasks

- [x] **Update planning-guide.md task format** (Small)
  - Purpose: Remove TTD_STATUS metadata from task format examples and template to align with simplified task structure
  - Steps:
    - Remove TTD_STATUS from task metadata format description (around line 178)
    - Update all task examples from `- [ ] **Task** (TTD_REQUIRED) (Small)` to `- [ ] **Task** (Small)`
    - Remove TTD_STATUS from metadata sections and validation checklist
    - Update task template example in Phase 7
  - Files: .opencode/reference/planning-guide.md
  - Dependencies: None

- [x] **Update tool-patterns.md task format** (Small)
  - Purpose: Remove TTD labels from task format examples and code snippets to maintain consistency with planning-guide.md
  - Steps:
    - Update task format section to show only size metadata (line 109)
    - Change example tasks from `- [ ] **Task** (TTD_REQUIRED) (Medium)` to `- [ ] **Task** (Medium)`
    - Update edit code examples to remove TTD from oldString/newString patterns
    - Verify all examples show clean `(SIZE)` format
  - Files: .opencode/reference/tool-patterns.md
  - Dependencies: None

- [x] **Update plans/README.md template** (Small)
  - Purpose: Update plan template examples to show simplified task format without TTD labels
  - Steps:
    - Change template examples from `- [ ] **Task Name** (TTD_REQUIRED) (Small)` to `- [ ] **Task Name** (Small)`
    - Ensure both example tasks use consistent format
    - Update any explanatory text that references TTD_STATUS metadata
  - Files: .opencode/plans/README.md
  - Dependencies: None

- [x] **Update pragmatic-implementation command** (Small)
  - Purpose: Update pragmatic-implementation command documentation to reflect simplified task format without TTD labels
  - Steps:
    - Remove TTD metadata definition from parsing section (line 41)
    - Update task display format in summary section (lines 50-53) to show only size and status
    - Verify no conditional logic references TTD labels
    - Keep task progress tracking (completed/in-progress/pending)
  - Files: .opencode/commands/pragmatic-implementation.md
  - Dependencies: None

- [x] **Update pragmatic-developer workflow documentation** (Small)
  - Purpose: Emphasize that TTD decision is made independently in Phase 1, not read from plan file metadata
  - Steps:
    - Update Phase 1 assessment description to emphasize independent TTD decision
    - Change TTD decision placeholder from `[TTD_REQUIRED / NO_TTD]` to just `[TTD_REQUIRED / NO_TTD]` with clarification that this is Phase 1 output
    - Update examples to remove references to reading TTD from plan
    - Clarify in quality checklist that TTD refers to Phase 1 decision, not plan label
  - Files: .opencode/agent/pragmatic-developer.md
  - Dependencies: None

- [x] **Verify consistency across all files** (Small)
  - Purpose: Ensure all documentation and templates consistently use the simplified task format
  - Steps:
    - Search for any remaining TTD_REQUIRED or NO_TTD references in active files (not archive)
    - Verify task format examples are consistent across all files
    - Check that no hidden parsing or display logic depends on TTD labels
    - Confirm ttd-criteria.md is still accessible and referenced correctly by Phase 1
  - Files: All .opencode/ active files
  - Dependencies: Complete tasks 1-5

## Architecture Overview

The pragmatic-planner workflow consists of three stages:

1. **Planning Phase**: pragmatic-planner creates plan files with task lists
2. **Parsing Phase**: pragmatic-implementation command parses plan and spawns developer
3. **Execution Phase**: pragmatic-developer executes tasks with Phase 1 TTD assessment

**Current Issue**: TTD labels in plan metadata are redundant because:
- Developer makes independent TTD decision in Phase 1
- No conditional logic depends on plan's TTD label
- Creates confusion about authoritative TTD decision source

**Solution**: Remove TTD from plan metadata, keep TTD decision in developer Phase 1 where it belongs.

## Technical Decisions

- **Decision 1**: Remove TTD_STATUS from task metadata in all plan files
  - Rationale: TTD is an implementation detail decided during execution, not planning
  - Trade-offs: Cleaner task format, less metadata to maintain

- **Decision 2**: Keep ttd-criteria.md reference document
  - Rationale: Developer needs criteria for Phase 1 TTD decision-making
  - Trade-offs: None - document still serves valuable purpose

- **Decision 3**: Update pragmatic-developer to clarify Phase 1 TTD authority
  - Rationale: Developers need clear understanding that Phase 1 decision is authoritative
  - Trade-offs: Slight documentation update, no code changes

## Integration Points

**Affected files:**
- `.opencode/reference/planning-guide.md` - Task format examples and templates
- `.opencode/reference/tool-patterns.md` - Task format code examples
- `.opencode/plans/README.md` - Plan template examples
- `.opencode/commands/pragmatic-implementation.md` - Parsing and display logic
- `.opencode/agent/pragmatic-developer.md` - Phase 1 workflow documentation

**Preserved files:**
- `.opencode/reference/ttd-criteria.md` - Still needed for Phase 1 decisions

**Not affected:**
- Archived plans - Leave historical records as-is
- Analysis files - Can keep for reference

## Security Considerations

None. This is a documentation and metadata cleanup task with no security implications.

## Testing Strategy

- **Manual Testing**: Verify updated task format examples work correctly
- **Consistency Check**: Search for remaining TTD references in active files
- **Integration Test**: Run pragmatic-implementation with a test plan to verify parsing works without TTD labels
- **Documentation Review**: Ensure all examples are consistent and clear

## Risk Points

- **Risk 1**: Inconsistent updates across files
  - Mitigation: Verification task (task 6) ensures all references are removed
  - Fallback: Manual review of grep results for TTD_REQUIRED/NO_TTD

- **Risk 2**: Breaking existing workflow if hidden parsing logic exists
  - Mitigation: Exploration confirmed no conditional logic depends on TTD labels
  - Fallback: Test with a sample plan file before deploying changes

- **Risk 3**: User confusion about TTD process changes
  - Mitigation: Clear documentation updates in pragmatic-developer Phase 1 section
  - Fallback: Update FAQ or troubleshooting guides if needed

## Dependencies

- All tasks (1-5) can run in parallel
- Task 6 depends on tasks 1-5 completing first
- No external dependencies

## Implementation Notes

**Current task format:**
```markdown
- [ ] **Task Name** (TTD_REQUIRED) (Small)
```

**New task format:**
```markdown
- [ ] **Task Name** (Small)
```

**Key principle:** TTD decisions belong in the execution phase (developer Phase 1), not the planning phase. This separation aligns with single responsibility and keeps planning focused on WHAT needs to be done, while execution focuses on HOW.

**Verification command after completion:**
```bash
grep -r "TTD_REQUIRED\|NO_TTD" .opencode --exclude-dir=plans/archive
```
Expected: No results in active files (ttd-criteria.md should contain these terms in content, but that's OK)
