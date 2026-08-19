-- Migration 000009: Create vehicle_part_monitors table for Vehicle Service Monitor
CREATE TABLE IF NOT EXISTS vehicle_part_monitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    part_key VARCHAR(50) NOT NULL,
    part_name VARCHAR(100) NOT NULL,
    icon_type VARCHAR(50) NOT NULL DEFAULT 'oil',
    last_replaced_mileage INT NOT NULL DEFAULT 0,
    ideal_lifespan_km INT NOT NULL DEFAULT 4000,
    is_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    last_replaced_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_vehicle_part_key UNIQUE (vehicle_id, part_key)
);

CREATE INDEX IF NOT EXISTS idx_part_monitors_vehicle_id ON vehicle_part_monitors(vehicle_id);
