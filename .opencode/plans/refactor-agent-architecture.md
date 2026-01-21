# Refactor Agent Architecture: Separate Orchestrator from Developer

## Purpose

Decouple pragmatic-developer from plan-driven workflow by moving orchestration logic to pragmatic-implementation command. This achieves true separation of concerns: command manages workflow state (plan + git), developer focuses purely on implementation.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** Request is purely refactoring work on known codebase. No new feature exploration or pattern discovery needed. We have complete understanding of current implementation from reading the files.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear and specific. User proposed the exact architecture: move commit/plan orchestration to command, keep developer as pure implementation worker. No ambiguity or multiple approaches to consider.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None. Current implementation is fully understood. Clear what needs to be removed from developer and added to command.
**Complexity assessment:** Medium. Involves removing/adding substantial logic but boundaries are clear.

### Phase 4: Research
**Decision:** SKIP
**Rationale:** No unknowns requiring research. We're restructuring existing code, not implementing new functionality or unfamiliar patterns. Task orchestration patterns are well-understood.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted, so no synthesis needed. The architectural changes are straightforward based on clear requirements.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 6
**Task size distribution:** Small: 2, Medium: 4

### Phase 7: Create Plan File
**Status:** In progress

## Tasks

- [x] **Analyze current dependencies and interfaces** (Small)
  - Purpose: Identify all touchpoints between developer, implementation command, and committer to ensure nothing is missed during refactoring
  - Steps:
    - Document all plan-specific logic in pragmatic-developer.md (checkbox updates, archive)
    - Document all git-related logic in pragmatic-developer.md (commits, staging)
    - Document all data flow from command → developer → committer
    - Identify interface: what parameters command passes to developer
    - Identify interface: what developer returns to command
  - Files:
    - `.opencode/agent/pragmatic-developer.md`
    - `.opencode/commands/pragmatic-implementation.md`
    - `.opencode/agent/pragmatic-committer.md`
  - Dependencies: None

- [x] **Design new command-to-developer interface** (Small)
  - Purpose: Define clear contract for command invoking developer, enabling developer to be plan-agnostic
  - Steps:
    - Define prompt template for command → developer invocation
    - Specify required fields: purpose, task name, steps, files, context
    - Define expected output from developer: completion status, blocked status, files modified
    - Document how context (architecture, decisions, security) is passed
    - Create example prompt showing complete invocation
  - Files:
    - New interface documentation in plan file
  - Dependencies: Task 1

- [x] **Simplify pragmatic-developer.md - remove plan-specific logic** (Medium)
  - Purpose: Transform developer into pure implementation agent that can work with or without plans
  - Steps:
    - Remove Phase 2 Step 1: "Mark Task as In-Progress" (checkbox updates)
    - Remove Phase 3 Step 2: "Read plan file to extract purpose context" (let command provide purpose)
    - Remove Phase 4 entirely: "Task Completion & Commit" (move to command)
    - Remove "Check for More Tasks" loop logic (move to command)
    - Remove "Holistic Code Review" (move to command)
    - Remove "Archive Plan" (move to command)
    - Update Phase 3 Code Review to accept purpose as parameter (not read from plan)
    - Add simple return statement: "Task completed" or "Task blocked with reason"
    - Update agent description to reflect plan-agnostic nature
    - Verify all plan file references removed (grep for `.opencode/plans`)
  - Files:
    - `.opencode/agent/pragmatic-developer.md`
  - Dependencies: Task 2

