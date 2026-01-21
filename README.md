# PrAIgmatic Agents for OpenCode

## Quick Start

### Agents

1. `@pragmatic-explorer` - Fast codebase analysis and pattern discovery
2. `@pragmatic-brainstormer` - Interactive requirements clarification
3. `@pragmatic-planner` - Creates detailed implementation plans
4. `@pragmatic-researcher` - Multi-source technical research
5. `@pragmatic-developer` - Clean code with automatic review
6. `@pragmatic-code-reviewer` - Quality, security, performance checks

### Commands

- `/pragmatic-implementation` - Load plan file, create todos, start implementation (agent-agnostic)
  - Auto-detects most recent plan or use: `/pragmatic-implementation plan-file.md`
  - Creates todos from plan task checklist
  - Works in any agent context
  - Updates plan checkboxes as tasks complete

## File Structure

```
.opencode/
├── opencode.json          # Plugins: DCP + opencode-skillful
├── dcp.jsonc              # Dynamic context pruning config
├── agent/
│   ├── pragmatic-explorer.md
│   ├── pragmatic-brainstormer.md
│   ├── pragmatic-planner.md
│   ├── pragmatic-researcher.md
│   ├── pragmatic-developer.md
│   └── pragmatic-code-reviewer.md
├── reference/             # Shared standards (referenced by agents)
│   ├── ttd-criteria.md    # TTD decision framework
│   ├── security-checklist.md
│   ├── code-quality.md
│   └── tool-patterns.md   # MCP tool syntax
├── plans/                 # Implementation plans
│   ├── README.md          # Plan lifecycle documentation
│   └── archive/           # Completed plans
├── skills/                # Skill definitions
    ├── SKILL-TEMPLATE.md  # Template for new skills
    └── go-backend-developer/
        └── SKILL.md
```

## Plugins

- **@tarquinen/opencode-dcp** - Token optimization via context pruning

## Agents

| Agent | Mode | Purpose |
|-------|------|---------|
| Explorer | agent/subagent | Fast codebase analysis, pattern discovery |
| Brainstormer | agent/subagent | Interactive Q&A for requirements clarification |
| Planner | agent/subagent | TTD plans, spawns explorer + brainstormer + researchers |
| Researcher | agent/subagent | Context7, Grep.app, WebSearch |
| Developer | agent/subagent | Pure implementation with structured prompts, plan-agnostic |
| Committer | agent/subagent | Git commit analysis and conventional commits |
| Reviewer | agent/subagent | Security, quality, fixes |

## Agent Workflow

```
User request
  ↓
Planner (agent-agnostic)
  ↓
Phase 1: Explorer (understand existing system)
  ↓
Phase 2: Brainstormer (clarify requirements)
  ↓
Phase 3: Researcher (parallel research tasks)
  ↓
Phase 4: Synthesis (aggregate findings)
  ↓
Phase 5: Task breakdown (create implementation tasks)
  ↓
Phase 6: Create plan file ONLY
  │  ├─ Write plan file (.opencode/plans/[task-name].md)
  │  │  ├─ Tasks section with markdown checkboxes
  │  │  ├─ Architecture overview
  │  │  ├─ Technical decisions
  │  │  └─ Security, testing, risks
  │  └─ Return control to user (no agent reference)
  ↓
👤 USER TYPES: /pragmatic-implementation
  ↓
/pragmatic-implementation command (orchestrator)
  │  ├─ Find and read plan file
  │  ├─ Parse task checklist
  │  └─ Show acknowledgment with plan tasks
  ↓
For EACH task (loop):
  ├─ Mark task as in-progress (edit plan: [ ] → [~])
  ├─ Construct structured prompt for developer
  │  ├─ Task name, purpose, context
  │  ├─ Architecture, decisions, security
  │  └─ Task steps, files to modify
  ├─ Invoke developer agent
  │  └─ Developer implements task (Phases 1-3)
  │     ├─ Phase 1: Analysis (Security, Skills, TTD)
  │     ├─ Phase 2: Implementation
  │     └─ Phase 3: Code review (stages changes for review)
  ├─ Handle developer response:
  │  ├─ ✅ Success: Stage changes, update plan ([~] → [x]), commit
  │  ├─ ❌ Failure: Document error, stop loop
  │  └─ ⚠️ Blocked: Document blocker, stop loop
  └─ Continue to next task
  ↓
All tasks completed:
  ├─ Holistic code review (Reviewer)
  ├─ Archive plan file
  └─ Commit archive move
```

