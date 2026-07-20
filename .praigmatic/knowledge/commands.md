# Commands: Slash Commands

## Overview

The PrAIgmatic configuration defines three slash commands that drive the core workflows. The primary command is `/pragmatic-implementation`, which orchestrates the entire plan-driven implementation lifecycle. Two additional commands serve the penetration testing workflow: `/verify-finding` for adversarial finding verification and `/verify-next` for batch processing of unverified findings.

## Architecture / Key Concepts

### Command Format

Commands are defined as markdown files in `.opencode/commands/` with frontmatter (description, optional agent and model overrides) and a body that serves as the prompt template. Arguments from the user are substituted via `$ARGUMENTS` or positional `$1`, `$2` placeholders.

### Orchestrator Pattern

All commands follow the **orchestrator pattern** — the command itself acts as a coordinator that delegates actual work to specialized agents. The orchestrator must never edit code, challenge findings, or produce verdicts directly. It coordinates the workflow, parses responses, and manages state.

## Key Commands

### /pragmatic-implementation

**Description:** Load a plan file and orchestrate plan-driven implementation. The primary workflow command.

**Trigger:** After a plan is approved (handoff from pragmatic-planner-v2). Can also be invoked directly with a plan name.

**Workflow Flow:**

1. **Find Plan** — Use `find-plan` to locate the most recent or specified plan file
2. **Validate Git State** — Use `validate-git-state` to check for uncommitted changes; prompt user to continue if found
3. **Validate and Parse Plan** — Run `validate-plan` (stop on failure), then `parse-plan` for structured JSON source of truth
4. **Implementation Loop** — For each task:
   - **4.1 Mark In-Progress** — `update-plan-task(action: "mark_in_progress")`
   - **4.2 Invoke Developer** — Build packet with `build-developer-task-packet`, render with `render-developer-task-prompt`, invoke `pragmatic-developer`
   - **4.3 Handle Developer Response** — `parse-task-result`, handle completed/deviated/failed/blocked
   - **4.4 Code Review (Adaptive Routing)** — Small tasks skip; Medium/Large tasks run review; security override forces review. Build review packet, render, invoke reviewer, parse result, retry if needed
   - **4.5 Commit and Accumulate** — Mark completed, annotate execution, extract commit metadata, commit via `git-commit`, accumulate execution state
   - **4.6 Handle Max Retries / Failure** — Annotate review failure, keep files staged, inform user
   - **4.7 Continue to Next Task** — Find next unchecked task, prioritize `[~]` over `[ ]`
5. **All Tasks Complete — Holistic Review** — Run only if >1 task, backwards compatibility required, or security-sensitive work. Up to 3 developer fix attempts
6. **QA Validation Loop (OPT-IN)** — Only if `--qa` flag or `## QA Required` plan section. Up to 2 developer fix attempts
7. **Archive** — Move plan to archive, stage moved file, create archive commit

**Adaptive Routing Logic:**
- **Small tasks (1-3 steps):** Skip code review
- **Medium/Large tasks:** Always run code review
- **Security override:** Force code review if touching auth, crypto, middleware, secrets

**Context Gate Rules (Developer Packets):**
- Always include: task name, purpose, steps, acceptance, files, direct dependencies
- Include context only when packet flags or Context Tags require it
- Never include default full-plan context for ordinary tasks

**KG Checkpoint:** After step 4.5 (commit), discoveries are accumulated in execution state for subsequent tasks and holistic review.

### /verify-finding

**Description:** Adversarial verification of a pentest finding. Fetches finding from SysReptor, re-runs replication for empirical ground truth, runs skeptic-presenter-arbiter debate, produces verified verdict with operator confirmation, and patches SysReptor.

**Workflow Flow:**

1. **Initialize History Directory** — Create `.verify-finding/` in assessment project
2. **Fetch Finding** — From SysReptor finding ID or inline content
3. **Check Business Context** — Read `context.md` in scope root; stop if missing
4. **Re-run Replication (Mandatory Empirical Ground Truth)** — Execute finding's replication steps, classify result (Reproducible/Partially/Not Reproducible/Target Unavailable), get operator confirmation
5. **Round 1 — Skeptic Challenges** — Delegate to `finding-skeptic`, parse challenges
6. **Round 1 — Presenter Defends** — Delegate to `finding-presenter`, parse defense
7. **Round 2 — Skeptic Challenges Remaining** — Focus on unconceded points
8. **Round 2 — Presenter Responds** — Respond to remaining challenges
9. **Checkpoint — Contestation Check** — If contested, pause for operator input
10. **Arbiter Verdict** — Delegate to `finding-arbiter`, parse verdict (Confirmed/Downgraded/False Positive/Insufficient Evidence)
11. **Operator Confirmation** — Mandatory pause before patching
12. **Check for Overlap** — Scan SysReptor and local findings for duplicates
13. **Patch SysReptor** — Apply field patches per arbiter recommendation
14. **Write Debate History** — Full audit record to `.verify-finding/{finding_id}.md`
15. **Summary** — Display verification complete with verdict, CVSS changes, patches

**Templates:**
- Template A: Skeptic Prompt (Round 1)
- Template B: Presenter Prompt (Round 1)
- Template C: Skeptic Prompt (Round 2)
- Template D: Presenter Prompt (Round 2)
- Template E: Arbiter Prompt
- Template F: Debate History

### /verify-next

**Description:** Verify the next unverified local finding. Scans the pentest workspace for findings with no Verification field, presents them for operator confirmation, then runs the full verify-finding debate workflow.

**Workflow Flow:**

1. **Find Next Unverified Finding** — Use `find-unverified-finding` tool with optional skip and folder parameters
2. **Present Next Finding for Confirmation** — Show title, severity, plan, file path; ask operator to verify/skip/stop
3. **Re-run Replication** — Same as `/verify-finding` Step 4
4. **Check Business Context** — Read `context.md`; stop if missing
5. **Initialize History Directory** — Create `.verify-finding/`
6. **Read and Parse Local Finding** — Parse markdown fields into structured format
7. **Run Verification Debate** — Full skeptic-presenter-arbiter workflow (reuses `/verify-finding` templates)
8. **Operator Confirmation** — Mandatory pause before updating files
9. **Check for Overlap** — 4-signal comparison (title, affected asset, severity, vulnerability type; 3-of-4 match threshold)
10. **Update Local Finding File** — Set Verification, Verified, Debate Record fields
11. **Write Debate History** — Full audit record
12. **Loop or Exit** — Ask operator to continue with next finding or exit; display session summary

**Key differences from `/verify-finding`:**
- Operates on local finding files instead of SysReptor
- Automatically scans for next unverified finding
- Batch processing — can verify multiple findings in a session
- Updates local file fields instead of SysReptor API patches
- 4-signal comparison for overlap detection (local + SysReptor)

**Templates:** Reuses Templates A-F from `/verify-finding` with local file field mapping.

## Integration Points

- **Agent definitions:** All commands delegate to agents (pragmatic-developer, pragmatic-code-reviewer, pragmatic-qa, finding-skeptic, finding-presenter, finding-arbiter)
- **Tool ecosystem:** Every command step maps to specific tools (build-*, render-*, parse-*, find-*, validate-*, update-*, archive-*, git-*)
- **Plan files:** `/pragmatic-implementation` consumes plan files; other commands use local files
- **KG checkpoint:** `/pragmatic-implementation` step 4.5 accumulates discoveries that feed the knowledge graph

## Related ADRs

See `../decisions/` for architecture decision records.

## Related Plans

See `../plans/` for implementation plans.
