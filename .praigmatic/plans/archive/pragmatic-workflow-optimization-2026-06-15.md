# Pragmatic Workflow Token Optimization Plan

## Purpose
Reduce the token cost of the PrAIgmatic development workflow by ~50-70% through prompt compression, eliminating the committer agent, capping review loops, and making code review adaptive by task size.

## Metadata
**References:** analysis.md, implementation_plan.md

## Tasks

- [ ] **Compress developer agent prompt by ~60%** (Medium)
  - Purpose: Reduce the largest per-invocation system prompt (409 lines) to ~150 lines
  - Steps:
    1. Remove verbose JSON/markdown output format examples (lines 93-163) — replace with a 10-line format reference (model follows format from brief instruction, not 70 lines of templates)
    2. Remove skill loading ceremony section (lines 189-290) — keep 5-line instruction: "Load relevant skills via `skill()` tool before implementing. Document: Skills Attempted / Skills Loaded."
    3. Merge Phase 3 (Pre-Commit Preparation) and Phase 4 (Task Completion) into a single 10-line section
    4. Remove TDD Assessment section (lines 292-304) — consolidate to 3-line inline rule: "If task involves PII/money/auth: use TDD. Otherwise: developer discretion."
    5. Remove Security Assessment section verbosity (lines 214-224) — consolidate to 3-line checklist
    6. Remove Phase 1 Boundary Checkpoint ceremony (lines 242-249) — it's self-evident process overhead
    7. Update "You MUST NOT" list: remove "Call code-reviewer" (review routing is now adaptive), remove "Call committer" (developer commits inline for Small tasks)
    8. Add Adaptive QA Routing section: "For Small tasks: self-review against security checklist, then commit inline. For Medium/Large tasks: do NOT review yourself — report completion and let orchestrator handle review."
    9. Add inline commit instruction: "After completing a Small task, use `git-commit` tool to commit. Format: `type(scope): subject`."
  - Files: `.opencode/agent/pragmatic-developer.md`
  - Dependencies: None

- [ ] **Compress code reviewer prompt by ~60%** (Medium)
  - Purpose: Reduce 313-line reviewer prompt to ~120 lines
  - Steps:
    1. Remove Overengineering Detection section examples (lines 67-95) — model knows Singleton/Factory/Strategy patterns; keep only the severity rule
    2. Remove Test Quality Review Criteria section (lines 41-64) — skills handle this; keep 3-line rule
    3. Remove Plan Awareness section (lines 107-159) — this is plan context that arrives in the prompt; keep 5-line instruction
    4. Remove Library Currency section (lines 98-105) — keep 2-line note
    5. Compress What to Skip/Ignore section (lines 161-173) to 5 lines
    6. Compress Skill Loading section (lines 198-211) to 3-line instruction
    7. Keep Issue Classification section but compress examples to 1-line each
    8. Keep Review Process and Output Format sections (these are core)
  - Files: `.opencode/agent/pragmatic-code-reviewer.md`
  - Dependencies: None

- [ ] **Compress plan reviewer prompt by ~75%** (Medium)
  - Purpose: Reduce 476-line plan reviewer (the longest prompt) to ~100 lines
  - Steps:
    1. Remove Language-Specific Anti-Patterns Reference section entirely (lines 449-476) — skills provide this; keep 2-line instruction: "Use loaded skills for language-specific anti-patterns."
    2. Remove verbose example blocks (lines 91-102, 140-158, etc.) — keep 1-line examples
    3. Remove Size Verification Checklist (lines 208-214) — redundant with task sizing table
    4. Compress Review Criteria sections: merge 6 weighted subsections into a single table with 1-line descriptions
    5. Remove Duplicate Decision Matrix and Examples sections at bottom (lines 213-258) — keep one concise version
    6. Remove "When Tasks Are Too Small" section (lines 216-222) — Low priority, obvious
    7. Keep Issue Classification and Output Format (core functionality)
  - Files: `.opencode/agent/pragmatic-plan-reviewer.md`
  - Dependencies: None

