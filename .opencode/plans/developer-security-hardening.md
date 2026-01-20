# Pragmatic Developer Security & Enforcement Hardening Plan

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** RUN
**Rationale:** Needed to understand existing permission patterns from other agents and pragmatic-implementation command workflow to ensure consistency when implementing restrictions.

**Summary:** Examined pragmatic-planner (edit/write: ask), pragmatic-code-reviewer (read-only), pragmatic-committer (command-only). Identified that pragmatic-developer is significantly more permissive than other agents. Also discovered pragmatic-implementation already includes git state pre-flight check.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Request is clear and specific - use "ask" permission mode for write/edit/bash instead of complex allowlists, while keeping workflow enforcement gaps (Security Assessment, TTD Justification, Skill Loading, Health Check, Plan Verification).

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None - approach is straightforward (change allow→ask, add workflow gates)
**Complexity assessment:** Small

### Phase 4: Research
**Decision:** SKIP
**Rationale:** No research needed - approach is simple permission mode changes to "ask" (no complex allowlists), and workflow gates are straightforward additions.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research conducted, no synthesis needed.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 6
**TTD_REQUIRED tasks:** 6 (all security/enforcement workflow changes require testing)
**NO_TTD tasks:** 0
**Task size distribution:** Small: 4, Medium: 2

## Tasks

- [x] **Change file write permission to ask** (TTD_REQUIRED) (Small)
  - Update YAML frontmatter: change `write: allow` to `write: ask`
  - This requires human approval before agent writes any files
  - Where: `.opencode/agent/pragmatic-developer.md` (frontmatter, line 6)

- [x] **Change file edit permission to ask** (TTD_REQUIRED) (Small)
  - Update YAML frontmatter: change `edit: allow` to `edit: ask`
  - This requires human approval before agent edits any files
  - Where: `.opencode/agent/pragmatic-developer.md` (frontmatter, line 5)

- [x] **Change bash permission to ask** (TTD_REQUIRED) (Small)
  - Update YAML frontmatter: change `bash: allow` to `bash: ask`
  - This requires human approval before agent runs any commands
  - Where: `.opencode/agent/pragmatic-developer.md` (frontmatter, line 7)

- [x] **Implement Security Assessment Gate in Phase 1** (TTD_REQUIRED) (Medium)
  - Add new step "4. Security Assessment (MANDATORY)" after TTD assessment
  - Require reading security-checklist.md before implementation
  - Force agent to identify security requirements and document mitigation strategy
  - Add fail condition: If task involves PII/money/auth, MUST use TTD
  - Where: `.opencode/agent/pragmatic-developer.md` (Phase 1: Analysis section, lines 51-57)

- [x] **Enforce Skill Loading with Verification** (TTD_REQUIRED) (Medium)
  - Replace "ALWAYS try" with "MUST load/use relevant skills"
  - Add mandatory documentation step before Phase 2
  - Require: Skills attempted, Skills loaded, or "None"
  - Add enforcement: If relevant skill exists but skipped → FAIL workflow
  - Where: `.opencode/agent/pragmatic-developer.md` (Skill Loading section, lines 43-47)

- [ ] **Add Mandatory TTD Justification** (TTD_REQUIRED) (Medium)
  - Create "TTD Assessment (MANDATORY)" section before Phase 2
  - Require 4 answers: TTD status, applicable criteria, justification (2-3 sentences), special cases
  - Add fail condition: If justification missing → cannot proceed to Phase 2
  - Where: `.opencode/agent/pragmatic-developer.md` (after Phase 1, before Phase 2)

## Architecture Overview

This hardening addresses the pragmatic-developer agent's security vulnerabilities and enforcement gaps by:

1. **Permission Model Change**: From unrestricted allow to human approval ("ask" mode)
2. **Workflow Gates**: New security gates and documentation enforcement in Phase 1
3. **Simplified Approach**: No complex allowlists or command validation - human makes all approval decisions

### Security Model

