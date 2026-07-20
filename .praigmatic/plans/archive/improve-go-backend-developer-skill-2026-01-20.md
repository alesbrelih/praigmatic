# Improve Go Backend Developer Skill

## Planning Phase Decisions

### Phase 1: Exploration
**Decision:** SKIP
**Rationale:** Task involves reviewing and improving existing documentation. All necessary files have been read and analyzed. No codebase exploration required.

### Phase 2: Clarification
**Decision:** SKIP
**Rationale:** Request is clear: review skill for best practices, identify missing information and conflicts, assess assets value, and create improvement plan.

### Phase 3: Task Analysis
**Status:** Complete
**Unknowns identified:** None - Go backend patterns are well-understood and documented in the skill
**Complexity assessment:** Medium - involves documentation updates, example additions, and template creation

### Phase 4: Research
**Decision:** SKIP
**Rationale:** Sufficient knowledge of Go backend development patterns to make recommendations without additional research.

### Phase 5: Synthesis
**Decision:** SKIP
**Rationale:** No research conducted. Findings are based on direct review of skill documentation.

### Phase 6: Task Breakdown
**Status:** Complete
**Total tasks:** 8
**Task size distribution:** Small: 5, Medium: 3

## Tasks

- [x] **Fix t.Parallel inconsistency between SKILL.md and template.go** (Small)
  - Add `t.Parallel()` to the template.go test loop (line 33)
  - Verify consistency across both files
  - Location: `.opencode/skills/go-backend-developer/assets/template.go`

- [x] **Add Context usage patterns section** (Medium)
  - Create "Context Patterns" section with examples:
    - Context propagation through layers
    - Context cancellation and timeout
    - Request-scoped values
    - Background context vs request context
  - Add best practices for context usage
  - Location: `.opencode/skills/go-backend-developer/SKILL.md`

- [x] **Add Error handling patterns section** (Medium)
  - Create "Error Handling" section with examples:
    - Error wrapping with `fmt.Errorf` and `errors.Is/As`
    - Custom error types (implementing error interface)
    - Error sentinel values
    - HTTP error response patterns
  - Add best practices for error handling
  - Location: `.opencode/skills/go-backend-developer/SKILL.md`

- [x] **Add HTTP Middleware patterns section** (Medium)
  - Create "Middleware Patterns" section with examples:
    - Request ID middleware
    - Logging middleware
    - Recovery middleware
    - Authentication middleware
    - Middleware chaining with http.Handler
  - Show middleware composition patterns
  - Location: `.opencode/skills/go-backend-developer/SKILL.md`

- [x] **Add Database patterns section** (Small)
  - Create "Database Patterns" section with examples:
    - sql.DB connection pooling configuration
    - Transaction management (BEGIN, COMMIT, ROLLBACK)
    - Query patterns with context
    - Prepared statements
  - Location: `.opencode/skills/go-backend-developer/SKILL.md`

- [x] **Add Concurrency patterns section** (Small)
  - Create "Concurrency Patterns" section with examples:
    - Goroutine spawning and waiting with sync.WaitGroup
    - Channel communication patterns
    - Mutex usage for shared state
    - Worker pool pattern
  - Add best practices for concurrent code
  - Location: `.opencode/skills/go-backend-developer/SKILL.md`

- [x] **Improve Metrics example with initialization** (Small)
  - Add metric initialization examples (prometheus.NewCounterVec, NewHistogramVec)
  - Show registration with http.Handle("/metrics", promhttp.Handler())
  - Add label dimension best practices
  - Location: `.opencode/skills/go-backend-developer/SKILL.md`

- [x] **Expand assets/ with useful templates** (Small)
  - Create `handler_template.go` with HTTP handler pattern
  - Create `service_template.go` with service layer pattern
  - Create `repository_template.go` with repository interface pattern
  - Create `middleware_template.go` with middleware pattern
  - Each template should include testing structure
  - Location: `.opencode/skills/go-backend-developer/assets/`

## Architecture Overview

This task enhances the Go Backend Developer skill documentation to be truly comprehensive. The improvements follow the existing structure and add missing critical patterns that are essential for production-ready Go backend development.

The skill is structured with:
- Frontmatter YAML for metadata
- "When to Use" guidance
- Code examples for each pattern
- Best practices summaries

## Technical Decisions

- **Decision 1**: Keep current structure, expand with new sections
  - Rationale: Current structure is clear and effective. Adding new sections maintains consistency.
  - Trade-offs: None - additive changes only.

- **Decision 2**: Keep assets/ directory but expand significantly
  - Rationale: Templates can accelerate development when they provide real value.
  - Trade-offs: More files to maintain, but provides concrete starting points.

