# TTD Decision Criteria

Task-Driven Development (TTD) guidelines for when to write tests first.

## TTD_REQUIRED

Use test-first development for:

- Business logic functions
- API endpoints and handlers
- Data processing algorithms
- Complex validation logic
- Authentication/authorization
- Error handling on critical paths
- State management
- Database queries with performance implications

## NO_TTD

Skip test-first for:

- Configuration files (Docker, YAML, JSON)
- Static files (HTML templates, CSS)
- Documentation files (MD, TXT)
- Simple utility functions (< 10 lines)
- Well-understood patterns (copy-paste with minor changes)

## TTD_REQUIRED Special Cases

### When Business Logic Changes Frequently

- **Invest in TTD** even for "simple" logic if requirements are volatile
- High-change code benefits from test safety net
- Tests serve as living documentation of expected behavior
- Prevents regression when requirements shift

**Example:** A pricing calculation that seems simple today but has changed 3 times in the past quarter should use TTD.

### When Performance is Critical

- **Use benchmark tests** for performance-sensitive code
  - **Go:** `func BenchmarkX(b *testing.B)` with baseline thresholds
  - **JavaScript:** `vitest bench` with performance budgets
  - **Python:** `pytest-benchmark` with regression detection
- Set performance regression thresholds (e.g., "no more than 10% slower")
- Run benchmarks in CI to catch degradation early

**Example:** A search algorithm handling millions of records needs benchmark tests, not just correctness tests.

### When External Dependencies are Involved

- **Mock external APIs/databases** to enable isolated testing
- Test both **happy path** and **failure scenarios**:
  - API returns 500 error
  - Database connection timeout
  - Network failure mid-request
  - Rate limiting / throttling
  - Partial data responses
- Use dependency injection to make mocking feasible
- Consider contract testing for API integrations

**Example:** A payment gateway integration should have tests for successful charges, declined cards, network failures, and timeout scenarios - all with mocked external calls.

### When Code Handles Money, PII, or Security

- **Always use TTD** for code that:
  - Processes financial transactions
  - Handles Personally Identifiable Information (PII)
  - Implements security controls (auth, encryption, sanitization)
  - Manages access control or permissions
- Write tests that verify security properties:
  - Unauthorized access is blocked
  - Input sanitization prevents injection
  - Sensitive data is encrypted/masked
  - Audit logs are created

**Example:** A function that calculates tax must have comprehensive tests covering all edge cases, rounding rules, and jurisdiction differences.

### When Debugging is Expensive

- **Use TTD** if debugging the code in production would be:
  - Time-consuming (complex state, hard to reproduce)
  - Expensive (downtime costs, customer impact)
  - Risky (safety-critical systems, data loss potential)
- Tests reduce the cost of finding bugs early
- Faster feedback loop than production debugging

**Example:** A scheduled batch job that runs once a week and processes millions of records should have thorough tests - waiting a week to see if it works is too slow.

## Gray Areas - Use Judgment

Some code falls in the middle. Use TTD when:

- **High cognitive complexity:** >5 nested conditions, multiple state transitions
- **Multiple collaborators:** Code that multiple people will modify needs test guardrails
- **Long-lived code:** Will this be maintained for >6 months?
- **Unclear requirements:** Writing tests helps clarify what the code should do
- **Integration points:** Code that bridges multiple systems benefits from contract tests

When in doubt, **err on the side of writing tests**. The cost of writing a test is usually less than the cost of fixing a bug in production.
