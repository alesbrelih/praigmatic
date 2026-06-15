---
name: go-backend-developer
description: Complete Go backend development patterns including table-driven tests, mocking, observability (tracing, logging, metrics), and HTTP handler patterns.
keywords: go, golang, backend, testing, mocking, mockery, sqlmock, table-driven, observability, tracing, logging, metrics
license: MIT
---

# Go Backend Developer Skill

## When to Use

- Writing Go backend code (APIs, services, handlers)
- Creating tests with table-driven pattern
- Adding observability (tracing, logging, metrics)
- Database operations with transactions and prepared statements
- Implementing HTTP middleware (auth, logging, recovery)
- Writing concurrent code with goroutines and channels
- Testing database operations with sqlmock
- Mocking dependencies with mockery v3

## Layer Architecture

```
Handler → Service → Repository → Database
   ↓         ↓            ↓
 Middleware  Mocks    sqlmock
          (mockery v3)
```

**Decision guidance:**
- Handlers: Use `handler_template.go` for HTTP request/response patterns
- Services: Use `service_template.go` for business logic and transaction management with mockery v3 generated mocks
- Repositories: Use `repository_template.go` for database operations with sqlmock — repositories never start transactions
- Middleware: Use `middleware_template.go` for cross-cutting concerns

## Key Patterns

### Context Propagation

**When to use:** Every function that performs I/O or may timeout
**Pattern:** Pass `ctx context.Context` as first parameter, derive new contexts with `WithTimeout`, `WithCancel`
**Reference:** `middleware_template.go` (RequestID, Authentication middleware)

**Best practices:**
- Never store context in a struct
- Always call `cancel()` for derived contexts
- Use `context.WithValue()` for request-scoped data with custom key types
- Use `context.Background()` only at top level, derive from request context in handlers

**Common pitfalls:**
- Passing `nil` context instead of `context.Background()`
- Forgetting to call `cancel()` on derived contexts
- Using string keys for context values (use custom type to prevent collisions)

### Error Handling

**When to use:** All operations that can fail
**Pattern:** Wrap errors with context using `fmt.Errorf("operation: %w", err)`, use sentinel errors for expected conditions
**Reference:** `handler_template.go` (HTTP error response patterns)

**Best practices:**
- Wrap errors with context about what operation failed
- Use `errors.Is()` to check for sentinel errors
- Use `errors.As()` to extract custom error types
- Handle errors at boundaries (handlers, main)
- Log detailed errors internally, return generic messages to clients
- Use custom error types for domain-specific validation errors

**Common pitfalls:**
- Returning unwrapped errors (loss of context)
- Using `panic` for recoverable runtime errors (startup `log.Fatalf` for missing config is appropriate — see Startup Assertions)
- Exposing internal error details to clients
- Ignoring errors or only logging them

### Startup Assertions

**When to use:** Program initialization — env vars, config, required services, DB connections
**Pattern:** Fail fast at startup with `log.Fatalf` or `os.Exit(1)` when required configuration is missing or invalid. Never nil-check a dependency at runtime that should have been available from the start.
**Reference:** `service_template.go` (mustGetEnv, mustConnectDB)

**Principle:** A misconfigured program should fail loudly and immediately with a clear error message and a non-zero exit code. Silently degrading or nil-checking at runtime hides bugs until they surface in production under load.

**`must` helper pattern:**
```go
// mustGetEnv retrieves an env var or fatals if unset/empty.
func mustGetEnv(key string) string {
    val := os.Getenv(key)
    if val == "" {
        log.Fatalf("required environment variable %s is not set", key)
    }
    return val
}
```

**Wiring pattern — config read in main, deps passed to constructors:**
```go
// main reads config and wires everything together.
// Services/handlers never read env vars — they receive their deps as arguments.
func main() {
    dbURL := mustGetEnv("DATABASE_URL")
    apiKey := mustGetEnv("NOTIFICATION_API_KEY")

    db := mustConnectDB(dbURL)
    repo := NewSQLRepository(db)
    svc := NewService(db, repo)
    notifSvc := NewNotificationService(apiKey)

    handler := NewHandler(svc, notifSvc) // interfaces, not env vars
    ...
}

// PREFER: Constructor trusts its deps — main guarantees non-nil
func NewService(db *sql.DB, repo Repository) *Service {
    return &Service{db: db, repo: repo}
}

// AVOID: Nil-checking deps that main must provide
// func NewService(db *sql.DB, repo Repository) *Service {
//     if db == nil { log.Fatalf("db is required") }   // unnecessary — if main passes nil, method call panics immediately
//     if repo == nil { log.Fatalf("repo is required") } // also doesn't catch nil pointer in interface
//     ...
// }

// AVOID: Optional construction hides misconfiguration
// var svc *NotificationService
// if apiKey != "" {
//     svc = NewNotificationService(apiKey)
// }
// if svc != nil {  // <-- this nil check means your program is broken
//     handler.Use(svc)
// }
```

