# Glossary

Standardized definitions for every domain term used across the PrAIgmatic workflow — agents, tools, commands, and reference docs. New contributors and agents should use these definitions to maintain conceptual consistency.

## A

### Acceptance (Acceptance Criteria)
A required field in the canonical executable contract specifying testable conditions that define when a task is done. Must be verifiable (e.g., "All tests pass") rather than vague (e.g., "Code works").
- **Also known as:** Acceptance Criteria, Acceptance Field
- **See also:** Canonical Executable Contract, Task, TDD

### Adaptive Routing (Task-Size-Based Routing)
The orchestrator's logic for determining whether code review runs for a task. Small tasks (1—3 steps) skip code review; Medium/Large tasks always run it. A security override forces code review when security-critical files are touched.
- **Also known as:** Task-Size-Based Routing
- **See also:** Orchestrator, Code Review Loop, Security Override, Task Size

### Agent
A specialized AI actor in the pragmatic workflow with a defined role, contract, and permissions. Each agent has clear input/output contracts and must not exceed its responsibilities. Examples: pragmatic-developer, pragmatic-code-reviewer, pragmatic-explorer.
- **Also known as:** Subagent, Pragmatic Agent
- **See also:** Orchestrator, Developer Contract, Reviewer Contract

### Archive
The final step of the implementation workflow where the completed plan file is moved to the archive directory with a date timestamp using the `archive-plan` tool, followed by an archive commit.
- **See also:** Orchestrator, archive-plan, Plan

### archive-plan
A CLI tool that moves a plan file to the archive directory with a date timestamp suffix. Used as the final step of the implementation workflow. Accepts optional `archiveDir` parameter.
- **See also:** Archive, Orchestrator, Plan

## B

### Backwards Compatibility
An optional plan section that, when set to Required: Yes, triggers mandatory context inclusion in developer and reviewer packets flagging that breaking changes must be identified and mitigated. When absent or not required, breaking changes are acceptable.
- **Also known as:** Backwards Compat, backwards_compat
- **See also:** Context Tags, Context Gate, Plan Template

### Blocked
A developer output format indicating the task cannot proceed without external intervention. Requires a root cause, blocker description, attempts made, and a required_action for the orchestrator.
- **Also known as:** Task Blocked, ⚠️ Task Blocked
- **See also:** Output Format, Root Cause, Structured Result

## C

### Canonical Executable Contract
The required set of fields every executable task must include: Purpose, Acceptance, Steps, Files, and Dependencies. Ensures that every task is both human-readable and machine-executable. Validated by `validate-plan` and parsed by `parse-plan`.
- **Also known as:** Executable Task Contract, Task Contract
- **See also:** Task, Plan, validate-plan, parse-plan

### Checkbox
A markdown checkbox within a plan file that tracks task execution state: `- [ ]` for pending, `- [~]` for in-progress, `- [x]` for completed. Eliminates the need for a separate todo system.
- **Also known as:** Task Checkbox, Status Checkbox, Plan Checkbox
- **See also:** Plan, Task, Execution State, update-plan-task

### Clarification Context
The output of the pragmatic-brainstormer subagent produced when requirements are vague or multiple approaches exist. Contains clarified intent, preferred approach, and success criteria, passed forward to the direction planner.
- **See also:** pragmatic-brainstormer, Stage, Direction

### Code Review Loop
The iterative cycle where the orchestrator sends a developer's output to the pragmatic-code-reviewer, and if issues are found, builds a retry packet and sends the developer back to fix them. Limited to 1 developer fix attempt per task for code review issues (plus 1 re-review verification). Small tasks skip this loop by default.
- **Also known as:** Review-Retry Loop, Code Review Flow
- **See also:** Orchestrator, pragmatic-code-reviewer, pragmatic-developer, Retry Packet, Review Pass

### Commit Metadata
Task-level and plan-level metadata used to construct conventional commit messages. Resolved by `extract-commit-metadata` for task commits, holistic fix commits, QA fix commits, and archive commits. Includes type, scope, subject, body, and refs.
- **Also known as:** Commit Notes, Refs
- **See also:** git-commit, extract-commit-metadata

### Completed
A developer output format indicating the task was implemented exactly as specified. Reports files modified, optional discoveries, scope verification, and summary.
- **Also known as:** Task Completed, ✅ Task Completed
- **See also:** Output Format, Structured Result, Deviated

