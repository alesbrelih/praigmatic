# PrAIgmatic Agents

OpenCode configuration repo — custom agents, tools, commands, and shared references. Not an application repo.

## Setup

Symlink local dirs into OpenCode config:

```bash
./link.sh
```

Installs tools, agents, commands, skills, and reference docs into `~/.config/opencode/`.

## Testing Custom Tools

Tools in `.opencode/tools/` use `@opencode-ai/plugin` and vitest:

```bash
cd .opencode && npx vitest run
```

Config: `.opencode/vitest.config.ts`. Tests: `.opencode/tools/__tests__/`.

## Repo Structure

- `.opencode/agent/` — Agent definitions (markdown)
- `.opencode/tools/` — Custom OpenCode plugin tools (TypeScript)
- `.opencode/commands/` — Slash commands (`/pragmatic-implementation`)
- `.opencode/reference/` — Shared standards (TDD criteria, security checklist, etc.)
- `.opencode/skills/` — Skill definitions
- `.opencode/plans/` — Implementation plans (active) and `archive/` (completed)

## Plan Files

Format: `- [ ] **Task Name** (SIZE)` where SIZE = Small/Medium/Large.

Status markers: `[ ]` pending, `[~]` in-progress, `[x]` completed.

Completed plans archived to `.opencode/plans/archive/` with date suffix via `archive-plan` tool.

## Key Conventions

- `/pragmatic-implementation` is an orchestrator — it **never edits code directly**, delegates to `pragmatic-developer` and `pragmatic-code-reviewer` agents
- Commits use conventional format via custom `git-commit` tool (type/scope/subject)
- Self-correcting code review loop: max 3 iterations per task
- Two-stage planning: direction (reviewed by user) → detailed tasks
- Plugins: `@tarquinen/opencode-dcp` (context pruning), `context7` MCP server
