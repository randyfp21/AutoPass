import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Calendar, Wrench, ChevronRight, Sparkles } from 'lucide-react';
import type { Vehicle } from '../../types';
import { formatMileage } from '../../utils/formatters';
import { AnalogOdometer } from '../common/AnalogOdometer';

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function CarIllustration() {
  return (
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="80" width="200" height="20" fill="#CBD5E1" rx="0" />
      <rect x="20" y="45" width="160" height="38" fill="#2563EB" rx="8" />
      <path d="M60 45 L75 20 L125 20 L145 45Z" fill="#1D4ED8" />
      <path d="M113 22 L140 44 L113 44Z" fill="#93C5FD" opacity="0.8" />
      <path d="M87 22 L60 44 L87 44Z" fill="#93C5FD" opacity="0.8" />
      <rect x="90" y="23" width="20" height="20" rx="2" fill="#93C5FD" opacity="0.9" />
      <circle cx="55" cy="83" r="13" fill="#1E293B" />
      <circle cx="55" cy="83" r="7" fill="#64748B" />
      <circle cx="55" cy="83" r="3" fill="#CBD5E1" />
      <circle cx="145" cy="83" r="13" fill="#1E293B" />
      <circle cx="145" cy="83" r="7" fill="#64748B" />
      <circle cx="145" cy="83" r="3" fill="#CBD5E1" />
      <rect x="168" y="55" width="14" height="8" fill="#FEF08A" rx="3" />
      <rect x="18" y="55" width="14" height="8" fill="#FCA5A5" rx="3" />
      <rect x="22" y="72" width="156" height="6" fill="#1D4ED8" rx="3" />
    </svg>
  );
}

function MotorcycleIllustration() {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="0" y="88" width="200" height="22" fill="#CBD5E1" />
      <circle cx="55" cy="88" r="22" fill="#1E293B" />
      <circle cx="55" cy="88" r="12" fill="#475569" />
      <circle cx="55" cy="88" r="5" fill="#CBD5E1" />
      <circle cx="148" cy="88" r="22" fill="#1E293B" />
      <circle cx="148" cy="88" r="12" fill="#475569" />
      <circle cx="148" cy="88" r="5" fill="#CBD5E1" />
      <path d="M55 68 L80 40 L130 40 L148 68" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" fill="none" />
      <rect x="78" y="55" width="44" height="28" fill="#DC2626" rx="6" />
      <ellipse cx="105" cy="45" rx="22" ry="10" fill="#B91C1C" />
      <rect x="135" y="32" width="16" height="6" fill="#475569" rx="2" />
    </svg>
  );
}

// ─── Component Props ──────────────────────────────────────────────────────────

interface VehicleCardProps {
  vehicle: Vehicle;
  serviceCount?: number;
  lastServiceDate?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VehicleCard({ vehicle, serviceCount, lastServiceDate }: VehicleCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/vehicles/${vehicle.id}`)}
      className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl hover:border-purple-300 transition-all duration-300 transform-gpu hover:-translate-y-1 cursor-pointer group flex flex-col justify-between"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/vehicles/${vehicle.id}`)}
      aria-label={`View ${vehicle.brand} ${vehicle.model}`}
    >
      {/* ── Top Media / Image Container ── */}
      <div className="relative h-48 sm:h-52 bg-slate-900 overflow-hidden">
        {vehicle.photo_url ? (
          <img
            src={vehicle.photo_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-108"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center p-8">
            <div className="w-full h-full max-w-[220px] opacity-90 transition-transform duration-500 group-hover:scale-105">
              {vehicle.category === 'mobil' ? <CarIllustration /> : <MotorcycleIllustration />}
            </div>
          </div>
        )}

        {/* Ambient Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent" />

        {/* Top Badges Bar */}
        <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-1.5">
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-slate-900/75 text-white border border-white/20 shadow-xs">
              {vehicle.category === 'mobil' ? '🚗 Mobil' : '🏍️ Motor'}
            </span>

            <span
              className={`px-3 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md border shadow-xs ${
                vehicle.fuel_type === 'ev'
                  ? 'bg-emerald-600/90 text-white border-emerald-400/30'
                  : 'bg-amber-500/90 text-white border-amber-400/30'
              }`}
            >
              {vehicle.fuel_type === 'ev' ? '⚡ EV' : '⛽ Bensin'}
            </span>
          </div>

          {serviceCount !== undefined && (
            <span className="px-3 py-1 rounded-full text-[11px] font-extrabold backdrop-blur-md bg-slate-900/75 text-amber-300 border border-white/20 shadow-xs flex items-center gap-1">
              <Wrench size={12} className="text-amber-400" />
              {serviceCount} Servis
            </span>
          )}
        </div>

        {/* Bottom Hero Info inside Image */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            {vehicle.nickname && (
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-amber-300 bg-slate-900/80 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-amber-400/30 mb-1">
                <Sparkles size={11} className="text-amber-400" />
                "{vehicle.nickname}"
              </span>
            )}
            <h3 className="text-xl font-black text-white font-tech tracking-wide drop-shadow-sm leading-tight">
              {vehicle.brand} {vehicle.model}
            </h3>
            {vehicle.variant_type && (
              <p className="text-xs text-slate-300 font-medium">{vehicle.variant_type}</p>
            )}
          </div>

          {/* License Plate Badge */}
          <div className="shrink-0">
            <div className="bg-amber-400 text-slate-950 font-black font-mono tracking-wider text-xs px-2.5 py-1 rounded-lg border-2 border-slate-950 shadow-md">
              {vehicle.license_plate}
            </div>
          </div>
        </div>
      </div>

      {/* ── Content Details & Spec Cards ── */}
      <div className="p-4 space-y-4">
        {/* Grid Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Gauge size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-0.5">Odometer</p>
              <AnalogOdometer value={vehicle.current_mileage} size="sm" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-2.5 flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
              <Calendar size={16} />
            </div>
            <div>
              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Tahun</p>
              <p className="text-xs font-black text-slate-900">{vehicle.manufacture_year}</p>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-2 flex items-center justify-between border-t border-slate-100 text-xs">
          <span className="text-slate-400 font-medium">
            {lastServiceDate ? `Servis: ${lastServiceDate}` : 'Pasport Digital Kendaraan'}
          </span>
          <span className="font-extrabold text-purple-600 group-hover:text-purple-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
            <span>Detail</span>
            <ChevronRight size={14} />
          </span>
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
