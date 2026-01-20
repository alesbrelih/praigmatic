---
name: go-backend-developer
description: Complete Go backend development patterns including table-driven tests, mocking, observability (tracing, logging, metrics), and HTTP handler patterns.
keywords: go, golang, backend, testing, mocking, gomock, sqlmock, table-driven, observability, tracing, logging, metrics
license: MIT
---

# Go Backend Developer Skill

## When to Use
- Writing Go backend code (APIs, services, handlers)
- Creating tests with table-driven pattern
- Adding observability (tracing, logging, metrics)
- Mocking dependencies with gomock
- Database testing with sqlmock

## Context Patterns

### Context Propagation Through Layers

```go
// import (
//     "context"
//     "net/http"
// )

func Handler(w http.ResponseWriter, r *http.Request) {
    ctx := r.Context()

    // Propagate through service layer
    err := service.ProcessOrder(ctx, orderID)
    if err != nil {
        http.Error(w, err.Error(), http.StatusInternalServerError)
        return
    }
}

func ProcessOrder(ctx context.Context, orderID string) error {
    // Propagate to repository layer
    return repo.GetOrder(ctx, orderID)
}
```

### Context Cancellation and Timeout

```go
// import (
//     "context"
//     "fmt"
//     "time"
// )

func WithTimeout(ctx context.Context) error {
    // Shadows param - standard Go pattern for context derivation
    ctx, cancel := context.WithTimeout(ctx, 5*time.Second)
    defer cancel()

    // All operations use the cancelable context
    // slowOperation is a placeholder for any long-running operation
    if err := slowOperation(ctx); err != nil {
        return fmt.Errorf("operation failed: %w", err)
    }
    return nil
}

func HandleCancellation(ctx context.Context) {
    // doWork returns a channel with results (placeholder example)
    // process handles the result (placeholder example)
    select {
    case result := <-doWork(ctx):
        process(result)
    case <-ctx.Done():
        // Context was cancelled or deadline exceeded
        fmt.Println("Operation cancelled:", ctx.Err())
    }
}
```

### Request-Scoped Values

```go
// import (
//     "context"
// )

// Define context key type (must not be exported or use custom type)
type contextKey string

const userIDKey contextKey = "userID"

func WithUserID(ctx context.Context, userID string) context.Context {
    return context.WithValue(ctx, userIDKey, userID)
}

func UserIDFromContext(ctx context.Context) (string, bool) {
    userID, ok := ctx.Value(userIDKey).(string)
    return userID, ok
}
```

### Background Context vs Request Context

```go
// import (
//     "context"
//     "log"
//     "net/http"
// )

// Use context.Background() for main goroutines, initialization
func main() {
    ctx := context.Background()

    // For HTTP handlers, use request context
    http.HandleFunc("/api", func(w http.ResponseWriter, r *http.Request) {
        ctx := r.Context()

        // For goroutines spawned from request, derive new context
        // Fire-and-forget pattern: log result, don't return
        go func(ctx context.Context) {
            // processInBackground is a placeholder for any background operation
            if err := processInBackground(ctx); err != nil {
                // Log error, don't return (fire-and-forget)
                log.Printf("background process failed: %v", err)
            }
        }(ctx)
    })
}
```

### Best Practices for Context

- **First parameter**: Pass `ctx` as the first parameter in functions
- **Never store**: Never store context in a struct
- **Don't make optional**: Always require context, never use nil context
- **Chain properly**: Always derive new contexts, never reuse old ones
- **Call cancel**: Always call cancel() for contexts created with WithCancel/WithTimeout
- **Background for top-level**: Use `context.Background()` or `context.TODO()` only at top level
- **Request-specific contexts**: Use `context.WithValue()` for request-scoped data
- **Check deadlines**: Use `ctx.Done()` to check for cancellation in long operations
- **Don't pass nil**: Never pass `nil` context, always derive or use Background/TODO

## Error Handling

### Error Wrapping with fmt.Errorf

```go
// import (
//     "errors"
//     "fmt"
// )

// Wrap errors with context for better debugging
func ProcessOrder(orderID string) error {
    order, err := repo.GetOrder(orderID)
    if err != nil {
        // Wrap error with context about what operation failed
        return fmt.Errorf("failed to get order %s: %w", orderID, err)
    }

    if order.Status != "pending" {
        // Create new error with context
        return fmt.Errorf("order %s is not pending (status: %s)", orderID, order.Status)
    }

    return nil
}
```

### Using errors.Is and errors.As

