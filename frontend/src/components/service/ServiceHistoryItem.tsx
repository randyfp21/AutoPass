import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronDown,
  ChevronUp,
  Gauge,
  Calendar,
  Store,
  Wrench,
  CheckCircle,
  Sparkles,
} from 'lucide-react';
import type { ServiceRecord } from '../../types';
import { formatRupiah, formatMileage, formatDate } from '../../utils/formatters';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface ServiceHistoryItemProps {
  record: ServiceRecord;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ServiceHistoryItem({ record }: ServiceHistoryItemProps) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);

  const workshopName = record.is_official_workshop
    ? (record.workshop_name_manual ?? 'Bengkel Resmi')
    : (record.workshop_name_manual ?? 'DIY / Bengkel Mandiri');

  const rawItems = (record.items && record.items.length > 0) ? record.items : (record.details || []);
  const topItems = rawItems.slice(0, 3);
  const allItems = rawItems;

  return (
    <div
      className={[
        'bg-white border border-slate-200 rounded-xl overflow-hidden',
        'transition-shadow duration-200 hover:shadow-md',
        'border-l-4',
        record.is_official_workshop ? 'border-l-blue-500' : 'border-l-orange-400',
      ].join(' ')}
    >
      {/* ── Header (always visible) ── */}
      <div
        className="flex items-start gap-4 p-4 cursor-pointer select-none"
        onClick={() => setExpanded(!expanded)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && setExpanded(!expanded)}
        aria-expanded={expanded}
      >
        {/* Date Column */}
        <div className="shrink-0 flex flex-col items-center bg-slate-50 rounded-lg px-3 py-2 border border-slate-100 min-w-[56px]">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
            {formatDate(record.service_date, 'month')}
          </span>
          <span className="text-2xl font-bold text-slate-800 leading-none">
            {formatDate(record.service_date, 'day')}
          </span>
          <span className="text-xs text-slate-400">
            {formatDate(record.service_date, 'year')}
          </span>
        </div>

        {/* Info Column */}
        <div className="flex-1 min-w-0">
          {/* Workshop name + badges */}
          <div className="flex items-center flex-wrap gap-2 mb-1.5">
            <h4 className="text-sm font-bold text-slate-900 truncate">
              {workshopName}
            </h4>
            {record.is_official_workshop ? (
              <span className="badge badge-blue flex items-center gap-1">
                <CheckCircle size={10} />
                Resmi
              </span>
            ) : (
              <span className="badge badge-orange flex items-center gap-1">
                <Wrench size={10} />
                DIY
              </span>
            )}
          </div>

          {/* Mileage */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <Gauge size={12} className="text-slate-400" />
            <span>{formatMileage(record.mileage_at_service)} km</span>
            <span className="mx-1 text-slate-300">•</span>
            <Store size={12} className="text-slate-400" />
            <span>{record.created_by_role === 'workshop' ? 'Dicatat bengkel' : 'Dicatat pemilik'}</span>
          </div>

          {/* Top items as pills */}
          {topItems.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topItems.map((item) => (
                <span
                  key={item.id}
                  className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                >
                  {item.item_name}
                </span>
              ))}
              {allItems.length > 3 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium">
                  +{allItems.length - 3} lainnya
                </span>
              )}
            </div>
          )}
        </div>

        {/* Cost + Expand Toggle */}
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-base font-bold text-slate-900">
            {formatRupiah(record.total_cost)}
          </span>
          <button
            className="p-1 rounded-lg bg-slate-100 hover:bg-slate-200 transition-colors text-slate-500"
            aria-label={expanded ? 'Tutup detail' : 'Buka detail'}
          >
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        </div>
      </div>

      {/* ── Expanded Details ── */}
      {expanded && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-4 animate-slide-up">
          {/* Complaints */}
          {record.complaints && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Keluhan
              </p>
              <p className="text-sm text-slate-700">{record.complaints}</p>
            </div>
          )}

          {/* All items table */}
          {allItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                Item Servis
              </p>
              <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500">Item</th>
                      <th className="text-center px-3 py-2 text-xs font-semibold text-slate-500">Qty</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Harga</th>
                      <th className="text-right px-3 py-2 text-xs font-semibold text-slate-500">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allItems.map((item, idx) => (
                      <tr
                        key={item.id}
                        className={idx % 2 === 0 ? '' : 'bg-slate-50/50'}
                      >
                        <td className="px-3 py-2 text-slate-800">{item.item_name}</td>
                        <td className="px-3 py-2 text-center text-slate-600">{item.quantity}x</td>
                        <td className="px-3 py-2 text-right text-slate-600">
                          {formatRupiah(item.unit_price)}
                        </td>
                        <td className="px-3 py-2 text-right font-medium text-slate-800">
                          {formatRupiah(item.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td
                        colSpan={3}
                        className="px-3 py-2 text-right font-bold text-sm text-slate-700"
                      >
                        Total
                      </td>
                      <td className="px-3 py-2 text-right font-bold text-slate-900">
                        {formatRupiah(record.total_cost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div>
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">
                Catatan
              </p>
              <p className="text-sm text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2">
                {record.notes}
              </p>
            </div>
          )}

          {/* Date details & Story Studio CTA */}
          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-400">
              <Calendar size={13} />
              <span>Tanggal servis: {formatDate(record.service_date, 'full')}</span>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/services/${record.id}/story`);
              }}
              className="py-1.5 px-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full font-extrabold flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Sparkles size={13} />
              <span>✨ Telemetry & Story Studio</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ServiceHistoryItem;
