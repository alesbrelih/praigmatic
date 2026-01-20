package pkg_test

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// ExampleError is a sentinel error for demonstration
var ExampleError = errors.New("example error")

// ErrorResponse represents a structured error response
type ErrorResponse struct {
	Error   string `json:"error"`
	Details string `json:"details,omitempty"`
}

// writeError writes a JSON error response
func writeError(w http.ResponseWriter, r *http.Request, status int, err error) {
	resp := ErrorResponse{
		Error:   http.StatusText(status),
		Details: err.Error(),
	}

	if status >= 500 {
		resp.Details = "internal server error"
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(resp)
}

// Handler is an example HTTP handler
type Handler struct {
	// Add service dependencies here
}

// NewHandler creates a new handler
func NewHandler() *Handler {
	return &Handler{}
}

// HandleExample handles example requests
func (h *Handler) HandleExample(w http.ResponseWriter, r *http.Request) {
	// Validate request method
	if r.Method != http.MethodGet {
		writeError(w, r, http.StatusMethodNotAllowed, errors.New("method not allowed"))
		return
	}

	// Extract parameters from request
	id := r.URL.Query().Get("id")
	if id == "" {
		writeError(w, r, http.StatusBadRequest, errors.New("id parameter is required"))
		return
	}

	// TODO: Process request using service layer
	// result, err := h.service.Example(r.Context(), id)

	// Return success response
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"id":     id,
		"status": "processed",
	})
}

// TestHandler tests the Handler
func TestHandler(t *testing.T) {
	tests := []struct {
		name           string
		method         string
		queryParams    string
		expectedStatus int
		wantErr        bool
	}{
		{
			name:           "success case",
			method:         http.MethodGet,
			queryParams:    "?id=123",
			expectedStatus: http.StatusOK,
			wantErr:        false,
		},
		{
			name:           "missing id parameter",
			method:         http.MethodGet,
			queryParams:    "",
			expectedStatus: http.StatusBadRequest,
			wantErr:        true,
		},
		{
			name:           "invalid method",
			method:         http.MethodPost,
			queryParams:    "?id=123",
			expectedStatus: http.StatusMethodNotAllowed,
			wantErr:        true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			// Setup
			handler := NewHandler()
			req := httptest.NewRequest(tt.method, "/example"+tt.queryParams, nil)
			w := httptest.NewRecorder()

			// Execute
			handler.HandleExample(w, req)

			// Assert
			assert.Equal(t, tt.expectedStatus, w.Code)
			assert.Contains(t, w.Header().Get("Content-Type"), "application/json")
		})
	}
}