```go
// import (
//     "errors"
//     "fmt"
// )

// Define sentinel errors for comparison
var (
    ErrOrderNotFound = errors.New("order not found")
    ErrOrderInvalid  = errors.New("invalid order")
)

func ValidateOrder(order *Order) error {
    if order == nil {
        return &ValidationError{Field: "order", Message: "cannot be nil"}
    }
    if order.ID == "" {
        return &ValidationError{Field: "id", Message: "cannot be empty"}
    }
    return nil
}

// Check for specific errors using errors.Is
func HandleOrder(orderID string) error {
    // repo.GetOrder is a placeholder for a repository layer function:
    // func (r *Repository) GetOrder(ctx context.Context, id string) (*Order, error)
    order, err := repo.GetOrder(orderID)
    if err != nil {
        if errors.Is(err, ErrOrderNotFound) {
            return fmt.Errorf("order does not exist: %s", orderID)
        }
        return err
    }
    return nil
}

// Extract wrapped errors using errors.As
func HandleOrderWithType(orderID string) error {
    order, err := repo.GetOrder(orderID)
    if err != nil {
        // Check for specific error type - custom error types are defined below
        var notFound *NotFoundError
        if errors.As(err, &notFound) {
            return fmt.Errorf("order %s not found: %v", orderID, notFound)
        }
        return err
    }
    return nil
}
```

### Custom Error Types

```go
// import (
//     "errors"
//     "fmt"
// )

// ValidationError for input validation errors
type ValidationError struct {
    Field   string
    Message string
}

func (e *ValidationError) Error() string {
    return fmt.Sprintf("validation error on field %s: %s", e.Field, e.Message)
}

// NotFoundError for resource not found errors
type NotFoundError struct {
    Resource string
    ID       string
}

func (e *NotFoundError) Error() string {
    return fmt.Sprintf("%s not found: %s", e.Resource, e.ID)
}

// Usage
func CreateUser(name, email string) (*User, error) {
    if name == "" {
        return nil, &ValidationError{Field: "name", Message: "cannot be empty"}
    }
    if email == "" {
        return nil, &ValidationError{Field: "email", Message: "cannot be empty"}
    }
    // ... create user
    return &User{Name: name, Email: email}, nil
}
```

### HTTP Error Response Patterns

```go
// import (
//     "encoding/json"
//     "errors"
//     "fmt"
//     "log"
//     "net/http"
// )

// Define sentinel error for user operations
var ErrUserNotFound = errors.New("user not found")

// ErrorResponse for structured JSON error responses
type ErrorResponse struct {
    Error   string `json:"error"`
    Details string `json:"details,omitempty"`
    Code    string `json:"code,omitempty"`
}

// Write JSON error response
func writeError(w http.ResponseWriter, r *http.Request, status int, err error) {
    // Log detailed error for debugging
    log.Printf("error: %v", err)

    // Return generic error to client
    resp := ErrorResponse{
        Error:   http.StatusText(status),
        Details: err.Error(),
    }

    // Don't expose internal errors to clients
    if status >= 500 {
        resp.Details = "internal server error"
    }

    w.Header().Set("Content-Type", "application/json")
    w.WriteHeader(status)
    // Error handling for JSON encoding omitted for brevity in this example
    // In production, check: if err := json.NewEncoder(w).Encode(resp); err != nil { ... }
    json.NewEncoder(w).Encode(resp)
}

// Usage in handler
func Handler(w http.ResponseWriter, r *http.Request) {
    // Extract userID from request context, URL params, or body
    userID := r.URL.Query().Get("user_id")

    // Validate userID
    if userID == "" {
        writeError(w, r, http.StatusBadRequest, fmt.Errorf("user_id is required"))
        return
    }

    user, err := service.GetUser(r.Context(), userID)
    if err != nil {
        // Check for custom error types with details
        var notFound *NotFoundError
        if errors.As(err, &notFound) {
            writeError(w, r, http.StatusNotFound, fmt.Errorf("%s: %s", notFound.Resource, notFound.ID))
            return
        }

        // Check for validation errors
        var validationErr *ValidationError
        if errors.As(err, &validationErr) {
            writeError(w, r, http.StatusBadRequest, validationErr)
            return
        }

        // Check for sentinel errors
        if errors.Is(err, ErrUserNotFound) {
            writeError(w, r, http.StatusNotFound, err)
            return
        }

        // All other errors
        writeError(w, r, http.StatusInternalServerError, err)
        return
    }

    // Error handling for JSON encoding omitted for brevity in this example
    // In production, check: if err := json.NewEncoder(w).Encode(user); err != nil { ... }
    json.NewEncoder(w).Encode(user)
}
```

### Best Practices for Error Handling

