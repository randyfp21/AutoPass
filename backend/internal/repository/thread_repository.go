package repository

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/autopass/backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

type ThreadRepository interface {
	CreateThread(ctx context.Context, t *domain.Thread) error
	GetThreads(ctx context.Context, currentUserID string, category string) ([]*domain.ThreadResponse, error)
	GetThreadByID(ctx context.Context, threadID string, currentUserID string) (*domain.ThreadResponse, error)
	DeleteThread(ctx context.Context, threadID string, userID string) error
	ToggleLikeThread(ctx context.Context, threadID string, userID string) (bool, error)
	ToggleBookmarkThread(ctx context.Context, threadID string, userID string) (bool, error)
	GetBookmarkedThreads(ctx context.Context, userID string) ([]*domain.ThreadResponse, error)
	GetUserThreads(ctx context.Context, targetUserID string, currentUserID string) ([]*domain.ThreadResponse, error)
	CreateComment(ctx context.Context, c *domain.ThreadComment) error
	GetThreadComments(ctx context.Context, threadID string, currentUserID string) ([]*domain.CommentResponse, error)
	ToggleLikeComment(ctx context.Context, commentID string, userID string) (bool, error)
	CreateNotification(ctx context.Context, recipientID, actorID string, threadID, commentID *string, notifType string) error
	GetUserNotifications(ctx context.Context, userID string) ([]*domain.NotificationResponse, error)
}

type threadRepository struct {
	db *pgxpool.Pool
}

func NewThreadRepository(db *pgxpool.Pool) ThreadRepository {
	return &threadRepository{db: db}
}

func (r *threadRepository) CreateThread(ctx context.Context, t *domain.Thread) error {
	photosJSON, err := json.Marshal(t.PhotoURLs)
	if err != nil {
		photosJSON = []byte("[]")
	}

	vehicleIDStr := ""
	if t.VehicleID != nil {
		vehicleIDStr = *t.VehicleID
	}

	query := `
		INSERT INTO threads (id, user_id, vehicle_id, content, photo_urls, category)
		VALUES ($1, CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END, CASE WHEN $3 = '' THEN NULL ELSE $3::uuid END, $4, $5, $6)
		RETURNING created_at, updated_at
	`
	return r.db.QueryRow(ctx, query, t.ID, t.UserID, vehicleIDStr, t.Content, photosJSON, t.Category).
		Scan(&t.CreatedAt, &t.UpdatedAt)
}

func (r *threadRepository) GetThreads(ctx context.Context, currentUserID string, category string) ([]*domain.ThreadResponse, error) {
	query := `
		SELECT 
			t.id, t.user_id, u.full_name, u.username, u.avatar_url, u.role::text,
			t.vehicle_id, v.brand || ' ' || v.model AS vehicle_name, v.license_plate AS vehicle_plate,
			t.content, t.photo_urls, t.category, t.likes_count, t.comments_count, t.bookmarks_count,
			EXISTS(SELECT 1 FROM thread_likes tl WHERE tl.thread_id = t.id AND tl.user_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END) AS is_liked,
			EXISTS(SELECT 1 FROM thread_bookmarks tb WHERE tb.thread_id = t.id AND tb.user_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END) AS is_bookmarked,
			t.created_at
		FROM threads t
		JOIN users u ON t.user_id = u.id
		LEFT JOIN vehicles v ON t.vehicle_id = v.id
		WHERE ($2 = '' OR t.category = $2)
		ORDER BY t.created_at DESC
		LIMIT 50
	`
	rows, err := r.db.Query(ctx, query, currentUserID, category)
	if err != nil {
		return nil, fmt.Errorf("GetThreads query: %w", err)
	}
	defer rows.Close()

	result := []*domain.ThreadResponse{}
	for rows.Next() {
		tr := &domain.ThreadResponse{}
		var photosJSON []byte
		if err := rows.Scan(
			&tr.ID, &tr.UserID, &tr.UserName, &tr.UserUsername, &tr.UserAvatar, &tr.UserRole,
			&tr.VehicleID, &tr.VehicleName, &tr.VehiclePlate,
			&tr.Content, &photosJSON, &tr.Category, &tr.LikesCount, &tr.CommentsCount, &tr.BookmarksCount,
			&tr.IsLiked, &tr.IsBookmarked, &tr.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("GetThreads scan: %w", err)
		}
		_ = json.Unmarshal(photosJSON, &tr.PhotoURLs)
		if tr.PhotoURLs == nil {
			tr.PhotoURLs = []string{}
		}
		result = append(result, tr)
	}
	return result, nil
}

