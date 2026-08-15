import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  Download,
  Share2,
  Sparkles,
  Sliders,
  Type,
  Maximize2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Layers,
  Flame,
  Zap,
  Shield,
  Award,
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { vehicleService } from '../services/vehicleService';
import type { Vehicle, ServiceRecord } from '../types';
import { formatRupiah, formatMileage, formatDate } from '../utils/formatters';

// ─── Preset Types ─────────────────────────────────────────────────────────────

type FilterType = 'none' | 'cinematic' | 'cyberpunk' | 'monochrome' | 'vintage' | 'hdr';
type TypographyPreset = 'athletic' | 'cyberpunk' | 'luxury' | 'motorsport' | 'vintage';
type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

// ─── Canvas Drawing Engine (Vertical Collage & Unique Typography Presets) ─────

function renderTelemetryCanvas(
  canvas: HTMLCanvasElement,
  images: HTMLImageElement[],
  vehicle: Vehicle,
  record: ServiceRecord,
  options: {
    ratio: AspectRatio;
    filter: FilterType;
    preset: TypographyPreset;
    showPlate: boolean;
    showCost: boolean;
    showMileage: boolean;
    showItems: boolean;
    showWatermark: boolean;
  }
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // 1. Set resolution based on aspect ratio
  let width = 1080;
  let height = 1920; // 9:16 default
  if (options.ratio === '1:1') height = 1080;
  if (options.ratio === '4:5') height = 1350;
  if (options.ratio === '16:9') height = 607;

  canvas.width = width;
  canvas.height = height;

  // 2. Draw Multi-Photo Vertical Collage (Stacked Top to Bottom up to 3 photos)
  if (images.length > 0) {
    const count = images.length;
    const frameH = height / count;

    images.forEach((img, idx) => {
      ctx.save();

      // Apply Filter Matrix
      if (options.filter === 'cinematic') {
        ctx.filter = 'contrast(125%) saturate(140%) hue-rotate(-10deg)';
      } else if (options.filter === 'cyberpunk') {
        ctx.filter = 'contrast(135%) saturate(180%) hue-rotate(140deg)';
      } else if (options.filter === 'monochrome') {
        ctx.filter = 'grayscale(100%) contrast(150%) brightness(90%)';
      } else if (options.filter === 'vintage') {
        ctx.filter = 'sepia(60%) contrast(110%) saturate(120%)';
      } else if (options.filter === 'hdr') {
        ctx.filter = 'contrast(140%) saturate(150%) brightness(105%)';
      } else {
        ctx.filter = 'none';
      }

      const frameY = idx * frameH;
      const imgAspect = img.naturalWidth / img.naturalHeight;
      const frameAspect = width / frameH;
      let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

      if (imgAspect > frameAspect) {
        sw = img.naturalHeight * frameAspect;
        sx = (img.naturalWidth - sw) / 2;
      } else {
        sh = img.naturalWidth / frameAspect;
        sy = (img.naturalHeight - sh) / 2;
      }

      // Clip region to this vertical frame slice
      ctx.beginPath();
      ctx.rect(0, frameY, width, frameH);
      ctx.clip();

      ctx.drawImage(img, sx, sy, sw, sh, 0, frameY, width, frameH);

      // Sleek dividing border line between collage frames
      if (idx > 0) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(0, frameY);
        ctx.lineTo(width, frameY);
        ctx.stroke();
      }

      ctx.restore();
    });
  } else {
    // Solid dark gradient background when no photo uploaded
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#0F172A');
    bgGrad.addColorStop(1, '#020617');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);
  }

  // 3. Ambient Dark Shader Gradient Overlay (Bottom 55%)
  const gradHeight = height * 0.55;
  const grad = ctx.createLinearGradient(0, height - gradHeight, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.35, 'rgba(15,23,42,0.5)');
  grad.addColorStop(1, 'rgba(2,6,23,0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - gradHeight, width, gradHeight);

  // Subtle top gradient
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.2);
  topGrad.addColorStop(0, 'rgba(2,6,23,0.6)');
  topGrad.addColorStop(1, 'rgba(2,6,23,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.2);

  // 4. Preset Theme Colors & Typography Fonts Config
  let primaryColor = '#FC5200';
  let fontMain = "'Rajdhani', sans-serif";
  let fontTitle = "'Rajdhani', sans-serif";
  let themeTitle = '⚡ ODOMTR ATHLETIC TELEMETRY';

  if (options.preset === 'cyberpunk') {
    primaryColor = '#00F0FF';
    fontMain = "'Courier New', monospace";
    fontTitle = "'Rajdhani', sans-serif";
    themeTitle = '🌆 CYBERPUNK TELEMETRY DATA';
  } else if (options.preset === 'luxury') {
    primaryColor = '#D4AF37'; // Gold
    fontMain = "'Playfair Display', serif";
    fontTitle = "'Playfair Display', serif";
    themeTitle = '🏆 ODOMTR LUXURY PASSPORT';
  } else if (options.preset === 'motorsport') {
    primaryColor = '#FFDD00'; // Speed Yellow
    fontMain = "'Bebas Neue', sans-serif";
    fontTitle = "'Bebas Neue', sans-serif";
    themeTitle = '🏁 MOTORSPORT RACING GRID';
  } else if (options.preset === 'vintage') {
    primaryColor = '#F59E0B'; // Sepia Amber
    fontMain = "'Courier New', monospace";
    fontTitle = "'Courier New', monospace";
    themeTitle = '📜 RETRO VINTAGE STAMP';
  }

  const pad = 60;
  let currentY = height - (options.ratio === '16:9' ? 40 : 80);

  // ── Watermark Logo ──
  if (options.showWatermark) {
    ctx.save();
    ctx.font = `bold 28px ${fontTitle}`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Odo Telemetry Studio ⚡', width - pad, currentY);
    ctx.restore();
  }

  // Calculate layout upward
  let contentY = currentY - (options.ratio === '16:9' ? 140 : 270);

  // ── Top Header Pill Badge ──
  ctx.save();
  const headerY = options.ratio === '9:16' ? 100 : 50;
  const headerW = 440;
  const headerH = 50;
  ctx.fillStyle = primaryColor;
  ctx.beginPath();
  ctx.roundRect(pad, headerY, headerW, headerH, 12);
  ctx.fill();

  ctx.font = `bold 22px ${fontTitle}`;
  ctx.fillStyle = options.preset === 'motorsport' ? '#000000' : '#FFFFFF';
  ctx.textBaseline = 'middle';
  ctx.fillText(themeTitle, pad + 20, headerY + headerH / 2);
  ctx.restore();

  // ── License Plate Badge ──
  if (options.showPlate) {
    const plateText = vehicle.license_plate;
    ctx.save();
    ctx.font = `bold 64px 'Rajdhani', sans-serif`;
    const plateW = ctx.measureText(plateText).width + 44;
    const plateH = 80;
    const plateX = pad;
    const plateY = contentY - 90;

    // Yellow Indonesian Plate style
    ctx.fillStyle = '#FFDD00';
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateW, plateH, 12);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateText, plateX + 22, plateY + plateH / 2);
    ctx.restore();
  }

  // ── Vehicle Brand & Model ──
  ctx.save();
  ctx.font = `bold 56px ${fontTitle}`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top';
  ctx.fillText(`${vehicle.brand} ${vehicle.model}`, pad, contentY);
  ctx.restore();

  // ── Workshop Tag ──
  const workshopName = record.is_official_workshop
    ? (record.workshop_name_manual ?? 'Bengkel Resmi Partner')
    : `🔧 ${record.workshop_name_manual ?? 'DIY Maintenance'}`;

  ctx.save();
  ctx.font = `600 34px ${fontMain}`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textBaseline = 'top';
  ctx.fillText(workshopName, pad, contentY + 68);
  ctx.restore();

  // ── Date & Odometer ──
  ctx.save();
  ctx.font = `500 30px ${fontMain}`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textBaseline = 'top';
  ctx.fillText(`📅 ${formatDate(record.service_date, 'full')}`, pad, contentY + 115);
  if (options.showMileage) {
    ctx.fillText(`🛣️ ${formatMileage(record.mileage_at_service)} km`, pad + 380, contentY + 115);
  }
  ctx.restore();

  // ── Total Cost Badge ──
  if (options.showCost) {
    ctx.save();
    ctx.font = `bold 32px ${fontTitle}`;
    ctx.fillStyle = primaryColor;
    ctx.textBaseline = 'top';
    ctx.fillText(`💰 Total Biaya: ${formatRupiah(record.total_cost)}`, pad, contentY + 160);
    ctx.restore();
  }

  // ── Top Service Items ──
  if (options.showItems) {
    const rawItems = (record.items && record.items.length > 0) ? record.items : (record.details || []);
    const topItems = rawItems.slice(0, 3);

    topItems.forEach((item, i) => {
      ctx.save();
      ctx.font = `500 28px ${fontMain}`;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.textBaseline = 'top';
      ctx.fillText(`✓  ${item.item_name}`, pad, contentY + (options.showCost ? 205 : 160) + i * 40);
      ctx.restore();
    });
  }
}

