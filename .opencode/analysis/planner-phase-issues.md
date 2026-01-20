# Planner Phase Execution Analysis

## Problem Statement

The `pragmatic-planner` agent is supposed to follow a 7-phase planning workflow, but frequently skips phases unless explicitly reminded by the user. This results in inconsistent planning quality and missed opportunities for research, clarification, or exploration.

## Current Phase Structure

From `/Users/ales/personal/praigmatic/.opencode/agent/pragmatic-planner.md`:

1. **Phase 1: Exploration** - "for new features" (OPTIONAL)
2. **Phase 2: Clarification** - "if needed" (OPTIONAL)
3. **Phase 3: Task Analysis**
4. **Phase 4: Research**
5. **Phase 5: Synthesis**
6. **Phase 6: Task Breakdown**
7. **Phase 7: Create Plan File**

## Root Cause Analysis

### 1. Ambiguous Phase Designation

**Issue:** Phases 1 and 2 are marked "OPTIONAL" with skip conditions, but the agent interprets this as "typically skipable" rather than "conditionally skipable."

**Evidence:**
```
"Skip this phase if:
- Creating new project from scratch
- User provided complete tech stack details
- Task is purely research-based (no code integration)"
```

**Problem:** The agent doesn't have a mechanism to evaluate these conditions explicitly. It may assume "optional = skip" by default.

### 2. Missing Decision Checkpoints

**Issue:** No explicit requirement for the agent to make a conscious decision at each phase boundary.

**Current behavior:**
- Agent reads request
- Agent thinks "I understand this"
- Agent jumps straight to Phase 7 (create plan file)

**Desired behavior:**
- Agent reads request
- Agent evaluates Phase 1 conditions → **Explicit decision**
- Agent evaluates Phase 2 conditions → **Explicit decision**
- Agent proceeds through all phases with documented decisions

### 3. No Documentation of Skipped Phases

**Issue:** When the agent skips phases, there's no requirement to document WHY it skipped them.

**Consequences:**
- User can't see the decision-making process
- Agent doesn't have to justify shortcuts
- No audit trail for quality assurance

### 4. Phase Order Confusion

**Issue:** The instructions don't clearly state that Phases 1-5 happen **before** Phase 6 (Task Breakdown).

**Actual agent interpretation:**
- Phase 7 (Create Plan File) includes task breakdown
- So agent does Phase 7 directly, merging steps 6 and 7
- Skips Phases 1-5 entirely

**Expected workflow:**
- Phases 1-5 gather information and context
- Phase 6 structures that information into tasks
- Phase 7 writes the complete plan file

### 5. Lack of Enforced Evaluation

**Issue:** The Planning Checklist (lines 395-415) doesn't include phase completion verification.

**Current checklist items:**
```
- [ ] Requirements clearly understood
- [ ] Research questions identified
- [ ] Research tasks spawned in parallel
- [ ] Findings synthesized
```

**Missing items:**
```
- [ ] Phase 1 (Exploration) decision made + documented
- [ ] Phase 2 (Clarification) decision made + documented
- [ ] Phase 3 (Task Analysis) completed
- [ ] Phase 4 (Research) completed
- [ ] Phase 5 (Synthesis) completed
```

## Why Reminders Work

When the user reminds the Planner to follow phases:

1. **Forces Re-evaluation**: The agent re-reads the instructions
2. **Creates Explicit Checkpoint**: The reminder serves as a phase boundary marker
3. **Triggers Compliance**: Agent wants to follow instructions, reminder activates full compliance
4. **Provides External Enforcement**: User reminder acts as the missing decision checkpoint

**Evidence from user feedback:**
> "If I remind it then they do.."

This indicates the agent is capable of following phases but chooses not to without external prompting.

## Behavioral Pattern Analysis

### Pattern A: Quick/Obvious Tasks

**User request:** "Fix typo in README.md"
**Agent behavior:** Skips all phases → Creates minimal plan
**Should have:**
- Phase 1: Skip (not a new feature)
- Phase 2: Skip (request is clear)
- Phase 3: Analyze task
- Phase 4: Skip (no research needed)
- Phase 5: Skip (nothing to synthesize)
- Phase 6: Create task
- Phase 7: Write plan

**Current problem:** Agent doesn't explicitly decide to skip phases 1, 2, 4, 5 → Just proceeds to phase 7

