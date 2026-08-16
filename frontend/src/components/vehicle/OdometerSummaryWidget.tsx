import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gauge, Edit3, Check, X, Car, Bike, Sparkles, Eye } from 'lucide-react';
import type { Vehicle } from '../../types';
import { vehicleService } from '../../services/vehicleService';
import { AnalogOdometer } from '../common/AnalogOdometer';

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
      setSuccessMessage(`KM ${vehicle.brand} ${vehicle.model} diperbarui!`);
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
    <div className="space-y-4">
      {/* ── Sub-header: Odometer Fleet ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-blue-50 border border-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
            <Gauge size={18} />
          </div>
          <div>
            <h4 className="font-extrabold text-sm sm:text-base text-slate-900 flex items-center gap-2">
              <span>Monitor Odometer Real-time</span>
              <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                {vehicles.length} Kendaraan
              </span>
            </h4>
            <p className="text-xs text-slate-500 font-medium">
              Catat kilometer terkini kendaraan Anda secara presisi
            </p>
          </div>
        </div>

        {successMessage && (
          <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0 shadow-2xs">
            ✓ {successMessage}
          </span>
        )}
      </div>

      {/* ── Vehicles Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {vehicles.map((v) => {
          const isEditing = editingVehicleId === v.id;

          return (
            <div
              key={v.id}
              className="bg-slate-50/80 border border-slate-200/90 hover:border-blue-400/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-md flex flex-col justify-between gap-3 group"
            >
              {/* Top row: Category, Plate & Nickname */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2.5 py-0.5 rounded border border-amber-400 shadow-2xs shrink-0">
                      {v.license_plate}
                    </span>
                    <span className="font-extrabold text-sm text-slate-900 truncate">
                      {v.brand} {v.model}
                    </span>
                  </div>

                  <span className="text-[10px] font-extrabold text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-200 shrink-0 flex items-center gap-1">
                    {v.category === 'mobil' ? <Car size={11} className="text-blue-600" /> : <Bike size={11} className="text-purple-600" />}
                    {v.category === 'mobil' ? 'Mobil' : 'Motor'}
                  </span>
                </div>

                {v.nickname && (
                  <div className="text-[11px] font-extrabold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-200 w-fit flex items-center gap-1">
                    <Sparkles size={11} className="text-purple-600" /> "{v.nickname}"
                  </div>
                )}
              </div>

              {/* Bottom row: Odometer Display & Quick Action Buttons */}
              <div className="pt-3 border-t border-slate-200/80 flex items-center justify-between gap-2">
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full">
                    <input
                      type="number"
                      value={inputKm}
                      onChange={(e) => setInputKm(e.target.value)}
                      className="text-xs py-1.5 px-3 font-mono font-black bg-white text-slate-900 border border-blue-500 rounded-xl w-full focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xs"
                      placeholder="KM Baru..."
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={() => handleSave(v)}
                      disabled={isSubmitting}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shrink-0 cursor-pointer shadow-xs active:scale-95"
                      title="Simpan"
                    >
                      <Check size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={isSubmitting}
                      className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded-xl transition-all shrink-0 cursor-pointer active:scale-95"
                      title="Batal"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-0.5">
                      <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Odometer</p>
                      <AnalogOdometer value={v.current_mileage} size="sm" variant="badge" />
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* View Detail Button */}
                      <button
                        type="button"
                        onClick={() => navigate(`/vehicles/${v.id}`)}
                        className="py-1.5 px-3 bg-white hover:bg-slate-100 text-slate-800 font-extrabold text-xs rounded-xl border border-slate-200 transition-all cursor-pointer flex items-center gap-1 active:scale-95 shadow-2xs"
                        title="Lihat Detail Kendaraan"
                      >
                        <Eye size={13} className="text-slate-500" />
                        <span>Detail</span>
                      </button>

                      {/* Update KM Button */}
                      <button
                        type="button"
                        onClick={() => handleStartEdit(v)}
                        className="py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center gap-1 active:scale-95"
                      >
                        <Edit3 size={13} />
                        <span>Update KM</span>
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
