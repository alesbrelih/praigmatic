package pkg_test

import (
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestFunction(t *testing.T) {
	// Define inputs and expected outputs
	tests := []struct {
		name    string
		arg     string
		want    string
		wantErr bool
	}{
		{
			name:    "success case",
			arg:     "valid",
			want:    "result",
			wantErr: false,
		},
		{
			name:    "error case",
			arg:     "invalid",
			want:    "",
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// Setup (Mocks, etc.)

			// Execution
			got, err := Function(tt.arg)

			// Assertion
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}