```
┌─────────────────────────────────────────┐
│ Layer 1: Permission Controls            │
│   - write: ask (human approves writes)   │
│   - edit: ask (human approves edits)     │
│   - bash: ask (human approves commands)  │
└───────────────┬─────────────────────────┘
                │
┌───────────────▼─────────────────────────┐
│ Layer 2: Workflow Security Gates         │
│   - Security assessment (Phase 1)        │
│   - TTD justification                   │
│   - Skill loading enforcement            │
└─────────────────────────────────────────┘
```

### Benefits of "Ask" Mode

- **Simple**: No complex allowlists to maintain
- **Safe**: Human makes all sensitive decisions
- **Flexible**: Can approve any action on case-by-case basis
- **Transparent**: Human sees exactly what agent is doing
- **Fast to implement**: Just change permission flags

## Technical Decisions

- **Decision 1: Human Approval ("ask") Permission Model**
  - Rationale: Simplest approach - human makes all write/edit/bash decisions; no complex allowlists to maintain
  - Trade-offs: Slower (requires human approval for each action) but safest and most flexible
  - Mitigation: Batch approvals when possible; use clear commit messages for context

- **Decision 2: No Complex Allowlists**
  - Rationale: Maintaining allowlists is error-prone and requires constant updates; "ask" mode handles all cases
  - Trade-offs: Less granular control, but human provides context-aware approvals
  - Mitigation: Human can make exception decisions based on task context

- **Decision 3: Security Gate in Phase 1**
  - Rationale: Pre-check pattern catches security issues before implementation begins
  - Trade-offs: Adds workflow step (increases analysis time by 1-2 minutes)
  - Mitigation: Only requires checklist review, not full security audit

- **Decision 4: Skip Git Pre-Check in Agent**
  - Rationale: pragmatic-implementation command already has pre-flight git state check (Step 1.5)
  - Trade-offs: Redundant checks if added to agent
  - Mitigation: Rely on pragmatic-implementation's existing check

## Integration Points

**File: `.opencode/agent/pragmatic-developer.md`**

**Modified Sections:**
1. **Frontmatter (lines 4-7)**: Change write/edit/bash permissions from `allow` to `ask`
2. **Skill Loading (lines 43-47)**: Enforce mandatory skill loading
3. **Phase 1: Analysis (lines 51-57)**: Add security assessment gate
4. **Between Phase 1 & 2**: Add mandatory TTD justification section

**New Sections:**
- Security Assessment (in Phase 1)
- TTD Assessment (between Phase 1 & 2)

**No changes needed in:**
- Other agent configuration files
- pragmatic-implementation command (already has git pre-flight check)
- Reference documents (security-checklist.md, ttd-criteria.md)

## Security Considerations

### Critical Security Vulnerabilities Addressed

**1. Unrestricted File Write Access**
- Risk: Agent could modify system files, credentials, other agent configurations
- Mitigation: Changed `write: allow` to `write: ask` - human must approve all writes
- Test: Verify agent prompts for approval before writing any file

**2. Unrestricted File Edit Access**
- Risk: Agent could modify critical files (configs, other agents, etc.)
- Mitigation: Changed `edit: allow` to `edit: ask` - human must approve all edits
- Test: Verify agent prompts for approval before editing any file

**3. Unrestricted Bash Access**
- Risk: Agent could run destructive commands (`rm -rf /`, `sudo`, etc.)
- Mitigation: Changed `bash: allow` to `bash: ask` - human must approve all commands
- Test: Verify agent prompts for approval before running any command

**4. No Security Enforcement**
- Risk: Security checklist exists but isn't mandatory
- Mitigation: Add security assessment gate to Phase 1
- Test: Verify agent fails to proceed without security assessment

### Workflow Security Risks

**5. TTD Self-Policing**
- Risk: Agent could incorrectly choose NO_TTD to avoid writing tests
- Mitigation: Require documented justification and special case review
- Test: Verify agent cannot proceed without TTD justification