- **Wrap errors**: Always wrap errors with context using `fmt.Errorf("...: %w", err)`
- **Use error.Is**: Check for specific errors using `errors.Is(err, sentinelErr)`
- **Use error.As**: Extract wrapped error types using `errors.As(err, &customErr)`
- **Sentinel errors**: Define exported sentinel errors for common cases (`var ErrNotFound = errors.New("not found")`)
- **Custom error types**: Create custom error types for domain-specific errors that need type checking
- **Never ignore errors**: Always check errors, even if just logging them
- **Handle at boundaries**: Handle errors at application boundaries (HTTP handlers, CLI commands, main)
- **Log details internally**: Log full error details, but return generic messages to clients
- **Don't use panic**: Use errors, not panics, for expected error conditions
- **Validate early**: Validate inputs early and return errors with clear context
- **Include context**: Wrap errors with context about what operation failed

## Table-Driven Tests

```go
func TestFunction(t *testing.T) {
    tests := []struct {
        name    string
        arg     Input
        want    Output
        wantErr bool
    }{
        {"success case", validArg, expectedResult, false},
        {"error case", invalidArg, zeroValue, true},
    }
    for _, tt := range tests {
        t.Run(tt.name, func(t *testing.T) {
            t.Parallel()
            got, err := Function(tt.arg)
            if tt.wantErr {
                require.Error(t, err)
                return
            }
            require.NoError(t, err)
            assert.Equal(t, tt.want, got)
        })
    }
}
```

## Mocking with gomock

```bash
go run github.com/vektra/mockery/v3@latest --name=Service
```

```go
func TestService_Method(t *testing.T) {
    ctrl := gomock.NewController(t)
    defer ctrl.Finish()

    mockRepo := NewMockRepository(ctrl)
    mockCache := NewMockCache(ctrl)

    svc := NewService(mockRepo, mockCache)

    // Expect specific calls
    mockRepo.EXPECT().Get(gomock.Any()).Return(expectedData, nil)
    mockCache.EXPECT().Set(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)

    result, err := svc.Method(context.Background(), input)
    assert.NoError(t, err)
    assert.Equal(t, expectedResult, result)
}
```

## Database Mock with sqlmock

```go
func TestDatabaseQuery(t *testing.T) {
    db, mock, err := sqlmock.New()
    if err != nil {
        t.Fatalf("an error '%s' was not expected when opening a stub database connection", err)
    }
    defer db.Close()

    rows := sqlmock.NewRows([]string{"id", "name"}).
        AddRow(1, "first").
        AddRow(2, "second")

    mock.ExpectQuery("SELECT id, name FROM users").
        WillReturnRows(rows)

    // Execute test code that uses db.Query
    // Verify expectations with mock.ExpectationsWereMet()
}
```

## Testing HTTP Handlers

```go
func TestHandler(t *testing.T) {
    req := httptest.NewRequest("GET", "/api/endpoint", nil)
    w := httptest.NewRecorder()

    Handler(w, req)

    assert.Equal(t, http.StatusOK, w.Code)
    assert.Contains(t, w.Body.String(), "expected")
}
```

## Observability Patterns

### OpenTelemetry Tracing

```go
func Operation(ctx context.Context) error {
    ctx, span := tracer.Start(ctx, "OperationName")
    defer span.End()

    if err := doWork(ctx); err != nil {
        span.RecordError(err)
        span.SetStatus(codes.Error, "failed")
        return err
    }
    span.SetStatus(codes.Ok, "success")
    return nil
}
```

### Structured Logging with slog

```go
logger.InfoContext(ctx, "operation completed",
    "request_id", id,
    "duration_ms", duration.Milliseconds())
logger.ErrorContext(ctx, "operation failed",
    "error", err)
```

### Metrics

```go
// Counter
requestsTotal.WithLabelValues(status, method).Inc()

// Histogram
requestDuration.WithLabelValues(method).Observe(duration.Seconds())
```

## Test Commands

```bash
# Run with coverage
go test -coverprofile=c.out ./...
go tool cover -func=c.out

# Parallel tests
go test -parallel=4 ./...

# Race detector
go test -race ./...

# View coverage in browser
go tool cover -html=coverage.out
```

## Best Practices

- Use `t.Parallel()` for independent test cases
- Keep test files adjacent to implementation (`*_test.go`)
- Name test files consistently: `function_test.go`
- Use `require` instead of `assert` for setup that must pass
- Clean up resources in `defer` or `t.Cleanup()`
- Add tracing to all exported functions
- Use structured logging with consistent field names
- Instrument metrics at request boundaries
