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
  ShieldCheck,
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
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between select-none pb-24">
      {/* ── 1. Consistent Header Navigation Bar ── */}
      <header className="px-4 py-4 sm:px-6 bg-white border-b border-slate-200/90 sticky top-0 z-40 shadow-2xs">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2 text-xs font-extrabold text-slate-700 hover:text-slate-900 bg-white border border-slate-200/80 px-3.5 py-2 rounded-xl shadow-2xs transition-all hover:bg-slate-100 cursor-pointer active:scale-95"
            >
              <ArrowLeft size={16} />
              <span>Kembali</span>
            </button>

            <div>
              <h1 className="text-sm sm:text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Camera size={18} className="text-blue-600" />
                <span>Foto Struk & Nota Fisik Bengkel</span>
              </h1>
              {record && (
                <p className="text-[11px] text-slate-500 font-medium hidden sm:block">
                  Token Struk Digital: <span className="font-mono font-bold text-slate-700">#{record.id.slice(0, 8)}</span>
                </p>
              )}
            </div>
          </div>

          {record?.receipt_photo_url && (
            <button
              type="button"
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold bg-blue-600 hover:bg-blue-700 text-white transition-all cursor-pointer shadow-md shadow-blue-500/20 active:scale-95"
            >
              <Download size={15} />
              <span className="hidden sm:inline">Simpan Foto</span>
            </button>
          )}
        </div>
      </header>

      {/* ── 2. Main Photo Viewing Canvas Stage ── */}
      <main className="max-w-5xl w-full mx-auto p-4 sm:p-6 flex-1 flex flex-col justify-center space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-20 bg-white border border-slate-200 rounded-3xl">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-bold text-slate-600">Memuat Foto Struk Fisik...</p>
          </div>
        ) : error || !record?.receipt_photo_url ? (
          <div className="bg-white border border-slate-200 rounded-3xl p-8 text-center space-y-3 shadow-xs max-w-md mx-auto">
            <AlertCircle size={40} className="text-amber-500 mx-auto" />
            <h3 className="font-extrabold text-base text-slate-900">Foto Struk Tidak Ditemukan</h3>
            <p className="text-xs text-slate-500">
              Tidak ada lampiran foto struk fisik untuk catatan servis ini.
            </p>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="py-2.5 px-5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
            >
              Kembali ke Halaman Sebelumnya
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Dark Viewing Stage for Maximum Contrast */}
            <div
              ref={containerRef}
              className="w-full h-[65vh] sm:h-[70vh] bg-slate-950 rounded-3xl border border-slate-800 shadow-xl relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
              onDoubleClick={handleDoubleClick}
            >
              <img
                src={record.receipt_photo_url}
                alt="Struk Fisik Details"
                className="max-w-full max-h-full object-contain transition-transform duration-100 ease-out rounded-xl shadow-2xl pointer-events-none"
                style={{
                  transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
                }}
              />

              {/* Helper Watermark */}
              <div className="absolute bottom-4 left-4 bg-slate-900/90 text-slate-300 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700 text-[11px] font-mono pointer-events-none shadow-md">
                Double Click untuk Zoom 2x • Drag untuk Geser
              </div>
            </div>

            {/* ── 3. Interactive Floating Zoom Controls Bar ── */}
            <div className="bg-white border border-slate-200/90 backdrop-blur-md px-5 py-2.5 rounded-2xl shadow-md flex items-center justify-center gap-4 max-w-sm mx-auto">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={scale <= 1}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut size={18} />
              </button>

              <span className="font-mono text-xs font-black text-slate-900 min-w-[50px] text-center bg-slate-100 px-2 py-1 rounded-lg">
                {Math.round(scale * 100)}%
              </span>

              <button
                type="button"
                onClick={handleZoomIn}
                disabled={scale >= 4}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-30 cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn size={18} />
              </button>

              <div className="w-[1px] h-6 bg-slate-200" />

              <button
                type="button"
                onClick={handleRotate}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Putar 90 Derajat"
              >
                <RotateCw size={18} />
              </button>

              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw size={18} />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ── 4. Metadata Info Card (Matching Digital Receipt Modal & Vehicle Detail Cards) ── */}
      {record && (
        <footer className="max-w-5xl w-full mx-auto px-4 sm:px-6">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-4 sm:p-5 shadow-xs text-xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
              {/* Vehicle & Plate */}
              {vehicle && (
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="bg-amber-300 text-slate-900 font-mono font-black px-2.5 py-0.5 rounded border border-amber-400 text-xs shadow-2xs">
                    {vehicle.license_plate}
                  </span>
                  <span className="font-extrabold text-slate-900 text-sm">
                    {vehicle.brand} {vehicle.model}
                  </span>
                </div>
              )}

              {/* Service Date & Odometer */}
              <div className="flex items-center gap-3 text-slate-600 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Calendar size={13} className="text-slate-400" />
                  {formatDate(record.service_date, 'full')}
                </span>
                <span className="flex items-center gap-1 font-extrabold text-slate-800">
                  <Gauge size={13} className="text-purple-600" />
                  {formatMileage(record.mileage_at_service)} km
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-600">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <Wrench size={14} className="text-blue-600" />
                {record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi Terdaftar' : 'DIY Maintenance')}
              </span>
              <span className="font-mono font-black text-slate-900 text-sm sm:text-base">
                Total: {formatRupiah(record.total_cost)}
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default ReceiptPhotoViewerPage;
