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
  ArrowLeft,
  Wind,
  Shield,
  Cog,
  BatteryCharging,
  Fan,
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
    case 'wind':
      return <Wind className={className} />;
    case 'shield':
      return <Shield className={className} />;
    case 'cog':
      return <Cog className={className} />;
    case 'battery':
      return <BatteryCharging className={className} />;
    case 'fan':
      return <Fan className={className} />;
    default:
      return <Wrench className={className} />;
  }
}

// Part Icon Badge with Circular Progress Ring & Status Color
function PartIconBadge({ monitor }: { monitor: VehiclePartMonitor }) {
  const { is_enabled, is_expired, is_urgent, progress_percent, icon_type } = monitor;

  let strokeColor = 'text-emerald-500';
  let iconBgColor = 'bg-emerald-50 text-emerald-600 border-emerald-100';

  if (!is_enabled) {
    strokeColor = 'text-slate-300';
    iconBgColor = 'bg-slate-100 text-slate-400 border-slate-200';
  } else if (is_expired) {
    strokeColor = 'text-red-600';
    iconBgColor = 'bg-red-600 text-white shadow-md shadow-red-500/30 border-red-500 animate-pulse';
  } else if (is_urgent) {
    strokeColor = 'text-rose-500';
    iconBgColor = 'bg-rose-500 text-white shadow-md shadow-rose-500/30 border-rose-400';
  }

  return (
    <div className="relative w-11 h-11 flex items-center justify-center shrink-0">
      {/* Circular Progress Ring Indicator on Icon */}
      <svg className="w-11 h-11 transform -rotate-90 absolute inset-0" viewBox="0 0 36 36">
        <path
          className="text-slate-200/80"
          strokeWidth="3"
          stroke="currentColor"
          fill="none"
          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
        />
        {is_enabled && (
          <path
            className={`${strokeColor} transition-all duration-700 ease-out`}
            strokeDasharray={`${progress_percent}, 100`}
            strokeWidth="3.2"
            strokeLinecap="round"
            stroke="currentColor"
            fill="none"
            d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          />
        )}
      </svg>

      {/* Center Icon Box */}
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center border ${iconBgColor} transition-all duration-300 relative z-10`}
      >
        <PartIcon iconType={icon_type} className="size-3.5" />
      </div>
    </div>
  );
}

// Vehicle Photo Thumbnail component
function VehicleThumbnail({ vehicle, className = 'w-full h-44' }: { vehicle: Vehicle; className?: string }) {
  if (vehicle.photo_url) {
    return (
      <img
        src={vehicle.photo_url}
        alt={`${vehicle.brand} ${vehicle.model}`}
        className={`${className} object-cover rounded-2xl shadow-inner border border-slate-200`}
      />
    );
  }

  return (
    <div
      className={`${className} bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 rounded-2xl flex flex-col items-center justify-center p-4 text-white relative overflow-hidden shadow-inner border border-slate-800`}
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl pointer-events-none" />
      {vehicle.category === 'mobil' ? (
        <Car size={44} className="text-emerald-400 opacity-90 drop-shadow-md mb-1" />
      ) : (
        <Activity size={44} className="text-emerald-400 opacity-90 drop-shadow-md mb-1" />
      )}
      <span className="text-[11px] font-extrabold uppercase font-mono tracking-widest text-emerald-300/90">
        {vehicle.brand} {vehicle.category}
      </span>
    </div>
  );
}

export function VehicleMonitorPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleMonitorsMap, setVehicleMonitorsMap] = useState<Record<string, VehiclePartMonitor[]>>({});
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

  const fetchVehiclesAndSummaries = async () => {
    setIsLoading(true);
    setError('');
    try {
      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);

      // Fetch part monitors for all vehicles to populate card previews
      const map: Record<string, VehiclePartMonitor[]> = {};
      await Promise.all(
        vehicleList.map(async (v) => {
          try {
            const list = await partMonitorService.getPartMonitors(v.id);
            map[v.id] = list;
          } catch {
            map[v.id] = [];
          }
        })
      );
      setVehicleMonitorsMap(map);

      // If a vehicle is currently selected, refresh its monitors
      if (selectedVehicle) {
        const currentTarget = vehicleList.find((v) => v.id === selectedVehicle.id);
        if (currentTarget) {
          setSelectedVehicle(currentTarget);
          setMonitors(map[currentTarget.id] || []);
        } else {
          setSelectedVehicle(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data kendaraan. Silakan periksa koneksi internet Anda.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVehiclesAndSummaries();
  }, []);

  const handleOpenVehicleDetail = async (vehicle: Vehicle) => {
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

  const handleBackToGallery = () => {
    setSelectedVehicle(null);
    fetchVehiclesAndSummaries();
  };

  const handleToggleEnable = async (monitor: VehiclePartMonitor) => {
    if (!selectedVehicle) return;
    const newStatus = !monitor.is_enabled;
    setMonitors((prev) =>
      prev.map((m) => (m.id === monitor.id ? { ...m, is_enabled: newStatus } : m))
    );
    try {
      await partMonitorService.updatePartMonitor(selectedVehicle.id, monitor.id, {
        is_enabled: newStatus,
      });
    } catch {
      if (selectedVehicle) handleOpenVehicleDetail(selectedVehicle);
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

  const urgentCount = monitors.filter((m) => m.is_enabled && (m.is_urgent || m.is_expired)).length;

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── 1. Hero Header Banner ── */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="absolute top-0 right-0 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono font-extrabold px-3 py-1 rounded-full">
              <Activity size={13} />
              <span>Vehicle Service Monitor & Telemetry Parts</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {selectedVehicle
                ? `Telemetri Part: ${selectedVehicle.brand} ${selectedVehicle.model}`
                : 'Pilih Kendaraan Untuk Monitoring Telemetri'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              {selectedVehicle
                ? 'Pantau umur ideal komponen dan kilometer penggantian oli, busi, ban, serta cairan kendaraan.'
                : 'Pilih salah satu kendaraan tersimpan di bawah ini untuk melihat status kesehatan part secara mendalam.'}
            </p>
          </div>

          <div className="relative z-10 flex items-center gap-3 shrink-0">
            {selectedVehicle ? (
              <button
                type="button"
                onClick={handleBackToGallery}
                className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl backdrop-blur-md border border-white/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95"
              >
                <ArrowLeft size={16} />
                <span>Pilih Mobil Lain</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddVehicleModal(true)}
                className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-emerald-400/40"
              >
                <Plus size={16} />
                <span>Tambah Kendaraan Baru</span>
              </button>
            )}
          </div>
        </div>

        {/* ── 2. Loading State ── */}
        {isLoading && (
          <div className="space-y-4">
            <div className="skeleton h-16 rounded-2xl" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-72 rounded-3xl" />
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

        {/* ── 4. STEP 1: VEHICLE SELECTION GALLERY GRID (WHEN NO SPECIFIC VEHICLE IS SELECTED YET) ── */}
        {!isLoading && vehicles.length > 0 && !selectedVehicle && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Daftar Kendaraan Anda ({vehicles.length})</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Klik pada kartu kendaraan untuk melihat detail telemetri & kesehatan part
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vehicles.map((v) => {
                const partList = vehicleMonitorsMap[v.id] || [];
                const enabledParts = partList.filter((m) => m.is_enabled);
                const hasUrgent = enabledParts.some((m) => m.is_urgent || m.is_expired);
                const topParts = enabledParts
                  .sort((a, b) => b.progress_percent - a.progress_percent)
                  .slice(0, 3);

                return (
                  <div
                    key={v.id}
                    onClick={() => handleOpenVehicleDetail(v)}
                    className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-4 hover:shadow-xl hover:border-emerald-400/80 transition-all duration-300 cursor-pointer group flex flex-col justify-between shadow-2xs relative overflow-hidden"
                  >
                    {/* Top Thumbnail Image */}
                    <div className="relative">
                      <VehicleThumbnail vehicle={v} className="w-full h-44" />

                      {/* Floating License Plate & Category Badge */}
                      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                        <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2.5 py-1 rounded-lg border border-amber-400 shadow-md">
                          {v.license_plate}
                        </span>
                        <span className="bg-slate-900/80 backdrop-blur-md text-white font-extrabold text-[10px] uppercase tracking-wider px-2.5 py-1 rounded-lg border border-white/20 shadow-md">
                          {v.category}
                        </span>
                      </div>
                    </div>

                    {/* Vehicle Details */}
                    <div className="space-y-3">
                      <div>
                        <h3 className="font-extrabold text-base text-slate-900 group-hover:text-emerald-700 transition-colors">
                          {v.brand} {v.model}
                        </h3>
                        <p className="text-xs text-slate-500 font-mono font-medium">
                          Odometer: <span className="font-bold text-slate-900">{formatMileage(v.current_mileage)} KM</span>
                        </p>
                      </div>

                      {/* Monitored Parts Progress Preview */}
                      <div className="space-y-2 pt-2 border-t border-slate-100">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-700">Ringkasan Part Telemetri:</span>
                          {hasUrgent ? (
                            <span className="text-rose-600 font-extrabold flex items-center gap-1">
                              <ShieldAlert size={12} />
                              Perlu Perhatian!
                            </span>
                          ) : (
                            <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                              <CheckCircle2 size={12} />
                              Aman
                            </span>
                          )}
                        </div>

                        {topParts.length > 0 ? (
                          <div className="space-y-1.5">
                            {topParts.map((m) => (
                              <div key={m.id} className="space-y-0.5">
                                <div className="flex justify-between text-[10px] font-mono text-slate-600 font-medium">
                                  <span>{m.part_name}</span>
                                  <span>
                                    {formatMileage(m.km_traveled)} / {formatMileage(m.ideal_lifespan_km)} KM
                                  </span>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                                  <div
                                    className={[
                                      'h-full rounded-full transition-all',
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
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">Belum ada part dipantau</p>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA Button */}
                    <div className="pt-2">
                      <div className="w-full py-2.5 px-4 bg-emerald-50 group-hover:bg-emerald-600 text-emerald-700 group-hover:text-white font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-1.5 shadow-2xs border border-emerald-100 group-hover:border-emerald-600">
                        <span>Lihat Telemetri & Detail Part</span>
                        <ChevronRight size={15} />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── 5. STEP 2: VEHICLE DETAIL MONITORING VIEW (WHEN A VEHICLE IS CLICKED) ── */}
        {!isLoading && selectedVehicle && (
          <div className="space-y-8 animate-fade-in">
            {/* Top Navigation Back Bar */}
            <div className="flex items-center justify-between bg-white border border-slate-200/90 rounded-2xl px-5 py-3 shadow-2xs">
              <button
                type="button"
                onClick={handleBackToGallery}
                className="text-xs font-extrabold text-slate-700 hover:text-slate-950 flex items-center gap-2 cursor-pointer transition-colors"
              >
                <ArrowLeft size={16} className="text-emerald-600" />
                <span>← Kembali ke Daftar Semua Kendaraan</span>
              </button>

              <span className="text-xs font-mono font-bold text-slate-400">
                Penyedia Telemetri: AutoPass Passport
              </span>
            </div>

            {/* Selected Vehicle Header Banner */}
            <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-24 h-24 shrink-0 overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
                    <VehicleThumbnail vehicle={selectedVehicle} className="w-full h-full" />
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2.5 py-0.5 rounded border border-amber-400 shadow-2xs">
                        {selectedVehicle.license_plate}
                      </span>
                      <span className="capitalize text-xs font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                        {selectedVehicle.category}
                      </span>
                    </div>

                    <h2 className="font-extrabold text-xl text-slate-900">
                      {selectedVehicle.brand} {selectedVehicle.model}
                    </h2>

                    <p className="text-xs text-slate-500 font-medium">
                      Odometer Jarak Tempuh: <span className="font-mono font-bold text-slate-900">{formatMileage(selectedVehicle.current_mileage)} KM</span>
                    </p>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  {urgentCount > 0 ? (
                    <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-2xs">
                      <ShieldAlert size={18} className="text-rose-600 animate-pulse" />
                      <span>{urgentCount} Part Membutuhkan Penggantian</span>
                    </div>
                  ) : (
                    <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold px-4 py-2.5 rounded-2xl flex items-center gap-2 shadow-2xs">
                      <CheckCircle2 size={18} className="text-emerald-600" />
                      <span>Seluruh Part Dalam Kondisi Optimal</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* 7 Parts Monitoring Section */}
            <div className="space-y-4">
              <div>
                <h3 className="font-extrabold text-base text-slate-900">
                  Daftar Telemetri Part Kendaraan ({monitors.length} Part)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Atur aktif/nonaktifkan pemantauan part atau perbarui tanggal penggantian komponen
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {monitors.map((m) => (
                  <div
                    key={m.id}
                    className={[
                      'border rounded-3xl p-5 space-y-4 transition-all shadow-2xs relative overflow-hidden flex flex-col justify-between',
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
                        <PartIconBadge monitor={m} />
                        <div>
                          <h4 className="font-extrabold text-sm text-slate-900">{m.part_name}</h4>
                          <p className="text-[11px] font-mono font-medium">
                            {m.is_enabled ? (
                              m.is_expired ? (
                                <span className="text-red-600 font-extrabold">⛔ Melebihi Batas Ideal</span>
                              ) : m.is_urgent ? (
                                <span className="text-rose-600 font-extrabold">🚨 Sisa {formatMileage(m.km_remaining)} KM</span>
                              ) : (
                                <span className="text-emerald-600 font-extrabold">Sisa {formatMileage(m.km_remaining)} KM</span>
                              )
                            ) : (
                              <span className="text-slate-400 font-bold">Dinonaktifkan</span>
                            )}
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

                    {/* Middle: Progress Bar & Metrics */}
                    {m.is_enabled ? (
                      <div className="space-y-3 bg-slate-50/80 border border-slate-100 rounded-2xl p-3.5">
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
                      className="w-full py-2.5 px-3 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-extrabold text-xs rounded-xl shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 active:scale-95"
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
          await fetchVehiclesAndSummaries();
        }}
      />
    </div>
  );
}

export default VehicleMonitorPage;
