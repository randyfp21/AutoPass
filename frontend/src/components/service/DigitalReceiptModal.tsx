import React, { useState } from 'react';
import { Shield, Wrench, Printer, CheckCircle, Car, Calendar, Gauge, Camera, Flame, Trash2, AlertTriangle } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
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
        <div className="printable-receipt space-y-5 p-1">
          {/* Header Badge */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 sm:p-6 relative overflow-hidden shadow-md">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Gauge size={22} className="text-blue-400" />
                  <span className="font-bold text-lg tracking-tight font-[family-name:var(--font-family-tech)]">
                    Odomtr Digital Receipt #{record.id.slice(0, 8)}
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Dokumen Resmi Catatan Maintenance Passport Kendaraan
                </p>
              </div>

              <div className="text-right">
                <span
                  className={[
                    'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider',
                    record.is_official_workshop
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-400 text-slate-900',
                  ].join(' ')}
                >
                  {record.is_official_workshop ? <Shield size={13} /> : <Wrench size={13} />}
                  {record.is_official_workshop
                    ? t('receipt_official_badge')
                    : t('receipt_manual_badge')}
                </span>
              </div>
            </div>
          </div>

          {/* Workshop & Vehicle Info Metadata Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
            {/* Workshop Info */}
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Penyedia Jasa / Bengkel</p>
              <p className="font-bold text-sm text-slate-900">
                {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi Terdaftar' : 'DIY Maintenance')}
              </p>
              <p className="text-slate-500 mt-0.5">
                Role Input: <span className="font-semibold capitalize text-slate-700">{record.created_by_role}</span>
              </p>
            </div>

            {/* Vehicle Info */}
            <div>
              <p className="font-bold text-slate-500 uppercase tracking-wide mb-1">Data Kendaraan</p>
              <div className="flex items-center gap-2">
                <span className="bg-amber-300 text-slate-900 font-bold px-2 py-0.5 rounded font-mono border border-amber-400">
                  {vehicle?.license_plate || 'KENDARAAN'}
                </span>
                <span className="font-bold text-slate-800">
                  {vehicle ? `${vehicle.brand} ${vehicle.model}` : ''}
                </span>
              </div>
              <div className="flex items-center gap-3 text-slate-600 mt-1">
                <span className="flex items-center gap-1">
                  <Calendar size={12} className="text-slate-400" />
                  {formatDate(record.service_date, 'full')}
                </span>
                <span className="flex items-center gap-1">
                  <Car size={12} className="text-slate-400" />
                  {formatMileage(record.mileage_at_service)} km
                </span>
              </div>
            </div>
          </div>

          {/* Physical Receipt Photo Preview */}
          {record.receipt_photo_url && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
              <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <Camera size={15} className="text-blue-600" />
                Foto Struk / Nota Fisik Asli Bengkel:
              </p>
              <div className="max-h-96 overflow-hidden rounded-lg border border-slate-200 bg-white p-1">
                <img
                  src={record.receipt_photo_url}
                  alt="Foto Struk Fisik"
                  className="w-full h-full object-contain max-h-96 mx-auto rounded"
                />
              </div>
            </div>
          )}

          {/* Complaints / Notes */}
          {(record.complaints || record.notes) && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3.5 text-xs text-slate-700 space-y-1">
              {record.complaints && (
                <p>
                  <strong>Keluhan:</strong> {record.complaints}
                </p>
              )}
              {record.notes && (
                <p>
                  <strong>Catatan Bengkel:</strong> {record.notes}
                </p>
              )}
            </div>
          )}

          {/* Itemized Table */}
          {(() => {
            const lineItems = (record.items && record.items.length > 0) ? record.items : (record.details || []);
            return (
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-200 font-bold text-slate-700">
                      <th className="py-2.5 px-4">{t('receipt_item_name')}</th>
                      <th className="py-2.5 px-3 text-center">{t('receipt_qty')}</th>
                      <th className="py-2.5 px-4 text-right">{t('receipt_price')}</th>
                      <th className="py-2.5 px-4 text-right">{t('receipt_subtotal')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {lineItems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 px-4 text-center text-slate-400 italic">
                          Tidak ada rincian item (total akumulasi langsung)
                        </td>
                      </tr>
                    ) : (
                      lineItems.map((detail, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2.5 px-4 font-semibold">{detail.item_name}</td>
                          <td className="py-2.5 px-3 text-center">{detail.quantity}</td>
                          <td className="py-2.5 px-4 text-right">{formatRupiah(detail.unit_price)}</td>
                          <td className="py-2.5 px-4 text-right font-bold">{formatRupiah(detail.subtotal)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-900 text-white font-bold text-sm">
                      <td colSpan={3} className="py-3 px-4 text-right uppercase tracking-wider">
                        {t('receipt_total')}
                      </td>
                      <td className="py-3 px-4 text-right text-base text-amber-400">
                        {formatRupiah(record.total_cost)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            );
          })()}

          {/* Footer info */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Odomtr Digital Passport Token: {record.id}</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle size={13} />
              Verified Digital Log
            </span>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-slate-200">
            <div className="flex items-center gap-2">
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

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="danger"
                size="md"
                leftIcon={<Trash2 size={15} />}
                onClick={() => setShowConfirmDelete(true)}
              >
                Hapus Activity
              </Button>

              <Button type="button" variant="primary" size="md" leftIcon={<Printer size={15} />} onClick={handlePrint}>
                {t('receipt_print')}
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal for Deleting Activity */}
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
