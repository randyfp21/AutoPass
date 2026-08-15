import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Wallet, LayoutDashboard, CalendarCheck, Activity, Car, Wrench, FilePlus2 } from 'lucide-react';

interface BottomNavProps {
  onOpenAddPlanner?: () => void;
}

export function BottomNav({ onOpenAddPlanner }: BottomNavProps = {}) {
  const [showServicePopup, setShowServicePopup] = useState(false);

  const navItems = [
    {
      label: 'Pengeluaran',
      to: '/spent',
      icon: <Wallet size={20} />,
    },
    {
      label: 'Dashboard',
      to: '/dashboard',
      icon: <LayoutDashboard size={20} />,
    },
    {
      label: 'Rencana Service',
      isCenterAction: true,
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
    <>
      <nav className="floating-bottom-nav fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[94%] max-w-md sm:max-w-lg bg-white/80 backdrop-blur-xl backdrop-saturate-150 border border-white/70 shadow-[0_12px_40px_0_rgba(31,38,135,0.18)] rounded-full p-2 transition-all">
        {/* Liquid Specular Light Line */}
        <div className="absolute inset-x-8 top-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400/60 to-transparent rounded-full pointer-events-none" />

        {/* Grid 5 Column Layout - Perfectly Symmetrical */}
        <div className="grid grid-cols-5 items-center relative z-10">
          {navItems.map((item, idx) => {
            if (item.isCenterAction) {
              return (
                <div key={idx} className="relative flex justify-center items-center w-full">
                  <button
                    type="button"
                    onClick={() => {
                      if (onOpenAddPlanner) {
                        onOpenAddPlanner();
                      } else {
                        setShowServicePopup(!showServicePopup);
                      }
                    }}
                    className="-mt-7 w-13 h-13 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 ring-4 ring-slate-900 group-hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer"
                    aria-label="Rencana Service & Log Instant"
                  >
                    <CalendarCheck size={24} className="text-white drop-shadow-xs" />
                  </button>

                  {/* Popup Options Box */}
                  {showServicePopup && (
                    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-56 bg-slate-900/95 backdrop-blur-md border border-slate-700/80 rounded-2xl p-2 shadow-2xl animate-in zoom-in-95 duration-150 space-y-1 z-50">
                      <NavLink
                        to="/planner"
                        onClick={() => setShowServicePopup(false)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
                      >
                        <div className="p-1.5 bg-blue-600/30 text-blue-400 rounded-lg">
                          <Wrench size={16} />
                        </div>
                        <div className="text-left">
                          <div className="font-bold">Rencana Service</div>
                          <div className="text-[10px] text-slate-400">Jadwal & Estimasi Biaya</div>
                        </div>
                      </NavLink>

                      <NavLink
                        to="/dashboard?catat=true"
                        onClick={() => setShowServicePopup(false)}
                        className="flex items-center gap-2.5 p-2.5 rounded-xl hover:bg-slate-800 text-xs font-semibold text-white transition-colors"
                      >
                        <div className="p-1.5 bg-emerald-600/30 text-emerald-400 rounded-lg">
                          <FilePlus2 size={16} />
                        </div>
                        <div className="text-left">
                          <div className="font-bold">Instant Log</div>
                          <div className="text-[10px] text-slate-400">Catat Servis & Struk</div>
                        </div>
                      </NavLink>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <NavLink
                key={idx}
                to={item.to!}
                className={({ isActive }) =>
                  [
                    'flex flex-col items-center justify-center py-1 rounded-2xl transition-all duration-200 cursor-pointer w-full',
                    isActive
                      ? 'text-blue-600 font-bold scale-105'
                      : 'text-slate-500 hover:text-slate-800 font-medium',
                  ].join(' ')
                }
              >
                <div className="p-1 rounded-xl transition-colors">{item.icon}</div>
                <span className="text-[10px] tracking-tight truncate max-w-full px-1">{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>

      {/* Backdrop overlay for popup */}
      {showServicePopup && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-xs"
          onClick={() => setShowServicePopup(false)}
        />
      )}
    </>
  );
}

export default BottomNav;