- [ ] **Compress planner v2 prompt by ~60%** (Medium)
  - Purpose: Reduce 531-line planner prompt to ~200 lines
  - Steps:
    1. Remove verbose subagent prompt templates (lines 67-78, 86-109, 137-157, etc.) — replace with 1-line instruction: "Spawn [agent] with prompt containing: Original Request, [relevant context sections]"
    2. Remove FORCED LOOP enforcement text that repeats 3x (lines 160-210, 347-397) — keep ONE concise loop description and reference it: "Same forced-loop pattern as Step 1.5"
    3. Remove Plan Template (lines 276-343) — keep as reference to planning-guide.md, not inline
    4. Remove Error Handling section verbosity (lines 462-505) — compress to 10-line table
    5. Remove Checklist section (lines 509-531) — enforced by the workflow itself
    6. Keep Workflow Overview, Stage 1/2 structure, and Quick Workflow
  - Files: `.opencode/agent/pragmatic-planner-v2.md`
  - Dependencies: None

- [ ] **Compress direction reviewer prompt by ~55%** (Small)
  - Purpose: Reduce 285-line direction reviewer to ~130 lines
  - Steps:
    1. Remove language-specific overengineering patterns section (lines 262-285) — skills provide this
    2. Remove Examples section (lines 221-258) — keep 1 example
    3. Remove Skill Loading ceremony (lines 53-73) — keep 3-line instruction
    4. Compress Review Focus Areas table — merge HIGH/MEDIUM/LOW into 1-line descriptions
    5. Keep Issue Classification, Decision Matrix, and Output Format
  - Files: `.opencode/agent/pragmatic-direction-reviewer.md`
  - Dependencies: None

- [ ] **Compress remaining agent prompts** (Small)
  - Purpose: Reduce direction-planner, brainstormer, researcher, explorer, QA prompts
  - Steps:
    1. Compress direction-planner.md (161→~80 lines): Remove verbose examples, output checklist redundancy
    2. Compress brainstormer.md (201→~100 lines): Remove question patterns section (model knows how to ask questions), compress pragmatism decision matrix
    3. Compress researcher.md (193→~100 lines): Remove source selection guide table (redundant with tool descriptions), compress checklists
    4. Compress explorer.md (157→~80 lines): Remove anti-patterns section (obvious), compress output format
    5. Compress QA agent (230→~120 lines): Remove adaptation guidelines (model can adapt), compress workflow phases
  - Files: `.opencode/agent/pragmatic-direction-planner.md`, `.opencode/agent/pragmatic-brainstormer.md`, `.opencode/agent/pragmatic-researcher.md`, `.opencode/agent/pragmatic-explorer.md`, `.opencode/agent/pragmatic-qa.md`
  - Dependencies: None

- [ ] **Delete committer agent and inline commit logic** (Small)
  - Purpose: Eliminate a dedicated agent invocation per task by making the orchestrator use `git-commit` tool directly
  - Steps:
    1. Delete `.opencode/agent/pragmatic-committer.md`
    2. Update `pragmatic-implementation.md`: Replace all `task(agent: "pragmatic-committer", ...)` invocations with direct `git-commit` tool calls
    3. Update implementation-templates.md: Replace Template 6a/6b/6c committer prompts with direct `git-commit` tool parameter specifications
    4. Remove `pragmatic-committer` from all agent permission allowlists (developer, planner)
  - Files: `.opencode/agent/pragmatic-committer.md` (DELETE), `.opencode/commands/pragmatic-implementation.md`, `.opencode/reference/implementation-templates.md`, `.opencode/agent/pragmatic-developer.md`, `.opencode/agent/pragmatic-planner-v2.md`
  - Dependencies: Task 1 (developer prompt changes)

- [ ] **Cap code review max retries from 3 to 1** (Small)
  - Purpose: Reduce worst-case code review loop from 6 invocations (review→fix→review→fix→review→fix) to 3 (review→fix→review)
  - Steps:
    1. Update `pragmatic-implementation.md` section 4.4: Change `max_retries = 3` to `max_retries = 1`
    2. Update implementation-templates.md Template 3: Change `[max_retries]` default from 3 to 1
    3. Keep max_retries = 3 for holistic review (cross-cutting issues warrant more iterations)
  - Files: `.opencode/commands/pragmatic-implementation.md`, `.opencode/reference/implementation-templates.md`
  - Dependencies: None

- [ ] **Make QA validation loop opt-in instead of automatic** (Small)
  - Purpose: Remove the mandatory QA loop (steps 4.9) from the automatic flow — most plans don't need it
  - Steps:
    1. Update `pragmatic-implementation.md` section 4.9: Change from "after holistic review" to "optional — only run if user requests via `/pragmatic-implementation --qa` or if the plan has a `## QA Required` section"
    2. After holistic review completes, default flow goes directly to archive
    3. If QA is requested, run the existing QA loop logic unchanged
  - Files: `.opencode/commands/pragmatic-implementation.md`
  - Dependencies: None

