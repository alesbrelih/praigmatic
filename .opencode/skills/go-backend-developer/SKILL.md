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
