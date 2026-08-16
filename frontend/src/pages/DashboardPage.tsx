import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Car, Wrench, Calendar, TrendingUp, AlertCircle, Wallet, ChevronRight, ShieldAlert, Edit } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ServiceCalendarWidget } from '../components/planner/ServiceCalendarWidget';
import { AddPlannerModal } from '../components/planner/AddPlannerModal';
import { AddVehicleModal } from '../components/vehicle/AddVehicleModal';
import { OdometerSummaryWidget } from '../components/vehicle/OdometerSummaryWidget';
import { Button } from '../components/common/Button';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import { plannerService } from '../services/plannerService';
import type { Vehicle, ServiceRecord, ServicePlanner, CreatePlannerData, PlannerStatus, Workshop } from '../types';
import { getGreeting, formatDate, timeAgo, formatRupiah } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

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
    <div className="flex items-center justify-between py-3 border-b border-slate-100 last:border-0">
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <Wrench size={16} />
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-xs text-slate-900 truncate">{vehicleName}</p>
          <p className="text-[11px] text-slate-500 truncate">
            {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY')}
            {' · '}
            {timeAgo(record.service_date)}
          </p>
        </div>
      </div>
      <div className="text-right shrink-0">
        <p className="text-xs font-bold text-slate-900">{formatRupiah(record.total_cost)}</p>
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">
              {t('dash_greeting')},{' '}
              <span className="text-blue-600">
                {user?.full_name?.split(' ')[0] ?? 'User'} 👋
              </span>
            </p>
            <h1 className="text-3xl font-bold text-slate-900">{t('nav_dashboard')}</h1>
            <p className="text-slate-500 mt-1">
              Ringkasan statistik perawatan & kalender rencana servis kendaraan Anda
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="ghost"
              leftIcon={<Calendar size={16} />}
              onClick={() => setShowAddPlanner(true)}
            >
              {t('planner_add_button')}
            </Button>
            <Button
              leftIcon={<Plus size={16} />}
              onClick={() => {
                setEditingVehicle(null);
                setShowAddVehicle(true);
              }}
            >
              {t('dash_add_vehicle')}
            </Button>
          </div>
        </div>

        {/* ── Summary Statistics Row (4 Cards) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={[
                'border rounded-2xl p-4 sm:p-5 flex items-center gap-4 transition-all shadow-xs',
                stat.isHighlight
                  ? 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                  : 'bg-white border-slate-200',
              ].join(' ')}
            >
              <div className={`w-11 h-11 ${stat.bg} rounded-xl flex items-center justify-center shrink-0`}>
                {stat.icon}
              </div>
              <div className="min-w-0">
                <p className="text-xs text-slate-500 font-semibold truncate">{stat.label}</p>
                <p className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-tight truncate mt-0.5">
                  {stat.value}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* ── STNK & Tax Expiry Radar Widget ── */}
        {stnkAlertVehicles.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-slate-950 via-slate-900 to-rose-950 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-rose-900/50 relative overflow-hidden space-y-4">
            {/* Ambient Red Glow Spotlight */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header Title & Subtitle */}
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-rose-600/30 border border-rose-500/40 text-rose-400 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <ShieldAlert size={20} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3
                      className="text-base sm:text-lg font-black tracking-tight text-white"
                      style={{ fontFamily: 'Rajdhani, sans-serif' }}
                    >
                      Radar Pajak & STNK Kendaraan
                    </h3>
                    <span className="bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[10px] font-mono font-black px-2 py-0.5 rounded-full">
                      {stnkAlertVehicles.length} Warning
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5 font-medium">
                    Pantau jatuh tempo pajak & legalitas kendaraan Anda agar selalu aman & bebas denda di jalan raya.
                  </p>
                </div>
              </div>
            </div>

            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
              {stnkAlertVehicles.map(({ vehicle: v, status: s }) => (
                <div
                  key={v.id}
                  className="bg-white/10 backdrop-blur-md border border-white/15 rounded-2xl p-4 flex items-center justify-between gap-3 shadow-md hover:border-white/30 transition-all group"
                >
                  <div className="min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="bg-amber-300 text-slate-950 font-mono font-black text-xs px-2.5 py-0.5 rounded border border-amber-400 shadow-2xs">
                        {v.license_plate}
                      </span>
                      <span className="font-extrabold text-sm text-white truncate">
                        {v.brand} {v.model}
                      </span>
                    </div>

                    <div>
                      {s.isExpired ? (
                        <div className="inline-flex items-center gap-1.5 bg-red-500/30 text-red-200 border border-red-500/50 text-xs font-black px-2.5 py-1 rounded-xl">
                          <span>⛔ PAJAK LEWAT {Math.abs(s.diffDays)} HARI!</span>
                        </div>
                      ) : s.isUrgent ? (
                        <div className="inline-flex items-center gap-1.5 bg-rose-500/30 text-rose-200 border border-rose-500/50 text-xs font-black px-2.5 py-1 rounded-xl">
                          <span>🚨 TINGGAL {s.diffDays} HARI LAGI ({s.expDateFormatted})</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 bg-amber-500/30 text-amber-200 border border-amber-500/50 text-xs font-bold px-2.5 py-1 rounded-xl">
                          <span>⚠️ Jatuh Tempo {s.diffDays} Hari ({s.expDateFormatted})</span>
                        </div>
                      )}
                    </div>

                    {v.stnk_number && (
                      <p className="text-[11px] text-slate-400 font-mono">
                        STNK: {v.stnk_number}
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingVehicle(v);
                      setShowAddVehicle(true);
                    }}
                    className="py-2 px-3 bg-white/10 hover:bg-white/20 text-white font-extrabold text-xs rounded-xl border border-white/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95 group-hover:bg-white group-hover:text-slate-900 shadow-2xs"
                  >
                    <Edit size={14} />
                    <span>Perbarui</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Odometer Summary & Quick Update Widget ── */}
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

        {/* ── Service Calendar & Scheduler Widget ── */}
        <div className="mb-8">
          <ServiceCalendarWidget
            planners={planners}
            vehicles={vehicles}
            onAddClick={() => setShowAddPlanner(true)}
            onStatusChange={handleStatusChangePlanner}
            onDelete={handleDeletePlanner}
          />
        </div>

        {/* ── Recent Activity Section ── */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp size={18} className="text-blue-600" />
              <h3 className="font-bold text-slate-900 text-base">Aktivitas Servis Terakhir</h3>
            </div>
            <Link
              to="/spent"
              className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
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
            <div className="py-8 text-center border border-dashed border-slate-200 rounded-xl">
              <Wrench size={32} className="text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Belum ada riwayat servis</p>
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
      <AddPlannerModal
        isOpen={showAddPlanner}
        onClose={() => setShowAddPlanner(false)}
        vehicles={vehicles}
        workshops={workshops}
        onSubmit={handleCreatePlanner}
      />
    </div>
  );
}

export default DashboardPage;
