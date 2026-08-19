import React, { useState, useEffect } from 'react';
import {
  Car,
  Wrench,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Activity,
  ChevronRight,
  RefreshCw,
  Sliders,
  ShieldAlert,
  Zap,
  Filter,
  Circle,
  Droplet,
  Thermometer,
  RotateCcw,
} from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { partMonitorService } from '../services/partMonitorService';
import type { Vehicle, VehiclePartMonitor } from '../types';
import { formatMileage, formatDate } from '../utils/formatters';
import { AddVehicleModal } from '../components/vehicle/AddVehicleModal';

// Helper to map part icon string to Lucide icon component
function PartIcon({ iconType, className = 'size-5' }: { iconType: string; className?: string }) {
  switch (iconType) {
    case 'oil':
      return <Droplet className={className} />;
    case 'zap':
      return <Zap className={className} />;
    case 'filter':
      return <Filter className={className} />;
    case 'circle':
      return <Circle className={className} />;
    case 'droplet':
      return <Droplet className={className} />;
    case 'activity':
      return <Activity className={className} />;
    case 'thermometer':
      return <Thermometer className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

export function VehicleMonitorPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [monitors, setMonitors] = useState<VehiclePartMonitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Modals
  const [showAddVehicleModal, setShowAddVehicleModal] = useState(false);
  const [showReplaceModal, setShowReplaceModal] = useState<VehiclePartMonitor | null>(null);
  const [replaceMileage, setReplaceMileage] = useState<number>(0);
  const [isReplacing, setIsReplacing] = useState(false);

  // Edit Ideal Lifespan State
  const [editingLifespanId, setEditingLifespanId] = useState<string | null>(null);
  const [customLifespanInput, setCustomLifespanInput] = useState<number>(4000);

  const fetchVehiclesAndMonitors = async () => {
    setIsLoading(true);
    setError('');
    try {
      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);

      if (vehicleList.length > 0) {
        const target = selectedVehicle
          ? vehicleList.find((v) => v.id === selectedVehicle.id) || vehicleList[0]
          : vehicleList[0];

        setSelectedVehicle(target);
        const partList = await partMonitorService.getPartMonitors(target.id);
        setMonitors(partList);
      } else {
        setSelectedVehicle(null);
        setMonitors([]);
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data part monitor kendaraan. Silakan periksa koneksi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesAndMonitors();
  }, []);

  const handleSelectVehicle = async (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsLoading(true);
    try {
      const partList = await partMonitorService.getPartMonitors(vehicle.id);
      setMonitors(partList);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleEnable = async (monitor: VehiclePartMonitor) => {
    if (!selectedVehicle) return;
    const newStatus = !monitor.is_enabled;
    // Optimistic UI update
    setMonitors((prev) =>
      prev.map((m) => (m.id === monitor.id ? { ...m, is_enabled: newStatus } : m))
    );
    try {
      await partMonitorService.updatePartMonitor(selectedVehicle.id, monitor.id, {
        is_enabled: newStatus,
      });
    } catch {
      fetchVehiclesAndMonitors();
    }
  };

  const handleSaveLifespan = async (monitorId: string) => {
    if (!selectedVehicle || customLifespanInput <= 0) return;
    try {
      await partMonitorService.updatePartMonitor(selectedVehicle.id, monitorId, {
        ideal_lifespan_km: customLifespanInput,
      });
      setEditingLifespanId(null);
      const updated = await partMonitorService.getPartMonitors(selectedVehicle.id);
      setMonitors(updated);
    } catch (err) {
      console.error(err);
    }
  };

  const handleConfirmReplacePart = async () => {
    if (!selectedVehicle || !showReplaceModal) return;
    setIsReplacing(true);
    try {
      await partMonitorService.replacePart(selectedVehicle.id, showReplaceModal.id, {
        mileage: replaceMileage > 0 ? replaceMileage : selectedVehicle.current_mileage,
      });
      setShowReplaceModal(null);
      const updated = await partMonitorService.getPartMonitors(selectedVehicle.id);
      setMonitors(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setIsReplacing(false);
    }
  };

  // Compute urgent parts count across selected vehicle
  const urgentCount = monitors.filter((m) => m.is_enabled && (m.is_urgent || m.is_expired)).length;

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── 1. Hero Header ── */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-extrabold px-3 py-1 rounded-full">
              <Activity size={13} />
              <span>Vehicle Service Monitor & Telemetry Parts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Monitor Komponen & Telemetri Armada
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              Pantau batas jarak tempuh ideal oli, busi, ban, dan komponen vital kendaraan Anda secara otomatis berdasar Odometer.
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-emerald-400/40"
            >
              <Plus size={16} />
              <span>Tambah Kendaraan Baru</span>
            </button>
          </div>
        </div>

        {/* ── 2. Loading State ── */}
        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-16 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-56 rounded-3xl" />
              ))}
            </div>
          </div>
        )}

        {/* ── 3. Empty State (NO VEHICLES IN DATABASE) ── */}
        {!isLoading && vehicles.length === 0 && (
          <div className="bg-white border border-slate-200/90 rounded-3xl p-12 text-center space-y-4 shadow-2xs max-w-2xl mx-auto my-8">
            <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto border border-emerald-100 shadow-2xs">
              <Car size={32} />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-extrabold text-slate-900">Belum Ada Data Kendaraan</h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                Tambahkan kendaraan pertama Anda ke database untuk mulai memantau masa pakai oli, busi, ban, dan telemetri komponen kendaraan secara otomatis.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowAddVehicleModal(true)}
              className="py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all cursor-pointer inline-flex items-center gap-2 active:scale-95"
            >
              <Plus size={16} />
              <span>Tambah Kendaraan Baru Sekarang</span>
            </button>
          </div>
        )}

        {/* ── 4. Main Vehicle Service Monitor (WHEN VEHICLES EXIST) ── */}
        {!isLoading && vehicles.length > 0 && selectedVehicle && (
          <div className="space-y-8">
            {/* Vehicle Selector Tabs Row */}
            <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
              {vehicles.map((v) => {
                const isSelected = v.id === selectedVehicle.id;
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => handleSelectVehicle(v)}
                    className={[
                      'px-4 py-3 rounded-2xl border transition-all cursor-pointer shrink-0 flex items-center gap-3 text-left shadow-2xs',
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-md scale-102'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50',
                    ].join(' ')}
                  >
                    <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2 py-0.5 rounded border border-amber-400">
                      {v.license_plate}
                    </span>
                    <div>
                      <p className="font-extrabold text-xs truncate max-w-[120px]">
                        {v.brand} {v.model}
                      </p>
                      <p className="text-[10px] opacity-75 font-mono">
                        {formatMileage(v.current_mileage)} KM
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Vehicle Overview Card with Top 3 Monitored Parts */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0 shadow-2xs">
                    <Car size={24} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2.5 py-0.5 rounded border border-amber-400 shadow-2xs">
                        {selectedVehicle.license_plate}
                      </span>
                      <h2 className="font-extrabold text-lg text-slate-900">
                        {selectedVehicle.brand} {selectedVehicle.model}
                      </h2>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Kategori: <span className="capitalize font-bold text-slate-700">{selectedVehicle.category}</span>
                      {' · '}Odometer Saat Ini: <span className="font-mono font-bold text-slate-900">{formatMileage(selectedVehicle.current_mileage)} KM</span>
                    </p>
                  </div>
                </div>

                {urgentCount > 0 ? (
                  <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shrink-0">
                    <ShieldAlert size={16} className="text-rose-600 animate-pulse" />
                    <span>{urgentCount} Part Membutuhkan Perhatian Mendasar</span>
                  </div>
                ) : (
                  <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-3.5 py-2 rounded-xl flex items-center gap-2 shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-600" />
                    <span>Seluruh Part Dalam Kondisi Baik</span>
                  </div>
                )}
              </div>

              {/* 🏆 Top 3 Monitored Parts Summary (Per User Directive) */}
              <div className="space-y-3">
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-2">
                  <Activity size={16} className="text-emerald-600" />
                  <span>Ringkasan 3 Part Utama Ter-Monitor:</span>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                  {monitors
                    .filter((m) => m.is_enabled)
                    .sort((a, b) => b.progress_percent - a.progress_percent)
                    .slice(0, 3)
                    .map((m) => (
                      <div
                        key={m.id}
                        className="bg-slate-50/80 border border-slate-200/80 rounded-2xl p-4 space-y-2.5 shadow-2xs"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 bg-white text-emerald-600 rounded-lg flex items-center justify-center border border-slate-200/80 shadow-2xs">
                              <PartIcon iconType={m.icon_type} className="size-4" />
                            </div>
                            <span className="font-extrabold text-xs text-slate-900 truncate">
                              {m.part_name}
                            </span>
                          </div>

                          {m.is_expired ? (
                            <span className="bg-red-600 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                              ⛔ Ganti!
                            </span>
                          ) : m.is_urgent ? (
                            <span className="bg-rose-500 text-white font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                              🚨 Sisa {formatMileage(m.km_remaining)} KM
                            </span>
                          ) : (
                            <span className="bg-emerald-100 text-emerald-800 font-extrabold text-[10px] px-2 py-0.5 rounded-full">
                              ✅ Good
                            </span>
                          )}
                        </div>

                        <div className="space-y-1">
                          <div className="flex justify-between text-[11px] font-mono text-slate-600">
                            <span>{formatMileage(m.km_traveled)} KM</span>
                            <span>{formatMileage(m.ideal_lifespan_km)} KM</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                              className={[
                                'h-full transition-all duration-500 rounded-full',
                                m.is_expired
                                  ? 'bg-red-600'
                                  : m.is_urgent
                                  ? 'bg-rose-500'
                                  : 'bg-emerald-500',
                              ].join(' ')}
                              style={{ width: `${m.progress_percent}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Full 7-Parts Detailed Monitoring Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900">
                    Daftar Lengkap Telemetri Component & Part ({monitors.length} Part)
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    Aktifkan atau non-aktifkan pemantauan part serta perbarui kilometer penggantian secara langsung
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {monitors.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      'border rounded-3xl p-5 space-y-4 transition-all shadow-2xs relative overflow-hidden',
                      m.is_enabled
                        ? m.is_expired
                          ? 'bg-red-50/40 border-red-200'
                          : m.is_urgent
                          ? 'bg-rose-50/30 border-rose-200'
                          : 'bg-white border-slate-200/90'
                        : 'bg-slate-100/60 border-slate-200 opacity-60',
                    ].join(' ')}
                  >
                    {/* Header: Icon, Name & Toggle Switch */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={[
                            'w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border shadow-2xs',
                            m.is_expired
                              ? 'bg-red-600 text-white border-red-500'
                              : m.is_urgent
                              ? 'bg-rose-500 text-white border-rose-400'
                              : 'bg-emerald-50 text-emerald-600 border-emerald-100',
                          ].join(' ')}
                        >
                          <PartIcon iconType={m.icon_type} className="size-5" />
                        </div>
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{m.part_name}</h4>
                          <p className="text-[11px] text-slate-500 font-mono font-medium">
                            Status: {m.is_enabled ? 'Dipantau' : 'Dinonaktifkan'}
                          </p>
                        </div>
                      </div>

                      {/* Enable / Disable Toggle Switch */}
                      <button
                        type="button"
                        onClick={() => handleToggleEnable(m)}
                        className={[
                          'w-11 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer shrink-0 border',
                          m.is_enabled ? 'bg-emerald-600 border-emerald-700' : 'bg-slate-300 border-slate-400',
                        ].join(' ')}
                        title={m.is_enabled ? 'Nonaktifkan Monitor' : 'Aktifkan Monitor'}
                      >
                        <div
                          className={[
                            'w-5 h-5 rounded-full bg-white shadow-xs transition-transform transform',
                            m.is_enabled ? 'translate-x-5' : 'translate-x-0',
                          ].join(' ')}
                        />
                      </button>
                    </div>

                    {/* Middle: Progress Bar & Metrics (When Enabled) */}
                    {m.is_enabled ? (
                      <div className="space-y-3 bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5">
                        {/* Status Badge Alert */}
                        <div>
                          {m.is_expired ? (
                            <div className="bg-red-600 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs inline-flex items-center gap-1.5">
                              ⛔ PAJAK/UMUR HABIS (GANTI SEKARANG!)
                            </div>
                          ) : m.is_urgent ? (
                            <div className="bg-rose-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs inline-flex items-center gap-1.5">
                              🚨 SISA {formatMileage(m.km_remaining)} KM LAGI
                            </div>
                          ) : (
                            <div className="bg-emerald-100 text-emerald-900 font-extrabold text-xs px-3 py-1 rounded-xl border border-emerald-200 inline-flex items-center gap-1.5">
                              ✅ Kondisi Baik (Sisa {formatMileage(m.km_remaining)} KM)
                            </div>
                          )}
                        </div>

                        {/* Visual Progress Bar */}
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs font-mono font-bold text-slate-700">
                            <span>Ditempuh: {formatMileage(m.km_traveled)} KM</span>
                            <span>Ideal: {formatMileage(m.ideal_lifespan_km)} KM</span>
                          </div>
                          <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden border border-slate-300/40">
                            <div
                              className={[
                                'h-full transition-all duration-500 rounded-full',
                                m.is_expired
                                  ? 'bg-red-600'
                                  : m.is_urgent
                                  ? 'bg-rose-500'
                                  : 'bg-emerald-500',
                              ].join(' ')}
                              style={{ width: `${m.progress_percent}%` }}
                            />
                          </div>
                        </div>

                        {/* Editable Ideal Lifespan KM */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                          <span>Batas Ideal Kilometernya:</span>
                          {editingLifespanId === m.id ? (
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                value={customLifespanInput}
                                onChange={(e) => setCustomLifespanInput(Number(e.target.value))}
                                className="w-20 px-2 py-0.5 bg-white border border-slate-300 rounded text-xs font-mono text-slate-900"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveLifespan(m.id)}
                                className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold"
                              >
                                Simpan
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingLifespanId(m.id);
                                setCustomLifespanInput(m.ideal_lifespan_km);
                              }}
                              className="font-mono font-bold text-slate-800 hover:text-emerald-600 hover:underline flex items-center gap-1 cursor-pointer"
                            >
                              <span>{formatMileage(m.ideal_lifespan_km)} KM</span>
                              <Sliders size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-slate-400 italic">
                        Pemantauan part ini sedang dinonaktifkan
                      </div>
                    )}

                    {/* Bottom Action: Replace / Reset Part Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowReplaceModal(m);
                        setReplaceMileage(selectedVehicle.current_mileage);
                      }}
                      disabled={!m.is_enabled}
                      className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
                    >
                      <RotateCcw size={13} />
                      <span>Perbarui / Ganti Component</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Replace Part Modal ── */}
      {showReplaceModal && selectedVehicle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center border border-emerald-100">
                <PartIcon iconType={showReplaceModal.icon_type} className="size-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Perbarui Penggantian {showReplaceModal.part_name}
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedVehicle.brand} {selectedVehicle.model} ({selectedVehicle.license_plate})
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Tindakan ini akan mengeset ulang jarak tempuh terakhir penggantian menjadi Odometer saat ini sehingga indikator progress bar kembali ke 0%.
              </p>

              <div>
                <label className="block text-xs font-extrabold text-slate-700 mb-1">
                  Kilometer Penggantian (KM):
                </label>
                <input
                  type="number"
                  value={replaceMileage}
                  onChange={(e) => setReplaceMileage(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowReplaceModal(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleConfirmReplacePart}
                disabled={isReplacing}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
              >
                {isReplacing ? 'Memproses...' : 'Konfirmasi Penggantian'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Vehicle Modal ── */}
      <AddVehicleModal
        isOpen={showAddVehicleModal}
        onClose={() => setShowAddVehicleModal(false)}
        onSubmit={async (data) => {
          await vehicleService.createVehicle(data);
          setShowAddVehicleModal(false);
          await fetchVehiclesAndMonitors();
        }}
      />
    </div>
  );
}

export default VehicleMonitorPage;
