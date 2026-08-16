package usecase

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/repository"
	"github.com/google/uuid"
	"github.com/redis/go-redis/v9"
)

const masterItemsCacheKey = "master:items"
const masterItemsCacheTTL = 24 * time.Hour

// ServiceUsecase defines the interface for service record business logic.
type ServiceUsecase interface {
	CreateServiceRecord(ctx context.Context, vehicleID, userID string, req domain.CreateServiceRequest) (*domain.ServiceRecordResponse, error)
	GetServiceHistory(ctx context.Context, vehicleID, userID string) ([]*domain.ServiceRecordResponse, error)
	GetServiceRecordDetail(ctx context.Context, recordID, userID string) (*domain.ServiceRecordResponse, error)
	GetMasterItems(ctx context.Context, vehicleCategory string) ([]*domain.MasterItemResponse, error)
	DeleteServiceRecord(ctx context.Context, recordID, userID string) error
}

type serviceUsecase struct {
	serviceRepo repository.ServiceRepository
	vehicleRepo repository.VehicleRepository
	redis       *redis.Client
}

// NewServiceUsecase creates a new ServiceUsecase.
func NewServiceUsecase(serviceRepo repository.ServiceRepository, vehicleRepo repository.VehicleRepository, redisClient *redis.Client) ServiceUsecase {
	return &serviceUsecase{
		serviceRepo: serviceRepo,
		vehicleRepo: vehicleRepo,
		redis:       redisClient,
	}
}

// CreateServiceRecord creates a service record using the snapshot pattern.
func (u *serviceUsecase) CreateServiceRecord(ctx context.Context, vehicleID, userID string, req domain.CreateServiceRequest) (*domain.ServiceRecordResponse, error) {
	// Verify vehicle ownership.
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.CreateServiceRecord get vehicle: %w", err)
	}
	if vehicle == nil {
		return nil, errors.New("vehicle not found")
	}
	if vehicle.UserID != userID {
		return nil, errors.New("forbidden: vehicle does not belong to this user")
	}

	// Parse service date flexibly.
	var serviceDate time.Time
	if len(req.ServiceDate) >= 10 {
		serviceDate, _ = time.Parse("2006-01-02", req.ServiceDate[:10])
	}
	if serviceDate.IsZero() {
		serviceDate = time.Now()
	}

	// Default mileage to vehicle current mileage if 0
	mileageAtService := req.MileageAtService
	if mileageAtService <= 0 {
		mileageAtService = vehicle.CurrentMileage
	}

	// Determine workshop mode (hybrid).
	var workshopID *string
	isOfficial := false
	var workshopNameManual *string

	if req.WorkshopID != nil && *req.WorkshopID != "" {
		workshopID = req.WorkshopID
		isOfficial = true
	} else if req.WorkshopNameManual != nil && *req.WorkshopNameManual != "" {
		workshopNameManual = req.WorkshopNameManual
	}

	// Ensure items is not empty
	if len(req.Items) == 0 {
		req.Items = []domain.ServiceItemInput{
			{
				ItemName:  "Jasa / Biaya Servis Berkala",
				Quantity:  1,
				UnitPrice: 0,
			},
		}
	}

	// Build service details using snapshot pattern (copy all item data at creation time).
	var totalCost int64
	details := make([]*domain.ServiceDetail, 0, len(req.Items))
	for _, item := range req.Items {
		itemName := item.ItemName
		if itemName == "" {
			itemName = "Jasa / Biaya Servis Berkala"
		}
		qty := item.Quantity
		if qty < 1 {
			qty = 1
		}
		subtotal := int64(qty) * item.UnitPrice
		totalCost += subtotal

		details = append(details, &domain.ServiceDetail{
			ID:           uuid.New().String(),
			MasterItemID: item.MasterItemID,
			ItemName:     itemName,
			Quantity:     qty,
			UnitPrice:    item.UnitPrice,
			Subtotal:     subtotal,
		})
	}

	recordID := uuid.New().String()
	for _, d := range details {
		d.ServiceRecordID = recordID
	}

	record := &domain.ServiceRecord{
		ID:                 recordID,
		VehicleID:          vehicleID,
		WorkshopID:         workshopID,
		IsOfficialWorkshop: isOfficial,
		WorkshopNameManual: workshopNameManual,
		ServiceDate:        serviceDate,
		MileageAtService:   mileageAtService,
		Complaints:         req.Complaints,
		TotalCost:          totalCost,
		Notes:              req.Notes,
		ReceiptPhotoURL:    req.ReceiptPhotoURL,
		CreatedByRole:      "user",
	}

	if err := u.serviceRepo.CreateServiceRecord(ctx, record, details); err != nil {
		return nil, fmt.Errorf("serviceUsecase.CreateServiceRecord save: %w", err)
	}

	// Auto-update vehicle mileage if service mileage is higher.
	if mileageAtService > vehicle.CurrentMileage {
		if err := u.vehicleRepo.UpdateMileage(ctx, vehicleID, mileageAtService); err != nil {
			fmt.Printf("warning: failed to update vehicle mileage: %v\n", err)
		}
		// Invalidate vehicle cache.
		u.redis.Del(ctx, vehicleCacheKeyPrefix+userID)
	}

	return toServiceRecordResponse(record, details), nil
}

