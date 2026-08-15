package repository

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/autopass/backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// UserRepository defines the interface for user data operations.
type UserRepository interface {
	CreateUser(ctx context.Context, user *domain.User) error
	GetUserByEmail(ctx context.Context, email string) (*domain.User, error)
	GetUserByPhoneOrEmail(ctx context.Context, identifier string) (*domain.User, error)
	GetUserByID(ctx context.Context, id string) (*domain.User, error)
	UpdateUser(ctx context.Context, user *domain.User) error
}

type userRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository returns a new postgres-backed UserRepository.
func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepository{db: db}
}

// CreateUser inserts a new user record into the database.
func (r *userRepository) CreateUser(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (id, email, username, password_hash, full_name, phone_number, avatar_url, role, auth_provider, google_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.ID,
		user.Email,
		user.Username,
		user.PasswordHash,
		user.FullName,
		user.PhoneNumber,
		user.AvatarURL,
		user.Role,
		user.AuthProvider,
		user.GoogleID,
	).Scan(&user.CreatedAt, &user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("userRepository.CreateUser: %w", err)
	}
	return nil
}

// GetUserByEmail retrieves a user by email address.
func (r *userRepository) GetUserByEmail(ctx context.Context, email string) (*domain.User, error) {
	query := `
		SELECT id, email, username, password_hash, full_name, phone_number, avatar_url, role, auth_provider, google_id, created_at, updated_at
		FROM users
		WHERE email = $1
	`
	user := &domain.User{}
	err := r.db.QueryRow(ctx, query, email).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.FullName,
		&user.PhoneNumber,
		&user.AvatarURL,
		&user.Role,
		&user.AuthProvider,
		&user.GoogleID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("userRepository.GetUserByEmail: %w", err)
	}
	return user, nil
}

// GetUserByPhoneOrEmail retrieves a user by email address OR phone number (with variation matching).
func (r *userRepository) GetUserByPhoneOrEmail(ctx context.Context, identifier string) (*domain.User, error) {
	p1 := identifier
	p2 := identifier
	p3 := identifier

	if strings.HasPrefix(identifier, "+62") {
		trimmed := strings.TrimPrefix(identifier, "+62")
		p2 = trimmed
		p3 = "0" + trimmed
	} else if strings.HasPrefix(identifier, "0") {
		trimmed := strings.TrimPrefix(identifier, "0")
		p2 = trimmed
		p3 = "+62" + trimmed
	} else {
		p2 = "+62" + identifier
		p3 = "0" + identifier
	}

	cleanUsername := strings.TrimPrefix(identifier, "@")

	query := `
		SELECT id, email, username, password_hash, full_name, phone_number, avatar_url, role, auth_provider, google_id, created_at, updated_at
		FROM users
		WHERE email = $1 OR phone_number = $1 OR phone_number = $2 OR phone_number = $3 OR username = $4
	`
	user := &domain.User{}
	err := r.db.QueryRow(ctx, query, p1, p2, p3, cleanUsername).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.FullName,
		&user.PhoneNumber,
		&user.AvatarURL,
		&user.Role,
		&user.AuthProvider,
		&user.GoogleID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("userRepository.GetUserByPhoneOrEmail: %w", err)
	}
	return user, nil
}

// GetUserByID retrieves a user by their UUID OR Username (e.g. @dnazrl or dnazrl).
func (r *userRepository) GetUserByID(ctx context.Context, id string) (*domain.User, error) {
	cleanIdentifier := strings.TrimPrefix(id, "@")
	query := `
		SELECT id, email, username, password_hash, full_name, phone_number, avatar_url, role, auth_provider, google_id, created_at, updated_at
		FROM users
		WHERE id::text = $1 OR username = $2
	`
	user := &domain.User{}
	err := r.db.QueryRow(ctx, query, cleanIdentifier, cleanIdentifier).Scan(
		&user.ID,
		&user.Email,
		&user.Username,
		&user.PasswordHash,
		&user.FullName,
		&user.PhoneNumber,
		&user.AvatarURL,
		&user.Role,
		&user.AuthProvider,
		&user.GoogleID,
		&user.CreatedAt,
		&user.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("userRepository.GetUserByID: %w", err)
	}
	return user, nil
}

// UpdateUser updates the mutable fields of an existing user.
func (r *userRepository) UpdateUser(ctx context.Context, user *domain.User) error {
	query := `
		UPDATE users
		SET full_name = $1, username = $2, phone_number = $3, avatar_url = $4, updated_at = CURRENT_TIMESTAMP
		WHERE id = $5
		RETURNING updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.FullName,
		user.Username,
		user.PhoneNumber,
		user.AvatarURL,
		user.ID,
	).Scan(&user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("userRepository.UpdateUser: %w", err)
	}
	return nil
}
