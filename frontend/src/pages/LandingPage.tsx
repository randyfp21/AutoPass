import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Gauge,
  Sparkles,
  ShieldCheck,
  Zap,
  Users,
  Calendar,
  PieChart,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Maximize2,
  ChevronRight,
  Car,
  Check,
  Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans select-none flex flex-col">
      {/* ── 1. Header Navigation ── */}
      <header className="sticky top-0 z-40 w-full bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
              <Gauge size={20} className="text-white" />
            </div>
            <span
              className="text-xl font-bold tracking-tight text-slate-900"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Odom<span className="text-blue-600">tr</span>
            </span>
          </Link>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-bold text-slate-600">
            <a href="#fitur" className="hover:text-blue-600 transition-colors">
              Fitur Utama
            </a>
            <a href="#telemetry" className="hover:text-blue-600 transition-colors">
              Odo Telemetry
            </a>
            <a href="#threads" className="hover:text-blue-600 transition-colors">
              Odo Threads
            </a>
            <a href="#pwa" className="hover:text-blue-600 transition-colors">
              Aplikasi PWA
            </a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link
                to="/dashboard"
                className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <span>Buka Dashboard</span>
                <ArrowRight size={14} />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="py-2 px-3.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors"
                >
                  Masuk
                </Link>
                <Link
                  to="/register"
                  className="py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-black shadow-md transition-all flex items-center gap-1 cursor-pointer"
                >
                  <span>Mulai Gratis</span>
                  <ArrowRight size={14} />
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── 2. Hero Section ── */}
      <section className="relative pt-12 pb-20 lg:pt-20 lg:pb-28 overflow-hidden bg-gradient-to-b from-white via-slate-50 to-slate-100 border-b border-slate-200/80">
        {/* Ambient background decoration */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 right-10 w-72 h-72 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            {/* Top Pill Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/90 px-4 py-1.5 rounded-full text-xs font-extrabold text-blue-700 shadow-2xs">
              <Sparkles size={14} className="text-amber-500" />
              <span>🇮🇩 Passport Digital & Komunitas Otomotif Pertama di Indonesia</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-tight">
              Solusi Cerdas Merawat & Membagikan Story{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Kendaraan Kesayanganmu
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-slate-600 text-base sm:text-lg leading-relaxed font-normal max-w-2xl mx-auto">
              Kelola riwayat servis kendaraan, pantaunya odometer, cetak story telemetri visual resolusi tinggi, serta terhubung dalam komunitas otomotif se-Indonesia dalam satu platform.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
              <button
                onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                className="py-3.5 px-7 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-sm font-black shadow-lg shadow-blue-500/25 transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
              >
                <span>🚀 Mulai Sekarang — Gratis</span>
                <ArrowRight size={16} />
              </button>

              <button
                onClick={() => navigate('/threads')}
                className="py-3.5 px-6 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200/90 rounded-full text-sm font-extrabold shadow-2xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Users size={16} className="text-purple-600" />
                <span>💬 Jelajahi Odo Threads</span>
              </button>
            </div>

            {/* Micro Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-xs text-slate-500 font-semibold">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-500" /> 100% Gratis Tanpa Biaya
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-500" /> Tanpa Perlu Install App Store
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={15} className="text-emerald-500" /> Terhubung Komunitas Se-Indonesia
              </span>
            </div>
          </div>

          {/* Interactive Hero Showcase Viewport Frame */}
          <div className="mt-12 sm:mt-16 max-w-5xl mx-auto">
            <div className="relative bg-slate-950 rounded-3xl p-3 sm:p-6 border border-slate-800 shadow-2xl overflow-hidden group">
              {/* Top Fake Window Controls */}
              <div className="flex items-center justify-between pb-4 px-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="ml-2 text-xs font-mono font-bold text-slate-400">
                    odomtr.com / vehicle-passport-preview
                  </span>
                </div>
                <span className="text-[10px] font-mono font-extrabold text-blue-400 bg-blue-950 px-2.5 py-0.5 rounded-full border border-blue-800">
                  LIVE DEMO
                </span>
              </div>

              {/* Showcase Content Card Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-white">
                {/* Showcase 1: Vehicle Digital Passport */}
                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
                      Buku Servis Digital
                    </span>
                    <span className="text-xs font-mono font-bold text-yellow-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                      B 1234 CD
                    </span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">Honda Vario 160 - 2023</h4>
                    <p className="text-xs text-slate-400 font-medium">Servis Rutin Bengkel Resmi Partner</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400">Total Biaya:</span>
                    <span className="text-sm font-black text-purple-400 font-mono">Rp 185.000</span>
                  </div>
                </div>

                {/* Showcase 2: Live Telemetry Generator */}
                <div className="bg-gradient-to-br from-purple-900/60 to-indigo-950/80 p-5 rounded-2xl border border-purple-700/60 space-y-3 relative overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold text-purple-200 bg-purple-900/80 px-2 py-0.5 rounded">
                      ✨ Telemetry Story Studio
                    </span>
                    <Sparkles size={14} className="text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[11px] text-purple-200 font-medium">Wah Perjalanan Vario160 sudah</p>
                    <p className="text-2xl font-black font-tech text-white">12.500 KM</p>
                    <p className="text-[10px] italic text-purple-300">Waktunya service rutin !</p>
                  </div>
                  <div className="pt-2 border-t border-purple-800/80 flex items-center justify-between text-[11px] text-purple-200">
                    <span>IG Safe Zone Ready</span>
                    <span className="font-mono font-bold">Odomtr.</span>
                  </div>
                </div>

                {/* Showcase 3: Odo Threads Social */}
                <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded">
                      💬 Odo Threads Community
                    </span>
                    <span className="text-[10px] text-slate-400">Baru saja</span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-purple-300">@speedmaster</p>
                    <p className="text-xs text-slate-300 line-clamp-2">
                      "Baru aja beres ganti oli & tune up Vario 160 di bengkel langganan! Hasil telemetri story-nya keren banget..."
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800 flex items-center gap-3 text-xs text-slate-400">
                    <span>❤️ 24 Suka</span>
                    <span>💬 8 Komentar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Stats Counter Row ── */}
      <section className="py-10 bg-slate-900 text-white border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black font-tech text-blue-400">100.000+</p>
            <p className="text-xs text-slate-400 font-semibold">Kendaraan Terdaftar</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black font-tech text-purple-400">500.000+</p>
            <p className="text-xs text-slate-400 font-semibold">Catatan Servis Terekam</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black font-tech text-amber-400">1.200+</p>
            <p className="text-xs text-slate-400 font-semibold">Bengkel Partner Resmi</p>
          </div>
          <div className="space-y-1 flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 text-amber-400">
              <Star size={18} fill="currentColor" />
              <p className="text-2xl sm:text-3xl font-black font-tech text-white">4.9 / 5.0</p>
            </div>
            <p className="text-xs text-slate-400 font-semibold">Rating Komunitas Otomotif</p>
          </div>
        </div>
      </section>

      {/* ── 4. Main Feature Highlights Section ── */}
      <section id="fitur" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 uppercase tracking-wider">
              Fitur Unggulan Odomtr
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Semua Fitur yang Dibutuhkan Pecinta Otomotif
            </h2>
            <p className="text-slate-500 text-sm sm:text-base leading-relaxed">
              Platform serba ada untuk mengelola catatan servis, estetika story telemetri, dan jejaring sosial komunitas otomotif.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-blue-300 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <ShieldCheck size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">1. Buku Servis Digital</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Catat riwayat ganti oli, penggantian sparepart, dan tune-up secara rapi. Terintegrasi dengan bukti foto struk fisik & bengkel partner resmi.
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-purple-300 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Zap size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">2. Odo Telemetry Studio</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Cetak story telemetri visual resolusi tinggi (9:16, 1:1, 4:5) dengan filter warna cinematic & zona aman Instagram story yang unik!
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-indigo-300 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Users size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">3. Odo Threads Community</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Jejaring sosial khusus otomotif. Berbagi masalah kendala, tips perawatan, rekomendasi biled & oli, hingga ajakan sunmori.
                </p>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-emerald-300 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Calendar size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">4. Service Planner</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Jadwalkan pengingat servis mendatang berdasarkan kilometer odometer target atau batas tanggal agar kendaraan selalu dalam kondisi prima.
                </p>
              </div>
            </div>

            {/* Feature 5 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-amber-300 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <PieChart size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">5. Analitik Biaya Servis</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Pantau total pengeluaran servis mingguan, bulanan, hingga tahunan untuk menjaga transparansi dan efisiensi pengeluaran otomotifmu.
                </p>
              </div>
            </div>

            {/* Feature 6 */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 space-y-4 hover:border-cyan-300 transition-all hover:shadow-md group">
              <div className="w-12 h-12 rounded-2xl bg-cyan-100 text-cyan-600 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
                <Smartphone size={24} />
              </div>
              <div className="space-y-1.5">
                <h3 className="font-extrabold text-slate-900 text-lg">6. PWA Desktop & Mobile App</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  Dapat dipasang di HP Android, iOS, maupun laptop PC/Mac secara cepat tanpa perlu mendownload dari App Store.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Telemetry & Threads Deep Dive Showcase Section ── */}
      <section id="telemetry" className="py-16 sm:py-24 bg-slate-950 text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Description */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 bg-purple-950 text-purple-300 border border-purple-800 px-3.5 py-1 rounded-full text-xs font-extrabold">
                <Sparkles size={14} className="text-amber-400" />
                <span>Odo Telemetry Studio</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black tracking-tight leading-tight">
                Ubah Catatan Servis Menjadi{' '}
                <span className="bg-gradient-to-r from-purple-400 to-indigo-300 bg-clip-text text-transparent">
                  Story Telemetri Unik
                </span>
              </h2>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
                Setiap kali kamu menyelesaikan perawatan kendaraan, sistem kami secara otomatis memformat data kilometer odometer, bengkel, item servis, dan biaya ke dalam susunan tipografi eksklusif dengan aman dari potongan Instagram Story.
              </p>

              <div className="space-y-3 pt-2">
                {[
                  'Mendukung Kolase Vertikal Hingga 3 Foto Kamera/Galeri',
                  '5 Preset Tipografi Unik (Athletic HUD, Cyberpunk, Luxury Gold, Motorsport)',
                  'Matriks Filter Warna (Cinematic, Monochrome, Vintage, HDR)',
                  'Direct Posting Instan ke Odo Threads',
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-200 font-semibold">
                    <CheckCircle2 size={16} className="text-purple-400 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4">
                <button
                  onClick={() => navigate(isAuthenticated ? '/dashboard' : '/register')}
                  className="py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-black shadow-lg cursor-pointer transition-transform active:scale-95 flex items-center gap-2"
                >
                  <span>Coba Studio Telemetri Sekarang</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Right Mock Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
              <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 space-y-4">
                <div className="flex items-center justify-between text-xs border-b border-slate-800 pb-3">
                  <span className="font-mono font-bold text-slate-400">STORY PREVIEW (9:16)</span>
                  <span className="font-mono font-bold text-purple-400">1080p HD</span>
                </div>
                <div className="p-6 bg-gradient-to-b from-slate-900 to-slate-950 rounded-xl border border-slate-800 space-y-6">
                  <div>
                    <p className="text-xs text-slate-300">Wah Perjalanan Vario160 sudah</p>
                    <p className="text-4xl font-black font-tech text-white">45.000 KM</p>
                    <p className="text-xs italic text-orange-400 font-semibold">Waktunya service rutin !</p>
                  </div>

                  <div className="space-y-1 text-xs pt-4 border-t border-slate-800">
                    <p className="font-bold text-white text-sm">Honda Vario 160 - 2023</p>
                    <p className="text-slate-300">📍 Bengkel Resmi Partner</p>
                    <p className="font-bold text-white">Vario160 Jajan</p>
                    <p className="text-xl font-black font-tech text-orange-400">Rp 245.000</p>
                    <p className="text-[11px] text-slate-400 pt-1">✓ Ganti Oli Mesin · ✓ Filter Oli · ✓ Service CVT</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 6. Final Call to Action Section ── */}
      <section className="py-16 sm:py-24 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 space-y-6">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
            Siap Merawat Kendaraan Kesayanganmu Lebih Elegan & Transparan?
          </h2>
          <p className="text-blue-100 text-sm sm:text-base max-w-xl mx-auto font-normal leading-relaxed">
            Bergabunglah sekarang secara gratis dan buat Passport Digital kendaraan pertamamu dalam kurang dari 2 menit.
          </p>

          <div className="pt-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="py-4 px-8 bg-white hover:bg-slate-100 text-blue-900 rounded-full text-sm font-black shadow-xl transition-transform active:scale-95 cursor-pointer flex items-center gap-2"
            >
              <span>Daftar Sekarang — Gratis!</span>
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </section>

      {/* ── 7. Footer ── */}
      <footer className="bg-slate-950 text-slate-400 text-xs py-8 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-600 rounded-lg flex items-center justify-center">
              <Gauge size={14} className="text-white" />
            </div>
            <span className="font-bold text-white font-tech tracking-wide text-sm">
              Odomtr.
            </span>
            <span className="text-slate-600">|</span>
            <span>Digital Vehicle Passport & Community Platform</span>
          </div>

          <p>© 2026 Odomtr Inc. Bahasa Indonesia.</p>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