// GetServiceHistory returns all service records for a vehicle, checking ownership.
func (u *serviceUsecase) GetServiceHistory(ctx context.Context, vehicleID, userID string) ([]*domain.ServiceRecordResponse, error) {
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.GetServiceHistory get vehicle: %w", err)
	}
	if vehicle == nil {
		return nil, errors.New("vehicle not found")
	}
	if vehicle.UserID != userID {
		return nil, errors.New("forbidden: vehicle does not belong to this user")
	}

	records, err := u.serviceRepo.GetServiceRecordsByVehicleID(ctx, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.GetServiceHistory: %w", err)
	}

	responses := make([]*domain.ServiceRecordResponse, 0, len(records))
	for _, rec := range records {
		details, err := u.serviceRepo.GetServiceDetailsByRecordID(ctx, rec.ID)
		if err != nil {
			return nil, fmt.Errorf("serviceUsecase.GetServiceHistory get details: %w", err)
		}
		responses = append(responses, toServiceRecordResponse(rec, details))
	}
	return responses, nil
}

// GetServiceRecordDetail retrieves a single service record with ownership check.
func (u *serviceUsecase) GetServiceRecordDetail(ctx context.Context, recordID, userID string) (*domain.ServiceRecordResponse, error) {
	record, err := u.serviceRepo.GetServiceRecordByID(ctx, recordID)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.GetServiceRecordDetail: %w", err)
	}
	if record == nil {
		return nil, errors.New("service record not found")
	}

	// Verify ownership via vehicle.
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, record.VehicleID)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.GetServiceRecordDetail get vehicle: %w", err)
	}
	if vehicle == nil || vehicle.UserID != userID {
		return nil, errors.New("forbidden: service record does not belong to this user")
	}

	details, err := u.serviceRepo.GetServiceDetailsByRecordID(ctx, recordID)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.GetServiceRecordDetail get details: %w", err)
	}

	return toServiceRecordResponse(record, details), nil
}

// DeleteServiceRecord removes a service record after verifying ownership.
func (u *serviceUsecase) DeleteServiceRecord(ctx context.Context, recordID, userID string) error {
	record, err := u.serviceRepo.GetServiceRecordByID(ctx, recordID)
	if err != nil {
		return fmt.Errorf("serviceUsecase.DeleteServiceRecord get record: %w", err)
	}
	if record == nil {
		return errors.New("service record not found")
	}

	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, record.VehicleID)
	if err != nil {
		return fmt.Errorf("serviceUsecase.DeleteServiceRecord get vehicle: %w", err)
	}
	if vehicle == nil || vehicle.UserID != userID {
		return errors.New("forbidden: service record does not belong to this user")
	}

	if err := u.serviceRepo.DeleteServiceRecord(ctx, recordID); err != nil {
		return fmt.Errorf("serviceUsecase.DeleteServiceRecord delete: %w", err)
	}

	// Invalidate vehicle cache.
	u.redis.Del(ctx, vehicleCacheKeyPrefix+userID)
	return nil
}

// GetMasterItems returns master items, filtered by vehicle category, with 24h Redis caching.
func (u *serviceUsecase) GetMasterItems(ctx context.Context, vehicleCategory string) ([]*domain.MasterItemResponse, error) {
	cacheKey := masterItemsCacheKey
	if vehicleCategory != "" {
		cacheKey = masterItemsCacheKey + ":" + vehicleCategory
	}

	// Try cache.
	cached, err := u.redis.Get(ctx, cacheKey).Bytes()
	if err == nil {
		var responses []*domain.MasterItemResponse
		if jsonErr := json.Unmarshal(cached, &responses); jsonErr == nil {
			return responses, nil
		}
	}

	items, err := u.serviceRepo.GetMasterItems(ctx)
	if err != nil {
		return nil, fmt.Errorf("serviceUsecase.GetMasterItems: %w", err)
	}

	responses := make([]*domain.MasterItemResponse, 0, len(items))
	for _, item := range items {
		if vehicleCategory != "" && item.VehicleCategory != vehicleCategory {
			continue
		}
		responses = append(responses, &domain.MasterItemResponse{
			ID:              item.ID,
			ItemName:        item.ItemName,
			Category:        item.Category,
			VehicleCategory: item.VehicleCategory,
			Description:     item.Description,
		})
	}

	// Cache results.
	if data, jsonErr := json.Marshal(responses); jsonErr == nil {
		u.redis.Set(ctx, cacheKey, data, masterItemsCacheTTL)
	}

	return responses, nil
}

// toServiceRecordResponse converts a ServiceRecord + details into a response DTO.
func toServiceRecordResponse(record *domain.ServiceRecord, details []*domain.ServiceDetail) *domain.ServiceRecordResponse {
	detailResponses := make([]domain.ServiceDetailResponse, 0, len(details))
	for _, d := range details {
		detailResponses = append(detailResponses, domain.ServiceDetailResponse{
			ID:           d.ID,
			MasterItemID: d.MasterItemID,
			ItemName:     d.ItemName,
			Quantity:     d.Quantity,
			UnitPrice:    d.UnitPrice,
			Subtotal:     d.Subtotal,
		})
	}
	return &domain.ServiceRecordResponse{
		ID:                 record.ID,
		VehicleID:          record.VehicleID,
		WorkshopID:         record.WorkshopID,
		IsOfficialWorkshop: record.IsOfficialWorkshop,
		WorkshopNameManual: record.WorkshopNameManual,
		ServiceDate:        record.ServiceDate,
		MileageAtService:   record.MileageAtService,
		Complaints:         record.Complaints,
		TotalCost:          record.TotalCost,
		Notes:              record.Notes,
		ReceiptPhotoURL:    record.ReceiptPhotoURL,
		CreatedByRole:      record.CreatedByRole,
		Items:              detailResponses,
		CreatedAt:          record.CreatedAt,
		UpdatedAt:          record.UpdatedAt,
	}
}
