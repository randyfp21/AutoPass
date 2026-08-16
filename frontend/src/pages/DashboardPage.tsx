import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Car,
  Wrench,
  Calendar,
  TrendingUp,
  AlertCircle,
  Wallet,
  ChevronRight,
  ShieldAlert,
  Edit,
  ArrowUpRight,
  Eye,
  FileText,
  Clock,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ServiceCalendarWidget } from '../components/planner/ServiceCalendarWidget';
import { AddPlannerModal } from '../components/planner/AddPlannerModal';
import { AddVehicleModal } from '../components/vehicle/AddVehicleModal';
import { OdometerSummaryWidget } from '../components/vehicle/OdometerSummaryWidget';
import { Button } from '../components/common/Button';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import { plannerService } from '../services/plannerService';
import type {
  Vehicle,
  ServiceRecord,
  ServicePlanner,
  CreatePlannerData,
  PlannerStatus,
  Workshop,
} from '../types';
import { getGreeting, formatDate, timeAgo, formatRupiah, formatMileage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';
import { AnalogOdometer } from '../components/common/AnalogOdometer';

// ─── STNK Days Calculation Helper ──────────────────────────────────────────────

function getSTNKExpiryStatus(expiryDateStr?: string) {
  if (!expiryDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parts = expiryDateStr.slice(0, 10).split('-').map(Number);
  if (parts.length !== 3) return null;

  const exp = new Date(parts[0], parts[1] - 1, parts[2]);
  exp.setHours(0, 0, 0, 0);

  const diffTime = exp.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return {
    diffDays,
    expDateFormatted: formatDate(expiryDateStr, 'full'),
    isExpired: diffDays < 0,
    isUrgent: diffDays >= 0 && diffDays <= 30,
    isWarning: diffDays > 30 && diffDays <= 90,
  };
}

// ─── Recent Activity Item Component ──────────────────────────────────────────

function RecentActivityItem({
  record,
  vehicleName,
}: {
  record: ServiceRecord;
  vehicleName: string;
}) {
  return (
    <div className="flex items-center justify-between py-3.5 border-b border-slate-100 last:border-0 hover:bg-slate-50/50 px-2 rounded-xl transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0 border border-blue-100/80 shadow-2xs">
          <Wrench size={18} />
        </div>
        <div className="min-w-0">
          <p className="font-extrabold text-xs text-slate-900 truncate">{vehicleName}</p>
          <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
            <span className="font-semibold text-slate-700">
              {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY')}
            </span>
            {' · '}
            <span className="text-slate-400">{timeAgo(record.service_date)}</span>
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-black text-slate-900 font-mono">{formatRupiah(record.total_cost)}</p>
        <span className="text-[10px] font-bold text-blue-600 hover:underline inline-flex items-center gap-0.5 mt-0.5">
          Detail <ChevronRight size={10} />
        </span>
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────────────

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [planners, setPlanners] = useState<ServicePlanner[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [recentServices, setRecentServices] = useState<
    Array<{ record: ServiceRecord; vehicleName: string }>
  >([]);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});
  const [thisMonthSpent, setThisMonthSpent] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [showAddPlanner, setShowAddPlanner] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    setError('');
    try {
      const [vehicleList, plannerList, workshopList] = await Promise.all([
        vehicleService.getVehicles(),
        plannerService.getPlanners(),
        plannerService.getWorkshops().catch(() => []),
      ]);

      setVehicles(vehicleList);
      setPlanners(plannerList);
      setWorkshops(workshopList);

      // Fetch service histories for all vehicles (parallel)
      const histories = await Promise.allSettled(
        vehicleList.map((v) =>
          maintenanceService.getServiceHistory(v.id).then((records) => ({
            vehicleId: v.id,
            vehicleName: `${v.brand} ${v.model}`,
            records,
          }))
        )
      );

      const counts: Record<string, number> = {};
      const allRecords: Array<{ record: ServiceRecord; vehicleName: string }> = [];

      histories.forEach((result) => {
        if (result.status === 'fulfilled') {
          counts[result.value.vehicleId] = result.value.records.length;
          result.value.records.forEach((r) =>
            allRecords.push({ record: r, vehicleName: result.value.vehicleName })
          );
        }
      });

      setServiceCounts(counts);

      // Calculate This Month's Spending
      const parseLocalDate = (dateStr: string) => {
        const parts = dateStr.slice(0, 10).split('-').map(Number);
        if (parts.length === 3) {
          return new Date(parts[0], parts[1] - 1, parts[2]);
        }
        return new Date(dateStr);
      };

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const monthlySum = allRecords
        .filter(({ record }) => {
          const d = parseLocalDate(record.service_date);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
        })
        .reduce((acc, curr) => acc + curr.record.total_cost, 0);

      setThisMonthSpent(monthlySum);

      // Sort by date desc, take top 5
      allRecords.sort(
        (a, b) =>
          new Date(b.record.service_date).getTime() -
          new Date(a.record.service_date).getTime()
      );
      setRecentServices(allRecords.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data dashboard. Pastikan server backend terhubung.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute STNK Expiry Alert Vehicles (<= 90 days or expired)
  const stnkAlertVehicles = vehicles
    .map((v) => ({ vehicle: v, status: getSTNKExpiryStatus(v.stnk_expiry_date) }))
    .filter((item): item is { vehicle: Vehicle; status: NonNullable<ReturnType<typeof getSTNKExpiryStatus>> } =>
      item.status !== null && (item.status.isExpired || item.status.diffDays <= 90)
    );

  const handleCreatePlanner = async (data: CreatePlannerData) => {
    await plannerService.createPlanner(data);
    const updatedPlanners = await plannerService.getPlanners();
    setPlanners(updatedPlanners);
  };

  const handleStatusChangePlanner = async (id: string, newStatus: PlannerStatus) => {
    const target = planners.find((p) => p.id === id);
    if (!target) return;
    await plannerService.updatePlanner(id, {
      title: target.title,
      planned_date: target.planned_date,
      target_mileage: target.target_mileage,
      notes: target.notes,
      status: newStatus,
    });
    const updatedPlanners = await plannerService.getPlanners();
    setPlanners(updatedPlanners);
  };

  const handleDeletePlanner = async (id: string) => {
    await plannerService.deletePlanner(id);
    setPlanners((prev) => prev.filter((p) => p.id !== id));
  };

  const totalServices = Object.values(serviceCounts).reduce((a, b) => a + b, 0);
  const lastServiceDate =
    recentServices[0]?.record.service_date
      ? formatDate(recentServices[0].record.service_date, 'short')
      : '—';

  const stats = [
    {
      label: t('dash_stat_vehicles'),
      value: String(vehicles.length),
      icon: <Car size={20} className="text-blue-600" />,
      bg: 'bg-blue-50',
    },
    {
      label: t('dash_stat_services'),
      value: String(totalServices),
      icon: <Wrench size={20} className="text-orange-600" />,
      bg: 'bg-orange-50',
    },
    {
      label: t('spent_this_month'),
      value: formatRupiah(thisMonthSpent),
      icon: <Wallet size={20} className="text-emerald-600" />,
      bg: 'bg-emerald-50',
      isHighlight: true,
    },
    {
      label: t('dash_stat_last_service'),
      value: lastServiceDate,
      icon: <Calendar size={20} className="text-purple-600" />,
      bg: 'bg-purple-50',
    },
  ];

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* ── 1. Executive Welcome Hero Banner ── */}
        <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 relative overflow-hidden shadow-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Ambient Glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-2">
            <div className="inline-flex items-center gap-2 bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-mono font-extrabold px-3 py-1 rounded-full">
              <span>Passport Digital Kendaraan</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {t('dash_greeting')},{' '}
              <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent">
                {user?.full_name?.split(' ')[0] ?? 'User'} 👋
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium max-w-xl">
              Ringkasan telemetri, monitor Odometer, legalitas pajak STNK, dan kalender perawatan armada Anda
            </p>
          </div>

          <div className="relative z-10 flex flex-wrap items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => setShowAddPlanner(true)}
              className="py-2.5 px-4 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-2 active:scale-95 shadow-sm"
            >
              <Calendar size={16} className="text-blue-400" />
              <span>Buat Rencana Servis</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setEditingVehicle(null);
                setShowAddVehicle(true);
              }}
              className="py-2.5 px-4 bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl shadow-lg shadow-blue-500/25 transition-all cursor-pointer flex items-center gap-2 active:scale-95 border border-blue-400/40"
            >
              <Plus size={16} />
              <span>Tambah Kendaraan</span>
            </button>
          </div>
        </div>

        {/* ── 2. Summary Statistics Row (4 Cards) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={[
                'border rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-2xs hover:shadow-md hover:-translate-y-0.5',
                stat.isHighlight
                  ? 'bg-gradient-to-br from-emerald-50/80 to-white border-emerald-200'
                  : 'bg-white border-slate-200/90',
              ].join(' ')}
            >
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-extrabold truncate">{stat.label}</p>
                <p className="text-lg sm:text-2xl font-black text-slate-900 leading-tight truncate mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── 3. Standalone STNK & Tax Expiry Alert Container ── */}
        {stnkAlertVehicles.length > 0 && (
          <div className="bg-amber-50/70 border border-amber-200/90 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 border-b border-amber-200/60 pb-3">
              <div className="flex items-center gap-2.5">
                <ShieldAlert size={18} className="text-amber-600 shrink-0" />
                <div>
                  <h3 className="font-extrabold text-sm sm:text-base text-slate-900">
                    Masa Berlaku Pajak & STNK
                  </h3>
                  <p className="text-[11px] text-slate-500 font-medium">
                    Pantau jatuh tempo pajak & legalitas dokumen kendaraan Anda
                  </p>
                </div>
              </div>
              <span className="bg-amber-100 text-amber-900 border border-amber-300/80 text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full shrink-0">
                {stnkAlertVehicles.length} Kendaraan
              </span>
            </div>

            {/* Sleek Cards Grid (Exact Layout Per User Request) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {stnkAlertVehicles.map(({ vehicle: v, status: s }) => (
                <div
                  key={v.id}
                  className="bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between gap-3 shadow-2xs hover:border-amber-400 transition-all"
                >
                  {/* Top: License Plate & Vehicle Name */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2.5 py-0.5 rounded border border-amber-400 shadow-2xs shrink-0">
                        {v.license_plate}
                      </span>
                      <span className="font-extrabold text-sm text-slate-900 truncate">
                        {v.brand} {v.model}
                      </span>
                    </div>

                    <span className="text-[10px] font-extrabold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200 shrink-0 capitalize">
                      {v.category}
                    </span>
                  </div>

                  {/* Middle Data Block */}
                  <div className="space-y-2 py-1">
                    {/* Line 1: Jatuh Tempo */}
                    <p className="text-xs text-slate-600 font-medium">
                      Jatuh Tempo: <strong className="font-mono font-extrabold text-slate-900">{s.expDateFormatted}</strong>
                    </p>

                    {/* Line 2 (Baris bawahnya): Urgency Badge */}
                    <div>
                      {s.isExpired ? (
                        <span className="bg-gradient-to-r from-red-600 to-rose-600 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs inline-flex items-center gap-1.5">
                          ⛔ Kadaluarsa {Math.abs(s.diffDays)} hr lalu
                        </span>
                      ) : s.isUrgent ? (
                        <span className="bg-gradient-to-r from-rose-500 to-amber-500 text-white font-extrabold text-xs px-3 py-1 rounded-xl shadow-xs inline-flex items-center gap-1.5">
                          🚨 Sisa {s.diffDays} hr
                        </span>
                      ) : (
                        <span className="bg-gradient-to-r from-amber-400 to-yellow-400 text-slate-950 font-extrabold text-xs px-3 py-1 rounded-xl shadow-2xs inline-flex items-center gap-1.5">
                          ⚠️ Sisa {s.diffDays} hr
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Bottom of card (Paling bawah card): Button Perbarui Data (Kecil) */}
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingVehicle(v);
                        setShowAddVehicle(true);
                      }}
                      className="py-1 px-3 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[11px] rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 w-fit"
                    >
                      <Calendar size={12} />
                      <span>Perbarui Data</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── 4. Standalone Odometer Summary & Quick Update Widget ── */}
        <OdometerSummaryWidget
          vehicles={vehicles}
          onVehicleUpdated={fetchData}
        />

        {/* ── Error Banner ── */}
        {error && (
          <div className="flex items-center gap-2.5 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
            <AlertCircle size={16} className="shrink-0" />
            {error}
            <button
              onClick={fetchData}
              className="ml-auto text-red-600 font-semibold hover:text-red-800 underline"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ── 5. Service Calendar & Scheduler Widget ── */}
        <div>
          <ServiceCalendarWidget
            planners={planners}
            vehicles={vehicles}
            onAddClick={() => setShowAddPlanner(true)}
            onStatusChange={handleStatusChangePlanner}
            onDelete={handleDeletePlanner}
          />
        </div>

        {/* ── 6. Recent Activity Feed ── */}
        <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h3 className="font-extrabold text-slate-900 text-base">Aktivitas Servis Terakhir</h3>
            </div>
            <Link
              to="/spent"
              className="text-xs font-extrabold text-blue-600 hover:underline flex items-center gap-1"
            >
              Lihat Rekap Lengkap & Struk
              <ChevronRight size={14} />
            </Link>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="skeleton h-12 rounded-xl" />
              ))}
            </div>
          ) : recentServices.length === 0 ? (
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-2xl">
              <Wrench size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-700">Belum ada riwayat servis</p>
              <p className="text-xs text-slate-400 mt-1">
                Catatan servis yang selesai akan muncul di sini
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {recentServices.map(({ record, vehicleName }) => (
                <RecentActivityItem
                  key={record.id}
                  record={record}
                  vehicleName={vehicleName}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Add / Edit Vehicle Modal ── */}
      <AddVehicleModal
        isOpen={showAddVehicle}
        onClose={() => {
          setShowAddVehicle(false);
          setEditingVehicle(null);
        }}
        initialData={editingVehicle}
        onSubmit={async (data) => {
          if (editingVehicle) {
            await vehicleService.updateVehicle(editingVehicle.id, data);
          } else {
            await vehicleService.createVehicle(data);
          }
          await fetchData();
        }}
      />

      {/* ── Add Planner Modal ── */}
      {showAddPlanner && (
        <AddPlannerModal
          isOpen={showAddPlanner}
          onClose={() => setShowAddPlanner(false)}
          vehicles={vehicles}
          workshops={workshops}
          onSubmit={handleCreatePlanner}
        />
      )}
    </div>
  );
}

export default DashboardPage;
