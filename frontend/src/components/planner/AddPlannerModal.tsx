import React, { useState } from 'react';
import { Calendar, Car, Clock, FileText, AlertCircle, Wrench, Shield, Edit3 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Vehicle, Workshop, CreatePlannerData } from '../../types';

interface AddPlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicles: Vehicle[];
  workshops?: Workshop[];
  onSubmit: (data: CreatePlannerData) => Promise<void>;
  defaultVehicleId?: string;
}

export function AddPlannerModal({
  isOpen,
  onClose,
  vehicles,
  workshops = [],
  onSubmit,
  defaultVehicleId,
}: AddPlannerModalProps) {
  const [vehicleId, setVehicleId] = useState(defaultVehicleId || (vehicles[0]?.id || ''));
  const [title, setTitle] = useState('');
  const [plannedDate, setPlannedDate] = useState('');
  const [targetMileage, setTargetMileage] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Workshop mode: 'official' | 'manual'
  const [workshopMode, setWorkshopMode] = useState<'official' | 'manual'>('manual');
  const [selectedWorkshopId, setSelectedWorkshopId] = useState('');
  const [workshopNameManual, setWorkshopNameManual] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ vehicleId?: string; title?: string; plannedDate?: string }>({});

  // Auto sync vehicleId state when modal opens or when vehicles array is populated
  React.useEffect(() => {
    if (isOpen) {
      if (defaultVehicleId) {
        setVehicleId(defaultVehicleId);
      } else if (vehicles.length > 0) {
        setVehicleId((prev) => (prev && vehicles.some((v) => v.id === prev) ? prev : vehicles[0].id));
      } else {
        setVehicleId('');
      }
    }
  }, [isOpen, vehicles, defaultVehicleId]);

  const validate = () => {
    const errs: { vehicleId?: string; title?: string; plannedDate?: string } = {};
    if (!vehicleId) errs.vehicleId = 'Pilih kendaraan wajib diisi';
    if (!title.trim()) errs.title = 'Judul / agenda servis wajib diisi';
    if (!plannedDate) errs.plannedDate = 'Tanggal rencana servis wajib diisi';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!validate()) return;

    setIsLoading(true);
    try {
      const payload: CreatePlannerData = {
        vehicle_id: vehicleId,
        title: title.trim(),
        planned_date: plannedDate,
        target_mileage: typeof targetMileage === 'number' ? targetMileage : 0,
        notes: notes.trim() ? notes.trim() : undefined,
      };

      if (workshopMode === 'official' && selectedWorkshopId) {
        payload.workshop_id = selectedWorkshopId;
      } else if (workshopMode === 'manual' && workshopNameManual.trim()) {
        payload.workshop_name_manual = workshopNameManual.trim();
      }

      await onSubmit(payload);

      // Reset form
      setTitle('');
      setPlannedDate('');
      setTargetMileage('');
      setNotes('');
      setWorkshopNameManual('');
      setSelectedWorkshopId('');
      onClose();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ??
        'Gagal membuat rencana servis. Coba lagi.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  // Default date suggestion: 1 month from today
  const handleDefaultDateSuggestion = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    setPlannedDate(d.toISOString().split('T')[0]);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="📅 Buat Rencana / Jadwal Servis"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
            <AlertCircle size={15} className="shrink-0" />
            {error}
          </div>
        )}

        {/* Vehicle Select */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Pilih Kendaraan
          </label>
          <div className="relative">
            <Car size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <select
              value={vehicleId}
              onChange={(e) => {
                setVehicleId(e.target.value);
                if (fieldErrors.vehicleId) setFieldErrors((p) => ({ ...p, vehicleId: undefined }));
              }}
              className="input-field pl-10 text-xs font-medium"
            >
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.brand} {v.model} — {v.license_plate} ({v.current_mileage.toLocaleString('id-ID')} km)
                </option>
              ))}
            </select>
          </div>
          {fieldErrors.vehicleId && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.vehicleId}</p>
          )}
        </div>

        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Judul / Agenda Servis
          </label>
          <div className="relative">
            <FileText size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Contoh: Service Rutin 20.000 KM / Ganti Oli Engine"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field pl-10 text-xs"
            />
          </div>
          {fieldErrors.title && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.title}</p>
          )}
        </div>

        {/* Bengkel Selection (Hybrid Workshop) */}
        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
            <span>Pilih Bengkel Yang Dijadwalkan</span>
            <span className="text-[11px] font-normal text-slate-500">Resmi vs Manual/DIY</span>
          </label>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setWorkshopMode('official')}
              className={[
                'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all',
                workshopMode === 'official'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
              ].join(' ')}
            >
              <Shield size={14} />
              Bengkel Terdaftar
            </button>

            <button
              type="button"
              onClick={() => setWorkshopMode('manual')}
              className={[
                'flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all',
                workshopMode === 'manual'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100',
              ].join(' ')}
            >
              <Wrench size={14} />
              Bengkel Custom / DIY
            </button>
          </div>

          {/* Mode Official: Dropdown workshops */}
          {workshopMode === 'official' && (
            <div>
              {workshops.length === 0 ? (
                <div className="text-xs text-slate-500 py-1.5 bg-amber-50 border border-amber-200 rounded-lg px-2.5">
                  Belum ada bengkel resmi terdaftar di sistem. Menggunakan mode manual.
                </div>
              ) : (
                <div className="relative">
                  <Shield size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <select
                    value={selectedWorkshopId}
                    onChange={(e) => setSelectedWorkshopId(e.target.value)}
                    className="input-field pl-10 text-xs font-medium bg-white"
                  >
                    <option value="">-- Pilih Bengkel Resmi Terdaftar --</option>
                    {workshops.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.is_verified ? '✓ ' : ''}{w.workshop_name} ({w.address || 'Alamat N/A'})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Mode Manual: Text input */}
          {workshopMode === 'manual' && (
            <div className="relative">
              <Edit3 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nama bengkel (contoh: Bengkel AHASS Radio Dalam / DIY Garasi)"
                value={workshopNameManual}
                onChange={(e) => setWorkshopNameManual(e.target.value)}
                className="input-field pl-10 text-xs bg-white"
              />
            </div>
          )}
        </div>

        {/* Planned Date */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs font-semibold text-slate-700">
              Rencana Tanggal Servis
            </label>
            <div className="flex gap-1.5 text-[11px]">
              <button
                type="button"
                onClick={() => handleDefaultDateSuggestion(7)}
                className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
              >
                +1 Mgg
              </button>
              <button
                type="button"
                onClick={() => handleDefaultDateSuggestion(30)}
                className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
              >
                +1 Bln
              </button>
              <button
                type="button"
                onClick={() => handleDefaultDateSuggestion(90)}
                className="text-blue-600 hover:bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
              >
                +3 Bln
              </button>
            </div>
          </div>
          <div className="relative">
            <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className="input-field pl-10 text-xs"
            />
          </div>
          {fieldErrors.plannedDate && (
            <p className="mt-1 text-xs text-red-600">{fieldErrors.plannedDate}</p>
          )}
        </div>

        {/* Target Mileage (Optional) */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Odometer (Opsional)
          </label>
          <div className="relative">
            <Clock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="number"
              placeholder="Contoh: 25000 (Target KM saat hendak servis)"
              value={targetMileage}
              onChange={(e) => setTargetMileage(e.target.value ? Number(e.target.value) : '')}
              className="input-field pl-10 text-xs"
            />
          </div>
        </div>

        {/* Notes / Keperluan */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Catatan Keperluan / Detail Perbaikan
          </label>
          <textarea
            rows={3}
            placeholder="Tuliskan keluhan atau hal yang perlu diganti... (contoh: Ada bunyi decit di rem depan, oli pake Shell Helix Ultra 5W-30, air radiator top up)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="input-field text-xs"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="ghost" size="md" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isLoading}>
            Simpan Jadwal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