- **Decision 3**: Add Context patterns as first new section
  - Rationale: Context is fundamental in Go and pervades all backend code.
  - Trade-offs: None - this is standard Go practice.

- **Decision 4**: Use standard library examples where possible
  - Rationale: Minimizes external dependencies and demonstrates idiomatic Go.
  - Trade-offs: Some popular third-party libraries (like Gin or Chi) not shown, but skill shows patterns applicable to all frameworks.

## Integration Points

- Modified files:
  - `.opencode/skills/go-backend-developer/SKILL.md` - Primary documentation
  - `.opencode/skills/go-backend-developer/assets/template.go` - Fix inconsistency

- New files to create:
  - `.opencode/skills/go-backend-developer/assets/handler_template.go`
  - `.opencode/skills/go-backend-developer/assets/service_template.go`
  - `.opencode/skills/go-backend-developer/assets/repository_template.go`
  - `.opencode/skills/go-backend-developer/assets/middleware_template.go`

## Security Considerations

- **Context propagation** with sensitive data
  - Risk: Logging sensitive values from context
  - Mitigation: Document not to log sensitive data from context, use structured logging with care

- **Error messages**
  - Risk: Leaking implementation details in error messages
  - Mitigation: Document using generic error messages for external responses, detailed errors only for logging

- **SQL injection**
  - Risk: Not using parameterized queries
  - Mitigation: Emphasize prepared statements and parameterized queries in database section

## Testing Strategy

- **Documentation review**: Verify all code examples compile
- **Template testing**: Ensure new template files are syntactically correct
- **Consistency check**: Ensure all examples follow the same style (imports, naming, structure)

No automated tests needed for documentation-only changes.

## Risk Points

- **Risk 1**: Skill becomes too long
  - Mitigation: Keep each section concise, focus on essential patterns
  - Fallback: Consider splitting into multiple skills if needed (unlikely, structure is fine)

- **Risk 2**: Incomplete or outdated examples
  - Mitigation: Verify all code snippets are complete and follow current Go best practices
  - Fallback: Review by Go community members if available

- **Risk 3**: Templates introduce maintenance burden
  - Mitigation: Keep templates simple and focused on patterns, not full implementations
  - Fallback: Remove templates if they prove not useful in practice

## Dependencies

- Task 1 must complete before Tasks 2-7 (ensures consistency baseline)
- Tasks 2-7 can run in parallel (independent sections)
- Task 8 can run in parallel with Tasks 2-7 (independent asset additions)

## Implementation Notes

### Current Issues Identified

1. **Conflicting information**:
   - `t.Parallel()` used in SKILL.md (line 32) but missing in assets/template.go (line 33)
   - Fix by adding `t.Parallel()` to template

2. **Missing critical patterns**:
   - **Context usage**: Essential for Go services, but no examples
   - **Error handling**: Only basic error checking shown, no wrapping or custom errors
   - **HTTP middleware**: No middleware patterns shown
   - **Database**: Only sqlmock, no real database usage patterns
   - **Concurrency**: No goroutine, channel, or sync patterns
   - **Dependency injection**: No interface-based DI patterns
   - **Graceful shutdown**: No server shutdown patterns
   - **API validation**: No input validation patterns
   - **Configuration**: No config management patterns
   - **Repository layer**: No data access layer patterns

3. **Assets directory**:
   - Currently contains only basic test template
   - Low value in current state
   - Recommendation: Expand with useful templates or remove

4. **Code quality issues**:
   - Metrics example (lines 140-143) shows usage but not initialization
   - HTTP handler test (lines 96-104) is too simplistic (no context, body, headers)
   - No examples of custom errors or error wrapping
   - No integration test patterns

### Additions Needed

The skill should cover these additional areas to be truly "Complete":

1. Context Patterns (high priority)
2. Error Handling (high priority)
3. HTTP Middleware (high priority)
4. Database Usage Patterns (medium priority)
5. Concurrency Patterns (medium priority)
6. Better Metrics Examples (low priority - just initialization)
7. Expanded Templates (medium priority)

### Suggested Section Order After Additions

1. When to Use
2. Context Patterns (NEW)
3. Error Handling (NEW)
4. Table-Driven Tests
5. Mocking with gomock
6. Database Mock with sqlmock
7. Database Patterns (NEW)
8. Testing HTTP Handlers
9. HTTP Middleware (NEW)
10. Concurrency Patterns (NEW)
11. Observability Patterns
    - OpenTelemetry Tracing
    - Structured Logging with slog
    - Metrics (ENHANCED)
12. Test Commands
13. Best Practices