- [ ] **Add adaptive code review routing to orchestrator** (Medium)
  - Purpose: Skip external code review for Small tasks, keep it for Medium/Large
  - Steps:
    1. Update `pragmatic-implementation.md` section 4.3-4.4: Add task-size-based routing logic:
       - If task is `(Small)`: Skip step 4.4 (code review). Developer self-reviewed. Go directly to commit (4.5).
       - If task is `(Medium)` or `(Large)`: Run step 4.4 as-is (with max_retries=1 from Task 8).
    2. Update step 4.5 commit logic for Small tasks: orchestrator uses `git-commit` directly (no committer agent)
    3. Update developer prompt (already done in Task 1): Add self-review instruction for Small tasks
    4. Add a safety net: If Small task touches security-critical files (auth, crypto, middleware), force external review regardless of size
  - Files: `.opencode/commands/pragmatic-implementation.md`, `.opencode/agent/pragmatic-developer.md`
  - Dependencies: Task 1, Task 7, Task 8

- [ ] **Compress implementation-templates.md by ~40%** (Medium)
  - Purpose: Reduce 369 lines of templates that get loaded by orchestrator each invocation
  - Steps:
    1. Remove Template 6a/6b/6c (committer prompts) — replaced by direct git-commit calls (Task 7)
    2. Compress Template 1 (Developer Task Prompt): Remove verbose section headers that restate what's obvious (e.g., "## Code Style Requirements" — 4 lines of instruction can be 1 line)
    3. Compress Template 2 (Code Review Prompt): Remove redundant "Review Instructions" prose — keep bullet list
    4. Compress Template 7 (QA Prompt): Remove issue classification instructions — move to QA agent prompt itself
    5. Compress Template 8 (QA Fix Prompt): Same
  - Files: `.opencode/reference/implementation-templates.md`
  - Dependencies: Task 7

- [ ] **Keep explorer agent — update planner to reuse explorer output** (Small)
  - Purpose: The implementation_plan.md proposed deleting the explorer. We keep it (it uses cheap `mini-fast` model) but ensure the planner doesn't re-read files the explorer already analyzed.
  - Steps:
    1. Keep `.opencode/agent/pragmatic-explorer.md` (no deletion)
    2. Update `pragmatic-planner-v2.md` Step 1.3 (Analyze): Add instruction: "If explorer was run, use `exploration_context` directly. Do NOT re-read files the explorer already analyzed."
    3. This is a prompt-only change, no code changes
  - Files: `.opencode/agent/pragmatic-planner-v2.md`
  - Dependencies: Task 4

- [ ] **Clean up ghost references and stale instructions** (Small)
  - Purpose: Fix inconsistencies discovered during analysis
  - Steps:
    1. Fix `pragmatic-developer.md` line 181: "Call code-reviewer - orchestration commands handle code review" — update to reflect new adaptive routing (Small=self-review, Medium/Large=orchestrator)
    2. Fix `pragmatic-developer.md` line 180: "Call committer - orchestration commands handle git operations" — update to "For Small tasks, commit inline using git-commit. For Medium/Large, orchestrator handles."
    3. Fix `pragmatic-developer.md` permission: `pragmatic-committer: allow` — remove (agent deleted)
    4. Remove `pragmatic-committer: allow` from planner permission list
    5. Update planner `description` field: Remove "plan-reviewer" from spawned agents list if reviewer behavior changes
  - Files: `.opencode/agent/pragmatic-developer.md`, `.opencode/agent/pragmatic-planner-v2.md`
  - Dependencies: Task 1, Task 7, Task 10

- [ ] **Verification: test the optimized workflow end-to-end** (Medium)
  - Purpose: Ensure no breakage from prompt changes, agent deletions, and routing changes
  - Steps:
    1. Run `npx vitest run` in `.opencode/` to verify tool tests pass
    2. Create a test plan with one `(Small)` and one `(Medium)` task
    3. Run `/pragmatic-implementation` and verify:
       - Small task: developer self-reviews, no code reviewer spawned, direct commit via git-commit tool
       - Medium task: developer completes, orchestrator spawns code reviewer (max 1 retry), commit via git-commit tool
    4. Verify no references to deleted committer agent remain
    5. Verify QA loop does not run automatically (only on opt-in)
  - Files: None (verification only)
  - Dependencies: All previous tasks

## Architecture Overview

The workflow changes follow a **progressive enhancement** pattern: each task is independently valuable and can be deployed without others. The core structural changes are:

