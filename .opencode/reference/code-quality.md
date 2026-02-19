# Code Quality Standards

Quality standards for all code contributions.

## Clean Code

- Descriptive names for variables and functions — names reveal intent
- Single responsibility per function — one reason to change
- Early returns to reduce nesting — guard clauses over nested ifs
- Consistent error handling — same pattern across the codebase
- Functions are small and focused — prefer <30 lines
- No dead code — remove unused functions, imports, variables
- No magic numbers — use named constants

## Maintainability

- Code is self-documenting — comments explain "why," not "what"
- Consistent naming conventions — follow language idioms (camelCase in JS/TS, snake_case in Python/Go)
- Appropriate abstraction levels — don't abstract until you have 3+ instances
- Separation of concerns — IO at boundaries, pure logic in the middle
- DRY principle — extract only when duplication is real, not coincidental

## Error Handling

- Handle errors at the appropriate level — don't swallow errors silently
- Use typed/structured errors — not raw strings
- Fail fast — validate inputs early, return errors immediately
- Log errors with context — include what operation failed and relevant IDs
- Don't use exceptions for control flow
- Distinguish recoverable vs fatal errors

## Performance

- Measure before optimizing — profile, don't guess
- Avoid N+1 queries — use joins, batch loading, or eager loading
- Pagination for large datasets — never return unbounded results
- Use caching only with evidence of need — and plan for invalidation
- Prefer streaming over buffering for large data
- Be aware of algorithmic complexity — O(n^2) in a loop is a red flag

## Testing

- Test behavior, not implementation — tests survive refactoring
- Adequate coverage for critical paths — auth, payments, data mutations
- Edge cases: empty inputs, boundaries, error conditions
- Tests are independent — no shared mutable state, no execution order dependency
- Test names describe the scenario: "returns_error_when_user_not_found"
- Prefer real implementations over mocks — mock only external boundaries

## Code Organization

- Group by feature/domain, not by type (prefer `auth/handler.go` over `handlers/auth.go`)
- Keep related code close together — minimize distance between definition and usage
- Public API surface should be minimal — export only what's needed
- Dependency direction flows inward — domain code doesn't import infrastructure
