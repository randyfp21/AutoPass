import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Wrench, Printer, CheckCircle, Car, Calendar, Gauge, Camera, Flame, Trash2, AlertTriangle, FileText, Eye } from 'lucide-react';
import { Modal } from '../common/Modal';
import { AnalogOdometer } from '../common/AnalogOdometer';
import type { ServiceRecord, Vehicle } from '../../types';
import { formatRupiah, formatDate, formatMileage } from '../../utils/formatters';
import { useTranslation } from '../../context/LanguageContext';

interface DigitalReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  record: ServiceRecord | null;
  vehicle?: Vehicle | null;
  onOpenSocialShare?: () => void;
  onDeleteActivity?: (record: ServiceRecord) => void;
}

export function DigitalReceiptModal({
  isOpen,
  onClose,
  record,
  vehicle,
  onOpenSocialShare,
  onDeleteActivity,
}: DigitalReceiptModalProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!record) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleConfirmDelete = async () => {
    if (!onDeleteActivity || !record) return;
    setIsDeleting(true);
    try {
      await onDeleteActivity(record);
      setShowConfirmDelete(false);
      onClose();
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`🧾 ${t('spent_digital_receipt')} #${record.id.slice(0, 8)}`}
        size="lg"
      >
        <div className="printable-receipt space-y-6 p-1">
          {/* ── 1. Hero Header Banner (Glassmorphism Specification) ── */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white rounded-3xl p-5 sm:p-6 relative overflow-hidden shadow-xl border border-slate-800">
            {/* Specular Ambient Glow */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-600/30 border border-blue-500/40 rounded-xl flex items-center justify-center text-blue-400 shrink-0">
                    <Gauge size={18} />
                  </div>
                  <span className="font-extrabold text-base sm:text-lg text-white">
                    Odomtr Digital Receipt #{record.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-medium pl-1">
                  Dokumen Resmi Catatan Maintenance Passport Kendaraan
                </p>
              </div>

              <div className="shrink-0">
                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider shadow-sm',
                    record.is_official_workshop
                      ? 'bg-blue-600 text-white border border-blue-400/40'
                      : 'bg-amber-400 text-slate-900 border border-amber-300',
                  ].join(' ')}
                >
                  {record.is_official_workshop ? <Shield size={14} /> : <Wrench size={14} />}
                  {record.is_official_workshop
                    ? t('receipt_official_badge')
                    : t('receipt_manual_badge')}
                </span>
              </div>
            </div>
          </div>

          {/* ── 2. Workshop & Vehicle Info Metadata Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Workshop Info Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <Wrench size={14} className="text-blue-600" />
                <span>Penyedia Jasa / Bengkel</span>
              </div>
              <div>
                <p className="font-extrabold text-sm text-slate-900">
                  {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi Terdaftar' : 'DIY Maintenance')}
                </p>
                <p className="text-slate-500 mt-1 font-medium">
                  Role Input:{' '}
                  <span className="font-bold text-slate-700 bg-slate-200/70 px-2 py-0.5 rounded text-[11px] capitalize">
                    {record.created_by_role}
                  </span>
                </p>
              </div>
            </div>

            {/* Vehicle Info Card */}
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 sm:p-5 space-y-2 text-xs">
              <div className="flex items-center gap-2 text-slate-500 font-extrabold uppercase tracking-wider text-[11px]">
                <Car size={14} className="text-purple-600" />
                <span>Data Kendaraan & Odometer</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="bg-amber-300 text-slate-900 font-mono font-black px-2.5 py-0.5 rounded border border-amber-400 text-xs shadow-2xs">
                    {vehicle?.license_plate || 'KENDARAAN'}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-slate-600 pt-0.5 flex-wrap">
                  <span className="flex items-center gap-1 font-medium">
                    <Calendar size={13} className="text-slate-400" />
                    {formatDate(record.service_date, 'full')}
                  </span>
                  <AnalogOdometer value={record.mileage_at_service} size="sm" />
                </div>
              </div>
            </div>
          </div>

          {/* ── 3. Physical Receipt Photo Compact Thumbnail & View Image Button ── */}
          {record.receipt_photo_url && (
            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-3 flex items-center justify-between gap-3 text-xs shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-white shrink-0 shadow-2xs relative group cursor-pointer"
                  onClick={() => {
                    onClose();
                    navigate(`/services/${record.id}/receipt-photo`);
                  }}
                >
                  <img
                    src={record.receipt_photo_url}
                    alt="Thumbnail Struk"
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
                </div>
                <div className="min-w-0">
                  <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                    <Camera size={14} className="text-blue-600" />
                    Foto Struk / Nota Fisik Bengkel
                  </p>
                  <p className="text-[11px] text-slate-500 truncate">Dokumen nota fisik terlampir</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  navigate(`/services/${record.id}/receipt-photo`);
                }}
                className="py-2 px-3.5 bg-white hover:bg-slate-100 text-blue-700 font-extrabold text-xs rounded-xl border border-slate-200 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Eye size={14} />
                <span>View Image</span>
              </button>
            </div>
          )}

          {/* ── 4. Complaints / Notes Card ── */}
          {(record.complaints || record.notes) && (
            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 text-xs text-slate-800 space-y-1.5 shadow-2xs">
              {record.complaints && (
                <p className="leading-relaxed">
                  <strong className="font-extrabold text-amber-900">Keluhan Kendaraan:</strong> {record.complaints}
                </p>
              )}
              {record.notes && (
                <p className="leading-relaxed">
                  <strong className="font-extrabold text-amber-900">Catatan Bengkel:</strong> {record.notes}
                </p>
              )}
            </div>
          )}

          {/* ── 5. Itemized Table (Maintenance Breakdown) ── */}
          {(() => {
            const lineItems = (record.items && record.items.length > 0) ? record.items : (record.details || []);
            return (
              <div className="border border-slate-200/90 rounded-2xl overflow-hidden text-xs shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100/90 border-b border-slate-200 font-black text-slate-600 text-[11px] uppercase tracking-wider">
                      <th className="py-3 px-4">{t('receipt_item_name')}</th>
                      <th className="py-3 px-3 text-center">{t('receipt_qty')}</th>
                      <th className="py-3 px-4 text-right">{t('receipt_price')}</th>
                      <th className="py-3 px-4 text-right">{t('receipt_subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-5 px-4 text-center text-slate-400 italic">
                          Tidak ada rincian item (total akumulasi langsung)
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((detail, idx) => (
                        <tr key={idx} className="hover:bg-purple-50/30 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">{detail.item_name}</td>
                          <td className="py-3 px-3 text-center">
                            <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded">
                              {detail.quantity}x
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">{formatRupiah(detail.unit_price)}</td>
                          <td className="py-3 px-4 text-right font-mono font-black text-slate-900">{formatRupiah(detail.subtotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 text-white font-bold text-sm">
                      <td colSpan={3} className="py-3.5 px-4 text-right uppercase tracking-wider font-extrabold">
                        {t('receipt_total')}
                      </td>
                      <td className="py-3.5 px-4 text-right text-base text-amber-400 font-mono font-black">
                        {formatRupiah(record.total_cost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}

          {/* ── 6. Footer Information & Verification Badge ── */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span className="font-mono text-slate-400">Token ID: {record.id}</span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-extrabold bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle size={13} />
              Verified Digital Log
            </span>
          </div>

          {/* ── 7. Clean Action Buttons Footer ── */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            {/* Share Activity Button (Left Side) */}
            <div>
              {onOpenSocialShare && (
                <button
                  type="button"
                  onClick={onOpenSocialShare}
                  className="py-2.5 px-4 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-extrabold text-xs rounded-xl shadow-md shadow-orange-500/25 transition-all active:scale-95 cursor-pointer flex items-center gap-2 border border-orange-400/50 group"
                >
                  <Flame size={16} className="text-amber-200 animate-pulse group-hover:scale-110 transition-transform" />
                  <span>✨ Share Activity</span>
                </button>
              )}
            </div>

            {/* Delete & Print Buttons (Right Side) */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(true)}
                className="py-2.5 px-4 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-extrabold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Trash2 size={15} />
                <span>Hapus Activity</span>
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95"
              >
                <Printer size={15} />
                <span>{t('receipt_print')}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>



      {/* ── 9. Delete Confirmation Modal ── */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex min-h-full items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200 select-none">
          <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 p-6 space-y-4 text-center my-auto">
            <div className="w-14 h-14 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-xs">
              <AlertTriangle size={28} />
            </div>

            <div className="space-y-1">
              <h3 className="font-extrabold text-slate-900 text-base">Hapus Activity Ini?</h3>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Apakah Anda yakin ingin menghapus activity catatan servis ini secara permanen? Data yang telah dihapus tidak dapat dikembalikan.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmDelete(false)}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menghapus...
                  </>
                ) : (
                  <>
                    <Trash2 size={14} />
                    Ya, Hapus
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DigitalReceiptModal;
