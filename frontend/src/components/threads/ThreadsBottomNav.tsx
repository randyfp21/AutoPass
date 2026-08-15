import React from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Bookmark, PlusCircle, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ThreadsBottomNavProps {
  onOpenNewThreadModal?: () => void;
}

export function ThreadsBottomNav({ onOpenNewThreadModal }: ThreadsBottomNavProps) {
  const { user } = useAuth();
  const userProfilePath = `/threads/user/@${user?.username || user?.id || ''}`;

  const navItems = [
    { path: '/threads', label: 'Beranda', icon: Home },
    { path: '/threads/bookmarks', label: 'Saved', icon: Bookmark },
    { action: 'new', label: 'Post', icon: PlusCircle, isPrimary: true },
    { path: '/threads/activity', label: 'Aktivitas', icon: Bell },
    { path: userProfilePath, label: 'Profil', icon: UserIcon },
  ];

  return (
    <nav className="floating-bottom-nav fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md sm:max-w-lg bg-slate-900/85 backdrop-blur-xl backdrop-saturate-150 border border-purple-500/40 shadow-[0_12px_40px_0_rgba(147,51,234,0.35)] rounded-full p-2 transition-all">
      {/* Liquid Specular Glow Line */}
      <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-purple-400/70 to-transparent rounded-full pointer-events-none" />

      {/* Grid 5 Column - Perfectly Symmetrical */}
      <div className="grid grid-cols-5 items-center relative z-10">
        {navItems.map((item, idx) => {
          const Icon = item.icon;

          if (item.action === 'new') {
            return (
              <button
                key={idx}
                type="button"
                onClick={onOpenNewThreadModal}
                className="flex flex-col items-center justify-center -mt-7 group cursor-pointer w-full"
                aria-label={item.label}
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-purple-600 via-pink-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-purple-600/45 ring-4 ring-slate-900 group-hover:scale-105 active:scale-95 transition-transform duration-200">
                  <Icon size={24} />
                </div>
                <span className="text-[10px] text-purple-300 font-bold mt-0.5 tracking-tight">
                  {item.label}
                </span>
              </button>
            );
          }

          return (
            <NavLink
              key={idx}
              to={item.path!}
              end={item.path === '/threads'}
              className={({ isActive }) =>
                [
                  'flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 cursor-pointer w-full',
                  isActive
                    ? 'text-purple-400 font-bold scale-105'
                    : 'text-slate-400 hover:text-slate-200 font-medium',
                ].join(' ')
              }
            >
              <Icon size={20} />
              <span className="text-[10px] tracking-tight truncate max-w-full px-1 mt-0.5">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

export default ThreadsBottomNav;