func (r *threadRepository) GetThreadByID(ctx context.Context, threadID string, currentUserID string) (*domain.ThreadResponse, error) {
	query := `
		SELECT 
			t.id, t.user_id, u.full_name, u.username, u.avatar_url, u.role::text,
			t.vehicle_id, v.brand || ' ' || v.model AS vehicle_name, v.license_plate AS vehicle_plate,
			t.content, t.photo_urls, t.category, t.likes_count, t.comments_count, t.bookmarks_count,
			EXISTS(SELECT 1 FROM thread_likes tl WHERE tl.thread_id = t.id AND tl.user_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END) AS is_liked,
			EXISTS(SELECT 1 FROM thread_bookmarks tb WHERE tb.thread_id = t.id AND tb.user_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END) AS is_bookmarked,
			t.created_at
		FROM threads t
		JOIN users u ON t.user_id = u.id
		LEFT JOIN vehicles v ON t.vehicle_id = v.id
		WHERE t.id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END
	`
	tr := &domain.ThreadResponse{}
	var photosJSON []byte
	err := r.db.QueryRow(ctx, query, currentUserID, threadID).Scan(
		&tr.ID, &tr.UserID, &tr.UserName, &tr.UserUsername, &tr.UserAvatar, &tr.UserRole,
		&tr.VehicleID, &tr.VehicleName, &tr.VehiclePlate,
		&tr.Content, &photosJSON, &tr.Category, &tr.LikesCount, &tr.CommentsCount, &tr.BookmarksCount,
		&tr.IsLiked, &tr.IsBookmarked, &tr.CreatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, err
	}
	_ = json.Unmarshal(photosJSON, &tr.PhotoURLs)
	if tr.PhotoURLs == nil {
		tr.PhotoURLs = []string{}
	}
	return tr, nil
}

func (r *threadRepository) DeleteThread(ctx context.Context, threadID string, userID string) error {
	query := `DELETE FROM threads WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END`
	ct, err := r.db.Exec(ctx, query, threadID, userID)
	if err != nil {
		return err
	}
	if ct.RowsAffected() == 0 {
		return errors.New("thread not found or unauthorized")
	}
	return nil
}

func (r *threadRepository) ToggleLikeThread(ctx context.Context, threadID string, userID string) (bool, error) {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM thread_likes WHERE thread_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END)`
	if err := r.db.QueryRow(ctx, checkQuery, threadID, userID).Scan(&exists); err != nil {
		return false, err
	}

	if exists {
		_, err := r.db.Exec(ctx, `DELETE FROM thread_likes WHERE thread_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END`, threadID, userID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE threads SET likes_count = GREATEST(0, likes_count - 1) WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, threadID)
		return false, nil
	} else {
		_, err := r.db.Exec(ctx, `INSERT INTO thread_likes (thread_id, user_id) VALUES (CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END, CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END)`, threadID, userID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE threads SET likes_count = likes_count + 1 WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, threadID)
		return true, nil
	}
}

func (r *threadRepository) ToggleBookmarkThread(ctx context.Context, threadID string, userID string) (bool, error) {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM thread_bookmarks WHERE thread_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END)`
	if err := r.db.QueryRow(ctx, checkQuery, threadID, userID).Scan(&exists); err != nil {
		return false, err
	}

	if exists {
		_, err := r.db.Exec(ctx, `DELETE FROM thread_bookmarks WHERE thread_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END`, threadID, userID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE threads SET bookmarks_count = GREATEST(0, bookmarks_count - 1) WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, threadID)
		return false, nil
	} else {
		_, err := r.db.Exec(ctx, `INSERT INTO thread_bookmarks (thread_id, user_id) VALUES (CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END, CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END)`, threadID, userID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE threads SET bookmarks_count = bookmarks_count + 1 WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, threadID)
		return true, nil
	}
}