## Plan File Workflow

### Overview

The `/pragmatic-implementation` command is an **orchestrator** that manages plan-driven implementation. It:

1. **Reads the plan file** to understand tasks and their order
2. **Manages workflow state** (checkboxes, loops, commits, archives)
3. **Invokes developer agent** for each task with structured context
4. **Handles task outcomes** (success, failure, blocked)
5. **Performs post-completion** (holistic review, archive, final commit)

### Key Architecture Changes

**Before refactoring:**
- Developer agent owned workflow logic (checkboxes, loops, commits)
- Tight coupling: Developer knew about plan file format
- Difficult to use developer for ad-hoc tasks

**After refactoring:**
- Clear separation: Command orchestrates, Developer implements
- Developer is plan-agnostic (receives structured prompts)
- Reusable: Developer works with or without plans
- Clean interface: Structured prompt → Status response

### Implementation Loop

For **each task** in the plan (prioritizing in-progress tasks `- [~]`):

#### 1. Mark Task In-Progress

Edit plan file: `- [ ]` → `- [~]`

#### 2. Construct Developer Prompt

Build structured prompt with:
- Task Name & Purpose
- Context (Architecture, Decisions, Security)
- Task Steps (numbered list)
- Files to Modify (with descriptions)

See `.opencode/design/new-command-developer-interface.md` for full prompt template.

#### 3. Invoke Developer Agent

```bash
task(agent: "pragmatic-developer", prompt: "[structured prompt]")
```

Developer executes Phases 1-3:
- Phase 1: Analysis (Security, Skills, TTD decision)
- Phase 2: Implementation (write code, tests, docs)
- Phase 3: Code Review (stage changes, invoke reviewer, fix issues)

#### 4. Handle Response

**✅ Success:**
- Collect modified files from response
- Stage changes: `git add [files]`
- Update plan: `- [~]` → `- [x]`
- Commit: `task(agent: "pragmatic-committer")`
- Continue to next task

**❌ Failure:**
- Document error in plan file as sub-item
- Stop loop (require user intervention)
- Do not commit

**⚠️ Blocked:**
- Document blocker in plan file as sub-item
- Stop loop (require user to resolve blocker)
- Do not commit

#### 5. Continue or Finish

If more tasks: Repeat from step 1

If all tasks complete: Proceed to post-completion steps

### Post-Completion

After all tasks have `[x]` checkbox:

#### Holistic Code Review

1. Identify commits: `git log --oneline [filter]`
2. Invoke reviewer:
   ```
   task(agent: "pragmatic-code-reviewer", prompt: "Holistic review...

   Context:
   - Plan: [Name]
   - Purpose: [Overall purpose]
   - Tasks: [List]
   - Commits: [git log results]")
   ```

#### Archive Plan

```bash
TIMESTAMP=$(date +%Y-%m-%d)
PLAN_NAME=$(basename "$PLAN_FILE" .md)
mv "$PLAN_FILE" ".opencode/plans/archive/${PLAN_NAME}-${TIMESTAMP}.md"
```

Stage and commit archive move:
```bash
git add [plan files]
task(agent: "pragmatic-committer", prompt: "[SUBAGENT] Plan '${PLAN_NAME}' completed and archived")
```

### Developer Agent

The `pragmatic-developer` agent is now **plan-agnostic** and can be used standalone or via orchestration commands.

**Input:** Structured prompt with task context
**Output:** Success/Failure/Blocked status with file list and summary

