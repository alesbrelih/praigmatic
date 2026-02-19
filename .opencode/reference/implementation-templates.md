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

### Planning Context
[from plan's "## Planning Context" section, if present]

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
**Status:** Latest code review found critical OR high issues that must be fixed.
**Source:** Fresh review of currently staged changes (Iteration [retry_count])

[Paste ENTIRE output from the LATEST code-reviewer run - NOT from first review]

## Previous Implementation Context
[original task steps, files, context, architecture, decisions, backwards compatibility, security]

## Instructions
1. Review the LATEST code review feedback (this is fresh feedback from your most recent changes)
2. Fix all critical AND high priority issues identified in THIS iteration
3. Make incremental fixes on staged changes (DO NOT start from scratch)
4. Ensure fixes don't break existing functionality or introduce regressions
5. Stage additional changes
6. Return completion status with ✅, ❌, or ⚠️

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

**Note:** Only review completed work. Do not suggest features planned for future tasks.
```

Invoke: `task(agent: "pragmatic-code-reviewer", prompt: "[prompt above]")`

For re-reviews after holistic fixes, use same template but update `# Implementation Context` with fresh `git log` and prepend to `# Review Focus`: "This is iteration [N]. Review ALL current code - verify previous critical AND high issues were resolved AND check for any new issues or regressions introduced by fixes."

---

## 5. Holistic Developer Retry Prompt

```markdown
# Holistic Review Improvement Request (Attempt [holistic_retry_count] of [max_holistic_retries])

## Plan Information
**Plan Name:** [from plan]
**Plan Purpose:** [from plan]
**Tasks Completed:** [count]

## Holistic Review Feedback
**Status:** Latest holistic review found critical OR high issues that must be fixed.
**Source:** Fresh review of all completed work (Iteration [holistic_retry_count])

[Paste ENTIRE output from the LATEST holistic code-reviewer run - NOT from first review]

## Implementation Context
[relevant commits from git log]
[task list from plan]
[backwards compatibility section from plan]

**Note:** Changes may span multiple tasks and files.

## Instructions
1. Review the LATEST holistic review feedback for critical AND high issues (this is fresh feedback from your most recent changes)
2. Fix cross-cutting architectural, integration, or security issues identified in THIS iteration
3. Make incremental changes (DO NOT start from scratch)
4. Ensure fixes don't break functionality from completed tasks or introduce regressions
5. Stage additional changes
6. Return completion status with ✅, ❌, or ⚠️

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