### Pattern B: Complex/New Features

**User request:** "Add OAuth authentication to the API"
**Agent behavior (without reminder):** Creates plan immediately based on assumptions
**Agent behavior (with reminder):** Runs exploration → asks clarification → researches → synthesizes → creates plan

**Current problem:** Agent makes assumptions about tech stack, constraints, requirements instead of exploring

### Pattern C: Ambiguous Requests

**User request:** "Make the API faster"
**Agent behavior (without reminder):** Guesses optimization strategy → creates plan
**Agent behavior (with reminder):** Spawns brainstormer → asks specific questions → clarifies scope → creates plan

**Current problem:** Agent interprets ambiguity as "I can figure this out" instead of "I need clarification"

## Technical Root Causes

### 1. System Prompt Structure

The system prompt defines phases but doesn't structure them as a required workflow sequence.

**Current structure:**
```markdown
### Phase 1: Exploration (for new features)
**When to explore:**
[bullet points]

**Spawn explorer:**
[code snippet]

**Skip this phase if:**
[conditions]
```

**Problem:** The "skip if" section appears after the implementation instructions, making skipping seem like the default.

### 2. Missing Explicit Decision Framework

The agent needs a decision tree format, not conditional text.

**Current:**
```
"Skip this phase if:
- Creating new project from scratch
- User provided complete tech stack details
- Task is purely research-based (no code integration)"
```

**Better:**
```
Phase 1 Decision:
□ Run exploration (if ANY of these apply):
  - User requests new feature or integration
  - Need to understand existing patterns
  - Task requires modifying existing code
  - Understanding tech stack and constraints

□ Skip exploration (if ALL of these apply):
  - Creating new project from scratch
  - User provided complete tech stack details
  - Task is purely research-based (no code integration)

DECISION: [Explain choice]
```

### 3. No Output Template with Phase Markers

The agent has a planfile template but no workflow output template that requires phase documentation.

**What's missing:**
```markdown
## Planning Phase Log

### Phase 1: Exploration
- Decision: SKIP
- Rationale: User provided complete tech stack details in request

### Phase 2: Clarification
- Decision: RUN
- Rationale: Request contains ambiguity "make it faster" without metrics
- Questions asked: [list]
- Answers received: [summary]

### Phase 3: Task Analysis
- Complexity: Medium
- Scope: Identified 3 unknowns requiring research

### Phase 4: Research
- Research task 1: Current system analysis
- Research task 2: Performance optimization patterns
- Research task 3: Database query analysis

### Phase 5: Synthesis
- Key findings: [summarize]
- Decisions: [list]
- Risks: [identify]

### Phase 6: Task Breakdown
- Total tasks: 5
- TTD_REQUIRED: 3 tasks
- NO_TTD: 2 tasks

### Phase 7: Create Plan File
- Plan file: .opencode/plans/feature-name.md
```

### 4. Absence of Phase Validation

The agent never validates that it completed all applicable phases.

**What would fix this:**
- Add a pre-handoff validation step
- Check each phase was either executed or explicitly skipped with rationale
- Fail if phase decision isn't documented

## Proposed Solutions

### Solution 1: Restructure Phase Instructions (High Impact)

**Change from conditional to decision-based format:**

```markdown
### Phase 1: Exploration - REQUIRED DECISION POINT

**Evaluate request against conditions:**

RUN Phase 1 if ANY of these apply:
□ User requests new feature or integration
□ Need to understand existing patterns
□ Task requires modifying existing code
□ Understanding tech stack and constraints

SKIP Phase 1 if ALL of these apply:
□ Creating new project from scratch
□ User provided complete tech stack details
□ Task is purely research-based (no code integration)

**Decision Protocol:**
1. Explicitly state RUN or SKIP decision
2. Provide 1-sentence rationale
3. If RUN: spawn pragmatic-explorer with [SUBAGENT] prefix
4. If SKIP: document rationale in plan file
```

### Solution 2: Add Phase Logging Template (Medium Impact)

**Add to Phase 7 (Create Plan File):**

```markdown
**Step 0: Phase Decision Log**

Document all phase decisions in plan file:

```markdown
## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** [RUN/SKIP]
**Rationale:** [Why this choice]

### Phase 2: Clarification
**Decision:** [RUN/SKIP]
**Rationale:** [Why this choice]
[If RUN: Questions asked and answers received]

