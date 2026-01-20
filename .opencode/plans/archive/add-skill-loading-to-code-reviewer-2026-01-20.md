# Add Skill Loading to Pragmatic Code Reviewer

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** This is a modification to an existing agent file that we've already analyzed. The current state of pragmatic-code-reviewer.md and pragmatic-developer.md is well-understood, and we have context on available skills (go-backend-developer).

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** The requirement is clear: add skill loading capability to pragmatic-code-reviewer similar to pragmatic-developer. The user wants to know if it's a good idea (answered above) and wants a plan for implementation.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Small

### Phase 4: Research
**Decision:** SKIP
**Rationale:** The implementation approach is straightforward - copy the skill loading pattern from pragmatic-developer and adapt it for the reviewer's workflow. No new technologies or libraries are involved.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted, so no synthesis needed. The approach is directly based on the existing pragmatic-developer pattern.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 3
**Task size distribution:** Small: 3, Medium: 0, Large: 0

## Tasks

- [x] **Add skill permissions to agent config** (Small)
  - Add `skill: "*": allow` section under `permission:` in YAML frontmatter
  - Verify `skill: true` is already present in `tools:` section (it is)
  - Where: `/Users/ales/personal/praigmatic/.opencode/agent/pragmatic-code-reviewer.md` lines 4-9
  - Dependencies: None

- [x] **Add skill loading section to agent documentation** (Small)
  - Where: `/Users/ales/personal/praigmatic/.opencode/agent/pragmatic-code-reviewer.md`
  - Add "Skill Loading - ENFORCED (MEDIUM)" section after Review Dimensions
  - Include skill loading checklist template (adapted from pragmatic-developer)
  - Add guidance on loading skills based on code being reviewed (Go, TypeScript, Python, etc.)
  - Include documentation template for skill-loaded reviews
  - Dependencies: Task 1

- [x] **Add Phase 1 checkpoint and skill loading workflow** (Small)
  - Where: `/Users/ales/personal/praigmatic/.opencode/agent/pragmatic-code-reviewer.md`
  - Modify Phase 1 to include skill loading as "Step 0"
  - Add Phase 1 Boundary Checkpoint after Phase 1 section
  - Enforce that both skill loading and checkpoint completion are required before Phase 2
  - Dependencies: Task 1, Task 2

## Architecture Overview

This change adds skill loading capability to the pragmatic-code-reviewer agent, enabling it to apply language/framework-specific review criteria in addition to the universal quality standards.

**Current workflow:**
1. Phase 1: Analysis (review changes)
2. Phase 2: Classification (by severity)
3. Phase 3: Reporting (with recommendations)

**New workflow:**
1. Phase 1: Analysis & Skill Loading (identify code characteristics, load relevant skills)
2. Phase 2: Classification (by severity, using skill-specific criteria)
3. Phase 3: Reporting (with recommendations, including skill-specific patterns)

**Key components:**
- Agent config permissions: Allow skill tool usage
- Documentation: Skill loading guidance and checklist templates
- Workflow: Skill loading as mandatory part of Phase 1

## Technical Decisions

- **Decision 1**: Use "ENFORCED (MEDIUM)" instead of "ENFORCED (CRITICAL)" for skill loading
  - Rationale: Code reviewer is advisory-only, not writing code. Skills provide significant value but missing them won't cause catastrophic failures like in development.
  - Trade-offs: Reduced strictness vs. increased flexibility. Developer uses "CRITICAL" because bad code gets deployed; reviewer uses "MEDIUM" because reviewer provides feedback, not code.

- **Decision 2**: Conditional skill loading based on code characteristics
  - Rationale: Not all reviews need skills. Generic reviews can use universal standards. Skills add value for specific languages/frameworks.
  - Trade-offs: Slightly more complex logic vs. avoiding unnecessary skill loads.

- **Decision 3**: Include documentation template when skills are loaded
  - Rationale: Provides transparency about what review criteria were applied and why.
  - Trade-offs: Minor documentation overhead vs. review traceability.

- **Decision 4**: Keep skill loading enforcement at Phase 1 level, not per-task
  - Rationale: Code reviewer typically reviews a batch of changes (staged files or commit range) at once, not individual tasks like developer.
  - Trade-offs: Less granular control vs. simpler workflow.

## Integration Points

**Modified file:**
- `/Users/ales/personal/praigmatic/.opencode/agent/pragmatic-code-reviewer.md`

**Changes:**
1. YAML frontmatter: Add skill permissions
2. Documentation: Add skill loading section
3. Workflow: Expand Phase 1 to include skill loading with checkpoint

**No code changes required** - this is purely documentation and configuration.

**Interaction with developer agent:**
- Developer loads skills before implementation
- Reviewer loads the same skills to evaluate against the same standards
- Consistency between development and review standards

## Security Considerations

- **Skill permissions**: Adding `skill: "*": allow` allows loading any skill. This is safe because:
  - The reviewer agent has `edit: deny` and `write: deny` (cannot modify files)
  - The reviewer agent has `bash: deny` (cannot execute arbitrary commands)
  - Reviewer is advisory-only; cannot make harmful changes even with malicious skill content
- **No new attack surface**: Skills only provide guidance; reviewer cannot execute code from skills

## Testing Strategy

