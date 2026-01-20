# PrAIgmatic Agents Guide

This repository contains specialized agents for the OpenCode system. Follow these guidelines when contributing or creating agents.


## Code Style Guidelines

### Core Principles
- **Simple**: Prioritize readability and clarity over cleverness
- **Readable**: Code should be self-documenting with descriptive names
- **Maintainable**: Use consistent patterns, avoid duplication (DRY)
- **Tested**: Write tests for critical paths, edge cases, and error scenarios
- **Secure**: Follow security checklist requirements

### Naming Conventions
- Use descriptive, self-explanatory names
- Functions: verb-based (e.g., `validateToken`, `fetchUserData`)
- Variables: noun-based, clear purpose (e.g., `isValid`, `userPermissions`)
- Classes/Types: PascalCase (e.g., `UserProfile`, `AuthService`)
- Constants: UPPER_SNAKE_CASE for global constants
- Booleans: prefix with `is/has/can/should` (e.g., `isValid`, `hasAccess`)

### Code Structure
- Small, focused functions (single responsibility)
- Early returns to reduce nesting
- Consistent error handling patterns
- Avoid deep nesting (max 3-4 levels)
- Prefer composition over inheritance

### Imports
- Group imports: standard library, third-party, local modules
- Use absolute imports for internal modules when possible
- Avoid circular dependencies

### Error Handling
- Validate all inputs and sanitize user data
- Use parameterized queries or ORM to prevent SQL injection
- Escape user-generated content to prevent XSS
- Return generic error messages (avoid leaking sensitive info)
- Log errors appropriately without exposing secrets

### Testing Patterns
- **TTD_REQUIRED**: Business logic, API handlers, data processing, validation, auth/authorization, state management, DB queries
- **NO_TTD**: Config files, static content, docs, simple utilities, well-understood patterns
- For TTD: write tests first, then implement, then refactor
- For NO_TTD: implement first, then test, then document
- Special cases require testing: volatile logic, performance-critical code (benchmarks), external dependencies (mocking), money/PII/security data, expensive debugging

## Tool Usage Patterns

### Background Processes
**CRITICAL**: Always use `run_in_background: true` for servers and long-running processes:
- `go run .` → `run_in_background: true`
- `npm run dev` → `run_in_background: true`
- `docker-compose up` → `run_in_background: true`

### Context7 Documentation
1. Use `context7_resolve-library-id` to get library ID
2. Then use `context7_query-docs` with the library ID
3. Maximum 3 calls per question

### Plan File Format
- Task format: `- [ ] **Task Name** (TTD) (SIZE)`
- Status: `- [ ]` = pending, `- [x]` = completed
- TTD: `(TTD_REQUIRED)` or `(NO_TTD)`
- Size: `(Small)`, `(Medium)`, or `(Large)`
- Plan file is single source of truth for task tracking

### Agent Workflow
1. **Planner**: Creates detailed plan
2. **Developer**: Implements with TTD approach
3. **Code Reviewer**: Mandatory review before completion
4. **Committer**: Creates git commits (only when explicitly requested)

## Agent Development

When creating or modifying agents:
1. Load relevant skills via `skill` tool
2. Assess TTD requirements in Phase 1
3. Follow implementation phases (analysis → implementation → review → completion)
4. Update plan file checkboxes as tasks complete
5. Run tests and build after completion
6. Use pragmatic-code-reviewer for mandatory code review

## Security Checklist
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Command injection prevention
- Authentication and authorization checks
- Sensitive data handling (no secrets in logs/commits)
- CSRF protection
- Generic error messages
- Rate limiting
- Secure defaults
