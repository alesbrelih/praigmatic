# Refactor Pragmatic Planner Documentation

## Purpose

Reduce pragmatic-planner.md from 641 lines to ~400 lines while preserving all essential information, improving readability through consolidation, and extracting reusable content to reference files.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** File content already provided; documentation refactor doesn't require codebase exploration.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear - conservative refactor to ~400 lines with specific consolidation approach defined.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Small

### Phase 4: Research
**Decision:** SKIP
**Rationale:** No new technology or patterns involved; straightforward text editing task.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research conducted; nothing to synthesize.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 5
**Task size distribution:** Small: 5, Medium: 0, Large: 0

## Tasks

- [x] **Extract plan file template to reference file** (Small)
  - Purpose: Separate reusable template content from agent instructions, reducing main file size by ~120 lines
  - Steps:
    - Create `.opencode/reference/plan-template.md` with content from lines 310-430
    - Add reference link in pragmatic-planner.md to point to external template
    - Verify template file is complete and self-contained
  - Files: `.opencode/reference/plan-template.md` (new), `.opencode/agent/pragmatic-planner.md`
  - Dependencies: None

- [x] **Consolidate phase instructions into compact tables** (Small)
  - Purpose: Reduce ~150 lines of repetitive phase descriptions into clear, scannable tables
  - Steps:
    - Extract Run/Skip criteria from Phases 1-5 into single "Phase Decision Matrix" table
    - Extract Decision Protocol from each phase into single "Decision Framework" section
    - Remove redundant checkpoint sections (lines 109-174)
    - Keep phase structure overview (lines 62-69) and brief one-paragraph descriptions
  - Files: `.opencode/agent/pragmatic-planner.md`
  - Dependencies: None

- [x] **Collapse feedback loop instructions** (Small)
  - Purpose: Reduce verbose 66-line feedback section to concise 8-10 line version
  - Steps:
    - Replace lines 478-544 with compact version covering: iteration limit (3 rounds), edit actions, re-approval flow
    - Keep essential AskUserQuestion code block but trim explanatory text
    - Ensure all critical requirements are preserved (iteration limit, edit actions, finalization)
  - Files: `.opencode/agent/pragmatic-planner.md`
  - Dependencies: None

- [x] **Merge overlapping checklists** (Small)
  - Purpose: Eliminate redundancy between "Planning Checklist" and "Phase Evaluation Checklist"
  - Steps:
    - Combine lines 598-610 and 612-640 into single comprehensive checklist
    - Structure as: Pre-Planning, During Planning, Pre-Handoff sections
    - Remove any duplicate checks
    - Ensure all mandatory phase decisions remain covered
  - Files: `.opencode/agent/pragmatic-planner.md`
  - Dependencies: None

- [x] **Verify and validate refactored documentation** (Small)
  - Purpose: Ensure refactored version preserves all critical information and achieves target length
  - Steps:
    - Line count check: Verify total is ~400 lines (target range: 380-420)
    - Content verification: Ensure all 7 phases are mentioned, Run/Skip criteria complete, key examples preserved
    - Readability test: Scan through document to ensure flow is logical, sections well-connected
    - Reference file check: Verify plan-template.md is correctly linked and accessible
  - Files: `.opencode/agent/pragmatic-planner.md`, `.opencode/reference/plan-template.md`
  - Dependencies: Tasks 1-4 must complete first

## Architecture Overview

Refactoring maintains existing documentation structure with these improvements:

```
pragmatic-planner.md (main, ~400 lines)
├── Core Principles
├── Planning Reference Documents
├── Planning Workflow
│   ├── Phase Decision Matrix (new, consolidated)
│   ├── Decision Framework (new, consolidated)
│   ├── Phase 1-7 Structure Overview
│   └── Plan File Creation (with link to external template)
├── Research Patterns
├── Best Practices
└── Unified Checklist (merged)

reference/plan-template.md (new, ~120 lines)
└── Complete plan file template
```

## Technical Decisions

- **Decision 1**: Conservative refactor approach (vs aggressive)
  - Rationale: Preserves inline examples and detailed context, only eliminates clear redundancy
  - Trade-offs: More lines retained than aggressive option, but lower risk of losing critical information

- **Decision 2**: Extract template to separate reference file
  - Rationale: Template is reusable content that doesn't need to be inline; reduces file size significantly
  - Trade-offs: Adds file dependency, but improves maintainability and clarity

- **Decision 3**: Consolidate phase instructions into tables
  - Rationale: Eliminates ~150 lines of repetitive text while keeping information accessible
  - Trade-offs: Slightly denser format, but easier to scan and compare phases

## Integration Points

- `.opencode/agent/pragmatic-planner.md`: Main file being refactored
- `.opencode/reference/plan-template.md`: New reference file for extracted template
- No code changes; documentation-only refactoring

## Security Considerations

None - this is a documentation refactoring task with no security implications.

## Testing Strategy

- **Verification**: Manual review to ensure all critical information preserved
- **Line count**: Check final file is ~400 lines (±10% tolerance)
- **Link verification**: Ensure reference link to plan-template.md works
- **Readability**: Quick scan test to verify flow is logical

## Risk Points

- **Risk 1**: Critical information lost during consolidation
  - Mitigation: Careful review before removing sections; maintain essential examples
  - Fallback: Restore from original file if needed

- **Risk 2**: Reference file link may break if path changes
  - Mitigation: Use relative path from pragmatic-planner.md location
  - Fallback: Inline template if reference link fails

## Dependencies

- Tasks 1-4 can run in parallel (they affect different sections)
- Task 5 must wait for Tasks 1-4 to complete (verification step)
- External dependencies: None

## Implementation Notes

### Key Content Preservation Requirements
When editing, ensure these elements are NOT removed:
- All 7 phases mentioned in structure overview
- Run/Skip criteria for each phase (can be reformatted into tables)
- Decision Protocol concepts (can be consolidated)
- Boundary checkpoint requirements (can be merged)
- Task format details (what/why/how/where/dependencies)
- Purpose documentation section (critical for code review context)
- Finalize and return control message format

### Consolidation Patterns
Use these patterns when consolidating:
- Phase instructions → Table format with columns: Phase, Run If, Skip If, Key Actions
- Decision Protocol → Single section with: Decision, Rationale, Action steps
- Boundary checkpoints → One consolidated checklist at end of phase section
- Checklists → Single unified checklist with Pre/During/Post subsections

### Line Count Targets
- Current: 641 lines
- After template extraction: ~520 lines
- After phase consolidation: ~400 lines
- After feedback loop collapse: ~390 lines
- After checklist merge: ~380-400 lines
