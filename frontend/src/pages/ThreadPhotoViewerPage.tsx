import React, { useState, useEffect } from 'react';
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

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 bg-slate-950 text-white min-h-screen">
        <div className="text-center space-y-3">
          <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
    <div className="flex-1 bg-slate-950 text-slate-100 min-h-screen flex flex-col justify-between items-center overflow-hidden select-none w-full">
      {/* ── Top Header Navigation Bar ── */}
      <div className="w-full p-4 sm:p-6 flex items-center justify-between z-30 bg-gradient-to-b from-slate-950/90 via-slate-950/40 to-transparent">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
        >
          <ArrowLeft size={18} className="text-purple-400" />
          <span>Kembali</span>
        </button>

        {/* Counter Badge */}
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-purple-400" />
          <span className="text-xs font-mono font-extrabold text-slate-200 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700/80 shadow-xl backdrop-blur-md">
            Foto {activePhotoIndex + 1} dari {thread.photo_urls.length}
          </span>
        </div>

        {/* Action Buttons: Share & Download */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-3.5 py-2 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Bagikan Tautan Foto"
          >
            {isCopied ? <Check size={16} className="text-emerald-400" /> : <Share2 size={16} />}
            <span className="hidden sm:inline">{isCopied ? 'Disalin' : 'Share'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 bg-purple-600/90 hover:bg-purple-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2 rounded-full border border-purple-500/80 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Unduh Gambar"
          >
            <Download size={16} />
            <span className="hidden sm:inline">Unduh</span>
          </button>
        </div>
      </div>

      {/* ── 100% Dead-Centered Full-Screen Image Viewport ── */}
      <div className="relative z-10 w-full h-full flex-1 flex items-center justify-center p-4 sm:p-8 my-auto overflow-hidden">
        <img
          key={activePhotoIndex}
          src={currentPhoto}
          alt={`Post photo ${activePhotoIndex + 1}`}
          className="max-h-[82vh] max-w-[95vw] w-auto h-auto object-contain rounded-2xl shadow-2xl border border-slate-800/80 animate-in zoom-in-95 duration-200 block my-auto mx-auto"
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
            className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
            title="Foto Sebelumnya"
          >
            <ChevronLeft size={26} />
          </button>
        )}

        {/* Right Arrow Navigation */}
        {thread.photo_urls.length > 1 && (
          <button
            type="button"
            onClick={() =>
              setActivePhotoIndex((prev) => (prev + 1) % thread.photo_urls.length)
            }
            className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 sm:p-4 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md z-20"
            title="Foto Selanjutnya"
          >
            <ChevronRight size={26} />
          </button>
        )}
      </div>

      {/* ── Bottom Thumbnail Strip (If Multi-Photo) ── */}
      {thread.photo_urls.length > 1 && (
        <div className="w-full p-4 flex items-center justify-center gap-2.5 bg-slate-950/90 border-t border-slate-900 overflow-x-auto z-30">
          {thread.photo_urls.map((url, idx) => (
            <button
              key={idx}
              onClick={() => setActivePhotoIndex(idx)}
              className={[
                'w-14 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0',
                idx === activePhotoIndex
                  ? 'border-purple-500 ring-2 ring-purple-500/50 scale-105 shadow-md'
                  : 'border-slate-800 opacity-60 hover:opacity-100',
              ].join(' ')}
            >
              <img src={url} alt={`Thumbnail ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ThreadPhotoViewerPage;
