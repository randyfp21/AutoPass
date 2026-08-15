package repository

import (
	"context"
	"errors"
	"fmt"

	"github.com/autopass/backend/internal/domain"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// ServiceRepository defines the interface for service record data operations.
type ServiceRepository interface {
	CreateServiceRecord(ctx context.Context, record *domain.ServiceRecord, details []*domain.ServiceDetail) error
	GetServiceRecordsByVehicleID(ctx context.Context, vehicleID string) ([]*domain.ServiceRecord, error)
	GetServiceRecordByID(ctx context.Context, id string) (*domain.ServiceRecord, error)
	GetServiceDetailsByRecordID(ctx context.Context, recordID string) ([]*domain.ServiceDetail, error)
	GetMasterItems(ctx context.Context) ([]*domain.MasterItem, error)
}

type serviceRepository struct {
	db *pgxpool.Pool
}

// NewServiceRepository returns a postgres-backed ServiceRepository.
func NewServiceRepository(db *pgxpool.Pool) ServiceRepository {
	return &serviceRepository{db: db}
}

// CreateServiceRecord inserts a service record and all its details atomically.
func (r *serviceRepository) CreateServiceRecord(ctx context.Context, record *domain.ServiceRecord, details []*domain.ServiceDetail) error {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return fmt.Errorf("serviceRepository.CreateServiceRecord begin tx: %w", err)
	}
	defer func() {
		if err != nil {
			_ = tx.Rollback(ctx)
		}
	}()

	recordQuery := `
		INSERT INTO service_records (
			id, vehicle_id, workshop_id, is_official_workshop, workshop_name_manual,
			service_date, mileage_at_service, complaints, total_cost, notes, receipt_photo_url, created_by_role
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
		RETURNING created_at, updated_at
	`
	err = tx.QueryRow(ctx, recordQuery,
		record.ID,
		record.VehicleID,
		record.WorkshopID,
		record.IsOfficialWorkshop,
		record.WorkshopNameManual,
		record.ServiceDate,
		record.MileageAtService,
		record.Complaints,
		record.TotalCost,
		record.Notes,
		record.ReceiptPhotoURL,
		record.CreatedByRole,
	).Scan(&record.CreatedAt, &record.UpdatedAt)
	if err != nil {
		return fmt.Errorf("serviceRepository.CreateServiceRecord insert record: %w", err)
	}

	detailQuery := `
		INSERT INTO service_details (id, service_record_id, master_item_id, item_name, quantity, unit_price, subtotal)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING created_at
	`
	for _, detail := range details {
		err = tx.QueryRow(ctx, detailQuery,
			detail.ID,
			detail.ServiceRecordID,
			detail.MasterItemID,
			detail.ItemName,
			detail.Quantity,
			detail.UnitPrice,
			detail.Subtotal,
		).Scan(&detail.CreatedAt)
		if err != nil {
			return fmt.Errorf("serviceRepository.CreateServiceRecord insert detail: %w", err)
		}
	}

	if err = tx.Commit(ctx); err != nil {
		return fmt.Errorf("serviceRepository.CreateServiceRecord commit: %w", err)
	}
	return nil
}

// GetServiceRecordsByVehicleID returns all service records for a vehicle, newest first.
func (r *serviceRepository) GetServiceRecordsByVehicleID(ctx context.Context, vehicleID string) ([]*domain.ServiceRecord, error) {
	query := `
		SELECT id, vehicle_id, workshop_id, is_official_workshop, workshop_name_manual,
		       service_date, mileage_at_service, complaints, total_cost, notes, receipt_photo_url, created_by_role, created_at, updated_at
		FROM service_records
		WHERE vehicle_id = $1
		ORDER BY service_date DESC, created_at DESC
	`
	rows, err := r.db.Query(ctx, query, vehicleID)
	if err != nil {
		return nil, fmt.Errorf("serviceRepository.GetServiceRecordsByVehicleID: %w", err)
	}
	defer rows.Close()

	var records []*domain.ServiceRecord
	for rows.Next() {
		rec := &domain.ServiceRecord{}
		if err := rows.Scan(
			&rec.ID, &rec.VehicleID, &rec.WorkshopID, &rec.IsOfficialWorkshop, &rec.WorkshopNameManual,
			&rec.ServiceDate, &rec.MileageAtService, &rec.Complaints, &rec.TotalCost, &rec.Notes, &rec.ReceiptPhotoURL,
			&rec.CreatedByRole, &rec.CreatedAt, &rec.UpdatedAt,
		); err != nil {
			return nil, fmt.Errorf("serviceRepository.GetServiceRecordsByVehicleID scan: %w", err)
		}
		records = append(records, rec)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("serviceRepository.GetServiceRecordsByVehicleID rows: %w", err)
	}
	return records, nil
}

