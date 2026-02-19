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

**3. Plan File Tracks Both Planning AND Execution**
- **Plan file:** Single source of truth for task definitions AND execution state
- **Execution tracking:** Plan checkboxes mark progress (`- [ ]` → `- [x]`)
- **No synchronization:** One file eliminates dual-tracking complexity

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

| Size | Step Count | Example |
|------|------------|---------|
| **Small** | 1-3 steps | Add validation to existing endpoint |
| **Medium** | 4-8 steps | Implement JWT auth middleware |
| **Large** | 9-15 steps | Build complete OAuth2 flow |
| **Split** | >15 steps | Should be decomposed into smaller tasks |

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
- [ ] **Implement JWT authentication middleware** (MEDIUM)
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
- [ ] Fix bug                  middleware (MEDIUM)          - [ ] Create jwt.go file
- [ ] Update docs              - Validate token in           - [ ] Write parseToken func
                                  Authorization header        - [ ] Write validateToken
                                - Return 401 for invalid      - [ ] Write refreshToken
                                - Add user context to         - [ ] Add error handling
                                  request                     - [ ] Write unit tests
                                                              - [ ] Write integration tests
                                                              - [ ] Update middleware chain
                                                              - [ ] Add logging
```

---

## Execution Workflow

**Plan-file-only approach:**

1. User types `/pragmatic-implementation`
2. Command reads plan file
3. Finds first unchecked task (`- [ ]`)
4. Agent implements task
5. Plan checkbox updated to `- [x]`
6. Changes committed
7. Repeat for next unchecked task

**No separate todo system needed** - plan file is single source of truth.

---

## Plan Review Loop Workflow

**Automated quality review (Phase 7):**

1. Planner writes initial plan to `.opencode/plans/[feature].md`
2. Planner invokes pragmatic-plan-reviewer with full plan content
3. Reviewer evaluates plan against quality criteria:
   - Logic & Coherence (dependencies, sequencing)
   - Simplicity vs Overengineering (appropriate complexity)
   - Task Granularity (80% Small/Medium tasks)
   - Completeness (testing, security, integration points)
   - Phase Decisions Quality (rationale provided)
4. If Critical/High issues found:
   - Planner revises plan to address issues
   - Re-invoke reviewer (max 3 attempts)
5. If no Critical/High issues OR max retries reached:
   - Present plan to user for feedback
   - User approves or requests changes
6. Approved plan is ready for implementation

**Key Points:**
- Max 3 revision attempts (initial + 2 fixes)
- Only Critical/High issues block progression
- Medium/Low issues are advisory only
- User ultimately approves regardless of review outcome

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

### Keep together if

- Steps are tightly coupled (can't test one without the other)
- Splitting would create artificial boundaries

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

- [TDD Criteria](./tdd-criteria.md) - When to require Test-Driven Development
- [Code Quality Standards](./code-quality.md) - Quality expectations
- [Security Checklist](./security-checklist.md) - Security requirements
- [Tool Patterns](./tool-patterns.md) - Plan file handling patterns
