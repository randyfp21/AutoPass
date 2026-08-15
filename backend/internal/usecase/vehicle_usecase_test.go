package usecase_test

import (
	"context"
	"testing"
	"time"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/autopass/backend/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

// sampleVehicle returns a test vehicle belonging to the given userID.
func sampleVehicle(id, userID string) *domain.Vehicle {
	return &domain.Vehicle{
		ID:              id,
		UserID:          userID,
		Category:        "mobil",
		LicensePlate:    "B 1234 ABC",
		Brand:           "Toyota",
		Model:           "Avanza",
		ManufactureYear: 2020,
		CurrentMileage:  15000,
		CreatedAt:       time.Now(),
		UpdatedAt:       time.Now(),
	}
}

// ===========================================================================
// CREATE VEHICLE TESTS
// ===========================================================================

func TestCreateVehicle_Success(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	req := domain.CreateVehicleRequest{
		Category:        "mobil",
		LicensePlate:    "B 5678 XYZ",
		Brand:           "Honda",
		Model:           "Jazz",
		ManufactureYear: 2022,
		CurrentMileage:  5000,
	}

	vehicleRepo.On("CreateVehicle", mock.Anything, mock.AnythingOfType("*domain.Vehicle")).Return(nil)

	resp, err := uc.CreateVehicle(context.Background(), "user-123", req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "user-123", resp.UserID)
	assert.Equal(t, "B 5678 XYZ", resp.LicensePlate)
	assert.Equal(t, "mobil", resp.Category)
	assert.NotEmpty(t, resp.ID)
	vehicleRepo.AssertExpectations(t)
}

func TestCreateVehicle_Motor_Success(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	req := domain.CreateVehicleRequest{
		Category:        "motor",
		LicensePlate:    "D 9999 BB",
		Brand:           "Yamaha",
		Model:           "NMAX",
		ManufactureYear: 2023,
		CurrentMileage:  2500,
	}

	vehicleRepo.On("CreateVehicle", mock.Anything, mock.AnythingOfType("*domain.Vehicle")).Return(nil)

	resp, err := uc.CreateVehicle(context.Background(), "user-456", req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "motor", resp.Category)
	vehicleRepo.AssertExpectations(t)
}

func TestCreateVehicle_WithVariant(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	variant := "1.5 G CVT"
	req := domain.CreateVehicleRequest{
		Category:        "mobil",
		LicensePlate:    "AB 1111 CD",
		Brand:           "Toyota",
		Model:           "Yaris",
		VariantType:     &variant,
		ManufactureYear: 2021,
		CurrentMileage:  8000,
	}

	vehicleRepo.On("CreateVehicle", mock.Anything, mock.MatchedBy(func(v *domain.Vehicle) bool {
		return v.VariantType != nil && *v.VariantType == variant
	})).Return(nil)

	resp, err := uc.CreateVehicle(context.Background(), "user-789", req)

	assert.NoError(t, err)
	assert.NotNil(t, resp.VariantType)
	assert.Equal(t, variant, *resp.VariantType)
	vehicleRepo.AssertExpectations(t)
}

// ===========================================================================
// GET USER VEHICLES TESTS
// ===========================================================================

func TestGetUserVehicles_ReturnsList(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	userID := "user-abc"
	vehicles := []*domain.Vehicle{
		sampleVehicle("v1", userID),
		sampleVehicle("v2", userID),
	}
	vehicleRepo.On("GetVehiclesByUserID", mock.Anything, userID).Return(vehicles, nil)

	resp, err := uc.GetUserVehicles(context.Background(), userID)

	assert.NoError(t, err)
	assert.Len(t, resp, 2)
	vehicleRepo.AssertExpectations(t)
}

func TestGetUserVehicles_EmptyList(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	vehicleRepo.On("GetVehiclesByUserID", mock.Anything, "user-empty").
		Return([]*domain.Vehicle{}, nil)

	resp, err := uc.GetUserVehicles(context.Background(), "user-empty")

	assert.NoError(t, err)
	assert.Len(t, resp, 0)
	vehicleRepo.AssertExpectations(t)
}

func TestGetUserVehicles_CacheHit_DoesNotCallRepo(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	userID := "user-cached"
	vehicles := []*domain.Vehicle{sampleVehicle("v1", userID)}
	// Repo called only ONCE on cache miss
	vehicleRepo.On("GetVehiclesByUserID", mock.Anything, userID).Return(vehicles, nil).Once()

	// First call populates cache
	resp1, err1 := uc.GetUserVehicles(context.Background(), userID)
	assert.NoError(t, err1)
	assert.Len(t, resp1, 1)

	// Second call should use cache — repo mock not called again
	resp2, err2 := uc.GetUserVehicles(context.Background(), userID)
	assert.NoError(t, err2)
	assert.Len(t, resp2, 1)

	vehicleRepo.AssertNumberOfCalls(t, "GetVehiclesByUserID", 1)
}

// ===========================================================================
// GET VEHICLE BY ID TESTS
// ===========================================================================

func TestGetVehicleByID_OwnerCanAccess(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	userID := "owner-user"
	vehicle := sampleVehicle("v-id-1", userID)
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-id-1").Return(vehicle, nil)

	resp, err := uc.GetVehicleByID(context.Background(), "v-id-1", userID)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, "v-id-1", resp.ID)
	vehicleRepo.AssertExpectations(t)
}

