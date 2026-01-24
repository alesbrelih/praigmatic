# Plan Review Loop Implementation Plan

## Purpose

Add automated plan quality review to pragmatic-planner, similar to the code review loop in pragmatic-implementation. This catches planning issues (overengineering, poor task granularity, logic flaws, incompleteness) before plans reach the user. Also update all relevant documentation to reflect this new workflow.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** Existing codebase structure is well-understood (agent/ and commands/ directories), and we have clear reference patterns from pragmatic-implementation.md

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear: create plan reviewer agent + add review loop to planner + update documentation, following the implementation review pattern

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Medium (requires understanding of agent permissions, planner workflow, review loop patterns, and documentation synchronization)

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Pattern well-established by pragmatic-implementation.md's code review loop - just need to adapt for plan review instead of code review

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research conducted, single clear pattern to follow

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 8
**Task size distribution:** Small: 5, Medium: 3

## Tasks

- [x] **Create pragmatic-plan-reviewer agent** (Medium)
  - Purpose: Specialized agent for reviewing plan quality, evaluating logic, granularity, completeness, and overengineering
  - Steps:
    - Create `.opencode/agent/pragmatic-plan-reviewer.md` with proper YAML header
    - Define review focus areas: logic/coherence, simplicity vs overengineering, task granularity, completeness, phase decisions quality
    - Configure permissions (read only - no write/bash/task permissions needed)
    - Define output format: Critical/High/Medium/Low issues, Positive observations
  - Files: `.opencode/agent/pragmatic-plan-reviewer.md`
  - Dependencies: None
  - Provides for Future Tasks: Plan reviewer agent that planner can invoke

- [x] **Add plan review loop to Phase 7 of pragmatic-planner** (Medium)
  - Purpose: Insert automated review loop before user presentation, mirroring implementation's code review loop
  - Steps:
    - Add review loop section between "Write plan" and "Request user feedback" in Phase 7
    - Define retry mechanism (max 3 retries like implementation)
    - Create initial review prompt with full plan content and review criteria
    - Create retry review prompt focusing on previous feedback
    - Add decision point logic: exit if no critical/high issues, or if max retries reached
  - Files: `.opencode/agent/pragmatic-planner.md`
  - Dependencies: Create pragmatic-plan-reviewer agent
  - Provides for Future Tasks: Planner can now self-review before presenting to user

- [x] **Add plan revision logic to pragmatic-planner** (Small)
  - Purpose: Define how planner responds to critical/high issues from review
  - Steps:
    - Add revision step that fixes identified issues (task edits, architecture updates, phase decisions)
    - Specify that revisions loop back to review step
    - Add max retries exceeded warning that continues to user feedback
  - Files: `.opencode/agent/pragmatic-planner.md`
  - Dependencies: Add plan review loop to Phase 7
  - Provides for Future Tasks: Planner can iterate on plan quality automatically

- [x] **Update planner permissions to invoke plan-reviewer** (Small)
  - Purpose: Ensure planner can spawn the new plan-reviewer agent
  - Steps:
    - Add `pragmatic-plan-reviewer: allow` to task permissions in planner YAML header
  - Files: `.opencode/agent/pragmatic-planner.md` (YAML header only)
  - Dependencies: Create pragmatic-plan-reviewer agent
  - Provides for Future Tasks: Planner can legally invoke plan reviewer

- [x] **Populate plan-template.md with complete template** (Small)
  - Purpose: Fill the currently empty plan-template.md with the actual template structure
  - Steps:
    - Copy the complete plan template from pragmatic-planner.md
    - Include all required sections (Phase Decisions, Tasks, Architecture, Technical Decisions, etc.)
    - Add example task showing proper format with Purpose, Steps, Files, Dependencies
    - Include notes on plan review loop integration
  - Files: `.opencode/reference/plan-template.md`
  - Dependencies: None
  - Provides for Future Tasks: Reference template for planners and reviewers

- [x] **Update plans/README.md workflow documentation** (Small)
  - Purpose: Document the plan review loop in the plans directory README
  - Steps:
    - Update "Creating Plans" section to mention the plan review loop
    - Add description of what the review loop checks (logic, overengineering, granularity, completeness)
    - Document the retry mechanism and user feedback flow
    - Mention that users see high-quality plans after automated review
  - Files: `.opencode/plans/README.md`
  - Dependencies: None
  - Provides for Future Tasks: Users understand the complete planning workflow

- [x] **Test plan review end-to-end** (Medium)
  - Purpose: Verify review loop works correctly with both passing and failing scenarios
  - Steps:
    - Create test plan with intentional issues (overengineering, poor granularity, missing sections)
    - Run planner and verify review catches issues and suggests fixes
    - Create high-quality test plan following all best practices
    - Verify review passes without critical/high issues
    - Confirm max retries path works correctly (warning + user presentation)
    - Confirm documentation accurately describes the workflow
  - Files: Test plan files, verify planner behavior, validate documentation
  - Dependencies: All previous tasks
  - Provides for Future Tasks: Confidence that review loop and documentation are accurate

