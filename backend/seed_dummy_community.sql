-- SQL Seeder Script: Populate 20 Real Dummy Users, Subscriptions, Threads, Comments, Likes, Bookmarks, and Notifications

-- 1. Insert 20 Users
INSERT INTO users (id, email, password_hash, full_name, username, phone_number, avatar_url, bio, role, auth_provider)
VALUES 
('10000000-0000-0000-0000-000000000001', 'budi@speedmaster.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Budi Santoso', 'speedmaster', '081234567801', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', 'Top Auto Enthusiast 🏎️ | Collector | Reviewer Modifikasi & Dyno Tuning', 'user', 'email'),
('10000000-0000-0000-0000-000000000002', 'rizky@evindo.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Rizky Pratama', 'ev_innovator', '081234567802', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', 'EV Daily Driver ⚡ | Ioniq 5 & Wuling Air EV Enthusiast | Green Tech', 'user', 'email'),
('10000000-0000-0000-0000-000000000003', 'hendrik@biled.co.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Hendrik Setyawan', 'biled_king', '081234567803', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300', 'Specialist Bi-LED Projector 💡 | Headlight Retrofit & Custom DRL', 'user', 'email'),
('10000000-0000-0000-0000-000000000004', 'fajri@audioauto.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Fajri Ramadhan', 'audio_addict', '081234567804', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300', 'SQ & SPL Sound System Specialist 🔊 | Peredam & Subwoofer Setup', 'user', 'email'),
('10000000-0000-0000-0000-000000000005', 'denny@tyreking.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Denny Kurniawan', 'tyre_expert', '081234567805', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', 'Velg & Ban Consultant 🛞 | Fitment Specialist | camber & Stance', 'user', 'email'),
('10000000-0000-0000-0000-000000000006', 'kevin@detailing.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Kevin Wijaya', 'detailing_pro', '081234567806', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300', 'Ceramic Coating & Paint Correction ✨ | Car Detailing Enthusiast', 'user', 'email'),
('10000000-0000-0000-0000-000000000007', 'aditya@touring.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Aditya Putra', 'touring_mania', '081234567807', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300', 'Long Distance Riding 🏍️ | Sunmori & Cross Island Touring', 'user', 'email'),
('10000000-0000-0000-0000-000000000008', 'rian@autocare.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Rian Hidayat', 'autocare_id', '081234567808', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300', 'Bengkel Resmi Partner AutoCare 🔧 | Spesialis Mesin & Kaki-Kaki', 'workshop_owner', 'email'),
('10000000-0000-0000-0000-000000000009', 'bagas@2stroke.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Bagas Satria', '2stroke_lover', '081234567809', 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=300', 'Restorasi Motor 2 Tak Legend 🛵 | RX-King & Ninja 150 R', 'user', 'email'),
('10000000-0000-0000-0000-000000000010', 'bayu@garasi.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Bayu Prasetyo', 'garasi_kreatif', '081234567810', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=300', 'Custom Garage & Bodykit Build 🛠️ | Street Racing Style', 'user', 'email'),
('10000000-0000-0000-0000-000000000011', 'eko@modifikator.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Eko Prabowo', 'modifikator_muda', '081234567811', 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=300', 'Modifikasi Civic Turbo & Yaris GR 🚗 | Track Day Addict', 'user', 'email'),
('10000000-0000-0000-0000-000000000012', 'fahmi@drifting.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Fahmi Nugroho', 'drifting_indo', '081234567812', 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=300', 'Drifting Enthusiast 🏁 | Nissan Silvia & Cefiro Build', 'user', 'email'),
('10000000-0000-0000-0000-000000000013', 'genta@sunmori.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Genta Wijaya', 'sunmori_jakarta', '081234567813', 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=300', 'Sunmori Jakarta Rider 🏍️ | Big Bike Club Member', 'user', 'email'),
('10000000-0000-0000-0000-000000000014', 'hendra@vespa.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Hendra Tan', 'vespa_classic', '081234567814', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=300', 'Vespa Sprint & PTS Classic Vintage 🛵 | Restorasi Original', 'user', 'email'),
('10000000-0000-0000-0000-000000000015', 'irfan@evwheels.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Irfan Hakim', 'electric_wheels', '081234567815', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=300', 'Motor & Mobil Listrik Masa Depan ⚡ | BYD Seal & Niu Rider', 'user', 'email'),
('10000000-0000-0000-0000-000000000016', 'joni@racing.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Joni Sugiarto', 'racing_mechanic', '081234567816', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=300', 'Mekanik Balap Drag & Sentul 🛠️ | ECU Tuning Master', 'user', 'email'),
('10000000-0000-0000-0000-000000000017', 'lukman@aksesoris.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Lukman Hakim', 'aksesoris_auto', '081234567817', 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=300', 'Distributor Aksesoris Otomotif Import 🎀 | Karpet 7D & Film Tint', 'user', 'email'),
('10000000-0000-0000-0000-000000000018', 'nugroho@bengkel.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Nugroho Perkasa', 'bengkel_sejahtera', '081234567818', 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=300', 'Owner Bengkel Sejahtera Service 🔧 | Garansi Kerjaan 1 Tahun', 'workshop_owner', 'email'),
('10000000-0000-0000-0000-000000000019', 'oscar@overland.id', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Oscar Farhan', 'overland_id', '081234567819', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=300', 'Campervan & Overland Adventure ⛺ | Pajero Dakar 4x4 Offroad', 'user', 'email'),
('10000000-0000-0000-0000-000000000020', 'pandi@supercar.com', '$2a$10$e8w3.U1sH0640.zJj5K56.Qp.Yw1vQjLq4uM9hN5yR6sT7uV8wW9x', 'Pandi Yosua', 'supercar_club', '081234567820', 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?auto=format&fit=crop&q=80&w=300', 'Sports Car Enthusiast 🏁 | Porsche & BMW M Power Enthusiast', 'user', 'email')
ON CONFLICT (email) DO NOTHING;

-- 2. Make @speedmaster (User 1) the TOP CREATOR HERO with 18 Subscribers!
INSERT INTO user_subscriptions (subscriber_id, target_user_id)
VALUES 
('10000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000001'),
('10000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001'),

-- Also current user demo (@dnazrl) subscribe to @speedmaster and @ev_innovator!
('f75361c6-ff4f-4c0e-bd80-9ba064deb27f', '10000000-0000-0000-0000-000000000001'),
('f75361c6-ff4f-4c0e-bd80-9ba064deb27f', '10000000-0000-0000-0000-000000000002')
ON CONFLICT (subscriber_id, target_user_id) DO NOTHING;

-- 3. Insert Viral Active Threads across all requested categories
INSERT INTO threads (id, user_id, content, photo_urls, category, likes_count, comments_count, bookmarks_count, created_at)
VALUES
(
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  '💡 Hasil Upgrade Projector Bi-LED 3 Inci 55W di Honda Civic Turbo! Cahaya memotong rapi (sharp cut-off line) tanpa menyilaukan pengendara dari arah berlawanan. Jarak jangkauan cahaya malam hari hingga 150 meter. Gimana kawan-kawan, lebih pilih 6000K (Warm White) atau 4300K (Pure Yellow) buat hujan?',
  '["https://images.unsplash.com/photo-1603584173870-7f23fdae1b7a?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'biled',
  42, 12, 18,
  NOW() - INTERVAL '1 hour'
),
(
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '⚡ Pengalaman 6 Bulan Pakai Mobil Listrik Ioniq 5 buat Road Trip Jakarta - Surabaya! Biaya ngecas di SPKLU Fast Charging total cuma habis Rp 210.000 (jauh lebih hemat dibanding bensin yang tembus Rp 950.000). Konsumsi daya rata-rata 6.8 km/kWh. Ada yang mau tanya seputar manajemen baterai pas macet tol?',
  '["https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'ev',
  89, 24, 35,
  NOW() - INTERVAL '3 hours'
),
(
  '20000000-0000-0000-0000-000000000003',
  '10000000-0000-0000-0000-000000000005',
  '🛞 Pilihan Ban Semi-Slick vs Ultra High Performance (UHP) buat Harian & Weekend Trackday. Rekomendasi saya: Michelin Pilot Sport 5 atau Continental MC6 buat wet grip terbaik di musim hujan Indonesia. Tekanan angin ideal saat dingin: 32 PSI depan, 30 PSI belakang.',
  '["https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'ban',
  56, 15, 22,
  NOW() - INTERVAL '5 hours'
),
(
  '20000000-0000-0000-0000-000000000004',
  '10000000-0000-0000-0000-000000000004',
  '🔊 Upgrade Sound Quality (SQ) 3-Way System + Processor DSP 8 Channel di Fortuner VRZ. Bass terdengar deep, vokal berasa ada di atas dashboard (soundstage fokus). Pemasangan peredam 3 lapis di 4 pintu bikin kabin serasa kedap mobil Eropa!',
  '["https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'audio',
  64, 18, 29,
  NOW() - INTERVAL '8 hours'
),
(
  '20000000-0000-0000-0000-000000000005',
  '10000000-0000-0000-0000-000000000001',
  '🏆 PERBANDINGAN DYNO TUNING: Stage 1 Remap ECU ECU vs Piggyback Module! Naik 35 HP dan torsi nambah 75 Nm di RPM rendah. Respon gas jadi padat tanpa jeda (no lag). Ada yang tertarik bahasan perbandingan konsumsi BBM setelah remap?',
  '["https://images.unsplash.com/photo-1552519507-da3b142c6e3d?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'modifikasi',
  128, 45, 62,
  NOW() - INTERVAL '12 hours'
),
(
  '20000000-0000-0000-0000-000000000006',
  '10000000-0000-0000-0000-000000000006',
  '🎀 Rahasia Merawat Coating Ceramic 9H Biar Efek Hydrophobic (Daun Talas) Tahan Hingga 3 Tahun! Jangan pernah cuci pakai sabun cuci piring karena kandungan asamnya merusak lapisan nano ceramic coating.',
  '["https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=800"]'::jsonb,
  'aksesoris',
  37, 9, 14,
  NOW() - INTERVAL '1 day'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Insert Popular Comments & Nested Replies
INSERT INTO thread_comments (id, thread_id, user_id, parent_id, content, likes_count, created_at)
VALUES
(
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  NULL,
  'Mantap om @biled_king! Saya juga pakai Bi-LED 55W 5700K di mobil harian, tembus hujan lebat di jalan tol Cipali aman banget!',
  12,
  NOW() - INTERVAL '50 minutes'
),
(
  '30000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000003',
  '30000000-0000-0000-0000-000000000001',
  'Siap om @speedmaster! 5700K emang dapet imbangnya antara estetik sama fungsional hujan!',
  8,
  NOW() - INTERVAL '40 minutes'
),
(
  '30000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000015',
  NULL,
  'Hemat banget om @ev_innovator! Di SPKLU KM 207 macet sempet antre gak charger-nya?',
  15,
  NOW() - INTERVAL '2 hours'
),
(
  '30000000-0000-0000-0000-000000000004',
  '20000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '30000000-0000-0000-0000-000000000003',
  'Aman om @electric_wheels! Pake aplikasi PLN Mobile udah bisa booking slot reservasi SPKLU dari 1 jam sebelumnya!',
  19,
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;

-- 5. Insert Activity Notifications into notifications table
INSERT INTO notifications (recipient_id, actor_id, thread_id, comment_id, type, created_at)
VALUES
(
  'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
  '10000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000005',
  NULL,
  'like_thread',
  NOW() - INTERVAL '15 minutes'
),
(
  'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
  '10000000-0000-0000-0000-000000000003',
  '20000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'comment_thread',
  NOW() - INTERVAL '30 minutes'
),
(
  'f75361c6-ff4f-4c0e-bd80-9ba064deb27f',
  '10000000-0000-0000-0000-000000000002',
  '20000000-0000-0000-0000-000000000002',
  NULL,
  'like_thread',
  NOW() - INTERVAL '1 hour'
)
ON CONFLICT (id) DO NOTHING;
