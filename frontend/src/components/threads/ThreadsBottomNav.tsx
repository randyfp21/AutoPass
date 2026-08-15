import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Bookmark, PlusCircle, Bell, User as UserIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ThreadsBottomNavProps {
  onOpenNewThreadModal: () => void;
}

export function ThreadsBottomNav({ onOpenNewThreadModal }: ThreadsBottomNavProps) {
  const location = useLocation();
  const navigate = useNavigate();
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
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md sm:max-w-lg bg-slate-900/85 backdrop-blur-xl backdrop-saturate-150 border border-purple-500/40 shadow-[0_12px_40px_0_rgba(147,51,234,0.35)] rounded-full p-2 transition-all">
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
                <span className="text-[10px] font-extrabold text-purple-300 mt-1 whitespace-nowrap drop-shadow-xs">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive =
            item.path === userProfilePath
              ? location.pathname.startsWith('/threads/user')
              : location.pathname === item.path;

          return (
            <button
              key={idx}
              type="button"
              onClick={() => item.path && navigate(item.path)}
              className={[
                'flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 cursor-pointer w-full text-center',
                isActive
                  ? 'bg-purple-500/25 text-purple-300 font-extrabold shadow-xs'
                  : 'text-slate-400 hover:text-slate-100 font-medium hover:bg-slate-800/60',
              ].join(' ')}
            >
              <div className="relative">
                <Icon size={20} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-400 rounded-full animate-pulse shadow-xs" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

export default ThreadsBottomNav;
