import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Calendar, Wrench, ChevronRight } from 'lucide-react';
import type { Vehicle } from '../../types';
import { formatMileage } from '../../utils/formatters';

// ─── SVG Illustrations ────────────────────────────────────────────────────────

function CarIllustration() {
  return (
    <svg viewBox="0 0 200 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Road */}
      <rect x="0" y="80" width="200" height="20" fill="#E2E8F0" rx="0" />
      {/* Car body */}
      <rect x="20" y="45" width="160" height="38" fill="#2563EB" rx="8" />
      {/* Roof */}
      <path d="M60 45 L75 20 L125 20 L145 45Z" fill="#1D4ED8" />
      {/* Windshield front */}
      <path d="M113 22 L140 44 L113 44Z" fill="#93C5FD" opacity="0.8" />
      {/* Windshield rear */}
      <path d="M87 22 L60 44 L87 44Z" fill="#93C5FD" opacity="0.8" />
      {/* Windows */}
      <rect x="90" y="23" width="20" height="20" rx="2" fill="#93C5FD" opacity="0.9" />
      {/* Wheel left */}
      <circle cx="55" cy="83" r="13" fill="#1E293B" />
      <circle cx="55" cy="83" r="7" fill="#64748B" />
      <circle cx="55" cy="83" r="3" fill="#CBD5E1" />
      {/* Wheel right */}
      <circle cx="145" cy="83" r="13" fill="#1E293B" />
      <circle cx="145" cy="83" r="7" fill="#64748B" />
      <circle cx="145" cy="83" r="3" fill="#CBD5E1" />
      {/* Headlight */}
      <rect x="168" y="55" width="14" height="8" fill="#FEF08A" rx="3" />
      {/* Taillight */}
      <rect x="18" y="55" width="14" height="8" fill="#FCA5A5" rx="3" />
      {/* Bumper detail */}
      <rect x="22" y="72" width="156" height="6" fill="#1D4ED8" rx="3" />
    </svg>
  );
}

function MotorcycleIllustration() {
  return (
    <svg viewBox="0 0 200 110" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Road */}
      <rect x="0" y="88" width="200" height="22" fill="#E2E8F0" />
      {/* Rear wheel */}
      <circle cx="55" cy="88" r="22" fill="#1E293B" />
      <circle cx="55" cy="88" r="12" fill="#475569" />
      <circle cx="55" cy="88" r="5" fill="#CBD5E1" />
      {/* Front wheel */}
      <circle cx="148" cy="88" r="22" fill="#1E293B" />
      <circle cx="148" cy="88" r="12" fill="#475569" />
      <circle cx="148" cy="88" r="5" fill="#CBD5E1" />
      {/* Frame / body */}
      <path d="M55 68 L80 40 L130 40 L148 68" stroke="#DC2626" strokeWidth="8" strokeLinecap="round" fill="none" />
      {/* Engine block */}
      <rect x="78" y="55" width="44" height="28" fill="#DC2626" rx="6" />
      {/* Fuel tank */}
      <ellipse cx="105" cy="45" rx="22" ry="10" fill="#B91C1C" />
      {/* Seat */}
      <rect x="72" y="40" width="50" height="10" fill="#0F172A" rx="5" />
      {/* Handlebars */}
      <path d="M135 40 L155 30 M155 30 L160 35" stroke="#475569" strokeWidth="4" strokeLinecap="round" />
      {/* Headlight */}
      <circle cx="160" cy="48" r="8" fill="#FEF08A" />
      <circle cx="160" cy="48" r="5" fill="#FDE047" />
      {/* Exhaust */}
      <path d="M60 72 L45 80" stroke="#94A3B8" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

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
      className="card hover-lift cursor-pointer group overflow-hidden"
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/vehicles/${vehicle.id}`)}
      aria-label={`View ${vehicle.brand} ${vehicle.model}`}
    >
      {/* ── Illustration Area ── */}
      <div className="relative h-44 bg-gradient-to-br from-slate-50 to-slate-100 overflow-hidden">
        {vehicle.photo_url ? (
          <img
            src={vehicle.photo_url}
            alt={`${vehicle.brand} ${vehicle.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center p-6">
            {vehicle.category === 'mobil' ? <CarIllustration /> : <MotorcycleIllustration />}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <span
            className={`badge ${vehicle.category === 'mobil' ? 'badge-blue' : 'badge-red'}`}
          >
            {vehicle.category === 'mobil' ? '🚗 Mobil' : '🏍️ Motor'}
          </span>
        </div>

        {/* Service count */}
        {serviceCount !== undefined && (
          <div className="absolute top-3 right-3">
            <span className="badge badge-gray">
              <Wrench size={10} />
              {serviceCount} servis
            </span>
          </div>
        )}

        {/* Gradient overlay at bottom */}
        <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white/80 to-transparent" />
      </div>

      {/* ── Content ── */}
      <div className="p-4">
        {/* Gen Z Nickname */}
        {vehicle.nickname && (
          <div className="mb-1 flex items-center gap-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 w-fit">
            <span>✨ "{vehicle.nickname}"</span>
          </div>
        )}

        {/* Brand + Model */}
        <div className="mb-3">
          <h3 className="text-lg font-bold text-slate-900 leading-tight">
            {vehicle.brand} {vehicle.model}
          </h3>
          {vehicle.variant_type && (
            <p className="text-sm text-slate-500 mt-0.5">{vehicle.variant_type}</p>
          )}
        </div>

        {/* License Plate */}
        <div className="mb-4">
          <span className="license-plate text-base">
            {vehicle.license_plate}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Gauge size={14} className="text-blue-500 shrink-0" />
            <span className="font-medium">{formatMileage(vehicle.current_mileage)} km</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar size={14} className="text-slate-400 shrink-0" />
            <span>{vehicle.manufacture_year}</span>
          </div>
          {lastServiceDate && (
            <div className="ml-auto text-xs text-slate-400">
              Servis: {lastServiceDate}
            </div>
          )}
        </div>
      </div>

      {/* ── Footer ── */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">
            Tap untuk detail
          </span>
          <ChevronRight
            size={16}
            className="text-slate-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all"
          />
        </div>
      </div>
    </div>
  );
}

export default VehicleCard;
