package pkg_test

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"testing"

	"github.com/DATA-DOG/go-sqlmock"
	_ "github.com/lib/pq" // PostgreSQL driver
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Repository defines the data access interface
type Repository interface {
	Get(ctx context.Context, id string) (*Item, error)
	Create(ctx context.Context, item *Item) error
}

// SQLRepository implements Repository using SQL
type SQLRepository struct {
	db *sql.DB
}

// NewSQLRepository creates a new SQL repository
func NewSQLRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

// Get retrieves an item by ID
func (r *SQLRepository) Get(ctx context.Context, id string) (*Item, error) {
	query := "SELECT id, name FROM items WHERE id = $1"

	row := r.db.QueryRowContext(ctx, query, id)

	var item Item
	err := row.Scan(&item.ID, &item.Name)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil, fmt.Errorf("item not found: %s", id)
		}
		return nil, fmt.Errorf("failed to query item: %w", err)
	}

	return &item, nil
}

// Create inserts a new item
func (r *SQLRepository) Create(ctx context.Context, item *Item) error {
	query := "INSERT INTO items (id, name) VALUES ($1, $2)"

	result, err := r.db.ExecContext(ctx, query, item.ID, item.Name)
	if err != nil {
		return fmt.Errorf("failed to create item: %w", err)
	}

	// Verify insertion
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected != 1 {
		return fmt.Errorf("expected 1 row affected, got %d", rowsAffected)
	}

	return nil
}

// UpdateWithTransaction demonstrates transaction handling
func (r *SQLRepository) UpdateWithTransaction(ctx context.Context, item *Item) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if p := recover(); p != nil {
			tx.Rollback()
			panic(p)
		}
	}()

	// Execute multiple operations within transaction
	if err := r.updateItem(ctx, tx, item); err != nil {
		tx.Rollback()
		return err
	}

	if err := r.logChange(ctx, tx, item); err != nil {
		tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// updateItem updates an item within a transaction
func (r *SQLRepository) updateItem(ctx context.Context, tx *sql.Tx, item *Item) error {
	query := "UPDATE items SET name = $1 WHERE id = $2"
	_, err := tx.ExecContext(ctx, query, item.Name, item.ID)
	return err
}

// logChange logs a change within a transaction
func (r *SQLRepository) logChange(ctx context.Context, tx *sql.Tx, item *Item) error {
	query := "INSERT INTO item_changes (item_id, name, changed_at) VALUES ($1, $2, NOW())"
	_, err := tx.ExecContext(ctx, query, item.ID, item.Name)
	return err
}

// TestSQLRepository_Get tests the Get method
func TestSQLRepository_Get(t *testing.T) {
	tests := []struct {
		name    string
		id      string
		mockFn  func(sqlmock.Sqlmock)
		want    *Item
		wantErr bool
	}{
		{
			name: "success case",
			id:   "123",
			mockFn: func(m sqlmock.Sqlmock) {
				rows := sqlmock.NewRows([]string{"id", "name"}).
					AddRow("123", "test item")
				m.ExpectQuery("SELECT id, name FROM items WHERE id = \\$1").
					WithArgs("123").
					WillReturnRows(rows)
			},
			want:    &Item{ID: "123", Name: "test item"},
			wantErr: false,
		},
		{
			name: "not found",
			id:   "999",
			mockFn: func(m sqlmock.Sqlmock) {
				m.ExpectQuery("SELECT id, name FROM items WHERE id = \\$1").
					WithArgs("999").
					WillReturnError(sql.ErrNoRows)
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "database error",
			id:   "123",
			mockFn: func(m sqlmock.Sqlmock) {
				m.ExpectQuery("SELECT id, name FROM items WHERE id = \\$1").
					WithArgs("123").
					WillReturnError(errors.New("database error"))
			},
			want:    nil,
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			// Setup
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockFn(mock)

			repo := NewSQLRepository(db)

			// Execute
			got, err := repo.Get(context.Background(), tt.id)

			// Assert
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)

			// Verify mock expectations
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}

// TestSQLRepository_Create tests the Create method
func TestSQLRepository_Create(t *testing.T) {
	tests := []struct {
		name    string
		item    *Item
		mockFn  func(sqlmock.Sqlmock)
		wantErr bool
	}{
		{
			name: "success case",
			item: &Item{ID: "123", Name: "test item"},
			mockFn: func(m sqlmock.Sqlmock) {
				m.ExpectExec("INSERT INTO items").
					WithArgs("123", "test item").
					WillReturnResult(sqlmock.NewResult(1, 1))
			},
			wantErr: false,
		},
		{
			name: "database error",
			item: &Item{ID: "123", Name: "test item"},
			mockFn: func(m sqlmock.Sqlmock) {
				m.ExpectExec("INSERT INTO items").
					WithArgs("123", "test item").
					WillReturnError(errors.New("database error"))
			},
			wantErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()

			// Setup
			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockFn(mock)

			repo := NewSQLRepository(db)

			// Execute
			err = repo.Create(context.Background(), tt.item)

			// Assert
			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)

			// Verify mock expectations
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}
