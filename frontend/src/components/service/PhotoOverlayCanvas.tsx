import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Upload, Download, Share2, Image, ToggleLeft, ToggleRight } from 'lucide-react';
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

  // Set canvas size
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

  // ── Dark gradient overlay (bottom 45%) ──
  const gradHeight = height * 0.55;
  const grad = ctx.createLinearGradient(0, height - gradHeight, 0, height);
  grad.addColorStop(0, 'rgba(0,0,0,0)');
  grad.addColorStop(0.4, 'rgba(0,0,0,0.6)');
  grad.addColorStop(1, 'rgba(0,0,0,0.92)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, height - gradHeight, width, gradHeight);

  // ── Also a subtle top gradient ──
  const topGrad = ctx.createLinearGradient(0, 0, 0, height * 0.25);
  topGrad.addColorStop(0, 'rgba(0,0,0,0.4)');
  topGrad.addColorStop(1, 'rgba(0,0,0,0)');
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
  const plateY = bottomY - 280;

  // Yellow plate background
  ctx.fillStyle = '#FFDD00';
  ctx.beginPath();
  ctx.roundRect(plateX, plateY, plateW, plateH, 8);
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
    ? (record.workshop_name_manual ?? 'Bengkel Resmi')
    : `🔧 ${record.workshop_name_manual ?? 'DIY Maintenance'}`;

  ctx.save();
  ctx.font = `600 38px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.85)';
  ctx.textBaseline = 'top';
  ctx.fillText(workshopName, pad, plateY + plateH + 100);
  ctx.restore();

  // ── Service date ──
  ctx.save();
  ctx.font = `500 34px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textBaseline = 'top';
  ctx.fillText(`📅 ${formatDate(record.service_date, 'full')}`, pad, plateY + plateH + 155);
  ctx.restore();

  // ── Odometer ──
  ctx.save();
  ctx.font = `500 34px Inter, sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.65)';
  ctx.textBaseline = 'top';
  ctx.fillText(`🛣️ ${formatMileage(record.mileage_at_service)} km`, pad + 380, plateY + plateH + 155);
  ctx.restore();

  // ── Top 3 service items ──
  const topItems = (record.details ?? []).slice(0, 3);
  topItems.forEach((item, i) => {
    ctx.save();
    ctx.font = `500 30px Inter, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.80)';
    ctx.textBaseline = 'top';
    ctx.fillText(`✓  ${item.item_name}`, pad, plateY + plateH + 210 + i * 44);
    ctx.restore();
  });

  // ── Watermark ──
  ctx.save();
  ctx.font = `bold 28px 'Rajdhani', sans-serif`;
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'bottom';
  ctx.fillText('Odomtr', width - pad, height - 40);
  ctx.restore();
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PhotoOverlayCanvas({ vehicle, serviceRecord }: PhotoOverlayCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  // Re-render when ratio changes
  useEffect(() => {
    if (loadedImg && imageLoaded) {
      render(loadedImg, ratio);
    }
  }, [ratio, loadedImg, imageLoaded, render]);

  const loadFile = (file: File) => {
    setError('');
    if (!file.type.startsWith('image/')) {
      setError('File harus berupa gambar (JPEG, PNG, dll)');
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
    link.download = `odomtr_${vehicle.license_plate}_${serviceRecord.service_date}.png`;
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
            title: `Servis ${vehicle.brand} ${vehicle.model}`,
            text: `Catatan servis kendaraan ${vehicle.license_plate} via Odomtr`,
          });
        } catch {
          // User cancelled share
        }
      } else {
        // Fallback to download
        handleDownload();
      }
    }, 'image/png');
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <div>
          <h3 className="font-semibold text-slate-900">Photo Overlay</h3>
          <p className="text-xs text-slate-500 mt-0.5">Buat story Instagram dari catatan servis ini</p>
        </div>
        {/* Ratio toggle */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500">Rasio:</span>
          <button
            onClick={() => setRatio(ratio === '1:1' ? '9:16' : '1:1')}
            className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
          >
            {ratio === '1:1' ? (
              <><ToggleLeft size={20} /> 1:1</>
            ) : (
              <><ToggleRight size={20} /> 9:16</>
            )}
          </button>
        </div>
      </div>

      <div className="p-5">
        {/* Drop zone */}
        {!imageLoaded ? (
          <div
            className={[
              'border-2 border-dashed rounded-xl flex flex-col items-center justify-center py-14 gap-3 cursor-pointer transition-all',
              isDragging
                ? 'border-blue-400 bg-blue-50'
                : 'border-slate-300 hover:border-blue-300 hover:bg-slate-50',
            ].join(' ')}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Upload foto kendaraan"
          >
            <div className="w-14 h-14 bg-slate-100 rounded-full flex items-center justify-center">
              <Image size={26} className="text-slate-400" />
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-slate-700">
                {isDragging ? 'Lepaskan file di sini' : 'Upload Foto Kendaraan'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Drag & drop atau klik — JPEG, PNG, WebP (maks. 20MB)
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600 font-medium bg-blue-50 px-4 py-2 rounded-full">
              <Upload size={13} />
              Pilih Foto
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        ) : (
          <>
            {/* Canvas preview */}
            <div className="flex justify-center mb-4">
              <canvas
                ref={canvasRef}
                className="rounded-xl shadow-lg max-h-96 object-contain border border-slate-200"
                style={{ maxWidth: '100%' }}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => { setImageLoaded(false); setLoadedImg(null); }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                <Image size={15} />
                Ganti Foto
              </button>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm"
              >
                <Download size={15} />
                Download PNG
              </button>
              <button
                onClick={handleShare}
                className="flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-xl border border-blue-200 transition-colors"
              >
                <Share2 size={15} />
                Bagikan
              </button>
            </div>
          </>
        )}

        {/* Hidden canvas when no image loaded (for ratio toggle pre-render) */}
        {!imageLoaded && (
          <canvas ref={canvasRef} className="hidden" />
        )}

        {/* Error */}
        {error && (
          <p className="mt-3 text-xs text-red-600 text-center">{error}</p>
        )}

        {/* Info overlay details */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
            Overlay yang akan ditambahkan
          </p>
          <div className="grid grid-cols-2 gap-1 text-xs text-slate-600">
            <div>📋 Plat: <strong>{vehicle.license_plate}</strong></div>
            <div>🛣️ Km: <strong>{formatMileage(serviceRecord.mileage_at_service)}</strong></div>
            <div>📅 Tgl: <strong>{formatDate(serviceRecord.service_date, 'full')}</strong></div>
            <div>💰 Biaya: <strong>{formatRupiah(serviceRecord.total_cost)}</strong></div>
            {(serviceRecord.details ?? []).slice(0, 3).map((item, i) => (
              <div key={i} className="col-span-2">✓ {item.item_name}</div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PhotoOverlayCanvas;
