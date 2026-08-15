package domain

import "time"

// ServicePlanner represents the service_planners table in the database.
type ServicePlanner struct {
	ID                 string    `json:"id"`
	UserID             string    `json:"user_id"`
	VehicleID          string    `json:"vehicle_id"`
	WorkshopID         *string   `json:"workshop_id"`
	IsOfficialWorkshop bool      `json:"is_official_workshop"`
	WorkshopNameManual *string   `json:"workshop_name_manual"`
	Title              string    `json:"title"`
	PlannedDate        time.Time `json:"planned_date"`
	TargetMileage      int       `json:"target_mileage"`
	Notes              *string   `json:"notes"`
	Status             string    `json:"status"` // 'planned', 'completed', 'cancelled'
	CreatedAt          time.Time `json:"created_at"`
	UpdatedAt          time.Time `json:"updated_at"`
}

// CreatePlannerRequest is the payload for creating a service plan.
type CreatePlannerRequest struct {
	VehicleID          string  `json:"vehicle_id" binding:"required"`
	WorkshopID         *string `json:"workshop_id"`
	WorkshopNameManual *string `json:"workshop_name_manual"`
	Title              string  `json:"title" binding:"required"`
	PlannedDate        string  `json:"planned_date" binding:"required"` // Format: YYYY-MM-DD
	TargetMileage      int     `json:"target_mileage"`
	Notes              *string `json:"notes"`
}

// UpdatePlannerRequest is the payload for updating a service plan.
type UpdatePlannerRequest struct {
	WorkshopID         *string `json:"workshop_id"`
	WorkshopNameManual *string `json:"workshop_name_manual"`
	Title              string  `json:"title"`
	PlannedDate        string  `json:"planned_date"`
	TargetMileage      int     `json:"target_mileage"`
	Notes              *string `json:"notes"`
	Status             string  `json:"status"`
}

// PlannerResponse is the DTO returned to clients.
type PlannerResponse struct {
	ID                 string            `json:"id"`
	UserID             string            `json:"user_id"`
	VehicleID          string            `json:"vehicle_id"`
	VehicleInfo        *VehicleResponse  `json:"vehicle_info,omitempty"`
	WorkshopID         *string           `json:"workshop_id"`
	IsOfficialWorkshop bool              `json:"is_official_workshop"`
	WorkshopNameManual *string           `json:"workshop_name_manual"`
	WorkshopInfo       *WorkshopResponse `json:"workshop_info,omitempty"`
	Title              string            `json:"title"`
	PlannedDate        string            `json:"planned_date"`
	TargetMileage      int               `json:"target_mileage"`
	Notes              *string           `json:"notes"`
	Status             string            `json:"status"`
	CreatedAt          time.Time         `json:"created_at"`
	UpdatedAt          time.Time         `json:"updated_at"`
}
