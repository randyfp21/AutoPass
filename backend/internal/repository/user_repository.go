package repository

import (
	"context"
	"errors"
	"fmt"
	"net/url"
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
	ToggleSubscription(ctx context.Context, subscriberID, targetUserID string) (bool, int, error)
	GetUserSubscriptionStats(ctx context.Context, targetUserID, currentUserID string) (int, bool, error)
}

type userRepository struct {
	db *pgxpool.Pool
}

// NewUserRepository returns a new postgres-backed UserRepository.
func NewUserRepository(db *pgxpool.Pool) UserRepository {
	return &userRepository{db: db}
}

func cleanUserIdentifier(id string) string {
	decoded, err := url.QueryUnescape(id)
	if err != nil {
		decoded = id
	}
	decoded = strings.TrimPrefix(decoded, "%40")
	decoded = strings.TrimPrefix(decoded, "@")
	return strings.TrimSpace(decoded)
}

// CreateUser inserts a new user record into the database.
func (r *userRepository) CreateUser(ctx context.Context, user *domain.User) error {
	query := `
		INSERT INTO users (id, email, username, password_hash, full_name, phone_number, avatar_url, bio, role, auth_provider, google_id)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
		user.Bio,
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
		SELECT id, email, username, password_hash, full_name, phone_number, avatar_url, bio, role, auth_provider, google_id, created_at, updated_at
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
		&user.Bio,
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

	cleanUsername := cleanUserIdentifier(identifier)

	query := `
		SELECT id, email, username, password_hash, full_name, phone_number, avatar_url, bio, role, auth_provider, google_id, created_at, updated_at
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
		&user.Bio,
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
	cleanIdentifier := cleanUserIdentifier(id)
	query := `
		SELECT id, email, username, password_hash, full_name, phone_number, avatar_url, bio, role, auth_provider, google_id, created_at, updated_at
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
		&user.Bio,
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
		SET full_name = $1, username = $2, phone_number = $3, avatar_url = $4, bio = $5, updated_at = CURRENT_TIMESTAMP
		WHERE id = $6
		RETURNING updated_at
	`
	err := r.db.QueryRow(ctx, query,
		user.FullName,
		user.Username,
		user.PhoneNumber,
		user.AvatarURL,
		user.Bio,
		user.ID,
	).Scan(&user.UpdatedAt)
	if err != nil {
		return fmt.Errorf("userRepository.UpdateUser: %w", err)
	}
	return nil
}

// ToggleSubscription subscribes or unsubscribes subscriberID to/from targetUserID.
func (r *userRepository) ToggleSubscription(ctx context.Context, subscriberID, targetUserID string) (bool, int, error) {
	cleanTarget := cleanUserIdentifier(targetUserID)
	var realTargetID string
	err := r.db.QueryRow(ctx, "SELECT id::text FROM users WHERE id::text = $1 OR username = $1", cleanTarget).Scan(&realTargetID)
	if err != nil {
		return false, 0, fmt.Errorf("ToggleSubscription target not found: %w", err)
	}

	if subscriberID == realTargetID {
		return false, 0, errors.New("cannot subscribe to yourself")
	}

	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM user_subscriptions WHERE subscriber_id = $1::uuid AND target_user_id = $2::uuid)`
	if err := r.db.QueryRow(ctx, checkQuery, subscriberID, realTargetID).Scan(&exists); err != nil {
		return false, 0, err
	}

	if exists {
		_, err := r.db.Exec(ctx, `DELETE FROM user_subscriptions WHERE subscriber_id = $1::uuid AND target_user_id = $2::uuid`, subscriberID, realTargetID)
		if err != nil {
			return false, 0, err
		}
	} else {
		_, err := r.db.Exec(ctx, `INSERT INTO user_subscriptions (subscriber_id, target_user_id) VALUES ($1::uuid, $2::uuid)`, subscriberID, realTargetID)
		if err != nil {
			return false, 0, err
		}
	}

	var count int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM user_subscriptions WHERE target_user_id = $1::uuid`, realTargetID).Scan(&count)

	return !exists, count, nil
}

// GetUserSubscriptionStats returns total subscriber count and whether currentUserID has subscribed.
func (r *userRepository) GetUserSubscriptionStats(ctx context.Context, targetUserID, currentUserID string) (int, bool, error) {
	cleanTarget := cleanUserIdentifier(targetUserID)
	var realTargetID string
	err := r.db.QueryRow(ctx, "SELECT id::text FROM users WHERE id::text = $1 OR username = $1", cleanTarget).Scan(&realTargetID)
	if err != nil {
		return 0, false, err
	}

	var count int
	_ = r.db.QueryRow(ctx, `SELECT COUNT(*) FROM user_subscriptions WHERE target_user_id = $1::uuid`, realTargetID).Scan(&count)

	var isSubscribed bool
	if currentUserID != "" {
		_ = r.db.QueryRow(ctx, `SELECT EXISTS(SELECT 1 FROM user_subscriptions WHERE subscriber_id = $1::uuid AND target_user_id = $2::uuid)`, currentUserID, realTargetID).Scan(&isSubscribed)
	}

	return count, isSubscribed, nil
}
