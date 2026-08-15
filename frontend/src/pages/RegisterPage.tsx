import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gauge, Car, Store, AlertCircle, Mail, Lock, User } from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { register } from '../services/authService';
import type { UserRole } from '../types';

// ─── Role Cards ───────────────────────────────────────────────────────────────

const roleOptions: {
  value: UserRole;
  label: string;
  description: string;
  icon: React.ReactNode;
}[] = [
  {
    value: 'user',
    label: 'Pemilik Kendaraan',
    description: 'Catat riwayat servis kendaraan pribadi Anda',
    icon: <Car size={28} />,
  },
  {
    value: 'workshop_owner',
    label: 'Pemilik Bengkel',
    description: 'Kelola layanan dan catat servis pelanggan Anda',
    icon: <Store size={28} />,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────

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
        role,
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
    <div className="min-h-screen flex">
      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-automotive-hero flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center border border-white/20">
            <Gauge size={24} className="text-white" />
          </div>
          <span
            className="text-2xl font-bold text-white"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Odomtr
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            Bergabung
            <br />
            <span className="text-blue-300">Gratis Sekarang</span>
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed mb-8">
            Mulai rekam riwayat servis kendaraan Anda
            dan jaga nilai jual kendaraan tetap tinggi.
          </p>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Kendaraan Terdaftar', value: '12K+' },
              { label: 'Catatan Servis', value: '87K+' },
              { label: 'Bengkel Partner', value: '500+' },
              { label: 'Kota di Indonesia', value: '34' },
            ].map((stat, i) => (
              <div key={i} className="bg-white/10 rounded-xl p-4 border border-white/10">
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-slate-400 text-xs mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-slate-500 text-xs">
          © 2026 Odomtr. Digital Vehicle Passport.
        </p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-white overflow-y-auto">
        <div className="w-full max-w-lg py-4">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Gauge size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-900" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
              Odomtr
            </span>
          </div>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">Buat Akun Baru</h2>
            <p className="text-slate-500 mt-2">
              Sudah punya akun?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-800">
                Masuk di sini
              </Link>
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ── Role Selector ── */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Daftar sebagai
              </label>
              <div className="grid grid-cols-2 gap-3">
                {roleOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRole(opt.value)}
                    className={[
                      'flex flex-col items-center text-center gap-2 p-4 rounded-xl border-2 transition-all',
                      role === opt.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className={role === opt.value ? 'text-blue-600' : 'text-slate-400'}>
                      {opt.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-sm">{opt.label}</p>
                      <p className="text-xs opacity-70 mt-0.5 leading-tight">{opt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Nama Lengkap
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  className={`input-field pl-10 ${fieldErrors.full_name ? 'error' : ''}`}
                  placeholder="Nama lengkap Anda"
                  value={fullName}
                  autoComplete="name"
                  onChange={(e) => { setFullName(e.target.value); clearFieldError('full_name'); }}
                />
              </div>
              {fieldErrors.full_name && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.full_name}
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  className={`input-field pl-10 ${fieldErrors.email ? 'error' : ''}`}
                  placeholder="nama@email.com"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                />
              </div>
              {fieldErrors.email && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.email}
                </p>
              )}
            </div>

            {/* Password + Confirm */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className={`input-field pl-10 pr-9 ${fieldErrors.password ? 'error' : ''}`}
                    placeholder="Min. 8 karakter"
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="mt-1 text-xs text-red-600 flex items-start gap-1">
                    <AlertCircle size={12} className="shrink-0 mt-0.5" /> {fieldErrors.password}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  Konfirmasi
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    className={`input-field pl-10 pr-9 ${fieldErrors.confirm_password ? 'error' : ''}`}
                    placeholder="Ulangi password"
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirm_password'); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.confirm_password && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.confirm_password}
                  </p>
                )}
              </div>
            </div>

            {/* Password strength hint */}
            {password && (
              <div className="flex gap-1.5">
                {[
                  password.length >= 8,
                  /[A-Z]/.test(password),
                  /[0-9]/.test(password),
                  /[^A-Za-z0-9]/.test(password),
                ].map((passed, i) => (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full transition-colors ${passed ? 'bg-green-400' : 'bg-slate-200'}`}
                  />
                ))}
              </div>
            )}

            {/* Terms checkbox */}
            <div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  checked={agreedToTerms}
                  onChange={(e) => { setAgreedToTerms(e.target.checked); clearFieldError('terms'); }}
                />
                <span className="text-sm text-slate-600">
                  Saya menyetujui{' '}
                  <Link to="/terms" className="text-blue-600 font-medium hover:text-blue-800">
                    Syarat & Ketentuan
                  </Link>{' '}
                  dan{' '}
                  <Link to="/privacy" className="text-blue-600 font-medium hover:text-blue-800">
                    Kebijakan Privasi
                  </Link>{' '}
                  Odomtr
                </span>
              </label>
              {fieldErrors.terms && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1 ml-7">
                  <AlertCircle size={12} /> {fieldErrors.terms}
                </p>
              )}
            </div>

            {/* Submit */}
            <Button type="submit" fullWidth size="lg" isLoading={isLoading}>
              Buat Akun Sekarang
            </Button>

            {/* Divider + Google */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">atau</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              onClick={() => alert('Google OAuth: Coming soon!')}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Daftar dengan Google
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
