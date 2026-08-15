package usecase

import (
	"context"
	"errors"
	"fmt"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/repository"
	"github.com/google/uuid"
)

type ThreadUsecase interface {
	CreateThread(ctx context.Context, userID string, req domain.CreateThreadRequest) (*domain.ThreadResponse, error)
	GetThreads(ctx context.Context, currentUserID string, category string) ([]*domain.ThreadResponse, error)
	GetThreadByID(ctx context.Context, threadID string, currentUserID string) (*domain.ThreadResponse, error)
	DeleteThread(ctx context.Context, threadID string, userID string) error
	ToggleLikeThread(ctx context.Context, threadID string, userID string) (bool, error)
	ToggleBookmarkThread(ctx context.Context, threadID string, userID string) (bool, error)
	GetBookmarkedThreads(ctx context.Context, userID string) ([]*domain.ThreadResponse, error)
	GetUserThreads(ctx context.Context, targetUserID string, currentUserID string) ([]*domain.ThreadResponse, error)
	CreateComment(ctx context.Context, threadID string, userID string, req domain.CreateCommentRequest) (*domain.CommentResponse, error)
	GetThreadComments(ctx context.Context, threadID string, currentUserID string) ([]*domain.CommentResponse, error)
	ToggleLikeComment(ctx context.Context, commentID string, userID string) (bool, error)
	GetUserNotifications(ctx context.Context, userID string) ([]*domain.NotificationResponse, error)
}

type threadUsecase struct {
	threadRepo repository.ThreadRepository
}

func NewThreadUsecase(threadRepo repository.ThreadRepository) ThreadUsecase {
	return &threadUsecase{threadRepo: threadRepo}
}

func (u *threadUsecase) CreateThread(ctx context.Context, userID string, req domain.CreateThreadRequest) (*domain.ThreadResponse, error) {
	if len(req.Content) == 0 {
		return nil, errors.New("content cannot be empty")
	}
	if len(req.Content) > 1500 {
		return nil, errors.New("content exceeds 1500 characters limit")
	}
	if len(req.PhotoURLs) > 5 {
		return nil, errors.New("maximum 5 photos allowed")
	}

	category := req.Category
	if category == "" {
		category = "general"
	}

	var vehicleID *string
	if req.VehicleID != nil && *req.VehicleID != "" {
		vehicleID = req.VehicleID
	}

	t := &domain.Thread{
		ID:        uuid.New().String(),
		UserID:    userID,
		VehicleID: vehicleID,
		Content:   req.Content,
		PhotoURLs: req.PhotoURLs,
		Category:  category,
	}

	if err := u.threadRepo.CreateThread(ctx, t); err != nil {
		return nil, fmt.Errorf("CreateThread: %w", err)
	}

	return u.threadRepo.GetThreadByID(ctx, t.ID, userID)
}

func (u *threadUsecase) GetThreads(ctx context.Context, currentUserID string, category string) ([]*domain.ThreadResponse, error) {
	return u.threadRepo.GetThreads(ctx, currentUserID, category)
}

func (u *threadUsecase) GetThreadByID(ctx context.Context, threadID string, currentUserID string) (*domain.ThreadResponse, error) {
	return u.threadRepo.GetThreadByID(ctx, threadID, currentUserID)
}

func (u *threadUsecase) DeleteThread(ctx context.Context, threadID string, userID string) error {
	return u.threadRepo.DeleteThread(ctx, threadID, userID)
}

func (u *threadUsecase) ToggleLikeThread(ctx context.Context, threadID string, userID string) (bool, error) {
	isLiked, err := u.threadRepo.ToggleLikeThread(ctx, threadID, userID)
	if err != nil {
		return false, err
	}

	if isLiked {
		thread, _ := u.threadRepo.GetThreadByID(ctx, threadID, userID)
		if thread != nil {
			_ = u.threadRepo.CreateNotification(ctx, thread.UserID, userID, &threadID, nil, "like_thread")
		}
	}
	return isLiked, nil
}

func (u *threadUsecase) ToggleBookmarkThread(ctx context.Context, threadID string, userID string) (bool, error) {
	return u.threadRepo.ToggleBookmarkThread(ctx, threadID, userID)
}

func (u *threadUsecase) GetBookmarkedThreads(ctx context.Context, userID string) ([]*domain.ThreadResponse, error) {
	return u.threadRepo.GetBookmarkedThreads(ctx, userID)
}

func (u *threadUsecase) GetUserThreads(ctx context.Context, targetUserID string, currentUserID string) ([]*domain.ThreadResponse, error) {
	return u.threadRepo.GetUserThreads(ctx, targetUserID, currentUserID)
}

func (u *threadUsecase) CreateComment(ctx context.Context, threadID string, userID string, req domain.CreateCommentRequest) (*domain.CommentResponse, error) {
	if len(req.Content) == 0 {
		return nil, errors.New("comment content cannot be empty")
	}
	if len(req.Content) > 800 {
		return nil, errors.New("comment content exceeds 800 characters limit")
	}

	c := &domain.ThreadComment{
		ID:       uuid.New().String(),
		ThreadID: threadID,
		UserID:   userID,
		Content:  req.Content,
	}

	if err := u.threadRepo.CreateComment(ctx, c); err != nil {
		return nil, fmt.Errorf("CreateComment: %w", err)
	}

	thread, _ := u.threadRepo.GetThreadByID(ctx, threadID, userID)
	if thread != nil {
		_ = u.threadRepo.CreateNotification(ctx, thread.UserID, userID, &threadID, &c.ID, "comment_thread")
	}

	comments, err := u.threadRepo.GetThreadComments(ctx, threadID, userID)
	if err != nil {
		return nil, err
	}

	for _, comm := range comments {
		if comm.ID == c.ID {
			return comm, nil
		}
	}
	return nil, nil
}

func (u *threadUsecase) GetThreadComments(ctx context.Context, threadID string, currentUserID string) ([]*domain.CommentResponse, error) {
	return u.threadRepo.GetThreadComments(ctx, threadID, currentUserID)
}

func (u *threadUsecase) ToggleLikeComment(ctx context.Context, commentID string, userID string) (bool, error) {
	return u.threadRepo.ToggleLikeComment(ctx, commentID, userID)
}

func (u *threadUsecase) GetUserNotifications(ctx context.Context, userID string) ([]*domain.NotificationResponse, error) {
	return u.threadRepo.GetUserNotifications(ctx, userID)
}
