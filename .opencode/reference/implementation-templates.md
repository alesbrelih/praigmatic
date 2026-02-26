# Implementation Templates

Prompt templates for sub-agent invocations used by `pragmatic-implementation`. Read on-demand by the orchestrator — not injected into context by default.

---

## 1. Developer Task Prompt

```markdown
# Task Execution Request

## Task Information
**Task Name:** [from plan]
**Purpose:** [from plan]

## Context
### Architecture
[relevant parts from plan]

### Decisions
[relevant parts from plan]

### Backwards Compatibility
[from plan — Required: Yes/No, Rationale, Impact]

### Security Considerations
[if applicable]

### Code Style Requirements
- **Follow existing code style** in this repository only if it aligns with best practices
- **Unify style across the project** — if similar patterns exist elsewhere, match them
- If project conventions conflict with best practices, **follow best practices**
- Do NOT introduce new conventions without explicit approval

## Previous Tasks (Completed)
[Omit section if no completed tasks]
[Older tasks (beyond last 3) — single-line format:]
- **Task N: [Name]** — ✅ (N files, one-sentence summary)
[Last 3 completed tasks — full detail:]
- **Task N: [Name]** — ✅
  Files Modified: [actual files]
  Summary: [from developer response]
  Discoveries: [if any]

## Task Steps
[from plan as numbered list]

## Files to Modify
[from plan as markdown list]

## Additional Context
[any other relevant info]

### Discoveries from Previous Tasks
[Omit if none. All discoveries from any task, regardless of age.]
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`

---

## 2. Code Review Prompt

```markdown
[SUBAGENT] Review STAGED changes for: [Task Name].

# Current Task
**Task Name:** [Task Name]
**Purpose:** [from plan]
**Steps:** [from plan as numbered list]
**Files Modified:** [staged files list]

# Task Context
### Architecture
[relevant parts from plan]
### Decisions
[relevant parts from plan]
### Backwards Compatibility
[from plan — Required: Yes/No, Rationale, Impact]
### Security Considerations
[if applicable]

# Full Plan Context
**Total Tasks:** [number]
**Completed Tasks:** [number]
**Current Task:** [task name]

### Upcoming Tasks
[list remaining tasks with name and purpose]

### Task Dependencies
- This task depends on: [list]
- Tasks that depend on this: [list]

### Overall Architecture
[Architecture Overview section from plan]

### Technical Decisions
[Technical Decisions section from plan]

# Review Instructions
Review ALL currently staged code with full plan context. Consider:
- Alignment with planned architecture
- Support for upcoming tasks
- Conflicts with future work
- **Backwards Compatibility**: Flag breaking changes ONLY if "Required: Yes". If "Required: No", breaking changes are acceptable.
- **Code Style**: Verify code follows existing patterns in this repo ONLY if they align with best practices. Flag inconsistencies that violate project conventions or introduce conflicting styles.

Do NOT suggest features planned for upcoming tasks.

**Iteration [retry_count] of [max_retries]**: If this is a retry, verify previous issues were fixed AND check for new issues or regressions introduced by fixes. Provide fresh, complete feedback on current code state.
```

Invoke: `task(agent: "pragmatic-code-reviewer", prompt: "[prompt above]")`

---

## 3. Developer Retry Prompt (Code Review Issues)

```markdown
# Task Execution Request (CODE REVIEW RETRY - Attempt [retry_count] of [max_retries])

## Task Information
**Task Name:** [original task name]
**Purpose:** [original purpose]

## Code Review Feedback
**Status:** Latest code review found critical OR high OR medium issues that must be fixed.
**Source:** Fresh review of currently staged changes (Iteration [retry_count])

[Paste ENTIRE output from the LATEST code-reviewer run - NOT from first review]

## Previous Implementation Context
[original task steps, files, context, architecture, decisions, backwards compatibility, security]

## Instructions
1. Review the LATEST code review feedback (this is fresh feedback from your most recent changes)
2. Fix all critical AND high AND medium priority issues identified in THIS iteration
3. Make incremental fixes on staged changes (DO NOT start from scratch)
4. Ensure fixes don't break existing functionality or introduce regressions
5. **Follow code style** — match existing patterns in this repo only if they align with best practices
6. Stage additional changes
7. Return completion status with ✅, ❌, or ⚠️

**Note:** Each retry triggers a new code review. You are fixing issues from the CURRENT review, not replaying the original feedback.
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`

---

## 4. Holistic Review Prompt

```markdown
[SUBAGENT] Perform holistic review of entire functionality.

# Plan Overview
**Plan Name:** [from plan]
**Plan Purpose:** [from plan]
**Total Tasks:** [number]
**All Tasks Completed:** [Yes/No]

# Completed Tasks (with Implementation Details)
[For each completed task:]
N. **Task N:** [Name] - Status: ✅
   - Files Modified: [actual files]
   - Summary: [developer's summary]
   - Discoveries: [if any]

# Architecture & Decisions
[Architecture Overview + Technical Decisions from plan]

# Backwards Compatibility
[from plan — Required: Yes/No, Rationale, Impact]

# Planning Context
[from plan's "## Planning Context" section, if present]

# Accumulated Discoveries
[all discoveries consolidated]

# Implementation Context
[commits from git log]

# Review Focus
- Consistency across all completed tasks
- Architecture coherence with plan
- Integration issues between tasks
- Overall quality, security, maintainability
- Whether discoveries were properly handled
- **Backwards Compatibility**: Flag breaking changes ONLY if "Required: Yes"
- **Code Style**: Verify consistent code style across all tasks — flag deviations that conflict with project conventions or introduce inconsistent patterns

**Note:** Only review completed work. Do not suggest features planned for future tasks.
```

