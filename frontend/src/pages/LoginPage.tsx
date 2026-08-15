import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Eye,
  EyeOff,
  Gauge,
  ShieldCheck,
  TrendingUp,
  Smartphone,
  AlertCircle,
  Mail,
  Lock,
  Monitor,
  Phone,
  Globe,
  ChevronDown,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../context/LanguageContext';
import { login } from '../services/authService';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from '../components/common/PWAInstallModal';

// ─── Country Code Options ───────────────────────────────────────────────────

const COUNTRY_CODES = [
  { code: '+62', flag: '🇮🇩', label: 'Indonesia (+62)' },
  { code: '+60', flag: '🇲🇾', label: 'Malaysia (+60)' },
  { code: '+65', flag: '🇸🇬', label: 'Singapore (+65)' },
  { code: '+1', flag: '🇺🇸', label: 'United States (+1)' },
  { code: '+61', flag: '🇦🇺', label: 'Australia (+61)' },
  { code: '+81', flag: '🇯🇵', label: 'Japan (+81)' },
];

export function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const { installApp, isInstalled, showInstructionModal, closeInstructionModal } = usePWAInstall();

  // Login Method Toggle: 'email' | 'phone'
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [countryCode, setCountryCode] = useState('+62');
  const [phoneDigits, setPhoneDigits] = useState('');

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ identifier?: string; password?: string }>({});

  const [langDropdownOpen, setLangDropdownOpen] = useState(false);
  const langDropdownRef = useRef<HTMLDivElement>(null);

  // Close lang dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langDropdownRef.current && !langDropdownRef.current.contains(e.target as Node)) {
        setLangDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Demo auto-fill helper
  const handleAutoFillDemo = () => {
    setLoginMethod('email');
    setEmail('demo@odomtr.com');
    setPassword('password123');
    setFieldErrors({});
    setError('');
  };

  const validate = () => {
    const errs: { identifier?: string; password?: string } = {};

    if (loginMethod === 'email') {
      if (!email.trim()) {
        errs.identifier = 'Email wajib diisi';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errs.identifier = 'Format email tidak valid';
      }
    } else {
      if (!phoneDigits.trim()) {
        errs.identifier = 'Nomor HP wajib diisi';
      } else if (phoneDigits.length < 7) {
        errs.identifier = 'Nomor HP terlalu pendek';
      }
    }

    if (!password) {
      errs.password = 'Password wajib diisi';
    } else if (password.length < 6) {
      errs.password = 'Password minimal 6 karakter';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setIsLoading(true);

    const identifier =
      loginMethod === 'email'
        ? email.trim()
        : `${countryCode}${phoneDigits.trim()}`;

    try {
      const { user } = await login({ email: identifier, password });
      setUser(user);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ??
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.message ??
        'Email / Nomor HP atau password salah';
      setError(msg);
    } finally {
      setIsLoading(false);
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

        {/* Center Hero Text & Features */}
        <div className="relative z-10 space-y-8 max-w-lg my-auto py-8">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-blue-500/10 border border-blue-400/20 px-3 py-1 rounded-full text-xs font-semibold text-blue-300">
              <Sparkles size={14} className="text-yellow-400" />
              <span>Sistem Telemetri & Riwayat Servis Otomotif</span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight leading-tight">
              Passport Digital <br />
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-300 bg-clip-text text-transparent">
                Kendaraan Anda
              </span>
            </h1>
            <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-normal">
              Kelola riwayat servis, odometer, rencana perawatan berkala, serta bagikan telemetri story sosial ke komunitas otomotif dalam satu genggaman.
            </p>
          </div>

          {/* Feature Showcase Grid */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {[
              {
                icon: <ShieldCheck size={20} className="text-blue-400" />,
                title: 'Buku Servis Digital Terverifikasi',
                desc: 'Catatan servis resmi partner bengkel & DIY terlindungi.',
              },
              {
                icon: <Zap size={20} className="text-amber-400" />,
                title: 'Odo Telemetry & Story Studio',
                desc: 'Cetak story telemetri kendaraan beresolusi tinggi.',
              },
              {
                icon: <TrendingUp size={20} className="text-emerald-400" />,
                title: 'Odo Threads Social Community',
                desc: 'Berbagi pengalaman, tips, & diskusi seputar otomotif.',
              },
            ].map((f, i) => (
              <div
                key={i}
                className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex items-start gap-3.5 hover:bg-white/10 transition-colors"
              >
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">{f.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-800/80">
          <span>© 2026 Odomtr Inc. All rights reserved.</span>
          <span className="flex items-center gap-1 text-slate-300 font-semibold">
            <CheckCircle2 size={14} className="text-emerald-400" /> Web & PWA Ready
          </span>
        </div>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-12 bg-white relative">
        {/* Top Control Bar */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full">
          {/* Mobile Brand Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-xs">
              <Gauge size={18} className="text-white" />
            </div>
            <span
              className="text-lg font-bold text-slate-900"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Odomtr
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Desktop App PWA Install Button */}
            {!isInstalled && (
              <button
                type="button"
                onClick={installApp}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-2xs cursor-pointer"
                title="Jadikan Odomtr sebagai Desktop App"
              >
                <Monitor size={14} className="text-blue-600" />
                <span>Desktop App</span>
              </button>
            )}

            {/* Language Selector Dropdown */}
            <div className="relative" ref={langDropdownRef}>
              <button
                onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-extrabold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shadow-2xs cursor-pointer"
                aria-label="Language Selector"
              >
                <Globe size={14} className="text-slate-500" />
                <span>{language === 'id' ? 'ID 🇮🇩' : 'EN 🇬🇧'}</span>
                <ChevronDown size={12} className="text-slate-400" />
              </button>

              {langDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-50 text-xs animate-slide-up">
                  <button
                    onClick={() => {
                      setLanguage('id');
                      setLangDropdownOpen(false);
                    }}
                    className={[
                      'w-full flex items-center justify-between px-3.5 py-2.5 font-bold transition-colors cursor-pointer',
                      language === 'id' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span>Indonesia 🇮🇩</span>
                    {language === 'id' && <span>✓</span>}
                  </button>
                  <button
                    onClick={() => {
                      setLanguage('en');
                      setLangDropdownOpen(false);
                    }}
                    className={[
                      'w-full flex items-center justify-between px-3.5 py-2.5 font-bold transition-colors border-t border-slate-100 cursor-pointer',
                      language === 'en' ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span>English 🇬🇧</span>
                    {language === 'en' && <span>✓</span>}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Login Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6 space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {t('login_title_signin')}
            </h2>
            <p className="text-slate-500 mt-1.5 text-xs sm:text-sm font-medium">
              {t('login_subtitle_no_account')}{' '}
              <Link
                to="/register"
                className="text-blue-600 font-extrabold hover:text-blue-800 transition-colors inline-flex items-center gap-0.5"
              >
                <span>{t('login_register_link')}</span>
                <ArrowRight size={13} />
              </Link>
            </p>
          </div>

          {/* Quick Demo Credentials Autofill Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 border border-blue-200/80 rounded-2xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-0.5 min-w-0">
              <span className="text-[10px] font-black text-blue-700 uppercase tracking-wider flex items-center gap-1">
                <Sparkles size={12} className="text-amber-500" /> Quick Demo Login
              </span>
              <p className="text-xs font-mono font-bold text-slate-700 truncate">
                demo@odomtr.com / password123
              </p>
            </div>
            <button
              type="button"
              onClick={handleAutoFillDemo}
              className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-black shrink-0 transition-transform active:scale-95 cursor-pointer shadow-2xs"
            >
              Auto Fill ⚡
            </button>
          </div>

          {/* Login Method Selector Tabs */}
          <div className="flex border border-slate-200/90 rounded-2xl p-1 bg-slate-100/80 shadow-inner">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setFieldErrors({});
                setError('');
              }}
              className={[
                'flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer',
                loginMethod === 'email'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <Mail size={15} /> {t('login_tab_email')}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
                setFieldErrors({});
                setError('');
              }}
              className={[
                'flex-1 py-2.5 text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer',
                loginMethod === 'phone'
                  ? 'bg-white text-blue-700 shadow-xs border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900',
              ].join(' ')}
            >
              <Phone size={15} /> {t('login_tab_phone')}
            </button>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700 animate-in fade-in">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {loginMethod === 'email' ? (
              /* Email Input */
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('login_label_email')}
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    className={`input-field pl-10 text-sm ${fieldErrors.identifier ? 'error' : ''}`}
                    placeholder="nama@email.com"
                    value={email}
                    autoComplete="email"
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
                    }}
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.identifier}
                  </p>
                )}
              </div>
            ) : (
              /* Phone Input */
              <div>
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider mb-1.5">
                  {t('login_label_phone')}
                </label>
                <div className="flex items-center border border-slate-300 rounded-2xl overflow-hidden focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20 bg-white">
                  <div className="bg-slate-100 border-r border-slate-200 text-slate-700 font-extrabold text-xs px-2.5 py-3 flex items-center shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="bg-transparent font-bold text-slate-800 cursor-pointer outline-none text-xs"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.flag} {c.code}
                        </option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="tel"
                    placeholder="85780336399"
                    value={phoneDigits}
                    onChange={(e) => {
                      let val = e.target.value.replace(/[^0-9]/g, '');
                      if (val.startsWith('0')) val = val.slice(1);
                      setPhoneDigits(val);
                      if (fieldErrors.identifier) setFieldErrors((p) => ({ ...p, identifier: undefined }));
                    }}
                    className="flex-1 py-2.5 px-3 text-sm font-medium border-0 focus:outline-none text-slate-900 placeholder:text-slate-400 font-mono"
                  />
                </div>
                {fieldErrors.identifier && (
                  <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.identifier}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-extrabold text-slate-700 uppercase tracking-wider">
                  {t('login_label_password')}
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-blue-600 hover:text-blue-800 font-extrabold transition-colors"
                >
                  {t('login_forgot_password')}
                </Link>
              </div>

              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 text-sm ${fieldErrors.password ? 'error' : ''}`}
                  placeholder="••••••••"
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (fieldErrors.password) setFieldErrors((p) => ({ ...p, password: undefined }));
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 font-bold flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
              className="py-3 text-sm font-black shadow-md rounded-2xl cursor-pointer"
            >
              {t('login_submit')}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3 pt-1">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">{t('login_or')}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google OAuth Button */}
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
              <span>{t('login_google')}</span>
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="w-full text-center text-xs text-slate-400 font-medium py-2">
          Odomtr Digital Vehicle Passport v2.0
        </div>
      </div>

      {/* PWA Installation Instructions Modal */}
      <PWAInstallModal
        isOpen={showInstructionModal}
        onClose={closeInstructionModal}
      />
    </div>
  );
}

export default LoginPage;
