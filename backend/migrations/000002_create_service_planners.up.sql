-- 9. SERVICE PLANNERS / SCHEDULES TABLE
CREATE TABLE IF NOT EXISTS service_planners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    planned_date DATE NOT NULL,
    target_mileage INT NULL DEFAULT 0,
    notes TEXT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'planned',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_planners_user_id ON service_planners(user_id);
CREATE INDEX idx_planners_vehicle_id ON service_planners(vehicle_id);
CREATE INDEX idx_planners_planned_date ON service_planners(planned_date);
