# 0001: Two-Stage Planning

**Status:** Accepted
**Date:** 2026-07-20

## Context

Early versions of the planner produced monolithic plans. A single agent would
research the problem, clarify requirements, design the solution, write out every
task, and present the whole thing for approval in one shot.

This had a few problems. First, the plans were long — hard to read, harder to
review. A reader had to absorb pages of structured tasks before they could tell
whether the direction was even right. Second, if the direction was wrong, all
that task-level detail was wasted. You'd spot the misalignment on page three
and realize the previous two pages of task definitions were now irrelevant.
Third, the planner had no natural checkpoint for user feedback. The user had
no way to say "yes, that direction, keep going" before the planner committed
to a specific breakdown.

## Decision

Split planning into two stages, each with its own review loop and user approval
point:

**Stage 1 — Direction:** Explore the codebase (optional), clarify requirements
(optional), analyze complexity (required), produce a written direction document
(required), have it reviewed by a dedicated direction reviewer (required), then
present it to the user for approval.

**Stage 2 — Plan:** Research unknowns (optional), write the detailed plan file
(required), have it reviewed by a plan reviewer (required), then present it to
the user for approval before implementation begins.

Each stage has bounded rework: the direction reviewer gets one revision pass
before escalating to the user, and the plan reviewer gets one pass too. This
keeps the feedback loops tight without letting review spiral.

## Consequences

**Easier:**

- The user can catch a wrong direction early, before any task-level work is done.
- Direction documents are short — a page or two — and easy to digest.
- The planner can adjust course between stages without discarding detailed task
  work that hasn't happened yet.
- Each review pass has a clear scope (direction quality vs. plan quality) instead
  of reviewers having to evaluate everything at once.

**Harder:**

- Two stages means two review invocations and two user approvals instead of one.
  For trivial tasks this added overhead isn't justified, so the planner is
  allowed to skip Stage 1 for very simple work.
- The direction-reviewer agent has a narrower job than the old monolithic planner
  but still needs enough context to spot misalignment.
- The workflow file is longer because it describes two stages instead of one.

## Related

- Knowledge: `../knowledge/index.md`
- Planner definition: `.opencode/agent/pragmatic-planner-v2.md`
- Planning guide: `.opencode/reference/planning-guide.md`
