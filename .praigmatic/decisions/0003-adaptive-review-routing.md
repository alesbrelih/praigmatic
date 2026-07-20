# 0003: Adaptive Review Routing

**Status:** Accepted
**Date:** 2026-07-20

## Context

When the project started, every implemented task went through a full code review.
The orchestrator would stage the changes, invoke a dedicated code-reviewer agent,
wait for the verdict, and only then proceed to commit. This was thorough but slow.

The problem was that not all tasks needed the same level of scrutiny. A "rename
a CSS class" task (Small, one step, obvious) went through the same review pipeline
as "implement JWT middleware" (Medium, multiple steps, security-relevant). The
reviewer would often come back with "looks fine" for the trivial tasks, and the
whole loop — build review packet, render prompt, invoke agent, parse result —
had taken 30-60 seconds for nothing.

More importantly, it discouraged small, safe changes. If every edit carried the
same overhead, there was incentive to batch changes into bigger tasks, which
made each task harder to review when it did come up for review.

## Decision

Route tasks based on their declared size:

- **Small tasks** (1-3 implementation steps, as declared in the plan): Skip
  external code review. The developer is expected to self-review. Proceed
  directly to commit.
- **Medium and Large tasks** (4+ steps): Run the full code review loop —
  invoke the reviewer, fix issues, re-review as needed.
- **Security override:** If a task touches security-critical files (auth,
  cryptography, middleware, secrets), force the full review loop regardless
  of task size. The override is checked by file path patterns, not by task
  metadata, so it cannot be bypassed by mis-sizing a task.

This is documented in the pragmatic-implementation command at step 4.4 ("Code
Review — Adaptive Routing").

## Consequences

**Easier:**

- Small, safe changes go through faster. A one-step config change no longer
  waits for an agent handoff and review cycle.
- The code-reviewer agent spends its time on changes that actually need it,
  which improves its signal-to-noise ratio.
- The workflow encourages smaller, more focused tasks — each task is quicker
  to get through, so there is less pressure to batch changes.

**Harder:**

- Small tasks that have hidden complexity skip review. The security override
  catches the obvious cases (auth, crypto) but cannot catch every subtle bug.
  The trade-off is accepted: small tasks are presumed low-risk, and the
  developer is expected to self-review.
- The size classification (Small = 1-3 steps) is set in the plan before
  implementation starts. If a task turns out to be harder than expected during
  implementation, its size classification does not change — the review gate is
  already passed. This is a deliberate choice: requiring reclassification mid-
  implementation would add friction. The team can always run a manual review
  if a "Small" task produced unexpectedly complex code.
- The orchestrator code has an additional branching path: review or skip. This
  adds a small amount of complexity to the implementation command, but the
  logic itself is straightforward.

## Related

- Implementation command: `.opencode/commands/pragmatic-implementation.md` (step 4.4)
- Task sizing guidelines: `.opencode/reference/planning-guide.md`
- See also: ADR-0002 (committer removal, another simplification via inline logic)
