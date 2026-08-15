package domain

import "time"

// ServiceRecord represents the service_records table.
type ServiceRecord struct {
	ID                  string    `json:"id"`
	VehicleID           string    `json:"vehicle_id"`
	WorkshopID          *string   `json:"workshop_id"`
	IsOfficialWorkshop  bool      `json:"is_official_workshop"`
	WorkshopNameManual  *string   `json:"workshop_name_manual"`
	ServiceDate         time.Time `json:"service_date"`
	MileageAtService    int       `json:"mileage_at_service"`
	Complaints          *string   `json:"complaints"`
	TotalCost           int64     `json:"total_cost"`
	Notes               *string   `json:"notes"`
	ReceiptPhotoURL     *string   `json:"receipt_photo_url"`
	CreatedByRole       string    `json:"created_by_role"`
	CreatedAt           time.Time `json:"created_at"`
	UpdatedAt           time.Time `json:"updated_at"`
}

// ServiceDetail represents the service_details table.
type ServiceDetail struct {
	ID              string    `json:"id"`
	ServiceRecordID string    `json:"service_record_id"`
	MasterItemID    *string   `json:"master_item_id"`
	ItemName        string    `json:"item_name"`
	Quantity        int       `json:"quantity"`
	UnitPrice       int64     `json:"unit_price"`
	Subtotal        int64     `json:"subtotal"`
	CreatedAt       time.Time `json:"created_at"`
}

// ServicePhoto represents the service_photos table.
type ServicePhoto struct {
	ID                  string    `json:"id"`
	ServiceRecordID     string    `json:"service_record_id"`
	OriginalPhotoURL    string    `json:"original_photo_url"`
	WatermarkedPhotoURL *string   `json:"watermarked_photo_url"`
	Caption             *string   `json:"caption"`
	CreatedAt           time.Time `json:"created_at"`
}

// ServiceItemInput is a single item inside a service record creation request.
type ServiceItemInput struct {
	MasterItemID *string `json:"master_item_id"`
	ItemName     string  `json:"item_name"`
	Quantity     int     `json:"quantity"`
	UnitPrice    int64   `json:"unit_price"`
}

// CreateServiceRequest is the payload for creating a service record.
type CreateServiceRequest struct {
	WorkshopID         *string            `json:"workshop_id"`
	WorkshopNameManual *string            `json:"workshop_name_manual"`
	ServiceDate        string             `json:"service_date"`
	MileageAtService   int                `json:"mileage_at_service"`
	Complaints         *string            `json:"complaints"`
	Notes              *string            `json:"notes"`
	ReceiptPhotoURL    *string            `json:"receipt_photo_url"`
	Items              []ServiceItemInput `json:"items"`
}

// ServiceRecordResponse is the full response for a service record including details.
type ServiceRecordResponse struct {
	ID                  string                  `json:"id"`
	VehicleID           string                  `json:"vehicle_id"`
	WorkshopID          *string                 `json:"workshop_id"`
	IsOfficialWorkshop  bool                    `json:"is_official_workshop"`
	WorkshopNameManual  *string                 `json:"workshop_name_manual"`
	ServiceDate         time.Time               `json:"service_date"`
	MileageAtService    int                     `json:"mileage_at_service"`
	Complaints          *string                 `json:"complaints"`
	TotalCost           int64                   `json:"total_cost"`
	Notes               *string                 `json:"notes"`
	ReceiptPhotoURL     *string                 `json:"receipt_photo_url"`
	CreatedByRole       string                  `json:"created_by_role"`
	Items               []ServiceDetailResponse `json:"items"`
	CreatedAt           time.Time               `json:"created_at"`
	UpdatedAt           time.Time               `json:"updated_at"`
}

// ServiceDetailResponse is the public representation of a service detail line.
type ServiceDetailResponse struct {
	ID           string  `json:"id"`
	MasterItemID *string `json:"master_item_id"`
	ItemName     string  `json:"item_name"`
	Quantity     int     `json:"quantity"`
	UnitPrice    int64   `json:"unit_price"`
	Subtotal     int64   `json:"subtotal"`
}