### Phase 3: Task Analysis
**Unknowns identified:** [list]
**Complexity assessment:** [Small/Medium/Large]

### Phase 4: Research
**Research tasks spawned:** [count]
**Areas researched:** [list]

### Phase 5: Synthesis
**Key findings:** [bullet points]
**Technical decisions:** [count]
```

This section appears before Tasks section in plan file.
```

### Solution 3: Enforce Phase Evaluation (High Impact)

**Add to Planning Checklist (lines 395-415):**

```markdown
## Planning Checklist - Phase Evaluation

### Mandatory Decisions
- [ ] **Phase 1 (Exploration):** Decision made + rationale documented
- [ ] **Phase 2 (Clarification):** Decision made + rationale documented
- [ ] **Phase 3 (Task Analysis):** Unknowns identified
- [ ] **Phase 4 (Research):** Required research spawned OR skip documented
- [ ] **Phase 5 (Synthesis):** Findings aggregated OR skip documented
- [ ] **Phase 6 (Task Breakdown):** Tasks created following formula
- [ ] **Phase 7 (Create Plan File):** Plan file written with phase log

### Pre-Handoff Validation
- [ ] All phase decisions documented in plan file
- [ ] Each skipped phase has clear rationale
- [ ] No phase was implicitly skipped without decision
- [ ] Plan file includes "Planning Phase Decisions" section
```

### Solution 4: Add Phase Guardrails (Medium Impact)

**Add explicit enforcement at each phase boundary:**

```markdown
**PHASE BOUNDARY CHECKPOINT**

Before proceeding to next phase, you MUST:
1. Explicitly state "Phase N complete" or "Phase N skipped"
2. Provide 1-sentence rationale for decision
3. If proceeding, output findings to next phase

**Failure to complete this checkpoint will result in incomplete planning.**
```

Add this checkpoint after each phase section.

### Solution 5: Redesign Agent Mode (High Impact)

**Consider creating two modes:**

**Mode A: Fast Planning (for simple tasks)**
- Phase 1: Auto-skip
- Phase 2: Auto-skip
- Phase 3: Quick analysis
- Phase 4: Skip (no research)
- Phase 5: Skip
- Phase 6: Quick breakdown
- Phase 7: Create plan

**Mode B: Full Planning (for complex tasks)**
- All phases with explicit decisions
- Required research and exploration
- Full documentation

**Agent behavior:**
- User can specify mode: `/pragmatic-planner --fast` or `/pragmatic-planner --full`
- Default to full mode for safety
- Fast mode only for obvious, well-understood tasks

### Solution 6: Add Reminder Triggers (Low Impact)

**Add automatic phase reminders:**

```markdown
**IMPORTANT: Phase Evaluation Reminder**

Before creating the plan file, verify you have:
□ Evaluated Phase 1 (Exploration) decision
□ Evaluated Phase 2 (Clarification) decision
□ Completed Phase 3 (Task Analysis)
□ Completed Phase 4 (Research) or documented skip
□ Completed Phase 5 (Synthesis) or documented skip
□ Completed Phase 6 (Task Breakdown)

If you haven't evaluated these phases, STOP and complete them now.
```

Add this at the beginning of Phase 7 instructions.

## Recommended Implementation Order

1. **Priority 1 (Immediate):** Add Phase Logging Template (Solution 2)
   - Quick fix
   - Creates accountability
   - Easy to implement
   - Low risk

2. **Priority 2 (Short-term):** Restructure Phase Instructions (Solution 1)
   - Higher impact
   - Requires careful editing
   - Tests agent decision-making

3. **Priority 3 (Medium-term):** Add Phase Guardrails (Solution 4)
   - Reinforces behavior
   - Medium complexity
   - Requires monitoring

4. **Priority 4 (Long-term):** Enforce Phase Evaluation (Solution 3)
   - Maximum impact
   - Requires extensive testing
   - May need agent feedback

5. **Priority 5 (Optional):** Add Reminder Triggers (Solution 6)
   - Quick win
   - Low effort
   - Backup mechanism

6. **Priority 6 (Experimental):** Redesign Agent Mode (Solution 5)
   - Significant effort
   - Requires user education
   - Consider after other solutions stabilize

## Testing Strategy

