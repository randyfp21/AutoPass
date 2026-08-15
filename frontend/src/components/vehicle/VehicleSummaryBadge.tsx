import React from 'react';
import { Gauge, Calendar, Car, Bike } from 'lucide-react';
import type { Vehicle } from '../../types';
import { formatMileage } from '../../utils/formatters';

interface VehicleSummaryBadgeProps {
  vehicle: Vehicle;
  className?: string;
}

export function VehicleSummaryBadge({ vehicle, className = '' }: VehicleSummaryBadgeProps) {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Category */}
      <span
        className={`badge ${vehicle.category === 'mobil' ? 'badge-blue' : 'badge-red'} flex items-center gap-1`}
      >
        {vehicle.category === 'mobil' ? (
          <Car size={11} />
        ) : (
          <Bike size={11} />
        )}
        {vehicle.category === 'mobil' ? 'Mobil' : 'Motor'}
      </span>

      {/* Mileage */}
      <span className="badge badge-gray flex items-center gap-1">
        <Gauge size={11} />
        {formatMileage(vehicle.current_mileage)} km
      </span>

      {/* Year */}
      <span className="badge badge-gray flex items-center gap-1">
        <Calendar size={11} />
        {vehicle.manufacture_year}
      </span>

      {/* License Plate */}
      <span
        className="text-xs font-bold px-2 py-0.5 rounded"
        style={{ fontFamily: 'Rajdhani, sans-serif', background: '#FFDD00', color: '#000', border: '1px solid #000' }}
      >
        {vehicle.license_plate}
      </span>
    </div>
  );
}

export default VehicleSummaryBadge;
