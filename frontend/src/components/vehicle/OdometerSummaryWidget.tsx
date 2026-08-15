import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Edit3, Check, X, Car, Bike, Sparkles, Eye, ChevronRight } from 'lucide-react';
import type { Vehicle } from '../../types';
import { formatMileage } from '../../utils/formatters';
import { vehicleService } from '../../services/vehicleService';

interface OdometerSummaryWidgetProps {
  vehicles: Vehicle[];
  onVehicleUpdated: () => void;
}

export function OdometerSummaryWidget({
  vehicles,
  onVehicleUpdated,
}: OdometerSummaryWidgetProps) {
  const navigate = useNavigate();
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null);
  const [inputKm, setInputKm] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string>('');

  const handleStartEdit = (vehicle: Vehicle) => {
    setEditingVehicleId(vehicle.id);
    setInputKm(String(vehicle.current_mileage));
  };

  const handleCancel = () => {
    setEditingVehicleId(null);
    setInputKm('');
  };

  const handleSave = async (vehicle: Vehicle) => {
    const newKm = Number(inputKm);
    if (isNaN(newKm) || newKm < 0) return;

    setIsSubmitting(true);
    try {
      await vehicleService.updateVehicle(vehicle.id, {
        category: vehicle.category,
        license_plate: vehicle.license_plate,
        brand: vehicle.brand,
        model: vehicle.model,
        variant_type: vehicle.variant_type,
        manufacture_year: vehicle.manufacture_year,
        current_mileage: newKm,
        nickname: vehicle.nickname,
        photo_url: vehicle.photo_url,
      });

      setEditingVehicleId(null);
      setSuccessMessage(`KM ${vehicle.brand} ${vehicle.model} berhasil diperbarui!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      onVehicleUpdated();
    } catch (err) {
      console.error('Failed to update odometer:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (vehicles.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
            <Gauge size={18} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Odometer Kendaraan (Quick View & Update KM)</h3>
            <p className="text-[11px] text-slate-500">Pantau, lihat detail & perbarui kilometer terkini kendaraan Anda</p>
          </div>
        </div>

        {successMessage && (
          <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full animate-fade-in">
            ✓ {successMessage}
          </span>
        )}
      </div>

      {/* Vehicles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vehicles.map((v) => {
          const isEditing = editingVehicleId === v.id;

          return (
            <div
              key={v.id}
              className="bg-slate-50 border border-slate-200 hover:border-blue-300 rounded-xl p-3.5 transition-all flex flex-col justify-between gap-3 group"
            >
              {/* Top row: Category, Plate & Nickname */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[10px] font-mono border border-amber-400">
                    {v.license_plate}
                  </span>
                  <span className="text-xs font-bold text-slate-800 truncate">
                    {v.brand} {v.model}
                  </span>
                </div>

                <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200 flex items-center gap-1">
                  {v.category === 'mobil' ? <Car size={11} /> : <Bike size={11} />}
                  {v.category === 'mobil' ? 'Mobil' : 'Motor'}
                </span>
              </div>

              {v.nickname && (
                <div className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-150 w-fit flex items-center gap-1">
                  <Sparkles size={10} /> "{v.nickname}"
                </div>
              )}

              {/* Bottom row: Odometer Display & Quick Action Buttons */}
              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                {isEditing ? (
                  <div className="flex items-center gap-1.5 w-full">
                    <input
                      type="number"
                      value={inputKm}
                      onChange={(e) => setInputKm(e.target.value)}
                      className="input-field text-xs py-1 px-2 font-mono font-bold bg-white w-full border-blue-500 focus:ring-1 focus:ring-blue-500"
                      placeholder="KM Baru"
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(v)}
                      disabled={isSubmitting}
                      className="bg-blue-600 text-white p-1.5 rounded-lg hover:bg-blue-700 transition-colors shrink-0"
                      title="Simpan"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="bg-slate-200 text-slate-600 p-1.5 rounded-lg hover:bg-slate-300 transition-colors shrink-0"
                      title="Batal"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase">Odometer Saat Ini</p>
                      <p className="text-base font-extrabold text-slate-900 tracking-tight" style={{ fontFamily: 'Rajdhani, sans-serif' }}>
                        {formatMileage(v.current_mileage)} <span className="text-xs font-semibold text-slate-500">KM</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* View Detail Button */}
                      <button
                        type="button"
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        className="flex items-center gap-1 text-xs font-bold text-slate-700 hover:text-blue-600 bg-white hover:bg-blue-50 px-2.5 py-1.5 rounded-lg transition-colors border border-slate-200 hover:border-blue-200"
                        title="Lihat Detail Kendaraan"
                      >
                        <Eye size={13} className="text-slate-500 hover:text-blue-600" />
                        Detail
                      </button>

                      {/* Update KM Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(v)}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors border border-blue-200"
                      >
                        <Edit3 size={13} />
                        Update KM
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default OdometerSummaryWidget;
