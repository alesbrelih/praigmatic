# Implementation Templates

Prompt templates for sub-agent invocations used by `pragmatic-implementation`.

---

## 1. Developer Task Prompt

Produced by: `render-developer-task-prompt(developerTaskPacketJson)`

```markdown
# Task Execution Request

## Developer Task Packet
**Task Name:** [from packet]
**Purpose:** [from packet]
**Dependencies:** [direct dependencies only]

## Core Task Data
### Task Steps
[from packet as numbered list]

### Acceptance Criteria
[from packet]

### Files to Modify
[from packet as markdown list]

### Code Style Requirements
- Follow existing code style in this repo if it aligns with best practices
- Unify style across the project — match similar patterns
- If project conventions conflict with best practices, follow best practices

## Optional Packet Context
### Dependency Context
[Omit if none. Direct dependency summaries only.]

### Other Completed Work
[Omit if none. At most one compact summary line.]

### Relevant Discoveries
[Omit if none. Include only discoveries selected for this task.]

### Architecture Constraints
[Omit unless packet requires architecture context.]

### Decision Constraints
[Omit unless packet requires decision context.]

### Backwards Compatibility Constraints
[Include ONLY if plan has Backwards Compatibility section with Required: Yes. If absent, breaking changes are acceptable.]

### Security Constraints
[Omit unless packet requires security context.]

## Output Contract
Return the normal human-readable completion message AND a `## Structured Result` section with a fenced `json` block matching the developer contract. Handle this task only; do not stage, commit, or orchestrate follow-up steps.
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[rendered prompt]")`

---

## 2. Code Review Prompt

Produced by: `render-code-review-prompt(reviewPacketJson)`

```markdown
[SUBAGENT] Review the orchestrator-provided staged diff and review packet for: [Task Name].

# Review Packet
**Task Name:** [from packet]
**Purpose:** [from packet]
**Steps:** [from packet as numbered list]
**Acceptance:** [from packet]
**Files Modified:** [staged files list]
**Review Pass:** [review_count]

## Issues To Re-check
[Omit on first pass. On re-review, include only the normalized prior issues the reviewer should verify as fixed.]
**Previous Review Summary:** [from packet, if present]
- **[Severity] [Title]**: [summary]
  Recommendation: [recommendation]

## Task Relationships
- This task depends on: [list]
- Tasks that depend on this: [list]

## Additional Plan Context (only if relevant)
### Upcoming Tasks
[Omit unless packet includes relevant downstream tasks.]

### Architecture Constraints
[Omit unless packet includes architecture context.]

### Decision Constraints
[Omit unless packet includes decision context.]

### Backwards Compatibility Constraints
[Include ONLY if plan has Backwards Compatibility section with Required: Yes. If absent, breaking changes are acceptable.]

### Security Constraints
[Omit unless packet includes security context.]

# Review Focus
- Alignment with planned architecture
- Support for upcoming tasks, conflicts with future work
- Backwards Compatibility: Flag breaking changes ONLY if plan has Backwards Compatibility section with Required: Yes. If absent, breaking changes are acceptable.
- Code Style: Verify code follows existing patterns; flag inconsistencies

Do NOT suggest features planned for upcoming tasks.

**Review pass [review_count]**: If this is not the first pass, verify previous issues were fixed AND check for regressions.

## Output Contract
Return the normal human-readable review AND a `## Structured Result` section with a fenced `json` block matching the reviewer contract. This is advisory only; do not modify files or direct workflow state changes.
```

Invoke: `task(agent: "pragmatic-code-reviewer", prompt: "[rendered prompt]")`

---

## 3. Developer Retry Prompt (Code Review Issues)

Produced by: `render-developer-retry-prompt(retryPacketJson, developerTaskPacketJson)`

```markdown
# Task Execution Request (CODE REVIEW RETRY - Attempt [fix_retry_count] of [max_fix_retries])

## Retry Issue Packet
**Task Name:** [original task name]
**Purpose:** [original purpose]
**Highest Severity:** [from retry packet]
**Summary:** [from retry packet]

## Unresolved Issues
[Normalized unresolved issue list from retry packet]
- **[Severity] [Title]**: [summary]
  Recommendation: [recommendation]

## Current Task Packet
[Compact developer_task_packet content for the same task]

## Regression-Sensitive Constraints
[Omit if none. Include only architecture, compatibility, or security constraints that must still hold.]

## Instructions
1. Review the retry issue packet only
2. Fix all critical AND high AND medium issues from THIS iteration
3. Make incremental fixes on staged changes (DO NOT start from scratch)
4. Ensure fixes don't break existing functionality or introduce regressions
5. Follow code style — match existing patterns
6. Return completion status with ✅, ❌, or ⚠️
7. Include the `## Structured Result` JSON block required by the developer contract
```

Invoke: `task(agent: "pragmatic-developer", prompt: "[rendered prompt]")`

---

## 4. Holistic Review Prompt

```markdown
[SUBAGENT] Perform holistic review of entire functionality.

## Holistic Context Packet
**Plan Name:** [from packet]
**Plan Purpose:** [from packet]
**Total Tasks:** [number]
**All Tasks Completed:** [Yes/No]

## Completed Tasks
[Compressed completed task summaries]
N. **Task N:** [Name] - ✅ | Files: [actual files] | Summary: [developer's summary] | Discoveries: [if any]

## Compact Plan Context
[Compact architecture + decisions summary]

### Backwards Compatibility
[Include ONLY if plan has Backwards Compatibility section with Required: Yes]

### Security Considerations
[Include if relevant]

### Testing Strategy
[Include if relevant]

## Accumulated Discoveries
[all discoveries consolidated]

## Implementation Context
[commits from git log]

# Review Focus
- Consistency across all completed tasks
- Architecture coherence with plan
- Integration issues between tasks
- Overall quality, security, maintainability
- Backwards Compatibility: Flag breaking changes ONLY if plan has Backwards Compatibility section with Required: Yes. If absent, breaking changes are acceptable.
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
**Highest Severity:** [from retry packet]
**Summary:** [from retry packet]

## Unresolved Issues
[Normalized unresolved issue list from retry packet]

## Implementation Context
[relevant commits from git log]
[compact holistic context packet]

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
# QA Validation Request (OPT-IN POST-IMPLEMENTATION)

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

Produced by: `render-developer-qa-fix-prompt(qaRetryPacketJson, planPurpose?, relevantFilesJson?)`

```markdown
# Task Execution Request (QA FIX - Attempt [qa_retry_count] of [max_qa_retries])

## Task Information
**Task Name:** QA Issue Fix
**Purpose:** Fix runtime issues discovered during QA validation

## QA Feedback
**Status:** QA validation found issues that must be fixed.

## QA Issue Packet
[Structured packet from `parse-qa-result(output)`]
**Status:** [from packet status]
**Summary:** [from packet summary]
- `fixable_issues`: [normalized runtime issues the developer should address]
- `skipped_issues`: [large preexisting issues left untouched]
- `files_or_areas_implicated`: [relevant files or integration areas, when available]

## Implementation Context
**Plan Purpose:** [from plan]
**Files Modified During Implementation:** [relevant file list for the QA failures]

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

Invoke: `task(agent: "pragmatic-developer", prompt: "[rendered prompt]")`
