import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Gauge, Shield, TrendingUp, Smartphone, AlertCircle, Mail, Lock, Monitor, Phone, Globe, ChevronDown } from 'lucide-react';
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

  const features = [
    {
      icon: <Shield size={18} className="text-blue-300" />,
      title: t('login_feature_1_title'),
      desc: t('login_feature_1_desc'),
    },
    {
      icon: <TrendingUp size={18} className="text-blue-300" />,
      title: t('login_feature_2_title'),
      desc: t('login_feature_2_desc'),
    },
    {
      icon: <Smartphone size={18} className="text-blue-300" />,
      title: t('login_feature_3_title'),
      desc: t('login_feature_3_desc'),
    },
  ];

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
    <div className="min-h-screen flex relative">
      {/* ── Left Hero Panel ── */}
      <div className="hidden lg:flex lg:w-1/2 bg-automotive-hero flex-col justify-between p-12 relative overflow-hidden">
        {/* Abstract decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-80 h-80 bg-blue-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-11 h-11 bg-white/15 backdrop-blur-sm rounded-xl flex items-center justify-center border border-white/20">
            <Gauge size={24} className="text-white" />
          </div>
          <span
            className="text-2xl font-bold text-white tracking-tight"
            style={{ fontFamily: 'Rajdhani, sans-serif' }}
          >
            Odomtr
          </span>
        </div>

        {/* Center content */}
        <div className="relative z-10">
          {/* Tagline */}
          <h1 className="text-5xl font-bold text-white leading-tight mb-4">
            Passport Digital
            <br />
            <span className="text-blue-300">Kendaraanmu</span>
          </h1>
          <p className="text-slate-300 text-lg mb-10 leading-relaxed">
            Rekam, kelola, dan bagikan riwayat servis
            <br />
            kendaraan Anda dengan mudah dan elegan.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center shrink-0 mt-0.5">
                  {f.icon}
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">{f.title}</p>
                  <p className="text-slate-400 text-xs mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer note */}
        <p className="relative z-10 text-slate-500 text-xs">
          © 2026 Odomtr. Digital Vehicle Passport.
        </p>
      </div>

      {/* ── Right Form Panel ── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 bg-white relative">
        {/* Top Control Bar: Language Selector & Desktop App */}
        <div className="flex items-center justify-end gap-3 w-full">
          {/* Language Selector Dropdown */}
          <div className="relative" ref={langDropdownRef}>
            <button
              onClick={() => setLangDropdownOpen(!langDropdownOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shadow-xs"
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
                    'w-full flex items-center justify-between px-3.5 py-2.5 font-semibold transition-colors',
                    language === 'id' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50',
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
                    'w-full flex items-center justify-between px-3.5 py-2.5 font-semibold transition-colors border-t border-slate-100',
                    language === 'en' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-700 hover:bg-slate-50',
                  ].join(' ')}
                >
                  <span>English 🇬🇧</span>
                  {language === 'en' && <span>✓</span>}
                </button>
              </div>
            )}
          </div>

          {/* Desktop App PWA Install Button */}
          {!isInstalled && (
            <button
              type="button"
              onClick={installApp}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl transition-all shadow-xs"
              title="Jadikan Odomtr sebagai Desktop App"
            >
              <Monitor size={14} className="text-blue-600" />
              <span>Desktop App</span>
            </button>
          )}
        </div>

        {/* Form Container */}
        <div className="w-full max-w-md mx-auto my-auto py-6">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center">
              <Gauge size={20} className="text-white" />
            </div>
            <span
              className="text-xl font-bold text-slate-900"
              style={{ fontFamily: 'Rajdhani, sans-serif' }}
            >
              Odomtr
            </span>
          </div>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-slate-900">{t('login_title_signin')}</h2>
            <p className="text-slate-500 mt-1.5 text-sm">
              {t('login_subtitle_no_account')}{' '}
              <Link
                to="/register"
                className="text-blue-600 font-semibold hover:text-blue-800 transition-colors"
              >
                {t('login_register_link')}
              </Link>
            </p>
          </div>

          {/* Login Method Selector Tabs */}
          <div className="flex border border-slate-200 rounded-xl p-1 bg-slate-50 mb-6">
            <button
              type="button"
              onClick={() => {
                setLoginMethod('email');
                setFieldErrors({});
                setError('');
              }}
              className={[
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
                loginMethod === 'email'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:bg-slate-100',
              ].join(' ')}
            >
              <Mail size={14} /> {t('login_tab_email')}
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMethod('phone');
                setFieldErrors({});
                setError('');
              }}
              className={[
                'flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2',
                loginMethod === 'phone'
                  ? 'bg-white text-blue-600 shadow-xs border border-slate-200/50'
                  : 'text-slate-500 hover:bg-slate-100',
              ].join(' ')}
            >
              <Phone size={14} /> {t('login_tab_phone')}
            </button>
          </div>

          {/* Error banner */}
          {error && (
            <div className="flex items-center gap-2.5 p-3.5 mb-5 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            {loginMethod === 'email' ? (
              /* Email Input */
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('login_label_email')}
                </label>
                <div className="relative">
                  <Mail
                    size={16}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />
                  <input
                    type="email"
                    className={`input-field pl-10 ${fieldErrors.identifier ? 'error' : ''}`}
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
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.identifier}
                  </p>
                )}
              </div>
            ) : (
              /* Phone Input with Greyed-out Country Code Badge */
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                  {t('login_label_phone')}
                </label>
                <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 bg-white">
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
                <p className="mt-1 text-[11px] text-slate-400">
                  {t('login_phone_hint')}
                </p>
                {fieldErrors.identifier && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {fieldErrors.identifier}
                  </p>
                )}
              </div>
            )}

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                {t('login_label_password')}
              </label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type={showPassword ? 'text' : 'password'}
                  className={`input-field pl-10 pr-10 ${fieldErrors.password ? 'error' : ''}`}
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
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                  <AlertCircle size={12} /> {fieldErrors.password}
                </p>
              )}
            </div>

            {/* Forgot password */}
            <div className="text-right">
              <Link
                to="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {t('login_forgot_password')}
              </Link>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              {t('login_submit')}
            </Button>

            {/* Divider */}
            <div className="relative flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-200" />
              <span className="text-xs text-slate-400 font-medium">{t('login_or')}</span>
              <div className="flex-1 h-px bg-slate-200" />
            </div>

            {/* Google OAuth button */}
            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 py-3 px-4 border-2 border-slate-200 rounded-xl text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:border-slate-300 transition-all"
              onClick={() => alert('Google OAuth: Coming soon!')}
            >
              {/* Google G icon */}
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              {t('login_google')}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <div className="w-full text-center text-xs text-slate-400 py-2">
          Odomtr Digital Passport v2.0
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
