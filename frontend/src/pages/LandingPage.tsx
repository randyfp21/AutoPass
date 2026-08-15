import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, ChevronRight, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none flex flex-col antialiased">
      {/* ── 1. Minimalist Header Navigation ── */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <span
              className="text-xl font-bold tracking-tight text-slate-900"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Odom<span className="text-blue-600">tr</span>
              <span className="text-blue-600">.</span>
            </span>
          </Link>

          {/* Clean Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-slate-900 transition-colors">
              Fitur
            </a>
            <a href="#threads" className="hover:text-slate-900 transition-colors">
              Odo Threads
            </a>
            <a href="#telemetry" className="hover:text-slate-900 transition-colors">
              Telemetri
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2 px-3 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer"
                >
                  Mulai Gratis
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Minimalist Hero Section ── */}
      <section className="pt-16 pb-20 lg:pt-24 lg:pb-28 bg-white border-b border-slate-200/80">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Tagline Badge */}
            <span className="inline-block text-[11px] font-bold tracking-widest text-slate-500 uppercase bg-slate-100 px-3.5 py-1 rounded-full border border-slate-200/60">
              Digital Vehicle Passport & Community
            </span>

            {/* Title */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.15]">
              Passport Digital & Media Sosial Otomotif Indonesia
            </h1>

            {/* Subtitle */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal max-w-2xl mx-auto">
              Kelola catatan servis kendaraan, cetak story telemetri visual, dan terhubung dengan komunitas pemilik kendaraan se-Indonesia dalam satu platform terpadu.
            </p>

            {/* Action buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                className="py-3 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>Mulai Gratis</span>
                <ArrowRight size={14} />
              </button>

              <button
                onClick={() => navigate('/threads')}
                className="py-3 px-6 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              >
                <span>Jelajahi Odo Threads</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          {/* Clean Mockup Viewport */}
          <div className="mt-14 max-w-4xl mx-auto">
            <div className="bg-slate-950 rounded-2xl p-4 sm:p-6 border border-slate-800 shadow-2xl">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-white text-left">
                {/* Panel 1 */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
                    Buku Servis Digital
                  </span>
                  <h4 className="font-extrabold text-sm text-white">Honda Vario 160</h4>
                  <p className="text-xs text-slate-400">Total Servis: Rp 185.000</p>
                  <p className="text-[11px] text-emerald-400 font-mono pt-2 border-t border-slate-800">
                    ✓ Catatan Terverifikasi
                  </p>
                </div>

                {/* Panel 2 */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-blue-400 uppercase tracking-wider block">
                    Telemetri Story
                  </span>
                  <p className="text-xs text-slate-300 font-medium">Wah Perjalanan Vario160 sudah</p>
                  <p className="text-xl font-black font-tech text-white">12.500 KM</p>
                  <p className="text-[10px] text-slate-400 pt-2 border-t border-slate-800">
                    Odo Studio 1080p HD
                  </p>
                </div>

                {/* Panel 3 */}
                <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-purple-400 uppercase tracking-wider block">
                    Odo Threads
                  </span>
                  <p className="text-xs font-bold text-slate-200">@speedmaster</p>
                  <p className="text-xs text-slate-400 line-clamp-2">
                    "Servis rutin 45.000 KM beres! Mesin kembali responsif..."
                  </p>
                  <p className="text-[11px] text-slate-400 pt-2 border-t border-slate-800">
                    ❤️ 24 · 💬 8 Komentar
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Minimalist Metrics Bar ── */}
      <section className="py-8 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-black font-tech text-white">100.000+</p>
            <p className="text-xs text-slate-400 font-medium">Kendaraan Terdaftar</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-black font-tech text-white">500.000+</p>
            <p className="text-xs text-slate-400 font-medium">Catatan Servis Terekam</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-black font-tech text-white">1.200+</p>
            <p className="text-xs text-slate-400 font-medium">Bengkel Partner</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-2xl sm:text-3xl font-black font-tech text-white">4.9 / 5.0</p>
            <p className="text-xs text-slate-400 font-medium">Rating Komunitas</p>
          </div>
        </div>
      </section>

      {/* ── 4. Odo Threads Highlight Section (Minimalist Dark) ── */}
      <section id="threads" className="py-16 sm:py-24 bg-slate-950 text-white border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-bold font-mono tracking-widest text-purple-400 uppercase">
              Komunitas Otomotif
            </span>
            <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
              Odo Threads: Media Sosial Otomotif Indonesia
            </h2>
            <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
              Wadah interaksi publik tempat pemilik kendaraan saling berbagi pengalaman perawatan, diskusi trouble mesin, tips modifikasi, hingga agenda touring.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2.5">
              <h3 className="font-extrabold text-white text-base">Diskusi & Tanya Jawab</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tanyakan solusi masalah kendaraan atau dapatkan rekomendasi sparepart & oli dari sesama pemilik kendaraan.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2.5">
              <h3 className="font-extrabold text-white text-base">Integrasi Telemetri Story</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Hasil cetak story telemetri kendaraan dari studio dapat langsung diunggah ke Odo Threads dalam satu langkah.
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-2.5">
              <h3 className="font-extrabold text-white text-base">Profil Garasi Publik</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Tampilkan seluruh koleksi kendaraan dan total kilometer perjalananmu di halaman profil `@username`.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Essential Features Grid ── */}
      <section id="fitur" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="max-w-2xl space-y-3">
            <span className="text-[11px] font-bold font-mono tracking-widest text-slate-500 uppercase">
              Fitur Utama
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Manajemen Kendaraan Serba Ada
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Seluruh perlengkapan untuk menjaga performa kendaraan dan nilai jualnya tetap optimal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">1. Buku Servis Digital</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pencatatan riwayat pergantian oli, sparepart, dan biaya servis secara rapi dengan bukti fisik nota.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">2. Odo Telemetry Studio</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pembuat story telemetri visual resolusi tinggi (9:16, 1:1) yang ramah batas potongan Instagram Story.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">3. Service Planner</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengingat jadwal perawatan berkala berdasarkan target kilometer odometer atau tanggal mendatang.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">4. Analitik Pengeluaran</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Grafik rekapitulasi total biaya perawatan bulanan dan tahunan secara transparan.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">5. Aplikasi PWA</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Dapat dipasang di perangkat HP Android/iOS maupun Laptop Desktop tanpa melalui App Store.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200/80 p-6 rounded-2xl space-y-2">
              <h3 className="font-extrabold text-slate-900 text-base">6. Privasi Plat Nomor</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fitur penyembunyian karakter plat nomor secara otomatis untuk perlindungan privasi di media sosial.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Minimalist CTA Section ── */}
      <section className="py-16 sm:py-20 bg-slate-900 text-white text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-6">
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            Mulai Kelola Kendaraanmu Hari Ini
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed">
            Daftar gratis dalam 1 menit dan buat Passport Digital kendaraan pertamamu.
          </p>

          <div className="pt-2">
            <button
              onClick={() => navigate('/register')}
              className="py-3 px-8 bg-white hover:bg-slate-100 text-slate-900 rounded-full text-xs font-bold transition-all cursor-pointer"
            >
              Daftar Sekarang — Gratis
            </button>
          </div>
        </div>
      </section>

      {/* ── 7. Minimalist Footer ── */}
      <footer className="bg-slate-950 text-slate-500 text-xs py-8 border-t border-slate-900">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-bold text-white font-tech tracking-wide text-sm">
            Odomtr.
          </span>
          <p>© 2026 Odomtr Inc. Bahasa Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