## Architecture Overview

**Current Flow:**
```
User Request → Planner Phases 1-6 → Phase 7: Write Plan → User Feedback → Approval
```

**New Flow:**
```
User Request → Planner Phases 1-6 → Phase 7: Write Plan → Plan Review Loop (max 3) → User Feedback → Approval
                                              ↓
                                      Reviewer evaluates:
                                      - Logic/coherence
                                      - Simplicity vs overengineering
                                      - Task granularity
                                      - Completeness
                                      - Phase decisions quality
```

**Plan Reviewer Agent:**
- Receives: Complete plan content via prompt (context-isolated, like code-reviewer)
- Evaluates: Plan quality against established criteria
- Returns: Structured feedback (Critical/High/Medium/Low issues, Positive observations)
- No write/bash/task permissions needed (purely advisory)

**Retry Pattern (mirrors implementation):**
- Initial review → Critical/high found → Revise → Review again
- Up to 3 attempts (initial + 2 fixes)
- Max retries → Warning → Continue to user with issues noted
- No critical/high → Exit loop → User feedback

**Documentation Updates:**
- planning-guide.md: Explains review loop concept and integration into workflow
- plan-template.md: Complete plan file template
- plans/README.md: User-facing documentation of the complete planning process

## Technical Decisions

- **Decision 1**: Create separate pragmatic-plan-reviewer agent instead of reusing pragmatic-code-reviewer
  - Rationale: Plan review criteria (task granularity, logic, completeness) differ significantly from code review (maintainability, security, performance). Specialized agent can focus on planning best practices.
  - Trade-offs: Additional agent to maintain vs. cleaner separation of concerns

- **Decision 2**: Use same retry limits as implementation (3 attempts)
  - Rationale: 3 retries allows initial attempt + 2 meaningful fixes. More retries risk infinite loops; fewer may not give enough iterations.
  - Trade-offs: Fixed limit vs. dynamic retry count based on issue severity

- **Decision 3**: Reviewer receives full plan content via prompt (context-isolated)
  - Rationale: Mirrors implementation pattern where code-reviewer receives staged changes and plan context. Ensures reviewer evaluates only what's relevant, not entire conversation history.
  - Trade-offs: Larger prompts vs. clean context boundaries

- **Decision 4**: Only block on Critical/High issues (not Medium/Low)
  - Rationale: Critical/high issues need fixing before user sees plan. Medium/low issues can be mentioned but shouldn't block. Mirrors implementation's severity-based blocking.
  - Trade-offs: May miss some improvement opportunities vs. faster iteration

- **Decision 5**: Place review loop BEFORE user feedback in Phase 7
  - Rationale: Self-review first catches obvious issues, saving user time. User then sees higher-quality plan.
  - Trade-offs: Extra planner time vs. better user experience

- **Decision 6**: Populate plan-template.md instead of keeping it empty
  - Rationale: Provides a canonical reference for plan structure. Currently planner.md has the template embedded, but having it in reference/ is more discoverable.
  - Trade-offs: Potential sync issues (template lives in two places) vs. better documentation organization
  - Mitigation: Add comment in planner.md pointing to plan-template.md as source of truth

## Integration Points

**New Agent:**
- `.opencode/agent/pragmatic-plan-reviewer.md` - New specialized reviewer

**Modified Agent:**
- `.opencode/agent/pragmatic-planner.md` - Add review loop in Phase 7, update permissions

**Modified Documentation:**
- `.opencode/reference/planning-guide.md` - Add review loop section to workflow
- `.opencode/reference/plan-template.md` - Populate with complete template
- `.opencode/plans/README.md` - Document review loop in user-facing workflow

**Interaction Flow:**
```
pragmatic-planner (during Phase 7)
  ↓
task(agent: "pragmatic-plan-reviewer", prompt: "[plan content]")
  ↓
pragmatic-plan-reviewer returns structured feedback
  ↓
pragmatic-planner parses severity, revises plan if needed, loops back
  ↓
After max retries or no critical/high → present to user
```

**No External Dependencies:**
- No new tools required
- No code changes outside agent definitions and documentation

## Security Considerations

- **Plan Reviewer Permissions**: Read-only agent (no write/bash/task). Advisory only, cannot modify files or spawn other agents directly.
- **User Always in Control**: Review loop is advisory; user ultimately approves plan regardless of review outcome.
- **Context Isolation**: Reviewer sees only plan content, not sensitive system details or previous context.
- **No Code Execution**: Review loop involves text analysis only, no code execution or git operations.
- **Documentation Accuracy**: Ensure documentation correctly describes the review loop to avoid confusion about security boundaries.