### Consumes
Optional task metadata listing named outputs or interfaces the task depends on from earlier tasks. When present, triggers inclusion of dependency context when building packets.
- **See also:** Produces, Context Gate, Task

### Context Gate
A conditional rule determining what additional context (architecture, security, backwards compatibility, decisions, dependency summaries) is included in a developer or review packet. Driven by Context Tags, Produces/Consumes metadata, and task sensitivity heuristics.
- **Also known as:** Context Selection Rule, Context Filter
- **See also:** Packet, Context Tags, Produces, Consumes

### Context Tags
Optional metadata labels on a task that override automatic context selection when building packets. Valid values: `architecture`, `security`, `backwards_compat`, `interface`, `integration`.
- **See also:** Task, Context Gate, Packet

## D

### Decision (Review Decision)
The reviewer's binary approval outcome in the structured result: `approved` (no issues above low) or `changes_required` (any medium, high, or critical issues). Directly controls whether the orchestrator proceeds to commit or enters the retry loop.
- **Also known as:** Reviewer Decision
- **See also:** pragmatic-code-reviewer, Issue Classification, Structured Result

### Dependencies
A required field in the canonical executable contract listing tasks that must be completed before the current task can begin. Drives execution ordering and context inclusion when building developer packets.
- **Also known as:** Task Dependencies
- **See also:** Canonical Executable Contract, Task, Context Gate

### Deviated
A developer output format indicating the task was completed but followed an approach different from the planned steps. Reports original vs actual approach, files modified, discoveries, and scope verification.
- **Also known as:** Task Deviated, 🔀 Task Deviated
- **See also:** Output Format, Structured Result, Completed

### Developer Contract
The structured output format the pragmatic-developer must follow: one of four statuses (completed/deviated/failed/blocked), files_modified array, discoveries, summary, scope_verification, and root_cause when relevant. Enables orchestrator to parse results deterministically.
- **See also:** pragmatic-developer, Structured Result, Output Format, parse-task-result

### Developer Task Packet
A structured JSON packet built by `build-developer-task-packet` containing a task's name, purpose, steps, acceptance, files, dependencies, and context gates for the first-pass developer invocation.
- **Also known as:** developer_task_packet
- **See also:** Packet, build-developer-task-packet, render-developer-task-prompt, Context Gate

### Direction
The output of Stage 1 in the Pragmatic Planner v2 workflow. A concise architectural and technical approach document produced by the pragmatic-direction-planner and reviewed by the pragmatic-direction-reviewer before proceeding to detailed planning (Stage 2).
- **Also known as:** Stage 1 Direction, Architectural Direction
- **See also:** Stage, Two-Stage Workflow, pragmatic-direction-planner, pragmatic-direction-reviewer

### Direction Review
The quality review cycle for the Stage 1 Direction output. The pragmatic-direction-reviewer evaluates the direction; one planner revision pass is allowed. If the second review still requires changes, explicit user approval is required.
- **See also:** Direction, pragmatic-direction-reviewer, Two-Stage Workflow

### Discoveries
Insights or learnings produced by the developer during task execution, reported in the structured result. Accumulated by the orchestrator and fed forward to subsequent tasks and holistic review as relevant context.
- **Also known as:** Task Discoveries, Accumulated Discoveries
- **See also:** Execution State, Structured Result, Holistic Review

## E

### Execution State
The orchestrator's in-memory tracking of each completed task's name, files modified, summary, and discoveries. This accumulated data is the source material for building minimal execution packets for subsequent developer, reviewer, retry, and holistic-review invocations.
- **Also known as:** Completed Tasks State, Accumulated State
- **See also:** Orchestrator, Packet, completedTasksJson, Discoveries

### Exploration Context
The output of the pragmatic-explorer subagent containing tech stack, project structure, relevant patterns, integration points, constraints, and unknowns. Passed forward to the direction and planning stages as foundational context.
- **Also known as:** exploration_context
- **See also:** pragmatic-explorer, Stage, Direction

### extract-commit-metadata
A CLI tool that resolves merged references and commit notes from plan-level and task-level metadata. Supports kinds: task, holistic_fix, qa_fix, archive. Used by the orchestrator before each git-commit invocation.
- **See also:** Commit Metadata, git-commit, Orchestrator

