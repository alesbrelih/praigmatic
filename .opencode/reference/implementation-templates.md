# Implementation Templates

Prompt templates for sub-agent invocations used by `pragmatic-implementation`.

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
- Follow existing code style in this repo if it aligns with best practices
- Unify style across the project — match similar patterns
- If project conventions conflict with best practices, follow best practices

## Previous Tasks (Completed)
[Omit section if no completed tasks]
[Older tasks (beyond last 3) — single-line:]
- **Task N: [Name]** — ✅ (N files, one-sentence summary)
[Last 3 completed tasks — full detail:]
- **Task N: [Name]** — ✅
  Files Modified: [actual files]
  Summary: [from developer response]
  Discoveries: [if any]

## Task Steps
[from plan as numbered list]

## Acceptance Criteria
[from plan]

## Files to Modify
[from plan as markdown list]

## Additional Context
[any other relevant info]

### Discoveries from Previous Tasks
[Omit if none. All discoveries from any task, regardless of age.]

## Output Contract
Return the normal human-readable completion message AND a `## Structured Result` section with a fenced `json` block matching the developer contract.
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
**Acceptance:** [from plan]
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
[Architecture Overview from plan]

### Technical Decisions
[Technical Decisions from plan]

# Review Focus
- Alignment with planned architecture
- Support for upcoming tasks, conflicts with future work
- Backwards Compatibility: Flag breaking changes ONLY if "Required: Yes"
- Code Style: Verify code follows existing patterns; flag inconsistencies

Do NOT suggest features planned for upcoming tasks.

**Review pass [review_count]**: If this is not the first pass, verify previous issues were fixed AND check for regressions.

## Output Contract
Return the normal human-readable review AND a `## Structured Result` section with a fenced `json` block matching the reviewer contract.
```

Invoke: `task(agent: "pragmatic-code-reviewer", prompt: "[prompt above]")`

---

## 3. Developer Retry Prompt (Code Review Issues)

```markdown
# Task Execution Request (CODE REVIEW RETRY - Attempt [fix_retry_count] of [max_fix_retries])

## Task Information
**Task Name:** [original task name]
**Purpose:** [original purpose]

## Code Review Feedback
**Status:** Latest code review found critical/high/medium issues that must be fixed.

[Paste ENTIRE output from the LATEST code-reviewer run]

## Previous Implementation Context
[original task steps, files, context, architecture, decisions, backwards compatibility, security]

## Instructions
1. Review the LATEST code review feedback
2. Fix all critical AND high AND medium issues from THIS iteration
3. Make incremental fixes on staged changes (DO NOT start from scratch)
4. Ensure fixes don't break existing functionality or introduce regressions
5. Follow code style — match existing patterns
6. Return completion status with ✅, ❌, or ⚠️
7. Include the `## Structured Result` JSON block required by the developer contract
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

# Completed Tasks
[For each task:]
N. **Task N:** [Name] - ✅ | Files: [actual files] | Summary: [developer's summary] | Discoveries: [if any]

# Architecture & Decisions
[Architecture Overview + Technical Decisions from plan]

# Backwards Compatibility
[from plan — Required: Yes/No, Rationale, Impact]

# Accumulated Discoveries
[all discoveries consolidated]

# Implementation Context
[commits from git log]

# Review Focus
- Consistency across all completed tasks
- Architecture coherence with plan
- Integration issues between tasks
- Overall quality, security, maintainability
- Backwards Compatibility: Flag breaking changes ONLY if "Required: Yes"
- Code Style: Verify consistent style across tasks

**Note:** Only review completed work. Do not suggest features from future tasks.
```

Invoke: `task(agent: "pragmatic-code-reviewer", prompt: "[prompt above]")`

For re-reviews after holistic fixes: Update `# Implementation Context` with fresh git log. Prepend to `# Review Focus`: "This is iteration [N]. Verify previous issues were resolved AND check for regressions."

---

## 5. Holistic Developer Retry Prompt

```markdown
# Holistic Review Improvement Request (Attempt [holistic_retry_count] of [max_holistic_retries])

## Plan Information
**Plan Name:** [from plan]
**Plan Purpose:** [from plan]
**Tasks Completed:** [count]

## Holistic Review Feedback
**Status:** Latest holistic review found critical/high/medium issues.

[Paste ENTIRE output from the LATEST holistic code-reviewer run]

## Implementation Context
[relevant commits from git log]
[task list from plan]
[backwards compatibility from plan]

## Instructions
1. Review the LATEST holistic review feedback
2. Fix cross-cutting architectural, integration, or security issues
3. Make incremental changes (DO NOT start from scratch)
4. Ensure fixes don't break functionality from completed tasks
5. Follow code style
6. Return completion status with ✅, ❌, or ⚠️
7. Include the `## Structured Result` JSON block required by the developer contract
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`

---

## 6. QA Validation Prompt

```markdown
# QA Validation Request

## What Was Built
**Purpose:** [from plan purpose]

## Completed Tasks
[For each completed task:]
- **[Task Name]:** [developer's summary] | Files: [actual files]

## Expected Behaviors
[Extract testable behaviors from plan tasks and acceptance criteria. Be specific.]
- [e.g., "POST /api/users creates a new user and returns 201"]
- [e.g., "Invalid email returns 400 with validation error"]

## Files Modified
[All files changed across all tasks]
- `path/to/file1`
- `path/to/file2`

## Issue Classification
For each issue: **Type:** New (in Files Modified list) or Preexisting (NOT in Files Modified list). **Effort** (Preexisting only): Small (1 file), Medium (2 files/moderate), Large (3+ files/significant).
```

Invoke: `task(agent: "pragmatic-qa", prompt: "[prompt above]")`

---

## 7. Developer QA Fix Prompt

```markdown
# Task Execution Request (QA FIX - Attempt [qa_retry_count] of [max_qa_retries])

## Task Information
**Task Name:** QA Issue Fix
**Purpose:** Fix runtime issues discovered during QA validation

## QA Feedback
**Status:** QA validation found issues that must be fixed.

[Paste ENTIRE output from the LATEST pragmatic-qa run]

## Implementation Context
**Plan Purpose:** [from plan]
**Files Modified During Implementation:** [full file list across all tasks]

## Instructions
1. Analyze QA feedback — focus on concrete failures (test failures, HTTP errors, startup crashes)
2. Read failing code paths to understand root cause
3. Fix ALL `New` issues
4. Fix `Preexisting` issues that are `Small` or `Medium` effort — do NOT skip easy wins
5. DO NOT fix `Preexisting` issues marked `Large` — report as skipped
6. Make incremental fixes (DO NOT start from scratch)
7. Follow code style
8. Run relevant tests locally to verify fixes
9. Return completion status with ✅, ❌, or ⚠️ and include resolution summary:
    - Issues fixed: [list]
    - Issues skipped (Large Preexisting): [list]
10. Include the `## Structured Result` JSON block required by the developer contract

**Key:** These are RUNTIME failures, not static analysis. Focus on logic errors, missing config, incorrect wiring, integration issues.
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[prompt above]")`
