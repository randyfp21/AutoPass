package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/autopass/backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// PlannerRepository defines database operations for service planners.
type PlannerRepository interface {
	CreatePlanner(ctx context.Context, planner *domain.ServicePlanner) error
	GetPlannersByUserID(ctx context.Context, userID string) ([]*domain.ServicePlanner, error)
	GetPlannerByID(ctx context.Context, id string) (*domain.ServicePlanner, error)
	UpdatePlanner(ctx context.Context, planner *domain.ServicePlanner) error
	DeletePlanner(ctx context.Context, id string) error
	GetRegisteredWorkshops(ctx context.Context) ([]*domain.Workshop, error)
}

type plannerRepository struct {
	db *pgxpool.Pool
}

// NewPlannerRepository returns a new postgres-backed PlannerRepository.
func NewPlannerRepository(db *pgxpool.Pool) PlannerRepository {
	return &plannerRepository{db: db}
}

func (r *plannerRepository) CreatePlanner(ctx context.Context, p *domain.ServicePlanner) error {
	query := `
		INSERT INTO service_planners (id, user_id, vehicle_id, workshop_id, is_official_workshop, workshop_name_manual, title, planned_date, target_mileage, notes, status)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		p.ID,
		p.UserID,
		p.VehicleID,
		p.WorkshopID,
		p.IsOfficialWorkshop,
		p.WorkshopNameManual,
		p.Title,
		p.PlannedDate,
		p.TargetMileage,
		p.Notes,
		p.Status,
	).Scan(&p.CreatedAt, &p.UpdatedAt)
	if err != nil {
		return fmt.Errorf("plannerRepository.CreatePlanner: %w", err)
	}
	return nil
}

func (r *plannerRepository) GetPlannersByUserID(ctx context.Context, userID string) ([]*domain.ServicePlanner, error) {
	query := `
		SELECT id, user_id, vehicle_id, workshop_id, is_official_workshop, workshop_name_manual, title, planned_date, target_mileage, notes, status, created_at, updated_at
		FROM service_planners
		WHERE user_id = $1
		ORDER BY planned_date ASC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("plannerRepository.GetPlannersByUserID query: %w", err)
	}
	defer rows.Close()

	var list []*domain.ServicePlanner
	for rows.Next() {
		p := &domain.ServicePlanner{}
		if err := rows.Scan(
			&p.ID,
			&p.UserID,
			&p.VehicleID,
			&p.WorkshopID,
			&p.IsOfficialWorkshop,
			&p.WorkshopNameManual,
			&p.Title,
			&p.PlannedDate,
			&p.TargetMileage,
			&p.Notes,
			&p.Status,
			&p.CreatedAt,
			&p.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("plannerRepository.GetPlannersByUserID scan: %w", err)
		}
		list = append(list, p)
	}
	return list, nil
}

func (r *plannerRepository) GetPlannerByID(ctx context.Context, id string) (*domain.ServicePlanner, error) {
	query := `
		SELECT id, user_id, vehicle_id, workshop_id, is_official_workshop, workshop_name_manual, title, planned_date, target_mileage, notes, status, created_at, updated_at
		FROM service_planners
		WHERE id = $1
	`
	p := &domain.ServicePlanner{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&p.ID,
		&p.UserID,
		&p.VehicleID,
		&p.WorkshopID,
		&p.IsOfficialWorkshop,
		&p.WorkshopNameManual,
		&p.Title,
		&p.PlannedDate,
		&p.TargetMileage,
		&p.Notes,
		&p.Status,
		&p.CreatedAt,
		&p.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("plannerRepository.GetPlannerByID: %w", err)
	}
	return p, nil
}

func (r *plannerRepository) UpdatePlanner(ctx context.Context, p *domain.ServicePlanner) error {
	query := `
		UPDATE service_planners
		SET workshop_id = $1, is_official_workshop = $2, workshop_name_manual = $3, title = $4, planned_date = $5, target_mileage = $6, notes = $7, status = $8, updated_at = CURRENT_TIMESTAMP
		WHERE id = $9
		RETURNING updated_at
	`
	err := r.db.QueryRow(ctx, query,
		p.WorkshopID,
		p.IsOfficialWorkshop,
		p.WorkshopNameManual,
		p.Title,
		p.PlannedDate,
		p.TargetMileage,
		p.Notes,
		p.Status,
		p.ID,
	).Scan(&p.UpdatedAt)
	if err != nil {
		return fmt.Errorf("plannerRepository.UpdatePlanner: %w", err)
	}
	return nil
}

func (r *plannerRepository) DeletePlanner(ctx context.Context, id string) error {
	query := `DELETE FROM service_planners WHERE id = $1`
	_, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("plannerRepository.DeletePlanner: %w", err)
	}
	return nil
}

func (r *plannerRepository) GetRegisteredWorkshops(ctx context.Context) ([]*domain.Workshop, error) {
	query := `
		SELECT id, user_id, workshop_name, address, phone_number, logo_url, is_verified, created_at, updated_at
		FROM workshops
		ORDER BY is_verified DESC, workshop_name ASC
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("plannerRepository.GetRegisteredWorkshops query: %w", err)
	}
	defer rows.Close()

	var list []*domain.Workshop
	for rows.Next() {
		w := &domain.Workshop{}
		if err := rows.Scan(
			&w.ID,
			&w.UserID,
			&w.WorkshopName,
			&w.Address,
			&w.PhoneNumber,
			&w.LogoURL,
			&w.IsVerified,
			&w.CreatedAt,
			&w.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("plannerRepository.GetRegisteredWorkshops scan: %w", err)
		}
		list = append(list, w)
	}
	return list, nil
}
