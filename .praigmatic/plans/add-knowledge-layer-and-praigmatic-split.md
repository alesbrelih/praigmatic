# Add Knowledge Layer and .praigmatic/ Split Plan

## Purpose
Replace the flat `.opencode/plans/` model with a structured `.praigmatic/` knowledge layer — glossary, knowledge graph, ADRs — and update the planner to leverage accumulated knowledge so plans don't start from scratch.

## Metadata
**References:** None

## Planning Summary
| Stage | Step | Status | Notes |
|-------|------|--------|-------|
| 1 | Explore | Run | Analyzed full repo: agents, tools, plans, reference docs |
| 1 | Clarify | Run | Discussed KG structure (domain files), update mechanism (hybrid checkpoint) |
| 1 | Analyze | Complete | Skills: customize-opencode, Unknowns: None, Complexity: Medium |
| 1 | Direction | Approved | `.opencode/`/`.praigmatic/` split, knowledge/ directory, hybrid KG checkpoint |
| 2 | Research | Run | Tool path conventions, ToolContext shape, resolvePlanPath internals |
| 2 | Plan | Complete | 15 tasks |
| 2 | Review | Pending | |

## Tasks

- [x] **Create `.praigmatic/` directory scaffold and seed stub files** (Small)
  - Purpose: Establish the new knowledge directory structure with placeholder files
  - Acceptance: All directories exist with stub README/index files in place
  - Steps:
    - Create `.praigmatic/` directory tree: `plans/archive/`, `knowledge/`, `decisions/
    - Write stub files: `.praigmatic/index.md`, `.praigmatic/knowledge/index.md`, `.praigmatic/decisions/README.md
    - Move `.opencode/plans/README.md` to `.praigmatic/plans/README.md` and update internal path references
  - Files: .praigmatic/index.md, .praigmatic/knowledge/index.md, .praigmatic/decisions/README.md, .praigmatic/plans/README.md
  - Dependencies: None
  - Context Tags: architecture
  - Actual Files: .praigmatic/index.md, .praigmatic/knowledge/index.md, .praigmatic/decisions/README.md, .praigmatic/plans/README.md
  - Notes: Created .praigmatic/ directory scaffold with all required subdirectories and stub files, and migrated the plans README from .opencode/ to .praigmatic/ with path references updated.
