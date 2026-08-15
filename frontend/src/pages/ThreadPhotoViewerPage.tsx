import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Share2,
  Check,
  AlertCircle,
  Sparkles,
  Download,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Maximize2,
} from 'lucide-react';
import { threadsService } from '../services/threadsService';
import type { Thread } from '../types';

export function ThreadPhotoViewerPage() {
  const { threadId } = useParams<{ threadId: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const initialIdx = Number(searchParams.get('index')) || 0;

  const [thread, setThread] = useState<Thread | null>(null);
  const [activePhotoIndex, setActivePhotoIndex] = useState(initialIdx);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // ── Zoom & Pan Controls ──
  const [zoomScale, setZoomScale] = useState(1);
  const [panPos, setPanPos] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  useEffect(() => {
    if (!threadId) return;
    const fetch = async () => {
      setIsLoading(true);
      try {
        const t = await threadsService.getThreadById(threadId);
        setThread(t);
      } catch {
        setError('Gagal memuat postingan foto');
      } finally {
        setIsLoading(false);
      }
    };
    fetch();
  }, [threadId]);

  // Reset zoom when photo changes
  useEffect(() => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  }, [activePhotoIndex]);

  const currentPhoto = thread?.photo_urls?.[activePhotoIndex] || thread?.photo_urls?.[0];

  const handleDownload = () => {
    if (!currentPhoto) return;
    const link = document.createElement('a');
    link.href = currentPhoto;
    link.download = `photo_${thread?.id}_${activePhotoIndex + 1}.png`;
    link.click();
  };

  const handleShare = async () => {
    if (!thread) return;
    const usernameTag = `@${thread.user_username || 'user'}`;
    const text = `💬 *Odo Threads by ${usernameTag}*\n"Lihat foto postingan ini di Odomtr"`;
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Odo Threads Photo', text, url: window.location.href });
      } catch {
        // User cancelled
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2500);
      } catch {
        // Fail silently
      }
    }
  };

  // ── Zoom Handlers ──
  const handleZoomIn = () => {
    setZoomScale((prev) => Math.min(3.5, Number((prev + 0.3).toFixed(1))));
  };

  const handleZoomOut = () => {
    setZoomScale((prev) => {
      const next = Math.max(1, Number((prev - 0.3).toFixed(1)));
      if (next === 1) setPanPos({ x: 0, y: 0 });
      return next;
    });
  };

  const handleResetZoom = () => {
    setZoomScale(1);
    setPanPos({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (zoomScale > 1) {
      handleResetZoom();
    } else {
      setZoomScale(2);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Pan dragging when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (zoomScale <= 1) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - panPos.x, y: e.clientY - panPos.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || zoomScale <= 1) return;
    setPanPos({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-slate-800 min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-extrabold font-mono">Memuat Panggung Foto...</p>
        </div>
      </div>
    );
  }

  if (error || !thread || !thread.photo_urls || thread.photo_urls.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 bg-slate-50 min-h-screen">
        <div className="text-center bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-sm">
          <AlertCircle size={40} className="text-red-500 mx-auto mb-3" />
          <h2 className="font-extrabold text-slate-900 text-base mb-2">{error || 'Foto tidak ditemukan'}</h2>
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
    <div className="flex-1 bg-slate-50 text-slate-900 min-h-screen flex flex-col justify-between items-center overflow-hidden select-none w-full pb-6">
      {/* ── Studio Top Bar Navigation (Harmonized Light Glass Header) ── */}
      <div className="w-full bg-white/90 backdrop-blur-md border-b border-slate-200/80 px-4 sm:px-8 py-4 sticky top-0 z-30 flex items-center justify-between shadow-2xs">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2 px-4"
          >
            <ArrowLeft size={16} className="text-purple-600" />
            <span className="text-xs font-extrabold">Kembali</span>
          </button>
          <div className="hidden sm:block">
            <h1 className="text-sm font-black font-tech tracking-wide text-slate-900 flex items-center gap-1.5">
              <Sparkles size={16} className="text-purple-600" />
              Odo Media Viewport
            </h1>
            <p className="text-[10px] text-slate-500 font-medium">
              @{thread.user_username || 'user'} · {thread.category}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-extrabold text-purple-700 bg-purple-50 px-3.5 py-1.5 rounded-full border border-purple-200 shadow-2xs">
            Foto {activePhotoIndex + 1} dari {thread.photo_urls.length}
          </span>

          <button
            onClick={handleShare}
            className="py-2 px-3.5 bg-white hover:bg-slate-100 text-slate-800 rounded-full text-xs font-extrabold flex items-center gap-1.5 border border-slate-200 shadow-2xs transition-all cursor-pointer"
          >
            {isCopied ? <Check size={14} className="text-emerald-600" /> : <Share2 size={14} />}
            <span className="hidden sm:inline">{isCopied ? 'Disalin' : 'Share'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-2 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-full text-xs font-black flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
          >
            <Download size={14} />
            <span>Unduh</span>
          </button>
        </div>
      </div>

      {/* ── Dark Glass Viewport Box with Zoom & Pan Capabilities ── */}
      <div className="max-w-6xl w-full px-4 sm:px-6 my-auto pt-6 flex-1 flex items-center justify-center">
        <div
          className="relative bg-slate-950 rounded-3xl p-4 sm:p-8 border border-slate-800 shadow-2xl flex items-center justify-center w-full h-[76vh] overflow-hidden group cursor-grab active:cursor-grabbing"
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Zoom & Pan Control Floating Toolbar */}
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-full border border-slate-700/80 shadow-2xl">
            <button
              type="button"
              onClick={handleZoomIn}
              className="p-2 text-white hover:bg-purple-600 rounded-full transition-colors cursor-pointer"
              title="Perbesar (Zoom In)"
            >
              <ZoomIn size={18} />
            </button>
            <span className="text-xs font-mono font-extrabold text-purple-300 px-1">
              {Math.round(zoomScale * 100)}%
            </span>
            <button
              type="button"
              onClick={handleZoomOut}
              disabled={zoomScale <= 1}
              className="p-2 text-white hover:bg-purple-600 disabled:opacity-40 disabled:hover:bg-transparent rounded-full transition-colors cursor-pointer"
              title="Perkecil (Zoom Out)"
            >
              <ZoomOut size={18} />
            </button>
            {zoomScale > 1 && (
              <button
                type="button"
                onClick={handleResetZoom}
                className="p-2 text-amber-400 hover:bg-amber-500/20 rounded-full transition-colors cursor-pointer"
                title="Reset Zoom (100%)"
              >
                <RotateCcw size={16} />
              </button>
            )}
          </div>

          {/* Interactive Zoomable Image Stage */}
          <img
            key={activePhotoIndex}
            src={currentPhoto}
            alt={`Post photo ${activePhotoIndex + 1}`}
            onDoubleClick={handleDoubleClick}
            style={{
              transform: `scale(${zoomScale}) translate(${panPos.x / zoomScale}px, ${panPos.y / zoomScale}px)`,
              transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0, 1)',
            }}
            className="max-h-[70vh] max-w-[95%] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80 block my-auto mx-auto select-none pointer-events-auto"
            title="Klik 2x untuk Zoom/Reset"
          />

          {/* Left Arrow Navigation */}
          {thread.photo_urls.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) =>
                  prev === 0 ? thread.photo_urls.length - 1 : prev - 1
                )
              }
              className="absolute left-4 sm:left-6 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
              title="Foto Sebelumnya"
            >
              <ChevronLeft size={24} />
            </button>
          )}

          {/* Right Arrow Navigation */}
          {thread.photo_urls.length > 1 && (
            <button
              type="button"
              onClick={() =>
                setActivePhotoIndex((prev) => (prev + 1) % thread.photo_urls.length)
              }
              className="absolute right-4 sm:right-6 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
              title="Foto Selanjutnya"
            >
              <ChevronRight size={24} />
            </button>
          )}
        </div>
      </div>

      {/* ── Bottom Thumbnail Strip (AutoPass White Glass Harmonized) ── */}
      {thread.photo_urls.length > 1 && (
        <div className="max-w-6xl w-full px-4 sm:px-6 pt-4">
          <div className="bg-white border border-slate-200/90 rounded-2xl p-3 flex items-center justify-center gap-2 overflow-x-auto shadow-xs">
            {thread.photo_urls.map((url, idx) => (
              <button
                key={idx}
                onClick={() => setActivePhotoIndex(idx)}
                className={[
                  'w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0',
                  idx === activePhotoIndex
                    ? 'border-purple-600 ring-2 ring-purple-500/40 scale-105 shadow-md'
                    : 'border-slate-200 opacity-60 hover:opacity-100',
                ].join(' ')}
              >
                <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default ThreadPhotoViewerPage;
