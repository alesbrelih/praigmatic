# Architecture Quick Reference

## Date
2025-01-21

## Refactored Agent Architecture

### Overview

The agent system has been refactored to separate concerns clearly:

- **Commands**: Orchestrate workflows (e.g., `/pragmatic-implementation`)
- **Agents**: Perform specific tasks (Developer, Committer, Reviewer, etc.)
- **Interface**: Structured prompts with explicit contracts

### Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| Developer | Owned workflow (checkboxes, loops, commits) | Pure implementation only |
| Command | Simple "follow workflow" instruction | Full orchestration with state management |
| Coupling | Developer knew about plan files | Plan-agnostic, reusable |
| Interface | Implicit (no clear contract) | Explicit (structured prompt → status response) |

### Agent Roles

| Agent | Purpose | Mode |
|-------|---------|------|
| Explorer | Fast codebase analysis | agent/subagent |
| Brainstormer | Interactive Q&A for requirements | agent/subagent |
| Planner | TTD plans, creates plan files | agent/subagent |
| Researcher | Context7, Grep.app, WebSearch | agent/subagent |
| Developer | Pure implementation with structured prompts | agent/subagent |
| Committer | Git commit analysis and conventional commits | agent/subagent |
| Reviewer | Security, quality, fixes | agent/subagent |

### Workflow: Plan-Driven Execution

```
User: /pragmatic-implementation
  ↓
Command: Read plan, parse tasks
  ↓
Loop for each task:
  ├─ Mark task in-progress: [ ] → [~]
  ├─ Build structured prompt
  ├─ Invoke developer
  │  └─ Developer: Phases 1-3 (Analysis, Implementation, Review)
  ├─ Handle response:
  │  ├─ ✅ Success: Stage, update plan [~] → [x], commit
  │  ├─ ❌ Failure: Document, stop loop
  │  └─ ⚠️ Blocked: Document, stop loop
  └─ Continue to next task
  ↓
All tasks complete:
  ├─ Holistic review
  ├─ Archive plan
  └─ Commit archive
```

### Developer Agent Contract

**Input Format:**

```markdown
# Task Execution Request

## Task Information
**Task Name:** [string]
**Purpose:** [string]

## Context
### Architecture
[Optional patterns/structures]
### Decisions
[Optional constraints]
### Security Considerations
[Optional security requirements]

## Task Steps
1. [Step 1]
2. [Step 2]

## Files to Modify
- `file1.ts` - [description]
- `file2.ts` - [description]

## Additional Context
[Optional extra info]
```

**Output Format (3 options):**

**Success:**
```markdown
✅ **Task Completed:** [Task Name]

**Files Modified:**
- file1.ts - [changes]
- file2.ts - [changes]

**Summary:** [description]
```

**Failure:**
```markdown
❌ **Task Failed:** [Task Name]

**Error:** [description]

**Attempted Changes:**
- file1.ts - [changes]

**Next Steps:** [what to do]
```

**Blocked:**
```markdown
⚠️ **Task Blocked:** [Task Name]

**Blocker:** [description]

**Attempts Made:** [what was tried]

**Required Action:** [what user needs to do]
```

### Developer Responsibilities

**MUST:**
- Execute task according to steps
- Follow all context (architecture, decisions, security)
- Provide structured output (success/failure/blocked)
- Modify only specified files
- Return explicit status

**MUST NOT:**
- Read plan files
- Manage checkboxes
- Call committer
- Make architectural decisions without context
- Orchestrate loops

### Command Responsibilities

**MUST:**
- Read and parse plan files
- Manage checkbox state ([ ], [~], [x])
- Loop through tasks
- Build structured prompts for developer
- Handle developer responses
- Call committer after successful tasks
- Perform holistic review
- Archive completed plans
- Ensure clean git state

### Key Files

| File | Purpose |
|------|---------|
| `.opencode/agent/pragmatic-developer.md` | Developer agent prompt (plan-agnostic) |
| `.opencode/agent/pragmatic-committer.md` | Committer agent prompt |
| `.opencode/agent/pragmatic-reviewer.md` | Reviewer agent prompt |
| `.opencode/commands/pragmatic-implementation.md` | Implementation orchestrator |
| `.opencode/plans/[plan-name].md` | Plan file with tasks |
| `.opencode/design/new-command-developer-interface.md` | Interface specification |

### Error Handling

**Blocked Task:**
- Documented in plan file as sub-item
- Execution loop stops
- No commit created
- User informed of blocker

**Failed Task:**
- Documented in plan file as sub-item
- Execution loop stops
- No commit created
- User informed of error and next steps

**Resume Capability:**
- Tasks marked `[~]` (in-progress) executed first
- Allows resuming interrupted work
- No need to re-complete tasks

### Quick Reference: Common Operations

**Invoke developer for ad-hoc task:**
```
task(agent: "pragmatic-developer", prompt: "[structured prompt]")
```

**Run plan:**
```
/pragmatic-implementation [plan-file.md]
```

**Stage and review changes:**
```bash
git add [files]
task(agent: "pragmatic-reviewer", prompt: "Review STAGED changes")
```

**Commit changes:**
```
task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Commit. Context: [what you did]")
```

### Design Rationale

**Why this architecture?**

1. **Separation of Concerns:**
   - Orchestration vs. implementation are separate
   - Easier to understand, test, and maintain

2. **Reusability:**
   - Developer works with or without plans
   - Same interface for planned and ad-hoc tasks

3. **Explicit Contracts:**
   - Clear input/output formats
   - No implicit expectations
   - Easier to debug

4. **Error Recovery:**
   - Explicit status enables proper handling
   - Blocked/failed tasks documented
   - Easy to resume from interruptions

5. **Clean Git State:**
   - Commit after each task
   - Clean state after plan completion
   - Easy to track progress

### Migration Guide

For users transitioning from old to new architecture:

1. **Developer usage:**
   - Old: Just "follow pragmatic-developer workflow"
   - New: Provide structured prompt with task info

2. **Plan files:**
   - Old: Developer read plan file directly
   - New: Command reads plan and builds prompts
   - Plan format unchanged (still works)

3. **Commit flow:**
   - Old: Developer committed after each task
   - New: Command commits after successful task
   - Result: Same (commits after each task)

4. **Holistic review:**
   - Old: Developer orchestrated after all tasks
   - New: Command orchestrates after all tasks
   - Result: Same (review performed)

### Questions?

See documentation:
- `.opencode/agent/pragmatic-developer.md` - Developer workflow
- `.opencode/commands/pragmatic-implementation.md` - Orchestration
- `.opencode/design/new-command-developer-interface.md` - Interface spec
- `.opencode/tests/architecture-validation-test-plan.md` - Test plan
- `README.md` - General overview
