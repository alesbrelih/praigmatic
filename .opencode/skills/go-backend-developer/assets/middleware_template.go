package pkg_test

import (
	"context"
	"encoding/json"
	"fmt"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Middleware type - wraps http.Handler
type Middleware func(http.Handler) http.Handler

// Chain middleware functions
func Chain(h http.Handler, middlewares ...Middleware) http.Handler {
	for i := len(middlewares) - 1; i >= 0; i-- {
		h = middlewares[i](h)
	}
	return h
}

// RequestID Middleware

type contextKey string

const requestIDKey contextKey = "requestID"

// RequestID adds a unique ID to each request
func RequestID(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestID := r.Header.Get("X-Request-ID")
		if requestID == "" {
			requestID = fmt.Sprintf("req-%d", time.Now().UnixNano())
		}

		ctx := context.WithValue(r.Context(), requestIDKey, requestID)
		w.Header().Set("X-Request-ID", requestID)

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

// Logging Middleware

type responseWriter struct {
	http.ResponseWriter
	status int
	mu     sync.Mutex
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.mu.Lock()
	defer rw.mu.Unlock()
	rw.status = code
	rw.ResponseWriter.WriteHeader(code)
}

// Logging logs request details
func Logging(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		wrapped := &responseWriter{ResponseWriter: w, status: 0}

		next.ServeHTTP(wrapped, r)

		slog.InfoContext(r.Context(),
			"request completed",
			"method", r.Method,
			"path", r.URL.Path,
			"status", wrapped.status,
			"duration", time.Since(start),
			"request_id", GetRequestID(r.Context()),
		)
	})
}

// Recovery Middleware

// Recovery recovers from panics
func Recovery(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		wrapped := &responseWriter{ResponseWriter: w, status: 0}

		defer func() {
			if err := recover(); err != nil {
				// Log sanitized error - don't log raw errors that might contain sensitive data
				slog.ErrorContext(r.Context(),
					"panic recovered",
					"error", sanitizeError(err),
					"path", r.URL.Path,
					"request_id", GetRequestID(r.Context()),
				)

				if wrapped.status == 0 {
					// Always return generic error to client
					w.Header().Set("Content-Type", "application/json")
					w.WriteHeader(http.StatusInternalServerError)
					json.NewEncoder(w).Encode(map[string]string{
						"error": "internal server error",
					})
				}
			}
		}()

		next.ServeHTTP(wrapped, r)
	})
}

// sanitizeError removes sensitive data from errors before logging
func sanitizeError(err interface{}) string {
	// In production, implement sanitization to remove:
	// - Passwords/tokens
	// - Personal information
	// - Stack traces with sensitive data
	//
	// For now, just convert to string
	return fmt.Sprintf("%v", err)
}

// Authentication Middleware

type AuthService interface {
	ValidateToken(token string) (string, error)
}

type authService struct{}

func (a *authService) ValidateToken(token string) (string, error) {
	// Remove "Bearer " prefix if present
	token = trimBearerPrefix(token)
	if token == "" {
		return "", fmt.Errorf("invalid token format")
	}

	// In production, implement proper JWT validation:
	// 1. Parse token with claims
	// 2. Verify signature with secret key
	// 3. Check expiration time
	// 4. Extract user ID from claims
	//
	// Example using github.com/golang-jwt/jwt/v5:
	// claims := jwt.MapClaims{}
	// tkn, err := jwt.ParseWithClaims(token, claims, func(token *jwt.Token) (interface{}, error) {
	//     if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
	//         return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
	//     }
	//     return []byte(secret), nil
	// })
	// if err != nil || !tkn.Valid {
	//     return "", fmt.Errorf("invalid token")
	// }
	// userID, ok := claims["sub"].(string)
	// if !ok || userID == "" {
	//     return "", fmt.Errorf("invalid token claims")
	// }
	// return userID, nil

	// For template demonstration: simple token validation
	if token == "valid-token" {
		return "user-123", nil
	}
	return "", fmt.Errorf("invalid token")
}

// trimBearerPrefix removes "Bearer " prefix from token
func trimBearerPrefix(token string) string {
	return strings.TrimPrefix(token, "Bearer ")
}

const userKey contextKey = "user"

// Authentication validates JWT tokens
func Authentication(auth AuthService) Middleware {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			token := trimBearerPrefix(authHeader)
			userID, err := auth.ValidateToken(token)
			if err != nil {
				slog.ErrorContext(r.Context(),
					"authentication failed",
					"error", err,
					"path", r.URL.Path,
					"request_id", GetRequestID(r.Context()),
				)
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			ctx := context.WithValue(r.Context(), userKey, userID)
			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUser retrieves the user from context
func GetUser(ctx context.Context) (string, bool) {
	if user, ok := ctx.Value(userKey).(string); ok {
		return user, true
	}
	return "", false
}

// TestMiddleware

func TestRequestIDMiddleware(t *testing.T) {
	tests := []struct {
		name           string
		requestID      string
		wantInResponse bool
	}{
		{
			name:           "with request ID header",
			requestID:      "test-123",
			wantInResponse: true,
		},
		{
			name:           "without request ID header",
			requestID:      "",
			wantInResponse: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				requestID := GetRequestID(r.Context())
				w.Write([]byte(requestID))
			})

			req := httptest.NewRequest("GET", "/test", nil)
			if tt.requestID != "" {
				req.Header.Set("X-Request-ID", tt.requestID)
			}

			w := httptest.NewRecorder()

			middleware := RequestID(handler)
			middleware.ServeHTTP(w, req)

			assert.Equal(t, http.StatusOK, w.Code)
			assert.Equal(t, tt.wantInResponse, w.Header().Get("X-Request-ID") != "")
		})
	}
}

func TestAuthenticationMiddleware(t *testing.T) {
	tests := []struct {
		name           string
		authHeader     string
		expectedStatus int
		wantUser       bool
	}{
		{
			name:           "valid token",
			authHeader:     "valid-token",
			expectedStatus: http.StatusOK,
			wantUser:       true,
		},
		{
			name:           "invalid token",
			authHeader:     "invalid-token",
			expectedStatus: http.StatusUnauthorized,
			wantUser:       false,
		},
		{
			name:           "missing auth header",
			authHeader:     "",
			expectedStatus: http.StatusUnauthorized,
			wantUser:       false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			auth := &authService{}
			handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				user, ok := GetUser(r.Context())
				if ok {
					w.Write([]byte(user))
				} else {
					w.Write([]byte("no user"))
				}
			})

			req := httptest.NewRequest("GET", "/test", nil)
			if tt.authHeader != "" {
				req.Header.Set("Authorization", tt.authHeader)
			}

			w := httptest.NewRecorder()

			middleware := Authentication(auth)(handler)
			middleware.ServeHTTP(w, req)

			assert.Equal(t, tt.expectedStatus, w.Code)
		})
	}
}

func TestMiddlewareChain(t *testing.T) {
	t.Parallel()

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	req := httptest.NewRequest("GET", "/test", nil)
	w := httptest.NewRecorder()

	// Chain middleware in reverse order (last added runs first)
	chain := Chain(handler, Recovery, RequestID, Logging)
	chain.ServeHTTP(w, req)

	assert.Equal(t, http.StatusOK, w.Code)
}