func (r *threadRepository) GetBookmarkedThreads(ctx context.Context, userID string) ([]*domain.ThreadResponse, error) {
	query := `
		SELECT 
			t.id, t.user_id, u.full_name, u.username, u.avatar_url, u.role::text,
			t.vehicle_id, v.brand || ' ' || v.model AS vehicle_name, v.license_plate AS vehicle_plate,
			t.content, t.photo_urls, t.category, t.likes_count, t.comments_count, t.bookmarks_count,
			EXISTS(SELECT 1 FROM thread_likes tl WHERE tl.thread_id = t.id AND tl.user_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END) AS is_liked,
			TRUE AS is_bookmarked,
			t.created_at
		FROM thread_bookmarks tb
		JOIN threads t ON tb.thread_id = t.id
		JOIN users u ON t.user_id = u.id
		LEFT JOIN vehicles v ON t.vehicle_id = v.id
		WHERE tb.user_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END
		ORDER BY tb.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []*domain.ThreadResponse{}
	for rows.Next() {
		tr := &domain.ThreadResponse{}
		var photosJSON []byte
		if err := rows.Scan(
			&tr.ID, &tr.UserID, &tr.UserName, &tr.UserUsername, &tr.UserAvatar, &tr.UserRole,
			&tr.VehicleID, &tr.VehicleName, &tr.VehiclePlate,
			&tr.Content, &photosJSON, &tr.Category, &tr.LikesCount, &tr.CommentsCount, &tr.BookmarksCount,
			&tr.IsLiked, &tr.IsBookmarked, &tr.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(photosJSON, &tr.PhotoURLs)
		if tr.PhotoURLs == nil {
			tr.PhotoURLs = []string{}
		}
		result = append(result, tr)
	}
	return result, nil
}

func (r *threadRepository) GetUserThreads(ctx context.Context, targetUserID string, currentUserID string) ([]*domain.ThreadResponse, error) {
	cleanTarget := strings.TrimPrefix(targetUserID, "@")

	query := `
		SELECT 
			t.id, t.user_id, u.full_name, u.username, u.avatar_url, u.role::text,
			t.vehicle_id, v.brand || ' ' || v.model AS vehicle_name, v.license_plate AS vehicle_plate,
			t.content, t.photo_urls, t.category, t.likes_count, t.comments_count, t.bookmarks_count,
			EXISTS(SELECT 1 FROM thread_likes tl WHERE tl.thread_id = t.id AND tl.user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END) AS is_liked,
			EXISTS(SELECT 1 FROM thread_bookmarks tb WHERE tb.thread_id = t.id AND tb.user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END) AS is_bookmarked,
			t.created_at
		FROM threads t
		JOIN users u ON t.user_id = u.id
		LEFT JOIN vehicles v ON t.vehicle_id = v.id
		WHERE t.user_id::text = $1 OR u.username = $1
		ORDER BY t.created_at DESC
	`
	rows, err := r.db.Query(ctx, query, cleanTarget, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []*domain.ThreadResponse{}
	for rows.Next() {
		tr := &domain.ThreadResponse{}
		var photosJSON []byte
		if err := rows.Scan(
			&tr.ID, &tr.UserID, &tr.UserName, &tr.UserUsername, &tr.UserAvatar, &tr.UserRole,
			&tr.VehicleID, &tr.VehicleName, &tr.VehiclePlate,
			&tr.Content, &photosJSON, &tr.Category, &tr.LikesCount, &tr.CommentsCount, &tr.BookmarksCount,
			&tr.IsLiked, &tr.IsBookmarked, &tr.CreatedAt,
		); err != nil {
			return nil, err
		}
		_ = json.Unmarshal(photosJSON, &tr.PhotoURLs)
		if tr.PhotoURLs == nil {
			tr.PhotoURLs = []string{}
		}
		result = append(result, tr)
	}
	return result, nil
}

func (r *threadRepository) CreateComment(ctx context.Context, c *domain.ThreadComment) error {
	query := `
		INSERT INTO thread_comments (id, thread_id, user_id, content)
		VALUES ($1, CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END, CASE WHEN $3 = '' THEN NULL ELSE $3::uuid END, $4)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query, c.ID, c.ThreadID, c.UserID, c.Content).Scan(&c.CreatedAt, &c.UpdatedAt)
	if err != nil {
		return err
	}
	_, _ = r.db.Exec(ctx, `UPDATE threads SET comments_count = comments_count + 1 WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, c.ThreadID)
	return nil
}

func (r *threadRepository) GetThreadComments(ctx context.Context, threadID string, currentUserID string) ([]*domain.CommentResponse, error) {
	query := `
		SELECT 
			tc.id, tc.thread_id, tc.user_id, u.full_name, u.username, u.avatar_url, u.role::text,
			tc.content, tc.likes_count,
			EXISTS(SELECT 1 FROM comment_likes cl WHERE cl.comment_id = tc.id AND cl.user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END) AS is_liked,
			tc.created_at
		FROM thread_comments tc
		JOIN users u ON tc.user_id = u.id
		WHERE tc.thread_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END
		ORDER BY tc.created_at ASC
	`
	rows, err := r.db.Query(ctx, query, threadID, currentUserID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []*domain.CommentResponse{}
	for rows.Next() {
		cr := &domain.CommentResponse{}
		if err := rows.Scan(
			&cr.ID, &cr.ThreadID, &cr.UserID, &cr.UserName, &cr.UserUsername, &cr.UserAvatar, &cr.UserRole,
			&cr.Content, &cr.LikesCount, &cr.IsLiked, &cr.CreatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, cr)
	}
	return result, nil
}

func (r *threadRepository) ToggleLikeComment(ctx context.Context, commentID string, userID string) (bool, error) {
	var exists bool
	checkQuery := `SELECT EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END)`
	if err := r.db.QueryRow(ctx, checkQuery, commentID, userID).Scan(&exists); err != nil {
		return false, err
	}

	if exists {
		_, err := r.db.Exec(ctx, `DELETE FROM comment_likes WHERE comment_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END AND user_id = CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END`, commentID, userID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE thread_comments SET likes_count = GREATEST(0, likes_count - 1) WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, commentID)
		return false, nil
	} else {
		_, err := r.db.Exec(ctx, `INSERT INTO comment_likes (comment_id, user_id) VALUES (CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END, CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END)`, commentID, userID)
		if err != nil {
			return false, err
		}
		_, _ = r.db.Exec(ctx, `UPDATE thread_comments SET likes_count = likes_count + 1 WHERE id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, commentID)
		return true, nil
	}
}

