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

const vehicleCacheKeyPrefix = "vehicle:summary:"
const vehicleCacheTTL = 10 * time.Minute

// VehicleUsecase defines the interface for vehicle business logic.
type VehicleUsecase interface {
	CreateVehicle(ctx context.Context, userID string, req domain.CreateVehicleRequest) (*domain.VehicleResponse, error)
	GetUserVehicles(ctx context.Context, userID string) ([]*domain.VehicleResponse, error)
	GetVehicleByID(ctx context.Context, vehicleID, userID string) (*domain.VehicleResponse, error)
	UpdateVehicle(ctx context.Context, vehicleID, userID string, req domain.UpdateVehicleRequest) (*domain.VehicleResponse, error)
	DeleteVehicle(ctx context.Context, vehicleID, userID string) error
}

type vehicleUsecase struct {
	vehicleRepo repository.VehicleRepository
	redis       *redis.Client
}

// NewVehicleUsecase creates a new VehicleUsecase.
func NewVehicleUsecase(vehicleRepo repository.VehicleRepository, redisClient *redis.Client) VehicleUsecase {
	return &vehicleUsecase{
		vehicleRepo: vehicleRepo,
		redis:       redisClient,
	}
}

// CreateVehicle creates a new vehicle for the authenticated user.
func (u *vehicleUsecase) CreateVehicle(ctx context.Context, userID string, req domain.CreateVehicleRequest) (*domain.VehicleResponse, error) {
	fuelType := req.FuelType
	if fuelType == "" {
		fuelType = "bensin"
	}

	vehicle := &domain.Vehicle{
		ID:              uuid.New().String(),
		UserID:          userID,
		Nickname:        req.Nickname,
		Category:        req.Category,
		FuelType:        fuelType,
		LicensePlate:    req.LicensePlate,
		Brand:           req.Brand,
		Model:           req.Model,
		VariantType:     req.VariantType,
		ManufactureYear: req.ManufactureYear,
		CurrentMileage:  req.CurrentMileage,
		PhotoURL:        req.PhotoURL,
		STNKNumber:      req.STNKNumber,
		STNKExpiryDate:  req.STNKExpiryDate,
	}

	if err := u.vehicleRepo.CreateVehicle(ctx, vehicle); err != nil {
		return nil, fmt.Errorf("vehicleUsecase.CreateVehicle: %w", err)
	}

	// Invalidate cache for this user's vehicles.
	u.invalidateVehicleCache(ctx, userID)

	return toVehicleResponse(vehicle), nil
}

// GetUserVehicles returns all vehicles for a user, using Redis cache when available.
func (u *vehicleUsecase) GetUserVehicles(ctx context.Context, userID string) ([]*domain.VehicleResponse, error) {
	cacheKey := vehicleCacheKeyPrefix + userID

	// Try cache first.
	cached, err := u.redis.Get(ctx, cacheKey).Bytes()
	if err == nil {
		var responses []*domain.VehicleResponse
		if jsonErr := json.Unmarshal(cached, &responses); jsonErr == nil {
			return responses, nil
		}
	}

	vehicles, err := u.vehicleRepo.GetVehiclesByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("vehicleUsecase.GetUserVehicles: %w", err)
	}

	responses := make([]*domain.VehicleResponse, 0, len(vehicles))
	for _, v := range vehicles {
		responses = append(responses, toVehicleResponse(v))
	}

	// Store in cache (best-effort, ignore errors).
	if data, jsonErr := json.Marshal(responses); jsonErr == nil {
		u.redis.Set(ctx, cacheKey, data, vehicleCacheTTL)
	}

	return responses, nil
}

// GetVehicleByID retrieves a single vehicle, ensuring ownership.
func (u *vehicleUsecase) GetVehicleByID(ctx context.Context, vehicleID, userID string) (*domain.VehicleResponse, error) {
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("vehicleUsecase.GetVehicleByID: %w", err)
	}
	if vehicle == nil {
		return nil, errors.New("vehicle not found")
	}
	if vehicle.UserID != userID {
		return nil, errors.New("forbidden: vehicle does not belong to this user")
	}
	return toVehicleResponse(vehicle), nil
}

// UpdateVehicle updates vehicle details, ensuring ownership.
func (u *vehicleUsecase) UpdateVehicle(ctx context.Context, vehicleID, userID string, req domain.UpdateVehicleRequest) (*domain.VehicleResponse, error) {
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("vehicleUsecase.UpdateVehicle get: %w", err)
	}
	if vehicle == nil {
		return nil, errors.New("vehicle not found")
	}
	if vehicle.UserID != userID {
		return nil, errors.New("forbidden: vehicle does not belong to this user")
	}

	fuelType := req.FuelType
	if fuelType == "" {
		fuelType = "bensin"
	}

	vehicle.Nickname = req.Nickname
	vehicle.Category = req.Category
	vehicle.FuelType = fuelType
	vehicle.LicensePlate = req.LicensePlate
	vehicle.Brand = req.Brand
	vehicle.Model = req.Model
	vehicle.VariantType = req.VariantType
	vehicle.ManufactureYear = req.ManufactureYear
	vehicle.CurrentMileage = req.CurrentMileage
	vehicle.PhotoURL = req.PhotoURL
	vehicle.STNKNumber = req.STNKNumber
	vehicle.STNKExpiryDate = req.STNKExpiryDate

	if err := u.vehicleRepo.UpdateVehicle(ctx, vehicle); err != nil {
		return nil, fmt.Errorf("vehicleUsecase.UpdateVehicle update: %w", err)
	}

	u.invalidateVehicleCache(ctx, userID)

	return toVehicleResponse(vehicle), nil
}

// DeleteVehicle removes a vehicle, ensuring ownership.
func (u *vehicleUsecase) DeleteVehicle(ctx context.Context, vehicleID, userID string) error {
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil {
		return fmt.Errorf("vehicleUsecase.DeleteVehicle get: %w", err)
	}
	if vehicle == nil {
		return errors.New("vehicle not found")
	}
	if vehicle.UserID != userID {
		return errors.New("forbidden: vehicle does not belong to this user")
	}

	if err := u.vehicleRepo.DeleteVehicle(ctx, vehicleID); err != nil {
		return fmt.Errorf("vehicleUsecase.DeleteVehicle: %w", err)
	}

	u.invalidateVehicleCache(ctx, userID)

	return nil
}

// invalidateVehicleCache deletes the cached vehicle list for a user.
func (u *vehicleUsecase) invalidateVehicleCache(ctx context.Context, userID string) {
	u.redis.Del(ctx, vehicleCacheKeyPrefix+userID)
}

// toVehicleResponse converts a Vehicle domain object to a VehicleResponse DTO.
func toVehicleResponse(v *domain.Vehicle) *domain.VehicleResponse {
	return &domain.VehicleResponse{
		ID:              v.ID,
		UserID:          v.UserID,
		Nickname:        v.Nickname,
		Category:        v.Category,
		FuelType:        v.FuelType,
		LicensePlate:    v.LicensePlate,
		Brand:           v.Brand,
		Model:           v.Model,
		VariantType:     v.VariantType,
		ManufactureYear: v.ManufactureYear,
		CurrentMileage:  v.CurrentMileage,
		PhotoURL:        v.PhotoURL,
		STNKNumber:      v.STNKNumber,
		STNKExpiryDate:  v.STNKExpiryDate,
		CreatedAt:       v.CreatedAt,
		UpdatedAt:       v.UpdatedAt,
	}
}
