package repository

import (
	"context"
	"fmt"

	"github.com/autopass/backend/internal/domain"
	"github.com/jackc/pgx/v5/pgxpool"
)

type PartMonitorRepository interface {
	GetPartMonitors(ctx context.Context, vehicleID string) ([]*domain.VehiclePartMonitor, error)
	UpdatePartMonitor(ctx context.Context, id string, vehicleID string, isEnabled *bool, idealLifespan *int) error
	ReplacePart(ctx context.Context, id string, vehicleID string, mileage int, dateStr string) error
	EnsureDefaultPartMonitors(ctx context.Context, vehicleID string, category string, currentMileage int) error
}

type partMonitorRepository struct {
	db *pgxpool.Pool
}

func NewPartMonitorRepository(db *pgxpool.Pool) PartMonitorRepository {
	return &partMonitorRepository{db: db}
}

func (r *partMonitorRepository) EnsureDefaultPartMonitors(ctx context.Context, vehicleID string, category string, currentMileage int) error {
	type defaultPart struct {
		key      string
		name     string
		icon     string
		lifespan int
	}

	var defaults []defaultPart
	if category == "motor" {
		defaults = []defaultPart{
			{key: "engine_oil", name: "Oli Mesin", icon: "oil", lifespan: 3000},
			{key: "spark_plug", name: "Busi Pengapian", icon: "zap", lifespan: 8000},
			{key: "oil_filter", name: "Filter Oli", icon: "filter", lifespan: 6000},
			{key: "air_filter", name: "Filter Udara Mesin", icon: "wind", lifespan: 10000},
			{key: "brake_pads", name: "Kampas Rem Depan/Belakang", icon: "shield", lifespan: 12000},
			{key: "brake_fluid", name: "Minyak Rem", icon: "droplet", lifespan: 12000},
			{key: "tires", name: "Ban Depan & Belakang", icon: "circle", lifespan: 15000},
			{key: "vbelt", name: "CVT V-Belt / Rantai", icon: "activity", lifespan: 20000},
			{key: "transmission_fluid", name: "Oli Transmisi / Oli Gardan", icon: "cog", lifespan: 8000},
			{key: "radiator_coolant", name: "Air Radiator (Coolant)", icon: "thermometer", lifespan: 12000},
			{key: "battery", name: "Aki Motor / Battery", icon: "battery", lifespan: 25000},
			{key: "cabin_ac_filter", name: "Filter Hawa CVT", icon: "fan", lifespan: 10000},
		}
	} else {
		defaults = []defaultPart{
			{key: "engine_oil", name: "Oli Mesin", icon: "oil", lifespan: 10000},
			{key: "spark_plug", name: "Busi Standar / Iridium", icon: "zap", lifespan: 20000},
			{key: "oil_filter", name: "Filter Oli", icon: "filter", lifespan: 10000},
			{key: "air_filter", name: "Filter Udara Mesin", icon: "wind", lifespan: 20000},
			{key: "brake_pads", name: "Kampas Rem Depan/Belakang", icon: "shield", lifespan: 30000},
			{key: "brake_fluid", name: "Minyak Rem", icon: "droplet", lifespan: 20000},
			{key: "tires", name: "Ban Depan & Belakang", icon: "circle", lifespan: 40000},
			{key: "vbelt", name: "Timing Belt / Fan Belt", icon: "activity", lifespan: 40000},
			{key: "transmission_fluid", name: "Oli Transmisi / ATF Matic", icon: "cog", lifespan: 20000},
			{key: "radiator_coolant", name: "Cairan Radiator (Coolant)", icon: "thermometer", lifespan: 20000},
			{key: "battery", name: "Aki Mobil / Battery", icon: "battery", lifespan: 50000},
			{key: "cabin_ac_filter", name: "Filter AC Kabin", icon: "fan", lifespan: 15000},
		}
	}

	for _, dp := range defaults {
		query := `
			INSERT INTO vehicle_part_monitors (vehicle_id, part_key, part_name, icon_type, last_replaced_mileage, ideal_lifespan_km, is_enabled)
			VALUES ($1::uuid, $2, $3, $4, $5, $6, TRUE)
			ON CONFLICT (vehicle_id, part_key) DO NOTHING
		`
		_, err := r.db.Exec(ctx, query, vehicleID, dp.key, dp.name, dp.icon, currentMileage, dp.lifespan)
		if err != nil {
			return fmt.Errorf("EnsureDefaultPartMonitors key %s: %w", dp.key, err)
		}
	}
	return nil
}

func (r *partMonitorRepository) GetPartMonitors(ctx context.Context, vehicleID string) ([]*domain.VehiclePartMonitor, error) {
	query := `
		SELECT id, vehicle_id, part_key, part_name, icon_type, last_replaced_mileage, ideal_lifespan_km, is_enabled,
		       last_replaced_date::text, created_at, updated_at
		FROM vehicle_part_monitors
		WHERE vehicle_id = $1::uuid
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("GetPartMonitors query: %w", err)
	}
	defer rows.Close()

	var result []*domain.VehiclePartMonitor
	for rows.Next() {
		m := &domain.VehiclePartMonitor{}
		var lastDate *string
		if err := rows.Scan(
			&m.ID, &m.VehicleID, &m.PartKey, &m.PartName, &m.IconType,
			&m.LastReplacedMileage, &m.IdealLifespanKM, &m.IsEnabled,
			&lastDate, &m.CreatedAt, &m.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("GetPartMonitors scan: %w", err)
		}
		m.LastReplacedDate = lastDate
		result = append(result, m)
	}
	return result, nil
}

func (r *partMonitorRepository) UpdatePartMonitor(ctx context.Context, id string, vehicleID string, isEnabled *bool, idealLifespan *int) error {
	query := `
		UPDATE vehicle_part_monitors
		SET is_enabled = COALESCE($1, is_enabled),
		    ideal_lifespan_km = COALESCE($2, ideal_lifespan_km),
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $3::uuid AND vehicle_id = $4::uuid
	`
	_, err := r.db.Exec(ctx, query, isEnabled, idealLifespan, id, vehicleID)
	if err != nil {
		return fmt.Errorf("UpdatePartMonitor: %w", err)
	}
	return nil
}

func (r *partMonitorRepository) ReplacePart(ctx context.Context, id string, vehicleID string, mileage int, dateStr string) error {
	query := `
		UPDATE vehicle_part_monitors
		SET last_replaced_mileage = $1,
		    last_replaced_date = CASE WHEN $2 = '' THEN CURRENT_DATE ELSE $2::date END,
		    updated_at = CURRENT_TIMESTAMP
		WHERE id = $3::uuid AND vehicle_id = $4::uuid
	`
	_, err := r.db.Exec(ctx, query, mileage, dateStr, id, vehicleID)
	if err != nil {
		return fmt.Errorf("ReplacePart: %w", err)
	}
	return nil
}
