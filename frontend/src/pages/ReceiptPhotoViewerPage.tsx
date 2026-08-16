import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  RotateCw,
  Download,
  Camera,
  Calendar,
  Wrench,
  Gauge,
  AlertCircle,
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle, ServiceRecord } from '../types';
import { formatDate, formatRupiah, formatMileage } from '../utils/formatters';

export function ReceiptPhotoViewerPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Zoom & Pan Interactive States
  const [scale, setScale] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!serviceId) return;
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const s = await maintenanceService.getServiceRecord('global', serviceId);
        setRecord(s);
        if (s.vehicle_id) {
          const v = await vehicleService.getVehicleById(s.vehicle_id).catch(() => null);
          setVehicle(v);
        }
      } catch (err) {
        console.error('Failed to fetch receipt photo details:', err);
        setError('Gagal memuat foto struk fisik.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [serviceId]);

  // Zoom Controls
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 4));
  };

  const handleZoomOut = () => {
    setScale((prev) => {
      const next = Math.max(prev - 0.35, 1);
      if (next === 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDoubleClick = () => {
    if (scale > 1) {
      handleResetZoom();
    } else {
      setScale(2);
    }
  };

  // Mouse Dragging logic for Pan
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || scale <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Download image helper
  const handleDownload = () => {
    if (!record?.receipt_photo_url) return;
    const a = document.createElement('a');
    a.href = record.receipt_photo_url;
    a.download = `Odomtr-Struk-${record.id.slice(0, 8)}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between select-none">
      {/* ── 1. Top Header Navigation Bar ── */}
      <header className="px-4 py-3 sm:px-6 sm:py-4 bg-slate-900/90 border-b border-slate-800 backdrop-blur-md sticky top-0 z-40 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-xs font-extrabold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-xl border border-slate-700 transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <ArrowLeft size={16} />
            <span>Kembali</span>
          </button>

          <div>
            <h1 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <Camera size={18} className="text-blue-400" />
              <span>Detail Foto Struk & Nota Fisik</span>
            </h1>
            {record && (
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Token ID: <span className="font-mono text-slate-300">#{record.id.slice(0, 8)}</span>
              </p>
            )}
          </div>
        </div>

        {record?.receipt_photo_url && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white border border-blue-400/30 transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Simpan Foto</span>
          </button>
        )}
      </header>

      {/* ── 2. Main Photo Viewing Canvas Stage ── */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20">
            <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-slate-400 font-medium">Memuat Foto Struk Fisik...</p>
          </div>
        ) : error || !record?.receipt_photo_url ? (
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md text-center space-y-3">
            <AlertCircle size={40} className="text-amber-400 mx-auto" />
            <h3 className="font-extrabold text-base text-white">Foto Struk Tidak Ditemukan</h3>
            <p className="text-xs text-slate-400">
              Tidak ada lampiran foto struk fisik untuk catatan servis ini.
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-2.5 px-5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors"
            >
              Kembali ke Halaman Sebelumnya
            </button>
          </div>
        ) : (
          <div
            ref={containerRef}
            className="w-full max-w-4xl h-[70vh] sm:h-[75vh] bg-slate-900/60 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onDoubleClick={handleDoubleClick}
          >
            <img
              src={record.receipt_photo_url}
              alt="Struk Fisik Details"
              className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out rounded-xl shadow-lg pointer-events-none"
              style={{
                transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              }}
            />

            {/* Ambient Watermark Tag */}
            <div className="absolute bottom-4 left-4 bg-slate-950/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-[10px] text-slate-400 font-mono pointer-events-none">
              Double Click untuk Zoom 2x • Drag untuk Geser
            </div>
          </div>
        )}

        {/* ── 3. Floating Interactive Zoom Controls Bar ── */}
        {record?.receipt_photo_url && (
          <div className="fixed bottom-20 sm:bottom-8 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl flex items-center gap-3">
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={scale <= 1}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom Out"
            >
              <ZoomOut size={18} />
            </button>

            <span className="font-mono text-xs font-bold text-amber-400 min-w-[45px] text-center">
              {Math.round(scale * 100)}%
            </span>

            <button
              type="button"
              onClick={handleZoomIn}
              disabled={scale >= 4}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors disabled:opacity-30 cursor-pointer"
              title="Zoom In"
            >
              <ZoomIn size={18} />
            </button>

            <div className="w-[1px] h-5 bg-slate-700" />

            <button
              type="button"
              onClick={handleRotate}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Putar 90 Derajat"
            >
              <RotateCw size={18} />
            </button>

            <button
              type="button"
              onClick={handleResetZoom}
              className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors cursor-pointer"
              title="Reset Zoom"
            >
              <RotateCcw size={18} />
            </button>
          </div>
        )}
      </main>

      {/* ── 4. Bottom Info Metadata Bar ── */}
      {record && (
        <footer className="px-4 py-3 bg-slate-900/90 border-t border-slate-800 backdrop-blur-md text-xs text-slate-400">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {vehicle && (
                <div className="flex items-center gap-2">
                  <span className="bg-amber-300 text-slate-950 font-mono font-bold px-2 py-0.5 rounded text-[11px] border border-amber-400">
                    {vehicle.license_plate}
                  </span>
                  <span className="font-extrabold text-white">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </div>
              )}
              <span className="flex items-center gap-1 text-slate-300">
                <Calendar size={13} className="text-slate-400" />
                {formatDate(record.service_date, 'full')}
              </span>
              <span className="flex items-center gap-1 text-slate-300">
                <Wrench size={13} className="text-blue-400" />
                {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY Maintenance')}
              </span>
            </div>

            <div className="font-mono font-black text-amber-400 text-sm">
              Total: {formatRupiah(record.total_cost)}
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default ReceiptPhotoViewerPage;