// GetServiceRecordByID retrieves a single service record by its UUID.
func (r *serviceRepository) GetServiceRecordByID(ctx context.Context, id string) (*domain.ServiceRecord, error) {
	query := `
		SELECT id, vehicle_id, workshop_id, is_official_workshop, workshop_name_manual,
		       service_date, mileage_at_service, complaints, total_cost, notes, receipt_photo_url, created_by_role, created_at, updated_at
		FROM service_records
		WHERE id = $1
	`
	rec := &domain.ServiceRecord{}
	err := r.db.QueryRow(ctx, query, id).Scan(
		&rec.ID, &rec.VehicleID, &rec.WorkshopID, &rec.IsOfficialWorkshop, &rec.WorkshopNameManual,
		&rec.ServiceDate, &rec.MileageAtService, &rec.Complaints, &rec.TotalCost, &rec.Notes, &rec.ReceiptPhotoURL,
		&rec.CreatedByRole, &rec.CreatedAt, &rec.UpdatedAt,
	)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("serviceRepository.GetServiceRecordByID: %w", err)
	}
	return rec, nil
}

// GetServiceDetailsByRecordID retrieves all line-item details for a service record.
func (r *serviceRepository) GetServiceDetailsByRecordID(ctx context.Context, recordID string) ([]*domain.ServiceDetail, error) {
	query := `
		SELECT id, service_record_id, master_item_id, item_name, quantity, unit_price, subtotal, created_at
		FROM service_details
		WHERE service_record_id = $1
		ORDER BY created_at ASC
	`
	rows, err := r.db.Query(ctx, query, recordID)
	if err != nil {
		return nil, fmt.Errorf("serviceRepository.GetServiceDetailsByRecordID: %w", err)
	}
	defer rows.Close()

	var details []*domain.ServiceDetail
	for rows.Next() {
		d := &domain.ServiceDetail{}
		if err := rows.Scan(
			&d.ID, &d.ServiceRecordID, &d.MasterItemID, &d.ItemName,
			&d.Quantity, &d.UnitPrice, &d.Subtotal, &d.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("serviceRepository.GetServiceDetailsByRecordID scan: %w", err)
		}
		details = append(details, d)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("serviceRepository.GetServiceDetailsByRecordID rows: %w", err)
	}
	return details, nil
}

// GetMasterItems retrieves all master items from the database.
func (r *serviceRepository) GetMasterItems(ctx context.Context) ([]*domain.MasterItem, error) {
	query := `
		SELECT id, item_name, category, vehicle_category, description, created_at
		FROM master_items
		ORDER BY vehicle_category, category, item_name
	`
	rows, err := r.db.Query(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("serviceRepository.GetMasterItems: %w", err)
	}
	defer rows.Close()

	var items []*domain.MasterItem
	for rows.Next() {
		item := &domain.MasterItem{}
		if err := rows.Scan(
			&item.ID, &item.ItemName, &item.Category, &item.VehicleCategory, &item.Description, &item.CreatedAt,
		); err != nil {
			return nil, fmt.Errorf("serviceRepository.GetMasterItems scan: %w", err)
		}
		items = append(items, item)
	}
	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("serviceRepository.GetMasterItems rows: %w", err)
	}
	return items, nil
}
