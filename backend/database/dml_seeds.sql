-- ================================================================================
-- AUTOPASS / ODOMTR DATABASE DML SEEDS (DATA MANIPULATION LANGUAGE)
-- Initial Seeds & Demo Data
-- ================================================================================

-- ─── 1. MASTER ITEMS SEEDS ───────────────────────────────────────────────────
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
('Ganti Ban Baru', 'part', 'motor', 'Penggantian ban tubeless/tubetype')
ON CONFLICT DO NOTHING;

-- ─── 2. DEMO USER SEED ───────────────────────────────────────────────────────
-- Account: demo@odomtr.com / password123 (bcrypt hash) / Username: dnazrl (@dnazrl)
INSERT INTO users (id, email, username, password_hash, full_name, phone_number, role, auth_provider)
VALUES (
    'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
    'demo@odomtr.com',
    'dnazrl',
    '$2a$10$w4rK85lKz02PqZ4yYfWf3.kYq2aJ024/7s4l6937eWf768b4w5c9K',
    'Demo User',
    '085780336399',
    'user',
    'email'
) ON CONFLICT (email) DO UPDATE SET username = 'dnazrl';

-- ─── 3. DEMO VEHICLE SEED ─────────────────────────────────────────────────────
INSERT INTO vehicles (id, user_id, category, license_plate, brand, model, variant_type, manufacture_year, current_mileage, nickname, stnk_number, stnk_expiry_date)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
    'motor',
    'B 4567 TGR',
    'Honda',
    'Vario 150',
    'eSP CBS-ISS',
    2021,
    24500,
    'Vario Hitam Dnazrl',
    'STNK-2021-998877',
    '2026-11-20'
) ON CONFLICT DO NOTHING;

-- ─── 4. SAMPLE THREADS SEED ──────────────────────────────────────────────────
INSERT INTO threads (id, user_id, content, category, likes_count, comments_count, bookmarks_count)
VALUES (
    '6a9a18c4-c915-42da-895e-79a3e097a3dc',
    'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
    'Testing posting modifikasi knalpot & velg ring 14 Vario 150!',
    'modifikasi',
    1, 1, 1
),
(
    'fc986171-60ed-4e06-9363-a75ed02b7960',
    'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
    'Test posting cerita touring weekend dari Bali ke Bromo bersama komunitas Honda Vario!',
    'touring',
    0, 0, 1
),
(
    'fa576dba-d7b7-43d9-b6e0-3be2b8b2ce0b',
    'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
    'Halo salam kenal otomotif squad! Mau tanya, Honda Vario 150 saya saat tarikan awal suka gredek di bagian CVT. Ada rekomendasi roller & per CVT yang bagus biar lebih halus?',
    'kendala',
    0, 0, 0
) ON CONFLICT DO NOTHING;