## F

### Failed
A developer output format indicating the task could not be completed. Requires a root cause (implementation_error, wrong_steps, missing_context, external_dependency), error description, attempted adaptations, and next steps.
- **Also known as:** Task Failed, ❌ Task Failed
- **See also:** Output Format, Root Cause, Blocked

### Files
A required field in the canonical executable contract listing the primary files expected to be modified during task execution. Developers may modify additional files but must justify deviations.
- **Also known as:** Files to Modify, Target Files
- **See also:** Canonical Executable Contract, Task

### find-plan
A CLI tool that locates the most recent plan file or uses a provided plan name. Uses `context.directory` for base path resolution with an optional `plansDir` parameter (defaults to `.praigmatic/plans`).
- **See also:** Plan, Orchestrator

## G

### git-commit
A custom commit tool that creates commits with conventional format (type/scope/subject) plus optional body, refs, and no-verify. Used by the orchestrator for task, holistic fix, QA fix, and archive commits.
- **See also:** Commit Metadata, extract-commit-metadata, Orchestrator

## H

### Handoff
The final step of the Pragmatic Planner v2 where the planner outputs the plan path, task count, architecture highlights, key decisions, and the command to start implementation (`/pragmatic-implementation`). The planner must not start implementation directly.
- **Also known as:** Plan-to-Implementation Handoff
- **See also:** Pragmatic Planner v2, /pragmatic-implementation

### Holistic Context Packet
A compressed structured JSON packet built by `build-holistic-context-packet` from plan context plus all completed task execution summaries. Used to invoke the final holistic review after all tasks are completed.
- **Also known as:** holistic_context_packet
- **See also:** Packet, build-holistic-context-packet, Holistic Review

### Holistic Improvement Flow
The fix-and-re-review cycle for holistic review issues. Uses the holistic fix template to send the pragmatic-developer holistic fixes, then re-runs the holistic review. Limited to 3 developer fix attempts before proceeding to archive with a failure annotation.
- **Also known as:** Holistic Fix Loop
- **See also:** Holistic Review, Holistic Context Packet

### Holistic Review
A final review step run after all tasks are completed. The pragmatic-code-reviewer evaluates the entire implementation for cross-cutting architectural coherence, integration issues, and consistency across tasks. Supports up to 3 developer fix attempts for holistic issues.
- **Also known as:** Post-Implementation Review, Cross-Task Review
- **See also:** Orchestrator, Holistic Context Packet, Holistic Improvement Flow

## I

### Issue Classification (Review)
The reviewer's severity taxonomy for findings: Critical (security vulnerabilities, data corruption), High (overengineering, poor architecture, plan conflicts), Medium (test gaps, moderate performance), Low (nice-to-have refactoring). Decision is `approved` only when no issues above Low remain.
- **Also known as:** Review Issue Classification, Severity Levels
- **See also:** pragmatic-code-reviewer, Decision, Structured Result

### Issue Classification (QA)
The categorization of QA findings as New (in files modified list) or Preexisting (not in files modified list), with Preexisting issues further classified by effort: Small (1 file), Medium (2 files / moderate), Large (3+ files / significant). Large preexisting issues are skipped.
- **Also known as:** QA Issue Classification
- **See also:** QA Validation Loop, pragmatic-qa

## N

### Normalized Issues
A structured array of reviewer findings in a standardized format (severity, title, summary, recommendation) that is passed into retry packets so both the developer and re-reviewer have an explicit checklist of what needs to be fixed and verified.
- **Also known as:** Normalized Issue List, Normalized Unresolved Issues
- **See also:** Retry Packet, build-retry-packet, parse-review-result

## O

### Orchestrator
The central coordination agent that drives the implementation workflow. It finds plans, validates state, loops through tasks, delegates code changes to pragmatic-developer and reviews to pragmatic-code-reviewer, manages git state, and **never edits code directly**.
- **Also known as:** Pragmatic Implementation Orchestrator, Implementation Orchestrator
- **See also:** /pragmatic-implementation, Packet, Code Review Loop, Holistic Review, QA Validation Loop

### Output Format
The four possible completion statuses returned by the pragmatic-developer: Completed (✅), Deviated (🔀), Failed (❌), or Blocked (⚠️). Each format has specific required fields and a Structured Result JSON block.
- **Also known as:** Developer Output Format, Task Status Formats
- **See also:** Completed, Deviated, Failed, Blocked, Structured Result

