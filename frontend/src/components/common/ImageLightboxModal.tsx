import React, { useState, useEffect } from 'react';
import { X, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  images: string[];
  initialIndex?: number;
}

export function ImageLightboxModal({
  isOpen,
  onClose,
  images,
  initialIndex = 0,
}: ImageLightboxModalProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex, isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, currentIndex, images.length]);

  if (!isOpen || !images || images.length === 0) return null;

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const currentImage = images[currentIndex] || images[0];

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-3 sm:p-5 bg-slate-950/94 backdrop-blur-md animate-in fade-in duration-200 select-none"
      onClick={onClose}
    >
      {/* Top Bar: Button Kembali (Left), Counter (Center), Button Tutup (Right) */}
      <div
        className="w-full max-w-5xl flex items-center justify-between pt-1 px-1 z-10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Tombol Kembali / Back */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 bg-slate-800/90 hover:bg-slate-700 text-white text-xs font-extrabold px-3.5 py-2 rounded-full border border-slate-700/80 shadow-lg cursor-pointer transition-all active:scale-95"
          title="Kembali (Esc)"
        >
          <ArrowLeft size={16} />
          <span>Kembali</span>
        </button>

        {/* Counter Chip */}
        <span className="text-xs font-extrabold text-slate-300 bg-slate-800/80 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-xs font-mono">
          Foto {currentIndex + 1} dari {images.length}
        </span>

        {/* Tombol Close / Tutup */}
        <button
          type="button"
          onClick={onClose}
          className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-600 text-white text-xs font-extrabold px-3.5 py-2 rounded-full border border-red-500/80 shadow-lg cursor-pointer transition-all active:scale-95"
          title="Tutup (Esc)"
        >
          <X size={16} />
          <span className="hidden sm:inline">Tutup</span>
        </button>
      </div>

      {/* Center Image Container */}
      <div
        className="relative flex-1 w-full max-w-5xl flex items-center justify-center my-3 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {images.length > 1 && (
          <button
            type="button"
            onClick={handlePrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
            title="Foto Sebelumnya (←)"
          >
            <ChevronLeft size={24} />
          </button>
        )}

        <img
          key={currentIndex}
          src={currentImage}
          alt={`Lightbox image ${currentIndex + 1}`}
          className="max-h-[80vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/80 animate-in zoom-in-95 duration-200"
        />

        {images.length > 1 && (
          <button
            type="button"
            onClick={handleNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-3 text-white bg-slate-900/80 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 z-20 cursor-pointer"
            title="Foto Selanjutnya (→)"
          >
            <ChevronRight size={24} />
          </button>
        )}
      </div>

      {/* Bottom Thumbnail Strip (if multi-photo) */}
      {images.length > 1 && (
        <div
          className="w-full max-w-lg flex items-center justify-center gap-2 pb-2 overflow-x-auto z-10"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((imgUrl, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentIndex(idx)}
              className={[
                'w-12 h-12 rounded-xl overflow-hidden border-2 transition-all cursor-pointer shrink-0',
                idx === currentIndex
                  ? 'border-purple-500 ring-2 ring-purple-500/40 scale-110'
                  : 'border-slate-800 opacity-60 hover:opacity-100',
              ].join(' ')}
            >
              <img
                src={imgUrl}
                alt={`Thumbnail ${idx + 1}`}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageLightboxModal;
