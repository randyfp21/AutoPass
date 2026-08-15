import React, { type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'danger' | 'ghost' | 'secondary' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  fullWidth?: boolean;
  children: ReactNode;
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'bg-blue-600 text-white border-transparent hover:bg-blue-700 active:bg-blue-800 shadow-sm hover:shadow-md focus:ring-blue-500',
  danger:
    'bg-red-600 text-white border-transparent hover:bg-red-700 active:bg-red-800 shadow-sm hover:shadow-md focus:ring-red-500',
  ghost:
    'bg-transparent text-slate-700 border-slate-300 hover:bg-slate-50 active:bg-slate-100 focus:ring-slate-400',
  secondary:
    'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200 active:bg-slate-300 focus:ring-slate-400',
  success:
    'bg-green-600 text-white border-transparent hover:bg-green-700 active:bg-green-800 shadow-sm hover:shadow-md focus:ring-green-500',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      className={[
        // Base styles
        'inline-flex items-center justify-center font-semibold',
        'border rounded-lg',
        'transition-all duration-150 ease-in-out',
        'focus:outline-none focus:ring-2 focus:ring-offset-2',
        'select-none cursor-pointer',
        // Active scale transform
        'active:scale-[0.97]',
        // Disabled state
        isDisabled ? 'opacity-60 cursor-not-allowed pointer-events-none' : '',
        // Variant
        variantClasses[variant],
        // Size
        sizeClasses[size],
        // Full width
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" size={size === 'lg' ? 20 : size === 'sm' ? 14 : 16} />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
}

export default Button;
