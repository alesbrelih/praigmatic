# Implementation Plans

This directory contains detailed implementation plans created by the pragmatic-planner agent.

## Workflow

### Creating Plans

1. **Planner creates plan file**: When you use `@pragmatic-planner` to plan a feature, it creates a plan file here with:
   - Task checklist (markdown format with checkboxes)
   - Architecture overview
   - Technical decisions and rationale
   - Security considerations
   - Testing strategy
   - Risk points and mitigations

2. **Plan file naming**: Plans use kebab-case naming (e.g., `add-oauth-authentication.md`)

3. **Automated plan review**: Before the plan is presented to you, it goes through an automated quality review loop:
   - **What the review checks**:
     - **Logic & Coherence**: Task dependencies are correct, sequencing makes sense, no circular dependencies
     - **Simplicity vs Overengineering**: Appropriate scope, no unnecessary complexity, no redundant tasks
     - **Task Granularity**: 80%+ tasks are Small/Medium size, clear boundaries, not too large or micromanaged
     - **Completeness**: All necessary tasks included, integration points identified, testing strategy defined, security considerations addressed
     - **Phase Decisions Quality**: All phases documented with rationale, optional phases justified
   - **Retry mechanism**: The planner can attempt up to 3 revisions (initial + 2 fixes) to address Critical or High severity issues
   - **User feedback flow**: After review passes (no Critical/High issues), you review and approve the plan; if max retries reached with issues, you see the plan with a warning
   - **Result**: You only see high-quality plans that have passed automated quality checks

### Implementing Plans

1. **Use the `/pragmatic-implementation` command**: This command reads the plan file and starts implementation (plan checkboxes track progress)
   - It validates the plan format before execution
   - It uses structured plan parsing instead of ad hoc markdown scraping

2. **Progress tracking**: As tasks complete, the plan file checkboxes are updated:
   - `- [ ]` = Pending task
   - `- [~]` = In-progress task
   - `- [x]` = Completed task

### After Implementation

When all tasks are completed, the plan file is archived to `./archive/` with a timestamp:
```
archive/add-oauth-authentication-2026-01-18.md
```

This creates an audit trail of what was implemented and when.

## Directory Structure

```
.opencode/plans/
├── README.md                    # This file
├── active-plan.md              # Current implementation plan
├── another-plan.md             # Another active plan
└── archive/
    ├── completed-2026-01-15.md # Completed and archived
    └── old-feature-2026-01-17.md
```

## Plan File Format

Plans follow a standard template:

```markdown
# Feature Name Implementation Plan

## Purpose
[1-2 sentences: What problem does this solve?]

## Metadata (Optional)
**References:** [Tracking references, e.g., JIRA-123, GitHub #456]

## Tasks

- [ ] **Task 1 Name** (Small)
  - Purpose: What this achieves
  - Acceptance: What "done" looks like
  - Steps:
    - Implementation step 1
    - Implementation step 2
  - Files: file1.go, file2.go
  - Dependencies: None
  - Refs: [Optional: task-specific tracking references]
  - Commit Notes: [Optional: extra context for commit message]

- [ ] **Task 2 Name** (Medium)
  - Purpose: What this achieves
  - Acceptance: What "done" looks like
  - Steps:
    - Implementation step 1
  - Files: file3.go
  - Dependencies: Task 1

## Architecture Overview
[How feature fits into system]

## Technical Decisions
- Decision 1: Choice (Rationale: why)
- Decision 2: Choice (Rationale: why)

## Integration Points
[Where code changes]

## Security Considerations
- Concern 1: Risk → Mitigation

## Testing Strategy
- Unit tests: approach
- Integration tests: approach

## Risk Points
- Risk 1: Description → Mitigation

## Dependencies
- Task dependencies and parallel work opportunities
```

### Optional Metadata

Plans support an optional `## Metadata` section for tracking references and other metadata that flows into commit messages.

**Plan-level metadata** (in the `## Metadata` section):
- `**References:**` — External tracking references (e.g., `JIRA-123, GitHub #456`). These are included as `Refs:` trailers in every commit for the plan.

**Task-level metadata** (in each task entry):
- `Refs:` — Task-specific tracking references, appended to plan-level references in commit trailers.
- `Commit Notes:` — Extra context included in the commit message body (e.g., "Implements the callback flow discussed in design review").

Both are optional — existing plans without metadata continue to work unchanged.

### Canonical Executable Contract

Executable plans must use this task shape:
- status + title + size in the checkbox header
- required fields: `Purpose`, `Acceptance`, `Steps`, `Files`, `Dependencies`
- optional fields: `Refs`, `Commit Notes`

Workflow runtime annotations such as `Actual Files`, `Notes`, and warning lines beginning with `⚠️` may be added by tooling during execution.

## Workflow Tools

The hardened workflow uses dedicated tools instead of relying on raw markdown parsing alone:
- `parse-plan` — structured plan JSON
- `validate-plan` — canonical contract validation
- `update-plan-task` — safe checkbox and annotation updates
- `extract-commit-metadata` — commit refs and notes resolution

## Best Practices

1. **One plan per feature**: Keep plans focused on a single feature or change
2. **Clear task descriptions**: Each task should be actionable and completable
3. **Archive when done**: Don't delete plans - archive them for future reference
4. **Reference archived plans**: Use them to understand past decisions and patterns