func TestGetVehicleByID_NonOwner_Forbidden(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	vehicle := sampleVehicle("v-id-2", "owner-user")
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-id-2").Return(vehicle, nil)

	resp, err := uc.GetVehicleByID(context.Background(), "v-id-2", "attacker-user")

	assert.Nil(t, resp)
	assert.EqualError(t, err, "forbidden: vehicle does not belong to this user")
	vehicleRepo.AssertExpectations(t)
}

func TestGetVehicleByID_NotFound(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	vehicleRepo.On("GetVehicleByID", mock.Anything, "nonexistent").Return(nil, nil)

	resp, err := uc.GetVehicleByID(context.Background(), "nonexistent", "any-user")

	assert.Nil(t, resp)
	assert.EqualError(t, err, "vehicle not found")
	vehicleRepo.AssertExpectations(t)
}

// ===========================================================================
// UPDATE VEHICLE TESTS
// ===========================================================================

func TestUpdateVehicle_Success(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	userID := "owner-user"
	vehicle := sampleVehicle("v-update-1", userID)
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-update-1").Return(vehicle, nil)
	vehicleRepo.On("UpdateVehicle", mock.Anything, mock.AnythingOfType("*domain.Vehicle")).Return(nil)

	req := domain.UpdateVehicleRequest{
		Category:        "mobil",
		LicensePlate:    "B 9999 ZZZ",
		Brand:           "Mitsubishi",
		Model:           "Xpander",
		ManufactureYear: 2021,
		CurrentMileage:  20000,
	}

	resp, err := uc.UpdateVehicle(context.Background(), "v-update-1", userID, req)

	assert.NoError(t, err)
	assert.Equal(t, "B 9999 ZZZ", resp.LicensePlate)
	assert.Equal(t, "Mitsubishi", resp.Brand)
	vehicleRepo.AssertExpectations(t)
}

func TestUpdateVehicle_NonOwner_Forbidden(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	vehicle := sampleVehicle("v-update-2", "real-owner")
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-update-2").Return(vehicle, nil)

	resp, err := uc.UpdateVehicle(context.Background(), "v-update-2", "attacker", domain.UpdateVehicleRequest{})

	assert.Nil(t, resp)
	assert.EqualError(t, err, "forbidden: vehicle does not belong to this user")
	vehicleRepo.AssertExpectations(t)
}

// ===========================================================================
// DELETE VEHICLE TESTS
// ===========================================================================

func TestDeleteVehicle_Success(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	userID := "owner-user"
	vehicle := sampleVehicle("v-del-1", userID)
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-del-1").Return(vehicle, nil)
	vehicleRepo.On("DeleteVehicle", mock.Anything, "v-del-1").Return(nil)

	err := uc.DeleteVehicle(context.Background(), "v-del-1", userID)

	assert.NoError(t, err)
	vehicleRepo.AssertExpectations(t)
}

func TestDeleteVehicle_NonOwner_Forbidden(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	vehicle := sampleVehicle("v-del-2", "real-owner")
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-del-2").Return(vehicle, nil)

	err := uc.DeleteVehicle(context.Background(), "v-del-2", "intruder")

	assert.EqualError(t, err, "forbidden: vehicle does not belong to this user")
	vehicleRepo.AssertExpectations(t)
}

func TestDeleteVehicle_NotFound(t *testing.T) {
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewVehicleUsecase(vehicleRepo, redisClient)

	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-del-missing").Return(nil, nil)

	err := uc.DeleteVehicle(context.Background(), "v-del-missing", "any-user")

	assert.EqualError(t, err, "vehicle not found")
	vehicleRepo.AssertExpectations(t)
}
