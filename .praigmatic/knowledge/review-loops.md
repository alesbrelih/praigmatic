# Review Loops

## Overview

The PrAIgmatic workflow includes five distinct review loops, each targeting a different stage of the workflow. They form a layered quality assurance system: catching overengineering at the direction stage, plan quality before implementation begins, code correctness per-task, cross-cutting consistency after all tasks, and runtime validation as an optional final gate. Each loop has bounded retry limits and clear routing rules.

## Architecture / Key Concepts

### Retry Caps

Every review loop has a fixed maximum number of developer fix attempts. This prevents infinite loops while still allowing genuine improvement. After the cap is reached, the workflow proceeds with the best available state and annotates the plan with the failure.

### Adaptive Routing

The orchestrator sizes each task (Small/Medium/Large) and uses this to determine whether code review runs. Small tasks (1-3 steps) skip code review by default. Medium and Large tasks always run it. A security override forces code review regardless of size.

### Structured Result Contracts

Every review agent returns a `## Structured Result` JSON block with `decision` (approved/changes_required), `highest_severity`, `summary`, and `issues` (normalized array). The orchestrator parses this deterministically via `parse-review-result` to decide the next workflow step.

### Severity Taxonomy

| Level | Meaning (Code Review) | Meaning (Direction/Plan Review) |
|-------|----------------------|--------------------------------|
| Critical | Security vulns, data corruption | Plan must split, circular deps |
| High | Overengineering, architecture issues | Tasks too large, anti-patterns |
| Medium | Test gaps, moderate issues | Suboptimal but valid |
| Low | Nice-to-have refactoring | Suggestions |

Decision rules: `approved` only when no issues above Low remain (Code Review) or no issues above Medium remain (Direction Review) or no High/Critical (Plan Review).

## Key Flows

### 1. Direction Review Loop

**When:** Stage 1 of planning, after the direction planner produces a direction document.

**Purpose:** Prevent overengineering at the root — before tasks exist. The pragmatic-direction-reviewer challenges proposals for YAGNI, KISS, and scale appropriateness.

**Process:**
1. `pragmatic-direction-reviewer` evaluates the direction against focus areas (YAGNI, KISS, scale, scope, technology choices, abstraction levels)
2. If `approved` → auto-proceed to Stage 2
3. If `changes_required` → planner revises direction once, then re-reviews
4. If second review still returns `changes_required` → require explicit user approval

**Retry cap:** 1 planner revision pass. No developer fix attempts (no code exists yet).

### 2. Plan Review Loop

**When:** Stage 2 of planning, after the plan file is written.

**Purpose:** Ensure plan quality — correct task granularity, proper scope, logical sequencing, and completeness. Primary focus (60% weight) on task size optimization and detecting when plans should be split.

**Process:**
1. `pragmatic-plan-reviewer` evaluates plan scope, task granularity, anti-patterns, logic, completeness, and alignment with prior decisions
2. If `approved` → proceed to user approval
3. If `changes_required` → planner revises plan once, re-validates, then re-reviews
4. If second review still returns `changes_required` → proceed to user approval with warning

**Retry cap:** 1 planner revision pass.

**Anti-patterns detected:**
- Dependency-only tasks (e.g., `go mod tidy` as standalone)
- File-creation-only tasks
- Import-only tasks
- Tasks with 13-15 steps (HIGH) or >15 steps (CRITICAL — must split)

### 3. Code Review Loop (Per-Task)

**When:** After each Medium or Large task is implemented and staged. Small tasks skip by default.

**Purpose:** Verify staged changes against the task's purpose, acceptance criteria, plan architecture, and quality standards. Self-correcting — the developer fixes issues and the reviewer re-checks.

**Process:**
1. Build review packet with `build-review-packet` and render with `render-code-review-prompt`
2. `pragmatic-code-reviewer` reviews staged diff against task context and plan
3. If `approved` or no issues above Low → proceed to commit
4. If issues found → build retry packet with `build-retry-packet`, render developer retry prompt, send to `pragmatic-developer`
5. Developer fixes issues, stages changes
6. Re-run reviewer with prior-issue checklist
7. If issues remain after fix attempt → stop as review failure, annotate plan

**Retry cap:** 1 developer fix attempt (2 review passes total: initial + re-review).

**Adaptive routing:**
- **Small tasks (1-3 steps):** Skip code review. Developer self-reviewed.
- **Medium/Large tasks:** Always run code review.
- **Security override:** Force code review if task touches auth, crypto, middleware, or secrets — regardless of size.

**Review dimensions (weighted):**
- Security (30%)
- Maintainability (25%)
- Overengineering detection (20%)
- Testing (15%)
- Performance (10%)

**Plan awareness:** The reviewer receives plan context to align findings with architecture, prepare for future tasks without suggesting them prematurely, respect task boundaries, and detect cross-task inconsistencies.

### 4. Holistic Review Loop

**When:** After ALL tasks in a plan are completed. Only runs if the plan has >1 task, requires backwards compatibility, or touches security-sensitive code.

**Purpose:** Cross-cutting review of the entire implementation — architectural coherence, integration between tasks, consistency across the codebase, overall quality.

**Process:**
1. Build holistic context packet with `build-holistic-context-packet`
2. `pragmatic-code-reviewer` reviews all completed work with accumulated context
3. If no Critical/High/Medium issues → proceed to archive
4. If issues found → build retry packet, send to developer with holistic fix instructions
5. Developer fixes, stages changes
6. Re-run holistic review
7. Repeat for up to 3 developer fix attempts
8. If issues remain after 3 attempts → annotate plan, proceed to archive with notes

**Retry cap:** 3 developer fix attempts (more generous than per-task because issues are cross-cutting and may require multiple passes).

### 5. QA Validation Loop

**When:** Optional — only runs if explicitly requested via `--qa` flag or if the plan has a `## QA Required` section.

**Purpose:** Runtime validation that implemented features actually work. Complements static code review with empirical testing.

**Process:**
1. `pragmatic-qa` runs test suites, starts the app, executes runtime validation
2. If all pass → proceed to archive
3. If issues found → classify as New or Preexisting, classify Preexisting effort (Small/Medium/Large)
4. Parse QA output with `parse-qa-result` to produce structured issue packet
5. Render QA fix prompt with `render-developer-qa-fix-prompt`, send to developer
6. Developer fixes fixable issues (New + Small/Medium Preexisting), skips Large Preexisting
7. Re-run QA
8. Repeat for up to 2 developer fix attempts
9. If issues remain after 2 attempts → annotate plan, proceed to archive with notes

**Issue classification:**
- **New:** In the files modified list — must be fixed
- **Preexisting (Small):** 1 file fix — fix
- **Preexisting (Medium):** 2 files / moderate effort — fix
- **Preexisting (Large):** 3+ files / significant effort — skip

**Retry cap:** 2 developer fix attempts.

## Integration Points

- **Orchestrator** (`/pragmatic-implementation`): Routes each task through the appropriate review loop
- **Tool ecosystem**: `build-review-packet`, `build-retry-packet`, `build-holistic-context-packet`, `parse-review-result`, `parse-qa-result`, `render-code-review-prompt`, `render-developer-retry-prompt`, `render-developer-qa-fix-prompt`
- **Plan annotations**: Failed/skipped review loops are recorded in the plan file via `update-plan-task`
- **Execution state**: Accumulated discoveries from completed tasks feed the holistic review

## Related ADRs

See `../decisions/` for architecture decision records.

## Related Plans

See `../plans/` for implementation plans.
