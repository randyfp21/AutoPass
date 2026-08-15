package mocks

import (
	"context"

	"github.com/autopass/backend/internal/domain"
	"github.com/stretchr/testify/mock"
)

// MockServiceRepository is a mock implementation of repository.ServiceRepository.
type MockServiceRepository struct {
	mock.Mock
}

func (m *MockServiceRepository) CreateServiceRecord(ctx context.Context, record *domain.ServiceRecord, details []*domain.ServiceDetail) error {
	args := m.Called(ctx, record, details)
	return args.Error(0)
}

func (m *MockServiceRepository) GetServiceRecordsByVehicleID(ctx context.Context, vehicleID string) ([]*domain.ServiceRecord, error) {
	args := m.Called(ctx, vehicleID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.ServiceRecord), args.Error(1)
}

func (m *MockServiceRepository) GetServiceRecordByID(ctx context.Context, id string) (*domain.ServiceRecord, error) {
	args := m.Called(ctx, id)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*domain.ServiceRecord), args.Error(1)
}

func (m *MockServiceRepository) GetServiceDetailsByRecordID(ctx context.Context, recordID string) ([]*domain.ServiceDetail, error) {
	args := m.Called(ctx, recordID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.ServiceDetail), args.Error(1)
}

func (m *MockServiceRepository) GetMasterItems(ctx context.Context) ([]*domain.MasterItem, error) {
	args := m.Called(ctx)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).([]*domain.MasterItem), args.Error(1)
}