func (r *threadRepository) CreateNotification(ctx context.Context, recipientID, actorID string, threadID, commentID *string, notifType string) error {
	if recipientID == actorID {
		return nil // Don't notify self
	}
	threadIDStr := ""
	if threadID != nil {
		threadIDStr = *threadID
	}
	commentIDStr := ""
	if commentID != nil {
		commentIDStr = *commentID
	}

	query := `
		INSERT INTO notifications (recipient_id, actor_id, thread_id, comment_id, type)
		VALUES (
			CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END,
			CASE WHEN $2 = '' THEN NULL ELSE $2::uuid END,
			CASE WHEN $3 = '' THEN NULL ELSE $3::uuid END,
			CASE WHEN $4 = '' THEN NULL ELSE $4::uuid END,
			$5::notification_type
		)
	`
	_, err := r.db.Exec(ctx, query, recipientID, actorID, threadIDStr, commentIDStr, notifType)
	return err
}

func (r *threadRepository) GetUserNotifications(ctx context.Context, userID string) ([]*domain.NotificationResponse, error) {
	query := `
		SELECT 
			n.id, n.recipient_id, n.actor_id, u.full_name AS actor_name, u.username AS actor_username, u.avatar_url AS actor_avatar,
			n.thread_id, LEFT(t.content, 80) AS thread_preview,
			n.comment_id, n.type::text, n.is_read, n.created_at
		FROM notifications n
		JOIN users u ON n.actor_id = u.id
		LEFT JOIN threads t ON n.thread_id = t.id
		WHERE n.recipient_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END
		ORDER BY n.created_at DESC
		LIMIT 50
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	result := []*domain.NotificationResponse{}
	for rows.Next() {
		nr := &domain.NotificationResponse{}
		if err := rows.Scan(
			&nr.ID, &nr.RecipientID, &nr.ActorID, &nr.ActorName, &nr.ActorUsername, &nr.ActorAvatar,
			&nr.ThreadID, &nr.ThreadPreview, &nr.CommentID, &nr.Type, &nr.IsRead, &nr.CreatedAt,
		); err != nil {
			return nil, err
		}
		result = append(result, nr)
	}

	// Mark as read
	_, _ = r.db.Exec(ctx, `UPDATE notifications SET is_read = TRUE WHERE recipient_id = CASE WHEN $1 = '' THEN NULL ELSE $1::uuid END`, userID)

	return result, nil
}