**Best practices:**
- Use `log.Fatalf` for startup failures — it logs the message then calls `os.Exit(1)` with no stack trace noise
- Use `os.Exit(1)` directly when you've already logged the error yourself
- Write `must*` helpers for repeated assertions (env vars, file existence, DB connections)
- Read env vars and validate config in `main()` — never in service constructors or business logic
- Wire deps through constructors: `main` reads config → creates concrete deps → passes to `NewService(deps...)`
- Constructors trust their deps — `main` guarantees non-nil; nil-checking deps in constructors is unnecessary defensive noise (and doesn't catch nil pointer in interface anyway)
- Fail at the boundary: `main()` or package-level `init()` — never deep in business logic

**Common pitfalls:**
- Nil-checking a dependency that should always exist (`if svc != nil { ... }`) — trust your wiring
- Checking `if repo == nil` on an interface — doesn't catch a nil pointer wrapped in an interface (Go's nil interface trap)
- Using `panic` instead of `log.Fatalf` for startup failures (panic produces noisy stack traces, `log.Fatalf` is clean)
- Soft-degrading when a required service is unavailable (skip feature → hidden bug)
- Validating config lazily (first request) instead of eagerly (startup)
- Reading env vars in service constructors instead of in `main`

### Testing

**When to use:** All Go code
**Pattern:** Table-driven tests with `t.Run()` for test cases, `t.Parallel()` for independent tests
**References:**
- `template.go` - Table-driven test structure
- `service_template.go` - mockery v3 generated mocks for service layer
- `repository_template.go` - sqlmock for database tests
- `handler_template.go` - httptest for HTTP handlers

**Mocking with mockery v3:**
- Configure `.mockery.yaml` at the project root to declare which interfaces to mock:
  ```yaml
  packages:
    github.com/yourproject/internal/service:
      interfaces:
        Repository:
  ```
- Run `mockery` to generate mocks (no `//go:generate` directives needed)
- Use the generated `NewMockRepository(t)` constructor — it takes `*testing.T` for automatic assertion cleanup
- Set expectations with the `EXPECT()` API:
  ```go
  mockRepo := NewMockRepository(t)
  mockRepo.EXPECT().Get(mock.Anything, "123").Return(&Item{ID: "123"}, nil).Once()
  ```
- No need for `mockRepo.AssertExpectations(t)` — handled automatically via `t`

**Best practices:**
- Use `require` for setup that must pass, `assert` for verification
- Clean up resources in `defer` or `t.Cleanup()`
- Run tests in parallel with `-race` flag
- Keep test files adjacent to implementation

**Common pitfalls:**
- Manually writing mocks instead of using mockery v3 to generate them
- Not running tests with race detector
- Forgetting to close rows in database tests

### Database Operations

**When to use:** All database interactions
**Pattern:** Repositories use `DBTX` interface (satisfied by both `*sql.DB` and `*sql.Tx`). Services own transaction boundaries and pass a transaction into the repository via `repo.WithTx(tx)`.
**References:** `repository_template.go` (DBTX, WithTx, sqlmock), `service_template.go` (transaction management)

**Transaction ownership:**
- Repositories **never** start transactions — they only execute queries
- Repository interface includes `WithTx(tx *sql.Tx) Repository` which returns a new instance scoped to the transaction
- Services start transactions with `db.BeginTx`, call `repo.WithTx(tx)` to get a transactional repo, then commit or rollback
- `mockery v3` generates `WithTx` on the mock automatically — in tests, set `m.EXPECT().WithTx(mock.Anything).Return(m)` to route calls back to the same mock

**Best practices:**
- Always use parameterized queries to prevent SQL injection
- Pass context to all DB operations for cancellation
- Handle `sql.ErrNoRows` explicitly (not an error)
- Always close rows with `defer rows.Close()`
- Use a named `committed` bool + deferred rollback to guarantee cleanup
- Configure connection pool (SetMaxOpenConns, SetMaxIdleConns)

**Common pitfalls:**
- Putting transaction logic in the repository layer
- Not checking `rows.Err()` after iteration
- Forgetting to rollback on transaction errors
- Exposing database error details to clients

### HTTP Middleware

**When to use:** Cross-cutting concerns (auth, logging, recovery, request ID)
**Pattern:** Chain middleware with `func(http.Handler) http.Handler` signature, execute in reverse order
**Reference:** `middleware_template.go` (RequestID, Logging, Recovery, Authentication)

**Best practices:**
- Wrap `ResponseWriter` to capture status codes for logging
- Pass `r.WithContext(ctx)` to next handler
- Add Recovery middleware first to catch panics
- Add RequestID early so all logs include it
- Use context values for request-scoped data

