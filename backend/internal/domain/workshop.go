package domain

import "time"

// Workshop represents the workshops table in the database.
type Workshop struct {
	ID           string    `json:"id"`
	UserID       string    `json:"user_id"`
	WorkshopName string    `json:"workshop_name"`
	Address      string    `json:"address"`
	PhoneNumber  string    `json:"phone_number"`
	LogoURL      *string   `json:"logo_url"`
	IsVerified   bool      `json:"is_verified"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

// WorkshopResponse is the public representation of a workshop.
type WorkshopResponse struct {
	ID           string  `json:"id"`
	WorkshopName string  `json:"workshop_name"`
	Address      string  `json:"address"`
	PhoneNumber  string  `json:"phone_number"`
	LogoURL      *string `json:"logo_url"`
	IsVerified   bool    `json:"is_verified"`
}
