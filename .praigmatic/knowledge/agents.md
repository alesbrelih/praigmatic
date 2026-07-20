# Agents

## Overview

The PrAIgmatic workflow uses a multi-agent architecture where specialized agents handle distinct responsibilities. Agents communicate through structured packets and contracts — deterministic JSON objects that carry exactly the context needed for each invocation. The orchestrator coordinates all agents but never edits code directly. Each agent has defined permissions, input/output contracts, and clear boundaries it must not cross.

## Architecture / Key Concepts

### Packet-Based Communication

Agents do not read plan files or shared state directly. Instead, the orchestrator builds structured JSON **packets** from parsed plan data and accumulated execution state, then renders them into prompts via **prompt renderers**. This ensures:
- Deterministic input — agents always see the same data for the same state
- Minimal context — packets include only what's relevant
- No shared mutable state — the orchestrator is the single source of coordination

### Structured Result Contracts

Every agent returns a `## Structured Result` JSON block that the orchestrator parses deterministically. This machine-readable block contains status, decision, files modified, issues, discoveries, and other metadata that drives the next workflow step.

### Skill Loading

All agents must identify the tech stack from their task and load matching skills via the `skill()` tool as their first step. This is a mandatory, enforced step that injects specialized instructions and patterns.

## Key Agent Types

### Orchestrator

**Role:** Central coordination agent. Drives the `/pragmatic-implementation` workflow end-to-end.

**Key rules:**
- **NEVER edits code directly** — delegates all implementation to pragmatic-developer
- **NEVER fixes review issues directly** — delegates to pragmatic-developer
- Reads plan files, manages git state, invokes agents via `task()`, parses structured results

**Responsibilities:**
1. Find and validate plan files
2. Loop through tasks (mark in-progress → invoke developer → handle response → code review → commit → accumulate context)
3. Run holistic review after all tasks complete
4. Run QA validation (optional)
5. Archive completed plans

**Permissions:** Can use all workflow tools (build-*, render-*, parse-*), git tools, plan management tools.

### pragmatic-developer

**Role:** Pure implementation agent. Writes code, follows TDD when required, loads relevant skills.

**Input:** Structured prompt with task information, context (architecture, decisions, security), steps, acceptance criteria, files to modify.

**Output:** One of four formats with structured result:
- `completed` — Task done as specified
- `deviated` — Task done but approach differed
- `failed` — Task could not be completed (with root cause)
- `blocked` — Task needs external intervention (with required action)

**Core principles:** Simple over complex, readable over clever, maintainable over optimized, tested over perfect, security by default.

**Workflow phases:**
1. Analysis — Skill loading, task type identification, TDD decision, security assessment
2. Implementation — TDD (red-green-refactor) or standard (implement → test → document)
3. Pre-handoff verification — Review changed files, scope verification, report exact files

**Subagent access:** Can delegate to pragmatic-explorer (patterns), pragmatic-brainstormer (design decisions), pragmatic-researcher (external guidance).

**Must NOT:** Read plan files, manage checkboxes, stage/commit code, orchestrate loops, ask users for approvals directly.

### pragmatic-code-reviewer

**Role:** Quality gate for code changes. Advisory only — returns findings but never modifies code.

**Review dimensions (weighted):**
- Security (30%) — Input validation, injection, auth
- Maintainability (25%) — Readability, DRY, single responsibility
- Overengineering (20%) — Pattern overuse, premature optimization
- Testing (15%) — Coverage, isolation, mocking
- Performance (10%) — Algorithmic efficiency, queries

**Output:** Structured result with `decision` (approved/changes_required), `highest_severity`, `summary`, and `issues` array.

**Overengineering detection (all HIGH by default):**
- Singleton/Factory/Observer overuse
- Strategy when if/else suffices
- Complex generics for simple cases
- Caching without measurement
- Unnecessary DI containers
- Excessive layering
- DTO layers that just copy data

**Plan awareness:** Receives plan context to align with architecture, prepare for future tasks, avoid duplicate work suggestions, detect cross-task issues, and respect task boundaries.

**Decision rule:** `approved` only when no issues above Low remain.

### pragmatic-planner-v2

**Role:** Two-stage planning agent. Drives the Direction → Plan workflow.

**Core principles:** Context-first, clarify-first, two-stage approval, pragmatic (simplest viable solution), minimal tasks.

