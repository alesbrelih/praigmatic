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

## Database Patterns

### Connection Pool Configuration

```go
// import (
//     "database/sql"
//     "time"
// )

// Configure DB connection pool
func NewDB(dsn string) (*sql.DB, error) {
    db, err := sql.Open("postgres", dsn)
    if err != nil {
        return nil, fmt.Errorf("failed to open database: %w", err)
    }

    // Configure connection pool
    db.SetMaxOpenConns(25)           // Maximum open connections
    db.SetMaxIdleConns(5)            // Maximum idle connections
    db.SetConnMaxLifetime(5 * time.Minute)  // Maximum connection lifetime
    db.SetConnMaxIdleTime(1 * time.Minute)  // Maximum idle time

    // Verify connection is working
    if err := db.Ping(); err != nil {
        return nil, fmt.Errorf("failed to ping database: %w", err)
    }

    return db, nil
}
```

### Transaction Management

```go
// import (
//     "context"
//     "database/sql"
//     "fmt"
// )

// Transaction pattern with proper error handling
func ExecuteTransaction(ctx context.Context, db *sql.DB) error {
    // Begin transaction
    tx, err := db.BeginTx(ctx, nil)
    if err != nil {
        return fmt.Errorf("failed to begin transaction: %w", err)
    }

    // Ensure transaction is rolled back if function panics
    defer func() {
        if p := recover(); p != nil {
            tx.Rollback()
            panic(p) // re-panic after rollback
        }
    }()

    // Execute queries
    if err := updateUserBalance(ctx, tx, userID, amount); err != nil {
        tx.Rollback()
        return fmt.Errorf("failed to update balance: %w", err)
    }

    if err := recordTransaction(ctx, tx, userID, amount); err != nil {
        tx.Rollback()
        return fmt.Errorf("failed to record transaction: %w", err)
    }

    // Commit transaction
    if err := tx.Commit(); err != nil {
        return fmt.Errorf("failed to commit transaction: %w", err)
    }

    return nil
}

// updateUserBalance updates user balance within transaction
func updateUserBalance(ctx context.Context, tx *sql.Tx, userID string, amount float64) error {
    _, err := tx.ExecContext(ctx,
        "UPDATE users SET balance = balance + $1 WHERE id = $2",
        amount, userID)
    return err
}

// recordTransaction records transaction within transaction
func recordTransaction(ctx context.Context, tx *sql.Tx, userID string, amount float64) error {
    _, err := tx.ExecContext(ctx,
        "INSERT INTO transactions (user_id, amount, created_at) VALUES ($1, $2, NOW())",
        userID, amount)
    return err
}
```

### Query Patterns with Context

```go
// import (
//     "context"
//     "database/sql"
// )

// Query with context for cancellation support
func GetUser(ctx context.Context, db *sql.DB, userID string) (*User, error) {
    var user User

    // Query with context
    row := db.QueryRowContext(ctx,
        "SELECT id, name, email, balance FROM users WHERE id = $1", userID)

    // Scan row into struct
    err := row.Scan(&user.ID, &user.Name, &user.Email, &user.Balance)
    if err != nil {
        if err == sql.ErrNoRows {
            return nil, fmt.Errorf("user not found: %s", userID)
        }
        return nil, fmt.Errorf("failed to query user: %w", err)
    }

    return &user, nil
}

// Query multiple rows with context
func GetUsers(ctx context.Context, db *sql.DB) ([]*User, error) {
    // Query with context
    rows, err := db.QueryContext(ctx, "SELECT id, name, email FROM users ORDER BY name")
    if err != nil {
        return nil, fmt.Errorf("failed to query users: %w", err)
    }
    defer rows.Close()

    var users []*User

    // Iterate through rows
    for rows.Next() {
        var user User
        if err := rows.Scan(&user.ID, &user.Name, &user.Email); err != nil {
            return nil, fmt.Errorf("failed to scan user: %w", err)
        }
        users = append(users, &user)
    }

    // Check for iteration errors
    if err := rows.Err(); err != nil {
        return nil, fmt.Errorf("error iterating users: %w", err)
    }

    return users, nil
}
```

### Prepared Statements

