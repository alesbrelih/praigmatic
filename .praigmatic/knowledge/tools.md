# Tools: Plan-Related Workflow Ecosystem

## Overview

The PrAIgmatic workflow relies on a set of deterministic CLI tools that produce structured data from plan files and execution state. These tools form a workflow tool layer between the orchestrator and agents — the orchestrator must use these tools rather than assembling prompts from narrative sections manually. Every tool has a specific purpose, produces or consumes structured JSON, and enforces the canonical executable contract.

## Architecture / Key Concepts

### Tool Categories

The tools fall into four categories:

1. **Canonical Contract Enforcement** — Validate and parse plan files against the strict task format
2. **Packet Builders** — Construct structured JSON packets from plan data and execution state
3. **Prompt Renderers** — Convert structured packets into deterministic markdown prompts for agents
4. **Result Parsers** — Parse agent output structured results into actionable data for the orchestrator
5. **Utility Tools** — Git state, plan management, commit metadata

### Shared Library: `plan-workflow.ts`

Located at `.opencode/tools/lib/plan-workflow.ts`, this TypeScript library provides the core types and functions used by the CLI tools:

**Key types:**
- `ParsedPlanTask` — Full task definition with all fields (title, status, size, purpose, acceptance, steps, files, dependencies, context tags, produces, consumes, refs, commit notes, actual files, runtime warnings)
- `ParsedPlan` — Full plan with title, purpose, references, architecture overview, technical decisions, backwards compatibility, security considerations, testing strategy, tasks array
- `PlanInspection` — Plan plus violations array (used by validation)

**Key functions:**
- `inspectPlanContent(content, path)` — Parse and validate plan content, returning all violations without throwing
- `parsePlanContent(content, path)` — Parse plan content, throwing on violations
- `resolvePlanPath(cwd, planName?, plansSubdir?)` — Resolve plan file path, auto-detecting most recent by modification time
- `findTask(plan, taskName)` — Find a task by name in parsed plan
- `renderTaskBlock(task, overrides?)` — Render a task back to markdown format
- `replaceTaskInContent(content, task, nextBlock)` — Replace a task block in plan content

## Key Tools

### Canonical Contract Enforcement

#### validate-plan

Validates a plan file against the canonical executable task contract.

- **Input:** Plan file path
- **Output:** Success or violations list (missing required fields, unsupported fields, invalid context tags, duplicate tasks, empty purpose, etc.)
- **Usage:** Before any plan execution; planner runs it before sending plan to review
- **Enforces:** Every task must have Purpose, Acceptance, Steps, Files, Dependencies; valid Context Tags only; proper task sizing; no duplicate titles

#### parse-plan

Parses a plan file into structured JSON.

- **Input:** Plan name (optional, defaults to most recent)
- **Output:** Structured JSON with plan metadata and all tasks
- **Usage:** Orchestrator uses this as source of truth — does NOT scrape raw markdown
- **Key detail:** Accepts optional `plansDir` parameter (defaults to `.opencode/plans`)

### Packet Builders

#### build-developer-task-packet

Builds a structured JSON packet for first-pass developer invocation.

- **Inputs:** `planPath`, `taskName`, `completedTasksJson` (accumulated execution state)
- **Output:** Developer task packet JSON with task data, context gates, dependency summaries
- **Context gate rules:** Architecture/security/decision context only when packet flags require it; backwards-compat only when plan requires it; dependency context only for direct dependencies

#### build-review-packet

Builds a structured JSON packet for code review invocation.

- **Inputs:** `planPath`, `taskName`, `stagedFiles` (exact list), `reviewPass` (counter), optional `previousReviewJson`
- **Output:** Review packet JSON with task data, staged files, review pass number, prior issues for re-review
- **Usage:** First pass uses fresh diff; subsequent passes include normalized prior issues

#### build-retry-packet

Builds a compact structured retry packet from a parsed review result.

- **Input:** `parsedReviewJson` (from parse-review-result)
- **Output:** Retry packet with normalized unresolved issues (severity, title, summary, recommendation)
- **Usage:** When code review finds issues, this packet tells the developer exactly what to fix

#### build-holistic-context-packet

Builds a compressed holistic review packet from plan context plus all completed task execution summaries.

- **Inputs:** `planPath`, `completedTasksJson`
- **Output:** Holistic context packet JSON with compressed task summaries, architecture/decisions context, discoveries, backwards-compat and security sections

### Prompt Renderers

#### render-developer-task-prompt

Converts a developer task packet into the first-pass developer prompt markdown.

- **Input:** `developerTaskPacketJson` (from build-developer-task-packet)
- **Output:** Deterministic markdown prompt for pragmatic-developer
- **Key detail:** Must not fall back to manual assembly if rendering fails — stop as workflow error

