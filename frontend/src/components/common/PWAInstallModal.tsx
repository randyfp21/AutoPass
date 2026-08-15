import React from 'react';
import { Monitor, Smartphone, Download, Check, X, Globe, ExternalLink } from 'lucide-react';
import { Modal } from './Modal';
import { Button } from './Button';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PWAInstallModal({ isOpen, onClose }: PWAInstallModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="💻 Cara Install Odomtr Sebagai Desktop / Mobile App"
      size="md"
    >
      <div className="space-y-5 text-xs text-slate-700 p-1">
        {/* Intro */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-3">
          <Download size={20} className="text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-blue-900 text-sm">Jadikan Odomtr Aplikasi Desktop & HP</p>
            <p className="text-blue-700 text-xs mt-0.5">
              Aplikasi dapat dibuka langsung dari Dock Mac, Taskbar Windows, atau Home Screen HP tanpa perlu membuka tab browser lagi.
            </p>
          </div>
        </div>

        {/* Chrome / Edge Desktop */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Monitor size={16} className="text-blue-600" />
            <span>1. Google Chrome / Microsoft Edge / Brave (Desktop)</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
            <li>
              Lihat di **Address Bar (URL Bar)** bagian kanan atas browser.
            </li>
            <li>
              Klik ikon <span className="font-bold text-blue-600">💻 Install App</span> atau ikon komputer bertanda panah bawah.
            </li>
            <li>
              Atau klik tombol **Titik Tiga (⋮)** di kanan atas &rarr; pilih <span className="font-semibold text-slate-900">"Install Odomtr..."</span> atau <span className="font-semibold text-slate-900">"Save and Share" &rarr; "Install App"</span>.
            </li>
          </ol>
        </div>

        {/* Mac Safari */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Globe size={16} className="text-slate-700" />
            <span>2. Safari (macOS Sonoma / Sequoia)</span>
          </div>
          <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
            <li>Buka menu **File** di bagian atas layar Mac.</li>
            <li>Pilih <span className="font-semibold text-slate-900">"Add to Dock..." (Tambahkan ke Dock)</span>.</li>
            <li>Klik **Add** untuk menjadikannya aplikasi Mac tersendiri.</li>
          </ol>
        </div>

        {/* Mobile iOS / Android */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
            <Smartphone size={16} className="text-emerald-600" />
            <span>3. Android & iPhone / iPad</span>
          </div>
          <ul className="space-y-1.5 text-slate-600">
            <li>
              • **iPhone Safari**: Klik tombol **Share (􀈂)** di bawah &rarr; pilih <span className="font-semibold text-slate-900">"Add to Home Screen"</span>.
            </li>
            <li>
              • **Android Chrome**: Klik **Titik Tiga (⋮)** di kanan atas &rarr; pilih <span className="font-semibold text-slate-900">"Install App / Add to Home Screen"</span>.
            </li>
          </ul>
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="primary" size="md" onClick={onClose}>
            Mengerti & Tutup
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default PWAInstallModal;
