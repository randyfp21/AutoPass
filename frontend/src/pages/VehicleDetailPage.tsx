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
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { VehicleSummaryBadge } from '../components/vehicle/VehicleSummaryBadge';
import { AddVehicleModal } from '../components/vehicle/AddVehicleModal';
import { ServiceHistoryItem } from '../components/service/ServiceHistoryItem';
import { AddServiceModal } from '../components/service/AddServiceModal';
import { Modal } from '../components/common/Modal';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import type { Vehicle, ServiceRecord } from '../types';
import { formatMileage, formatDate } from '../utils/formatters';

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function HeroSkeleton() {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6">
      <div className="skeleton h-56" />
      <div className="p-6 space-y-4">
        <div className="skeleton h-7 w-48" />
        <div className="skeleton h-5 w-32" />
        <div className="flex gap-2">
          <div className="skeleton h-6 w-20 rounded-full" />
          <div className="skeleton h-6 w-24 rounded-full" />
          <div className="skeleton h-6 w-16 rounded-full" />
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
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle size={40} className="text-red-400 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-slate-800 mb-2">{error}</h2>
          <Button variant="ghost" onClick={() => navigate('/dashboard')} leftIcon={<ArrowLeft size={15} />}>
            Kembali ke Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Back + Action Bar ── */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors group"
          >
            <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
            Kembali
          </button>

          {vehicle && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                leftIcon={<Edit size={14} />}
                onClick={() => setShowEditModal(true)}
              >
                Edit Kendaraan
              </Button>
              <Button
                variant="danger"
                size="sm"
                leftIcon={<Trash2 size={14} />}
                onClick={() => setShowDeleteConfirm(true)}
              >
                Hapus
              </Button>
            </div>
          )}
        </div>

        {/* ── Hero Card ── */}
        {isLoading ? (
          <HeroSkeleton />
        ) : vehicle ? (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
            {/* Vehicle photo / illustration */}
            <div className="h-48 sm:h-64 relative overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
              {vehicle.photo_url ? (
                <img
                  src={vehicle.photo_url}
                  alt={`${vehicle.brand} ${vehicle.model}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-slate-200">
                    <svg viewBox="0 0 200 100" className="w-64 h-32">
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
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-white/40 to-transparent" />
              {/* Category & Fuel Type badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className={`badge ${vehicle.category === 'mobil' ? 'badge-blue' : 'badge-red'}`}>
                  {vehicle.category === 'mobil' ? '🚗 Mobil' : '🏍️ Motor'}
                </span>

                <span
                  className={`badge font-extrabold text-xs py-1 px-3 ${
                    vehicle.fuel_type === 'ev'
                      ? 'bg-emerald-600 text-white border border-emerald-500 shadow-sm'
                      : 'bg-amber-500 text-white border border-amber-400 shadow-sm'
                  }`}
                >
                  {vehicle.fuel_type === 'ev' ? '⚡ Kendaraan Listrik (EV)' : '⛽ Bensin / BBM'}
                </span>
              </div>
            </div>

            {/* Info */}
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
                    {vehicle.brand} {vehicle.model}
                  </h1>
                  {vehicle.variant_type && (
                    <p className="text-slate-500 mt-0.5">{vehicle.variant_type}</p>
                  )}
                </div>
                <span className="license-plate text-lg shrink-0">{vehicle.license_plate}</span>
              </div>

              <div className="mt-4">
                <VehicleSummaryBadge vehicle={vehicle} />
              </div>

              {/* 📜 STNK & Pajak Card */}
              {(vehicle.stnk_number || vehicle.stnk_expiry_date) ? (
                <div className="mt-4 p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs text-amber-900 shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <FileText size={18} className="text-amber-600 shrink-0" />
                    <div>
                      <span className="font-bold text-amber-950">STNK / Registrasi: </span>
                      {vehicle.stnk_number ? (
                        <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-200 mr-2 text-slate-900">
                          {vehicle.stnk_number}
                        </span>
                      ) : (
                        <span className="text-amber-700 italic mr-2">Tidak diisi</span>
                      )}
                      {vehicle.stnk_expiry_date && (
                        <span>
                          Masa Berlaku Pajak: <strong>{formatDate(vehicle.stnk_expiry_date, 'full')}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="font-bold text-amber-700 hover:underline flex items-center gap-1"
                  >
                    <Edit size={12} /> Edit STNK
                  </button>
                </div>
              ) : (
                <div className="mt-4 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <ShieldAlert size={15} className="text-slate-400" />
                    Belum ada data Nomor STNK / Masa Berlaku Pajak
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowEditModal(true)}
                    className="font-bold text-blue-600 hover:underline"
                  >
                    + Tambah STNK
                  </button>
                </div>
              )}

              {/* Stats row */}
              <div className="mt-5 grid grid-cols-3 gap-4 pt-5 border-t border-slate-100">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-blue-600 mb-1">
                    <Gauge size={16} />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{formatMileage(vehicle.current_mileage)}</p>
                  <p className="text-xs text-slate-500">Kilometer</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-slate-400 mb-1">
                    <Calendar size={16} />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{vehicle.manufacture_year}</p>
                  <p className="text-xs text-slate-500">Tahun Produksi</p>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-orange-500 mb-1">
                    <Wrench size={16} />
                  </div>
                  <p className="text-lg font-bold text-slate-900">{serviceHistory.length}</p>
                  <p className="text-xs text-slate-500">Total Servis</p>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* ── Log Service CTA ── */}
        {vehicle && (
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-slate-900">Riwayat Servis</h2>
            <Button
              leftIcon={<Plus size={15} />}
              onClick={() => setShowAddService(true)}
            >
              Log Servis
            </Button>
          </div>
        )}

        {/* ── Service History ── */}
        {historyLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="skeleton h-20 rounded-xl" />
            ))}
          </div>
        ) : serviceHistory.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4">
              <Wrench size={28} className="text-orange-300" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Belum ada riwayat servis</h3>
            <p className="text-slate-500 text-sm mb-6 max-w-xs">
              Catat servis pertama kendaraan ini untuk memulai rekam jejak perawatan
            </p>
            <Button
              leftIcon={<Plus size={15} />}
              onClick={() => setShowAddService(true)}
            >
              Log Servis Pertama
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {serviceHistory.map((record) => (
              <ServiceHistoryItem key={record.id} record={record} />
            ))}
          </div>
        )}
      </div>

      {/* ── Edit Vehicle Modal ── */}
      {vehicle && (
        <AddVehicleModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          initialData={vehicle}
          onSubmit={async (data) => {
            await vehicleService.updateVehicle(vehicle.id, data);
            await fetchVehicle();
          }}
        />
      )}

      {/* ── Add Service Modal ── */}
      {vehicle && (
        <AddServiceModal
          isOpen={showAddService}
          onClose={() => setShowAddService(false)}
          onSubmit={handleAddService}
          vehicleCategory={vehicle.category}
          currentMileage={vehicle.current_mileage}
        />
      )}

      {/* ── Delete Confirm Modal ── */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        title="Hapus Kendaraan"
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-3">
            <Button
              variant="ghost"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button variant="danger" isLoading={isDeleting} onClick={handleDelete}>
              Ya, Hapus
            </Button>
          </div>
        }
      >
        <div className="text-center py-2">
          <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trash2 size={24} className="text-red-500" />
          </div>
          <p className="text-slate-700">
            Apakah Anda yakin ingin menghapus{' '}
            <strong>
              {vehicle?.brand} {vehicle?.model}
            </strong>
            ?
          </p>
          <p className="text-sm text-slate-500 mt-2">
            Semua riwayat servis kendaraan ini juga akan dihapus secara permanen.
          </p>
        </div>
      </Modal>
    </div>
  );
}

export default VehicleDetailPage;
