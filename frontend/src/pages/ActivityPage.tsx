import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Calendar, Wrench, CheckCircle, Plus, Eye, Receipt, Flame } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import { plannerService } from '../services/plannerService';
import { AddServiceModal } from '../components/service/AddServiceModal';
import { DigitalReceiptModal } from '../components/service/DigitalReceiptModal';
import { GenZSocialShareModal } from '../components/service/GenZSocialShareModal';
import { AddPlannerModal } from '../components/planner/AddPlannerModal';
import { Button } from '../components/common/Button';
import type { Vehicle, ServiceRecord, ServicePlanner, CreateServiceRecordData, Workshop, CreatePlannerData } from '../types';
import { formatRupiah, formatDate, formatMileage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';

export function ActivityPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [planners, setPlanners] = useState<ServicePlanner[]>([]);
  const [workshops, setWorkshops] = useState<Workshop[]>([]);
  const [recordsWithVehicle, setRecordsWithVehicle] = useState<
    Array<{ record: ServiceRecord; vehicle: Vehicle }>
  >([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [selectedPlanToComplete, setSelectedPlanToComplete] = useState<{
    plan: ServicePlanner;
    vehicle: Vehicle;
  } | null>(null);

  const [shareModalData, setShareModalData] = useState<{
    record: ServiceRecord;
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

  // Filter planned (incomplete) items
  const activePlans = planners.filter((p) => p.status === 'planned');

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
      notes: plan.notes,
      status: 'completed',
    });

    // 3. Refresh data
    await fetchData();

    // 4. Open Gen Z Social Story Share Modal immediately!
    setShareModalData({
      record: newRecord,
      vehicle,
    });

    setSelectedPlanToComplete(null);
  };

  const handleCreatePlanner = async (data: CreatePlannerData) => {
    await plannerService.createPlanner(data);
    await fetchData();
  };

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Sparkles size={28} className="text-orange-500" />
              {t('act_title')}
            </h1>
            <p className="text-slate-500 mt-1">{t('act_subtitle')}</p>
          </div>

          <Button
            leftIcon={<Plus size={16} />}
            onClick={() => setShowAddPlanner(true)}
          >
            {t('act_add_plan_button')}
          </Button>
        </div>

        {/* ── Active Service Plans (To Be Done) ── */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Calendar size={20} className="text-blue-600" />
              {t('act_section_active_plans')} ({activePlans.length})
            </h2>
          </div>

          {isLoading ? (
            <div className="skeleton h-24 rounded-2xl" />
          ) : activePlans.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
              <p className="text-sm font-bold text-slate-800">{t('act_no_active_plans')}</p>
              <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                {t('act_no_active_plans_desc')}
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
                    className="bg-white border-2 border-blue-100 hover:border-blue-300 rounded-2xl p-5 shadow-xs transition-all flex flex-col justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-xs font-mono border border-amber-400">
                          {vehicle.license_plate}
                        </span>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">
                          Target: {formatDate(plan.planned_date, 'short')}
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

                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400">Klik selesai saat servis rampung</span>
                      <Button
                        size="sm"
                        leftIcon={<CheckCircle size={14} />}
                        onClick={() => setSelectedPlanToComplete({ plan, vehicle })}
                      >
                        {t('act_complete_button')}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Completed Activity Feed & Gen Z Social Share ── */}
        <div className="space-y-4 pt-4 border-t border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Wrench size={20} className="text-orange-600" />
              {t('act_section_completed_history')}
            </h2>
            <span className="text-xs text-slate-400">Bagikan aktivitas ke Instagram / WA</span>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className="skeleton h-20 rounded-xl" />
              ))}
            </div>
          ) : recordsWithVehicle.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center">
              <p className="text-sm font-semibold text-slate-600">Belum ada riwayat servis yang tercatat</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordsWithVehicle.map(({ record, vehicle }) => (
                <div
                  key={record.id}
                  className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3.5 min-w-0">
                    <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle size={20} />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-amber-400">
                          {vehicle.license_plate}
                        </span>
                        <h4 className="font-extrabold text-sm text-slate-900 truncate">
                          {vehicle.brand} {vehicle.model}
                        </h4>
                      </div>

                      <p className="text-xs text-slate-600 mt-1">
                        {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY')}
                        {' · '}
                        {formatDate(record.service_date, 'full')}
                        {' · '}
                        {formatMileage(record.mileage_at_service)} km
                      </p>

                      <p className="text-xs font-bold text-slate-900 mt-1">
                        {formatRupiah(record.total_cost)}
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
                      {t('act_button_digital_receipt')}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold border-none shadow-xs"
                      leftIcon={<Flame size={14} />}
                      onClick={() => navigate(`/services/${record.id}/story`)}
                    >
                      ✨ {t('act_button_share_genz')}
                    </Button>
                  </div>
                </div>
              ))}
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
            setShareModalData(selectedReceipt);
          }
        }}
      />

      {/* Complete Plan Modal with Receipt Upload */}
      {selectedPlanToComplete && (
        <AddServiceModal
          isOpen={!!selectedPlanToComplete}
          onClose={() => setSelectedPlanToComplete(null)}
          onSubmit={handleCompletePlanSubmit}
          vehicleCategory={selectedPlanToComplete.vehicle.category}
          currentMileage={selectedPlanToComplete.vehicle.current_mileage}
          initialPlanData={selectedPlanToComplete.plan}
        />
      )}

      {/* Gen Z Social Story Share Modal */}
      {shareModalData && (
        <GenZSocialShareModal
          isOpen={!!shareModalData}
          onClose={() => setShareModalData(null)}
          vehicle={shareModalData.vehicle}
          record={shareModalData.record}
        />
      )}
    </div>
  );
}

export default ActivityPage;
