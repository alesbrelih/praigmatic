<!--
Source of truth for plan structure.
Mirrored in pragmatic-planner.md for convenience.
-->

# [Feature Name] Implementation Plan

## Purpose

[1-2 sentences: What problem does this plan solve? What value does it deliver?]

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** [RUN/SKIP]
**Rationale:** [Why this choice was made]
[If RUN: Brief summary of exploration findings]

### Phase 2: Clarification
**Decision:** [RUN/SKIP]
**Rationale:** [Why this choice was made]
[If RUN: List questions asked and key answers received]

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** [List or "None"]
**Complexity assessment:** [Small/Medium/Large]

### Phase 4: Research
**Decision:** [RUN/SKIP]
**Rationale:** [Why this choice was made]
[If RUN: List research areas and key findings]

### Phase 5: Synthesis
**Decision:** [RUN/SKIP]
**Rationale:** [Why this choice was made]
[If RUN: List key decisions made and risks identified]

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** [Number]
**Task size distribution:** [Small: X, Medium: Y, Large: Z]

## Tasks

- [ ] **[Task 1 Name]** (SIZE)
  - Purpose: [What this task achieves and its role in the larger plan]
  - Steps:
    - [Implementation step 1]
    - [Implementation step 2]
    - [Implementation step 3]
  - Files: [Primary files to modify]
  - Dependencies: [If any]

- [ ] **[Task 2 Name]** (SIZE)
  - Purpose: [What this task achieves and its role in the larger plan]
  - Steps:
    - [Implementation step 1]
    - [Implementation step 2]
    - [Implementation step 3]
  - Files: [Primary files to modify]
  - Dependencies: [If any]

- [ ] **[Task 3 Name]** (SIZE)
  - Purpose: [What this task achieves and its role in the larger plan]
  - Steps:
    - [Implementation step 1]
    - [Implementation step 2]
    - [Implementation step 3]
  - Files: [Primary files to modify]
  - Dependencies: [If any]

## Architecture Overview
[How this feature fits into the existing system]
[Key components and their relationships]

## Technical Decisions
- **Decision 1**: [Choice made]
  - Rationale: [Why this choice]
  - Trade-offs: [What we're giving up]

- **Decision 2**: [Choice made]
  - Rationale: [Why this choice]
  - Trade-offs: [What we're giving up]

## Integration Points
[Where code will be added or modified]
[Affected files and components]
[API contracts or interfaces]

## Security Considerations
- **[Security Concern 1]**
  - Risk: [What could go wrong]
  - Mitigation: [How we address it]

- **[Security Concern 2]**
  - Risk: [What could go wrong]
  - Mitigation: [How we address it]

## Testing Strategy
- **Unit Tests**: [What to test and approach]
- **Integration Tests**: [What to test and approach]
- **Edge Cases**: [Specific scenarios to verify]

## Risk Points
- **[Risk 1]**: [Description]
  - Mitigation: [How to address]
  - Fallback: [What to do if it fails]

- **[Risk 2]**: [Description]
  - Mitigation: [How to address]
  - Fallback: [What to do if it fails]

## Dependencies
- Task X depends on Task Y completing first
- Tasks A & B can run in parallel after Task C
- External dependencies: [APIs, libraries, services]

## Implementation Notes
[Additional context that helps implementation]
[Code patterns to follow]
[Examples from existing codebase]

---

## Task Format Guidelines

**Task format in plan:**
- Use markdown checkboxes: `- [ ]` for pending, `- [~]` for in-progress, `- [x]` for completed
  - Note: `[~]` is set by pragmatic-developer when starting a task, enabling resume after context loss
- Bold task name: `**Task Name**`
- Metadata in parentheses: `(SIZE)`
  - SIZE: "Small" (<1hr), "Medium" (1-4hr), or "Large" (4hr+)
- Purpose: [Required] What this task achieves and its role in the larger plan
- Steps: 3-6 high-level implementation steps
- Files: Primary files to modify
- Dependencies: What must be done first (if any)
- Provides for Future Tasks: What this task exposes/creates that future tasks will use
- Needs from Previous Tasks: What this task expects previous tasks to have provided

**CRITICAL: Purpose Documentation for Code Review**

Always include clear purpose at both levels:

**Plan-level Purpose (top of file):**
- What problem are we solving overall?
- What value does this plan deliver?
- Helps reviewer understand the big picture

**Task-level Purpose (per task):**
- What does this specific task accomplish?
- Why is this task necessary?
- Helps reviewer focus on what matters (e.g., documentation tasks → focus on clarity not code style)

Without purpose documentation, code reviewers may:
- Review irrelevant aspects (e.g., critiquing Go code when reviewing documentation)
- Miss the actual goal of changes
- Provide feedback that doesn't align with task objectives

When developer passes changes to reviewer, they include both:
1. Plan purpose (overall context)
2. Task purpose (what this specific change achieves)