See `.opencode/agent/pragmatic-developer.md` for the developer workflow.

### Committer Agent

The `pragmatic-committer` agent analyzes staged changes and creates conventional commits.

**Input:** Context about what was done
**Output:** Commit hash or error

See `.opencode/agent/pragmatic-committer.md` for details.

### Error Handling

**Blocked Tasks:**
- Documented in plan file
- Loop stops
- User must resolve blocker

**Failed Tasks:**
- Documented in plan file
- Loop stops
- User must fix error

**Resume Capability:**
- Tasks marked `[~]` are executed first
- Allows resuming interrupted work
- No need to re-complete tasks

**Returns control to user (agent-agnostic):**

```
✅ Planning complete!

Created implementation plan: .opencode/plans/add-oauth-authentication.md

Plan includes:
- 5 implementation tasks with TTD guidance
- Architecture overview
- Technical decisions and rationale
- Security considerations
- Testing strategy

---

To implement this plan:
→ Type: /pragmatic-implementation
```

### User Invokes Command

User types the command:
```
/pragmatic-implementation
```

Or with specific plan file:
```
/pragmatic-implementation add-oauth-authentication.md
```

### Command Executes

**1. Find and read plan file:**
- Auto-detect most recent or use argument
- Read plan content

**2. Parse task checklist:**
- Extract tasks from markdown checkboxes
- Parse metadata: TTD status, size estimate

**3. Start implementation:**
- Show acknowledgment with plan tasks
- Begin implementation in current agent context

**4. As tasks complete:**
- Edit plan: Change `- [ ]` to `- [x]`
- Verify edit succeeded
- Commit changes
- Continue with next task

**6. Archive plan when done:**
```bash
mv .opencode/plans/add-oauth-authentication.md \
   .opencode/plans/archive/add-oauth-authentication-2026-01-18.md
```

### Plan File Format

**Task format:**
```markdown
- [ ] **Task Name** (TTD) (SIZE)
  - Sub-task 1
  - Sub-task 2
```

**Status:**
- `- [ ]` = pending
- `- [x]` = completed

**Metadata:**
- TTD: `(TTD_REQUIRED)` or `(NO_TTD)`
- Size: `(Small)` | `(Medium)` | `(Large)`

### Plan File Lifecycle

```
Created by planner:
  .opencode/plans/add-oauth-authentication.md

Used by developer:
  Read for architecture, decisions, risks

Archived when complete:
  .opencode/plans/archive/add-oauth-authentication-2026-01-17.md
```

### Benefits of Clean Separation

✅ **Clean separation of concerns**:
   - Planner: Creates plans (no knowledge of implementation)
   - Developer: Writes code (no knowledge of plans)
   - Command: Bridges the two (agent-agnostic)

✅ **Agent-agnostic**:
   - `/pragmatic-implementation` works with ANY agent
   - Not tied to developer specifically
   - Reusable across workflows

✅ **No coupling**:
   - Planner doesn't reference developer
   - Developer has no plan-specific logic
   - Easy to maintain and extend

✅ **Single source of truth**:
   - Plan file contains all information and state
   - Plan checkboxes show execution history
   - Git commits provide audit trail

✅ **Pragmatic**:
   - Zero overhead when not using plans
   - Explicit user control via command
   - Works with or without planner

### When to Use What

**Use planner + /pragmatic-implementation when:**
- Complex feature requiring planning
- Multiple approaches need evaluation
- Team collaboration on architecture
- Want documented decision trail

**Use developer directly when:**
- Simple bug fix
- Straightforward feature
- Quick iteration
- No planning needed

The command-based approach gives you control: plan when beneficial, skip when not.

## Shared References

Agents reference shared standards in `reference/`:

- **planning-guide.md** - Planfile structure and task granularity guidelines (NEW)
- **ttd-criteria.md** - When to use Task-Driven Development
- **security-checklist.md** - Security review requirements
- **code-quality.md** - Code quality standards
- **tool-patterns.md** - Correct MCP tool syntax

See individual agent files for full documentation.