- **Manual testing**: Verify pragmatic-code-reviewer can load skills using the `skill` tool
- **Integration testing**: Test reviewer with Go code changes to verify skill-specific review criteria are applied
- **Verification checklist**:
  - [ ] Agent config has `skill: "*": allow` permission
  - [ ] Agent config has `skill: true` in tools
  - [ ] Documentation includes skill loading section
  - [ ] Phase 1 includes skill loading workflow
  - [ ] Reviewer can successfully load go-backend-developer skill
  - [ ] Reviewer applies Go-specific patterns from skill to code reviews

## Risk Points

- **Risk 1**: Reviewer might skip skill loading due to unclear guidance
  - Mitigation: Clear documentation and mandatory checkpoint
  - Fallback: Reviewer can still provide valuable feedback using universal standards

- **Risk 2**: No skill available for reviewed language/framework
  - Mitigation: Document "No relevant skills found for [language]" in checklist
  - Fallback: Use universal quality standards and security checklist

- **Risk 3**: Skill loading adds overhead to review process
  - Mitigation: Only load one skill per review (the most relevant)
  - Fallback: Review remains fast with minimal overhead

## Dependencies

- Task 2 depends on Task 1 (permissions must be added before workflow documentation)
- Task 3 depends on Task 2 (workflow references skill loading section)
- No external dependencies (no APIs, libraries, or services)

## Implementation Notes

**Pattern from pragmatic-developer to adapt:**

Pragmatic-developer's skill loading section (lines 43-57):
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

**Cannot proceed to Phase 2 without completing this checklist.**
```

**Adapted for reviewer:**
- Change "ENFORCED (CRITICAL)" to "ENFORCED (MEDIUM)" (reviewer is advisory)
- Change "before implementation" to "before code review"
- Change "task type/technology" to "code language/framework"
- Keep checklist format and enforcement rules

**Documentation template for loaded skills:**
```markdown
<!-- Skill loaded: [skill-name] -->
<!-- Applied review criteria: [key patterns from skill, e.g., "Context propagation", "Error wrapping", "Goroutine safety"] -->
```

**Example skill loading for Go code review:**
```markdown
**Skills Attempted:** go-backend-developer
**Skills Loaded:** go-backend-developer

<!-- Skill loaded: go-backend-developer -->
<!-- Applied review criteria: Context propagation, Error wrapping, Table-driven tests, Concurrency safety, Observability patterns -->
```

**Phase 1 workflow for reviewer:**

```markdown
### Phase 1: Analysis & Skill Loading

**Step 1: Analyze the code changes**

- Identify the primary programming language (Go, TypeScript, Python, etc.)
- Identify frameworks/libraries being used (React, Express, Django, etc.)
- Identify patterns being applied (HTTP handlers, database queries, goroutines, etc.)

**Step 2: Load relevant skills**

Based on code characteristics, attempt to load relevant skills via `skill` tool:

```bash
# Example: Loading Go backend skill
skill(name: "go-backend-developer")
```

**Step 3: Complete skill loading checklist**

**Skills Attempted:** [list skills tried]
**Skills Loaded:** [list of successful loads, or "None"]

If no relevant skills found:
- Document: "No relevant skills found for [language] in [context]"

**ENFORCEMENT RULE:**
- If a relevant skill exists for the code being reviewed → MUST load it
- If relevant skill exists but skipped → **FAIL WORKFLOW**
- If no relevant skills exist → Document and proceed with universal standards

### Phase 1 Boundary Checkpoint ✅

Before proceeding to Phase 2, you MUST complete:
- [ ] Code analysis completed (language/framework identified)
- [ ] Skill loading checklist completed (skills attempted + loaded, or documented reason)

**Failure to complete checkpoint will result in incomplete review.**
```

**File structure after changes:**

```
pragmatic-code-reviewer.md
├── YAML frontmatter (with skill permissions)
├── Description
├── Review Dimensions (Security, Performance, Maintainability, Testing)
├── Issue Classification (Critical, High, Medium, Low)
├── Skill Loading - ENFORCED (MEDIUM) ← NEW SECTION
├── Review Process
│   ├── Phase 1: Analysis & Skill Loading ← EXPANDED WITH SKILL LOADING
│   ├── Phase 2: Classification
│   └── Phase 3: Reporting
└── Output Format
```

**Comparison to pragmatic-developer:**

| Aspect | pragmatic-developer | pragmatic-code-reviewer (after change) |
|--------|---------------------|---------------------------------------|
| Skill permissions | ✅ `skill: "*": allow` | ✅ `skill: "*": allow` |
| Skill loading section | ✅ "ENFORCED (CRITICAL)" | ✅ "ENFORCED (MEDIUM)" |
| Skill loading checklist | ✅ Required | ✅ Required |
| Documentation when loaded | ✅ Required | ✅ Required |
| Phase 1 checkpoint | ✅ 3 checkpoints | ✅ 2 checkpoints (no TTD, no security assessment) |
| Enforcement level | CRITICAL (cannot deploy bad code) | MEDIUM (advisory feedback) |

**Key differences explained:**

1. **Critical vs Medium**: Developer writes code that gets deployed → critical to get it right. Reviewer provides feedback on existing code → important but not catastrophic if missed.

2. **Checkpoint count**: Developer has 3 (security, skill loading, TTD). Reviewer has 2 (code analysis, skill loading). Reviewer doesn't need security assessment (that's part of review dimensions) or TTD assessment (reviewer doesn't write tests, only evaluates them).

3. **Focus**: Developer's skill loading is about "how to implement correctly". Reviewer's skill loading is about "what to look for in review".
