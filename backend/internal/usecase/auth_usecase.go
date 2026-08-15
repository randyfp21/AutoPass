package usecase

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/autopass/backend/internal/config"
	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/repository"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
	"golang.org/x/crypto/bcrypt"
)

// Claims defines the JWT custom claims structure.
type Claims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Role   string `json:"role"`
	jwt.RegisteredClaims
}

// AuthUsecase defines the interface for authentication business logic.
type AuthUsecase interface {
	Register(ctx context.Context, req domain.RegisterRequest) (*domain.AuthResponse, error)
	Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error)
	Logout(ctx context.Context, tokenString string) error
	ValidateToken(tokenString string) (*Claims, error)
	UpdateProfile(ctx context.Context, userID string, req domain.UpdateProfileRequest) (*domain.UserResponse, error)
	ToggleSubscription(ctx context.Context, subscriberID, targetUserID string) (*domain.SubscriptionResponse, error)
	GetUserProfileStats(ctx context.Context, targetUserID, currentUserID string) (*domain.UserProfileStatsResponse, error)
}

type authUsecase struct {
	userRepo repository.UserRepository
	redis    *redis.Client
	cfg      *config.Config
}

// NewAuthUsecase creates a new AuthUsecase instance.
func NewAuthUsecase(userRepo repository.UserRepository, redisClient *redis.Client, cfg *config.Config) AuthUsecase {
	return &authUsecase{
		userRepo: userRepo,
		redis:    redisClient,
		cfg:      cfg,
	}
}

// Register creates a new user account and returns an auth token.
func (u *authUsecase) Register(ctx context.Context, req domain.RegisterRequest) (*domain.AuthResponse, error) {
	existing, err := u.userRepo.GetUserByEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.Register check email: %w", err)
	}
	if existing != nil {
		return nil, errors.New("email already registered")
	}

	hashedBytes, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.Register hash password: %w", err)
	}
	hash := string(hashedBytes)

	var phone *string
	if req.PhoneNumber != "" {
		phone = &req.PhoneNumber
	}

	usernameStr := strings.TrimPrefix(req.Username, "@")
	if usernameStr == "" {
		parts := strings.Split(req.Email, "@")
		usernameStr = parts[0]
	}

	user := &domain.User{
		ID:           uuid.New().String(),
		Email:        req.Email,
		Username:     &usernameStr,
		PasswordHash: &hash,
		FullName:     req.FullName,
		PhoneNumber:  phone,
		Role:         "user",
		AuthProvider: "email",
	}

	if err := u.userRepo.CreateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("authUsecase.Register create user: %w", err)
	}

	token, err := u.generateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.Register generate token: %w", err)
	}

	return &domain.AuthResponse{
		Token: token,
		User: domain.UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			Username:    user.Username,
			FullName:    user.FullName,
			PhoneNumber: user.PhoneNumber,
			AvatarURL:   user.AvatarURL,
			Bio:         user.Bio,
			Role:        user.Role,
		},
	}, nil
}

// Login validates credentials (email or phone number) and returns an auth token.
func (u *authUsecase) Login(ctx context.Context, req domain.LoginRequest) (*domain.AuthResponse, error) {
	user, err := u.userRepo.GetUserByPhoneOrEmail(ctx, req.Email)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.Login get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("invalid email or password")
	}
	if user.PasswordHash == nil {
		return nil, errors.New("account uses social login, please use Google sign-in")
	}

	if err := bcrypt.CompareHashAndPassword([]byte(*user.PasswordHash), []byte(req.Password)); err != nil {
		return nil, errors.New("invalid email or password")
	}

	token, err := u.generateJWT(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.Login generate token: %w", err)
	}

	return &domain.AuthResponse{
		Token: token,
		User: domain.UserResponse{
			ID:          user.ID,
			Email:       user.Email,
			Username:    user.Username,
			FullName:    user.FullName,
			PhoneNumber: user.PhoneNumber,
			AvatarURL:   user.AvatarURL,
			Bio:         user.Bio,
			Role:        user.Role,
		},
	}, nil
}