## Testing Strategy

- **Unit Tests**: Not applicable (agent behavior)
- **Integration Tests**: Manual testing of planner with various plan qualities:
  - High-quality plan → Should pass review quickly
  - Overengineered plan → Should catch and suggest simplifications
  - Poorly granulated plan → Should catch and suggest task splitting/merging
  - Incomplete plan → Should catch missing sections (testing, security, risks)
  - Max retries scenario → Verify warning and continuation to user
- **Documentation Validation**: Verify all three documentation files accurately describe the workflow
- **Edge Cases**: Max retries reached, empty review output, reviewer agent unavailable

## Risk Points

- **Review Loop Inefficiency**: If reviewer catches many issues, loop could run 3 iterations each time
  - Mitigation: Planner should learn from common issues over time; initial iterations may be slower
  - Fallback: User can intervene and approve plan manually if loop is taking too long

- **Reviewer Agent Quality**: If plan-reviewer is poorly configured, it may miss issues or produce false positives
  - Mitigation: Carefully define review criteria based on planning best practices; iterate on reviewer configuration
  - Fallback: Manual review remains available as final check

- **Context Window Pressure**: Reviewer receives full plan content, which could be large for complex plans
  - Mitigation: Plan files are text-based and typically under 500 lines; well within context limits
  - Fallback: If context issues arise, could truncate less-critical sections

- **Permission Issues**: Planner may not have permission to spawn plan-reviewer
  - Mitigation: Explicitly add permission in YAML header during implementation
  - Fallback: Graceful fallback if agent unavailable; warn user and continue

- **Documentation Sync Issues**: Plan template exists in both planner.md and plan-template.md
  - Mitigation: Add comments in both files indicating which is source of truth
  - Fallback: Manual review during planning to catch discrepancies

## Dependencies

- Task 1 (Create plan-reviewer agent) must complete before:
  - Task 2 (Add review loop) - needs agent to exist
  - Task 4 (Update permissions) - needs agent name

- Task 2 (Add review loop) must complete before:
  - Task 3 (Add revision logic) - builds on review loop structure

- Task 4 (Update permissions) can run in parallel with Task 2 & 3

- Tasks 5, 6, 7 (Documentation updates) can run in parallel with each other and with code implementation tasks

- Task 8 (Test) must run last - validates entire implementation and documentation accuracy

## Implementation Notes

**Review Criteria (to be implemented in plan-reviewer):**

1. **Logic & Coherence**
   - Are task dependencies logical and correct?
   - Is the task sequencing appropriate?
   - Are there circular dependencies?
   - Do tasks build on each other effectively?

2. **Simplicity vs Overengineering**
   - Are tasks appropriately scoped (not too broad, not too granular)?
   - Is the solution unnecessarily complex for the problem?
   - Are there redundant or duplicative tasks?
   - Could simpler approaches achieve the same goals?

3. **Task Granularity**
   - Are 80%+ of tasks Small/Medium size?
   - Do tasks have clear boundaries and deliverables?
   - Are any tasks too large and need splitting?
   - Are any tasks too granular (micromanagement)?

4. **Completeness**
   - Are all necessary tasks included?
   - Are integration points covered?
   - Is testing strategy comprehensive?
   - Are security considerations addressed?

5. **Alignment with Planning Best Practices**
   - Does the plan follow the planning guide guidelines?
   - Are purposes clearly stated at both plan and task levels?
   - Are technical decisions well-justified?
   - Are risks properly identified with mitigations?

6. **Phase Decisions Quality**
   - Are all phase decisions documented with clear rationale?
   - Are optional phases properly justified (RUN/SKIP)?
   - Is the reasoning for each phase decision sound?

**Review Output Format (mirrors code-reviewer):**
```markdown
### Critical Issues
- [Issue 1]: Description + recommended fix
- [Issue 2]: Description + recommended fix

### High Issues
- [Issue 1]: Description + recommended fix
- [Issue 2]: Description + recommended fix

### Medium Issues
- [Issue 1]: Description + recommended fix
- [Issue 2]: Description + recommended fix

### Low Issues
- [Issue 1]: Description + recommended fix
- [Issue 2]: Description + recommended fix

### Positive Observations
- [Observation 1]
- [Observation 2]
```

**Pattern Reference:**
See `.opencode/commands/pragmatic-implementation.md` lines 71-169 for the code review loop pattern that this mirrors.

**Documentation Sync Strategy:**
- Add comment in plan-template.md: "Source of truth for plan structure. Mirrored in pragmatic-planner.md for convenience."
- Add comment in pragmatic-planner.md: "Plan template below mirrors plan-template.md - update both together."
- Regular review: During Task 8 testing, verify both templates match and documentation aligns.