- [x] **Expand pragmatic-implementation.md - add orchestration logic** (Medium)
  - Purpose: Move all workflow management (plan state + git) to command where it belongs
  - Steps:
    - Replace "Step 5.1 Execute Phases 1-4" with detailed task invocation
    - Add task invocation loop with retry logic for blocked tasks
    - Implement checkbox update logic: `- [ ]` → `- [~]` (before developer) → `- [x]` (after)
    - Add commit logic: call pragmatic-committer or direct git after each task
    - Add staged changes collection for commit message context
    - Move "Holistic Code Review" from developer to command (after all tasks)
    - Move "Archive Plan" from developer to command (after all tasks complete)
    - Add error handling: if task fails or blocks, don't mark complete, add blocker note
    - Add resume capability: find `[~]` tasks first, then `[ ]` tasks
    - Update edge cases section with new behavior
  - Files:
    - `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 2

- [x] **Update README.md to reflect new architecture** (Medium)
  - Purpose: Correct documentation to match actual implementation (remove false "agent-agnostic" claims)
  - Steps:
    - Update Agent Workflow diagram to show: command reads plan → invokes developer → manages state
    - Remove "agent-agnostic" claim for `/pragmatic-implementation` command
    - Remove "Developer works directly with plan file" (now done by command)
    - Update description: "Command orchestrates workflow, developer implements tasks"
    - Update "Benefits of Clean Separation" section to reflect new boundaries
    - Update pragmatic-developer description: "Pure implementation agent, can be used standalone or via command"
    - Remove TTD metadata references from plan file format (already removed, just update docs)
  - Files:
    - `README.md`
  - Dependencies: Tasks 3, 4 (complete implementation first)

- [x] **Test new architecture end-to-end** (Medium)
  - Purpose: Verify refactoring doesn't break existing functionality and works as designed
  - Steps:
    - Create test plan file with 2-3 sample tasks (varying sizes)
    - Run `/pragmatic-implementation` with test plan
    - Verify: command finds plan, shows summary correctly
    - Verify: command invokes developer with correct parameters
    - Verify: developer completes task without touching plan file
    - Verify: command updates checkboxes in correct order
    - Verify: command commits after each task
    - Verify: command performs holistic review after all tasks
    - Verify: command archives plan when all tasks complete
    - Test resume scenario: interrupt, restart, continues from `[~]` task
    - Test blocked task: developer returns "blocked", command adds blocker note
    - Test standalone developer: invoke directly without plan, verify it works
  - Files:
    - Test plan file (`.opencode/plans/test-refactor.md`)
    - Test code changes (any simple feature)
  - Dependencies: Tasks 3, 4, 5

## Architecture Overview

### Current (Coupled) Architecture

```
/pragmatic-implementation (command)
  ↓ Finds plan, shows summary
pragmatic-developer (agent)
  ↓ Phase 1: Analysis
  ↓ Phase 2: Implementation + Mark in-progress checkbox
  ↓ Phase 3: Code Review
  ↓ Phase 4: Update complete checkbox + Call committer + Check next task + Archive
```

**Problems:**
- Developer knows about plan files (checkboxes)
- Developer owns git state (commits)
- Developer orchestrates workflow (loops, resume, archive)
- Tight coupling between command and developer

### New (Separated) Architecture

```
/pragmatic-implementation (command - orchestrator)
  ↓ For each task:
    ├─ Update: `- [ ]` → `- [~]` in plan
    ├─ Invoke: pragmatic-developer with context
    ↓
pragmatic-developer (agent - worker)
  ├─ Phase 1: Analysis (TTD, skills, security)
  ├─ Phase 2: Implementation
  ├─ Phase 3: Code Review
  └─ Return: "Task completed"
  ↓
/pragmatic-implementation (continues)
  ├─ Stage modified files
  ├─ Commit via pragmatic-committer
  ├─ Update: `- [~]` → `- [x]` in plan
  └─ Next task
  ↓
All complete:
  ├─ Holistic code review
  └─ Archive plan
