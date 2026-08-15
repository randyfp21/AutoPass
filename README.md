# 🚗 AutoPass / Odomtr V2.0.0

> **Digital Maintenance Passport for Vehicles & Odo Threads Automotive Social Network**

AutoPass (Odomtr) adalah aplikasi manajemen paspor perawatan digital kendaraan (Mobil & Motor) yang terintegrasi dengan jaringan sosial media otomotif **Odo Threads**. Aplikasi ini memungkinkan pemilik kendaraan dan pemilik bengkel mencatat riwayat servis, memantau pengeluaran bulanan, mengunduh rekap PDF, menjadwalkan servis berkala, serta saling berbagi pengalaman otomotif.

---

## 🌟 Fitur Utama (Key Features)

### 🚗 1. Digital Maintenance Passport & Vehicle Garage
- **Garasi Kendaraan Digital**: Kelola seluruh kendaraan pribadi (Mobil & Motor) dalam satu tempat (CRUD).
- **Pengingat Masa Berlaku STNK & Pajak**: Notifikasi otomatis countdown jatuh tempo STNK & Pajak kendaraan (90 hari & H-30).
- **Update Odometer Instan**: Pembaruan kilometer (KM) kendaraan dengan kalkulasi penggunaan harian otomatis.

### 📅 2. Service Calendar & Planner
- **Jadwal Servis Berkala**: Buat rencana servis mendatang dengan patokan tanggal & target Odometer KM.
- **2-in-1 Selector Servis**: Pilihan pembuatan rencana jadwal servis atau pencatatan log servis instan.

### 📜 3. Struk Digital & Rekap Pengeluaran (Spent PDF)
- **Struk Servis Digital**: Simpan rincian sparepart, oli, dan biaya jasa secara transparan.
- **Export Laporan PDF**: Unduh rekap bulanan pengeluaran perawatan kendaraan dalam format dokumen PDF resmi.

### 📸 4. Share Activity & Story Telemetry Generator
- **Canvas Story Overlay Generator**: Buat poster estetik ala Strava untuk Instagram Story & WhatsApp Story berisikan telemetry data servis, odometer, dan foto kendaraan.

### 💬 5. Odo Threads Automotive Community
- **Sosial Media Otomotif**: Berbagi postingan, tips perawatan, dan cerita pengalaman seputar dunia otomotif.
- **Kategori Diskusi**: 
  - 💬 `Umum / Diskusi`
  - 🚨 `Kendala / Trouble`
  - ✨ `Sharing Pengalaman`
  - 💡 `Tips & Perawatan`
  - 🗺️ `Trip / Perjalanan`
  - 🏍️ `Touring / Sunmori`
  - 🛠️ `Modifikasi & Aksesori`
- **Profil Pengguna `@username`**: URL rute khusus pengguna (`/threads/user/@username`).
- **Interaksi Komunitas**: Like postingan, balasan komentar, bookmark thread tersimpan, dan notifikasi aktivitas.

---

## 🛠️ Teknologi & Stack (Tech Stack)

### **Frontend**
- **Core**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS (v4), Vanilla CSS Custom Design Tokens
- **Icons & Visuals**: Lucide Icons, HTML5 Canvas API
- **Utilities**: Axios, React Router v6, html2pdf.js

### **Backend**
- **Language & Framework**: Golang (Go 1.21), Gin Web Framework
- **Database**: PostgreSQL (`pgx/v5` driver pool), Redis (caching & JWT blacklist)
- **Security**: JWT Authentication, Bcrypt Password Hashing, RBAC (User & Workshop Owner)

---

## 🚀 Panduan Jalankan Lokal (Getting Started)

### 1. Prasyarat (Prerequisites)
- Node.js (v18+)
- Go (v1.21+)
- PostgreSQL Server
- Redis Server

### 2. Database Setup
Buat database PostgreSQL dengan nama `vehicle_tracker_db`:
```sql
CREATE DATABASE vehicle_tracker_db;
```
Jalankan file migrasi SQL dari folder `backend/migrations/`:
- `000001_init_schema.up.sql`
- `000002_create_service_planners.up.sql`
- `000003_add_vehicle_nickname.up.sql`
- `000004_add_receipt_photo_url.up.sql`

---

### 3. Jalankan Backend (Golang)
```bash
cd backend
go mod download
go run cmd/api/main.go
```
*Backend server akan berjalan di `http://localhost:8080`*

---

### 4. Jalankan Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
*Frontend web app akan berjalan di `http://localhost:5173`*

---

## 🔑 Akun Demo (Demo Credentials)

Untuk mencoba langsung aplikasi:
- **Email**: `demo@odomtr.com`
- **Password**: `password123`
- **Username**: `@dnazrl`

---

## 📌 Lisensi (License)
Dipertahankan & Dikembangkan oleh [randyfp21](https://github.com/randyfp21).
MIT License.