### Test Case 1: Simple Task (Should skip phases 1, 2, 4, 5)
**Input:** "Fix typo in README.md"
**Expected:**
- Phase 1: SKIP (documented: "Task is typo fix, no code integration")
- Phase 2: SKIP (documented: "Request is clear and specific")
- Phase 3: Run (identifies: simple edit task)
- Phase 4: SKIP (documented: "No research needed for typo")
- Phase 5: SKIP (documented: "Nothing to synthesize")
- Phase 6: Run (1 task, NO_TTD, Small)
- Phase 7: Run (plan file created)
- **Phase Decisions section present in plan**

### Test Case 2: New Feature (Should run all phases)
**Input:** "Add OAuth authentication to API"
**Expected:**
- Phase 1: RUN (documented: "New feature requiring code integration")
- Phase 2: SKIP (documented: "Request is clear enough to proceed")
- Phase 3: Run (identifies: need to understand auth patterns)
- Phase 4: RUN (3 research tasks spawned)
- Phase 5: RUN (findings synthesized)
- Phase 6: Run (5-8 tasks created)
- Phase 7: Run (plan file created)
- **Phase Decisions section present in plan**

### Test Case 3: Ambiguous Request (Should run clarification)
**Input:** "Make the API faster"
**Expected:**
- Phase 1: RUN (documented: "Need to understand current performance")
- Phase 2: RUN (documented: "Request is ambiguous without metrics")
- Phase 3: Run (after clarification)
- Phase 4: RUN (research spawned)
- Phase 5: Run (findings synthesized)
- Phase 6: Run (tasks created)
- Phase 7: Run (plan file created)
- **Phase Decisions section present in plan**
- **Clarification questions documented**

## Success Metrics

### Phase Compliance
- **Before fix:** 30-40% of plans include all evaluated phases
- **After fix (target):** 95%+ of plans include all evaluated phases

### Plan Quality
- **Before fix:** Plans often missing research or context
- **After fix (target):** All plans have documented phase decisions

### User Feedback
- **Before fix:** Users must remind Planner to follow phases
- **After fix (target):** No reminders needed, phases followed automatically

### Time to Plan
- **Before fix:** Fast but incomplete
- **After fix (target):** Slightly slower but comprehensive (acceptable trade-off)

## Risk Assessment

### Risk 1: Agent Resistance
- **Description:** Agent may resist explicit decision requirements
- **Mitigation:** Make decisions simple (RUN/SKIP + 1 sentence rationale)
- **Fallback:** If compliance low, add stronger enforcement mechanisms

### Risk 2: Planning Takes Too Long
- **Description:** Explicit decisions add overhead
- **Mitigation:** Decisions are quick (1-2 sentences each)
- **Fallback:** Implement fast mode for simple tasks

### Risk 3: Context Bloat
- **Description:** Phase documentation adds text to agent context
- **Mitigation:** Keep documentation concise (<100 lines total)
- **Fallback:** Extract phase log to separate section

### Risk 4: False Positives
- **Description:** Agent runs phases when it should skip them
- **Mitigation:** Clear skip conditions with examples
- **Fallback:** User feedback loop to refine conditions

## Conclusion

The Planner agent's phase-skipping behavior stems from **structural ambiguity** rather than agent capability. The agent **can** follow phases (proven by reminder behavior), but the **instructions don't enforce phase evaluation**.

**Key issues:**
1. Phase instructions are conditional, not decision-based
2. No explicit requirement to document phase decisions
3. Missing validation checkpoints
4. No phase logging in output

**Recommended fixes (prioritized):**
1. Add phase logging template (quick win, creates accountability)
2. Restructure phase instructions to decision-based format (high impact)
3. Add phase guardrails at boundaries (reinforces behavior)
4. Update planning checklist with phase evaluation (long-term enforcement)

**Expected outcome:**
With these fixes, the Planner agent will:
- Explicitly evaluate each phase
- Document all phase decisions
- Provide consistent, comprehensive plans
- Eliminate the need for user reminders

---

**Document created:** 2026-01-20
**Author:** AI Analysis based on Planner agent configuration
**Related files:**
- `/Users/ales/personal/praigmatic/.opencode/agent/pragmatic-planner.md`
- `/Users/ales/personal/praigmatic/.opencode/reference/planning-guide.md`
- `/Users/ales/personal/praigmatic/.opencode/plans/archive/plan-file-only-refactor-2026-01-20.md`