### Overengineering Detection
A reviewer responsibility to identify unnecessarily complex patterns. All overengineering issues are HIGH severity by default. Checks for Singleton/Factory/Observer overuse, unnecessary DI containers, excessive layering, caching without measurement, and DTO layers that just copy data.
- **See also:** pragmatic-code-reviewer, Issue Classification (Review)

## P

### Packet
A deterministic, machine-generated structured JSON object built from parsed plan data and accumulated execution state. Each packet type (developer task, review, retry, holistic context, QA retry) feeds into a corresponding prompt renderer to produce the subagent invocation prompt.
- **Also known as:** Context Packet, Structured Packet
- **See also:** build-developer-task-packet, build-review-packet, build-retry-packet, build-holistic-context-packet, Prompt Renderer

### parse-plan
A CLI tool that parses a plan file into structured JSON (task list, metadata, fields) for use as the source of truth during implementation. The orchestrator uses this rather than scraping raw markdown. Accepts optional `plansDir` parameter.
- **See also:** Plan, Orchestrator

### parse-review-result
A CLI tool that parses the pragmatic-code-reviewer's `## Structured Result` JSON block to extract decision, highest_severity, summary, and normalized issues for the orchestrator to decide whether to proceed to commit or enter the retry loop.
- **See also:** Structured Result, Reviewer Contract, Decision

### parse-task-result
A CLI tool that parses the pragmatic-developer's `## Structured Result` JSON block to extract status, files_modified, discoveries, summary, scope_verification, and error/blocker fields for the orchestrator's next workflow decisions.
- **See also:** Structured Result, Developer Contract, Orchestrator

### parse-qa-result
A CLI tool that parses the pragmatic-qa's output into a structured QA retry packet with fixable_issues, skipped_issues, and files_or_areas_implicated. Feeds into `render-developer-qa-fix-prompt` for the QA fix flow.
- **See also:** QA Validation Loop, Structured Result

### Plan
A structured markdown document containing task definitions, execution state, architectural decisions, and testing strategy. Serves as the single source of truth for both human review and agent execution. Stored in the plans directory.
- **Also known as:** Plan File, Planfile, Implementation Plan
- **See also:** Task, Plan Template, Canonical Executable Contract, Checkbox

### Plan Awareness
The reviewer's ability to use plan context to align review findings with the planned architecture, prepare for future tasks without suggesting them prematurely, avoid duplicate work suggestions, detect cross-task inconsistencies, and respect task boundaries.
- **See also:** pragmatic-code-reviewer, Plan, Context Gate

### Plan Review Loop
The automated quality review cycle run by the pragmatic-plan-reviewer after plan creation. Evaluates logic, coherence, task granularity, completeness, and phase decision quality. One planner revision pass is allowed; only Critical/High issues block progression.
- **Also known as:** Plan Review, Plan Quality Review
- **See also:** pragmatic-plan-reviewer, Plan, validate-plan

### Plan Template
The canonical plan file structure prescribed by the pragmatic-planner-v2. Includes sections for Purpose, Metadata, Planning Summary, Tasks, Architecture Overview, Technical Decisions, Backwards Compatibility, Security Considerations, and Testing Strategy.
- **See also:** Plan, pragmatic-planner-v2, Canonical Executable Contract

### Plan-Only Approach
The design principle that the plan file is the single source of truth for both task definitions and execution tracking, eliminating the need for a separate todo system or synchronization between plan and progress tracking tools.
- **Also known as:** Plan-File-Only Approach
- **See also:** Plan, Checkbox, Execution State

### Planning Summary
A table within the plan template that documents each planning stage step (Explore, Clarify, Analyze, Direction, Research, Plan, Review) with its status (Run/Skip), outcome, and rationale for audit trail.
- **See also:** Plan Template, pragmatic-planner-v2, Stage

### pragmatic-planner-v2
The agent responsible for the two-stage planning workflow (Direction → Plan). Spawns subagents and produces an approved executable plan file, then hands off to `/pragmatic-implementation`.
- **See also:** Stage, Direction, Two-Stage Workflow, Handoff