```go
// import (
//     "context"
//     "database/sql"
// )

// Prepared statement for frequent queries
func PrepareUserQueries(db *sql.DB) (*sql.Stmt, *sql.Stmt, error) {
    // Prepare statements at startup
    insertStmt, err := db.Prepare("INSERT INTO users (name, email) VALUES ($1, $2)")
    if err != nil {
        return nil, nil, fmt.Errorf("failed to prepare insert: %w", err)
    }

    selectStmt, err := db.Prepare("SELECT id, name, email FROM users WHERE email = $1")
    if err != nil {
        insertStmt.Close()
        return nil, nil, fmt.Errorf("failed to prepare select: %w", err)
    }

    return insertStmt, selectStmt, nil
}

// Use prepared statement
func InsertUser(ctx context.Context, stmt *sql.Stmt, name, email string) error {
    result, err := stmt.ExecContext(ctx, name, email)
    if err != nil {
        return fmt.Errorf("failed to insert user: %w", err)
    }

    // Get inserted ID
    id, err := result.LastInsertId()
    if err != nil {
        return fmt.Errorf("failed to get inserted ID: %w", err)
    }

    fmt.Printf("User inserted with ID: %d\n", id)
    return nil
}

// Remember to close prepared statements when done
// defer insertStmt.Close()
// defer selectStmt.Close()
```

### Best Practices for Database Operations

- **Use prepared statements**: Prevent SQL injection and improve performance
- **Always use context**: Pass context to all DB operations for cancellation support
- **Handle sql.ErrNoRows**: Distinguish "not found" from actual errors
- **Always close rows**: Use `defer rows.Close()` after Query/QueryContext
- **Use transactions**: Wrap multiple operations in transactions for atomicity
- **Rollback on error**: Always rollback transaction if any operation fails
- **Ping after open**: Verify connection works with db.Ping()
- **Configure connection pool**: Tune SetMaxOpenConns, SetMaxIdleConns based on workload
- **Scan into structs**: Use sql.Rows.Scan with pointers to struct fields
- **Check rows.Err()**: Always check rows.Err() after iteration
- **Limit query results**: Use LIMIT to prevent large result sets
- **Use connection lifetime**: SetConnMaxLifetime to prevent stale connections

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

## HTTP Middleware

### Middleware Pattern

```go
// import (
//     "context"
//     "net/http"
// )

// Middleware type - wraps http.Handler
type Middleware func(http.Handler) http.Handler

// Chain middleware functions - middlewares are executed in reverse order
// (last in the list executes first) so the outermost middleware is the first
// to see the request and the last to see the response.
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
    for i := len(middlewares) - 1; i >= 0; i-- {
        h = middlewares[i](h)
    }
    return h
}
```

### Request ID Middleware

```go
// import (
//     "context"
//     "github.com/google/uuid"
//     "net/http"
// )

type contextKey string

const requestIDKey contextKey = "requestID"

// RequestID middleware adds a unique ID to each request
func RequestID(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Use existing request ID if present, otherwise generate new one
        requestID := r.Header.Get("X-Request-ID")
        if requestID == "" {
            requestID = uuid.New().String()
        }

        // Add to request context
        ctx := context.WithValue(r.Context(), requestIDKey, requestID)

        // Add to response header
        w.Header().Set("X-Request-ID", requestID)

        // Call next handler with new context
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// GetRequestID retrieves the request ID from context
func GetRequestID(ctx context.Context) string {
    if requestID, ok := ctx.Value(requestIDKey).(string); ok {
        return requestID
    }
    return ""
}
```

### Logging Middleware

```go
// import (
//     "log/slog"
//     "net/http"
//     "time"
// )

// Logging middleware logs request details
func Logging(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        start := time.Now()

        // Create response writer wrapper to capture status code
        wrapped := &responseWriter{w, http.StatusOK}

        // Call next handler
        next.ServeHTTP(wrapped, r)

        // Log request details
        slog.InfoContext(r.Context(),
            "request completed",
            "method", r.Method,
            "path", r.URL.Path,
            "status", wrapped.status,
            "duration", time.Since(start),
            "remote_addr", r.RemoteAddr,
        )
    })
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
    http.ResponseWriter
    status int
}

func (rw *responseWriter) WriteHeader(code int) {
    rw.status = code
    rw.ResponseWriter.WriteHeader(code)
}

func (rw *responseWriter) Write(b []byte) (int, error) {
    return rw.ResponseWriter.Write(b)
}
```

