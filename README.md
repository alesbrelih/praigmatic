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
| Developer | agent/subagent | Implementation + skill loading |
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
/pragmatic-implementation command (agent-agnostic bridge)
  │  ├─ Find and read plan file
  │  ├─ Parse task checklist
  │  ├─ Create todos via TodoWrite
  │  └─ Start implementation in current agent
  ↓
Developer (or any other agent)
  ↓
Phase 0: Todo acknowledgment (if todos exist)
  │  ├─ Review todos
  │  └─ Mark first task as "in_progress"
  ↓
Phase 1-3: Implement task-by-task
  │  ├─ Implement current task
  │  ├─ Mark task as "completed"
  │  └─ Loop for next task
  ↓
Phase 4: Code review + commit
  │  ├─ Code review
  │  └─ Commit
  ↓
Reviewer (quality, security, performance checks)
```

## Todo Workflow & Plan Files

### Overview

Clean separation architecture:
- **Planner**: Creates plan file with task checklist (agent-agnostic)
- **/pragmatic-implementation command**: Bridge that creates todos from plan (agent-agnostic)
- **Developer**: Works with todos (plan-agnostic)

This provides:
- **Single source of truth**: Plan file contains all information
- **Structured execution**: Todos track runtime progress
- **Rich context**: Plan documents architecture, decisions, risks
- **Progress visibility**: Both todos (live) and plan checkboxes (permanent)
- **Clean separation**: No coupling between planner and implementation
- **Audit trail**: Archived plans show execution history

### Planner Creates Plan File Only

**Plan file with task checklist:**

```markdown
# OAuth2 Authentication Implementation Plan

## Tasks

- [ ] **Install Auth0 SDK** (NO_TTD) (Small)
  - Add Auth0 SDK to package.json
  - Configure credentials

- [ ] **Update database schema** (TTD_REQUIRED) (Medium)
  - Add OAuth fields to user table
  - Create migration script

- [ ] **Implement callback handler** (TTD_REQUIRED) (Large)
  - Create /auth/callback endpoint
  - Handle token exchange

## Architecture Overview
[How feature fits into system]

## Technical Decisions
- Decision 1: Choice (Rationale)

## Security Considerations
- Risk 1: Description → Mitigation

## Testing Strategy
- Unit tests: approach
- Integration tests: approach
```

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

**3. Create todos via TodoWrite:**
```
TodoWrite({
  todos: [
    {
      content: "Install Auth0 SDK (NO_TTD) (Small)",
      status: "pending",
      activeForm: "Installing Auth0 SDK"
    },
    {
      content: "Update database schema (TTD_REQUIRED) (Medium)",
      status: "pending",
      activeForm: "Updating database schema"
    }
  ]
})
```

**4. Start implementation:**
- Show acknowledgment
- Mark first task as "in_progress"
- Begin implementation in current agent context

**5. As tasks complete:**
- TodoWrite: Mark todo as "completed"
- Edit plan: Change `- [ ]` to `- [x]`

**6. Archive plan when done:**
```bash
mv .opencode/plans/add-oauth-authentication.md \
   .opencode/plans/archive/add-oauth-authentication-2026-01-18.md
```

### Todo Format

**Required fields:**
- `content`: Imperative - "Install Auth0 SDK"
- `status`: "pending" | "in_progress" | "completed"
- `activeForm`: Present continuous - "Installing Auth0 SDK"

**Optional metadata in content:**
- TTD: "(TTD_REQUIRED)" or "(NO_TTD)"
- Size: "(Small)" | "(Medium)" | "(Large)"
- Blocker: "(BLOCKED: waiting for X)"

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
   - Plan file contains all information
   - Todos derived from plan dynamically
   - Plan checkboxes show execution history

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
