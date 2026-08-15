import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, Image, Download, Share2, Upload, Sparkles, ToggleLeft, ToggleRight, CheckCircle2, ShieldAlert } from 'lucide-react';
import type { Vehicle, ServiceRecord } from '../../types';
import { formatRupiah, formatMileage, formatDate } from '../../utils/formatters';

// ─── Props ─────────────────────────────────────────────────────────────────────

interface PhotoOverlayCanvasProps {
  vehicle: Vehicle;
  serviceRecord: ServiceRecord;
}

// ─── Canvas Drawing ───────────────────────────────────────────────────────────

function drawOverlay(
  canvas: HTMLCanvasElement,
  img: HTMLImageElement,
  vehicle: Vehicle,
  record: ServiceRecord,
  ratio: '1:1' | '9:16'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  // Set high-res canvas size
  const width = 1080;
  const height = ratio === '9:16' ? 1920 : 1080;
  canvas.width = width;
  canvas.height = height;

  // ── Draw image (cover fit) ──
  const imgAspect = img.naturalWidth / img.naturalHeight;
  const canvasAspect = width / height;
  let sx = 0, sy = 0, sw = img.naturalWidth, sh = img.naturalHeight;

  if (imgAspect > canvasAspect) {
    sw = img.naturalHeight * canvasAspect;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / canvasAspect;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

  // ── Dark gradient overlay (bottom 55%) ──
  const gradHeight = height * 0.55;
  const grad = ctx.createLinearGradient(0, height - gradHeight, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.3, 'rgba(15,23,42,0.4)');
  grad.addColorStop(1, 'rgba(15,23,42,0.95)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - gradHeight, width, gradHeight);

  // ── Subtle top gradient ──
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.25);
  topGrad.addColorStop(0, 'rgba(15,23,42,0.5)');
  topGrad.addColorStop(1, 'rgba(15,23,42,0)');
  ctx.fillStyle = topGrad;
  ctx.fillRect(0, 0, width, height * 0.25);

  // ── Text layout ──
  const pad = 60;
  const bottomY = height - 60;

  // ── License plate ──
  const plateText = vehicle.license_plate;
  ctx.save();
  ctx.font = `bold 72px 'Rajdhani', sans-serif`;
  const plateW = ctx.measureText(plateText).width + 48;
  const plateH = 88;
  const plateX = pad;
  const plateY = bottomY - 300;

  // Yellow plate background
  ctx.fillStyle = '#FFDD00';
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateW, plateH, 12);
  ctx.fill();

  // Black border
  ctx.strokeStyle = '#000000';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Plate text
  ctx.fillStyle = '#000000';
  ctx.textBaseline = 'middle';
  ctx.fillText(plateText, plateX + 24, plateY + plateH / 2);
  ctx.restore();

  // ── Brand + Model ──
  ctx.save();
  ctx.font = `bold 64px Inter, sans-serif`;
  ctx.fillStyle = '#FFFFFF';
  ctx.textBaseline = 'top';
  ctx.fillText(`${vehicle.brand} ${vehicle.model}`, pad, plateY + plateH + 20);
  ctx.restore();

  // ── Workshop name tag ──
  const workshopName = record.is_official_workshop
    ? (record.workshop_name_manual ?? 'Bengkel Resmi Partner')
    : `🔧 ${record.workshop_name_manual ?? 'DIY Maintenance'}`;

  ctx.save();
  ctx.font = `600 38px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textBaseline = 'top';
  ctx.fillText(workshopName, pad, plateY + plateH + 100);
  ctx.restore();

  // ── Service date & Odometer ──
  ctx.save();
  ctx.font = `500 34px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.textBaseline = 'top';
  ctx.fillText(`📅 ${formatDate(record.service_date, 'full')}`, pad, plateY + plateH + 155);
  ctx.fillText(`🛣️ ${formatMileage(record.mileage_at_service)} km`, pad + 400, plateY + plateH + 155);
  ctx.restore();

  // ── Top 3 service items ──
  const topItems = (record.details ?? []).slice(0, 3);
  topItems.forEach((item, i) => {
    ctx.save();
    ctx.font = `500 30px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.textBaseline = 'top';
    ctx.fillText(`✓  ${item.item_name}`, pad, plateY + plateH + 215 + i * 44);
    ctx.restore();
  });

  // ── Watermark ──
  ctx.save();
  ctx.font = `bold 32px 'Rajdhani', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Odomtr Telemetry', width - pad, height - 40);
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhotoOverlayCanvas({ vehicle, serviceRecord }: PhotoOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const [imageLoaded, setImageLoaded] = useState(false);
  const [loadedImg, setLoadedImg] = useState<HTMLImageElement | null>(null);
  const [ratio, setRatio] = useState<'1:1' | '9:16'>('1:1');
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');

  const render = useCallback(
    (img: HTMLImageElement, r: '1:1' | '9:16') => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      drawOverlay(canvas, img, vehicle, serviceRecord, r);
    },
    [vehicle, serviceRecord]
  );

  useEffect(() => {
    if (loadedImg && imageLoaded) {
      render(loadedImg, ratio);
    }
  }, [ratio, loadedImg, imageLoaded, render]);

  const loadFile = (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPEG, PNG, WEBP)');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setError('Ukuran file maksimal 20MB');
      return;
    }

    const url = URL.createObjectURL(file);
    const img = new window.Image();
    img.onload = () => {
      setLoadedImg(img);
      setImageLoaded(true);
      render(img, ratio);
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      setError('Gagal memuat gambar');
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) loadFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) loadFile(file);
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const link = document.createElement('a');
    link.download = `odomtr_story_${vehicle.license_plate}_${serviceRecord.service_date}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  const handleShare = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], `odomtr_story_${vehicle.license_plate}.png`, { type: 'image/png' });

      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Servis ${vehicle.brand} ${vehicle.model}`,
            text: `Catatan telemetri servis kendaraan ${vehicle.license_plate} via Odo Threads`,
          });
        } catch {
          // User cancelled share
        }
      } else {
        handleDownload();
      }
    }, 'image/png');
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
      {/* Hidden File Inputs */}
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-xs">
            <Sparkles size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm">Social Story & Telemetry Generator</h3>
            <p className="text-[11px] text-slate-500 font-medium">Buat Story Instagram dari Telemetri Servis ini</p>
          </div>
        </div>

        {/* Ratio Toggle */}
        <button
          onClick={() => setRatio(ratio === '1:1' ? '9:16' : '1:1')}
          className="flex items-center gap-1.5 text-xs font-extrabold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-full border border-purple-200 transition-colors cursor-pointer"
        >
          {ratio === '1:1' ? (
            <><ToggleLeft size={18} /> Rasio 1:1</>
          ) : (
            <><ToggleRight size={18} /> Rasio 9:16</>
          )}
        </button>
      </div>

      <div className="p-5 space-y-4">
        {/* Drop Zone & Dual Action Buttons */}
        {!imageLoaded ? (
          <div className="space-y-4">
            <div
              className={[
                'border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer text-center',
                isDragging
                  ? 'border-purple-500 bg-purple-50/60'
                  : 'border-slate-300/80 hover:border-purple-400 bg-slate-50/60 hover:bg-purple-50/20',
              ].join(' ')}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
            >
              <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-purple-600 shadow-md">
                <Image size={28} />
              </div>

              <div>
                <p className="text-sm font-extrabold text-slate-800">
                  {isDragging ? 'Lepaskan foto di sini' : 'Pilih / Ambil Foto Kendaraan'}
                </p>
                <p className="text-xs text-slate-400 font-medium mt-1">
                  Mendukung kamera langsung atau upload dari Galeri (JPEG, PNG, WEBP)
                </p>
              </div>

              {/* 📸 DUAL ACTION BUTTONS (Camera vs Gallery) */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-2 w-full max-w-sm">
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 min-w-[140px] py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
                >
                  <Camera size={16} />
                  <span>📷 Kamera Langsung</span>
                </button>

                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="flex-1 min-w-[140px] py-3 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-2xs transition-all active:scale-95 cursor-pointer"
                >
                  <Upload size={16} className="text-purple-600" />
                  <span>🖼️ Pilih dari Galeri</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Canvas Preview */}
            <div className="flex justify-center bg-slate-900/95 p-4 rounded-3xl border border-slate-800 shadow-inner">
              <canvas
                ref={canvasRef}
                className="rounded-2xl shadow-2xl max-h-[420px] object-contain border border-slate-700"
                style={{ maxWidth: '100%' }}
              />
            </div>

            {/* Action Buttons Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => galleryInputRef.current?.click()}
                className="py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 border border-slate-200 transition-colors cursor-pointer"
              >
                <Image size={15} />
                <span>Ganti Foto</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="py-3 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <Download size={15} />
                <span>Download PNG</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-3 px-4 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-2xl text-xs font-extrabold flex items-center justify-center gap-2 border border-purple-200 transition-colors cursor-pointer"
              >
                <Share2 size={15} />
                <span>Bagikan Story</span>
              </button>
            </div>
          </>
        )}

        {/* Error Alert */}
        {error && (
          <p className="mt-2 text-xs font-bold text-red-600 text-center bg-red-50 p-2.5 rounded-xl border border-red-200">
            {error}
          </p>
        )}

        {/* Live Telemetry Data Preview Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 size={14} className="text-purple-600" />
            <span>Telemetri yang akan dicetak di foto:</span>
          </p>

          <div className="grid grid-cols-2 gap-2 text-xs text-slate-700 font-medium">
            <div>📋 No. Pol: <strong className="font-mono text-slate-900">{vehicle.license_plate}</strong></div>
            <div>🛣️ KM: <strong className="text-slate-900">{formatMileage(serviceRecord.mileage_at_service)}</strong></div>
            <div>📅 Tanggal: <strong className="text-slate-900">{formatDate(serviceRecord.service_date, 'full')}</strong></div>
            <div>💰 Total: <strong className="text-slate-900">{formatRupiah(serviceRecord.total_cost)}</strong></div>
            {(serviceRecord.details ?? []).slice(0, 3).map((item, i) => (
              <div key={i} className="col-span-2 text-purple-900 font-bold">✓ {item.item_name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoOverlayCanvas;
