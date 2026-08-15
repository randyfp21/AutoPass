package domain

import "time"

// User represents the users table in the database.
type User struct {
	ID           string    `json:"id"`
	Email        string    `json:"email"`
	Username     *string   `json:"username"`
	PasswordHash *string   `json:"-"`
	FullName     string    `json:"full_name"`
	PhoneNumber  *string   `json:"phone_number"`
	AvatarURL    *string   `json:"avatar_url"`
	Bio          *string   `json:"bio"`
	Role         string    `json:"role"`
	AuthProvider string    `json:"auth_provider"`
	GoogleID     *string   `json:"-"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// RegisterRequest is the payload for user registration.
type RegisterRequest struct {
	Email       string `json:"email" binding:"required,email"`
	Username    string `json:"username"`
	Password    string `json:"password" binding:"required,min=6"`
	FullName    string `json:"full_name" binding:"required,min=2"`
	PhoneNumber string `json:"phone_number"`
}

// LoginRequest is the payload for user login (accepts email or phone number).
type LoginRequest struct {
	Email    string `json:"email" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// UpdateProfileRequest is the payload for updating profile info.
type UpdateProfileRequest struct {
	FullName    string  `json:"full_name" binding:"required,min=2"`
	Username    *string `json:"username"`
	PhoneNumber *string `json:"phone_number"`
	AvatarURL   *string `json:"avatar_url"`
	Bio         *string `json:"bio"`
}

// AuthResponse is returned on successful authentication.
type AuthResponse struct {
	Token string       `json:"token"`
	User  UserResponse `json:"user"`
}

// UserResponse is the public representation of a user.
type UserResponse struct {
	ID          string  `json:"id"`
	Email       string  `json:"email"`
	Username    *string `json:"username"`
	FullName    string  `json:"full_name"`
	PhoneNumber *string `json:"phone_number"`
	AvatarURL   *string `json:"avatar_url"`
	Bio         *string `json:"bio"`
	Role        string  `json:"role"`
}

// SubscriptionResponse represents the response when toggling a subscription.
type SubscriptionResponse struct {
	IsSubscribed     bool `json:"is_subscribed"`
	SubscribersCount int  `json:"subscribers_count"`
}

// UserProfileStatsResponse represents public profile info with subscriber metrics.
type UserProfileStatsResponse struct {
	User             UserResponse `json:"user"`
	SubscribersCount int          `json:"subscribers_count"`
	IsSubscribed     bool         `json:"is_subscribed"`
	ThreadsCount     int          `json:"threads_count"`
}
