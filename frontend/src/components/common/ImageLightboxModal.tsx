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
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl animate-in fade-in duration-200 select-none flex items-center justify-center">
      {/* Backdrop overlay click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Top Header Navigation Overlay */}
      <div className="fixed top-0 left-0 right-0 z-50 p-4 sm:p-6 bg-gradient-to-b from-slate-950/90 via-slate-950/50 to-transparent flex items-center justify-between pointer-events-none">
        {/* Button Kembali (Left) */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-2 bg-slate-900/90 hover:bg-slate-800 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          title="Kembali ke post (Esc)"
        >
          <ArrowLeft size={18} className="text-purple-400" />
          <span>Kembali</span>
        </button>

        {/* Counter Badge (Center) */}
        <span className="pointer-events-auto text-xs font-mono font-extrabold text-slate-200 bg-slate-900/90 px-4 py-2 rounded-full border border-slate-700/80 shadow-xl backdrop-blur-md">
          Foto {currentIndex + 1} / {images.length}
        </span>

        {/* Button Tutup (Right) */}
        <button
          type="button"
          onClick={onClose}
          className="pointer-events-auto flex items-center gap-1.5 bg-red-600/90 hover:bg-red-500 text-white font-extrabold text-xs sm:text-sm px-4 py-2.5 rounded-full border border-red-500/80 shadow-2xl transition-all hover:scale-105 active:scale-95 cursor-pointer backdrop-blur-md"
          title="Tutup foto (Esc)"
        >
          <X size={18} />
          <span className="hidden sm:inline">Tutup</span>
        </button>
      </div>

      {/* Perfectly Centered Image Viewport */}
      <div className="relative w-full max-w-5xl h-full flex items-center justify-center p-4 sm:p-12 z-10 pointer-events-none">
        <div className="pointer-events-auto relative flex items-center justify-center max-h-[78vh] sm:max-h-[82vh] max-w-full">
          <img
            key={currentIndex}
            src={currentImage}
            alt={`Lightbox image ${currentIndex + 1}`}
            className="max-h-[78vh] sm:max-h-[82vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/90 animate-in zoom-in-95 duration-200"
          />
        </div>
      </div>

      {/* Prev / Next Floating Arrow Buttons */}
      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handlePrev();
            }}
            className="fixed left-4 top-1/2 -translate-y-1/2 z-50 p-3.5 text-white bg-slate-900/90 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Foto Sebelumnya (←)"
          >
            <ChevronLeft size={24} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleNext();
            }}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-50 p-3.5 text-white bg-slate-900/90 hover:bg-purple-600 rounded-full border border-slate-700/80 shadow-2xl transition-all hover:scale-110 active:scale-95 cursor-pointer backdrop-blur-md"
            title="Foto Selanjutnya (→)"
          >
            <ChevronRight size={24} />
          </button>
        </>
      )}

      {/* Bottom Thumbnail Strip (if multi-photo) */}
      {images.length > 1 && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center gap-2 p-2 bg-slate-900/90 border border-slate-800/90 rounded-2xl shadow-2xl backdrop-blur-md max-w-[90vw] overflow-x-auto"
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
                  ? 'border-purple-500 ring-2 ring-purple-500/50 scale-110'
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
