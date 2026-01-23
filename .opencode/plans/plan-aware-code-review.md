# Plan-Aware Code Review Implementation Plan

## Purpose

Add full plan context to code review process so pragmatic-code-reviewer can make intelligent, plan-aligned recommendations instead of operating in isolation. This reduces scope creep by preventing the reviewer from suggesting things that conflict with, duplicate, or precede planned future work.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** Agent interactions and context passing patterns were already analyzed; we have sufficient understanding of the current implementation.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear from user input:
1. Pass full plan context to reviewer (not just task name/purpose)
2. Plan deviation flagged as MEDIUM priority (not HIGH)
3. Developer can refactor for maintainability but not add new features
4. Holistic review loop should use plan awareness

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Medium (changes to 3 agent configs, careful integration needed)

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Code structure and context passing patterns are well-understood from exploration analysis.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research phase to synthesize from.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 4
**Task size distribution:** Small: 2, Medium: 2

### Phase 7: Create Plan File
**Status:** Complete

## Tasks

- [ ] **Update pragmatic-implementation.md code review prompts** (Medium)
  - Purpose: Pass full plan context to code-reviewer agent so it can make plan-aligned recommendations
  - Steps:
    1. Update individual task code review prompt (line 83) to include architecture, decisions, security, steps, files
    2. Add upcoming tasks and dependencies to prompt
    3. Update code review retry prompt (line 92) to preserve full plan context
    4. Update holistic review prompt (line 143) to include architecture decisions
    5. Update holistic retry prompt (line 207) to maintain context continuity
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: None

- [ ] **Add Plan Awareness guidelines to pragmatic-code-reviewer.md** (Medium)
  - Purpose: Teach code reviewer how to use full plan context for intelligent, plan-aligned feedback
  - Steps:
    1. Add "Plan Awareness" section with examples of using plan context
    2. Add decision framework for handling plan-aligned vs conflicting changes
    3. Update "What to Skip/Ignore" to avoid suggesting features from future tasks
    4. Update issue classification: plan deviation = MEDIUM (not HIGH)
    5. Add plan-aware review examples (5 scenarios with right/wrong approaches)
  - Files: `.opencode/agent/pragmatic-code-reviewer.md`
  - Dependencies: None

- [ ] **Update pragmatic-developer.md scope validation** (Small)
  - Purpose: Allow developer to refactor for maintainability while blocking new feature creep
  - Steps:
    1. Rename Phase 4 from "Scope Validation" to "Scope Verification (Advisory)"
    2. Soften scope checks from blocking to advisory
    3. Add scope creep threshold: refactoring ok, new features blocked
    4. Update completion format to include "Additional out-of-scope changes" field with justification
  - Files: `.opencode/agent/pragmatic-developer.md`
  - Dependencies: None

- [ ] **Enhance task dependencies in pragmatic-planner.md** (Small)
  - Purpose: Improve task dependency tracking so reviewer can better assess cross-task integration
  - Steps:
    1. Add "Provides for Future Tasks" field to task format
    2. Add "Needs from Previous Tasks" field to task format
    3. Add dependency management best practices section with example
  - Files: `.opencode/agent/pragmatic-planner.md`
  - Dependencies: None

## Architecture Overview

The plan-aware code review approach adds a feedback loop between the plan and the code review process. Previously, the code reviewer operated in isolation with minimal context. Now, it receives full plan context (architecture, decisions, security, all tasks) enabling intelligent, plan-aligned recommendations.

**Key changes:**
1. **Implementation Command**: Becomes plan context gateway - passes full plan to both developer and reviewer
2. **Code Reviewer**: Transforms from isolated reviewer to plan-aware quality gatekeeper
3. **Developer**: Shifts from strict scope enforcement to practical scope advisory
4. **Planner**: Enhanced task format with explicit dependency tracking

## Technical Decisions

- **Decision 1**: Pass full plan context to code reviewer
  - Rationale: Reviewer needs complete picture to make plan-aligned decisions
  - Trade-offs: Increases prompt size slightly, but provides significant value in preventing false positives and scope creep

- **Decision 2**: Plan deviation = MEDIUM priority (not HIGH)
  - Rationale: Plan serves as guide, not rigid specification. Flexibility needed for practical development.
  - Trade-offs: Some plan deviations may slip through, but developers can make helpful refactoring decisions

- **Decision 3**: Developer scope validation = advisory (not blocking)
  - Rationale: Developer should be able to refactor for maintainability without constant blocking
  - Trade-offs: Minor scope creep possible, but reviewer with full plan context will catch problematic additions

- **Decision 4**: Keep holistic review loop with plan awareness
  - Rationale: Holistic issues (cross-task integration, architecture coherence) are valuable to fix
  - Trade-offs: Adds complexity to workflow, but addresses issues that per-task review can't catch

