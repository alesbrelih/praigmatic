# PrAIgmatic Agents

OpenCode workspace with a separate `.praigmatic/` knowledge brain — custom agents, tools, commands, shared references, and project intelligence (plans, decisions, domain knowledge). Not an application repo.

## Setup

Symlink local dirs into OpenCode config:

```bash
./link.sh
```

Links tools, agents, commands, skills, and shared reference docs from `.opencode/` into `~/.config/opencode/`.
The project brain at `.praigmatic/` (plans, decisions, knowledge graph) stays local to this repo.

## Testing Custom Tools

Tools in `.opencode/tools/` use `@opencode-ai/plugin` and vitest:

```bash
cd .opencode && npx vitest run
```

Config: `.opencode/vitest.config.ts`. Tests: `.opencode/tools/__tests__/`.

## Repo Structure

### Engine (`.opencode/`)
- `.opencode/agent/` — Agent definitions (markdown)
- `.opencode/tools/` — Custom OpenCode plugin tools (TypeScript)
- `.opencode/commands/` — Slash commands (`/pragmatic-implementation`)
- `.opencode/reference/` — Shared standards (TDD criteria, security checklist, glossary, etc.)
- `.opencode/skills/` — Skill definitions

### Project Brain (`.praigmatic/`)
- `.praigmatic/plans/` — Implementation plans (active) and `archive/` (completed)
- `.praigmatic/decisions/` — Architectural decision records (ADRs)
- `.praigmatic/knowledge/` — Knowledge graph (workflow, agents, tools, commands, review loops)
- `.praigmatic/index.md` — Knowledge base entry point and quick-reference

## Plan Files

Format: `- [ ] **Task Name** (SIZE)` where SIZE = Small/Medium/Large.

Status markers: `[ ]` pending, `[~]` in-progress, `[x]` completed.

Completed plans archived to `.praigmatic/plans/archive/` with date suffix via `archive-plan` tool.

## Key Conventions

- `/pragmatic-implementation` is an orchestrator — it **never edits code directly**, delegates to `pragmatic-developer` and `pragmatic-code-reviewer` agents
- Commits use conventional format via custom `git-commit` tool (type/scope/subject)
- Self-correcting code review loop: max 3 iterations per task
- Two-stage planning: direction (reviewed by user) → detailed tasks
- Plugins: `@tarquinen/opencode-dcp` (context pruning), `context7` MCP server
