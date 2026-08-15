CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TYPE user_role AS ENUM ('user', 'workshop_owner', 'admin');
CREATE TYPE auth_provider_type AS ENUM ('email', 'google');
CREATE TYPE vehicle_category_type AS ENUM ('motor', 'mobil');
CREATE TYPE item_category_type AS ENUM ('part', 'fluid', 'service_fee');
CREATE TYPE created_by_role_type AS ENUM ('user', 'workshop');

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NULL,
    full_name VARCHAR(100) NOT NULL,
    phone_number VARCHAR(20) NULL,
    avatar_url TEXT NULL,
    role user_role NOT NULL DEFAULT 'user',
    auth_provider auth_provider_type NOT NULL DEFAULT 'email',
    google_id VARCHAR(255) NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS workshops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    workshop_name VARCHAR(150) NOT NULL,
    address TEXT NOT NULL,
    phone_number VARCHAR(20) NOT NULL,
    logo_url TEXT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_workshops_user_id ON workshops(user_id);

CREATE TABLE IF NOT EXISTS vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category vehicle_category_type NOT NULL,
    license_plate VARCHAR(20) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    variant_type VARCHAR(50) NULL,
    manufacture_year INT NOT NULL,
    current_mileage INT NOT NULL DEFAULT 0,
    photo_url TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

CREATE TABLE IF NOT EXISTS master_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(100) NOT NULL,
    category item_category_type NOT NULL,
    vehicle_category vehicle_category_type NOT NULL DEFAULT 'mobil',
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_master_items_category ON master_items(category);

CREATE TABLE IF NOT EXISTS workshop_item_prices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workshop_id UUID NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
    master_item_id UUID NULL REFERENCES master_items(id) ON DELETE SET NULL,
    custom_item_name VARCHAR(100) NULL,
    price BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_workshop_prices_workshop_id ON workshop_item_prices(workshop_id);

CREATE TABLE IF NOT EXISTS service_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    workshop_id UUID NULL REFERENCES workshops(id) ON DELETE SET NULL,
    is_official_workshop BOOLEAN DEFAULT FALSE,
    workshop_name_manual VARCHAR(150) NULL,
    service_date DATE NOT NULL,
    mileage_at_service INT NOT NULL,
    complaints TEXT NULL,
    total_cost BIGINT NOT NULL DEFAULT 0,
    notes TEXT NULL,
    created_by_role created_by_role_type NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX idx_service_records_service_date ON service_records(service_date);

CREATE TABLE IF NOT EXISTS service_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_record_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    master_item_id UUID NULL REFERENCES master_items(id) ON DELETE SET NULL,
    item_name VARCHAR(100) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    unit_price BIGINT NOT NULL,
    subtotal BIGINT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_service_details_record_id ON service_details(service_record_id);

CREATE TABLE IF NOT EXISTS service_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_record_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    original_photo_url TEXT NOT NULL,
    watermarked_photo_url TEXT NULL,
    caption VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO master_items (item_name, category, vehicle_category, description) VALUES
('Oli Mesin', 'fluid', 'mobil', 'Penggantian oli mesin rutin mobil'),
('Oli Mesin', 'fluid', 'motor', 'Penggantian oli mesin rutin motor'),
('Filter Oli', 'part', 'mobil', 'Penggantian saringan oli mesin'),
('Busi Standar/Iridium', 'part', 'mobil', 'Penggantian busi pengapian mobil'),
('Busi Standar', 'part', 'motor', 'Penggantian busi pengapian motor'),
('Air Radiator (Coolant)', 'fluid', 'mobil', 'Pengurasan atau top-up cairan radiator'),
('Service Ringan / Tune Up', 'service_fee', 'mobil', 'Pengecekan standar berkala'),
('Service Ringan / Tune Up', 'service_fee', 'motor', 'Pengecekan standar berkala'),
('Service Besar / Overhaul', 'service_fee', 'mobil', 'Perbaikan total komponen mesin'),
('Ganti Kampas Rem Depan/Belakang', 'part', 'mobil', 'Penggantian brake pad/shoe'),
('Ganti Ban Baru', 'part', 'motor', 'Penggantian ban tubeless/tubetype');
