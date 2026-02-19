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

// DBTX is implemented by both *sql.DB and *sql.Tx.
// Repositories accept DBTX so the service layer can pass a transaction via WithTx.
type DBTX interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
	QueryContext(ctx context.Context, query string, args ...any) (*sql.Rows, error)
}

// Repository defines the data access interface.
// WithTx returns a new instance of the repository scoped to the given transaction,
// allowing the service layer to manage transaction boundaries.
type Repository interface {
	Get(ctx context.Context, id string) (*Item, error)
	Create(ctx context.Context, item *Item) error
	Update(ctx context.Context, item *Item) error
	WithTx(tx *sql.Tx) Repository
}

// SQLRepository implements Repository using SQL
type SQLRepository struct {
	db DBTX
}

// NewSQLRepository creates a new SQL repository
func NewSQLRepository(db *sql.DB) *SQLRepository {
	return &SQLRepository{db: db}
}

// WithTx returns a new SQLRepository scoped to the given transaction.
// Called by the service layer to run multiple operations atomically.
func (r *SQLRepository) WithTx(tx *sql.Tx) Repository {
	return &SQLRepository{db: tx}
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

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected != 1 {
		return fmt.Errorf("expected 1 row affected, got %d", rowsAffected)
	}

	return nil
}

// Update updates an existing item
func (r *SQLRepository) Update(ctx context.Context, item *Item) error {
	query := "UPDATE items SET name = $1 WHERE id = $2"

	result, err := r.db.ExecContext(ctx, query, item.Name, item.ID)
	if err != nil {
		return fmt.Errorf("failed to update item: %w", err)
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return fmt.Errorf("failed to get rows affected: %w", err)
	}

	if rowsAffected != 1 {
		return fmt.Errorf("expected 1 row affected, got %d", rowsAffected)
	}

	return nil
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

			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockFn(mock)

			repo := NewSQLRepository(db)

			got, err := repo.Get(context.Background(), tt.id)

			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			assert.Equal(t, tt.want, got)
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

			db, mock, err := sqlmock.New()
			require.NoError(t, err)
			defer db.Close()

			tt.mockFn(mock)

			repo := NewSQLRepository(db)

			err = repo.Create(context.Background(), tt.item)

			if tt.wantErr {
				require.Error(t, err)
				return
			}
			require.NoError(t, err)
			require.NoError(t, mock.ExpectationsWereMet())
		})
	}
}
