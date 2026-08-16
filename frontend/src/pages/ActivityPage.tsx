import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Wrench, CheckCircle, Plus, Eye, Receipt, Flame, Filter, ChevronLeft, ChevronRight, AlertTriangle, FileText } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import { plannerService } from '../services/plannerService';
import { AddServiceModal } from '../components/service/AddServiceModal';
import { DigitalReceiptModal } from '../components/service/DigitalReceiptModal';
import { AddPlannerModal } from '../components/planner/AddPlannerModal';
import { AnalogOdometer } from '../components/common/AnalogOdometer';
import { Button } from '../components/common/Button';
import type { Vehicle, ServiceRecord, ServicePlanner, CreateServiceRecordData, Workshop, CreatePlannerData } from '../types';
import { formatRupiah, formatDate, formatMileage } from '../utils/formatters';

const ITEMS_PER_PAGE = 10;

export function ActivityPage() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [planners, setPlanners] = useState<ServicePlanner[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [recordsWithVehicle, setRecordsWithVehicle] = useState<
    Array<{ record: ServiceRecord; vehicle: Vehicle }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Pagination States
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modals state
  const [selectedPlanToComplete, setSelectedPlanToComplete] = useState<{
    plan: ServicePlanner;
    vehicle: Vehicle;
  } | null>(null);

  const [selectedReceipt, setSelectedReceipt] = useState<{
    record: ServiceRecord;
    vehicle: Vehicle;
  } | null>(null);

  const [showAddPlanner, setShowAddPlanner] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [vehicleList, plannerList, workshopList] = await Promise.all([
        vehicleService.getVehicles(),
        plannerService.getPlanners(),
        plannerService.getWorkshops().catch(() => []),
      ]);

      setVehicles(vehicleList);
      setPlanners(plannerList);
      setWorkshops(workshopList);

      const histories = await Promise.all(
        vehicleList.map(async (v) => {
          const recs = await maintenanceService.getServiceHistory(v.id).catch(() => []);
          return recs.map((r) => ({ record: r, vehicle: v }));
        })
      );

      const flattened = histories.flat();
      flattened.sort(
        (a, b) =>
          new Date(b.record.service_date).getTime() -
          new Date(a.record.service_date).getTime()
      );
      setRecordsWithVehicle(flattened);
    } catch (err) {
      console.error('Failed to fetch activity data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute unique month options for filter
  const monthOptions = Array.from(
    new Set(
      recordsWithVehicle.map((r) => {
        const d = new Date(r.record.service_date);
        return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
      })
    )
  );

  // Filter planned (incomplete) items
  const activePlans = planners.filter((p) => p.status === 'planned');

  // Filter completed records by selected month
  const filteredRecords = recordsWithVehicle.filter((r) => {
    if (selectedMonth === 'all') return true;
    const d = new Date(r.record.service_date);
    const monthKey = d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    return monthKey === selectedMonth;
  });

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, recordsWithVehicle.length]);

  // Pagination math
  const totalPages = Math.ceil(filteredRecords.length / ITEMS_PER_PAGE) || 1;
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedRecords = filteredRecords.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  // Submit complete planned service
  const handleCompletePlanSubmit = async (data: CreateServiceRecordData) => {
    if (!selectedPlanToComplete) return;

    const { plan, vehicle } = selectedPlanToComplete;

    // 1. Create service record
    const newRecord = await maintenanceService.createServiceRecord(vehicle.id, data);

    // 2. Mark planner status as completed
    await plannerService.updatePlanner(plan.id, {
      title: plan.title,
      planned_date: plan.planned_date,
      target_mileage: plan.target_mileage,
      status: 'completed',
    });

    setSelectedPlanToComplete(null);
    await fetchData();

    // 3. Open digital receipt
    setSelectedReceipt({ record: newRecord, vehicle });
  };

  const handleCreatePlanner = async (data: CreatePlannerData) => {
    await plannerService.createPlanner(data);
    setShowAddPlanner(false);
    await fetchData();
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8 pb-28">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 shadow-xl border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Calendar size={22} className="text-orange-400" />
            <h1 className="text-xl sm:text-2xl font-black font-tech tracking-wide">
              Riwayat & Aktivitas Servis
            </h1>
          </div>
          <p className="text-xs text-slate-300">
            Jadwal Servis Mendatang & Catatan Riwayat Pemeliharaan Kendaraan
          </p>
        </div>

        <Button
          variant="primary"
          leftIcon={<Plus size={16} />}
          onClick={() => setShowAddPlanner(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-md self-start sm:self-center"
        >
          + Tambah Rencana Servis
        </Button>
      </div>

      {/* ── Main Section: Service Planner List & Completed Feed ── */}
      <div className="space-y-8">
        {/* ── 1. Planned Services (Belum Servis) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              Rencana Servis (Belum Servis)
              {activePlans.length > 0 && (
                <span className="bg-blue-100 text-blue-800 text-xs px-2.5 py-0.5 rounded-full font-bold">
                  {activePlans.length}
                </span>
              )}
            </h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-24 rounded-xl" />
              ))}
            </div>
          ) : activePlans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">Belum ada rencana servis mendatang</p>
              <p className="text-xs text-slate-400 mt-1">
                Buat rencana servis baru agar tidak melewatkan penggantian oli / perawatan rutin.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activePlans.map((plan) => {
                const vehicle = vehicles.find((v) => v.id === plan.vehicle_id);
                if (!vehicle) return null;

                return (
                  <div
                    key={plan.id}
                    className="bg-white border border-slate-200 hover:border-blue-300 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-amber-400">
                          {vehicle.license_plate}
                        </span>
                        <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                          🎯 Target: {formatDate(plan.planned_date, 'full')}
                        </span>
                      </div>

                      <h3 className="font-extrabold text-base text-slate-900">{plan.title}</h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {vehicle.brand} {vehicle.model} · Target Odo: {formatMileage(plan.target_mileage)} km
                      </p>

                      {plan.workshop_name_manual && (
                        <p className="text-xs text-slate-600 mt-2 font-medium">
                          📍 {plan.workshop_name_manual}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-end">
                      <Button
                        variant="primary"
                        size="sm"
                        leftIcon={<CheckCircle size={15} />}
                        onClick={() => setSelectedPlanToComplete({ plan, vehicle })}
                      >
                        Selesaikan Servis
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── 2. Completed Activity Feed & Filter Per Bulan ── */}
        <div className="space-y-4 pt-6 border-t border-slate-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Wrench size={20} className="text-orange-600" />
                Riwayat Aktivitas Servis Selesai
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Riwayat Lengkap Catatan Pemeliharaan Kendaraan Anda
              </p>
            </div>

            {/* Filter Per Bulan Dropdown */}
            {monthOptions.length > 0 && (
              <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-1.5 shadow-2xs">
                <Filter size={14} className="text-slate-400 shrink-0" />
                <span className="text-xs font-bold text-slate-600 shrink-0">Bulan:</span>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="bg-transparent text-xs font-extrabold text-slate-900 focus:outline-none cursor-pointer pr-1"
                >
                  <option value="all">Semua Bulan ({recordsWithVehicle.length})</option>
                  {monthOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-24 rounded-2xl" />
              ))}
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">
                {selectedMonth === 'all'
                  ? 'Belum ada riwayat servis yang tercatat'
                  : `Tidak ada riwayat servis pada bulan ${selectedMonth}`}
              </p>
              {selectedMonth !== 'all' && (
                <button
                  onClick={() => setSelectedMonth('all')}
                  className="text-xs font-bold text-blue-600 underline mt-2 cursor-pointer"
                >
                  Reset Filter Bulan
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {paginatedRecords.map(({ record, vehicle }) => (
                <div
                  key={record.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 hover:border-slate-300 hover:shadow-md transition-all space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                        <CheckCircle size={20} />
                      </div>

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-amber-400 shadow-2xs">
                            {vehicle.license_plate}
                          </span>
                          <h4 className="font-extrabold text-sm text-slate-900 truncate">
                            {vehicle.brand} {vehicle.model}
                          </h4>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-600 flex-wrap">
                          <span>
                            {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY Maintenance')}
                            {' · '}
                            {formatDate(record.service_date, 'full')}
                          </span>
                          <AnalogOdometer value={record.mileage_at_service} size="sm" />
                        </div>

                        <p className="text-xs font-black text-slate-900">
                          Total: {formatRupiah(record.total_cost)}
                        </p>
                      </div>
                    </div>

                    {/* Actions: View Struk Digital + Share Gen Z */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        leftIcon={<Receipt size={14} />}
                        onClick={() => setSelectedReceipt({ record, vehicle })}
                      >
                        Struk Digital
                      </Button>

                      <Button
                        variant="primary"
                        size="sm"
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold border-none shadow-xs"
                        leftIcon={<Flame size={14} />}
                        onClick={() => navigate(`/services/${record.id}/story`)}
                      >
                        ✨ Share Activity
                      </Button>
                    </div>
                  </div>

                  {/* 📜 Keluhan Kendaraan & Catatan Bengkel Box */}
                  {(record.complaints || record.notes) && (
                    <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 text-xs text-slate-700 space-y-1.5 shadow-2xs">
                      {record.complaints && (
                        <div className="flex items-start gap-2">
                          <span className="font-extrabold text-amber-800 bg-amber-100/90 px-2 py-0.5 rounded text-[10px] shrink-0 uppercase tracking-wider flex items-center gap-1">
                            <AlertTriangle size={11} /> Keluhan
                          </span>
                          <p className="text-slate-800 font-medium leading-relaxed">{record.complaints}</p>
                        </div>
                      )}
                      {record.notes && (
                        <div className="flex items-start gap-2">
                          <span className="font-extrabold text-blue-800 bg-blue-100/90 px-2 py-0.5 rounded text-[10px] shrink-0 uppercase tracking-wider flex items-center gap-1">
                            <FileText size={11} /> Catatan Bengkel
                          </span>
                          <p className="text-slate-800 font-medium leading-relaxed">{record.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* ── 3. Pagination Controls (Maksimal 10 Data Per Halaman) ── */}
          {filteredRecords.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-200 text-xs">
              <span className="text-slate-500 font-medium">
                Menampilkan <strong className="text-slate-900 font-bold">{startIndex + 1} - {Math.min(startIndex + ITEMS_PER_PAGE, filteredRecords.length)}</strong> dari <strong className="text-slate-900 font-bold">{filteredRecords.length}</strong> Aktivitas
              </span>

              {filteredRecords.length > ITEMS_PER_PAGE && (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all shadow-2xs"
                  >
                    <ChevronLeft size={14} />
                    <span>Sebelumnya</span>
                  </button>

                  <span className="px-3 py-1.5 font-mono font-bold text-slate-800 bg-slate-100 rounded-xl border border-slate-200">
                    {currentPage} / {totalPages}
                  </span>

                  <button
                    type="button"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 font-bold text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1 transition-all shadow-2xs"
                  >
                    <span>Selanjutnya</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Add Planner Modal */}
      <AddPlannerModal
        isOpen={showAddPlanner}
        onClose={() => setShowAddPlanner(false)}
        vehicles={vehicles}
        workshops={workshops}
        onSubmit={handleCreatePlanner}
      />

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={!!selectedReceipt}
        onClose={() => setSelectedReceipt(null)}
        record={selectedReceipt?.record || null}
        vehicle={selectedReceipt?.vehicle || null}
        onOpenSocialShare={() => {
          if (selectedReceipt) {
            navigate(`/services/${selectedReceipt.record.id}/story`);
          }
        }}
        onDeleteActivity={async (record) => {
          await maintenanceService.deleteServiceRecord(record.vehicle_id, record.id);
          setSelectedReceipt(null);
          await fetchData();
        }}
      />

      {/* Complete Plan Modal with Receipt Upload */}
      {selectedPlanToComplete && (
        <AddServiceModal
          isOpen={!!selectedPlanToComplete}
          onClose={() => setSelectedPlanToComplete(null)}
          vehicles={vehicles}
          initialPlanData={selectedPlanToComplete.plan}
          onSubmit={handleCompletePlanSubmit}
        />
      )}
    </div>
  );
}

export default ActivityPage;
