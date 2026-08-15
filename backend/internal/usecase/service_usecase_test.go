package usecase_test

import (
	"context"
	"testing"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/usecase"
	"github.com/autopass/backend/internal/usecase/mocks"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

func sampleVehicleForService(id, userID string) *domain.Vehicle {
	return &domain.Vehicle{
		ID:              id,
		UserID:          userID,
		Category:        "mobil",
		LicensePlate:    "B 1234 ABC",
		Brand:           "Toyota",
		Model:           "Avanza",
		ManufactureYear: 2020,
		CurrentMileage:  10000,
	}
}

func buildServiceItems() []domain.ServiceItemInput {
	return []domain.ServiceItemInput{
		{ItemName: "Oli Mesin", Quantity: 1, UnitPrice: 100000},
		{ItemName: "Filter Oli", Quantity: 1, UnitPrice: 20000},
	}
}

func buildServiceRequest(mileage int, items []domain.ServiceItemInput) domain.CreateServiceRequest {
	manualName := "Bengkel AHASS"
	return domain.CreateServiceRequest{
		WorkshopNameManual: &manualName,
		ServiceDate:        "2026-08-15",
		MileageAtService:   mileage,
		Items:              items,
	}
}

// ===========================================================================
// CREATE SERVICE RECORD TESTS
// ===========================================================================

func TestCreateServiceRecord_Success_ManualWorkshop(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-123"
	vehicleID := "vehicle-123"
	vehicle := sampleVehicleForService(vehicleID, userID)

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	vehicleRepo.On("UpdateMileage", mock.Anything, vehicleID, 12000).Return(nil).Maybe()

	req := buildServiceRequest(12000, buildServiceItems())
	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Equal(t, int64(120000), resp.TotalCost)
	assert.False(t, resp.IsOfficialWorkshop)
	serviceRepo.AssertExpectations(t)
}

func TestCreateServiceRecord_OfficialWorkshop_SetsFlag(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-456"
	vehicleID := "vehicle-456"
	workshopID := "workshop-789"
	vehicle := sampleVehicleForService(vehicleID, userID)

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	vehicleRepo.On("UpdateMileage", mock.Anything, vehicleID, 15000).Return(nil).Maybe()

	req := buildServiceRequest(15000, buildServiceItems())
	req.WorkshopID = &workshopID
	req.WorkshopNameManual = nil

	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.True(t, resp.IsOfficialWorkshop)
}

func TestCreateServiceRecord_TotalCostCalculatedCorrectly(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-cost"
	vehicleID := "vehicle-cost"
	vehicle := sampleVehicleForService(vehicleID, userID)

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()

	items := []domain.ServiceItemInput{
		{ItemName: "Item A", Quantity: 2, UnitPrice: 50000},  // 100,000
		{ItemName: "Item B", Quantity: 3, UnitPrice: 30000},  // 90,000
		{ItemName: "Item C", Quantity: 1, UnitPrice: 100000}, // 100,000
	}
	req := buildServiceRequest(10000, items)

	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.Equal(t, int64(290000), resp.TotalCost)
}

func TestCreateServiceRecord_SnapshotPattern_ItemNameCopied(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-snap"
	vehicleID := "vehicle-snap"
	vehicle := sampleVehicleForService(vehicleID, userID)

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)

	var capturedDetails []*domain.ServiceDetail
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.MatchedBy(func(d []*domain.ServiceDetail) bool {
		capturedDetails = d
		return len(d) == 2
	})).Return(nil).Once()

	req := buildServiceRequest(10000, buildServiceItems())
	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	assert.Len(t, capturedDetails, 2)
	assert.Equal(t, "Oli Mesin", capturedDetails[0].ItemName)
	assert.Equal(t, int64(100000), capturedDetails[0].UnitPrice)
	assert.Equal(t, "Filter Oli", capturedDetails[1].ItemName)
}

