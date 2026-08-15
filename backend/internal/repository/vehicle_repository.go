package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/autopass/backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// VehicleRepository defines the interface for vehicle data operations.
type VehicleRepository interface {
	CreateVehicle(ctx context.Context, vehicle *domain.Vehicle) error
	GetVehiclesByUserID(ctx context.Context, userID string) ([]*domain.Vehicle, error)
	GetVehicleByID(ctx context.Context, id string) (*domain.Vehicle, error)
	UpdateVehicle(ctx context.Context, vehicle *domain.Vehicle) error
	DeleteVehicle(ctx context.Context, id string) error
	UpdateMileage(ctx context.Context, vehicleID string, mileage int) error
}

type vehicleRepository struct {
	db *pgxpool.Pool
}

// NewVehicleRepository returns a postgres-backed VehicleRepository.
func NewVehicleRepository(db *pgxpool.Pool) VehicleRepository {
	return &vehicleRepository{db: db}
}

// CreateVehicle inserts a new vehicle into the database.
func (r *vehicleRepository) CreateVehicle(ctx context.Context, vehicle *domain.Vehicle) error {
	fuelType := vehicle.FuelType
	if fuelType == "" {
		fuelType = "bensin"
	}
	query := `
		INSERT INTO vehicles (id, user_id, nickname, category, fuel_type, license_plate, brand, model, variant_type, manufacture_year, current_mileage, photo_url, stnk_number, stnk_expiry_date)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, CASE WHEN $14 = '' THEN NULL ELSE $14::date END)
		RETURNING created_at, updated_at
	`
	err := r.db.QueryRow(ctx, query,
		vehicle.ID,
		vehicle.UserID,
		vehicle.Nickname,
		vehicle.Category,
		fuelType,
		vehicle.LicensePlate,
		vehicle.Brand,
		vehicle.Model,
		vehicle.VariantType,
		vehicle.ManufactureYear,
		vehicle.CurrentMileage,
		vehicle.PhotoURL,
		vehicle.STNKNumber,
		vehicle.STNKExpiryDate,
	).Scan(&vehicle.CreatedAt, &vehicle.UpdatedAt)
	if err != nil {
		return fmt.Errorf("vehicleRepository.CreateVehicle: %w", err)
	}
	return nil
}

// GetVehiclesByUserID returns all vehicles belonging to a user.
func (r *vehicleRepository) GetVehiclesByUserID(ctx context.Context, userID string) ([]*domain.Vehicle, error) {
	query := `
		SELECT id, user_id, nickname, category, fuel_type, license_plate, brand, model, variant_type, manufacture_year, current_mileage, photo_url, stnk_number, to_char(stnk_expiry_date, 'YYYY-MM-DD') AS stnk_expiry_date, created_at, updated_at
		FROM vehicles
		WHERE user_id = $1
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(ctx, query, userID)
	if err != nil {
		return nil, fmt.Errorf("vehicleRepository.GetVehiclesByUserID: %w", err)
	}
	defer rows.Close()

	var vehicles []*domain.Vehicle
	for rows.Next() {
		v := &domain.Vehicle{}
		if err := rows.Scan(
			&v.ID, &v.UserID, &v.Nickname, &v.Category, &v.FuelType, &v.LicensePlate, &v.Brand, &v.Model,
			&v.VariantType, &v.ManufactureYear, &v.CurrentMileage, &v.PhotoURL,
			&v.STNKNumber, &v.STNKExpiryDate,
			&v.CreatedAt, &v.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("vehicleRepository.GetVehiclesByUserID scan: %w", err)
		}
		vehicles = append(vehicles, v)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("vehicleRepository.GetVehiclesByUserID rows: %w", err)
	}
	return vehicles, nil
}

// GetVehicleByID retrieves a single vehicle by its UUID.
func (r *vehicleRepository) GetVehicleByID(ctx context.Context, id string) (*domain.Vehicle, error) {
	query := `
		SELECT id, user_id, nickname, category, fuel_type, license_plate, brand, model, variant_type, manufacture_year, current_mileage, photo_url, stnk_number, to_char(stnk_expiry_date, 'YYYY-MM-DD') AS stnk_expiry_date, created_at, updated_at
		FROM vehicles
		WHERE id = $1
	`
	v := &domain.Vehicle{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&v.ID, &v.UserID, &v.Nickname, &v.Category, &v.FuelType, &v.LicensePlate, &v.Brand, &v.Model,
		&v.VariantType, &v.ManufactureYear, &v.CurrentMileage, &v.PhotoURL,
		&v.STNKNumber, &v.STNKExpiryDate,
		&v.CreatedAt, &v.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("vehicleRepository.GetVehicleByID: %w", err)
	}
	return v, nil
}

// UpdateVehicle updates all mutable fields for a vehicle.
func (r *vehicleRepository) UpdateVehicle(ctx context.Context, vehicle *domain.Vehicle) error {
	fuelType := vehicle.FuelType
	if fuelType == "" {
		fuelType = "bensin"
	}
	query := `
		UPDATE vehicles
		SET nickname = $1, category = $2, fuel_type = $3, license_plate = $4, brand = $5, model = $6,
		    variant_type = $7, manufacture_year = $8, current_mileage = $9, photo_url = $10,
		    stnk_number = $11, stnk_expiry_date = CASE WHEN $12 = '' THEN NULL ELSE $12::date END,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $13 AND user_id = $14
		RETURNING updated_at
	`
	err := r.db.QueryRow(ctx, query,
		vehicle.Nickname,
		vehicle.Category,
		fuelType,
		vehicle.LicensePlate,
		vehicle.Brand,
		vehicle.Model,
		vehicle.VariantType,
		vehicle.ManufactureYear,
		vehicle.CurrentMileage,
		vehicle.PhotoURL,
		vehicle.STNKNumber,
		vehicle.STNKExpiryDate,
		vehicle.ID,
		vehicle.UserID,
	).Scan(&vehicle.UpdatedAt)
	if err != nil {
		return fmt.Errorf("vehicleRepository.UpdateVehicle: %w", err)
	}
	return nil
}

// DeleteVehicle deletes a vehicle by ID.
func (r *vehicleRepository) DeleteVehicle(ctx context.Context, id string) error {
	query := `DELETE FROM vehicles WHERE id = $1`
	ct, err := r.db.Exec(ctx, query, id)
	if err != nil {
		return fmt.Errorf("vehicleRepository.DeleteVehicle: %w", err)
	}
	if ct.RowsAffected() == 0 {
		return fmt.Errorf("vehicleRepository.DeleteVehicle: no rows deleted")
	}
	return nil
}

// UpdateMileage updates only the current_mileage field of a vehicle.
func (r *vehicleRepository) UpdateMileage(ctx context.Context, vehicleID string, mileage int) error {
	query := `UPDATE vehicles SET current_mileage = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`
	_, err := r.db.Exec(ctx, query, mileage, vehicleID)
	if err != nil {
		return fmt.Errorf("vehicleRepository.UpdateMileage: %w", err)
	}
	return nil
}