```

**Benefits:**
- Clear separation: command manages state, developer implements
- Developer is standalone (can be invoked directly)
- Command owns orchestration (loop, resume, archive, commit)
- Single responsibility for each component

## Technical Decisions

- **Decision 1**: Move all plan file operations to command
  - Rationale: Command orchestrates the workflow, it should own state
  - Trade-offs: Command becomes more complex, but developer becomes simpler and reusable

- **Decision 2**: Remove developer's Phase 4 entirely
  - Rationale: Phase 4 is about workflow state management, not implementation
  - Trade-offs: Simpler developer agent, all workflow logic centralized in command

- **Decision 3**: Pass context via prompt instead of reading plan file
  - Rationale: Developer shouldn't know about plan files, command extracts and passes context
  - Trade-offs: Slightly longer prompts, but cleaner separation and reusable developer

- **Decision 4**: Keep code review in developer
  - Rationale: Code review is part of implementation workflow, not orchestration
  - Trade-offs: Developer still needs to stage changes (git add) before review, which is git state but for review purpose only

- **Decision 5**: Use pragmatic-committer from command, not developer
  - Rationale: Committing is part of workflow orchestration (manage git state)
  - Trade-offs: Command needs to call committer agent, but keeps workflow cohesive

## Integration Points

### Files Modified

**`.opencode/agent/pragmatic-developer.md`:**
- Remove: Phase 2 Step 1 (mark in-progress)
- Remove: Phase 3 Step 2 (read plan for context)
- Remove: Phase 4 entirely
- Update: Code review to accept purpose as parameter
- Update: Agent description (plan-agnostic)

**`.opencode/commands/pragmatic-implementation.md`:**
- Add: Task invocation loop with proper prompt
- Add: Checkbox update logic (in-progress, complete)
- Add: Commit logic via pragmatic-committer
- Add: Holistic review after all tasks
- Add: Archive plan logic
- Update: Task selection priority (in-progress → pending)

**`README.md`:**
- Update: Agent workflow diagram
- Update: Architecture descriptions
- Remove: False claims about "agent-agnostic" command

### Agent Interface

**Command → Developer (task invocation):**
```
task(agent: "pragmatic-developer",
     prompt: "[TASK] Implement this feature:

     **Purpose:** [from plan]
     **Task:** [task name]
     **Steps:** [implementation steps]
     **Files:** [primary files]
     **Context:**
       - Architecture: [architecture overview]
       - Security: [security considerations]
       - Decisions: [technical decisions]")
```

**Developer → Command (return value):**
```
✅ Task completed
or
⚠️ Task blocked: [reason]
```

## Security Considerations

- **No security changes**: This refactoring is purely structural, no new functionality
- **Safety checks remain**: pragmatic-committer still validates changes before committing
- **Review process preserved**: Code review still happens in Phase 3
- **Git safety**: Pre-flight validation still checks for uncommitted changes

## Testing Strategy

- **Unit Testing**: Not applicable (architectural refactoring)
- **Integration Testing**: Full end-to-end test with test plan
  - Verify command → developer → committer flow
  - Verify plan state updates (checkboxes)
  - Verify git commits after each task
  - Verify archive when complete
- **Edge Cases**:
  - Resume after interruption
  - Blocked tasks
  - Parallel tasks (user chooses order)
  - Failed tasks (don't mark complete)

## Risk Points

- **Risk 1**: Breaking existing plan-driven workflows
  - Mitigation: Comprehensive testing with realistic test plan
  - Fallback: Keep old implementation temporarily or have rollback plan

- **Risk 2**: Missing plan context when invoking developer
  - Mitigation: Carefully design prompt template to pass all necessary context (purpose, architecture, decisions, security)
  - Fallback: Developer can still call explorer if it needs more context

- **Risk 3**: Developer no longer stages files for review
  - Mitigation: Keep staging in developer (git add) - it's part of review process, not workflow
  - Fallback: Command can stage files after developer returns

- **Risk 4**: Complex command orchestration logic
  - Mitigation: Keep logic well-documented and simple; use clear error handling
  - Fallback: Test extensively with various scenarios (success, blocked, resume)

## Dependencies

- Task 2 depends on Task 1 (interface design based on analysis)
- Task 3 depends on Task 2 (simplify based on interface)
- Task 4 depends on Task 2 (expand based on interface)
- Task 5 depends on Tasks 3 & 4 (document after implementation)
- Task 6 depends on Tasks 3, 4, 5 (test after all changes complete)

## Implementation Notes

### Current State Analysis

**pragmatic-developer.md plan-specific logic:**
- Line 153-165: Mark task in-progress by editing plan file
- Line 216-221: Read plan file for purpose context
- Line 236-304: Phase 4 (Task Completion & Commit) - all workflow logic
- Line 240-252: Update plan checkbox to complete
- Line 254-260: Call pragmatic-committer
- Line 262-276: Check for more tasks / loop logic
- Line 278-295: Holistic code review
- Line 297-304: Archive plan

**pragmatic-implementation.md orchestration gaps:**
- Line 63-68: Step 5.1 just says "Follow pragmatic-developer agent workflow" - needs actual implementation
- Line 70-74: Step 5.2 has basic checkbox and commit, but needs expansion for full workflow

### New Prompt Template

**Command invokes developer with:**
```markdown
[TASK] Implement this feature:

**Purpose:** [Extract from plan's Purpose section]
**Task:** [Task name from plan]
**Steps:**
[Implementation steps from task]

**Files:**
[Primary files to modify from task]

**Context:**
- Architecture: [From plan's Architecture Overview]
- Technical Decisions: [From plan's Technical Decisions]
- Security Considerations: [From plan's Security Considerations]
- Integration Points: [From plan's Integration Points]

**Dependencies:**
[Any task dependencies from plan]
```

### Checkbox Update Logic

**Command manages three checkbox states:**
```
- [ ]  ← pending (found by command)
- [~]  ← in-progress (command sets before invoking developer)
- [x]  ← completed (command sets after developer returns)
```

**Command flow for each task:**
1. Find unchecked task (`- [ ]`)
2. Edit to `- [~]`
3. Invoke developer
4. Developer returns: success or blocked
5. If success: Edit to `- [x]`, commit, next task
6. If blocked: Keep as `- [ ]`, add blocker note, ask user

### Commit Flow

**After developer completes task:**
1. Command stages files: `git add [files_modified]`
2. Command invokes pragmatic-committer with context
3. Committer analyzes and commits
4. Command updates checkbox to `- [x]`
5. Command proceeds to next task

### Resume Capability

**Command task selection priority:**
1. First task with `- [~]` (in-progress, resume)
2. If none, first task with `- [ ]` (pending, start)

This enables interruption and resumption:
- User stops during task 2 → task 2 is `- [~]`
- User runs command again → finds task 2 as `- [~]`
- Command continues task 2 from where it left off

### Standalone Developer

**After refactoring, developer can be invoked directly:**
```
@pragmatic-developer Implement feature X:
- Purpose: [user provides]
- Task: [user provides]
- Steps: [user provides]
```

Developer works without plans:
- No plan file references
- No checkbox updates
- No commit logic
- Just: analyze → implement → review → return

### Verification Checklist

**After each task completion:**
- [ ] Developer did NOT touch plan file
- [ ] Developer did NOT call committer
- [ ] Developer returned "Task completed"
- [ ] Command updated checkbox from `- [~]` to `- [x]`
- [ ] Command staged correct files
- [ ] Command called committer successfully
- [ ] Git commit created with appropriate message
- [ ] Plan file shows correct state

**After all tasks complete:**
- [ ] All checkboxes are `- [x]`
- [ ] All tasks committed
- [ ] Holistic review performed
- [ ] Plan archived to `.opencode/plans/archive/`
- [ ] Git history shows clean commit sequence

### Rollback Plan

If testing reveals issues:
1. Restore original files from git
2. Revert README changes
3. Document what failed and why
4. Consider incremental approach (split refactoring into smaller steps)

### Success Criteria

**Architecture:**
- [ ] Developer has no plan file references (grep finds 0 matches for `.opencode/plans`)
- [ ] Developer doesn't call pragmatic-committer
- [ ] Developer has simple return statement (no complex workflow)
- [ ] Command owns all plan state management
- [ ] Command owns all git state management
- [ ] Developer can be invoked standalone (test passes)

**Functionality:**
- [ ] Existing plan-driven workflow still works
- [ ] Resume after interruption works
- [ ] Blocked tasks handled correctly
- [ ] All tasks committed individually
- [ ] Holistic review performed after all tasks
- [ ] Plan archived when complete

**Documentation:**
- [ ] README reflects actual architecture
- [ ] No false claims about "agent-agnostic" command
- [ ] Clear interface between command and developer
- [ ] Benefits of separation accurately described
