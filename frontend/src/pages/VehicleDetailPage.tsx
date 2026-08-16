import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Gauge,
  Calendar,
  Edit,
  Trash2,
  Plus,
  Wrench,
  AlertCircle,
  ShieldAlert,
  FileText,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { AddVehicleModal } from '../components/vehicle/AddVehicleModal';
import { ServiceHistoryItem } from '../components/service/ServiceHistoryItem';
import { AddServiceModal } from '../components/service/AddServiceModal';
import { Modal } from '../components/common/Modal';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import type { Vehicle, ServiceRecord } from '../types';
import { formatMileage, formatDate } from '../utils/formatters';
import { AnalogOdometer } from '../components/common/AnalogOdometer';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden mb-6 shadow-sm">
      <div className="skeleton h-64" />
      <div className="p-6 space-y-4">
        <div className="skeleton h-8 w-56 rounded-xl" />
        <div className="skeleton h-5 w-36 rounded-lg" />
        <div className="grid grid-cols-3 gap-4 pt-4">
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
          <div className="skeleton h-20 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VehicleDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [serviceHistory, setServiceHistory] = useState<ServiceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [error, setError] = useState('');

  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddService, setShowAddService] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchVehicle = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    try {
      const v = await vehicleService.getVehicleById(id);
      setVehicle(v);
    } catch {
      setError('Kendaraan tidak ditemukan');
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const fetchHistory = useCallback(async () => {
    if (!id) return;
    setHistoryLoading(true);
    try {
      const records = await maintenanceService.getServiceHistory(id);
      records.sort(
        (a, b) =>
          new Date(b.service_date).getTime() - new Date(a.service_date).getTime()
      );
      setServiceHistory(records);
    } catch {
      // Silently fail — show empty state
    } finally {
      setHistoryLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchVehicle();
    fetchHistory();
  }, [fetchVehicle, fetchHistory]);

  const handleDelete = async () => {
    if (!id) return;
    setIsDeleting(true);
    try {
      await vehicleService.deleteVehicle(id);
      navigate('/dashboard', { replace: true });
    } catch {
      setIsDeleting(false);
    }
  };

  const handleAddService = async (data: Parameters<typeof maintenanceService.createServiceRecord>[1]) => {
    if (!id) return;
    await maintenanceService.createServiceRecord(id, data);
    await fetchHistory();
    await fetchVehicle(); // Refresh mileage
  };

  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-sm bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <AlertCircle size={44} className="text-red-500 mx-auto mb-3" />
          <h2 className="text-lg font-extrabold text-slate-800 mb-2">{error}</h2>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft size={15} />}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 pb-28">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Top Navigation & Action Bar ── */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3.5 py-2 rounded-full shadow-2xs transition-all hover:bg-slate-100 cursor-pointer"
          >
            <ArrowLeft size={15} />
            <span>Kembali</span>
          </button>

          {vehicle && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowEditModal(true)}
                className="py-2 px-3.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-blue-200 transition-all cursor-pointer"
              >
                <Edit size={14} />
                <span>Edit Data</span>
              </button>

              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="py-2 px-3.5 bg-red-50 text-red-700 hover:bg-red-100 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-red-200 transition-all cursor-pointer"
              >
                <Trash2 size={14} />
                <span>Hapus</span>
              </button>
            </div>
          )}
        </div>

        {/* ── Hero Card Component ── */}
        {isLoading ? (
          <HeroSkeleton />
        ) : vehicle ? (
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
            {/* Media Banner */}
            <div className="h-60 sm:h-72 relative overflow-hidden bg-slate-950">
              {vehicle.photo_url ? (
                <img
                  src={vehicle.photo_url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-950 flex items-center justify-center p-12">
                  <div className="w-64 h-32 opacity-80">
                    <svg viewBox="0 0 200 100" className="w-full h-full">
                      {vehicle.category === 'mobil' ? (
                        <>
                          <rect x="20" y="45" width="160" height="38" fill="#CBD5E1" rx="8" />
                          <path d="M60 45 L75 20 L125 20 L145 45Z" fill="#94A3B8" />
                          <circle cx="55" cy="83" r="13" fill="#64748B" />
                          <circle cx="145" cy="83" r="13" fill="#64748B" />
                          <circle cx="55" cy="83" r="5" fill="#CBD5E1" />
                          <circle cx="145" cy="83" r="5" fill="#CBD5E1" />
                        </>
                      ) : (
                        <>
                          <circle cx="55" cy="78" r="18" fill="#64748B" />
                          <circle cx="148" cy="78" r="18" fill="#64748B" />
                          <path d="M55 60 L80 36 L130 36 L148 60" stroke="#94A3B8" strokeWidth="8" strokeLinecap="round" fill="none" />
                          <rect x="78" y="50" width="44" height="24" fill="#94A3B8" rx="5" />
                        </>
                      )}
                    </svg>
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/30 to-transparent" />

              {/* Glassmorphism Badges Bar */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="px-3.5 py-1 rounded-full text-xs font-extrabold backdrop-blur-md bg-slate-900/80 text-white border border-white/20 shadow-xs">
                  {vehicle.category === 'mobil' ? '🚗 Mobil' : '🏍️ Motor'}
                </span>

                <span
                  className={`px-3.5 py-1 rounded-full text-xs font-extrabold backdrop-blur-md border shadow-xs ${
                    vehicle.fuel_type === 'ev'
                      ? 'bg-emerald-600/90 text-white border-emerald-400/40'
                      : 'bg-amber-500/90 text-white border-amber-400/40'
                  }`}
                >
                  {vehicle.fuel_type === 'ev' ? '⚡ Kendaraan Listrik (EV)' : '⛽ Bensin / BBM'}
                </span>
              </div>

              {/* Hero Title & Plate inside Image */}
              <div className="absolute bottom-4 left-5 right-5 flex items-end justify-between">
                <div>
                  {vehicle.nickname && (
                    <span className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 bg-slate-900/80 backdrop-blur-md px-3 py-1 rounded-md border border-amber-400/30 mb-1.5">
                      <Sparkles size={12} className="text-amber-400" />
                      "{vehicle.nickname}"
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-3xl font-black text-white font-tech tracking-wide leading-tight drop-shadow-md">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  {vehicle.variant_type && (
                    <p className="text-xs sm:text-sm text-slate-300 font-semibold mt-0.5">{vehicle.variant_type}</p>
                  )}
                </div>

                <div className="bg-amber-400 text-slate-950 font-black font-mono tracking-widest text-sm sm:text-base px-3.5 py-1.5 rounded-xl border-2 border-slate-950 shadow-lg shrink-0">
                  {vehicle.license_plate}
                </div>
              </div>
            </div>

            {/* Content Details & Specs Section */}
            <div className="p-5 sm:p-6 space-y-6">
              {/* 📜 STNK & Pajak Info Banner */}
              {(vehicle.stnk_number || vehicle.stnk_expiry_date) ? (
                <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-500 text-white rounded-xl flex items-center justify-center shrink-0 shadow-xs">
                      <FileText size={20} />
                    </div>
                    <div>
                      <p className="font-extrabold text-slate-900">STNK & Pajak Kendaraan</p>
                      <div className="flex items-center gap-3 mt-0.5 text-[11px]">
                        {vehicle.stnk_number && (
                          <span>
                            No. STNK: <strong className="font-mono font-bold text-amber-900 bg-white px-1.5 py-0.5 rounded border border-amber-200">{vehicle.stnk_number}</strong>
                          </span>
                        )}
                        {vehicle.stnk_expiry_date && (
                          <span>
                            Jatuh Tempo Pajak: <strong>{formatDate(vehicle.stnk_expiry_date, 'full')}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="font-extrabold text-amber-700 hover:text-amber-900 flex items-center gap-1 bg-white px-3 py-1.5 rounded-xl border border-amber-300 shadow-2xs cursor-pointer"
                  >
                    <Edit size={13} /> Edit STNK
                  </button>
                </div>
              ) : (
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs text-slate-600">
                  <span className="flex items-center gap-2 font-medium">
                    <ShieldAlert size={16} className="text-amber-500 shrink-0" />
                    Belum ada data Nomor STNK atau Masa Berlaku Pajak
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="font-extrabold text-purple-600 hover:text-purple-700 bg-purple-50 px-3 py-1 rounded-xl border border-purple-200 cursor-pointer"
                  >
                    + Tambah STNK
                  </button>
                </div>
              )}

              {/* 📊 3-Column Spec Cards Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 text-center space-y-1.5 flex flex-col items-center justify-center">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <Gauge size={18} />
                  </div>
                  <AnalogOdometer value={vehicle.current_mileage} size="md" />
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Odometer</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 mx-auto flex items-center justify-center">
                    <Calendar size={18} />
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-900">{vehicle.manufacture_year}</p>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Tahun Produksi</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 text-center space-y-1">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <Wrench size={18} />
                  </div>
                  <p className="text-sm sm:text-base font-black text-slate-900">{serviceHistory.length}</p>
                  <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Total Servis</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Service History Section ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-slate-900 font-tech tracking-tight flex items-center gap-2">
                <Wrench size={20} className="text-purple-600" />
                Riwayat & Log Servis
              </h2>
              <p className="text-xs text-slate-500 font-medium">Catatan perawatan digital kendaraan Anda</p>
            </div>

            <button
              onClick={() => setShowAddService(true)}
              className="py-2.5 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Catat Servis Baru</span>
            </button>
          </div>

          {historyLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          ) : serviceHistory.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center space-y-2">
              <CheckCircle2 size={40} className="mx-auto text-slate-300 mb-2" />
              <h3 className="font-extrabold text-slate-800 text-sm">Belum Ada Catatan Servis</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed font-medium">
                Klik tombol <strong>Catat Servis Baru</strong> di atas untuk menyimpan nota, bengkel, suku cadang, dan foto struk servis pertama kendaraan ini.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceHistory.map((record) => (
                <ServiceHistoryItem key={record.id} record={record} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {vehicle && (
        <AddVehicleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSubmit={async (data) => {
            await vehicleService.updateVehicle(vehicle.id, data);
            await fetchVehicle();
          }}
          initialData={vehicle}
        />
      )}

      {vehicle && (
        <AddServiceModal
          isOpen={showAddService}
          onClose={() => setShowAddService(false)}
          onSubmit={handleAddService}
          vehicleCategory={vehicle.category}
          currentMileage={vehicle.current_mileage}
        />
      )}

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Hapus Kendaraan"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed font-medium">
            Apakah Anda yakin ingin menghapus <strong>{vehicle?.brand} {vehicle?.model} ({vehicle?.license_plate})</strong>? Seluruh riwayat servis terkait kendaraan ini juga akan terhapus.
          </p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} disabled={isDeleting}>
              Batal
            </Button>
            <Button variant="danger" onClick={handleDelete} isLoading={isDeleting}>
              Ya, Hapus
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default VehicleDetailPage;
