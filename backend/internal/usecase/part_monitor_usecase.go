package usecase

import (
	"context"
	"fmt"
	"time"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/repository"
)

type PartMonitorUsecase interface {
	GetVehiclePartMonitors(ctx context.Context, vehicleID string, userID string) ([]*domain.VehiclePartMonitor, error)
	UpdatePartMonitor(ctx context.Context, id string, vehicleID string, userID string, req domain.UpdatePartMonitorRequest) error
	ReplacePart(ctx context.Context, id string, vehicleID string, userID string, req domain.ReplacePartRequest) error
}

type partMonitorUsecase struct {
	partRepo    repository.PartMonitorRepository
	vehicleRepo repository.VehicleRepository
}

func NewPartMonitorUsecase(partRepo repository.PartMonitorRepository, vehicleRepo repository.VehicleRepository) PartMonitorUsecase {
	return &partMonitorUsecase{
		partRepo:    partRepo,
		vehicleRepo: vehicleRepo,
	}
}

func (u *partMonitorUsecase) GetVehiclePartMonitors(ctx context.Context, vehicleID string, userID string) ([]*domain.VehiclePartMonitor, error) {
	v, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil || v == nil {
		return nil, fmt.Errorf("vehicle not found")
	}
	if v.UserID != userID {
		return nil, fmt.Errorf("unauthorized vehicle access")
	}

	// Ensure default parts are seeded
	if err := u.partRepo.EnsureDefaultPartMonitors(ctx, vehicleID, string(v.Category), v.CurrentMileage); err != nil {
		return nil, err
	}

	monitors, err := u.partRepo.GetPartMonitors(ctx, vehicleID)
	if err != nil {
		return nil, err
	}

	// Calculate km_traveled, km_remaining, progress_percent, is_urgent, is_expired
	for _, m := range monitors {
		traveled := v.CurrentMileage - m.LastReplacedMileage
		if traveled < 0 {
			traveled = 0
		}
		remaining := m.IdealLifespanKM - traveled

		percent := 0
		if m.IdealLifespanKM > 0 {
			percent = int((float64(traveled) / float64(m.IdealLifespanKM)) * 100)
		}
		if percent > 100 {
			percent = 100
		}

		m.KmTraveled = traveled
		m.KmRemaining = remaining
		m.ProgressPercent = percent
		m.IsExpired = remaining <= 0
		m.IsUrgent = remaining <= int(float64(m.IdealLifespanKM)*0.2) // <= 20% lifespan left
	}

	return monitors, nil
}

func (u *partMonitorUsecase) UpdatePartMonitor(ctx context.Context, id string, vehicleID string, userID string, req domain.UpdatePartMonitorRequest) error {
	v, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil || v == nil || v.UserID != userID {
		return fmt.Errorf("unauthorized or vehicle not found")
	}

	return u.partRepo.UpdatePartMonitor(ctx, id, vehicleID, req.IsEnabled, req.IdealLifespanKM)
}

func (u *partMonitorUsecase) ReplacePart(ctx context.Context, id string, vehicleID string, userID string, req domain.ReplacePartRequest) error {
	v, err := u.vehicleRepo.GetVehicleByID(ctx, vehicleID)
	if err != nil || v == nil || v.UserID != userID {
		return fmt.Errorf("unauthorized or vehicle not found")
	}

	mileage := v.CurrentMileage
	if req.Mileage != nil && *req.Mileage > 0 {
		mileage = *req.Mileage
	}

	dateStr := time.Now().Format("2006-01-02")
	if req.Date != nil && *req.Date != "" {
		dateStr = *req.Date
	}

	return u.partRepo.ReplacePart(ctx, id, vehicleID, mileage, dateStr)
}