#### render-code-review-prompt

Converts a review packet into the code review prompt markdown.

- **Input:** `reviewPacketJson` (from build-review-packet)
- **Output:** Deterministic markdown prompt for pragmatic-code-reviewer
- **Includes:** Staged diff review, re-check of prior issues on subsequent passes, plan awareness context

#### render-developer-retry-prompt

Converts a retry packet plus the original developer task packet into a retry prompt.

- **Inputs:** `retryPacketJson`, `developerTaskPacketJson`
- **Output:** Developer retry prompt with issue checklist, regression-sensitive constraints
- **Instructions:** Fix all issues from current iteration, make incremental fixes on staged changes, don't start from scratch

#### render-developer-qa-fix-prompt

Converts a QA retry packet into a QA fix prompt for the developer.

- **Inputs:** `qaRetryPacketJson`, optional `planPurpose`, optional `relevantFilesJson`
- **Output:** QA fix prompt with issue classification (fixable vs skipped), implementation context
- **Instructions:** Focus on runtime failures (logic errors, missing config, incorrect wiring)

### Result Parsers

#### parse-task-result

Parses the developer's structured result JSON block.

- **Input:** Full developer response text
- **Output:** Parsed status, files_modified, discoveries, summary, scope_verification, error/blocker fields
- **Usage:** Orchestrator uses this to determine next workflow step for each task

#### parse-review-result

Parses the reviewer's structured result JSON block.

- **Input:** Full reviewer response text
- **Output:** Decision (approved/changes_required), highest_severity, summary, normalized issues array
- **Usage:** Orchestrator decides whether to commit or enter retry loop based on the decision

#### parse-qa-result

Parses the QA agent's output into a structured QA retry packet.

- **Input:** Full QA agent output
- **Output:** Structured QA retry packet with fixable_issues, skipped_issues, files_or_areas_implicated
- **Usage:** Feeds into render-developer-qa-fix-prompt for the QA fix flow

### Utility Tools

#### find-plan

Locates the most recent plan file or uses a provided plan name.

- **Input:** Optional `planName`
- **Resolution:** Uses `resolvePlanPath()` from plan-workflow.ts — checks provided name or scans `.opencode/plans/` for most recent `.md` file (excluding README)

#### archive-plan

Moves a plan file to the archive directory with a date timestamp suffix.

- **Input:** `planPath`
- **Output:** Archive file at `.opencode/plans/archive/[name]-[YYYY-MM-DD].md`
- **Usage:** Final step of the implementation workflow

#### extract-commit-metadata

Resolves merged references and commit notes from plan-level and task-level metadata.

- **Inputs:** `planPath`, `taskName` (for task-scoped), `kind` (task/holistic_fix/qa_fix/archive)
- **Output:** Commit metadata (type, scope, subject, body, refs)
- **Usage:** Before each git-commit invocation to get the correct type/scope/subject

#### git-commit

Creates a git commit with conventional format and proper multiline message handling.

- **Inputs:** `type` (feat/fix/docs/style/refactor/test/chore), optional `scope`, `subject` (required), optional `body` and `refs`, optional `noVerify`
- **Usage:** Orchestrator commits directly — no committer agent involved

#### validate-git-state

Checks for uncommitted changes before the implementation workflow begins.

- **Input:** `allowUncommitted` (boolean)
- **Output:** Whether uncommitted changes exist and which files are affected
- **Usage:** Before starting `/pragmatic-implementation`, prompts user to continue if changes found

#### update-plan-task

Safely updates task execution state and annotations within a plan file.

- **Inputs:** `planPath`, `taskName`, `action`, optional `actualFiles`, `notes`, `summary`, `blocker`, `requiredAction`
- **Actions:** `mark_pending`, `mark_in_progress`, `mark_completed`, `annotate_execution`, `annotate_failure`, `annotate_blocked`, `annotate_review_failed`, `annotate_holistic_failed`, `annotate_qa_failed`
- **Usage:** The orchestrator's primary mechanism for tracking task execution state in the plan file

## Integration Points

- **Orchestrator** — Primary consumer of all tools. The orchestrator's step 4 (Implementation Loop) and step 4.8 (holistic review) use every tool category.
- **Planner** — Uses validate-plan after writing plan files, parse-plan for structured data.
- **Agent contracts** — Every structured result format is designed to be consumed by parse-task-result, parse-review-result, or parse-qa-result.
- **Packet-to-renderer pipeline** — Packet builders produce JSON that prompt renderers consume. Never assembled manually.

## Related ADRs

See `../decisions/` for architecture decision records.

## Related Plans

See `../plans/` for implementation plans.
