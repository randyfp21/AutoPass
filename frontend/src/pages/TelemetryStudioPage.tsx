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
  Info,
  Send,
  RefreshCw,
  X,
} from 'lucide-react';
import { maintenanceService } from '../services/maintenanceService';
import { vehicleService } from '../services/vehicleService';
import { threadsService } from '../services/threadsService';
import { Modal } from '../components/common/Modal';
import type { Vehicle, ServiceRecord, ThreadCategory } from '../types';
import { formatRupiah, formatMileage, formatDate } from '../utils/formatters';

// ─── Preset Types ─────────────────────────────────────────────────────────────

type FilterType = 'none' | 'cinematic' | 'cyberpunk' | 'monochrome' | 'vintage' | 'hdr';
type TypographyPreset = 'athletic' | 'cyberpunk' | 'luxury' | 'motorsport' | 'vintage';
type AspectRatio = '9:16' | '1:1' | '4:5' | '16:9';

// ─── Canvas Drawing Engine (Custom Unique Typography & IG Story Safe Zone) ─────

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

  // 3. Ambient Dark Shader Gradient Overlay (Top 25% & Bottom 60%)
  const gradHeight = height * 0.6;
  const grad = ctx.createLinearGradient(0, height - gradHeight, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.35, 'rgba(15,23,42,0.5)');
  grad.addColorStop(1, 'rgba(2,6,23,0.96)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - gradHeight, width, gradHeight);

  // Top gradient for IG Story upper safe zone
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.3);
  topGrad.addColorStop(0, 'rgba(2,6,23,0.75)');
  topGrad.addColorStop(1, 'rgba(2,6,23,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.3);

  // 4. Preset Theme Colors & Typography Fonts Config
  let primaryColor = '#FC5200';
  let fontMain = "'Inter', sans-serif";

  if (options.preset === 'cyberpunk') {
    primaryColor = '#00F0FF';
    fontMain = "'Courier New', monospace";
  } else if (options.preset === 'luxury') {
    primaryColor = '#D4AF37'; // Gold
    fontMain = "'Playfair Display', serif";
  } else if (options.preset === 'motorsport') {
    primaryColor = '#FFDD00'; // Speed Yellow
    fontMain = "'Bebas Neue', sans-serif";
  } else if (options.preset === 'vintage') {
    primaryColor = '#F59E0B'; // Sepia Amber
    fontMain = "'Courier New', monospace";
  }

  const padLeft = 70;

  // ─── A. POJOK KIRI ATAS (TOP LEFT CORNER - IG STORY SAFE ZONE) ───
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  let topLeftY = options.ratio === '9:16' ? 140 : 70;

  // 1. Line 1: Wah Perjalanan [nickname kendaraan] sudah
  ctx.font = `500 32px ${fontMain}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
  ctx.textBaseline = 'top';
  const nicknameText = vehicle.nickname ? vehicle.nickname : vehicle.model;
  ctx.fillText(`Wah Perjalanan ${nicknameText} sudah`, padLeft, topLeftY);

  // 2. Line 2 (NGE-POP DISPLAY): [VALUE ODOMETER]KM
  if (options.showMileage) {
    topLeftY += 45;
    const mileageText = formatMileage(record.mileage_at_service);
    ctx.font = `bold ${options.ratio === '16:9' ? '76px' : '112px'} 'Rajdhani', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(mileageText, padLeft, topLeftY);

    const mileageWidth = ctx.measureText(mileageText).width;
    ctx.font = `bold 46px 'Rajdhani', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.fillText('KM', padLeft + mileageWidth + 16, topLeftY + (options.ratio === '16:9' ? 24 : 48));

    // 3. Line 3 (Font mengecil): Waktunya service rutin !
    topLeftY += options.ratio === '16:9' ? 85 : 124;
    ctx.font = `italic 500 28px ${fontMain}`;
    ctx.fillStyle = primaryColor;
    ctx.fillText('Waktunya service rutin !', padLeft, topLeftY);
  }
  ctx.restore();

  // ─── B. POJOK KANAN BAWAH (BOTTOM RIGHT WATERMARK) ───
  if (options.showWatermark) {
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
    ctx.shadowBlur = 10;
    const botRightY = height - (options.ratio === '9:16' ? 140 : 60);
    ctx.font = `bold 42px 'Rajdhani', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText('Odomtr.', width - padLeft, botRightY);
    ctx.restore();
  }

  // ─── C. POJOK KIRI BAWAH (BOTTOM LEFT CORNER) ───
  ctx.save();
  ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
  ctx.shadowBlur = 12;

  let botLeftY = height - (options.ratio === '9:16' ? 140 : 60);

  // Measure service items height to stack upwards
  const rawItems = (record.items && record.items.length > 0) ? record.items : (record.details || []);
  const topItems = options.showItems ? rawItems.slice(0, 3) : [];
  const itemsHeight = topItems.length * 36;

  // Calculate bottom-left anchor Y position
  botLeftY -= itemsHeight;

  // 1. List detail service items
  if (topItems.length > 0) {
    topItems.forEach((item, i) => {
      ctx.font = `500 26px ${fontMain}`;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`✓  ${item.item_name}`, padLeft, botLeftY + i * 36);
    });
  }

  // 2. Line 3 & 4: [Nickname kendaran] Jajan & (font sedikit membesar) [Biaya Service]
  if (options.showCost) {
    // Line 4: Biaya Service (Font sedikit membesar / bold price tag 58px!)
    botLeftY -= 48;
    ctx.font = `bold 58px 'Rajdhani', sans-serif`;
    ctx.fillStyle = primaryColor;
    ctx.textBaseline = 'bottom';
    ctx.fillText(formatRupiah(record.total_cost), padLeft, botLeftY);

    // Line 3: Nickname Jajan
    botLeftY -= 54;
    ctx.font = `bold 32px ${fontMain}`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    const nickOrModel = vehicle.nickname ? vehicle.nickname : vehicle.model;
    ctx.fillText(`${nickOrModel} Jajan`, padLeft, botLeftY);
  }

  // 3. Line 2: (Icon location) [Nama Bengkel]
  botLeftY -= 44;
  const wName = record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi Partner' : 'DIY Maintenance');
  ctx.font = `600 30px ${fontMain}`;
  ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`📍 ${wName}`, padLeft, botLeftY);

  // 4. Line 1: Merek dan Model motor - Tahun motor
  botLeftY -= 52;
  ctx.font = `bold 48px 'Rajdhani', sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'bottom';
  ctx.fillText(`${vehicle.brand} ${vehicle.model} - ${vehicle.manufacture_year}`, padLeft, botLeftY);

  // Optional: License Plate Badge right above brand & model if showPlate is true
  if (options.showPlate) {
    const plateText = vehicle.license_plate;
    ctx.font = `bold 44px 'Rajdhani', sans-serif`;
    const plateW = ctx.measureText(plateText).width + 32;
    const plateH = 58;
    const plateX = padLeft;
    const plateY = botLeftY - plateH - 20;

    ctx.fillStyle = '#FFDD00';
    ctx.beginPath();
    ctx.roundRect(plateX, plateY, plateW, plateH, 8);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateText, plateX + 16, plateY + plateH / 2);
  }

  ctx.restore();
}

// ─── Main Studio Page Component ───────────────────────────────────────────────

export function TelemetryStudioPage() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const liveVideoRef = useRef<HTMLVideoElement>(null);

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
  const [showPlate, setShowPlate] = useState(false);
  const [showCost, setShowCost] = useState(true);
  const [showMileage, setShowMileage] = useState(true);
  const [showItems, setShowItems] = useState(true);
  const [showWatermark, setShowWatermark] = useState(true);

  // Live Camera WebRTC State & Viewfinder Modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');

  // Post to Threads State & Modal
  const [showPostModal, setShowPostModal] = useState(false);
  const [postCaption, setPostCaption] = useState('');
  const [postCategory, setPostCategory] = useState<ThreadCategory>('pengalaman');
  const [canvasDataUrl, setCanvasDataUrl] = useState('');
  const [isPosting, setIsPosting] = useState(false);

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

  // ─── WebRTC Live Camera Controls ──────────────────────────────────────────────

  const stopCameraStream = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
  }, [cameraStream]);

  const handleStartLiveCamera = async (mode: 'environment' | 'user' = facingMode) => {
    if (loadedImages.length >= 3) {
      setError('Maksimal 3 foto untuk kolase vertikal');
      return;
    }
    setError('');
    setShowCameraModal(true);

    try {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      setCameraStream(stream);
      if (liveVideoRef.current) {
        liveVideoRef.current.srcObject = stream;
        liveVideoRef.current.play();
      }
    } catch {
      // Fallback to HTML5 file capture input if permission is blocked
      cameraInputRef.current?.click();
      setShowCameraModal(false);
    }
  };

  const handleCaptureLivePhoto = () => {
    const video = liveVideoRef.current;
    if (!video) return;

    const snapCanvas = document.createElement('canvas');
    snapCanvas.width = video.videoWidth || 1280;
    snapCanvas.height = video.videoHeight || 720;
    const ctx = snapCanvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0, snapCanvas.width, snapCanvas.height);
      const dataUrl = snapCanvas.toDataURL('image/png');
      const img = new window.Image();
      img.onload = () => {
        setLoadedImages((prev) => [...prev, img].slice(0, 3));
      };
      img.src = dataUrl;
    }

    stopCameraStream();
    setShowCameraModal(false);
  };

  const handleCloseCameraModal = () => {
    stopCameraStream();
    setShowCameraModal(false);
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

  // Open Direct Post to Odo Threads Modal
  const handleOpenPostModal = () => {
    const canvas = canvasRef.current;
    if (!canvas || !vehicle || !record) return;
    const url = canvas.toDataURL('image/png');
    setCanvasDataUrl(url);

    const nicknameText = vehicle.nickname ? vehicle.nickname : vehicle.model;
    const wName = record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi Partner' : 'DIY Maintenance');
    const defaultCaption = `Wah Perjalanan ${nicknameText} sudah ${formatMileage(record.mileage_at_service)} KM!\nWaktunya service rutin ! 🛠️\n\n📍 ${wName}\n💰 ${nicknameText} Jajan ${formatRupiah(record.total_cost)}\n\n#OdoThreads #AutoPass #VehicleTelemetry`;

    setPostCaption(defaultCaption);
    setShowPostModal(true);
  };

  // Submit Direct Post to Odo Threads API
  const handlePostToThreadsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption.trim() || !canvasDataUrl) return;

    setIsPosting(true);
    try {
      const newThread = await threadsService.createThread({
        vehicle_id: vehicle?.id,
        content: postCaption,
        photo_urls: [canvasDataUrl],
        category: postCategory,
      });

      setShowPostModal(false);
      navigate(`/threads/${newThread.id}`);
    } catch {
      setError('Gagal memposting ke Odo Threads');
    } finally {
      setIsPosting(false);
    }
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
            className="py-2 px-3 bg-white hover:bg-slate-100 text-slate-800 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Download size={14} />
            <span className="hidden sm:inline">PNG</span>
          </button>

          <button
            onClick={handleShare}
            className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            <Share2 size={14} />
            <span className="hidden sm:inline">Bagikan</span>
          </button>

          {/* 🚀 Direct Post to Odo Threads Logo Button */}
          <button
            onClick={handleOpenPostModal}
            className="py-2 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Send size={14} />
            <span>Post ke Threads</span>
          </button>
        </div>
      </div>

      {/* ── Main Studio Grid ── */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
        {/* Left Column: Refactored Ultra-Clean Canvas Viewport Card */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-3xl p-5 sm:p-6 shadow-xs flex flex-col justify-between space-y-4">
          {/* Header Status Bar above Canvas */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
                <Maximize2 size={16} />
              </div>
              <div>
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                  Kanvas Telemetri Pratinjau
                </h3>
                <p className="text-[11px] text-slate-500 font-medium">
                  {loadedImages.length === 0
                    ? '0 Foto · Menggunakan background shader telemetri'
                    : `${loadedImages.length} Foto Kolase Vertikal Tersusun`}
                </p>
              </div>
            </div>

            <span className="text-[11px] font-mono font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Rasio {ratio}
            </span>
          </div>

          {/* Dark Glass Canvas Studio Viewport Box - Expanded Large Display */}
          <div className="relative bg-slate-950 rounded-2xl p-4 sm:p-8 border border-slate-800 shadow-2xl flex items-center justify-center min-h-[580px] sm:min-h-[700px] lg:min-h-[780px] w-full overflow-hidden group">
            <canvas
              ref={canvasRef}
              className="rounded-2xl shadow-2xl max-h-[720px] sm:max-h-[760px] w-auto max-w-full object-contain transition-transform duration-300 transform-gpu group-hover:scale-[1.01]"
            />

            {/* Helper Floating Badge when 0 Photos */}
            {loadedImages.length === 0 && (
              <div className="absolute bottom-6 inset-x-6 text-center">
                <div className="inline-flex items-center gap-2 text-xs font-bold text-slate-200 bg-slate-900/90 backdrop-blur-md px-4 py-2 rounded-full border border-slate-700 shadow-xl">
                  <Info size={16} className="text-amber-400 shrink-0" />
                  <span>Tekan "📷 Kamera" atau "🖼️ Galeri" untuk menambahkan foto kendaraan</span>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Quick Studio Info & Direct Post Trigger */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs">
            <span className="text-slate-500 font-medium">Resolusi Tinggi HD (1080p Export)</span>
            <button
              onClick={handleOpenPostModal}
              className="py-2 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-full font-extrabold flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Send size={13} className="text-blue-400" />
              <span>Langsung Post ke Odo Threads 🚀</span>
            </button>
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
                  onClick={() => handleStartLiveCamera('environment')}
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

      {/* 📸 Live WebRTC Camera Viewfinder Modal */}
      {showCameraModal && (
        <Modal
          isOpen={showCameraModal}
          onClose={handleCloseCameraModal}
          title="📷 Live Camera Viewfinder"
          size="md"
        >
          <div className="space-y-4">
            <div className="relative bg-black rounded-2xl overflow-hidden aspect-[4/3] flex items-center justify-center border border-slate-800 shadow-2xl">
              <video
                ref={liveVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Viewfinder Target Reticle */}
              <div className="absolute inset-0 pointer-events-none border-2 border-white/20 m-6 rounded-xl flex items-center justify-center">
                <div className="w-12 h-12 border-2 border-purple-500/80 rounded-full animate-ping opacity-50" />
              </div>

              {/* Camera Switcher Button */}
              <button
                type="button"
                onClick={() => {
                  const newMode = facingMode === 'environment' ? 'user' : 'environment';
                  setFacingMode(newMode);
                  handleStartLiveCamera(newMode);
                }}
                className="absolute top-3 right-3 p-2.5 bg-slate-900/80 hover:bg-slate-900 text-white rounded-full backdrop-blur-md border border-slate-700 transition-transform active:scale-90 cursor-pointer shadow-md"
                title="Ganti Kamera Depan/Belakang"
              >
                <RefreshCw size={16} />
              </button>
            </div>

            {/* Camera Actions */}
            <div className="flex items-center justify-between gap-3 pt-2">
              <button
                type="button"
                onClick={handleCloseCameraModal}
                className="py-3 px-5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={handleCaptureLivePhoto}
                className="flex-1 py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-black shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-transform active:scale-95"
              >
                <Camera size={18} />
                <span>📸 Ambil Foto Snapshot</span>
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 🚀 Direct Post to Odo Threads Modal */}
      {showPostModal && (
        <Modal
          isOpen={showPostModal}
          onClose={() => setShowPostModal(false)}
          title="🚀 Posting Langsung ke Odo Threads"
          size="md"
        >
          <form onSubmit={handlePostToThreadsSubmit} className="space-y-4">
            {/* Story Image Preview */}
            {canvasDataUrl && (
              <div className="relative h-56 bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 flex items-center justify-center shadow-md">
                <img src={canvasDataUrl} alt="Pratinjau Telemetri Story" className="h-full object-contain" />
                <span className="absolute top-2 right-2 text-[10px] font-black text-white bg-blue-600 px-2.5 py-1 rounded-full shadow">
                  ✨ Auto Telemetry Story
                </span>
              </div>
            )}

            {/* Category Selector */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Pilih Kategori Diskusi Threads
              </label>
              <select
                value={postCategory}
                onChange={(e) => setPostCategory(e.target.value as ThreadCategory)}
                className="input-field text-sm"
              >
                <option value="pengalaman">💬 Pengalaman Servis</option>
                <option value="tips">💡 Tips Perawatan</option>
                <option value="modifikasi">🔧 Modifikasi & Upgrades</option>
                <option value="general">🌐 Beranda Umum</option>
                <option value="kendala">⚠️ Kendala & Perbaikan</option>
              </select>
            </div>

            {/* Caption Textarea */}
            <div>
              <label className="block text-xs font-extrabold text-slate-700 mb-1.5">
                Caption Thread Anda <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={5}
                required
                className="input-field text-sm resize-none"
                placeholder="Tuliskan pengalaman servis atau cerita kendaraan Anda..."
                value={postCaption}
                onChange={(e) => setPostCaption(e.target.value)}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPostModal(false)}
                className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isPosting || !postCaption.trim()}
                className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isPosting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Posting...</span>
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    <span>Posting Sekarang ke Threads 🚀</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export default TelemetryStudioPage;