// ─── Main Studio Page Component ───────────────────────────────────────────────

export function TelemetryStudioPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [record, setRecord] = useState<ServiceRecord | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Studio Controls: Up to 3 Uploaded Images for Vertical Collage
  const [loadedImages, setLoadedImages] = useState<HTMLImageElement[]>([]);
  const [ratio, setRatio] = useState<AspectRatio>('9:16');
  const [filter, setFilter] = useState<FilterType>('none');
  const [preset, setPreset] = useState<TypographyPreset>('athletic');

  // Overlays Toggles
  const [showPlate, setShowPlate] = useState(true);
  const [showCost, setShowCost] = useState(true);
  const [showMileage, setShowMileage] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);

  // Fetch Service & Vehicle Data
  useEffect(() => {
    if (!serviceId) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const s = await maintenanceService.getServiceRecord('global', serviceId);
        setRecord(s);
        if (s.vehicle_id) {
          const v = await vehicleService.getVehicleById(s.vehicle_id);
          setVehicle(v);
          if (s.receipt_photo_url) {
            const img = new window.Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => setLoadedImages([img]);
            img.src = s.receipt_photo_url;
          }
        }
      } catch {
        setError('Gagal memuat detail servis untuk studio telemetri');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [serviceId]);

  // Real-time Canvas Render
  const renderCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !vehicle || !record) return;
    renderTelemetryCanvas(canvas, loadedImages, vehicle, record, {
      ratio,
      filter,
      preset,
      showPlate,
      showCost,
      showMileage,
      showItems,
      showWatermark,
    });
  }, [canvasRef, loadedImages, vehicle, record, ratio, filter, preset, showPlate, showCost, showMileage, showItems, showWatermark]);

  useEffect(() => {
    renderCanvas();
  }, [renderCanvas]);

  const handleAddFile = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    if (loadedImages.length >= 3) {
      setError('Maksimal 3 foto untuk kolase vertikal');
      return;
    }
    setError('');

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setLoadedImages((prev) => [...prev, img].slice(0, 3));
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleRemoveImage = (index: number) => {
    setLoadedImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas || !vehicle || !record) return;
    const link = document.createElement('a');
    link.download = `telemetry_collage_${vehicle.license_plate}_${record.service_date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas || !vehicle) return;
    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `telemetry_collage_${vehicle.license_plate}.png`, { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Telemetri Servis ${vehicle.brand} ${vehicle.model}`,
            text: `Hasil telemetri servis kendaraan ${vehicle.license_plate} via Odo Threads`,
          });
        } catch {
          // User cancelled
        }
      } else {
        handleDownload();
      }
    }, 'image/png');
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-slate-800">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-extrabold">Memuat Odo Telemetry Studio...</p>
        </div>
      </div>
    );
  }

  if (error || !record || !vehicle) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-900 text-base mb-2">{error || 'Data servis tidak ditemukan'}</h2>
          <button
            onClick={() => navigate(-1)}
            className="py-2.5 px-4 bg-slate-900 text-white rounded-full text-xs font-extrabold cursor-pointer"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen flex flex-col pb-24">
      {/* Hidden File Inputs */}
      <input ref={galleryInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleAddFile(e.target.files[0])} />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => e.target.files?.[0] && handleAddFile(e.target.files[0])} />

      {/* ── Studio Top Bar Navigation ── */}
      <div className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-lg font-black font-tech tracking-wide text-slate-900 flex items-center gap-2">
              <Sparkles size={18} className="text-purple-600" />
              Odo Telemetry & Story Studio
            </h1>
            <p className="text-[11px] text-slate-500 font-medium">
              {vehicle.brand} {vehicle.model} · {vehicle.license_plate}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-800 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">Download PNG</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Share2 size={14} />
            <span>Bagikan Story</span>
          </button>
        </div>
      </div>

      {/* ── Main Studio Grid ── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Live Canvas Viewport Container */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl relative">
          <div className="w-full flex items-center justify-between mb-4">
            <span className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 size={14} className="text-purple-400" /> Live High-Res Canvas ({loadedImages.length} Foto Kolase Vertikal)
            </span>
            <span className="text-[11px] font-mono text-purple-300 bg-purple-950/80 px-2.5 py-1 rounded-full border border-purple-800/60">
              Rasio {ratio}
            </span>
          </div>

          <div className="w-full flex justify-center items-center overflow-hidden">
            <canvas
              ref={canvasRef}
              className="rounded-2xl shadow-2xl border border-slate-700 max-h-[580px] object-contain transition-all"
            />
          </div>
        </div>

        {/* Right Column: Studio Control Panel */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Multi-Photo Collage Media Picker (Max 3 Photos) */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={15} className="text-purple-600" /> Kolase Vertikal ({loadedImages.length}/3 Foto)
              </h3>
              <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-md">
                Maksimal 3 Foto
              </span>
            </div>

            {/* Thumbnail Strip */}
            {loadedImages.length > 0 && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {loadedImages.map((img, idx) => (
                  <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border-2 border-purple-500 shrink-0 group">
                    <img src={img.src} alt={`Frame ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-red-400 cursor-pointer"
                      title="Hapus Frame Foto Ini"
                    >
                      <Trash2 size={16} />
                    </button>
                    <span className="absolute bottom-1 left-1 text-[9px] font-black text-white bg-slate-900/80 px-1 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}

                {loadedImages.length < 3 && (
                  <button
                    type="button"
                    onClick={() => galleryInputRef.current?.click()}
                    className="w-16 h-16 rounded-xl border-2 border-dashed border-purple-300 hover:border-purple-600 bg-purple-50/50 hover:bg-purple-50 flex flex-col items-center justify-center text-purple-600 transition-colors shrink-0 cursor-pointer"
                  >
                    <Plus size={18} />
                    <span className="text-[9px] font-bold mt-0.5">+ Foto</span>
                  </button>
                )}
              </div>
            )}

            {/* Action Buttons for Adding Photos */}
            {loadedImages.length < 3 && (
              <div className="grid grid-cols-2 gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-transform active:scale-95"
                >
                  <Camera size={16} />
                  <span>📷 Kamera Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="py-3 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
                >
                  <ImageIcon size={16} className="text-purple-600" />
                  <span>🖼️ Pilih Galeri</span>
                </button>
              </div>
            )}
          </div>

          {/* 2. Unique Typography & Overlay Presets */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Type size={15} className="text-purple-600" /> Template Tipografi & Overlay Unik
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'athletic' as TypographyPreset, label: '🏎️ Athletic HUD', desc: 'Futuristik Orange & Rajdhani' },
                  { id: 'cyberpunk' as TypographyPreset, label: '🌆 Cyberpunk Neon', desc: 'Neon Cyan & Code Monospace' },
                  { id: 'luxury' as TypographyPreset, label: '🏆 Luxury Gold', desc: 'Gold Foil & Playfair Serif' },
                  { id: 'motorsport' as TypographyPreset, label: '🏁 Motorsport Grid', desc: 'Indonesian Plate & Bebas' },
                  { id: 'vintage' as TypographyPreset, label: '📜 Retro Vintage', desc: 'Warm Sepia & Stamp Typewriter' },
                ]
              ).map((p) => (
                <button
                  key={p.id}
                  onClick={() => setPreset(p.id)}
                  className={[
                    'p-3 rounded-2xl border transition-all cursor-pointer text-left',
                    preset === p.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-md'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100',
                  ].join(' ')}
                >
                  <p className="text-xs font-black flex items-center justify-between">
                    <span>{p.label}</span>
                    {preset === p.id && <CheckCircle2 size={14} className="text-amber-400" />}
                  </p>
                  <p className="text-[10px] text-slate-400 font-medium mt-0.5">{p.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* 3. Aspect Ratio Selector */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Maximize2 size={15} className="text-purple-600" /> Aspek Rasio Kanvas
            </h3>
            <div className="grid grid-cols-4 gap-2">
              {(
                [
                  { id: '9:16', label: '9:16 Story' },
                  { id: '1:1', label: '1:1 Feed' },
                  { id: '4:5', label: '4:5 Portrait' },
                  { id: '16:9', label: '16:9 Banner' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  onClick={() => setRatio(item.id)}
                  className={[
                    'py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center',
                    ratio === item.id
                      ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                  ].join(' ')}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* 4. Photo Filter Matrix */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={15} className="text-purple-600" /> Filter Warna Foto
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  { id: 'none', label: 'Original' },
                  { id: 'cinematic', label: '🎬 Cinematic' },
                  { id: 'cyberpunk', label: '🌆 Cyberpunk' },
                  { id: 'monochrome', label: '🖤 B&W' },
                  { id: 'vintage', label: '📜 Vintage' },
                  { id: 'hdr', label: '✨ Vivid HDR' },
                ] as const
              ).map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFilter(f.id)}
                  className={[
                    'py-2.5 px-2 rounded-xl text-xs font-extrabold border transition-all cursor-pointer text-center',
                    filter === f.id
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white border-purple-500 shadow-md'
                      : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200 hover:text-slate-900',
                  ].join(' ')}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* 5. Telemetry Overlays Toggle Switches */}
          <div className="bg-white border border-slate-200/90 rounded-3xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-extrabold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={15} className="text-purple-600" /> Elemen Telemetri Ditampilkan
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs font-bold">
              {[
                { label: 'Plat Nomor', state: showPlate, set: setShowPlate },
                { label: 'Total Biaya', state: showCost, set: setShowCost },
                { label: 'Odometer KM', state: showMileage, set: setShowMileage },
                { label: 'Item Servis', state: showItems, set: setShowItems },
                { label: 'Watermark Logo', state: showWatermark, set: setShowWatermark },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => item.set(!item.state)}
                  className={[
                    'p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer',
                    item.state
                      ? 'bg-purple-50 border-purple-200 text-purple-900'
                      : 'bg-slate-50 border-slate-200 text-slate-500',
                  ].join(' ')}
                >
                  <span>{item.label}</span>
                  <div
                    className={[
                      'w-4 h-4 rounded-md border flex items-center justify-center',
                      item.state ? 'bg-purple-600 border-purple-600 text-white' : 'border-slate-300',
                    ].join(' ')}
                  >
                    {item.state && <CheckCircle2 size={12} />}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TelemetryStudioPage;
