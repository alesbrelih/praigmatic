# Workflow: Planning and Implementation

## Overview

The PrAIgmatic workflow uses a structured two-stage planning process followed by plan-driven implementation. The Pragmatic Planner v2 agent drives the planning phase, producing an executable plan file. The `/pragmatic-implementation` orchestrator command then executes that plan task by task. The system is designed for both human readability and deterministic agent execution, with clear approval gates and audit trails at every step.

## Architecture / Key Concepts

### Two-Stage Workflow

Planning is split into two stages, each requiring explicit user approval:

- **Stage 1: Direction** — Produces an architectural and technical approach document that defines what will be built and how. This stage catches overengineering at the root, before tasks exist.
- **Stage 2: Plan** — Produces a detailed executable plan file with tasks, acceptance criteria, file lists, and dependencies.

This separation prevents the system from diving into task details before the overall approach is approved, reducing rework.

### Plan File as Single Source of Truth

The plan file (`.opencode/plans/[feature].md`) serves both as the task definition document AND the execution tracker. Checkboxes (`- [ ]` / `- [~]` / `- [x]`) mark task state. No separate todo system exists — the plan file is the canonical record.

### Canonical Executable Contract

Every task in a plan must include five required fields:
- **Purpose** — One-line deliverable description
- **Acceptance** — Testable completion criteria
- **Steps** — High-level implementation actions (numbered, 1-12 bullets)
- **Files** — Primary files expected to be modified
- **Dependencies** — Tasks that must complete first

Optional fields: Context Tags, Produces, Consumes, Refs, Commit Notes.

### Context Gate System

Optional metadata on tasks controls what context gets included in developer and review packets:
- `Context Tags`: `architecture`, `security`, `backwards_compat`, `interface`, `integration`
- `Produces` / `Consumes`: Named outputs that drive downstream context inclusion

This keeps packets minimal — only relevant context is included for each task.

## Key Flows

### Stage 1: Direction

**Entry:** User provides a feature request or problem statement to the Pragmatic Planner v2.

**Step 1.1: Explore (Optional)**
- Run when: Modifying existing code, need existing patterns
- Skip when: New project, complete tech stack provided
- Action: Spawn `pragmatic-explorer` to analyze codebase
- Output: `exploration_context` (tech stack, patterns, integration points, constraints)

**Step 1.2: Clarify (Optional)**
- Run when: Vague request, multiple possible approaches
- Skip when: Clear requirements, one obvious approach
- Action: Spawn `pragmatic-brainstormer` to ask structured questions
- Output: `clarification_context` (intent, decisions, constraints, success criteria)

**Step 1.3: Analyze (Required)**
- Load relevant skills via `skill()` tool
- Document unknowns and complexity estimate
- Output: Skills loaded, unknowns list, complexity level (Simple/Medium/Complex)

**Step 1.4: Get Direction (Required)**
- Spawn `pragmatic-direction-planner` with all accumulated context
- Output: Direction document (summary, key decisions, trade-offs, complexity estimate)

**Step 1.5: Direction Review**
- `pragmatic-direction-reviewer` evaluates direction for YAGNI, KISS, scale appropriateness
- One planner revision pass allowed
- If second review still requires changes → explicit user approval required

**Step 1.6: User Approval (Conditional)**
- Reviewer approved: Auto-proceed to Stage 2
- Reviewer found issues: Display direction + unresolved issues, ask user to approve/adjust/stop

### Stage 2: Plan

**Step 2.1: Research (Optional)**
- Run when: Unknowns, new tech, security/performance concerns
- Spawn `pragmatic-researcher` for external documentation and code examples
- Multiple researchers can run in parallel

**Step 2.2: Create Plan (Required)**
- Write plan to `.opencode/plans/[feature].md`
- Include: Purpose, Metadata, Planning Summary table, Tasks, Architecture Overview, Technical Decisions, Security Considerations, Testing Strategy
- Each task uses the canonical executable contract format
- Run `validate-plan` after writing; fix violations before proceeding

**Step 2.3: Plan Review**
- `pragmatic-plan-reviewer` evaluates task granularity, plan scope, logic, completeness
- Primary focus (60%): Task size optimization and plan splitting detection
- One planner revision pass allowed

**Step 2.4: User Approval (Required)**
- Display plan summary to user
- User must explicitly approve before implementation

**Step 2.5: Handoff**
- Output: Plan path, task count, architecture highlights, key decisions
- Command: `/pragmatic-implementation`
- Planner does NOT start implementation

### Implementation: `/pragmatic-implementation`

Triggered after plan approval. The orchestrator:

1. **Find Plan** — Locate most recent plan file via `find-plan`
2. **Validate Git State** — Check for uncommitted changes
3. **Validate and Parse Plan** — Run `validate-plan` then `parse-plan` for structured JSON
4. **Implementation Loop** — For each task:
   - Mark in-progress → Invoke developer → Handle response → Code review (if needed) → Commit → Accumulate context
5. **Holistic Review** — Cross-cutting review after all tasks complete
6. **QA Validation** — Optional runtime validation
7. **Archive** — Move plan file to archive directory

### Workflow Selection Rules

- Default: Full two-stage workflow (Direction → Plan)
- Trivial tasks: Skip Stage 1, go directly to plan creation
- Must still use canonical executable format, run plan review, and get user approval

### User Approval Gates

| Gate | Stage | Triggers |
|------|-------|----------|
| Direction approval | Stage 1 exit | Auto-proceed if reviewer approved; explicit if issues remain |
| Plan approval | Stage 2 exit | Always explicit |
| Pre-implementation | Before execution | Confirmation via `/pragmatic-implementation` |
| QA opt-in | Post-implementation | Via `--qa` flag or `## QA Required` plan section |

### Planning Summary Table Format

Pragmatic Planner v2 produces a table documenting which steps ran:

```
| Stage | Step | Status | Notes |
|-------|------|--------|-------|
| 1 | Explore | Run/Skip | Rationale |
| 1 | Clarify | Run/Skip | Rationale |
| 1 | Analyze | Complete | Skills, Unknowns, Complexity |
| 1 | Direction | Approved/Adjusted | Summary |
| 2 | Research | Run/Skip | What was researched |
| 2 | Plan | Complete | X tasks |
| 2 | Review | Complete | Review outcome |
```

## Integration Points

- **Orchestrator** (`/pragmatic-implementation`): Drives execution after planning completes
- **Tool ecosystem** (validate-plan, parse-plan, build-*, render-*, parse-*): All tools consume plan data
- **Agent contracts**: Every agent's structured result feeds the next workflow step
- **Git integration**: Each task produces a conventional commit via `git-commit` tool

## Related ADRs

See `../decisions/` for architecture decision records.

## Related Plans

See `../plans/` for implementation plans.
