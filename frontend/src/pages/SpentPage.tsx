import React, { useState, useEffect } from 'react';
import { Wallet, TrendingUp, Receipt, Filter, Eye, Shield, Wrench, ChevronRight, Calendar, RotateCcw, Download, FileText } from 'lucide-react';
import { vehicleService } from '../services/vehicleService';
import { maintenanceService } from '../services/maintenanceService';
import { DigitalReceiptModal } from '../components/service/DigitalReceiptModal';
import { GenZSocialShareModal } from '../components/service/GenZSocialShareModal';
import { Button } from '../components/common/Button';
import type { Vehicle, ServiceRecord } from '../types';
import { formatRupiah, formatDate, formatMileage } from '../utils/formatters';
import { useTranslation } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { generateSpentPDF } from '../utils/pdfGenerator';

export function SpentPage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [recordsWithVehicle, setRecordsWithVehicle] = useState<
    Array<{ record: ServiceRecord; vehicle: Vehicle }>
  >([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string>('all');
  const [selectedMonthKey, setSelectedMonthKey] = useState<string>('all');
  const [selectedRecordForReceipt, setSelectedRecordForReceipt] = useState<{
    record: ServiceRecord;
    vehicle: Vehicle;
  } | null>(null);
  const [selectedRecordForShare, setSelectedRecordForShare] = useState<{
    record: ServiceRecord;
    vehicle: Vehicle;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const vehicleList = await vehicleService.getVehicles();
      setVehicles(vehicleList);

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
      console.error('Failed to fetch spent data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.slice(0, 10).split('-').map(Number);
    if (parts.length === 3) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateStr);
  };

  // Unique month list for filter dropdown
  const availableMonths = Array.from(
    new Set(
      recordsWithVehicle.map(({ record }) => {
        const d = parseLocalDate(record.service_date);
        return d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      })
    )
  );

  // Apply Vehicle & Month filters
  const filteredRecords = recordsWithVehicle.filter(({ record, vehicle }) => {
    const matchesVehicle = selectedVehicleId === 'all' || vehicle.id === selectedVehicleId;

    const d = parseLocalDate(record.service_date);
    const monthKey = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
    const matchesMonth = selectedMonthKey === 'all' || monthKey === selectedMonthKey;

    return matchesVehicle && matchesMonth;
  });

  // Calculations
  const totalSpent = filteredRecords.reduce((acc, curr) => acc + curr.record.total_cost, 0);

  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const thisMonthSpent = recordsWithVehicle
    .filter(({ record, vehicle }) => {
      const matchesVehicle = selectedVehicleId === 'all' || vehicle.id === selectedVehicleId;
      const d = parseLocalDate(record.service_date);
      return matchesVehicle && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((acc, curr) => acc + curr.record.total_cost, 0);

  const avgSpent = filteredRecords.length > 0 ? Math.round(totalSpent / filteredRecords.length) : 0;

  // Monthly breakdown map (for sidebar)
  const monthlyRecap: Record<string, number> = {};
  recordsWithVehicle
    .filter(({ vehicle }) => selectedVehicleId === 'all' || vehicle.id === selectedVehicleId)
    .forEach(({ record }) => {
      const d = parseLocalDate(record.service_date);
      const monthKey = d.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
      monthlyRecap[monthKey] = (monthlyRecap[monthKey] || 0) + record.total_cost;
    });

  const isFiltered = selectedVehicleId !== 'all' || selectedMonthKey !== 'all';

  // Export Filtered Spending History to PDF
  const handleDownloadPDF = () => {
    const selectedVehicleObj = vehicles.find((v) => v.id === selectedVehicleId);
    const vehicleFilterName = selectedVehicleId === 'all'
      ? 'Semua Kendaraan'
      : selectedVehicleObj
        ? `${selectedVehicleObj.brand} ${selectedVehicleObj.model} (${selectedVehicleObj.license_plate})`
        : 'Kendaraan';

    const monthTitle = selectedMonthKey === 'all' ? 'Semua Bulan (All Time)' : selectedMonthKey;

    generateSpentPDF({
      records: filteredRecords,
      monthTitle,
      vehicleFilterName,
      totalSpent,
      avgSpent,
      userName: user?.full_name || 'Pemilik Kendaraan',
    });
  };

  return (
    <div className="flex-1 bg-slate-50 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-md">
              <Wallet size={22} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{t('spent_title')}</h1>
              <p className="text-xs text-slate-500">{t('spent_subtitle')}</p>
            </div>
          </div>

          <Button
            type="button"
            variant="primary"
            size="md"
            leftIcon={<Download size={16} />}
            onClick={handleDownloadPDF}
            disabled={filteredRecords.length === 0}
            className="bg-slate-900 hover:bg-slate-800 text-white font-bold shadow-md self-start sm:self-auto"
          >
            Download Rekap PDF ({selectedMonthKey !== 'all' ? selectedMonthKey : 'Semua Bulan'})
          </Button>
        </div>

        {/* Top Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">
              {selectedMonthKey !== 'all' ? `Total (${selectedMonthKey})` : t('spent_total_spent')}
            </p>
            <p className="text-2xl font-extrabold text-slate-900 mt-1">
              {formatRupiah(totalSpent)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Total {filteredRecords.length} transaksi servis</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wide">
              {t('spent_this_month')}
            </p>
            <p className="text-2xl font-extrabold text-blue-700 mt-1">
              {formatRupiah(thisMonthSpent)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Pengeluaran bulan berjalan</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <p className="text-xs font-semibold text-emerald-600 uppercase tracking-wide">
              {t('spent_average')}
            </p>
            <p className="text-2xl font-extrabold text-emerald-700 mt-1">
              {formatRupiah(avgSpent)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Rata-rata per kunjungan servis</p>
          </div>
        </div>

        {/* Dual Filter Bar: Vehicle Filter + Month Filter */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700 w-full sm:w-auto">
            <Filter size={16} className="text-blue-600 shrink-0" />
            <span>Filter Pengeluaran:</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {/* Vehicle Selector */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedVehicleId}
                onChange={(e) => setSelectedVehicleId(e.target.value)}
                className="input-field text-xs font-semibold bg-slate-50 border-slate-200 py-2 pr-8"
              >
                <option value="all">🚗 {t('spent_filter_all')}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.brand} {v.model} ({v.license_plate})
                  </option>
                ))}
              </select>
            </div>

            {/* Month Selector */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedMonthKey}
                onChange={(e) => setSelectedMonthKey(e.target.value)}
                className="input-field text-xs font-semibold bg-slate-50 border-slate-200 py-2 pr-8"
              >
                <option value="all">📅 Semua Bulan (All Time)</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    🗓️ {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Download PDF Button inside Filter Bar */}
            <button
              type="button"
              onClick={handleDownloadPDF}
              disabled={filteredRecords.length === 0}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-all shadow-xs shrink-0 disabled:opacity-50"
            >
              <FileText size={14} />
              PDF Rekap
            </button>

            {/* Reset Filter Button */}
            {isFiltered && (
              <button
                type="button"
                onClick={() => {
                  setSelectedVehicleId('all');
                  setSelectedMonthKey('all');
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors border border-slate-200 shrink-0"
              >
                <RotateCcw size={13} />
                Reset Filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main List: Service Transactions & Receipts */}
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900">
                {t('spent_service_list')}
                {selectedMonthKey !== 'all' && (
                  <span className="text-blue-600 text-sm font-semibold ml-2">
                    ({selectedMonthKey})
                  </span>
                )}
              </h2>
              <span className="text-xs text-slate-500 font-medium">Klik item untuk melihat Struk Digital</span>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="skeleton h-20 rounded-xl" />
                ))}
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center">
                <Receipt size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold text-slate-700">{t('spent_no_data')}</p>
                {isFiltered && (
                  <p className="text-xs text-slate-400 mt-1">
                    Tidak ada transaksi pada filter terpilih.{' '}
                    <button
                      onClick={() => {
                        setSelectedVehicleId('all');
                        setSelectedMonthKey('all');
                      }}
                      className="text-blue-600 font-bold underline"
                    >
                      Reset Filter
                    </button>
                  </p>
                )}
              </div>
            ) : (
              filteredRecords.map(({ record, vehicle }) => (
                <div
                  key={record.id}
                  onClick={() => setSelectedRecordForReceipt({ record, vehicle })}
                  className="bg-white border border-slate-200 hover:border-blue-400 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer flex items-center justify-between gap-4 group"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={[
                        'w-11 h-11 rounded-xl flex items-center justify-center shrink-0 font-bold',
                        record.is_official_workshop
                          ? 'bg-blue-50 text-blue-600'
                          : 'bg-amber-50 text-amber-700',
                      ].join(' ')}
                    >
                      {record.is_official_workshop ? <Shield size={20} /> : <Wrench size={20} />}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-amber-400">
                          {vehicle.license_plate}
                        </span>
                        <span className="text-xs font-semibold text-slate-800 truncate">
                          {vehicle.brand} {vehicle.model}
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 mt-1 truncate">
                        {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY')}
                        {' · '}
                        {formatDate(record.service_date, 'short')}
                        {' · '}
                        {formatMileage(record.mileage_at_service)} km
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div>
                      <p className="text-base font-extrabold text-slate-900">
                        {formatRupiah(record.total_cost)}
                      </p>
                      <span className="text-[11px] text-blue-600 font-semibold group-hover:underline flex items-center justify-end gap-1">
                        <Eye size={12} />
                        {t('spent_view_receipt')}
                      </span>
                    </div>
                    <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Sidebar: Interactive Monthly Recap Breakdown */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 text-sm mb-4 flex items-center justify-between">
                <span>{t('spent_monthly_recap')}</span>
                <TrendingUp size={16} className="text-slate-400" />
              </h3>

              <div className="space-y-2">
                {Object.keys(monthlyRecap).length === 0 ? (
                  <p className="text-xs text-slate-400 italic text-center py-4">Belum ada data bulanan</p>
                ) : (
                  Object.entries(monthlyRecap).map(([monthName, amount]) => {
                    const isSelected = selectedMonthKey === monthName;
                    return (
                      <div
                        key={monthName}
                        onClick={() => setSelectedMonthKey(isSelected ? 'all' : monthName)}
                        className={[
                          'flex items-center justify-between text-xs py-2.5 px-3 rounded-xl cursor-pointer transition-all border',
                          isSelected
                            ? 'bg-blue-50 border-blue-300 font-bold text-blue-900 shadow-2xs'
                            : 'bg-white border-transparent hover:bg-slate-50 text-slate-700',
                        ].join(' ')}
                      >
                        <span className="flex items-center gap-2">
                          <Calendar size={14} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                          {monthName}
                        </span>
                        <span className="font-extrabold text-slate-900">{formatRupiah(amount)}</span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Receipt Modal */}
      <DigitalReceiptModal
        isOpen={!!selectedRecordForReceipt}
        onClose={() => setSelectedRecordForReceipt(null)}
        record={selectedRecordForReceipt?.record || null}
        vehicle={selectedRecordForReceipt?.vehicle || null}
        onOpenSocialShare={() => {
          if (selectedRecordForReceipt) {
            setSelectedRecordForShare(selectedRecordForReceipt);
          }
        }}
      />

      {/* Gen Z Social Share Modal */}
      {selectedRecordForShare && (
        <GenZSocialShareModal
          isOpen={!!selectedRecordForShare}
          onClose={() => setSelectedRecordForShare(null)}
          record={selectedRecordForShare.record}
          vehicle={selectedRecordForShare.vehicle}
        />
      )}
    </div>
  );
}

export default SpentPage;
