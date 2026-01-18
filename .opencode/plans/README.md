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

### Implementing Plans

1. **Use the `/pragmatic-implementation` command**: This command reads the plan file, creates todos, and starts implementation

2. **Progress tracking**: As tasks complete, the plan file checkboxes are updated:
   - `- [ ]` = Pending task
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

## Tasks

- [ ] **Task 1 Name** (TTD_REQUIRED) (Small)
  - Implementation detail 1
  - Implementation detail 2

- [ ] **Task 2 Name** (NO_TTD) (Medium)
  - Implementation detail 1

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

## Best Practices

1. **One plan per feature**: Keep plans focused on a single feature or change
2. **Clear task descriptions**: Each task should be actionable and completable
3. **Archive when done**: Don't delete plans - archive them for future reference
4. **Reference archived plans**: Use them to understand past decisions and patterns