Invoke: `task(agent: "pragmatic-code-reviewer", prompt: "[prompt above]")`

For re-reviews after holistic fixes, use same template but update `# Implementation Context` with fresh `git log` and prepend to `# Review Focus`: "This is iteration [N]. Review ALL current code - verify previous critical AND high AND medium issues were resolved AND check for any new issues or regressions introduced by fixes."

---

## 5. Holistic Developer Retry Prompt

```markdown
# Holistic Review Improvement Request (Attempt [holistic_retry_count] of [max_holistic_retries])

## Plan Information
**Plan Name:** [from plan]
**Plan Purpose:** [from plan]
**Tasks Completed:** [count]

## Holistic Review Feedback
**Status:** Latest holistic review found critical OR high OR medium issues that must be fixed.
**Source:** Fresh review of all completed work (Iteration [holistic_retry_count])

[Paste ENTIRE output from the LATEST holistic code-reviewer run - NOT from first review]

## Implementation Context
[relevant commits from git log]
[task list from plan]
[backwards compatibility section from plan]

**Note:** Changes may span multiple tasks and files.

## Instructions
1. Review the LATEST holistic review feedback for critical AND high AND medium issues (this is fresh feedback from your most recent changes)
2. Fix cross-cutting architectural, integration, or security issues identified in THIS iteration
3. Make incremental changes (DO NOT start from scratch)
4. Ensure fixes don't break functionality from completed tasks or introduce regressions
5. **Follow code style** — match existing patterns in this repo only if they align with best practices
6. Stage additional changes
7. Return completion status with ✅, ❌, or ⚠️

**Note:** Each retry triggers a new holistic review. You are fixing issues from the CURRENT review, not replaying the original feedback.
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`

---

## 6. Committer Prompts

### Task Commit
```
[SUBAGENT] Commit staged changes.

## Task Context
**Task Name:** [Task Name]
**Purpose:** [from plan task]

## Plan Context
**Plan Name:** [from plan]

## Commit Metadata
**Files:** [file list]
**References:** [Plan-level References + Task-level Refs, if any]
**Commit Notes:** [Task-level Commit Notes, if any]
```

### Holistic Fix Commit
```
[SUBAGENT] Commit staged changes.

## Holistic Fix Context
**Plan Name:** [Plan Name]
**Fix Type:** Holistic review issues
**Iterations:** [holistic_retry_count] of [max_holistic_retries]

## Commit Metadata
**Files:** [file list]
**References:** [Plan-level References, if any]
```

### Archive Commit
```
[SUBAGENT] Commit staged changes.

## Archive Context
**Plan Name:** [Name]
**Action:** Plan completed and archived

## Commit Metadata
**Files:** [plan path, archive path]
**References:** [Plan-level References, if any]
```

Invoke all committer prompts with: `task(agent: "pragmatic-committer", prompt: "[prompt above]")`

---

## 7. QA Validation Prompt

```markdown
# QA Validation Request

## What Was Built
**Purpose:** [from plan purpose]

## Completed Tasks
[For each completed task:]
- **[Task Name]:** [developer's summary]
  - Files: [actual files modified]

## Expected Behaviors
[Extract testable behaviors from plan tasks and acceptance criteria. Be specific:]
- [e.g., "POST /api/users creates a new user and returns 201"]
- [e.g., "Invalid email returns 400 with validation error"]
- [e.g., "App starts without errors"]
- [e.g., "CLI command `foo --bar` outputs expected format"]

## Files Modified
[All files changed across all tasks]
- `path/to/file1`
- `path/to/file2`
```

Invoke: `task(agent: "pragmatic-qa", prompt: "[prompt above]")`

---

## 8. Developer QA Fix Prompt

```markdown
# Task Execution Request (QA FIX - Attempt [qa_retry_count] of [max_qa_retries])

## Task Information
**Task Name:** QA Issue Fix
**Purpose:** Fix runtime issues discovered during QA validation

## QA Feedback
**Status:** QA validation found issues that must be fixed.
**Source:** Runtime validation of implemented features (Iteration [qa_retry_count])

[Paste ENTIRE output from the LATEST pragmatic-qa run]

## Implementation Context
**Plan Purpose:** [from plan]
**Files Modified During Implementation:**
[full file list across all tasks]

## Instructions
1. Analyze QA feedback — focus on concrete failures (test failures, HTTP errors, startup crashes, wrong behavior)
2. Read the failing code paths to understand root cause
3. Fix all issues identified in THIS QA iteration
4. Make incremental fixes (DO NOT start from scratch)
5. **Follow code style** — match existing patterns in this repo only if they align with best practices
6. Run relevant tests locally to verify fixes before staging
7. Stage changes
8. Return completion status with ✅, ❌, or ⚠️

**Key difference from code review fixes:** These are RUNTIME failures, not static analysis. The code compiles and passes review but doesn't behave correctly. Focus on logic errors, missing configuration, incorrect wiring, and integration issues.

**Note:** Each retry triggers a new QA validation. You are fixing issues from the CURRENT QA run, not replaying the original feedback.
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`
