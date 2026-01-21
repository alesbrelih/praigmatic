# Add Holistic Review Improvement Loop Implementation Plan

## Purpose

Add a self-improvement loop after holistic review in the implementation command to address critical/high architectural, integration, and security issues that span multiple tasks, similar to the per-task code review loop.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** Needed to understand code-reviewer output format (severity indicators) and developer retry invocation patterns to implement consistent loop structure.
**Summary:** Code-reviewer returns sections with Critical/High/Medium/Low issues and quality scores. Developer retry uses specific prompt format with Code Review Feedback section and numbered instructions.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** User request is clear - add self-improvement loop after holistic review similar to per-task loop, with surgical targeting of critical/high issues only.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:**
- Max retries for holistic loop (will use 3, fewer than per-task 5)
- Commit strategy for holistic fixes (will add separate commit before archive)
- Fallback if developer fails during holistic retry (will document in plan notes)

**Complexity assessment:** Medium - involves new loop structure, severity-based decision logic, edge case handling, but leverages existing patterns.

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Exploration already provided all needed patterns (code-reviewer severity format, developer retry template, integration points). No additional unknowns requiring research.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted. Exploration findings provide sufficient patterns to implement the feature directly.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 5
**Task size distribution:** Small: 4, Medium: 1

### Phase 7: Create Plan File
**Status:** Complete

## Tasks

- [x] **Add Holistic Review Severity Check Logic** (Small)
  - Purpose: Parse holistic review output to detect critical/high issues and determine if improvement loop is needed
  - Steps:
    - Parse code-reviewer output for `### Critical Issues` and `### High Issues` sections
    - Check if either section contains any issues (not empty)
    - Create decision point: issues found → enter retry loop, no issues → proceed to archive
    - Store review output for potential retry use
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: None

- [x] **Create Holistic Retry Loop Structure** (Medium)
  - Purpose: Implement retry loop similar to per-task but scoped for cross-cutting architectural fixes
  - Steps:
    - Initialize `holistic_retry_count = 0`, `max_holistic_retries = 3`
    - Create while loop `holistic_retry_count < max_holistic_retries`
    - Inside loop: invoke developer with holistic retry prompt (from task 3)
    - Parse developer response for success/fail/blocked patterns
    - If success: increment retry count, loop back to re-review
    - If failed/blocked: exit loop with note
    - Check review severity: if no critical/high → exit loop to archive
    - If max retries exceeded with issues: exit to failure handling
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 1

- [x] **Create Holistic Retry Prompt Template** (Small)
  - Purpose: Provide developer with context to address holistic review feedback across multiple tasks
  - Steps:
    - Create prompt format similar to per-task retry but adapted for holistic scope
    - Include sections: Code Review Feedback (entire output), Previous Implementation Context (plan purpose, task list, commits), Instructions
    - Instructions: 1) Review feedback for critical/high issues, 2) Fix cross-cutting issues, 3) Make incremental changes, 4) Don't break existing functionality, 5) Stage all changes, 6) Return completion status
    - Note that changes may span multiple tasks/files
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: None (can be done in parallel with task 1)

- [x] **Add Holistic Fix Commit Logic** (Small)
  - Purpose: Commit holistic fixes separately before archiving, preserving audit trail
  - Steps:
    - After successful developer response, invoke committer with context: "Fixed holistic review issues for plan '[Name]'. Attempt [retry_count] of [max_retries]. Files: [list all staged]"
    - Use same committer pattern as per-task commits (line 114)
    - Ensure commit is distinct from archive commit
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 2

- [x] **Handle Holistic Review Failure/Max Retries** (Small)
  - Purpose: Document unresolved issues and allow manual resolution before archiving
  - Steps:
    - If max retries exceeded or developer failed/blocked: add notes to plan using `plan-tasks` → `addNote`
    - Notes: "HOLISTIC_REVIEW_FAILED: [summary of remaining issues]", "Attempts: [retry_count] iterations completed", "Required: Manual review and fixes needed"
    - Keep changes staged for user review
    - Inform user of remaining issues and that plan will be archived with warnings
    - Proceed to archive with warning message in summary
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 2

