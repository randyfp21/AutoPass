import React from 'react';
import { Calendar, Wrench, ChevronRight, Sparkles } from 'lucide-react';
import { Modal } from '../common/Modal';
import { useTranslation } from '../../context/LanguageContext';

interface ServiceOptionSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSchedulePlan: () => void;
  onSelectInstantLog: () => void;
}

export function ServiceOptionSelectorModal({
  isOpen,
  onClose,
  onSelectSchedulePlan,
  onSelectInstantLog,
}: ServiceOptionSelectorModalProps) {
  const { t } = useTranslation();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="⚡ Pilih Jenis Catatan Servis"
      size="md"
    >
      <div className="space-y-4 py-2">
        <p className="text-xs text-slate-500">
          Pilih opsi yang ingin Anda catat untuk kendaraan pribadi Anda:
        </p>

        {/* Option 1: Schedule Future Service Plan */}
        <div
          onClick={() => {
            onClose();
            onSelectSchedulePlan();
          }}
          className="bg-white border-2 border-slate-200 hover:border-blue-500 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Calendar size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                📅 Rencana / Jadwal Servis Mendatang
              </h3>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Atur tanggal rencana servis rutin di masa depan, target kilometer, & catatan keperluan bengkel.
            </p>
            <span className="inline-block mt-2 text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-150">
              Pengingat Kalender
            </span>
          </div>
        </div>

        {/* Option 2: Instant Log Servis / Done Today (Servis Mendadak) */}
        <div
          onClick={() => {
            onClose();
            onSelectInstantLog();
          }}
          className="bg-white border-2 border-slate-200 hover:border-emerald-500 rounded-2xl p-4 transition-all hover:shadow-md cursor-pointer group flex items-start gap-4"
        >
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
            <Wrench size={24} />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                🔧 Log Servis (Servis Mendadak / Selesai Hari Ini)
              </h3>
              <ChevronRight size={18} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Catat langsung penggantian sparepart, oli, & rincian biaya dari servis darurat yang baru dilakukan.
            </p>
            <span className="inline-block mt-2 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-150">
              Langsung Tambah Struk Digital
            </span>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default ServiceOptionSelectorModal;