## Integration Points

**Files to modify:**
- `.opencode/commands/pragmatic-implementation.md` (lines 83, 92, 143, 207)
- `.opencode/agent/pragmatic-code-reviewer.md` (new sections, updated existing sections)
- `.opencode/agent/pragmatic-developer.md` (Phase 4 section)
- `.opencode/agent/pragmatic-planner.md` (task format section)

**API contracts or interfaces:**
- No new tools or APIs required
- Uses existing `task()` tool with enhanced prompt structure
- Follows existing `[SUBAGENT]` pattern for agent communication

## Security Considerations

- **Context size management**: Full plan context could approach token limits for large plans
  - Risk: Prompts truncated, reviewer loses context
  - Mitigation: Monitor typical plan sizes; if >15 tasks, add context truncation strategy
- **Context pollution**: Sensitive information in plan (secrets, private keys) could leak to reviewer
  - Risk: Security reviewer may flag as issue but info exposed
  - Mitigation: Document that plan should NOT contain secrets; sensitive info belongs in separate security context

## Testing Strategy

- **Unit Tests**: Not applicable (agent configuration changes)
- **Integration Tests**: Test the workflow with a real plan containing 3-5 tasks
  - Create a sample plan with dependencies and architecture decisions
  - Run implementation command through one complete task
  - Verify reviewer receives full plan context
  - Check reviewer output includes plan-aware feedback
- **Edge Cases**:
  - Plan with 1 task (no upcoming tasks context)
  - Plan with 10+ tasks (large context)
  - Task with no dependencies
  - Task that conflicts with plan decision

## Risk Points

- **Prompt size explosion**: Large plans could exceed context window
  - Mitigation: Implement context truncation strategy if >15 tasks or >2000 lines
  - Fallback: Pass only relevant sections (current task + upcoming + architecture)

- **Reviewer complexity**: Plan-aware decision making more complex for reviewer
  - Mitigation: Clear guidelines with examples; start with 5 scenarios
  - Fallback: If reviewer still makes out-of-scope suggestions, tighten guidelines

- **Developer ambiguity**: "Refactoring ok, new features blocked" is subjective
  - Mitigation: Clear examples in developer.md; reviewer will catch additions
  - Fallback: If issues persist, tighten scope validation rules

- **Planner compatibility**: New dependency fields not used in existing plans
  - Mitigation: Fields are optional; existing plans continue to work
  - Fallback: Document migration guide if needed

## Dependencies

- All tasks are independent and can be completed in any order
- No task depends on another completing first
- Recommend completing tasks 1-2 together (implementation + reviewer) for immediate testing

## Implementation Notes

**Context passing structure - Individual task review:**

```markdown
# Code Review Request

## Current Task
**Task Name:** [Task Name]
**Purpose:** [from plan]
**Steps:** [from plan as numbered list]
**Files Modified:** [staged files list]

## Task Context
### Architecture
[relevant parts from plan]

### Decisions
[relevant parts from plan]

### Security Considerations
[if applicable]

## Full Plan Context
**Total Tasks:** [number]
**Completed Tasks:** [number]
**Current Task:** [task name]

### Upcoming Tasks
- **Task 2:** [Name] - [Purpose]
- **Task 3:** [Name] - [Purpose]
- **Task 4:** [Name] - [Purpose]
- ...

### Task Dependencies
- This task depends on: [list]
- Tasks that depend on this: [list]

### Overall Architecture
[Architecture Overview section from plan]

### Technical Decisions
[Technical Decisions section from plan]

## Review Instructions
Review the current task implementation with full plan context. Consider:
- Does this task align with planned architecture?
- Will this implementation support upcoming tasks?
- Are there any conflicts with future work?
- Should this task include more/less to prepare for future tasks?

Do NOT suggest features/improvements that are planned for upcoming tasks.
```

**Task format enhancements in pragmatic-planner.md:**

```markdown
**Task format in plan:**
- [ ] **[Task Name]** (SIZE)
  - Purpose: [What this task achieves and its role in the larger plan]
  - Steps: [3-6 high-level implementation steps]
  - Files: [Primary files to modify]
  - Dependencies: [What must be done first]
  - **Provides for Future Tasks:** [What this task exposes/creates that future tasks will use]
  - **Needs from Previous Tasks:** [What this task expects previous tasks to have provided]
```

**Developer scope creep thresholds:**

✅ **Allowed (Minor scope creep):**
- Adding config file required by feature
- Refactoring related code for maintainability
- Adding utility function used by implementation
- Fixing obvious bugs in touched code

❌ **Blocked (Major scope creep):**
- Adding new functionality not in task steps
- Implementing features from future tasks
- Changing architecture without justification
- Adding defensive patterns beyond security spec
