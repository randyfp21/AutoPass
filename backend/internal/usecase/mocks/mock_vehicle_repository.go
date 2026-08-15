package mocks

import (
	"context"

	"github.com/autopass/backend/internal/domain"
	"github.com/stretchr/testify/mock"
)

// MockVehicleRepository is a mock implementation of repository.VehicleRepository.
type MockVehicleRepository struct {
	mock.Mock
}

func (m *MockVehicleRepository) CreateVehicle(ctx context.Context, vehicle *domain.Vehicle) error {
	args := m.Called(ctx, vehicle)
	return args.Error(0)
}

func (m *MockVehicleRepository) GetVehiclesByUserID(ctx context.Context, userID string) ([]*domain.Vehicle, error) {
	args := m.Called(ctx, userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.Vehicle), args.Error(1)
}

func (m *MockVehicleRepository) GetVehicleByID(ctx context.Context, id string) (*domain.Vehicle, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.Vehicle), args.Error(1)
}

func (m *MockVehicleRepository) UpdateVehicle(ctx context.Context, vehicle *domain.Vehicle) error {
	args := m.Called(ctx, vehicle)
	return args.Error(0)
}

func (m *MockVehicleRepository) DeleteVehicle(ctx context.Context, id string) error {
	args := m.Called(ctx, id)
	return args.Error(0)
}

func (m *MockVehicleRepository) UpdateMileage(ctx context.Context, vehicleID string, mileage int) error {
	args := m.Called(ctx, vehicleID, mileage)
	return args.Error(0)
}