**Permissions:** Can spawn all subagents (explorer, brainstormer, researcher, direction-planner, direction-reviewer, plan-reviewer). Cannot implement code.

**Workflow:**
- Stage 1: Explore (optional) → Clarify (optional) → Analyze → Get Direction → Direction Review → User Approval
- Stage 2: Research (optional) → Create Plan → Plan Review → User Approval → Handoff

**Handoff output:** Plan path, task count, architecture highlights, key decisions, and the `/pragmatic-implementation` command.

### pragmatic-explorer (Subagent)

**Role:** Fast codebase explorer. Analyzes project structure, tech stack, existing patterns.

**When used:** Modifying existing code, need existing patterns, checking constraints.

**Output:** Tech stack, project structure, relevant patterns, integration points, constraints, unknowns.

**Key rule:** Reports repo facts only — never invents design decisions.

### pragmatic-brainstormer (Subagent)

**Role:** Interactive requirements clarifier. Asks structured questions to resolve ambiguity.

**When used:** Vague requirements, multiple possible approaches, trade-off decisions needed.

**Output:** Clarified requirements with user intent, technical decisions, constraints, success criteria, out-of-scope items.

**Key rules:** Max 5 questions, provides options with trade-offs, reads codebase first to avoid asking what code already answers.

### pragmatic-researcher (Subagent)

**Role:** External/current documentation research. Uses Context7, Grep.app, and WebSearch.

**When used:** Planning or implementation needs current external docs, version-aware guidance, multi-source evidence.

**Core principles:** Multi-source verification (2+ sources), current information, implementation focus, version awareness.

**Key rule:** Supports prior direction decisions unless caller explicitly asks for alternatives.

### pragmatic-direction-planner (Subagent)

**Role:** Creates high-level architectural direction. Focuses on "what" and "how to approach" — NOT detailed tasks.

**When used:** Called by pragmatic-planner-v2 during Stage 1 after exploration and clarification.

**Output:** Direction summary, key decisions (3-5 with rationale), trade-offs (2-3), complexity estimate.

**Key rule:** Does NOT create detailed tasks, write plan files, self-review, or implement code.

### pragmatic-direction-reviewer (Subagent)

**Role:** Senior developer that challenges technical direction before tasks exist. Advisory only.

**Focus areas (by priority):**
- HIGH: YAGNI, KISS, Scale Appropriateness
- MEDIUM: Scope Creep, Technology Overkill, Abstractionitis, Pattern Forcing
- LOW: Edge Case Overload, Trade-off Validity, Simpler Alternatives

**Decision rule:** `approved` when no High issues and no more than two Medium issues.

### pragmatic-plan-reviewer (Subagent)

**Role:** Plan quality reviewer with primary focus on task size optimization.

**Mission priority:**
- PRIMARY (60%): Task granularity and plan scope — make tasks small, detect when plans should split
- SECONDARY (40%): Logic, completeness, alignment with prior decisions

**Anti-patterns detected:** Dependency-only tasks, file-creation-only tasks, import-only tasks, tasks >15 steps (must split).

**Decision rule:** `approved` only when no High or Critical issue remains.

### pragmatic-qa (Subagent)

**Role:** QA engineer that validates runtime behavior. Read-only + run-only — never modifies code.

**When used:** Optional — only when explicitly requested or plan requires it.

**Workflow phases:** Setup (detect tech stack) → Test Suite → App Startup → Runtime Validation → Cleanup & Report.

**Output formats:** Pass (all verified), Partial (some issues found with classification), Fail (blocker).

## Integration Points

- **Packet flow:** Orchestrator → build-developer-task-packet → render-developer-task-prompt → pragmatic-developer → parse-task-result → orchestrator
- **Review flow:** Orchestrator → build-review-packet → render-code-review-prompt → pragmatic-code-reviewer → parse-review-result → orchestrator
- **Planning flow:** pragmatic-planner-v2 → spawns subagents → produces plan file → validate-plan → parse-plan → handoff to orchestrator
- **QA flow:** Orchestrator → pragmatic-qa → parse-qa-result → render-developer-qa-fix-prompt → pragmatic-developer → re-run QA

## Related ADRs

See `../decisions/` for architecture decision records.

## Related Plans

See `../plans/` for implementation plans.
