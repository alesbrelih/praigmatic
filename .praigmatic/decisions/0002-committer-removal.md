# 0002: Committer Removal

**Status:** Accepted
**Date:** 2026-07-20

## Context

The original workflow had a dedicated "committer" agent. After a developer agent
finished implementing a task and the code passed review, the orchestrator would
hand off to the committer with a list of files to stage and a commit message.
The committer would run `git add`, `git commit`, and report back.

In theory this was clean separation of concerns: one agent writes code, another
handles git. In practice the committer was a frequent point of friction. It
didn't know what had changed — it had to be told. It didn't know the commit
conventions — those had to be passed in. It didn't have access to the plan
metadata that specified commit scope and refs. Every handoff was a serialization
problem: the orchestrator had to pack up enough context for the committer to do
its job, and the committer had to unpack it without losing anything.

The result was a steady trickle of failures. The committer would get the wrong
file list, use the wrong scope, or fail because it didn't understand the staged
state. Each failure broke the automation flow and required manual intervention.

## Decision

Remove the committer agent entirely. Inline the commit logic directly into the
orchestrator's workflow:

1. The orchestrator stages files using `git add` (already its responsibility from
   the review flow).
2. Commit metadata (type, scope, subject, refs, body) is resolved using
   `extract-commit-metadata` — a tool that reads plan-level and task-level
   metadata directly.
3. The orchestrator calls `git-commit` directly with those resolved values.

This is documented in the pragmatic-implementation command at step 4.5: "Commit
using `git-commit` tool directly (no committer agent)."

## Consequences

**Easier:**

- One less agent to maintain, test, and debug.
- The orchestrator has full context about what changed, why, and what metadata
  to use — no serialization step needed.
- Fewer handoff failures because the orchestrator is already handling the staged
  state from the review phase.
- The commit tool (`git-commit`) enforces the conventional commit format directly,
  so there is no ambiguity about message structure.

**Harder:**

- The orchestrator now has git operations in its responsibilities, making it
  slightly less "pure" as a coordinator. This is acceptable because the
  operations are simple and well-bounded (stage + commit, no branching or
  merging).
- If we ever need complex git workflows (signed commits, multiple parents, or
  interactive rebasing), we would need to reconsider. For now, staged commits
  against a single branch are all we need.

## Related

- Implementation command: `.opencode/commands/pragmatic-implementation.md` (step 4.5)
- See also: ADR-0003 (adaptive review routing, another simplification decision)
