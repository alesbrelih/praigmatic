# PrAIgmatic Knowledge Base

The `.praigmatic/` directory is the project's structured brain — separating project intelligence from OpenCode engine configuration. While `.opencode/` holds the engine (agents, tools, commands, skills), `.praigmatic/` holds project-specific knowledge: plans, decisions, and domain understanding accumulated during development.

## Directory Map

| Directory | Purpose | Key Files |
|-----------|---------|-----------|
| [`knowledge/`](knowledge/index.md) | Domain knowledge about the pragmatic workflow system | Agents, review loops, planning stages, tools, commands |
| [`decisions/`](decisions/README.md) | Architectural and technical decision records (ADRs) | 0001 Two-Stage Planning, 0002 Committer Removal, 0003 Adaptive Routing |
| [`plans/`](plans/README.md) | Implementation plans (active and archived) | Plan files, archive of completed plans |
| [Glossary](../.opencode/reference/glossary.md) | Canonical term definitions | 65+ domain terms with cross-references |

## Quick Start

**I want to understand how the workflow works:**
1. Read the [Glossary](../.opencode/reference/glossary.md) for term definitions
2. Skim [`knowledge/workflow.md`](knowledge/workflow.md) for the two-stage planning flow
3. Read [`knowledge/agents.md`](knowledge/agents.md) for who does what

**I want to create a new plan:**
1. Run `/pragmatic-implementation` — the orchestrator handles everything
2. Plans go into [`plans/`](plans/) using the canonical executable contract format
3. Review the [planning guide](../.opencode/reference/planning-guide.md) for conventions

**I want to understand a past decision:**
1. Browse [`decisions/`](decisions/README.md) — each ADR explains context, decision, and consequences
2. Cross-reference with [`knowledge/`](knowledge/index.md) for related domain documentation

**I want to extend or modify the workflow:**
1. Read all files in [`knowledge/`](knowledge/index.md) to understand current architecture
2. Check [`decisions/`](decisions/README.md) for prior constraints
3. Reference the [`glossary`](../.opencode/reference/glossary.md) for consistent terminology

## Knowledge Graph

The knowledge graph documents the pragmatic workflow system across five domains:

- **[Workflow](knowledge/workflow.md)** — Two-stage planning (Direction → Plan), implementation orchestrator, approval gates
- **[Review Loops](knowledge/review-loops.md)** — All five review loops: Direction, Plan, Code, Holistic, QA — with retry caps and routing rules
- **[Agents](knowledge/agents.md)** — All agent types, their contracts, and the packet-based communication model
- **[Tools](knowledge/tools.md)** — Canonical contract enforcement, packet builders, prompt renderers, result parsers, and utilities
- **[Commands](knowledge/commands.md)** — `/pragmatic-implementation`, `/verify-finding`, `/verify-next`

## Architectural Decisions

Key decisions shaping the workflow:

| ADR | Topic | Status |
|-----|-------|--------|
| [0001](decisions/0001-two-stage-planning.md) | Two-stage planning (Direction → Plan) | Accepted |
| [0002](decisions/0002-committer-removal.md) | Committer agent removed, commits inlined into orchestrator | Accepted |
| [0003](decisions/0003-adaptive-review-routing.md) | Small tasks skip review, Medium/Large use full review loop | Accepted |

## Contributing

When adding to the knowledge base:
- Use terminology consistently — check the [glossary](../.opencode/reference/glossary.md)
- Add new ADRs when making architectural decisions
- Update relevant knowledge files when understanding evolves
- Reference ADRs and plans from knowledge files to maintain traceability
