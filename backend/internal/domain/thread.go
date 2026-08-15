package domain

import "time"

type Thread struct {
	ID             string    `json:"id"`
	UserID         string    `json:"user_id"`
	VehicleID      *string   `json:"vehicle_id"`
	Content        string    `json:"content"`
	PhotoURLs      []string  `json:"photo_urls"`
	Category       string    `json:"category"`
	LikesCount     int       `json:"likes_count"`
	CommentsCount  int       `json:"comments_count"`
	BookmarksCount int       `json:"bookmarks_count"`
	CreatedAt      time.Time `json:"created_at"`
	UpdatedAt      time.Time `json:"updated_at"`
}

type ThreadComment struct {
	ID         string    `json:"id"`
	ThreadID   string    `json:"thread_id"`
	UserID     string    `json:"user_id"`
	Content    string    `json:"content"`
	LikesCount int       `json:"likes_count"`
	CreatedAt  time.Time `json:"created_at"`
	UpdatedAt  time.Time `json:"updated_at"`
}

type Notification struct {
	ID          string    `json:"id"`
	RecipientID string    `json:"recipient_id"`
	ActorID     string    `json:"actor_id"`
	ThreadID    *string   `json:"thread_id"`
	CommentID   *string   `json:"comment_id"`
	Type        string    `json:"type"`
	IsRead      bool      `json:"is_read"`
	CreatedAt   time.Time `json:"created_at"`
}

type CreateThreadRequest struct {
	VehicleID *string  `json:"vehicle_id"`
	Content   string   `json:"content" binding:"required"`
	PhotoURLs []string `json:"photo_urls"`
	Category  string   `json:"category"`
}

type CreateCommentRequest struct {
	Content string `json:"content" binding:"required"`
}

type ThreadResponse struct {
	ID             string             `json:"id"`
	UserID         string             `json:"user_id"`
	UserName       string             `json:"user_name"`
	UserUsername   *string            `json:"user_username"`
	UserAvatar     *string            `json:"user_avatar"`
	UserRole       string             `json:"user_role"`
	VehicleID      *string            `json:"vehicle_id"`
	VehicleName    *string            `json:"vehicle_name"`
	VehiclePlate   *string            `json:"vehicle_plate"`
	Content        string             `json:"content"`
	PhotoURLs      []string           `json:"photo_urls"`
	Category       string             `json:"category"`
	LikesCount     int                `json:"likes_count"`
	CommentsCount  int                `json:"comments_count"`
	BookmarksCount int                `json:"bookmarks_count"`
	IsLiked        bool               `json:"is_liked"`
	IsBookmarked   bool               `json:"is_bookmarked"`
	CreatedAt      time.Time          `json:"created_at"`
	Comments       []*CommentResponse `json:"comments,omitempty"`
}

type CommentResponse struct {
	ID           string    `json:"id"`
	ThreadID     string    `json:"thread_id"`
	UserID       string    `json:"user_id"`
	UserName     string    `json:"user_name"`
	UserUsername *string   `json:"user_username"`
	UserAvatar   *string   `json:"user_avatar"`
	UserRole     string    `json:"user_role"`
	Content      string    `json:"content"`
	LikesCount   int       `json:"likes_count"`
	IsLiked      bool      `json:"is_liked"`
	CreatedAt    time.Time `json:"created_at"`
}

type NotificationResponse struct {
	ID            string    `json:"id"`
	RecipientID   string    `json:"recipient_id"`
	ActorID       string    `json:"actor_id"`
	ActorName     string    `json:"actor_name"`
	ActorUsername *string   `json:"actor_username"`
	ActorAvatar   *string   `json:"actor_avatar"`
	ThreadID      *string   `json:"thread_id"`
	ThreadPreview *string   `json:"thread_preview"`
	CommentID     *string   `json:"comment_id"`
	Type          string    `json:"type"`
	IsRead        bool      `json:"is_read"`
	CreatedAt     time.Time `json:"created_at"`
}