**Common pitfalls:**
- Not checking if headers were already written
- Forgetting to call `next.ServeHTTP()`
- Trusting client input without validation
- Not using `defer` for cleanup

### Concurrency

**When to use:** Parallel I/O operations, worker pools, rate limiting
**Pattern:** Use `sync.WaitGroup` to wait for goroutines, channels for communication, mutex for shared state

**Best practices:**
- Use `sync.WaitGroup` to wait for goroutine completion
- Always close channels when done to avoid deadlocks
- Hold locks for minimal scope with `defer mu.Unlock()`
- Use context for cancellation in goroutines
- Prefer channels over shared memory
- Use worker pools to control goroutine count
- Collect errors from goroutines using error channels

**Common pitfalls:**
- Closing channels from receiver side (deadlock)
- Not using `defer` for unlock/waitgroup
- Spawning unlimited goroutines (use worker pools)
- Not using `-race` flag in tests
- Sharing mutable state without synchronization

### Observability

**When to use:** All production code
**Pattern:** OpenTelemetry tracing for request flow, structured logging with slog, Prometheus metrics
**Reference:** `middleware_template.go` (logging and tracing middleware)

**Best practices:**
- Add spans to all exported functions
- Use structured logging with consistent field names
- Use counters for totals (request counts), histograms for latency (distributions)
- Use gauges for state (memory, connections)
- Limit metric cardinality (avoid user IDs as labels)
- Expose metrics endpoint at `/metrics`

**Common pitfalls:**
- High cardinality metrics (too many label combinations)
- Not recording errors in spans
- Using unstructured logging
- Not instrumenting at request boundaries

### External Dependencies

**When to use:** Consuming external libraries or third-party services
**Pattern:** Define a consumer-side interface that includes only the methods you need, then mock it with mockery v3

**How it works:**
- Define a small interface in the package that consumes the dependency, listing only the methods you actually call
- Go's implicit interface satisfaction means the concrete library type already implements your interface — no wrapper needed
- Use mockery v3 to generate mocks for your interface
- In production, pass the real library type; in tests, pass the generated mock

**Example:**
```go
// In your consumer package — only the methods you need
type EmailSender interface {
    Send(ctx context.Context, to string, body string) error
}

// Production: pass the real client (which already satisfies EmailSender)
svc := NewNotificationService(mailgun.NewClient(apiKey))

// Tests: pass the mockery-generated mock
mock := NewMockEmailSender(t)
mock.EXPECT().Send(mock.Anything, "user@example.com", "hello").Return(nil).Once()
svc := NewNotificationService(mock)
```

**Common pitfalls:**
- Wrapping libraries in custom adapter structs when Go interfaces make this unnecessary
- Defining interfaces at the provider side instead of the consumer side
- Including methods you don't use in the interface (keep it minimal)

## Best Practices

- **Context first:** Pass context as first parameter in all functions, never store in structs
- **Error wrapping:** Always wrap errors with context using `%w`, handle at boundaries
- **Table-driven tests:** Use `t.Run()` for test cases, `t.Parallel()` for independent tests
- **Prepared statements:** Always use prepared statements for SQL queries
- **Transaction atomicity:** Start transactions in services, not repositories; use `repo.WithTx(tx)` to scope the repo to the transaction
- **Middleware chaining:** Chain middleware for cross-cutting concerns, order matters
- **Goroutine safety:** Use `sync.WaitGroup`, channels, and mutex appropriately, test with `-race`
- **Observability everywhere:** Add tracing to exported functions, log with context, expose metrics
- **Resource cleanup:** Use `defer` for cleanup, close resources (rows, statements, channels)
- **Security first:** Validate inputs, use prepared statements, sanitize error messages
- **Startup assertions:** Fail fast with `log.Fatalf` on missing config; never nil-check a dependency that must exist

## Commands

```bash
# Generate mocks from .mockery.yaml config
mockery

# Run tests with coverage, race detection, and parallel execution
go test -coverprofile=c.out -race -parallel=4 ./...
go tool cover -html=c.out    # View coverage report
go tool cover -func=c.out     # Coverage by function
```

## Common Issues

- **SQL Injection:** Always use parameterized queries (`$1`, `$2`) never string concatenation
- **Context in struct:** Pass context as first parameter, never store as struct field
- **Error wrapping:** Use `fmt.Errorf("operation: %w", err)` not `return err`
- **Goroutine leaks:** Always use `sync.WaitGroup` to manage goroutine lifecycles
- **Resource cleanup:** Use `defer rows.Close()` immediately after opening rows
- **High cardinality metrics:** Avoid user-specific labels; use method/status instead
- **Missing defer:** Always use `defer mu.Unlock()` and `defer wg.Done()`