func TestCreateServiceRecord_MileageAutoUpdate_WhenHigher(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-km"
	vehicleID := "vehicle-km"
	vehicle := sampleVehicleForService(vehicleID, userID)
	vehicle.CurrentMileage = 10000

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	vehicleRepo.On("UpdateMileage", mock.Anything, vehicleID, 15000).Return(nil).Once()

	req := buildServiceRequest(15000, buildServiceItems())
	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	vehicleRepo.AssertExpectations(t)
}

func TestCreateServiceRecord_MileageNoUpdate_WhenLower(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-lowkm"
	vehicleID := "vehicle-lowkm"
	vehicle := sampleVehicleForService(vehicleID, userID)
	vehicle.CurrentMileage = 20000

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	// UpdateMileage should NOT be called since 15,000 < 20,000

	req := buildServiceRequest(15000, buildServiceItems())
	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
	vehicleRepo.AssertNotCalled(t, "UpdateMileage", mock.Anything, mock.Anything, mock.Anything)
}

func TestCreateServiceRecord_VehicleNotFound_ReturnsError(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	vehicleRepo.On("GetVehicleByID", mock.Anything, "ghost-vehicle").Return(nil, nil)

	req := buildServiceRequest(5000, buildServiceItems())
	resp, err := uc.CreateServiceRecord(context.Background(), "ghost-vehicle", "user-123", req)

	assert.Nil(t, resp)
	assert.EqualError(t, err, "vehicle not found")
}

func TestCreateServiceRecord_WrongOwner_Forbidden(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	vehicle := sampleVehicleForService("v-own", "real-owner")
	vehicleRepo.On("GetVehicleByID", mock.Anything, "v-own").Return(vehicle, nil)

	resp, err := uc.CreateServiceRecord(context.Background(), "v-own", "attacker", buildServiceRequest(5000, buildServiceItems()))

	assert.Nil(t, resp)
	assert.EqualError(t, err, "forbidden: vehicle does not belong to this user")
}

func TestCreateServiceRecord_FlexibleDateFormat_Handled(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-date"
	vehicleID := "vehicle-date"
	vehicle := sampleVehicleForService(vehicleID, userID)
	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	serviceRepo.On("CreateServiceRecord", mock.Anything, mock.Anything, mock.Anything).Return(nil).Once()
	vehicleRepo.On("UpdateMileage", mock.Anything, vehicleID, 5000).Return(nil).Maybe()

	req := domain.CreateServiceRequest{
		ServiceDate:      "2026-08-15",
		MileageAtService: 5000,
		Items:            buildServiceItems(),
	}

	resp, err := uc.CreateServiceRecord(context.Background(), vehicleID, userID, req)

	assert.NoError(t, err)
	assert.NotNil(t, resp)
}

// ===========================================================================
// GET SERVICE HISTORY TESTS
// ===========================================================================

func TestGetServiceHistory_Success(t *testing.T) {
	serviceRepo := &mocks.MockServiceRepository{}
	vehicleRepo := &mocks.MockVehicleRepository{}
	redisClient := newTestRedis(t)
	uc := usecase.NewServiceUsecase(serviceRepo, vehicleRepo, redisClient)

	userID := "user-hist"
	vehicleID := "vehicle-hist"
	vehicle := sampleVehicleForService(vehicleID, userID)

	vehicleRepo.On("GetVehicleByID", mock.Anything, vehicleID).Return(vehicle, nil)
	records := []*domain.ServiceRecord{
		{ID: "rec-1", VehicleID: vehicleID, TotalCost: 150000},
		{ID: "rec-2", VehicleID: vehicleID, TotalCost: 200000},
	}
	serviceRepo.On("GetServiceRecordsByVehicleID", mock.Anything, vehicleID).Return(records, nil)
	serviceRepo.On("GetServiceDetailsByRecordID", mock.Anything, mock.Anything).Return([]*domain.ServiceDetail{}, nil).Maybe()

	resp, err := uc.GetServiceHistory(context.Background(), vehicleID, userID)

	assert.NoError(t, err)
	assert.Len(t, resp, 2)
}
