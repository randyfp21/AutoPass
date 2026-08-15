import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Gauge,
  Car,
  Store,
  AlertCircle,
  Mail,
  Lock,
  User,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  CheckCircle2,
  Construction,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { Modal } from '../components/common/Modal';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/authService';
import type { UserRole } from '../types';

export function RegisterPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();

  const [role, setRole] = useState<UserRole>('user');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Coming Soon Modal for Workshop Owner
  const [showWorkshopModal, setShowWorkshopModal] = useState(false);

  // Dynamic Hero Carousel Slides (5.5s auto rotation)
  const [heroSlide, setHeroSlide] = useState(0);

  const heroSlides = [
    {
      badge: '✨ Passport Digital Kendaraan',
      titleLine1: 'Bergabung Gratis',
      titleLine2: 'Sekarang Juga',
      gradientClass: 'from-blue-400 via-indigo-300 to-purple-300',
      desc: 'Mulai rekam riwayat servis kendaraan Anda dan jaga nilai jual kendaraan tetap tinggi.',
    },
    {
      badge: '🔥 Odo Threads Automotive Network',
      titleLine1: 'Komunitas Otomotif',
      titleLine2: 'Se-Indonesia 🇮🇩',
      gradientClass: 'from-purple-400 via-pink-300 to-amber-300',
      desc: 'Terhubung langsung dengan ribuan pecinta mobil & motor se-Indonesia! Saling berbagi pengalaman servis, tips perawatan, modifikasi, hingga agenda touring.',
    },
    {
      badge: '🏎️ Odo Telemetry & Story Studio',
      titleLine1: 'Cetak Telemetri Story',
      titleLine2: 'Resolusi Tinggi HD',
      gradientClass: 'from-amber-400 via-orange-300 to-red-400',
      desc: 'Ubah catatan servis rutin kendaraanmu menjadi story telemetri visual unik dengan aspek rasio & filter khusus, siap diposting ke Odo Threads!',
    },
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5500);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const validate = () => {
    const errs: Record<string, string> = {};

    if (!fullName.trim() || fullName.trim().length < 2) {
      errs.full_name = 'Nama lengkap minimal 2 karakter';
    }

    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = 'Format email tidak valid';
    }

    if (!password || password.length < 8) {
      errs.password = 'Password minimal 8 karakter';
    } else if (!/[A-Z]/.test(password)) {
      errs.password = 'Password harus mengandung minimal 1 huruf kapital';
    } else if (!/[0-9]/.test(password)) {
      errs.password = 'Password harus mengandung minimal 1 angka';
    }

    if (password !== confirmPassword) {
      errs.confirm_password = 'Konfirmasi password tidak cocok';
    }

    if (!agreedToTerms) {
      errs.terms = 'Anda harus menyetujui syarat dan ketentuan';
    }

    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const { user } = await register({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        role: 'user', // Forced user role for now
      });
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
        'Pendaftaran gagal. Silakan coba lagi.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const clearFieldError = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((p) => { const n = { ...p }; delete n[field]; return n; });
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 text-slate-900 font-sans select-none">
      {/* ── Left Hero Panel (Glassmorphism & Automotive Aesthetic) ── */}
      <div className="hidden lg:flex lg:w-[48%] bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 flex-col justify-between p-12 relative overflow-hidden text-white border-r border-slate-800">
        {/* Abstract decorative ambient lighting */}
        <div className="absolute top-0 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 -right-16 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg border border-white/20">
              <Gauge size={22} className="text-white" />
            </div>
            <span
              className="text-2xl font-bold tracking-tight text-white"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Odom<span className="text-blue-400">tr</span>
            </span>
          </div>

          <span className="text-[11px] font-extrabold font-mono text-blue-300 bg-blue-950/80 px-3 py-1 rounded-full border border-blue-800/80 shadow-2xs">
            v2.0 Digital Passport
          </span>
        </div>

        {/* Center Hero Dynamic Rotating Showcase */}
        <div className="relative z-10 space-y-8 max-w-lg my-auto py-8 transition-all duration-500">
          <div className="space-y-3 min-h-[190px]">
            <div className="inline-flex items-center gap-1.5 bg-white/10 backdrop-blur-md border border-white/20 px-3.5 py-1 rounded-full text-xs font-bold text-blue-300 shadow-2xs">
              <Sparkles size={14} className="text-yellow-400" />
              <span>{heroSlides[heroSlide].badge}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              {heroSlides[heroSlide].titleLine1} <br />
              <span className={`bg-gradient-to-r ${heroSlides[heroSlide].gradientClass} bg-clip-text text-transparent`}>
                {heroSlides[heroSlide].titleLine2}
              </span>
            </h1>

            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal transition-all duration-300">
              {heroSlides[heroSlide].desc}
            </p>
          </div>

          {/* Slide Indicator Dots */}
          <div className="flex items-center gap-2">
            {heroSlides.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setHeroSlide(idx)}
                className={[
                  'h-2 rounded-full transition-all duration-300 cursor-pointer',
                  idx === heroSlide ? 'w-8 bg-blue-400 shadow-md' : 'w-2 bg-white/30 hover:bg-white/60',
                ].join(' ')}
                aria-label={`Slide ${idx + 1}`}
              />
            ))}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3.5 pt-2">
            {[
              { label: 'Kendaraan Terdaftar', value: '100.000+' },
              { label: 'Catatan Servis', value: '500.000+' },
              { label: 'Bengkel Partner', value: '1.200+' },
              { label: 'Rating Komunitas', value: '4.9 / 5.0' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-3.5 border border-white/10">
                <p className="text-xl font-extrabold text-white font-tech">{stat.value}</p>
                <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          <span>© 2026 Odomtr Inc. All rights reserved.</span>
          <span className="flex items-center gap-1 text-slate-300 font-semibold">
            <CheckCircle2 size={14} className="text-emerald-400" /> Free Forever Account
          </span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 bg-white overflow-y-auto">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-2 mb-4">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
            <Gauge size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
            Odomtr
          </span>
        </div>

        <div className="w-full max-w-lg mx-auto my-auto py-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">Buat Akun Baru</h2>
            <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 font-extrabold hover:text-blue-800 transition-colors inline-flex items-center gap-0.5">
                <span>Masuk di sini</span>
                <ArrowRight size={13} />
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* ── Role Selector Options (Pemilik Bengkel Greyed Out with Pop-up trigger) ── */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-2">
                Daftar Sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                {/* Option 1: Pemilik Kendaraan (Active) */}
                <button
                  type="button"
                  onClick={() => setRole('user')}
                  className={[
                    'flex flex-col items-center text-center gap-2 p-4 rounded-2xl border-2 transition-all cursor-pointer select-none',
                    role === 'user'
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Car size={22} />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-900">Pemilik Kendaraan</p>
                    <p className="text-[10px] text-slate-500 font-medium mt-0.5 leading-tight">
                      Catat riwayat servis & buat telemetri story
                    </p>
                  </div>
                </button>

                {/* Option 2: Pemilik Bengkel (Greyed Out + Coming Soon Trigger) */}
                <button
                  type="button"
                  onClick={() => setShowWorkshopModal(true)}
                  className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl border-2 border-slate-200 bg-slate-100/70 opacity-60 hover:opacity-100 transition-all cursor-pointer select-none relative overflow-hidden group"
                  title="Klik untuk info pendaftaran bengkel"
                >
                  {/* Badge Coming Soon Overlay */}
                  <span className="absolute top-2 right-2 text-[8px] font-black text-amber-800 bg-amber-200 px-1.5 py-0.5 rounded border border-amber-300 uppercase">
                    On Dev
                  </span>

                  <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Store size={22} />
                  </div>
                  <div>
                    <p className="font-extrabold text-xs text-slate-500 group-hover:text-slate-900">Pemilik Bengkel</p>
                    <p className="text-[10px] text-slate-400 font-medium mt-0.5 leading-tight">
                      🚧 Fitur Pendaftaran Bengkel (On Dev)
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className={`input-field pl-10 text-sm ${fieldErrors.full_name ? 'error' : ''}`}
                  placeholder="Nama lengkap Anda"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => { setFullName(e.target.value); clearFieldError('full_name'); }}
                />
              </div>
              {fieldErrors.full_name && (
                <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.full_name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className={`input-field pl-10 text-sm ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="nama@email.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pl-10 pr-9 text-sm ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="Min. 8 karakter"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 font-bold flex items-start gap-1">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" /> {fieldErrors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  Konfirmasi Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`input-field pl-10 pr-9 text-sm ${fieldErrors.confirm_password ? 'error' : ''}`}
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirm_password'); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.confirm_password}
                  </p>
                )}
              </div>
            </div>

            {/* Password strength hint */}
            {password && (
              <div className="flex gap-1.5 pt-1">
                {[
                  password.length >= 8,
                  /[A-Z]/.test(password),
                  /[0-9]/.test(password),
                  /[^A-Za-z0-9]/.test(password),
                ].map((passed, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${passed ? 'bg-emerald-500' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            )}

            {/* Terms checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  checked={agreedToTerms}
                  onChange={(e) => { setAgreedToTerms(e.target.checked); clearFieldError('terms'); }}
                />
                <span className="text-xs text-slate-600 font-medium leading-relaxed">
                  Saya menyetujui{' '}
                  <span className="text-blue-600 font-bold hover:underline">
                    Syarat & Ketentuan
                  </span>{' '}
                  dan{' '}
                  <span className="text-blue-600 font-bold hover:underline">
                    Kebijakan Privasi
                  </span>{' '}
                  Odomtr
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1 ml-7">
                  <AlertCircle size={12} /> {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button type="submit" fullWidth size="lg" isLoading={isLoading} className="py-3 text-sm font-black shadow-md rounded-2xl cursor-pointer">
              Buat Akun Sekarang 🚀
            </Button>

            {/* Divider + Google */}
            <div className="relative flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">atau</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-extrabold text-slate-700 bg-white hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
              onClick={() => alert('Google OAuth: Coming soon!')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              <span>Daftar dengan Google</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="w-full text-center text-xs text-slate-400 font-medium py-2">
          Odomtr Digital Vehicle Passport v2.0
        </div>
      </div>

      {/* 🚧 Workshop Owner Coming Soon Pop-up Modal */}
      {showWorkshopModal && (
        <Modal
          isOpen={showWorkshopModal}
          onClose={() => setShowWorkshopModal(false)}
          title="🚧 Fitur Pemilik Bengkel (On Development)"
          size="sm"
        >
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 bg-amber-100 text-amber-700 rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <Construction size={28} />
            </div>

            <div className="space-y-1.5">
              <h3 className="font-extrabold text-slate-900 text-base">Sedang Dalam Pengambangan</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Pendaftaran akun khusus <strong>Pemilik Bengkel / Workshop Partner</strong> saat ini sedang dalam tahap integrasi portal bengkel terverifikasi (On Development).
              </p>
              <p className="text-xs text-blue-600 font-bold pt-1">
                Silakan mendaftar sebagai <strong>Pemilik Kendaraan</strong> terlebih dahulu untuk menikmati fitur Odomtr!
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => setShowWorkshopModal(false)}
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition-transform active:scale-95"
              >
                Mengerti & Lanjutkan Pendaftaran
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default RegisterPage;
