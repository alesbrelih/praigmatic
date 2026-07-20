# Knowledge Graph

This directory documents the PrAIgmatic workflow system architecture — agents, tools, review loops, planning stages, and commands. These files serve as the canonical reference for how the system works, enabling new contributors and agents to quickly understand the full stack.

## Domain Areas

### [Workflow](./workflow.md)
The two-stage planning workflow (Direction → Plan), Stage 1 vs Stage 2 details, workflow selection rules, user approval gates, and the planning summary table format. Covers the complete lifecycle from initial request through approved executable plan.

### [Review Loops](./review-loops.md)
All five review loops: Code Review Loop (per-task, self-correcting), Plan Review (plan quality), Direction Review (architectural direction), Holistic Review (post-implementation cross-cutting), and QA Validation (runtime tests). Includes retry caps, routing logic, adaptive routing, and the security override.

### [Agents](./agents.md)
Every agent type with their roles, permissions, and contracts: Orchestrator (coordination, never edits code), pragmatic-developer (implementation, TDD, skill loading), pragmatic-code-reviewer (severity taxonomy, overengineering detection, plan awareness), pragmatic-planner-v2 (two-stage planning), and all subagents (explorer, brainstormer, researcher, direction-planner, direction-reviewer, plan-reviewer, QA). Documents the packet-based communication model and structured result contracts.

### [Tools](./tools.md)
The complete plan-related tool ecosystem: canonical contract enforcement (validate-plan, parse-plan), packet builders (build-developer-task-packet, build-review-packet, build-retry-packet, build-holistic-context-packet), prompt renderers (render-developer-task-prompt, render-code-review-prompt, render-developer-retry-prompt, render-developer-qa-fix-prompt), result parsers (parse-task-result, parse-review-result, parse-qa-result), and utility tools (find-plan, archive-plan, extract-commit-metadata, git-commit, validate-git-state, update-plan-task). Covers the shared `plan-workflow.ts` library and `resolvePlanPath()`.

### [Commands](./commands.md)
The slash commands: `/pragmatic-implementation` (orchestrator workflow, step-by-step flow, adaptive routing, KG checkpoint), `/verify-finding` (adversarial finding verification with skeptic-presenter-arbiter debate), and `/verify-next` (automated batch verification of unverified local findings).

## How to Use

- **New contributors**: Start with [Workflow](./workflow.md) for the big picture, then read [Agents](./agents.md) to understand who does what, then [Review Loops](./review-loops.md) for quality assurance.
- **Implementing a change**: Read the relevant agent definition in [Agents](./agents.md), check [Tools](./tools.md) for available workflow tools, and consult [Commands](./commands.md) for orchestration flows.
- **Extending the system**: Review [Tools](./tools.md) to understand the packet/contract model, then see [Review Loops](./review-loops.md) for how new review stages integrate.
- **Debugging workflow issues**: Check [Review Loops](./review-loops.md) for retry caps and routing rules, [Agents](./agents.md) for agent responsibilities and contracts.

## Related ADRs

See `../decisions/` for architecture decision records.

## Related Plans

See `../plans/` for implementation plans.
