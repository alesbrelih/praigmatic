# Restructure Go Backend Developer Skill

## Purpose

Transform the Go backend developer skill from a human-focused tutorial (1339 lines) to an agent-optimized pattern reference (~200 lines) that focuses on decisions and patterns while eliminating duplication with the assets/ templates.

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** I've already reviewed all files in the skill directory. The current structure and issues are well-understood: 1339-line SKILL.md with extensive examples that duplicate the template files in assets/.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Requirements are clear from the previous discussion:
- Reduce SKILL.md from 1339 lines to ~200 lines
- Remove duplication between SKILL.md and assets/
- Focus on patterns and decisions, not tutorials
- Keep assets/ unchanged (they're good reference implementations)
- Reference assets/ for full examples instead of duplicating

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None
**Complexity assessment:** Small

### Phase 4: Research
**Decision:** SKIP
**Rationale:** No research needed. The problem and solution are clear:
- Current structure is documented and reviewed
- Best practices for agent skills are understood (concise, decision-oriented)
- Template files are already well-structured and production-ready
- This is a reorganization/editing task, not a technical research task

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research was conducted (Phase 4 skipped), so no synthesis needed. The restructuring strategy is straightforward: remove tutorial content, keep pattern guidance, reference assets/.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 5
**Task size distribution:** Small: 5, Medium: 0, Large: 0

## Tasks

- [x] **Analyze current SKILL.md structure and identify sections** (Small)
  - Purpose: Map current sections to what should be kept/removed to guide the rewrite
  - Steps:
    - Review all section headers in current SKILL.md
    - Identify which sections are tutorial/explanatory (remove)
    - Identify which sections are pattern/decision guidance (keep but condense)
    - Create mapping of kept sections → assets/ file references
  - Files: .opencode/skills/go-backend-developer/SKILL.md
  - Dependencies: None

- [x] **Create new concise SKILL.md with pattern-focused structure** (Small)
  - Purpose: Write a ~200-line agent-optimized SKILL.md that references assets/ instead of duplicating
  - Steps:
    - Create new SKILL.md file with sections: When to Use, Layer Architecture, Key Patterns (referencing assets), Best Practices, Commands, Common Issues
    - Write concise descriptions for each key pattern (1-2 sentences each)
    - Add references to specific template files for full implementations
    - Include decision points (when to use X vs Y)
    - Add common pitfalls to avoid
  - Files: .opencode/skills/go-backend-developer/SKILL.md (write new)
  - Dependencies: Task 1

- [x] **Verify all template files in assets/ are complete and working** (Small)
  - Purpose: Ensure the template references in new SKILL.md point to well-structured, working examples
  - Steps:
    - Review each template file for completeness
    - Verify each template has proper error handling
    - Check that all templates use consistent patterns
    - Ensure all templates include working tests
  - Files: .opencode/skills/go-backend-developer/assets/*.go
  - Dependencies: None (can run in parallel with Task 1)

- [x] **Test skill loading with new SKILL.md** (Small)
  - Purpose: Verify the skill can be loaded properly by the agent system with the new structure
  - Steps:
    - Use skill tool to load the skill
    - Verify frontmatter metadata is intact
    - Check that description and keywords are preserved
    - Ensure all sections render correctly
  - Files: .opencode/skills/go-backend-developer/SKILL.md
  - Dependencies: Task 2

- [x] **Update README or documentation if needed** (Small)
  - Purpose: Document the change from tutorial-style to agent-optimized pattern reference
  - Steps:
    - Check if there's a README in the skills directory
    - If present, add note about skill structure optimization
    - If not present, skip this task
  - Files: .opencode/skills/README.md (if exists)
  - Dependencies: Task 4

## Architecture Overview

The restructure follows the "reference over repetition" principle:

```
SKILL.md (agent view)
├── When to Use (decision guidance)
├── Layer Architecture (pattern overview)
├── Key Patterns (concise + references)
│   ├── Context → middleware_template.go
│   ├── Error Handling → handler_template.go
│   ├── Testing → template.go, service_template.go, repository_template.go
│   ├── HTTP Middleware → middleware_template.go
│   ├── Database → repository_template.go
│   ├── Concurrency → (explained concisely)
│   └── Observability → middleware_template.go
├── Best Practices (quick checklist)
├── Commands (essential commands only)
└── Common Issues (pitfalls to avoid)

assets/ (full implementations)
├── template.go (table-driven tests)
├── handler_template.go (HTTP handlers + error patterns)
├── middleware_template.go (all middleware implementations)
├── repository_template.go (database + transactions + sqlmock)
└── service_template.go (business logic + testify/mock)
```

## Technical Decisions

- **Decision 1**: Keep assets/ completely unchanged
  - Rationale: Template files are well-structured, production-ready, and comprehensive
  - Trade-offs: None - these are already excellent

- **Decision 2**: Remove all tutorial-style code examples from SKILL.md
  - Rationale: Assets/ already have full implementations; agents can read those files directly
  - Trade-offs: SKILL.md becomes less useful for human learning, but this is an agent skill

- **Decision 3**: Focus SKILL.md on when/how to use patterns, not how to implement them
  - Rationale: Agents need decision guidance more than implementation details (which are in templates)
  - Trade-offs: SKILL.md won't be self-contained, but references make it maintainable

- **Decision 4**: Keep frontmatter metadata unchanged
  - Rationale: Skill discovery depends on name, description, keywords
  - Trade-offs: None - metadata is already good

## Integration Points

- **SKILL.md**: Complete rewrite, referencing assets/ files
- **assets/template.go**: Referenced for table-driven testing pattern
- **assets/handler_template.go**: Referenced for error handling and HTTP patterns
- **assets/middleware_template.go**: Referenced for all middleware implementations
- **assets/repository_template.go**: Referenced for database patterns and sqlmock
- **assets/service_template.go**: Referenced for business logic and mocking

## Security Considerations

- **Security patterns preserved**: Input validation, error message sanitization, prepared statements remain in templates
- **Risk**: Simplified SKILL.md might miss highlighting security considerations
  - **Mitigation**: Add "Common Issues" section with security pitfalls
- **Risk**: Less explicit guidance might lead agents to skip important patterns
  - **Mitigation**: Keep "Best Practices" section with security-critical points

## Testing Strategy

- **Verification tests**:
  - Skill loads successfully with skill tool
  - Frontmatter metadata is valid
  - All referenced template files exist
  - Template examples compile and tests pass

- **No functional tests needed**: This is documentation restructure, not code changes

## Risk Points

- **Risk 1**: SKILL.md might become too terse, losing useful context
  - **Mitigation**: Keep essential context for each pattern, just remove full implementations
  - **Fallback**: Add more detail if feedback indicates insufficient guidance

- **Risk 2**: Broken references if template files change later
  - **Mitigation**: Use generic references (e.g., "see handler_template.go") not line numbers
  - **Fallback**: Update references if template files are significantly restructured

- **Risk 3**: Agent might not follow references to assets/
  - **Mitigation**: Keep references explicit and file-specific (not "see examples")
  - **Fallback**: Add brief inline examples if agent struggles

## Dependencies

- Task 2 depends on Task 1 (need analysis before writing)
- Task 4 depends on Task 2 (need new SKILL.md before testing)
- Task 1 and Task 3 can run in parallel
- Task 5 depends on Task 4 (verify everything works before documenting)

## Implementation Notes

**Current SKILL.md structure (1339 lines):**
- Frontmatter (6 lines) - KEEP
- Context Patterns (120+ lines) - CONDENSE TO 5-10 lines
- Error Handling (220+ lines) - CONDENSE TO 5-10 lines, REFERENCE handler_template.go
- Table-Driven Tests (25 lines) - KEEP, REFERENCE template.go
- Mocking with gomock (25 lines) - REMOVE (templates use testify/mock)
- Database Mock with sqlmock (18 lines) - REMOVE, REFERENCE repository_template.go
- Database Patterns (200+ lines) - CONDENSE TO 5-10 lines, REFERENCE repository_template.go
- Testing HTTP Handlers (10 lines) - REMOVE, REFERENCE handler_template.go
- HTTP Middleware (250+ lines) - CONDENSE TO 10-15 lines, REFERENCE middleware_template.go
- Concurrency Patterns (300+ lines) - CONDENSE TO 10-15 lines
- Observability Patterns (150+ lines) - CONDENSE TO 5-10 lines, REFERENCE middleware_template.go
- Test Commands (15 lines) - KEEP
- Best Practices (10 lines) - EXPAND TO 15-20 lines

**Target SKILL.md structure (~200 lines):**
- Frontmatter (6 lines)
- When to Use (10 lines)
- Layer Architecture (10 lines)
- Key Patterns (80-100 lines)
  - Context (10 lines)
  - Error Handling (10 lines)
  - Testing (10 lines)
  - HTTP Middleware (15 lines)
  - Database (10 lines)
  - Concurrency (15 lines)
  - Observability (10 lines)
- Best Practices (20 lines)
- Commands (10 lines)
- Common Issues (20 lines)

**Key principles:**
- Each pattern section: 5-10 lines describing when/how to use, plus 1-2 line reference to assets/
- Remove all code blocks > 3 lines (those belong in templates)
- Keep inline examples only for idioms (e.g., context.WithValue usage)
- Focus on decision points (when to use X vs Y)
- Add common pitfalls that agents might miss
