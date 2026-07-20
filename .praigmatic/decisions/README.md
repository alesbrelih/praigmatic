# Architectural Decisions

This directory records architectural decisions made during the PrAIgmatic project.
Each record captures why a particular approach was chosen, what alternatives were
considered, and what the trade-offs are.

## Conventions

- **Sequential numbering:** Files use four-digit numbers starting at `0001`.
- **Status in the document:** Every ADR embeds its own status (Proposed / Accepted /
  Deprecated / Superseded) so you can tell at a glance whether it's still active.
- **Cross-references:** ADRs link to related knowledge files (`../knowledge/...`),
  plan files (`../plans/...`), or other ADRs (ADR-XXXX).

## Template

```markdown
# NNNN: Title

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD

## Context

What is the issue that is motivating this decision or change?

## Decision

What change are we proposing or making?

## Consequences

What becomes easier or more difficult because of this change?
Include trade-offs.

## Related

- Knowledge: `../knowledge/...`
- Plans: `../plans/...`
- See also: ADR-XXXX
```

## Active Decisions

| Number | Title | Status |
|--------|-------|--------|
| 0001 | [Two-Stage Planning](./0001-two-stage-planning.md) | Accepted |
| 0002 | [Committer Removal](./0002-committer-removal.md) | Accepted |
| 0003 | [Adaptive Review Routing](./0003-adaptive-review-routing.md) | Accepted |