// Logout blacklists a JWT in Redis with TTL matching the token's remaining lifetime.
func (u *authUsecase) Logout(ctx context.Context, tokenString string) error {
	claims, err := u.ValidateToken(tokenString)
	if err != nil {
		return nil
	}

	remaining := time.Until(claims.ExpiresAt.Time)
	if remaining <= 0 {
		return nil
	}

	blacklistKey := fmt.Sprintf("blacklist:%s", tokenString)
	if err := u.redis.Set(ctx, blacklistKey, "1", remaining).Err(); err != nil {
		return fmt.Errorf("authUsecase.Logout blacklist token: %w", err)
	}

	return nil
}

// ValidateToken parses and validates a JWT token string.
func (u *authUsecase) ValidateToken(tokenString string) (*Claims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(u.cfg.JWTSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("authUsecase.ValidateToken parse: %w", err)
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return nil, errors.New("invalid token claims")
	}

	return claims, nil
}

// generateJWT creates a signed JWT string with a 24-hour expiration.
func (u *authUsecase) generateJWT(userID, email, role string) (string, error) {
	claims := Claims{
		UserID: userID,
		Email:  email,
		Role:   role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(24 * time.Hour)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			Issuer:    "autopass-api",
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(u.cfg.JWTSecret))
	if err != nil {
		return "", fmt.Errorf("authUsecase.generateJWT: %w", err)
	}

	return signedToken, nil
}

// UpdateProfile modifies a user's full name, username, phone number, avatar URL, and bio.
func (u *authUsecase) UpdateProfile(ctx context.Context, userID string, req domain.UpdateProfileRequest) (*domain.UserResponse, error) {
	user, err := u.userRepo.GetUserByID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.UpdateProfile get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	user.FullName = req.FullName
	user.PhoneNumber = req.PhoneNumber
	user.AvatarURL = req.AvatarURL
	user.Bio = req.Bio

	if req.Username != nil && *req.Username != "" {
		clean := strings.TrimPrefix(*req.Username, "@")
		user.Username = &clean
	}

	if err := u.userRepo.UpdateUser(ctx, user); err != nil {
		return nil, fmt.Errorf("authUsecase.UpdateProfile update user: %w", err)
	}

	return &domain.UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		Username:    user.Username,
		FullName:    user.FullName,
		PhoneNumber: user.PhoneNumber,
		AvatarURL:   user.AvatarURL,
		Bio:         user.Bio,
		Role:        user.Role,
	}, nil
}

// ToggleSubscription subscribes/unsubscribes subscriberID to/from targetUserID.
func (u *authUsecase) ToggleSubscription(ctx context.Context, subscriberID, targetUserID string) (*domain.SubscriptionResponse, error) {
	isSubscribed, count, err := u.userRepo.ToggleSubscription(ctx, subscriberID, targetUserID)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.ToggleSubscription: %w", err)
	}
	return &domain.SubscriptionResponse{
		IsSubscribed:     isSubscribed,
		SubscribersCount: count,
	}, nil
}

// GetUserProfileStats returns target user's public info and subscriber stats.
func (u *authUsecase) GetUserProfileStats(ctx context.Context, targetUserID, currentUserID string) (*domain.UserProfileStatsResponse, error) {
	user, err := u.userRepo.GetUserByID(ctx, targetUserID)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.GetUserProfileStats get user: %w", err)
	}
	if user == nil {
		return nil, errors.New("user not found")
	}

	count, isSubscribed, err := u.userRepo.GetUserSubscriptionStats(ctx, user.ID, currentUserID)
	if err != nil {
		return nil, fmt.Errorf("authUsecase.GetUserProfileStats stats: %w", err)
	}

	userResp := domain.UserResponse{
		ID:          user.ID,
		Email:       user.Email,
		Username:    user.Username,
		FullName:    user.FullName,
		PhoneNumber: user.PhoneNumber,
		AvatarURL:   user.AvatarURL,
		Bio:         user.Bio,
		Role:        user.Role,
	}

	return &domain.UserProfileStatsResponse{
		User:             userResp,
		SubscribersCount: count,
		IsSubscribed:     isSubscribed,
		ThreadsCount:     0,
	}, nil
}
