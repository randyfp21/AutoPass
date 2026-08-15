import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Gauge,
  LogOut,
  ChevronDown,
  Globe,
  Maximize,
  Minimize,
  Edit3,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../context/LanguageContext';
import { EditProfileModal } from './EditProfileModal';

export function Navbar() {
  const { user, setUser, signOut, isAuthenticated } = useAuth();
  const { language, setLanguage, t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  const isThreadsMode = location.pathname.startsWith('/threads');

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = () => {
    setDropdownOpen(false);
    signOut();
  };

  const getInitials = (name: string) =>
    name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();

  return (
    <header className="sticky top-0 z-40 w-full">
      {/* Glass navbar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-sm relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 relative">
            {/* ── 1. Left Side: Logo & Mode Badge ── */}
            <div className="flex items-center gap-3">
              <Link
                to={isAuthenticated ? (isThreadsMode ? '/threads' : '/dashboard') : '/'}
                className="flex items-center gap-2.5 group"
              >
                <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-md group-hover:scale-105 transition-transform">
                  <Gauge size={20} className="text-white" />
                </div>
                <span
                  className="text-xl font-bold tracking-tight"
                  style={{ fontFamily: 'Rajdhani, sans-serif' }}
                >
                  <span className="text-slate-900">Odom</span>
                  <span className="text-blue-600">tr</span>
                </span>
              </Link>

              {/* Mode Toggle Badge */}
              {isThreadsMode ? (
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-extrabold px-2.5 py-0.5 rounded-full shadow-xs items-center gap-1 hidden lg:flex">
                  <Sparkles size={11} /> Odo Threads
                </span>
              ) : (
                <span className="bg-slate-100 text-slate-700 border border-slate-200 text-[11px] font-bold px-2 py-0.5 rounded-full hidden lg:inline-block">
                  Vehicle Passport
                </span>
              )}
            </div>

            {/* ── 2. CENTER TOP BAR: Segmented ON/OFF Mode Switcher Pill ── */}
            {isAuthenticated && (
              <div className="absolute left-1/2 -translate-x-1/2 z-20">
                <div className="bg-slate-100/90 p-1 rounded-full border border-slate-200/80 flex items-center shadow-inner relative transition-all duration-300">
                  {/* Segment 1: Core Tracker */}
                  <button
                    type="button"
                    onClick={() => {
                      if (isThreadsMode) navigate('/dashboard');
                    }}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all duration-300 cursor-pointer select-none',
                      !isThreadsMode
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-500/25 scale-100'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 scale-95 opacity-75',
                    ].join(' ')}
                  >
                    <Gauge size={13} className={!isThreadsMode ? 'text-white' : 'text-slate-400'} />
                    <span className="hidden sm:inline">Core Tracker</span>
                  </button>

                  {/* Segment 2: Odo Threads */}
                  <button
                    type="button"
                    onClick={() => {
                      if (!isThreadsMode) navigate('/threads');
                    }}
                    className={[
                      'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold transition-all duration-300 cursor-pointer select-none',
                      isThreadsMode
                        ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-500/25 scale-100'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 scale-95 opacity-75',
                    ].join(' ')}
                  >
                    <Sparkles size={13} className={isThreadsMode ? 'text-yellow-300' : 'text-slate-400'} />
                    <span>Odo Threads</span>
                  </button>
                </div>
              </div>
            )}

            {/* ── 3. Right Side: Fullscreen & User Profile Dropdown ── */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Fullscreen Button */}
              <button
                onClick={toggleFullscreen}
                className="p-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 hidden sm:block"
                title={isFullscreen ? 'Keluar Layar Penuh (Exit Fullscreen)' : 'Mode Layar Penuh (Fullscreen)'}
                aria-label="Toggle Fullscreen"
              >
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>

              {/* User Profile Dropdown */}
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-2 py-1.5 rounded-xl hover:bg-slate-100 transition-colors group"
                  >
                    {user.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-500 shadow-sm"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow text-white text-xs font-bold">
                        {getInitials(user.full_name)}
                      </div>
                    )}
                    <div className="hidden sm:flex flex-col items-start min-w-0">
                      <span className="text-sm font-semibold text-slate-800 truncate max-w-[140px]">
                        {user.full_name}
                      </span>
                    </div>
                    <ChevronDown
                      size={14}
                      className={`text-slate-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* User Dropdown Panel */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-slide-up z-50">
                      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100">
                        <p className="text-sm font-semibold text-slate-900 truncate">
                          {user.full_name}
                        </p>
                        <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      </div>

                      {/* Option 1: Edit Profile */}
                      <div className="py-1 border-b border-slate-100">
                        <button
                          onClick={() => {
                            setDropdownOpen(false);
                            setShowEditProfileModal(true);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-600 transition-colors font-semibold cursor-pointer"
                        >
                          <Edit3 size={15} className="text-blue-600" />
                          <span>Edit Profil & Foto</span>
                        </button>
                      </div>

                      {/* Option 2: Auto Translate ID / EN (Fitur Beta) */}
                      <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-extrabold text-slate-800 flex items-center gap-1.5">
                            <Globe size={14} className="text-blue-600" />
                            Auto Translate
                          </span>
                          <span className="text-[9px] font-black text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-200 uppercase">
                            fitur beta
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            onClick={() => setLanguage('id')}
                            className={[
                              'py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1',
                              language === 'id'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100',
                            ].join(' ')}
                          >
                            <span>ID 🇮🇩</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setLanguage('en')}
                            className={[
                              'py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-center gap-1',
                              language === 'en'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100',
                            ].join(' ')}
                          >
                            <span>EN 🇬🇧</span>
                          </button>
                        </div>
                      </div>

                      {/* Option 3: Sign Out */}
                      <div className="py-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 transition-colors font-semibold cursor-pointer"
                        >
                          <LogOut size={15} />
                          <span>{t('nav_logout')}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    to="/login"
                    className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors shadow-sm"
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {user && (
        <EditProfileModal
          isOpen={showEditProfileModal}
          onClose={() => setShowEditProfileModal(false)}
          user={user}
          onProfileUpdated={(updatedUser) => {
            setUser(updatedUser);
          }}
        />
      )}
    </header>
  );
}

export default Navbar;
