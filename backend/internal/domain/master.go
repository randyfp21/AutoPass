package domain

import "time"

// MasterItem represents a master_items row.
type MasterItem struct {
	ID              string    `json:"id"`
	ItemName        string    `json:"item_name"`
	Category        string    `json:"category"`
	VehicleCategory string    `json:"vehicle_category"`
	Description     *string   `json:"description"`
	CreatedAt       time.Time `json:"created_at"`
}

// MasterItemResponse is the public DTO for a master item.
type MasterItemResponse struct {
	ID              string  `json:"id"`
	ItemName        string  `json:"item_name"`
	Category        string  `json:"category"`
	VehicleCategory string  `json:"vehicle_category"`
	Description     *string `json:"description"`
}