### Recovery Middleware

```go
// import (
//     "log/slog"
//     "net/http"
//     "runtime/debug"
// )

// Recovery middleware recovers from panics
func Recovery(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Wrap response writer to check if headers were written
        wrapped := &responseWriter{ResponseWriter: w, status: 0}

        defer func() {
            if err := recover(); err != nil {
                // Log panic details with stack trace
                slog.ErrorContext(r.Context(),
                    "panic recovered",
                    "error", err,
                    "stack", debug.Stack(),
                    "path", r.URL.Path,
                )

                // Only write error response if headers weren't already written
                if wrapped.status == 0 {
                    http.Error(wrapped.ResponseWriter, "Internal Server Error", http.StatusInternalServerError)
                }
            }
        }()

        next.ServeHTTP(wrapped, r)
    })
}
```

### Authentication Middleware

```go
// import (
//     "context"
//     "net/http"
//     "strings"
// )

// userKey context key for storing user in context
const userKey contextKey = "user"

// Authentication middleware validates JWT tokens
func Authentication(authService AuthService) Middleware {
    return func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            // Extract token from Authorization header
            authHeader := r.Header.Get("Authorization")
            if authHeader == "" {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }

            // Remove "Bearer " prefix if present
            token := strings.TrimPrefix(authHeader, "Bearer ")

            // Validate token
            user, err := authService.ValidateToken(token)
            if err != nil {
                http.Error(w, "Unauthorized", http.StatusUnauthorized)
                return
            }

            // Add user to context
            ctx := context.WithValue(r.Context(), userKey, user)

            // Call next handler with user in context
            next.ServeHTTP(w, r.WithContext(ctx))
        })
    }
}

// GetCurrentUser retrieves the current user from context
func GetCurrentUser(ctx context.Context) (*User, bool) {
    if user, ok := ctx.Value(userKey).(*User); ok {
        return user, true
    }
    return nil, false
}
```

### Middleware Usage Example

```go
// import (
//     "fmt"
//     "net/http"
// )

func main() {
    // Create main handler
    handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        // Get request ID from context
        requestID := GetRequestID(r.Context())

        // Get current user from context (after auth middleware)
        user, ok := GetCurrentUser(r.Context())
        if !ok {
            http.Error(w, "User not found", http.StatusUnauthorized)
            return
        }

        // Handle request
        w.Write([]byte(fmt.Sprintf("Hello %s! Request ID: %s", user.Name, requestID)))
    })

    // Apply middleware chain
    http.Handle("/", Chain(
        handler,
        RequestID,      // Add request ID
        Logging,        // Log requests
        Recovery,       // Recover from panics
        Authentication(authService), // Authenticate requests
    ))

    http.ListenAndServe(":8080", nil)
}
```

### Best Practices for Middleware

- **Order matters**: Middleware executes in reverse order of application (last added runs first)
- **Recovery first**: Always add Recovery middleware first to catch panics from other middleware
- **Request ID early**: Add RequestID middleware early so all logs include the request ID
- **Authentication before authorization**: Auth middleware should come before authz checks
- **Wrap ResponseWriter**: Use wrapped ResponseWriter to capture status codes for logging
- **Pass context forward**: Always pass `r.WithContext(ctx)` to next handler
- **Don't trust client input**: Always validate and sanitize user input
- **Handle errors**: Always handle errors in middleware, return appropriate status codes
- **Keep middleware focused**: Each middleware should have a single responsibility
- **Use context values**: Store request-scoped data (user ID, request ID) in context

## Concurrency Patterns

### Goroutine Spawning with WaitGroup

```go
// import (
//     "fmt"
//     "sync"
// )

// Spawn multiple goroutines and wait for completion
func ProcessItems(items []Item) error {
    var wg sync.WaitGroup
    errChan := make(chan error, len(items))

    // Start a goroutine for each item
    for i := range items {
        wg.Add(1)
        go func(index int) {
            defer wg.Done()

            // Process item
            if err := processItem(items[index]); err != nil {
                errChan <- err
            }
        }(i)
    }

    // Wait for all goroutines to complete
    wg.Wait()
    close(errChan)

    // Collect all errors
    var errs []error
    for err := range errChan {
        errs = append(errs, err)
    }

    // Return combined error or nil
    if len(errs) > 0 {
        return fmt.Errorf("multiple errors occurred: %v", errs)
    }

    return nil
}

// processItem processes a single item (placeholder)
func processItem(item Item) error {
    // Process item logic here
    return nil
}
```