**6. Skill Loading Gaps**
- Risk: Agent could skip relevant skills, missing important patterns
- Mitigation: Enforce mandatory skill loading with failure if skipped
- Test: Verify agent fails if relevant skill exists but not loaded

**Note: Git State Risk**
- Risk: Agent could work on uncommitted changes, corrupting existing work
- Mitigation: Already handled by pragmatic-implementation command's pre-flight check (Step 1.5)
- Test: Verify pragmatic-implementation fails when git is dirty

## Testing Strategy

### Unit Tests

**Permission Mode Tests:**
- Test agent prompts for approval when writing files (write: ask)
- Test agent prompts for approval when editing files (edit: ask)
- Test agent prompts for approval when running commands (bash: ask)
- Test agent cannot proceed without human approval

### Integration Tests

**Workflow Security Gate Tests:**
- Test agent fails Phase 1 without security assessment
- Test agent cannot proceed without TTD justification
- Test agent fails when relevant skill exists but not loaded
- Test agent can proceed when all security gates are completed

**End-to-End Tests:**
- Simulate PII/money/auth task → verify TTD is forced in security gate
- Test skill loading enforcement with relevant skill available (must load)
- Test skill loading enforcement with no relevant skills (must document "None")
- Test human approval flow for write/edit/bash operations
- Verify all three gates must pass before Phase 2: Security Assessment + TTD Justification + Skill Loading

### Edge Cases

- Test agent behavior when human denies approval
- Test agent behavior when TTD justification is incomplete
- Test agent behavior when skill loading documentation is missing
- Test agent behavior with multiple security gates in sequence

## Risk Points

- **Risk 1: Human Approval Slows Development**
  - Mitigation: Batch approvals when possible; use clear commit messages for context
  - Fallback: No fallback - this is the intended security model

- **Risk 2: Human Fatigue Leads to Click-Through Approvals**
  - Mitigation: Agent provides context for each approval (file path, command, justification)
  - Fallback: Consider adding "dangerous action" warnings for sensitive operations

- **Risk 3: Workflow Security Gate Slows Development**
  - Mitigation: Security check is just checklist review, not full audit (1-2 minutes)
  - Fallback: Document that gates can be skipped for emergency fixes with admin override

- **Risk 4: No Automated Protection After Approval**
  - Mitigation: Human provides context-aware decisions that automated rules cannot match
  - Fallback: Consider adding optional "dangerous operation" warnings for risky actions

- **Risk 5: Skill Loading May Be Incomplete**
  - Mitigation: Agent must document "None" if no skills found; prevents silent failures
  - Fallback: Human can ask agent to load specific skills if missing

## Dependencies

- Task 1 (write: ask) can run independently
- Task 2 (edit: ask) can run independently
- Task 3 (bash: ask) can run independently
- Task 4 (security gate) can run independently
- Task 5 (skill enforcement) can run independently
- Task 6 (TTD justification) can run independently

**Parallelization:** All 6 tasks can run in parallel as they modify different sections of the same file.

**Order Recommendation:**
1. Implement permission mode changes (Tasks 1-3) first - these are the most critical security fixes
2. Implement workflow enforcement (Tasks 4-6) second - these add process controls

**External Dependencies:** None - all changes are within `.opencode/agent/pragmatic-developer.md`

## Implementation Notes

### Permission Mode Changes

Change from:
```yaml
permission:
  edit: allow
  write: allow
  bash: allow
```

To:
```yaml
permission:
  edit: ask
  write: ask
  bash: ask
```

This is a simple 3-line change in the frontmatter section.

### Security Gate Implementation

Add after TTD assessment in Phase 1 (around line 57):

