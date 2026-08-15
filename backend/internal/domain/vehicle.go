package domain

import "time"

// Vehicle represents the vehicles table in the database.
type Vehicle struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	Nickname        *string   `json:"nickname"`
	Category        string    `json:"category"`
	FuelType        string    `json:"fuel_type"`
	LicensePlate    string    `json:"license_plate"`
	Brand           string    `json:"brand"`
	Model           string    `json:"model"`
	VariantType     *string   `json:"variant_type"`
	ManufactureYear int       `json:"manufacture_year"`
	CurrentMileage  int       `json:"current_mileage"`
	PhotoURL        *string   `json:"photo_url"`
	STNKNumber      *string   `json:"stnk_number"`
	STNKExpiryDate  *string   `json:"stnk_expiry_date"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}

// CreateVehicleRequest is the payload for creating a vehicle.
type CreateVehicleRequest struct {
	Nickname        *string `json:"nickname"`
	Category        string  `json:"category" binding:"required,oneof=motor mobil"`
	FuelType        string  `json:"fuel_type"`
	LicensePlate    string  `json:"license_plate" binding:"required"`
	Brand           string  `json:"brand" binding:"required"`
	Model           string  `json:"model" binding:"required"`
	VariantType     *string `json:"variant_type"`
	ManufactureYear int     `json:"manufacture_year" binding:"required,min=1900"`
	CurrentMileage  int     `json:"current_mileage" binding:"min=0"`
	PhotoURL        *string `json:"photo_url"`
	STNKNumber      *string `json:"stnk_number"`
	STNKExpiryDate  *string `json:"stnk_expiry_date"`
}

// UpdateVehicleRequest is the payload for updating a vehicle.
type UpdateVehicleRequest struct {
	Nickname        *string `json:"nickname"`
	Category        string  `json:"category" binding:"required,oneof=motor mobil"`
	FuelType        string  `json:"fuel_type"`
	LicensePlate    string  `json:"license_plate" binding:"required"`
	Brand           string  `json:"brand" binding:"required"`
	Model           string  `json:"model" binding:"required"`
	VariantType     *string `json:"variant_type"`
	ManufactureYear int     `json:"manufacture_year" binding:"required,min=1900"`
	CurrentMileage  int     `json:"current_mileage" binding:"min=0"`
	PhotoURL        *string `json:"photo_url"`
	STNKNumber      *string `json:"stnk_number"`
	STNKExpiryDate  *string `json:"stnk_expiry_date"`
}

// VehicleResponse is the public representation of a vehicle.
type VehicleResponse struct {
	ID              string    `json:"id"`
	UserID          string    `json:"user_id"`
	Nickname        *string   `json:"nickname"`
	Category        string    `json:"category"`
	FuelType        string    `json:"fuel_type"`
	LicensePlate    string    `json:"license_plate"`
	Brand           string    `json:"brand"`
	Model           string    `json:"model"`
	VariantType     *string   `json:"variant_type"`
	ManufactureYear int       `json:"manufacture_year"`
	CurrentMileage  int       `json:"current_mileage"`
	PhotoURL        *string   `json:"photo_url"`
	STNKNumber      *string   `json:"stnk_number"`
	STNKExpiryDate  *string   `json:"stnk_expiry_date"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
}
