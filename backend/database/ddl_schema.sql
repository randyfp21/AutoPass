-- ================================================================================
-- AUTOPASS / ODOMTR DATABASE DDL SCHEMA (DATA DEFINITION LANGUAGE)
-- Target Database: PostgreSQL 14+ / 15+ / 16+
-- ================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ─── ENUM TYPES ───────────────────────────────────────────────────────────────
CREATE TYPE user_role AS ENUM ('user', 'workshop_owner', 'admin');
CREATE TYPE auth_provider_type AS ENUM ('email', 'google');
CREATE TYPE vehicle_category_type AS ENUM ('motor', 'mobil');
CREATE TYPE item_category_type AS ENUM ('part', 'fluid', 'service_fee');
CREATE TYPE created_by_role_type AS ENUM ('user', 'workshop');

-- ─── 1. USERS TABLE ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NULL,
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
CREATE INDEX idx_users_username ON users(username);

-- ─── 2. WORKSHOPS TABLE ───────────────────────────────────────────────────────
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

-- ─── 3. VEHICLES TABLE ────────────────────────────────────────────────────────
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
    nickname VARCHAR(50) NULL,
    stnk_number VARCHAR(50) NULL,
    stnk_expiry_date DATE NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_vehicles_user_id ON vehicles(user_id);
CREATE INDEX idx_vehicles_license_plate ON vehicles(license_plate);

-- ─── 4. MASTER ITEMS TABLE ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS master_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_name VARCHAR(100) NOT NULL,
    category item_category_type NOT NULL,
    vehicle_category vehicle_category_type NOT NULL DEFAULT 'mobil',
    description TEXT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_master_items_category ON master_items(category);

-- ─── 5. WORKSHOP ITEM PRICES TABLE ───────────────────────────────────────────
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

-- ─── 6. SERVICE PLANNERS TABLE ────────────────────────────────────────────────
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

-- ─── 7. SERVICE RECORDS TABLE ────────────────────────────────────────────────
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
    receipt_photo_url TEXT NULL,
    created_by_role created_by_role_type NOT NULL DEFAULT 'user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_service_records_vehicle_id ON service_records(vehicle_id);
CREATE INDEX idx_service_records_service_date ON service_records(service_date);

-- ─── 8. SERVICE DETAILS TABLE ────────────────────────────────────────────────
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

-- ─── 9. SERVICE PHOTOS TABLE ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS service_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_record_id UUID NOT NULL REFERENCES service_records(id) ON DELETE CASCADE,
    original_photo_url TEXT NOT NULL,
    watermarked_photo_url TEXT NULL,
    caption VARCHAR(255) NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ─── 10. THREADS TABLE (ODO THREADS COMMUNITY) ──────────────────────────────
CREATE TABLE IF NOT EXISTS threads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vehicle_id UUID NULL REFERENCES vehicles(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    photo_urls TEXT[] NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'diskusi',
    likes_count INT NOT NULL DEFAULT 0,
    comments_count INT NOT NULL DEFAULT 0,
    bookmarks_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_threads_user_id ON threads(user_id);
CREATE INDEX idx_threads_category ON threads(category);

-- ─── 11. THREAD COMMENTS TABLE ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    likes_count INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_comments_thread_id ON thread_comments(thread_id);

-- ─── 12. THREAD LIKES TABLE ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_likes (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, thread_id)
);

-- ─── 13. THREAD BOOKMARKS TABLE ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_bookmarks (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id UUID NOT NULL REFERENCES threads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (user_id, thread_id)
);

-- ─── 14. THREAD NOTIFICATIONS TABLE ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS thread_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    actor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    thread_id UUID NULL REFERENCES threads(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_notifications_user_id ON thread_notifications(user_id);
