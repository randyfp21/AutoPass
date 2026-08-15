import React, { useEffect } from 'react';
import { Calendar, X, Sparkles, Upload } from 'lucide-react';

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
  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4 bg-slate-900/65 backdrop-blur-sm animate-in fade-in duration-200 select-none w-screen h-screen">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200 my-auto text-left select-text max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h3 className="font-extrabold text-base">Pilih Jenis Servis</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Options */}
        <div className="p-6 space-y-4 flex-1 overflow-y-auto">
          {/* Option 1: Rencana service (Buat Planner) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectSchedulePlan();
            }}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-blue-500 bg-slate-50 hover:bg-blue-50/50 flex items-start gap-4 transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
              <Calendar size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors">
                1. Rencana Service (Buat Planner)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Jadwalkan rencana servis berkala mendatang (Target Tanggal & Odometer KM).
              </p>
            </div>
          </button>

          {/* Option 2: Instant Log (Langsung buat log service & upload struk) */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onSelectInstantLog();
            }}
            className="w-full p-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 flex items-start gap-4 transition-all duration-200 text-left group cursor-pointer"
          >
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform shadow-xs">
              <Upload size={24} />
            </div>
            <div className="space-y-1">
              <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-emerald-600 transition-colors">
                2. Instant Log (Catat Servis & Struk)
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Catat riwayat servis yang telah selesai secara instan beserta upload foto struk digital.
              </p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ServiceOptionSelectorModal;
