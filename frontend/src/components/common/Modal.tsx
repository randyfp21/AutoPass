import React, { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  closeOnBackdrop?: boolean;
}

// ─── Size Styles ──────────────────────────────────────────────────────────────

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = 'md',
  closeOnBackdrop = true,
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);

  // Focus trap + escape key + lock window/body background scroll
  useEffect(() => {
    if (!isOpen) return;

    const previouslyFocused = document.activeElement as HTMLElement;
    firstFocusableRef.current?.focus();

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();

      // Basic focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    document.body.classList.add('modal-open');
    document.documentElement.classList.add('modal-open');

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      document.body.classList.remove('modal-open');
      document.documentElement.classList.remove('modal-open');
      previouslyFocused?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-3 sm:p-6 text-center select-none w-screen h-screen"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/65 backdrop-blur-sm animate-fade-in z-0"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Modal Box Container: Locked Height, Fully Contained & Perfectly Centered */}
      <div
        ref={dialogRef}
        className={[
          'relative w-full bg-white rounded-3xl shadow-2xl border border-slate-200/90',
          'flex flex-col my-auto max-h-[85vh] sm:max-h-[88vh]',
          'animate-slide-up z-10 text-left overflow-hidden select-text',
          sizeClasses[size],
        ].join(' ')}
      >
        {/* Header (Fixed at top of modal box) */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-slate-100 shrink-0 bg-white z-10">
          <h2
            id="modal-title"
            className="text-base sm:text-lg font-extrabold text-slate-900 font-sans tracking-tight"
          >
            {title}
          </h2>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Inner Body (Only the inner form contents scroll if long, header & footer stay 100% visible & locked) */}
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 min-h-0 scrollbar-thin">
          {children}
        </div>

        {/* Footer (Fixed at bottom of modal box) */}
        {footer && (
          <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/90 rounded-b-3xl shrink-0 z-10">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

export default Modal;
