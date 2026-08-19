package domain

import "time"

type VehiclePartMonitor struct {
	ID                  string    `json:"id"`
	VehicleID           string    `json:"vehicle_id"`
	PartKey             string    `json:"part_key"`
	PartName            string    `json:"part_name"`
	IconType            string    `json:"icon_type"`
	LastReplacedMileage int       `json:"last_replaced_mileage"`
	IdealLifespanKM     int       `json:"ideal_lifespan_km"`
	IsEnabled           bool      `json:"is_enabled"`
	LastReplacedDate    *string   `json:"last_replaced_date,omitempty"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`

	// Calculated status fields for UI
	KmTraveled      int  `json:"km_traveled"`
	KmRemaining     int  `json:"km_remaining"`
	ProgressPercent int  `json:"progress_percent"`
	IsUrgent        bool `json:"is_urgent"`
	IsExpired       bool `json:"is_expired"`
}

type UpdatePartMonitorRequest struct {
	IsEnabled       *bool `json:"is_enabled"`
	IdealLifespanKM *int  `json:"ideal_lifespan_km"`
}

type ReplacePartRequest struct {
	Mileage *int    `json:"mileage"`
	Date    *string `json:"date"`
}
