package usecase

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/autopass/backend/internal/domain"
	"github.com/autopass/backend/internal/repository"
	"github.com/google/uuid"
)

// PlannerUsecase defines business logic for service planners.
type PlannerUsecase interface {
	CreatePlanner(ctx context.Context, userID string, req domain.CreatePlannerRequest) (*domain.PlannerResponse, error)
	GetUserPlanners(ctx context.Context, userID string) ([]*domain.PlannerResponse, error)
	UpdatePlanner(ctx context.Context, id, userID string, req domain.UpdatePlannerRequest) (*domain.PlannerResponse, error)
	DeletePlanner(ctx context.Context, id, userID string) error
	GetWorkshops(ctx context.Context) ([]*domain.WorkshopResponse, error)
}

type plannerUsecase struct {
	plannerRepo repository.PlannerRepository
	vehicleRepo repository.VehicleRepository
}

// NewPlannerUsecase creates a new PlannerUsecase.
func NewPlannerUsecase(plannerRepo repository.PlannerRepository, vehicleRepo repository.VehicleRepository) PlannerUsecase {
	return &plannerUsecase{
		plannerRepo: plannerRepo,
		vehicleRepo: vehicleRepo,
	}
}

func (u *plannerUsecase) CreatePlanner(ctx context.Context, userID string, req domain.CreatePlannerRequest) (*domain.PlannerResponse, error) {
	// Verify vehicle belongs to user
	vehicle, err := u.vehicleRepo.GetVehicleByID(ctx, req.VehicleID)
	if err != nil {
		return nil, fmt.Errorf("plannerUsecase.CreatePlanner check vehicle: %w", err)
	}
	if vehicle == nil {
		return nil, errors.New("vehicle not found")
	}
	if vehicle.UserID != userID {
		return nil, errors.New("forbidden: vehicle does not belong to this user")
	}

	plannedDate, err := time.Parse("2006-01-02", req.PlannedDate)
	if err != nil {
		return nil, fmt.Errorf("invalid planned_date format, expected YYYY-MM-DD: %w", err)
	}

	// Hybrid workshop logic
	var workshopID *string
	isOfficial := false
	var workshopNameManual *string

	if req.WorkshopID != nil && *req.WorkshopID != "" {
		workshopID = req.WorkshopID
		isOfficial = true
	} else if req.WorkshopNameManual != nil && *req.WorkshopNameManual != "" {
		workshopNameManual = req.WorkshopNameManual
	}

	planner := &domain.ServicePlanner{
		ID:                 uuid.New().String(),
		UserID:             userID,
		VehicleID:          req.VehicleID,
		WorkshopID:         workshopID,
		IsOfficialWorkshop: isOfficial,
		WorkshopNameManual: workshopNameManual,
		Title:              req.Title,
		PlannedDate:        plannedDate,
		TargetMileage:      req.TargetMileage,
		Notes:              req.Notes,
		Status:             "planned",
	}

	if err := u.plannerRepo.CreatePlanner(ctx, planner); err != nil {
		return nil, fmt.Errorf("plannerUsecase.CreatePlanner save: %w", err)
	}

	return toPlannerResponse(planner, vehicle), nil
}

func (u *plannerUsecase) GetUserPlanners(ctx context.Context, userID string) ([]*domain.PlannerResponse, error) {
	planners, err := u.plannerRepo.GetPlannersByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("plannerUsecase.GetUserPlanners: %w", err)
	}

	// Fetch vehicles map for fast lookup
	vehicles, err := u.vehicleRepo.GetVehiclesByUserID(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("plannerUsecase.GetUserPlanners get vehicles: %w", err)
	}
	vMap := make(map[string]*domain.Vehicle)
	for _, v := range vehicles {
		vMap[v.ID] = v
	}

	res := make([]*domain.PlannerResponse, 0, len(planners))
	for _, p := range planners {
		v := vMap[p.VehicleID]
		res = append(res, toPlannerResponse(p, v))
	}
	return res, nil
}

