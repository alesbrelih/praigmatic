# Planfile Task Granularity Guidelines

## Purpose

This guide provides explicit guidance on how to structure planfiles with the right level of detail - balancing human readability with agent executability.

## Core Philosophy

### The Golden Rules

**1. Plans are for Humans AND Agents**
- **Humans:** Need context, decisions, rationale (the "why")
- **Agents:** Need structure, steps, files (the "what" and "how")
- **Balance:** Write for human review, format for agent parsing

**2. Right Level of Abstraction**
- **Too high:** "Add authentication" (agent doesn't know where to start)
- **Too low:** "Create file, import library, write function X" (micromanagement)
- **Just right:** "Implement JWT middleware with validation and user context" + 4-6 step breakdown

**3. Plans Evolve, Todos Execute**
- **Plan file:** Living document, updated as blockers emerge or scope changes
- **Todos:** Execution tracking, marked completed as work progresses
- **Sync:** Plan checkboxes ↔ todo status (both stay updated)

**4. Decision Documentation is Permanent**
- **Why we chose X over Y:** Critical for future maintainers
- **What we considered:** Shows rigor, helps avoid rehashing debates
- **Trade-offs:** Honest assessment of what we're giving up

**5. Verification is Non-negotiable**
- Every plan must include **Success Criteria** section
- Must be testable: "All tests pass" > "Code works"
- Must be complete: Unit + integration + manual testing

---

## Task Size Boundaries

| Size | Time Estimate | Subtask Count | Example |
|------|---------------|---------------|---------|
| **Small** | <1hr | 1-3 implementation steps | Add validation to existing endpoint |
| **Medium** | 1-4hr | 4-8 implementation steps | Implement JWT auth middleware |
| **Large** | 4-8hr | 8-15 implementation steps | Build complete OAuth2 flow |
| **XL** | >8hr | Split into multiple tasks | Should be decomposed further |

---

## Task Detail Formula

Each task should contain:

1. **What** (1 line): Clear deliverable
2. **Why** (0-1 line): Business/technical justification (optional for obvious tasks)
3. **How** (3-6 bullets): High-level implementation steps
4. **Where** (1 line): Primary files to modify
5. **Dependencies** (0-2 lines): What must be done first (if any)

### Example - Good Task Granularity

```markdown
- [ ] **Implement JWT authentication middleware** (TTD_REQUIRED) (MEDIUM)
  - Purpose: Secure API endpoints with token-based authentication
  - Steps:
    1. Create middleware in `internal/auth/jwt_middleware.go`
    2. Parse and validate JWT from Authorization header
    3. Extract user context and attach to request
    4. Return 401 for invalid/missing tokens
    5. Write table-driven tests for valid/invalid/expired tokens
  - Files: `internal/auth/jwt_middleware.go`, `internal/server/routes.go`
  - Dependencies: JWT library selection (Task 1)
```

### Example - Too Granular (Anti-pattern)

```markdown
❌ BAD: Micromanagement
- [ ] Import jwt-go library
- [ ] Create jwt_middleware.go file
- [ ] Write parseToken function
- [ ] Write validateToken function
- [ ] Add error handling
- [ ] Write tests
```

### Example - Too Sparse (Anti-pattern)

```markdown
❌ BAD: Insufficient guidance
- [ ] Add authentication
- [ ] Fix bug
- [ ] Update docs
```

---

## The Planfile Balance Problem

```
Too Sparse                    ✓ OPTIMAL                      Too Detailed
------------                  -----------                    ------------
- [ ] Add auth               - [ ] Implement JWT auth       - [ ] Import jwt library
- [ ] Fix bug                  middleware (TTD_REQUIRED)    - [ ] Create jwt.go file
- [ ] Update docs              (MEDIUM)                     - [ ] Write parseToken func
                               - Validate token in           - [ ] Write validateToken
                                 Authorization header        - [ ] Write refreshToken
                               - Return 401 for invalid      - [ ] Add error handling
                               - Add user context to         - [ ] Write unit tests
                                 request                     - [ ] Write integration tests
                                                             - [ ] Update middleware chain
                                                             - [ ] Add logging
```

---

## Decision Documentation Depth

### Include in Planfile

✅ **Technical Decisions:** Why X over Y? (JWT vs session, Postgres vs MongoDB)
✅ **Architecture Choices:** Middleware pattern, repository layer, service structure
✅ **Risk Mitigation:** Security considerations, performance bottlenecks, edge cases
✅ **Integration Points:** How new code connects to existing systems
✅ **Testing Strategy:** What needs testing and why

### Exclude from Planfile

❌ **Copy-pasted code snippets** (reference patterns in docs instead)
❌ **Exact variable/function names** (developer decides based on context)
❌ **Framework boilerplate** (assumed knowledge)
❌ **Obvious steps** ("Import library" - developer knows this)
❌ **Implementation order** (developer determines based on dependencies)

---

## When to Split Tasks

### Split if

- Task has >10 implementation steps
- Task requires multiple people
- Task has natural pause points (e.g., "implement feature" then "write docs")
- Task mixes different TTD requirements (some need TTD, some don't)

### Keep together if

- Steps are tightly coupled (can't test one without the other)
- Splitting would create artificial boundaries
- Total time is <4 hours

---

## Recommended Planfile Template

```markdown
# [Feature Name] Implementation Plan

## Context
[1-2 paragraphs: What problem does this solve? Why now?]

## Tasks
- [ ] **Task 1 Name** (TTD_STATUS) (SIZE)
  - Purpose: [Why this task matters]
  - Steps: [3-6 high-level implementation steps]
  - Files: [Primary files to modify]
  - Dependencies: [If any]

[Repeat for 3-10 tasks total]

## Architecture Overview
[Diagram or description of how components interact]

## Technical Decisions

### Decision 1: [Choice Made]
- **Options Considered:** A, B, C
- **Selected:** B
- **Rationale:** [Why B over A/C?]
- **Trade-offs:** [What we're giving up]

[Repeat for 2-5 key decisions]

## Integration Points
- **Existing System A:** How we connect
- **Existing System B:** Data flow
- **External Service C:** API contract

## Security Considerations
- [Specific security requirement 1]
- [Specific security requirement 2]
- [Auth/validation/sanitization strategy]

## Testing Strategy
- **Unit Tests:** [What functions/modules]
- **Integration Tests:** [What workflows]
- **Manual Testing:** [What to verify end-to-end]

## Risk Points & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Database migration fails | Medium | High | Test on staging, have rollback plan |
| Performance degradation | Low | Medium | Add monitoring, load test before deploy |

## Dependencies
- **External:** [Libraries, services, APIs]
- **Internal:** [Other tasks, team members]

## Success Criteria
- [ ] All tests pass
- [ ] Code review approved (score ≥7)
- [ ] Manual testing completed
- [ ] Documentation updated
```

---

## Verification Tests

After creating a plan, test with these scenarios:

### 1. Simple Task Test
**Input:** "Fix typo in README"
**Expected:**
- 1 task
- NO_TTD
- <10 lines in planfile
- Completion time: <15 minutes

### 2. Medium Task Test
**Input:** "Add rate limiting to API"
**Expected:**
- 2-3 tasks
- TTD_REQUIRED
- ~50 lines in planfile
- Clear technical decisions documented

### 3. Complex Task Test
**Input:** "Implement OAuth2 authentication"
**Expected:**
- 6-10 tasks
- Mixed TTD requirements
- ~200 lines in planfile
- Complete architecture overview
- All integration points documented

### Success Criteria

✅ Plans are readable in <2 minutes
✅ Developers can start implementing without asking questions
✅ All technical decisions are documented
✅ Tasks are appropriately sized (80% are SMALL/MEDIUM)
✅ Verification section is complete and testable

---

## Common Pitfalls

### Pitfall 1: Over-specification
**Problem:** Plan contains exact code snippets and variable names
**Solution:** Reference patterns, let developer choose implementation details

### Pitfall 2: Under-specification
**Problem:** Tasks like "Add authentication" with no guidance
**Solution:** Break down into 4-6 concrete steps with file references

### Pitfall 3: Missing Context
**Problem:** Tasks exist without explaining WHY or HOW they fit together
**Solution:** Add Context section and Architecture Overview

### Pitfall 4: No Verification
**Problem:** Plan has no clear success criteria
**Solution:** Add testable Success Criteria section

### Pitfall 5: Assuming Knowledge
**Problem:** Plan assumes developer knows specific patterns or tools
**Solution:** Reference relevant docs in tool-patterns.md or provide brief explanation

---

## Quick Reference Checklist

Before finalizing a plan, verify:

- [ ] Each task is sized appropriately (SMALL/MEDIUM/LARGE)
- [ ] Tasks include 3-6 implementation steps
- [ ] Primary files to modify are listed
- [ ] Dependencies between tasks are clear
- [ ] Technical decisions are documented with rationale
- [ ] Security considerations are addressed
- [ ] Testing strategy is defined
- [ ] Success criteria are testable
- [ ] Plan is readable in <2 minutes
- [ ] No copy-pasted code snippets (patterns only)
- [ ] Context section explains the "why"

---

## Related Documents

- [TTD Criteria](./ttd-criteria.md) - When to require Test-Driven Development
- [Code Quality Standards](./code-quality.md) - Quality expectations
- [Security Checklist](./security-checklist.md) - Security requirements
- [Tool Patterns](./tool-patterns.md) - Common implementation patterns