1. **Prompt compression** (Tasks 1-6): Pure token savings, no behavioral changes
2. **Committer deletion** (Task 7): Structural simplification, orchestrator absorbs commit logic
3. **Review loop caps** (Tasks 8-9): Reduce worst-case token multiplier
4. **Adaptive review routing** (Task 10): Size-aware quality gate — the biggest behavioral change
5. **Cleanup** (Tasks 11-13): Consistency and verification

## Technical Decisions

- **Keep the explorer agent** — It uses `gpt-5.4-mini-fast` (cheap). Deleting it saves ~1.5K tokens/invocation but forces the planner (using the expensive model) to read files itself. Net cost increase, not decrease. The implementation_plan.md was wrong to propose deletion.

- **Keep the plan reviewer agent** — The analysis.md incorrectly stated it "doesn't actually exist." It does exist (476 lines). It serves a distinct purpose from the direction reviewer (task granularity vs. overengineering). Deleting it would save tokens but loses the 60% primary focus on task size optimization. Instead, compress it by 75%.

- **Keep the direction reviewer agent** — Despite the analysis suggesting "Modern models don't need a secondary agent to review their plans," the direction reviewer catches real YAGNI/KISS violations. Keep but compress.

- **Keep separate code reviewer for Medium/Large tasks** — Self-review has a conflict of interest. The reviewer's `edit: deny` permission enforces structural independence. Removing this for all tasks removes a safety net. Compromise: only skip for Small tasks.

- **Cap reviews at 1 retry, not 0** — Completely eliminating retries would mean a single bad review forces failure. 1 retry (2 total reviews) is the practical minimum.

## Token Savings Estimate

| Change | Per-Invocation Savings | Invocations/Feature | Total Savings |
|--------|----------------------|---------------------|---------------|
| Developer prompt compressed (409→150 lines) | ~3K tokens | 5-15 | ~15-45K |
| Code reviewer compressed (313→120 lines) | ~2.5K tokens | 2-6 | ~5-15K |
| Plan reviewer compressed (476→100 lines) | ~5K tokens | 1-3 | ~5-15K |
| Planner compressed (531→200 lines) | ~4K tokens | 1 | ~4K |
| Other agents compressed | ~1-2K each | 1-3 each | ~5-10K |
| Committer deleted | 0 (tool call instead) | 5 | ~5K |
| Review max retries 3→1 | Avoids 2-4 extra invocations | Per task | ~20-40K |
| Small task skips review | ~5K per skipped review | ~60% of tasks | ~15-30K |
| QA loop opt-in | Avoids 2-4 QA invocations | Most features | ~10-20K |
| **Total estimated savings** | | | **~85-225K tokens/feature** |

**Baseline from analysis: 500K-1M tokens per feature. After optimization: ~250K-500K — roughly 50% reduction.**

## Risk Points

- **Risk**: Compressed prompts lose critical instructions → models produce lower quality output
  - Mitigation: Compress verbosity (examples, repetition), not rules. Every behavioral rule stays, just with fewer words.
  - Fallback: If quality drops, add back the most-missed sections incrementally.

- **Risk**: Small task skipping review lets bugs through
  - Mitigation: Security-critical file detection forces review even for Small tasks. Developer self-review checklist provides minimum QA.
  - Fallback: User can always request full review by marking tasks as Medium.

- **Risk**: Developer self-review for Small tasks is insufficient
  - Mitigation: Small tasks are 1-3 steps, single file. Risk is inherently low. The holistic review at the end still catches cross-task issues.
  - Fallback: Revert to mandatory review if Small-task bug rate increases.

## What We Are NOT Doing (and Why)

1. **Collapsing planner subagents into one "Architect" agent** — High effort, high risk. Different models for different tasks is a cost optimization (explorer=cheap, direction-planner=smart). Collapsing loses this. Can revisit after prompt compression proves effective.

2. **Deleting the explorer** — Uses a cheap model. Forcing the expensive planner model to read files increases cost.

3. **Deleting the plan reviewer** — It exists and serves a distinct purpose. Compressing it by 75% gets most of the token savings without losing the function.

4. **Token budget mode (`/pragmatic-implementation --budget low/medium/high`)** — Good idea, but adds CLI complexity. The adaptive routing by task size achieves the same effect automatically. Can add explicit budget mode later.

5. **Pattern detection to skip direction planning** — Good idea but high implementation effort. The Quick workflow in planner-v2 already handles this for trivial tasks. Extend later.