func (u *plannerUsecase) UpdatePlanner(ctx context.Context, id, userID string, req domain.UpdatePlannerRequest) (*domain.PlannerResponse, error) {
	planner, err := u.plannerRepo.GetPlannerByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("plannerUsecase.UpdatePlanner get: %w", err)
	}
	if planner == nil {
		return nil, errors.New("planner not found")
	}
	if planner.UserID != userID {
		return nil, errors.New("forbidden: planner does not belong to this user")
	}

	if req.PlannedDate != "" {
		if len(req.PlannedDate) >= 10 {
			if parsedDate, parseErr := time.Parse("2006-01-02", req.PlannedDate[:10]); parseErr == nil {
				planner.PlannedDate = parsedDate
			}
		}
	}

	if req.WorkshopID != nil && *req.WorkshopID != "" {
		planner.WorkshopID = req.WorkshopID
		planner.IsOfficialWorkshop = true
		planner.WorkshopNameManual = nil
	} else if req.WorkshopNameManual != nil && *req.WorkshopNameManual != "" {
		planner.WorkshopID = nil
		planner.IsOfficialWorkshop = false
		planner.WorkshopNameManual = req.WorkshopNameManual
	}

	if req.Title != "" {
		planner.Title = req.Title
	}
	if req.TargetMileage > 0 {
		planner.TargetMileage = req.TargetMileage
	}
	if req.Notes != nil {
		planner.Notes = req.Notes
	}
	if req.Status != "" {
		planner.Status = req.Status
	}

	if err := u.plannerRepo.UpdatePlanner(ctx, planner); err != nil {
		return nil, fmt.Errorf("plannerUsecase.UpdatePlanner update: %w", err)
	}

	vehicle, _ := u.vehicleRepo.GetVehicleByID(ctx, planner.VehicleID)

	return toPlannerResponse(planner, vehicle), nil
}

func (u *plannerUsecase) DeletePlanner(ctx context.Context, id, userID string) error {
	planner, err := u.plannerRepo.GetPlannerByID(ctx, id)
	if err != nil {
		return fmt.Errorf("plannerUsecase.DeletePlanner get: %w", err)
	}
	if planner == nil {
		return errors.New("planner not found")
	}
	if planner.UserID != userID {
		return errors.New("forbidden: planner does not belong to this user")
	}

	return u.plannerRepo.DeletePlanner(ctx, id)
}

func (u *plannerUsecase) GetWorkshops(ctx context.Context) ([]*domain.WorkshopResponse, error) {
	workshops, err := u.plannerRepo.GetRegisteredWorkshops(ctx)
	if err != nil {
		return nil, fmt.Errorf("plannerUsecase.GetWorkshops: %w", err)
	}

	res := make([]*domain.WorkshopResponse, 0, len(workshops))
	for _, w := range workshops {
		res = append(res, &domain.WorkshopResponse{
			ID:           w.ID,
			WorkshopName: w.WorkshopName,
			Address:      w.Address,
			PhoneNumber:  w.PhoneNumber,
			LogoURL:      w.LogoURL,
			IsVerified:   w.IsVerified,
		})
	}
	return res, nil
}

func toPlannerResponse(p *domain.ServicePlanner, v *domain.Vehicle) *domain.PlannerResponse {
	var vInfo *domain.VehicleResponse
	if v != nil {
		vInfo = &domain.VehicleResponse{
			ID:              v.ID,
			UserID:          v.UserID,
			Category:        v.Category,
			LicensePlate:    v.LicensePlate,
			Brand:           v.Brand,
			Model:           v.Model,
			VariantType:     v.VariantType,
			ManufactureYear: v.ManufactureYear,
			CurrentMileage:  v.CurrentMileage,
		}
	}
	return &domain.PlannerResponse{
		ID:                 p.ID,
		UserID:             p.UserID,
		VehicleID:          p.VehicleID,
		VehicleInfo:        vInfo,
		WorkshopID:         p.WorkshopID,
		IsOfficialWorkshop: p.IsOfficialWorkshop,
		WorkshopNameManual: p.WorkshopNameManual,
		Title:              p.Title,
		PlannedDate:        p.PlannedDate.Format("2006-01-02"),
		TargetMileage:      p.TargetMileage,
		Notes:              p.Notes,
		Status:             p.Status,
		CreatedAt:          p.CreatedAt,
		UpdatedAt:          p.UpdatedAt,
	}
}