- [x] **Refactor tools for configurable plan directory** (Medium)
  - Purpose: Make all plan-related tools support a configurable base directory via `plansDir` parameter, using `context.directory` instead of `process.cwd()`
  - Acceptance: All tools accept optional `plansDir` arg, default to `.opencode/plans/`, use `context.directory` as base, existing tests pass
  - Steps:
    - Update `find-plan.ts`: add optional `plansDir` arg, use `resolve(context.directory, plansDir ?? ".opencode/plans")
    - Update `archive-plan.ts`: add optional `plansDir` arg, use `resolve(context.directory, plansDir ?? ".opencode/plans/archive")` for archive target
    - Update `parse-plan.ts`: add optional `plansDir` arg, pass to `resolvePlanPath
    - Update `validate-plan.ts`, `update-plan-task.ts`, `extract-commit-metadata.ts`, `build-developer-task-packet.ts`, `build-review-packet.ts`, `build-holistic-context-packet.ts`: add optional `plansDir` arg, use `context.directory` for path resolution
    - Refactor `plan-workflow.ts` `resolvePlanPath()`: add `plansSubdir` parameter with default `".opencode/plans"
    - Run `npx vitest run` in `.opencode/` to verify no regressions
  - Files: .opencode/tools/find-plan.ts, .opencode/tools/archive-plan.ts, .opencode/tools/parse-plan.ts, .opencode/tools/validate-plan.ts, .opencode/tools/update-plan-task.ts, .opencode/tools/extract-commit-metadata.ts, .opencode/tools/build-developer-task-packet.ts, .opencode/tools/build-review-packet.ts, .opencode/tools/build-holistic-context-packet.ts, .opencode/tools/lib/plan-workflow.ts
  - Dependencies: None
  - Produces: configurable-plans-dir
  - Actual Files: .opencode/tools/lib/plan-workflow.ts, .opencode/tools/find-plan.ts, .opencode/tools/archive-plan.ts, .opencode/tools/parse-plan.ts, .opencode/tools/validate-plan.ts, .opencode/tools/update-plan-task.ts, .opencode/tools/extract-commit-metadata.ts, .opencode/tools/build-developer-task-packet.ts, .opencode/tools/build-review-packet.ts, .opencode/tools/build-holistic-context-packet.ts, .opencode/tools/__tests__/find-plan.test.ts
  - Notes: All 10 plan-related tools now accept optional plansDir (or archiveDir) parameter and use context.directory for path resolution. Tools accepting explicit planPath no longer have a plansDir param. 1 code review retry, issues resolved. 174 tests pass.
- [x] **Migrate existing plans to `.praigmatic/plans/`** (Small)
  - Purpose: Move current `.opencode/plans/` content to new location
  - Acceptance: All active and archived plans accessible from `.praigmatic/plans/`, no files left behind in `.opencode/plans/`
  - Steps:
    - Move all active plans and archived plans from `.opencode/plans/` to `.praigmatic/plans/
    - Archive this plan to `.praigmatic/plans/` using the new `plansDir` path, then remove empty `.opencode/plans/
  - Files: .opencode/plans/*` → `.praigmatic/plans/*, .opencode/plans/archive/*` → `.praigmatic/plans/archive/*
  - Dependencies: Task 2 (tool refactoring), Task 1 (directory scaffold)
  - Context Tags: integration
  - Actual Files: .praigmatic/plans/, .opencode/plans/
  - Notes: Migrated all 23 plan files from .opencode/plans/ to .praigmatic/plans/. Plan was prematurely archived by developer; recovered to .praigmatic/plans/ for remaining implementation. Old .opencode/plans/ directory removed.
- [x] **Create glossary** (Medium)
  - Purpose: Single reference defining every domain term used across the praigmatic workflow, shared to all repos via symlinks
  - Acceptance: `glossary.md` covers all key terms found in agent files, commands, tools, and reference docs; organized alphabetically with cross-references
  - Steps:
    - Scan all `.opencode/agent/*.md`, `.opencode/commands/*.md`, `.opencode/reference/*.md` for domain terms
    - Define each term: Stage, Phase, Direction, Plan, Task, Holistic Review, Canonical Contract, Orchestrator, Agent, Subagent, TTD, QA, Checkpoint, Packet, etc.
    - Include cross-references to related terms (e.g., Stage → see also: Phase)
    - Write to `.opencode/reference/glossary.md` (shared via symlinks to all projects)
  - Files: .opencode/reference/glossary.md
  - Dependencies: None
  - Context Tags: architecture
  - Actual Files: .opencode/reference/glossary.md
  - Notes: Comprehensive glossary covering all 65+ domain terms organized alphabetically with cross-references, aliases, and structured definitions. Covers: workflow concepts (Stage, Direction, Plan, Task), agents (Orchestrator, all pragmatic-* agents), contracts (Canonical Executable Contract, Developer Contract, Reviewer Contract), packets (Developer Task, Review, Retry, Holistic), review loops (Code Review, Plan Review, Direction Review, Holistic Review, QA Validation), routing (Adaptive Routing, Security Override), tools (all build-*, parse-*, render-* tools), and output formats (Completed, Deviated, Failed, Blocked).
- [x] **Create knowledge graph files** (Medium)
  - Purpose: Document the praigmatic workflow system architecture — agents, review loops, planning stages, tool ecosystem — as domain knowledge files
  - Acceptance: `knowledge/index.md` maps all domains; each domain file documents its area with architecture, flows, integration points, and links to ADRs/plans
  - Steps:
    - Write `knowledge/index.md`: map of all domain areas with 1-2 line summaries
    - Write `knowledge/workflow.md`: planning stages, direction→plan flow, Stage 1 vs Stage 2, workflow selection rules
    - Write `knowledge/review-loops.md`: self-correcting code review, direction review, plan review, holistic review, QA validation; retry caps and routing logic
    - Write `knowledge/agents.md`: agent architecture, model assignments, permission patterns, subagent spawning rules, packet-based communication
    - Write `knowledge/tools.md`: plan-related tool ecosystem, canonical contract enforcement, shared library (`plan-workflow.ts`)
    - Write `knowledge/commands.md`: `/pragmatic-implementation` orchestrator, `/verify-finding`, `/verify-next
    - Each file includes: Overview, Architecture, Key Flows, Integration Points, Related ADRs/Plans sections
  - Files: .praigmatic/knowledge/index.md, .praigmatic/knowledge/workflow.md, .praigmatic/knowledge/review-loops.md, .praigmatic/knowledge/agents.md, .praigmatic/knowledge/tools.md, .praigmatic/knowledge/commands.md
  - Dependencies: Task 1 (directory scaffold), Task 4 (glossary — terms referenced in KG)
  - Context Tags: architecture
- [x] **Create initial ADRs** (Small)
  - Purpose: Capture 2-3 key architectural decisions in ADR format to bootstrap the decisions directory
  - Acceptance: Each ADR follows the canonical template (Status, Context, Decision, Consequences, Related), uses sequential numbering
  - Steps:
    - Create `decisions/README.md` with ADR template and conventions
    - Write `0001-two-stage-planning.md`: why direction is separated from tasks
    - Write `0002-committer-removal.md`: why committer agent was deleted, commit logic inlined
    - Write `0003-adaptive-review-routing.md`: why Small tasks skip external review, Medium/Large use it
  - Files: .praigmatic/decisions/README.md, .praigmatic/decisions/0001-two-stage-planning.md, .praigmatic/decisions/0002-committer-removal.md, .praigmatic/decisions/0003-adaptive-review-routing.md
  - Dependencies: Task 1 (directory scaffold)
  - Context Tags: architecture
- [x] **Create `.praigmatic/index.md` hub entry point** (Small)
  - Purpose: Single entry point that links to all knowledge artifacts — glossary, knowledge graph, ADRs, plans
  - Acceptance: Clear navigation with brief descriptions; self-explanatory for a new contributor
  - Steps:
    - Write intro explaining what `.praigmatic/` is and how to use it
    - Link to `knowledge/index.md`, `.opencode/reference/glossary.md`, `decisions/`, `plans/
    - Include Quick Start section for common tasks
  - Files: .praigmatic/index.md` (replace stub from Task 1)
  - Dependencies: Task 4 (glossary), Task 5 (knowledge graph), Task 6 (ADRs)
  - Context Tags: architecture
- [x] **Update pragmatic-planner-v2 with knowledge context loading** (Small)
  - Purpose: Planner loads glossary and relevant knowledge graph files as context before beginning Stage 1, so plans build on existing knowledge
  - Acceptance: Planner v2 prompt includes instruction to load `.opencode/reference/glossary.md` and `.praigmatic/knowledge/index.md` before Step 1.1; all path references updated
  - Steps:
    - Add pre-flight step before Step 1.1: load glossary and knowledge graph index as context
    - Update plan template and all `.opencode/plans/` references to `.praigmatic/plans/
    - Update `find-plan` and `validate-plan` invocation instructions to pass `plansDir: ".praigmatic/plans"
  - Files: .opencode/agent/pragmatic-planner-v2.md
  - Dependencies: Task 2 (tool refactoring), Task 4 (glossary), Task 5 (knowledge graph)
  - Context Tags: architecture, integration
  - Consumes: configurable-plans-dir
  - Actual Files: .opencode/agent/pragmatic-planner-v2.md
  - Notes: Added Pre-Flight: Knowledge Loading section before Stage 1 that loads glossary, knowledge graph index, relevant domain files, and ADRs. Updated plan write path from .opencode/plans/ to .praigmatic/plans/. Updated validate-plan invocation to pass plansDir. No stale .opencode/plans/ references remain.
- [ ] **Update pragmatic-implementation command — add KG checkpoint and path refs** (Medium)
  - Purpose: Add mandatory knowledge graph update step after holistic review, before archive; update all path references to `.praigmatic/plans/`
  - Acceptance: Command includes Step 4.10 (Knowledge Graph Checkpoint) with full workflow; all `.opencode/` path references updated
  - Steps:
    - Add Step 4.10 "Knowledge Graph Checkpoint" between holistic review (4.8) and archive
    - Implement checkpoint workflow: check plan's Knowledge Graph section, load domain files, invoke developer for diff proposals
    - Handle outcomes: user approves and commit, "no changes needed" escape hatch, approval prompt
    - Update all `.opencode/plans/` references to `.praigmatic/plans/`
    - Update `find-plan`, `validate-plan`, `parse-plan`, `archive-plan` invocations to pass `plansDir: ".praigmatic/plans"`
    - Build the Knowledge Graph Update prompt template following holistic review retry prompt pattern (see Task 10)
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: Task 2 (tool refactoring), Task 5 (knowledge graph files must exist)
  - Context Tags: architecture, integration
  - Consumes: configurable-plans-dir
  - Produces: kg-checkpoint-workflow

- [ ] **Inject knowledge discovery preambles into autonomous agents** (Medium)
  - Purpose: Make explorer, brainstormer, researcher, and direction-planner check `.praigmatic/knowledge/` and `.opencode/reference/glossary.md` before doing their core work, so they build on existing knowledge instead of starting from scratch
  - Acceptance: Each agent file includes a short preamble that loads the glossary and scans knowledge/index.md for relevant domains before beginning its primary task
  - Steps:
    - Add preamble to `pragmatic-explorer.md`: check knowledge/ for known patterns before exploring code — "X domain areas already documented. Load relevant files if this task touches them."
    - Add preamble to `pragmatic-brainstormer.md`: check glossary for domain terms, reference ADRs for prior decisions — avoid re-asking settled questions
    - Add preamble to `pragmatic-researcher.md`: check knowledge/ before external research — "Already documented in knowledge/X.md, skip duplicate research"
    - Add preamble to `pragmatic-direction-planner.md`: load relevant domain files before proposing direction — "Build on existing architecture, don't reinvent"
    - Each preamble is 2-3 sentences, not a full workflow step — lightweight gate, not heavyweight process
  - Files: `.opencode/agent/pragmatic-explorer.md`, `.opencode/agent/pragmatic-brainstormer.md`, `.opencode/agent/pragmatic-researcher.md`, `.opencode/agent/pragmatic-direction-planner.md`
  - Dependencies: Task 4 (glossary), Task 5 (knowledge graph files)
  - Context Tags: architecture, integration

- [ ] **Add Knowledge Graph section to plan template** (Small)
  - Purpose: Plans include a Knowledge Graph section so the implementation command knows which domain files to update
  - Acceptance: Plan template includes optional Knowledge Graph section; validator accepts it without constraints
  - Steps:
    - Add Knowledge Graph section to plan template with fields: Domains Affected (list of knowledge files), Update Required (No/Review/Yes with justification)
    - Add optional Knowledge Graph field to the plan parser/validator with no validation constraints
  - Files: `.opencode/agent/pragmatic-planner-v2.md`, `.opencode/tools/lib/plan-workflow.ts`
  - Dependencies: Task 8 (planner v2 update), Task 9 (implementation command consumes this section)
  - Context Tags: interface

- [ ] **Update reference docs for new paths** (Small)
  - Purpose: All reference documentation reflects `.praigmatic/` split and new artifacts
  - Acceptance: No stale `.opencode/plans/` references in reference docs; planning-guide updated to mention knowledge graph and ADRs
  - Steps:
    - Update `planning-guide.md`: replace `.opencode/plans/` with `.praigmatic/plans/`, add mention of knowledge graph section in plan template
    - Update `tool-patterns.md`: replace `.opencode/plans/` with `.praigmatic/plans/`
    - Update `implementation-templates.md`: add Knowledge Graph Update prompt template, update path references
  - Files: `.opencode/reference/planning-guide.md`, `.opencode/reference/tool-patterns.md`, `.opencode/reference/implementation-templates.md`
  - Dependencies: Task 3 (plan migration), Task 9 (implementation command)
  - Context Tags: integration

- [ ] **Update AGENTS.md and README.md for new structure** (Small)
  - Purpose: Top-level documentation reflects the `.opencode/` / `.praigmatic/` split and new knowledge artifacts
  - Acceptance: AGENTS.md and README.md accurately describe current repo structure including `.praigmatic/` directory and its contents
  - Steps:
    - Update `AGENTS.md` and `README.md` Repo Structure sections to reflect `.praigmatic/` split and new subdirectories
    - Add knowledge layer overview section to README
    - Check and update `link.sh` if it references plans directory
  - Files: `AGENTS.md`, `README.md`, `link.sh`
  - Dependencies: Task 3 (plan migration), Task 5 (knowledge graph), Task 6 (ADRs)
  - Context Tags: integration

- [ ] **Create `/migrate-praigmatic` command** (Medium)
  - Purpose: Help any repo adopt the `.praigmatic/` structure by moving plans and extracting domain knowledge from existing plan history
  - Acceptance: Command analyzes existing plans, identifies recurring domain areas, generates draft knowledge files, scaffolds directories, and moves plans — all with a review-before-commit workflow
  - Steps:
    - Create `.opencode/commands/migrate-praigmatic.md` command definition
    - Scan existing plans in `.opencode/plans/` (active + archive), parse each for recurring topics, architecture sections, and cross-plan references
    - Generate `.praigmatic/knowledge/index.md` listing discovered domain areas with confidence scores
    - For each domain area, create a draft knowledge file seeded from relevant plan sections (Purpose, Architecture, Key Decisions)
    - Move all plans from `.opencode/plans/` to `.praigmatic/plans/`
    - Create `.praigmatic/decisions/` directory with README template
    - Present migration summary: "X plans moved, Y domain areas discovered, Z knowledge files drafted" with next steps to review and commit
  - Files: `.opencode/commands/migrate-praigmatic.md`
  - Dependencies: Task 2 (tool refactoring — uses `plansDir`), Task 3 (plan migration — validates approach)
  - Context Tags: integration

- [ ] **Verify end-to-end** (Small)
  - Purpose: Confirm all changes work together — tools pass tests, paths resolve, planner loads context correctly
  - Acceptance: `npx vitest run` passes; `find-plan` and `archive-plan` work with new `plansDir`; no stale `.opencode/plans/` references remain
  - Steps:
    - Run `npx vitest run` in `.opencode/` to verify tool tests pass
    - Verify `find-plan(plansDir: ".praigmatic/plans")` and `archive-plan` resolve correctly
    - Read through planner v2 and implementation command to check for stale `.opencode/plans/` references
  - Files: None (verification only)
  - Dependencies: All previous tasks

## Architecture Overview

**Before:** Flat `.opencode/` directory serving both as OpenCode engine config and project knowledge store. Plans live alongside agent definitions. No structured way to accumulate domain knowledge.

**After:** Clean separation — `.opencode/` is the engine (agents, tools, commands, skills, shared reference docs like glossary), `.praigmatic/` is the project brain (plans, decisions, knowledge graph). The glossary lives in `.opencode/reference/` so it's automatically available to all repos via symlinks. The planner loads knowledge artifacts before planning so new plans build on existing understanding.

The implementation command gains a knowledge graph checkpoint step (mirroring the holistic review pattern) that ensures domain knowledge stays current. A `/migrate-praigmatic` command helps other repos adopt the structure. Autonomous agents (explorer, brainstormer, researcher, direction-planner) get lightweight knowledge-discovery preambles — they check `.praigmatic/` before starting work. Orchestrator-spawned agents (developer, reviewers) receive knowledge through context packets.

## Technical Decisions

- **Decision**: `plansDir` parameter on tools, not global config — Rationale: Per-invocation flexibility; a consuming repo could have plans in `.praigmatic/plans/` while this config repo defaults to `.opencode/plans/`. No breaking change for existing users. Trade-offs: Callers must pass the parameter explicitly; slightly more verbose.

- **Decision**: Knowledge graph as a directory of domain files, not a single file — Rationale: Grows with the project; domain files can be loaded selectively; avoids monolithic file problem. Trade-offs: More files to maintain; need `index.md` for discovery.

- **Decision**: Hybrid KG update (mandatory checkpoint, agent suggests, user approves) — Rationale: Prevents staleness while keeping quality high; the mandatory step ensures it happens, the human approval ensures it's correct. Trade-offs: Adds a step to every plan completion; "no changes needed" escape hatch keeps it lightweight.

- **Decision**: No new agent for KG checkpoint — Rationale: The checkpoint is a single focused prompt; existing `pragmatic-developer` handles documentation updates. Over-engineering to create a dedicated agent. Trade-offs: Developer agent needs more context; but that's already the pattern for holistic review retries.

- **Decision**: Glossary in `.opencode/reference/` (shared), not `.praigmatic/reference/` (per-project) — Rationale: Domain terms like "Stage", "Holistic Review", "Canonical Contract" are workflow concepts, not project-specific. Via symlinks, all repos get the glossary automatically. Trade-offs: Updates to glossary require a commit to this config repo, but that's the right place for workflow documentation.

- **Decision**: Migration command (`/migrate-praigmatic`) for other repos — Rationale: Other projects using this config may have `.opencode/plans/` they want to migrate. A command automates the move + scaffold. Trade-offs: Adds a command to maintain; but it's a one-shot tool that won't need frequent updates.

## Backwards Compatibility

**Required:** Yes | **Rationale:** This config repo is shared across projects via symlinks. Existing tool invocations must not break. | **Impact:** Tools default to `.opencode/plans/` when no `plansDir` is passed. All existing callers continue to work. Only the planner and implementation command explicitly pass the new path.

## Security Considerations
- No new security surface — knowledge files are markdown in the repo, same permission model as existing plans/reference docs
- The KG checkpoint step invokes the developer agent with file write permissions — same trust model as the rest of the workflow

## Testing Strategy
- Unit: Existing vitest suite for tools passes after refactoring
- Integration: Manual verification of `find-plan`, `archive-plan`, `validate-plan` with new `plansDir` parameter
- Manual: Read-through of planner v2 and implementation command for stale path references

