### Pre-Handoff Verification
The third phase of the developer workflow where the developer reviews all modified files against the task scope, performs scope verification, and reports exact changed files in both prose and structured JSON before returning control to the orchestrator.
- **Also known as:** Phase 3: Pre-Handoff Verification
- **See also:** Scope Verification, Structured Result

### Produces
Optional task metadata listing named outputs or interfaces the task creates or changes. Used to drive downstream context for subsequent tasks that Consume these outputs.
- **See also:** Consumes, Context Gate, Task

### Prompt Renderer
A CLI tool that takes a structured JSON packet and produces deterministic markdown prompt text for subagent invocation. Examples: `render-developer-task-prompt`, `render-code-review-prompt`, `render-developer-retry-prompt`, `render-developer-qa-fix-prompt`.
- **Also known as:** Render Tool
- **See also:** Packet, Developer Task Packet, Review Packet, Retry Packet

### Purpose
A required field in the canonical executable contract that describes in one line what the task achieves (the deliverable). Provides the "what" for agent execution and the business justification for human review.
- **Also known as:** Task Purpose
- **See also:** Canonical Executable Contract, Task

## Q

### QA Validation Loop
An optional post-implementation quality assurance step that runs runtime tests against the completed implementation. The pragmatic-qa agent identifies fixable issues (new or small/medium preexisting) and skipped issues (large preexisting). Supports up to 2 developer fix attempts.
- **Also known as:** QA Loop, QA Fix Loop
- **See also:** pragmatic-qa, QA Issue Classification, parse-qa-result

## R

### Regression-Sensitive Constraints
Architecture, compatibility, or security constraints that must be preserved during retry fixes. Included in the developer retry prompt to ensure that fixing review issues does not break previously satisfied constraints.
- **See also:** Retry Packet, Context Gate

### Retry Packet
A compact structured JSON packet built by `build-retry-packet` from a parsed review result, containing normalized unresolved issues (severity, title, summary, recommendation) for the developer to fix during a retry iteration.
- **See also:** Packet, build-retry-packet, render-developer-retry-prompt, Code Review Loop

### Review Packet
A structured JSON packet built by `build-review-packet` containing task data, staged files, review pass number, and optionally a prior review's normalized issues for re-review. Feeds into `render-code-review-prompt`.
- **See also:** Packet, build-review-packet, render-code-review-prompt, Code Review Loop, Review Pass

### Review Pass
A counter tracking how many times the reviewer has reviewed a task's staged changes. First pass uses fresh diff; subsequent passes include normalized prior issues so the reviewer can verify fixes and check for regressions.
- **Also known as:** reviewPass, Review Iteration, Review Count
- **See also:** Code Review Loop, Review Packet, build-review-packet

### Reviewer Contract
The structured output format the pragmatic-code-reviewer must follow: decision (approved/changes_required), highest_severity, summary, and normalized issues array. Decision rules dictate `approved` only when no issues above low remain.
- **See also:** pragmatic-code-reviewer, Structured Result, Decision, Normalized Issues

### Root Cause
The reason a task failed or blocked, categorized as one of: implementation_error, wrong_steps, missing_context, external_dependency, or plan_conflict. Guides the orchestrator on whether to retry, revise the plan, or escalate.
- **See also:** Failed, Blocked, Output Format

## S

### Scope Verification
An advisory check performed by the developer before handoff to ensure changes stay within the current task boundary. Allowed: config, related refactors, utility helpers, obvious bugfixes in touched code. Not allowed: features from future tasks, unjustified architecture changes.
- **See also:** Pre-Handoff Verification, Completed, Deviated, Blocked

### Security Override
An adaptive routing rule that forces code review even for Small tasks when the task touches security-critical files (auth, crypto, middleware, secrets). Ensures security-sensitive changes never bypass the review loop.
- **See also:** Adaptive Routing, Code Review Loop

### Skill Loading
A mandatory first step for both the developer and reviewer agents. They identify the tech stack from the task, attempt to load matching skills via the `skill()` tool, and document which skills loaded or if none were found.
- **Also known as:** Skill Discovery, opencode-skillful
- **See also:** pragmatic-developer, pragmatic-code-reviewer

### Stage
A top-level phase of the Pragmatic Planner v2 workflow. Stage 1 (Direction) produces an approved architectural direction; Stage 2 (Plan) produces a detailed executable plan. Each has its own sub-steps and user approval gate.
- **Also known as:** Workflow Stage
- **See also:** Direction, Plan, Two-Stage Workflow, User Approval

