package pkg_test

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
	"github.com/stretchr/testify/require"
)

// MockRepository is a mock for repository layer
type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) Get(ctx context.Context, id string) (*Item, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*Item), args.Error(1)
}

// Item represents a domain entity
type Item struct {
	ID   string
	Name string
}

// Service represents the business logic layer
type Service struct {
	repo *MockRepository
}

// NewService creates a new service
func NewService(repo *MockRepository) *Service {
	return &Service{repo: repo}
}

// ProcessItem processes an item
func (s *Service) ProcessItem(ctx context.Context, id string) (*Item, error) {
	// Validate input
	if id == "" {
		return nil, errors.New("id is required")
	}

	// Fetch from repository
	item, err := s.repo.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("failed to get item: %w", err)
	}

	// Apply business logic
	if item.Name == "" {
		return nil, errors.New("item name cannot be empty")
	}

	// TODO: Add more business logic

	return item, nil
}

// TestService tests the service layer
func TestService(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		mockFn  func(*MockRepository)
		want    *Item
		wantErr bool
	}{
		{
			name: "success case",
			id:   "123",
			mockFn: func(m *MockRepository) {
				m.On("Get", mock.Anything, "123").Return(&Item{ID: "123", Name: "test"}, nil)
			},
			want:    &Item{ID: "123", Name: "test"},
			wantErr: false,
		},
		{
			name: "empty id",
			id:   "",
			mockFn: func(m *MockRepository) {
				m.On("Get", mock.Anything, "").Times(0)
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "item not found",
			id:   "999",
			mockFn: func(m *MockRepository) {
				m.On("Get", mock.Anything, "999").Return(nil, ExampleError)
			},
			want:    nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			// Setup
			mockRepo := new(MockRepository)
			tt.mockFn(mockRepo)

			svc := NewService(mockRepo)

			// Execute
			got, err := svc.ProcessItem(context.Background(), tt.id)

			// Assert
			mockRepo.AssertExpectations(t)
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}