### Channel Communication Patterns

```go
// import (
//     "fmt"
//     "sync"
//     "time"
// )

// Producer-consumer pattern with channels
func ProducerConsumer() {
    // Create channels
    items := make(chan int, 10)  // Buffered channel
    results := make(chan int, 10)

    // Start producer goroutine
    go func() {
        defer close(items)

        for i := 0; i < 10; i++ {
            items <- i
            time.Sleep(100 * time.Millisecond)
        }
    }()

    var wg sync.WaitGroup

    // Start consumer goroutines
    for i := 0; i < 3; i++ {
        wg.Add(1)
        go func(workerID int) {
            defer wg.Done()
            for item := range items {
                result := item * 2
                results <- result
                fmt.Printf("Worker %d processed item %d -> %d\n", workerID, item, result)
            }
        }(i)
    }

    // Wait for all consumers to finish before closing results
    go func() {
        wg.Wait()
        close(results)
    }()

    // Collect results
    for result := range results {
        fmt.Println("Result:", result)
    }
}
```

### Mutex for Shared State

```go
// import (
//     "sync"
// )

// Safe counter with mutex
type SafeCounter struct {
    mu    sync.Mutex
    value int
}

// Increment counter safely
func (c *SafeCounter) Increment() {
    c.mu.Lock()
    defer c.mu.Unlock()
    c.value++
}

// Get counter value safely
func (c *SafeCounter) Value() int {
    c.mu.Lock()
    defer c.mu.Unlock()
    return c.value
}
```

### Worker Pool Pattern

```go
// import (
//     "context"
//     "fmt"
//     "sync"
// )

// Job represents work to be done
type Job struct {
    ID   int
    Data string
}

// Result represents output of a job
type Result struct {
    JobID  int
    Output string
    Error  error
}

// Worker pool manages concurrent job processing
type WorkerPool struct {
    jobs    chan Job
    results chan Result
    wg      sync.WaitGroup
    workers int
}

// NewWorkerPool creates a new worker pool
func NewWorkerPool(workers int) *WorkerPool {
    return &WorkerPool{
        jobs:    make(chan Job, workers*2),
        results: make(chan Result, workers*2),
        workers: workers,
    }
}

// Start initializes and starts all workers
func (wp *WorkerPool) Start(ctx context.Context) {
    for i := 0; i < wp.workers; i++ {
        wp.wg.Add(1)
        go wp.worker(ctx, i)
    }

    // Close results when all workers are done
    go func() {
        wp.wg.Wait()
        close(wp.results)
    }()
}

// worker processes jobs from the jobs channel
func (wp *WorkerPool) worker(ctx context.Context, workerID int) {
    defer wp.wg.Done()

    for {
        select {
        case job, ok := <-wp.jobs:
            if !ok {
                return
            }

            // Process job
            result, err := processJob(job)
            wp.results <- Result{
                JobID:  job.ID,
                Output: result,
                Error:  err,
            }

        case <-ctx.Done():
            return
        }
    }
}

// Submit sends a job to the pool
func (wp *WorkerPool) Submit(job Job) {
    wp.jobs <- job
}

// Results returns the results channel
func (wp *WorkerPool) Results() <-chan Result {
    return wp.results
}

// Shutdown gracefully shuts down the pool
func (wp *WorkerPool) Shutdown() {
    close(wp.jobs)
    wp.wg.Wait()
}

// Usage example
func WorkerPoolExample() {
    ctx := context.Background()
    pool := NewWorkerPool(5)
    pool.Start(ctx)
    defer pool.Shutdown()

    // Submit jobs
    for i := 0; i < 20; i++ {
        pool.Submit(Job{ID: i, Data: fmt.Sprintf("data-%d", i)})
    }

    // Collect results
    for result := range pool.Results() {
        if result.Error != nil {
            fmt.Printf("Job %d failed: %v\n", result.JobID, result.Error)
        } else {
            fmt.Printf("Job %d result: %s\n", result.JobID, result.Output)
        }
    }
}

// processJob processes a single job (placeholder)
func processJob(job Job) (string, error) {
    // Process job logic here
    return fmt.Sprintf("processed-%s", job.Data), nil
}
```