## Architecture Overview

The implementation command currently has a per-task review loop (lines 71-123). This feature adds a second review loop at the end of implementation (after line 133) to address issues that span multiple tasks.

**Workflow:**
```
For each task:
  Developer → Per-Task Review Loop (max 5 retries) → Commit

All tasks complete → Holistic Review → [NEW] Improvement Loop (max 3 retries)
  → If critical/high issues: Developer → Re-review (repeat up to 3 times)
  → If no critical/high OR max retries: Archive Plan
```

**Key differences from per-task loop:**
1. **Scope:** Cross-cutting architectural/integration/security issues vs single task issues
2. **Trigger:** Only critical/high severity (per-task also allows critical/high but more focused)
3. **Retries:** 3 vs 5 (holistic issues should be fewer and more architectural)
4. **Context:** Entire plan, all commits, all tasks vs single task context
5. **Commit:** Separate holistic fix commit vs per-task commit

## Technical Decisions

- **Max Holistic Retries: 3** (vs 5 for per-task)
  - Rationale: Holistic issues are typically fewer and more architectural; fewer iterations prevents endless refinement
  - Trade-offs: May not resolve all issues vs faster completion

- **Separate Commit for Holistic Fixes**
  - Rationale: Preserves clear audit trail; distinguishes task-level work from architectural fixes
  - Trade-offs: One more commit vs simpler single archive commit

- **Proceed to Archive on Max Retries (with warnings)**
  - Rationale: User should have access to all changes even if issues remain; allows manual resolution
  - Trade-offs: Archive may contain incomplete fixes vs blocks completion indefinitely

- **Only Critical/High Issues Trigger Loop**
  - Rationale: Matches surgical approach; prevents endless refinement on minor issues
  - Trade-offs: Medium/low issues not automatically addressed vs maintains reasonable iteration count

## Integration Points

**Modifications to `.opencode/commands/pragmatic-implementation.md`:**
- **After line 133** (holistic review request): Add severity check logic (Task 1)
- **After severity check** (if issues found): Insert holistic retry loop (Task 2) with prompt template (Task 3)
- **Inside loop** (on success): Add commit logic (Task 4)
- **After loop** (max retries): Add failure handling (Task 5)
- **Before line 136** (archive): Ensure all changes are committed (holistic fixes + archive move)

**Existing patterns to leverage:**
- Lines 79-82: Severity check decision point pattern
- Lines 86-110: Retry prompt template structure
- Lines 114: Commit invocation with committer agent
- Lines 118-121: Max retries handling with plan notes

**Code-reviewer agent:**
- Returns `### Critical Issues` and `### High Issues` sections
- Output format: Markdown with consistent section headers

**Developer agent:**
- Accepts retry prompts with Code Review Feedback section
- Returns completion patterns: `✅ **Task Completed:**`, `❌ **Task Failed:**`, `⚠️ **Task Blocked:**`

**Committer agent:**
- Accepts context about what was done
- Creates conventional commits

## Security Considerations

- **Holistic Security Review Coverage**
  - Risk: Per-task reviews may miss security issues spanning multiple components
  - Mitigation: Holistic review explicitly checks for cross-cutting security issues; improvement loop ensures they're addressed

- **Commit History Integrity**
  - Risk: Separate holistic fix commit may confuse audit trail
  - Mitigation: Commit message clearly indicates "Fixed holistic review issues" with iteration count; preserves chronological flow

- **Staged Changes During Holistic Retries**
  - Risk: Multiple developer retries may accumulate unrelated changes
  - Mitigation: Instructions emphasize incremental fixes on staged changes; user can review staged files before commit

## Testing Strategy

- **Unit Tests** (not applicable for command modification, but verify manually):
  - Test severity detection: ensure Critical/High sections trigger loop
  - Test medium/low sections: ensure they don't trigger loop
  - Test retry loop: verify max 3 iterations, exit conditions