```markdown
**Step 4: Security Assessment (MANDATORY)**

Before proceeding to Phase 2:
1. Read `.opencode/reference/security-checklist.md`
2. Identify security requirements for this task:
   - Does this task handle PII? [Y/N]
   - Does this task involve money/financial data? [Y/N]
   - Does this task modify authentication/authorization? [Y/N]
   - Does this task handle user input? [Y/N]
3. Document mitigation strategy for each identified risk
4. **FAIL CONDITION:** If any of the above are YES, task MUST use TTD
5. Cannot proceed to Phase 2 without completing this assessment
```

### TTD Justification Template

Add between Phase 1 and Phase 2 (around line 66):

```markdown
## TTD Assessment (MANDATORY)

Before Phase 2, complete this assessment:

**Task:** [Task name from plan]
**TTD Decision:** [TTD_REQUIRED / NO_TTD]

**Criteria from `.opencode/reference/ttd-criteria.md`:**
- [ ] Business logic
- [ ] API handlers
- [ ] Data processing
- [ ] Input validation
- [ ] Authentication/authorization
- [ ] State management
- [ ] Database queries

**Justification:** [2-3 sentences explaining why TTD or NO_TTD was chosen]

**Special Cases Considered:** [Y/N]
If YES, list special cases and how they were addressed:
- Volatile logic: [explain]
- Performance-critical: [explain]
- External dependencies: [explain]
- Money/PII/security data: [explain]
- Expensive debugging: [explain]

**Cannot proceed to Phase 2 without completing this assessment.**
```

### Skill Loading Enforcement

Change from "ALWAYS try" to (around line 43-47):

```markdown
## Skill Loading - ENFORCED (CRITICAL)

**MUST load/use relevant skills before implementation.**

**Before Phase 2, complete this checklist:**

**Skills Attempted:** [list skills tried, e.g., "go-backend-developer", "ts-testing"]
**Skills Loaded:** [list of successful loads, or "None"]

**ENFORCEMENT RULE:**
- If a relevant skill exists for your task type/technology → MUST load it
- If relevant skill exists but skipped → **FAIL WORKFLOW**
- If no relevant skills exist → Document: "No relevant skills found for [task type] in [technology]"

**Relevant Skills by Task Type:**
- Go backend → `go-backend-developer`
- TypeScript frontend → `ts-frontend-developer`
- Testing → [language-specific testing skill]
- API development → [language-specific API skill]

**Cannot proceed to Phase 2 without completing this checklist.**
```

### Testing the Hardened Agent

After implementing all changes, test with these scenarios:

**Test 1: Permission Mode (write: ask)**
```
User: "Create new file in src/"
Expected: Agent prompts for human approval before writing
```

**Test 2: Permission Mode (edit: ask)**
```
User: "Edit existing file in src/"
Expected: Agent prompts for human approval before editing
```

**Test 3: Permission Mode (bash: ask)**
```
User: "Run tests with go test"
Expected: Agent prompts for human approval before running command
```

**Test 4: Security Gate**
```
User: "Implement auth system" (no security assessment provided)
Expected: Agent fails at security gate, requires assessment first
```

**Test 5: TTD Enforcement**
```
User: "Implement payment processing" (no TTD justification provided)
Expected: Agent fails at TTD gate, requires justification first
```

**Test 6: Skill Loading**
```
User: "Write Go backend code" (go-backend-developer skill available but not loaded)
Expected: Agent fails skill enforcement, must load skill first
```

**Test 7: Git State (via pragmatic-implementation)**
```
User: Run /pragmatic-implementation with uncommitted changes
Expected: pragmatic-implementation fails pre-flight check (Step 1.5)
```

### Rollback Plan

If any change causes issues:

1. **Revert frontmatter changes**: Change `ask` back to `allow` for write/edit/bash
2. **Remove new workflow steps**: Delete added sections (security gate, TTD justification)
3. **Restore skill loading**: Change "ENFORCED" back to "ALWAYS try"
4. **Test agent**: Verify agent functions normally again

**Backup Strategy:**
- Create backup branch before editing: `git branch backup-developer-hardening`
- Commit each task separately for easy rollback
- Document changes in commit messages