### Best Practices for Concurrent Code

- **Always WaitGroup**: Use sync.WaitGroup to wait for goroutines to complete
- **Close channels**: Always close channels when done to avoid deadlocks
- **Lock minimal scope**: Hold locks for the shortest time possible
- **Use defer**: Always use defer with mutex unlock and WaitGroup.Done()
- **Context for cancellation**: Use context for cancellation in goroutines
- **Avoid shared state**: Prefer message passing over shared memory (channels over locks)
- **Buffered channels**: Use buffered channels for producer-consumer to reduce blocking
- **Worker pools**: Use worker pools for controlling concurrent goroutines
- **Error channels**: Collect errors from goroutines using channels
- **Panic recovery**: Add panic recovery in goroutines (especially long-running ones)
- **Select for multiple channels**: Use select to wait on multiple channels simultaneously
- **Don't close from receiver**: Never close a channel from the receiver side
- **Race detection**: Use go test -race to detect data races
- **Limit goroutines**: Avoid spawning unlimited goroutines - use worker pools or semaphores
- **Use sync.Once**: Use sync.Once for one-time initialization

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
// import (
//     "net/http"
//     "time"
//     "github.com/prometheus/client_golang/prometheus"
//     "github.com/prometheus/client_golang/promhttp"
// )

// Define metrics at package level
var (
    // Counter tracks total number of requests with status and method labels
    requestsTotal = prometheus.NewCounterVec(
        prometheus.CounterOpts{
            Name: "http_requests_total",
            Help: "Total number of HTTP requests",
        },
        []string{"status", "method"},  // Label dimensions
    )

    // Histogram tracks request duration with quantile buckets
    requestDuration = prometheus.NewHistogramVec(
        prometheus.HistogramOpts{
            Name:    "http_request_duration_seconds",
            Help:    "HTTP request duration in seconds",
            Buckets: prometheus.DefBuckets,  // Default buckets: 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10
        },
        []string{"method"},  // Label dimensions
    )
)

// Register metrics with Prometheus registry
func init() {
    prometheus.MustRegister(requestsTotal)
    prometheus.MustRegister(requestDuration)
}

// Expose metrics endpoint
func MetricsHandler() http.Handler {
    return promhttp.Handler()
}

// Usage in HTTP handler
func Handler(w http.ResponseWriter, r *http.Request) {
    start := time.Now()

    // Track status code (default to 500, update on success)
    status := "500"
    method := r.Method

    // Defer metrics recording (always runs, even on panic)
    defer func() {
        requestsTotal.WithLabelValues(status, method).Inc()
        requestDuration.WithLabelValues(method).Observe(time.Since(start).Seconds())
    }()

    // Process request
    // ... your handler logic here ...

    // Update status variable before writing response
    status = "200"
    w.WriteHeader(http.StatusOK)
}

// Register metrics endpoint in main
func main() {
    http.Handle("/metrics", MetricsHandler())
    http.ListenAndServe(":8080", nil)
}
```

#### Metrics Best Practices

- **Cardinality awareness**: Limit label cardinality to prevent high metric cardinality
- **Use histograms for latency**: Histograms show distribution, gauges only show current value
- **Use counters for totals**: Counters monotonically increase (request counts, error counts)
- **Use gauges for state**: Gauges go up and down (memory usage, connections)
- **Instrumentation layer**: Instrument at middleware level for consistent metrics across all endpoints
- **Label consistency**: Use consistent label names across all related metrics
- **Avoid user IDs as labels**: User IDs create high cardinality - use separate user metrics
- **Quantile buckets**: Use appropriate buckets for your data (e.g., response times)
- **Metric naming**: Follow Prometheus naming convention (snake_case, descriptive units)
- **Help text**: Always include Help text describing what the metric measures
- **Register once**: Register metrics in init() or during application startup
- **Metric registration**: Use `MustRegister()` for package-level metrics where registration failure is fatal. For optional metrics, use `Register()` and handle errors.

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