- **Integration Tests** (manual scenarios):
  - Scenario 1: Holistic review finds critical issues → developer fixes → re-review passes → commit → archive
  - Scenario 2: Holistic review finds high issues → developer fixes → re-review passes → commit → archive
  - Scenario 3: Holistic review finds issues → 3 retries exhausted → add notes → archive with warning
  - Scenario 4: Holistic review finds no critical/high issues → skip loop → archive immediately
  - Scenario 5: Developer fails during holistic retry → add failure note → archive with warning

- **Edge Cases:**
  - Empty code-reviewer output (should not trigger loop)
  - Mixed severity (Critical + Medium) → should trigger loop for Critical
  - Developer returns "Blocked" during holistic retry → exit loop, add note
  - Git has uncommitted changes after holistic fixes → should be committed before archive

## Risk Points

- **Endless Holistic Loops**
  - Risk: Developer keeps making changes that introduce new issues
  - Mitigation: Hard limit of 3 retries; exit and document regardless of remaining issues
  - Fallback: User can manually review and fix, or re-run command

- **Holistic Fixes Break Previous Work**
  - Risk: Architectural changes during holistic retry break functionality from earlier tasks
  - Mitigation: Instructions emphasize "don't break existing functionality"; each fix is reviewed
  - Fallback: Per-task review already validated individual task quality; holistic focuses on cross-cutting issues

- **Code-Reviewer Inconsistent Severity**
  - Risk: Code-reviewer may categorize issues differently in holistic vs per-task review
  - Mitigation: Use same code-reviewer agent; severity definitions are consistent
  - Fallback: If inconsistency observed, add note to plan; user can review

- **Commit Message Confusion**
  - Risk: Multiple "holistic fix" commits (if user re-runs command) may confuse history
  - Mitigation: Include iteration count in commit message; commit after each successful retry
  - Fallback: Git log provides full history with timestamps

## Dependencies

- Task 2 depends on Task 1 (severity check needed before loop)
- Task 4 depends on Task 2 (loop structure needed for commit logic)
- Task 5 depends on Task 2 (loop structure needed for failure handling)
- Task 3 can be done in parallel with Task 1 (prompt template independent)

**External dependencies:**
- pragmatic-code-reviewer agent (existing)
- pragmatic-developer agent (existing)
- pragmatic-committer agent (existing)
- plan-tasks tool (existing)

## Implementation Notes

**Location in implementation command:**
Insert new section between current lines 133-135:
- Line 133: Holistic review request (existing)
- **NEW:** Severity check → Retry loop (if needed) → Commit fixes
- Line 136: Archive plan (existing)

**Consistent patterns to maintain:**
- Emoji-based status parsing (`✅`, `❌`, `⚠️`)
- Section headers in prompts (`##`, `###`)
- Tool invocation format: `task(agent: "...", prompt: "...")`
- Note format: `plan-tasks` → `addNote` with descriptive text

**Prompt template for holistic retry:**
```markdown
# Holistic Review Improvement Request (Attempt [retry_count] of [max_retries])

## Plan Information
**Plan Name:** [from plan]
**Plan Purpose:** [from plan]
**Tasks Completed:** [count]

## Holistic Review Feedback
**Status:** Previous implementation has critical/high issues that must be fixed.

[Paste ENTIRE code-reviewer output here]

## Implementation Context
[Relevant commits from git log]
[Task list from plan]

## Instructions
1. Review holistic review feedback for critical/high issues
2. Fix cross-cutting architectural, integration, or security issues
3. Make incremental changes on staged changes (DO NOT start from scratch)
4. Ensure fixes don't break functionality from completed tasks
5. Stage all changes with git add
6. Return completion status with ✅, ❌, or ⚠️
```

**User-facing messages:**
- Start of holistic loop: "🔍 Holistic review found critical/high issues. Initiating improvement loop..."
- Each retry: "🔄 Holistic improvement attempt [count]/[max]..."
- Success: "✅ Holistic review passed after [count] iteration(s)"
- Max retries: "⚠️ Holistic review max retries reached. Some issues remain. Reviewing staged changes..."
