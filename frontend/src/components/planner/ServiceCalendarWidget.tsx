import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Plus,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Clock,
  Trash2,
  Car,
  AlertCircle,
  FileText,
  Check,
  Wrench,
} from 'lucide-react';
import type { ServicePlanner, Vehicle, CreatePlannerData, PlannerStatus } from '../../types';

interface ServiceCalendarWidgetProps {
  planners: ServicePlanner[];
  vehicles: Vehicle[];
  onAddClick: () => void;
  onStatusChange: (id: string, newStatus: PlannerStatus, currentPlanner: ServicePlanner) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export function ServiceCalendarWidget({
  planners,
  vehicles,
  onAddClick,
  onStatusChange,
  onDelete,
}: ServiceCalendarWidgetProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDateStr, setSelectedDateStr] = useState<string | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);

  // Month navigation
  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Calendar math
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sun

  const monthNamesIndonesian = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
  ];

  // Map planners by date YYYY-MM-DD
  const plannersByDate: Record<string, ServicePlanner[]> = {};
  planners.forEach((p) => {
    if (!plannersByDate[p.planned_date]) {
      plannersByDate[p.planned_date] = [];
    }
    plannersByDate[p.planned_date].push(p);
  });

  // Calculate days remaining/overdue helper
  const getCountdownText = (dateStr: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const target = new Date(dateStr);
    target.setHours(0, 0, 0, 0);

    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return { text: 'Hari Ini!', color: 'bg-red-500 text-white font-bold animate-pulse' };
    if (diffDays > 0) {
      if (diffDays <= 3) return { text: `H-${diffDays} (Mendesak)`, color: 'bg-amber-500 text-white font-semibold' };
      return { text: `${diffDays} hari lagi`, color: 'bg-blue-100 text-blue-800' };
    }
    return { text: `Terlewat ${Math.abs(diffDays)} hari`, color: 'bg-slate-200 text-slate-700' };
  };

  const handleStatusToggle = async (p: ServicePlanner) => {
    const nextStatus: PlannerStatus = p.status === 'completed' ? 'planned' : 'completed';
    setActionLoadingId(p.id);
    try {
      await onStatusChange(p.id, nextStatus, p);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeletePlanner = async (id: string) => {
    if (!window.confirm('Hapus jadwal servis ini?')) return;
    setActionLoadingId(id);
    try {
      await onDelete(id);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Filter planners if date selected
  const filteredPlanners = selectedDateStr
    ? planners.filter((p) => p.planned_date === selectedDateStr)
    : planners;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center">
              <CalendarIcon size={18} />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Jadwal & Planner Servis</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Atur jadwal servis berkala, target kilometer, & catatan kebutuhan perawatan kendaraan Anda
          </p>
        </div>

        <button
          onClick={onAddClick}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus size={16} />
          Tambah Jadwal Servis
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Calendar Picker (5 cols) */}
        <div className="lg:col-span-5 bg-slate-50/80 p-4 rounded-xl border border-slate-200/80">
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="font-bold text-slate-800 text-sm">
              {monthNamesIndonesian[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                aria-label="Bulan sebelumnya"
              >
                <ChevronLeft size={16} />
              </button>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors text-slate-600"
                aria-label="Bulan berikutnya"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 text-center text-[11px] font-semibold text-slate-400 mb-2">
            <span>Min</span>
            <span>Sen</span>
            <span>Sel</span>
            <span>Rab</span>
            <span>Kam</span>
            <span>Jum</span>
            <span>Sab</span>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 text-xs">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`empty-${i}`} className="h-9" />
            ))}

            {/* Month Days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
              const hasPlanner = !!plannersByDate[dateStr]?.length;
              const isSelected = selectedDateStr === dateStr;

              // Check if today
              const todayStr = new Date().toISOString().split('T')[0];
              const isToday = todayStr === dateStr;

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (selectedDateStr === dateStr) {
                      setSelectedDateStr(null); // toggle off
                    } else {
                      setSelectedDateStr(dateStr);
                    }
                  }}
                  className={[
                    'h-9 rounded-lg flex flex-col items-center justify-center relative transition-all text-xs font-medium',
                    isSelected
                      ? 'bg-blue-600 text-white font-bold shadow-sm'
                      : isToday
                      ? 'border border-blue-500 font-bold text-blue-600 bg-blue-50/50'
                      : 'hover:bg-slate-200/70 text-slate-700',
                  ].join(' ')}
                >
                  <span>{dayNum}</span>
                  {/* Planner marker dot */}
                  {hasPlanner && (
                    <span
                      className={[
                        'w-1.5 h-1.5 rounded-full absolute bottom-1',
                        isSelected ? 'bg-white' : 'bg-red-500',
                      ].join(' ')}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {selectedDateStr && (
            <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-200">
              <span className="text-slate-500">Filter: <strong>{selectedDateStr}</strong></span>
              <button
                onClick={() => setSelectedDateStr(null)}
                className="text-blue-600 font-medium hover:underline text-[11px]"
              >
                Reset Filter
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Planner Schedule List (7 cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between">
          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            {filteredPlanners.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <CalendarIcon size={32} className="mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold text-slate-700">Belum Ada Rencana Servis</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                  {selectedDateStr
                    ? `Tidak ada jadwal pada tanggal ${selectedDateStr}`
                    : 'Buat rencana servis mendatang untuk menjaga kondisi kendaraan tetap prima'}
                </p>
                <button
                  onClick={onAddClick}
                  className="mt-3 text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 transition-colors"
                >
                  + Tambah Jadwal Sekarang
                </button>
              </div>
            ) : (
              filteredPlanners.map((p) => {
                const countdown = getCountdownText(p.planned_date);
                const isCompleted = p.status === 'completed';

                return (
                  <div
                    key={p.id}
                    className={[
                      'p-4 rounded-xl border transition-all flex flex-col gap-2 relative',
                      isCompleted
                        ? 'bg-slate-50 border-slate-200 opacity-75'
                        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-sm',
                    ].join(' ')}
                  >
                    {/* Top Row: Vehicle Plate + Countdown Badge */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded text-[11px] font-mono border border-amber-400">
                          {p.vehicle_info?.license_plate || 'KENDARAAN'}
                        </span>
                        <span className="text-xs text-slate-500 font-medium">
                          {p.vehicle_info ? `${p.vehicle_info.brand} ${p.vehicle_info.model}` : ''}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {!isCompleted && (
                          <span className={`text-[10px] px-2 py-0.5 rounded-full ${countdown.color}`}>
                            {countdown.text}
                          </span>
                        )}
                        <span
                          className={[
                            'text-[10px] px-2 py-0.5 rounded-full font-semibold',
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-blue-50 text-blue-700 border border-blue-200',
                          ].join(' ')}
                        >
                          {isCompleted ? '✓ Selesai' : 'Rencana'}
                        </span>
                      </div>
                    </div>

                    {/* Title */}
                    <h4
                      className={[
                        'font-bold text-sm text-slate-900',
                        isCompleted ? 'line-through text-slate-400' : '',
                      ].join(' ')}
                    >
                      {p.title}
                    </h4>

                    {/* Workshop Info */}
                    {(p.is_official_workshop || p.workshop_name_manual || p.workshop_info) && (
                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-600">
                        <Wrench size={13} className="text-blue-500 shrink-0" />
                        <span>
                          {p.is_official_workshop
                            ? (p.workshop_info?.workshop_name || 'Bengkel Resmi Terdaftar')
                            : (p.workshop_name_manual || 'Bengkel Custom / DIY')}
                        </span>
                        {p.is_official_workshop && (
                          <span className="text-[10px] bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded font-semibold">
                            ✓ Resmi
                          </span>
                        )}
                      </div>
                    )}

                    {/* Date & Target Mileage */}
                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock size={13} className="text-slate-400" />
                        {p.planned_date}
                      </span>
                      {p.target_mileage > 0 && (
                        <span className="flex items-center gap-1">
                          <Car size={13} className="text-slate-400" />
                          Target: {p.target_mileage.toLocaleString('id-ID')} KM
                        </span>
                      )}
                    </div>

                    {/* Notes */}
                    {p.notes && (
                      <div className="bg-slate-50 p-2.5 rounded-lg text-xs text-slate-600 border border-slate-100 flex items-start gap-2 mt-1">
                        <FileText size={13} className="text-slate-400 shrink-0 mt-0.5" />
                        <p className="whitespace-pre-line leading-relaxed">{p.notes}</p>
                      </div>
                    )}

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 mt-1">
                      <button
                        onClick={() => handleStatusToggle(p)}
                        disabled={actionLoadingId === p.id}
                        className={[
                          'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold transition-colors',
                          isCompleted
                            ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                            : 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs',
                        ].join(' ')}
                      >
                        <Check size={13} />
                        {isCompleted ? 'Batalkan Selesai' : 'Tandai Selesai'}
                      </button>
                      <button
                        onClick={() => handleDeletePlanner(p.id)}
                        disabled={actionLoadingId === p.id}
                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus Rencana"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