### Steps
A required field in the canonical executable contract listing high-level implementation actions as a numbered bullet list. Provides the "how" guidance for the developer agent without micromanaging exact code.
- **Also known as:** Task Steps, Implementation Steps
- **See also:** Canonical Executable Contract, Task, Task Granularity

### Structured Result
A fenced JSON block in every agent response that provides machine-parseable status, files modified, discoveries, and summary. Required by the developer, reviewer, and QA contracts so the orchestrator can reliably determine next workflow steps.
- **Also known as:** Structured Result Block, Machine-Readable Result, JSON Result Block
- **See also:** Developer Contract, Reviewer Contract, parse-task-result, parse-review-result

## T

### Task
The smallest unit of scheduled work in a plan. Each task has a name, size (Small/Medium/Large), checkbox status, and a canonical executable contract (Purpose, Acceptance, Steps, Files, Dependencies).
- **Also known as:** Executable Task, Plan Task
- **See also:** Plan, Canonical Executable Contract, Task Size, Checkbox

### Task Granularity
The principle of scoping tasks at the correct level of detail: not so high that the agent lacks direction, not so low that it micromanages implementation. The target is 4—6 concrete steps with file references.
- **Also known as:** Right-Level-of-Abstraction
- **See also:** Task Size, Task, Steps

### Task Size
A metadata label on each task classifying its step count and complexity: Small (1—3 steps), Medium (4—8 steps), Large (9—12 steps). Tasks above 15 steps must be split. Directly controls adaptive routing for code reviews.
- **Also known as:** Size, SIZE
- **See also:** Task, Task Granularity, Adaptive Routing

### TDD
Test-Driven Development — writing tests before implementation code. The developer agent classifies each task as TDD_REQUIRED (business logic, APIs, auth, security) or NO_TDD (config, docs, simple utilities) and follows the red-green-refactor cycle when required.
- **Also known as:** Test-Driven Development, TDD Decision
- **See also:** Acceptance, Task

### Technical Decisions
A required plan section documenting each technical choice with its rationale and trade-offs. Provides permanent context for maintainers and reviewers about why specific approaches were chosen.
- **Also known as:** Decision Documentation
- **See also:** Plan Template

### Testing Strategy
A required plan section defining the right mix of unit and integration tests for the overall implementation. Complements per-task Acceptance criteria with a plan-level view of what needs testing and why.
- **See also:** Plan Template, Acceptance, TDD

### Two-Stage Workflow
The planning process used by the Pragmatic Planner v2: Stage 1 produces an approved Direction, Stage 2 produces an approved executable Plan. Each stage requires explicit user approval (with auto-proceed when reviewers approve).
- **Also known as:** Two-Stage Planning, Direction → Plan Workflow
- **See also:** Stage, Direction, Plan, User Approval

## U

### update-plan-task
A CLI tool that safely updates task execution state and annotations within a plan file. Supports actions: mark_pending, mark_in_progress, mark_completed, annotate_execution, annotate_failure, annotate_blocked, annotate_review_failed, annotate_holistic_failed, annotate_qa_failed.
- **See also:** Plan, Checkbox, Execution State, Orchestrator

### User Approval
An explicit checkpoint in the planning and implementation workflow where the user must review and approve the current state before proceeding. Appears at Direction stage, Plan stage, and as a condition for post-implementation QA.
- **Also known as:** Approval Gate, User Approval Gate
- **See also:** Stage, Direction, Plan, Two-Stage Workflow

## V

### validate-plan
A CLI tool that validates a plan file against the canonical executable task contract. Used by the planner before sending the plan to review and by the orchestrator before executing any plan. Invalid plans are halted.
- **See also:** Canonical Executable Contract, Plan

### validate-git-state
A CLI tool that checks for uncommitted changes before the implementation workflow begins. If changes are found, the orchestrator displays affected files and prompts the user for confirmation before proceeding.
- **See also:** Orchestrator

## W

### Workflow Tool Layer
The set of CLI tools (build-*, render-*, parse-*) that produce deterministic packets and prompts from plan data and execution state. The orchestrator must use these tools; manual prompt assembly from broad narrative sections is prohibited.
- **Also known as:** Workflow Tools, Packet Builders
- **See also:** Packet, Prompt Renderer, Orchestrator
