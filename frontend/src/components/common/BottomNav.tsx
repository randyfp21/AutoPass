import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Wallet, LayoutDashboard, CalendarPlus, Activity, Car } from 'lucide-react';
import { useTranslation } from '../../context/LanguageContext';

interface BottomNavProps {
  onOpenAddPlanner: () => void;
}

export function BottomNav({ onOpenAddPlanner }: BottomNavProps) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    {
      label: t('nav_spent') || 'Pengeluaran',
      to: '/spent',
      icon: <Wallet size={20} />,
    },
    {
      label: t('nav_dashboard') || 'Dashboard',
      to: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Rencana Service',
      isCenterAction: true,
      icon: <CalendarPlus size={22} />,
    },
    {
      label: 'Plan',
      to: '/activity',
      icon: <Activity size={20} />,
    },
    {
      label: 'Kendaraan',
      to: '/vehicles',
      icon: <Car size={20} />,
    },
  ];

  return (
    <nav className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md sm:max-w-lg bg-white/80 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[0_12px_40px_0_rgba(31,38,135,0.18)] rounded-full p-2 transition-all">
      {/* Liquid Specular Light Line */}
      <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent rounded-full pointer-events-none" />

      {/* Grid 5 Column - Perfectly Symmetrical */}
      <div className="grid grid-cols-5 items-center relative z-10">
        {navItems.map((item, index) => {
          if (item.isCenterAction) {
            return (
              <button
                key={index}
                type="button"
                onClick={onOpenAddPlanner}
                className="flex flex-col items-center justify-center -mt-7 group cursor-pointer w-full"
                aria-label={item.label}
              >
                <div className="w-13 h-13 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 ring-4 ring-white group-hover:scale-105 active:scale-95 transition-transform duration-200">
                  {item.icon}
                </div>
                <span className="text-[10px] font-extrabold text-blue-600 mt-1 whitespace-nowrap drop-shadow-xs">
                  {item.label}
                </span>
              </button>
            );
          }

          const isActive = location.pathname === item.to || (item.to === '/activity' && location.pathname === '/plan');

          return (
            <button
              key={index}
              type="button"
              onClick={() => item.to && navigate(item.to)}
              className={[
                'flex flex-col items-center justify-center py-1.5 px-1 rounded-full transition-all duration-200 cursor-pointer w-full text-center',
                isActive
                  ? 'bg-blue-600/10 text-blue-600 font-extrabold shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 font-medium hover:bg-slate-100/60',
              ].join(' ')}
            >
              <div className="relative">
                {item.icon}
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full animate-pulse shadow-xs" />
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

export default BottomNav;
