import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Download, Share2, ImageIcon, Flame, Zap, Shield, Eye, EyeOff, RotateCcw, Move, ZoomIn, Plus, Trash2 } from 'lucide-react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { Vehicle, ServiceRecord } from '../../types';
import { formatRupiah, formatMileage, formatDate } from '../../utils/formatters';

interface GenZSocialShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  vehicle: Vehicle;
  record: ServiceRecord;
}

type ThemeMode = 'athletic' | 'cyberpunk' | 'racing';
type FilterMode = 'normal' | 'bw' | 'vintage';

export function GenZSocialShareModal({
  isOpen,
  onClose,
  vehicle,
  record,
}: GenZSocialShareModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [ratio, setRatio] = useState<'9:16' | '1:1'>('9:16');
  
  // Support up to 3 photos array for vertical storytelling grid
  const [bgImages, setBgImages] = useState<HTMLImageElement[]>([]);
  
  const [theme, setTheme] = useState<ThemeMode>('athletic');
  const [showExpense, setShowExpense] = useState(true);

  // Mini Editor States
  const [filterMode, setFilterMode] = useState<FilterMode>('normal');
  const [zoom, setZoom] = useState<number>(1.0);
  const [offsetY, setOffsetY] = useState<number>(0);

  const [error, setError] = useState('');

  const resetEditor = () => {
    setFilterMode('normal');
    setZoom(1.0);
    setOffsetY(0);
  };

  // ─── Draw Multi-Photo Vertical Story & Transparent Telemetry Overlay ─────────────
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 1080;
    const height = ratio === '9:16' ? 1920 : 1080;
    canvas.width = width;
    canvas.height = height;

    // 1. Draw Multi-Photo Background (Supports 1, 2, or 3 vertical frames)
    if (bgImages.length > 0) {
      const count = bgImages.length;
      const frameH = height / count;

      bgImages.forEach((img, idx) => {
        ctx.save();

        // Apply Photo Filter
        if (filterMode === 'bw') {
          ctx.filter = 'grayscale(100%) contrast(115%)';
        } else if (filterMode === 'vintage') {
          ctx.filter = 'sepia(50%) contrast(105%) brightness(95%)';
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

        // Apply Zoom & Offset Cropping
        const zoomedSW = sw / zoom;
        const zoomedSH = sh / zoom;
        const croppedSX = Math.max(0, Math.min(img.naturalWidth - zoomedSW, sx));
        const croppedSY = Math.max(0, Math.min(img.naturalHeight - zoomedSH, sy + offsetY));

        // Clip region to this frame
        ctx.beginPath();
        ctx.rect(0, frameY, width, frameH);
        ctx.clip();

        ctx.drawImage(img, croppedSX, croppedSY, zoomedSW, zoomedSH, 0, frameY, width, frameH);

        // Frame separator line if multiple photos
        if (idx > 0) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.moveTo(0, frameY);
          ctx.lineTo(width, frameY);
          ctx.stroke();
        }

        ctx.restore();
      });
    } else {
      // Default Aesthetic Mesh Gradient when no photo
      const bgGrad = ctx.createLinearGradient(0, 0, width, height);
      if (theme === 'athletic') {
        bgGrad.addColorStop(0, '#0F172A');
        bgGrad.addColorStop(0.5, '#1E293B');
        bgGrad.addColorStop(1, '#0F172A');
      } else if (theme === 'cyberpunk') {
        bgGrad.addColorStop(0, '#090514');
        bgGrad.addColorStop(0.5, '#190A2E');
        bgGrad.addColorStop(1, '#0B192C');
      } else {
        bgGrad.addColorStop(0, '#09090B');
        bgGrad.addColorStop(0.5, '#18181B');
        bgGrad.addColorStop(1, '#09090B');
      }
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);
    }

    // 2. Subtle Soft Gradients at Top & Bottom
    const botGradHeight = height * 0.45;
    const botGrad = ctx.createLinearGradient(0, height - botGradHeight, 0, height);
    botGrad.addColorStop(0, 'rgba(0,0,0,0)');
    botGrad.addColorStop(0.5, 'rgba(15, 23, 42, 0.6)');
    botGrad.addColorStop(1, 'rgba(9, 9, 11, 0.9)');
    ctx.fillStyle = botGrad;
    ctx.fillRect(0, height - botGradHeight, width, botGradHeight);

    const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.2);
    topGrad.addColorStop(0, 'rgba(9, 9, 11, 0.6)');
    topGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = topGrad;
    ctx.fillRect(0, 0, width, height * 0.2);

    const pad = 64;

    // Accent Colors
    const primaryAccent = theme === 'athletic' ? '#FC5200' : theme === 'cyberpunk' ? '#00F0FF' : '#FFDD00';
    const secondaryAccent = theme === 'athletic' ? '#FF7A38' : theme === 'cyberpunk' ? '#E0E7FF' : '#FFFFFF';

    // 3. Top Header Telemetry Pill Badge
    ctx.save();
    const headerY = ratio === '9:16' ? 120 : 60;
    const headerPillW = 420;
    const headerPillH = 52;
    ctx.fillStyle = primaryAccent;
    ctx.beginPath();
    ctx.roundRect(pad, headerY, headerPillW, headerPillH, 26);
    ctx.fill();

    ctx.font = `bold 24px 'Rajdhani', sans-serif`;
    ctx.fillStyle = theme === 'racing' ? '#000000' : '#FFFFFF';
    ctx.textBaseline = 'middle';
    ctx.fillText('⚡ ODOMTR AUTOMOTIVE TELEMETRY', pad + 24, headerY + headerPillH / 2);
    ctx.restore();

    // 4. FLOATING HUD STATS
    let statY = ratio === '9:16' ? 240 : 140;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;

    // Label: Odometer
    ctx.font = `bold 24px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fillText('CURRENT ODOMETER', pad, statY);

    // Value: Odometer KM
    statY += 75;
    ctx.font = `bold ${ratio === '9:16' ? '110px' : '88px'} 'Rajdhani', sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    const kmFormatted = formatMileage(record.mileage_at_service);
    ctx.fillText(kmFormatted, pad, statY);

    const kmTextW = ctx.measureText(kmFormatted).width;
    ctx.font = `bold 40px 'Rajdhani', sans-serif`;
    ctx.fillStyle = primaryAccent;
    ctx.fillText('KM', pad + kmTextW + 16, statY - 10);

    // Optional Total Expense (Only if showExpense is true)
    if (showExpense) {
      const expX = ratio === '9:16' ? pad + kmTextW + 130 : pad + kmTextW + 110;
      if (expX + 300 < width - pad) {
        ctx.font = `bold 24px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('TOTAL EXPENSE', expX, statY - 75);

        ctx.font = `bold ${ratio === '9:16' ? '68px' : '56px'} 'Rajdhani', sans-serif`;
        ctx.fillStyle = primaryAccent;
        ctx.fillText(formatRupiah(record.total_cost), expX, statY);
      } else {
        statY += 65;
        ctx.font = `bold 24px Inter, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.fillText('TOTAL EXPENSE', pad, statY);

        statY += 55;
        ctx.font = `bold 64px 'Rajdhani', sans-serif`;
        ctx.fillStyle = primaryAccent;
        ctx.fillText(formatRupiah(record.total_cost), pad, statY);
      }
    }

    // Service Date Tag (NO ICON as requested!)
    statY += 45;
    ctx.font = `500 26px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillText(formatDate(record.service_date, 'full'), pad, statY);
    ctx.restore();

    // 5. COMPACT BOTTOM TELEMETRY CARD
    let startY = ratio === '9:16' ? height - 520 : height - 380;

    // Gen Z Nickname Badge (if present)
    if (vehicle.nickname) {
      ctx.save();
      const nickText = `✨ "${vehicle.nickname}"`;
      ctx.font = `bold 30px Inter, sans-serif`;
      const nickW = ctx.measureText(nickText).width + 36;
      const nickH = 50;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.65)';
      ctx.strokeStyle = primaryAccent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(pad, startY, nickW, nickH, 25);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = '#FFFFFF';
      ctx.textBaseline = 'middle';
      ctx.fillText(nickText, pad + 18, startY + nickH / 2);
      ctx.restore();

      startY += nickH + 20;
    }

    // License Plate Badge (Indonesian Yellow)
    const plateText = vehicle.license_plate;
    ctx.save();
    ctx.font = `bold 54px 'Rajdhani', sans-serif`;
    const plateW = ctx.measureText(plateText).width + 36;
    const plateH = 68;

    ctx.fillStyle = '#FFDD00';
    ctx.beginPath();
    ctx.roundRect(pad, startY, plateW, plateH, 10);
    ctx.fill();

    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(plateText, pad + 18, startY + plateH / 2);
    ctx.restore();

    // Vehicle Brand, Model & Variant
    startY += plateH + 20;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 10;
    ctx.font = `bold 48px Inter, sans-serif`;
    ctx.fillStyle = '#FFFFFF';
    ctx.textBaseline = 'top';
    const fullName = `${vehicle.brand} ${vehicle.model} ${vehicle.variant_type || ''}`.trim();
    ctx.fillText(fullName, pad, startY);
    ctx.restore();

    // Workshop Name Tag (ONLY ICON 🔧 followed directly by workshop name, as requested!)
    startY += 62;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 8;
    ctx.font = `600 30px Inter, sans-serif`;
    ctx.fillStyle = secondaryAccent;
    ctx.textBaseline = 'top';
    const workshopName = record.workshop_name_manual || (record.is_official_workshop ? 'Bengkel Resmi' : 'DIY Maintenance');
    ctx.fillText(`🔧 ${workshopName}`, pad, startY);
    ctx.restore();

    // Items Checklist Pills
    startY += 50;
    const items = (record.items && record.items.length > 0 ? record.items : record.details || []).slice(0, 3);
    if (items.length > 0) {
      let currentPillX = pad;
      items.forEach((item) => {
        ctx.save();
        const itemText = `✓ ${item.item_name}`;
        ctx.font = `bold 22px Inter, sans-serif`;
        const itemW = ctx.measureText(itemText).width + 24;
        const itemH = 40;

        if (currentPillX + itemW < width - pad) {
          ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.roundRect(currentPillX, startY, itemW, itemH, 10);
          ctx.fill();
          ctx.stroke();

          ctx.fillStyle = '#FFFFFF';
          ctx.textBaseline = 'middle';
          ctx.fillText(itemText, currentPillX + 12, startY + itemH / 2);

          currentPillX += itemW + 10;
        }
        ctx.restore();
      });
    }

    // Bottom Watermark
    ctx.save();
    ctx.font = `bold 26px 'Rajdhani', sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.textAlign = 'right';
    ctx.fillText('ODOMTR · DIGITAL VEHICLE PASSPORT', width - pad, height - (ratio === '9:16' ? 140 : 35));
    ctx.restore();
  }, [ratio, bgImages, theme, filterMode, zoom, offsetY, showExpense, vehicle, record]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => draw(), 100);
    }
  }, [isOpen, draw]);

  const handleImageFiles = (files?: FileList | null) => {
    if (!files || files.length === 0) return;

    if (bgImages.length >= 3) {
      setError('Maksimal 3 foto untuk story vertikal');
      return;
    }

    const fileArray = Array.from(files).slice(0, 3 - bgImages.length);

    fileArray.forEach((file) => {
      if (!file.type.startsWith('image/')) return;
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        setBgImages((prev) => [...prev, img].slice(0, 3));
        setError('');
      };
      img.src = url;
    });
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `odomtr_story_${vehicle.license_plate}_${record.service_date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `odomtr_${vehicle.license_plate}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Athletic Servis ${vehicle.brand} ${vehicle.model}`,
            text: `Servis ${vehicle.brand} ${vehicle.model} (${vehicle.license_plate}) - ${formatMileage(record.mileage_at_service)} KM #Odomtr`,
          });
        } catch {
          // User cancelled
        }
      } else {
        handleDownload();
      }
    }, 'image/png');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="✨ Social Story & Telemetry Generator" size="lg">
      <div className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-xs text-red-700 rounded-xl">
            {error}
          </div>
        )}

        {/* Responsive Control Panel */}
        <div className="bg-slate-900 text-white p-3.5 sm:p-4 rounded-2xl border border-slate-800 space-y-3 shadow-md">
          {/* Row 1: Themes & Expense Toggle */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-xl w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setTheme('athletic')}
                className={[
                  'flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  theme === 'athletic' ? 'bg-[#FC5200] text-white shadow-md' : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                <Flame size={14} /> Athletic
              </button>
              <button
                type="button"
                onClick={() => setTheme('cyberpunk')}
                className={[
                  'flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  theme === 'cyberpunk' ? 'bg-cyan-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                <Zap size={14} /> Cyber
              </button>
              <button
                type="button"
                onClick={() => setTheme('racing')}
                className={[
                  'flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all',
                  theme === 'racing' ? 'bg-amber-400 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                <Shield size={14} /> Racing
              </button>
            </div>

            {/* Toggle Expense Visibility */}
            <button
              type="button"
              onClick={() => setShowExpense(!showExpense)}
              className={[
                'w-full sm:w-auto flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shrink-0',
                showExpense
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : 'bg-slate-800 text-slate-400 border-slate-700',
              ].join(' ')}
            >
              {showExpense ? <Eye size={14} /> : <EyeOff size={14} />}
              {showExpense ? 'Biaya Servis: Tampil' : 'Biaya Servis: Sembunyi'}
            </button>
          </div>

          {/* Row 2: Photo Controls (Upload up to 3 photos) & Ratio */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-800">
            <div className="flex items-center gap-2">
              {bgImages.length < 3 && (
                <>
                  <button
                    type="button"
                    onClick={() => cameraInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs"
                  >
                    <Camera size={14} /> {bgImages.length === 0 ? 'Kamera Live' : `Tambah Foto (${bgImages.length}/3)`}
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    <ImageIcon size={14} /> Galeri {bgImages.length > 0 && `(${bgImages.length}/3)`}
                  </button>
                </>
              )}

              {bgImages.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setBgImages([]);
                    resetEditor();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-500/20 rounded-xl border border-red-500/30 transition-colors"
                  title="Hapus Semua Foto"
                >
                  <Trash2 size={13} /> Reset ({bgImages.length})
                </button>
              )}
            </div>

            {/* Photo Filters Pill Selector */}
            {bgImages.length > 0 && (
              <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setFilterMode('normal')}
                  className={[
                    'px-2.5 py-1 rounded-lg transition-colors',
                    filterMode === 'normal' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white',
                  ].join(' ')}
                >
                  🎨 Asli
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('bw')}
                  className={[
                    'px-2.5 py-1 rounded-lg transition-colors',
                    filterMode === 'bw' ? 'bg-slate-100 text-slate-900 font-extrabold' : 'text-slate-400 hover:text-white',
                  ].join(' ')}
                >
                  🏁 B&W
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('vintage')}
                  className={[
                    'px-2.5 py-1 rounded-lg transition-colors',
                    filterMode === 'vintage' ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white',
                  ].join(' ')}
                >
                  🎞️ Vintage
                </button>
              </div>
            )}

            {/* Ratio Toggle */}
            <div className="flex items-center gap-1 bg-slate-800 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setRatio('9:16')}
                className={[
                  'px-3 py-1 rounded-lg transition-colors',
                  ratio === '9:16' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                📱 9:16 Story
              </button>
              <button
                type="button"
                onClick={() => setRatio('1:1')}
                className={[
                  'px-3 py-1 rounded-lg transition-colors',
                  ratio === '1:1' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white',
                ].join(' ')}
              >
                🖼️ 1:1 Post
              </button>
            </div>

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleImageFiles(e.target.files)}
            />
          </div>

          {/* Row 3: Photo Cropping & Position Adjusters (If photo uploaded) */}
          {bgImages.length > 0 && (
            <div className="pt-2 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Vertical Position Offset */}
              <div className="flex items-center gap-2">
                <Move size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-300 font-semibold w-24 shrink-0">Posisi Foto (Y):</span>
                <input
                  type="range"
                  min="-400"
                  max="400"
                  value={offsetY}
                  onChange={(e) => setOffsetY(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>

              {/* Zoom Scale */}
              <div className="flex items-center gap-2">
                <ZoomIn size={14} className="text-slate-400 shrink-0" />
                <span className="text-slate-300 font-semibold w-24 shrink-0">Zoom Foto ({zoom.toFixed(1)}x):</span>
                <input
                  type="range"
                  min="1.0"
                  max="2.0"
                  step="0.1"
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                  className="w-full accent-blue-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Fluid Canvas Viewport Container */}
        <div className="flex justify-center bg-slate-950 rounded-2xl p-3 sm:p-4 border border-slate-800 shadow-2xl min-h-[320px] max-h-[50vh] overflow-hidden items-center">
          <canvas
            ref={canvasRef}
            className="rounded-xl max-h-[46vh] max-w-full object-contain shadow-2xl border border-slate-800 transition-all"
          />
        </div>

        {/* Responsive Action Buttons: Download & Share */}
        <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
          <Button
            type="button"
            variant="ghost"
            fullWidth
            leftIcon={<Download size={16} />}
            onClick={handleDownload}
          >
            Simpan Gambar ke Galeri
          </Button>

          <Button
            type="button"
            variant="primary"
            fullWidth
            leftIcon={<Share2 size={16} />}
            onClick={handleShare}
          >
            Share ke IG Story / WA
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default GenZSocialShareModal;
