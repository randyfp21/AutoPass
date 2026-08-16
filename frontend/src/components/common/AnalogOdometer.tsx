import React from 'react';
import { formatMileage } from '../../utils/formatters';

interface AnalogOdometerProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showUnit?: boolean;
  variant?: 'badge' | 'tile';
  className?: string;
}

export function AnalogOdometer({
  value,
  size = 'sm',
  showUnit = true,
  variant = 'badge',
  className = '',
}: AnalogOdometerProps) {
  const numericVal = Math.max(0, Math.floor(value || 0));
  const formattedStr = formatMileage(numericVal);

  if (variant === 'badge') {
    const sizeClasses = {
      sm: 'px-2.5 py-1 text-xs gap-1.5',
      md: 'px-3 py-1.5 text-sm gap-2',
      lg: 'px-4 py-2 text-base gap-2.5',
    };

    const iconSizes = {
      sm: 'text-[11px]',
      md: 'text-xs',
      lg: 'text-sm',
    };

    return (
      <div
        className={[
          'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 text-white font-mono font-black rounded-xl border border-slate-700/80 shadow-md shadow-slate-950/20 inline-flex items-center border-b-slate-950 border-t-slate-600/80 select-none shrink-0',
          sizeClasses[size],
          className,
        ].join(' ')}
        title={`Odometer: ${formattedStr} KM`}
      >
        <span className={['text-amber-400 shrink-0 font-bold', iconSizes[size]].join(' ')}>⏱️</span>
        <span className="tracking-tight text-white">{formattedStr}</span>
        {showUnit && (
          <span className="text-[10px] text-amber-400 font-extrabold font-tech uppercase tracking-wider">
            KM
          </span>
        )}
      </div>
    );
  }

  // Tile variant
  const chars = formattedStr.split('');
  return (
    <div
      className={[
        'inline-flex items-center bg-slate-950 text-white font-mono select-none border-t border-slate-700/80 border-b border-slate-900 border-x border-slate-800 shadow-inner shrink-0 px-1.5 py-0.5 rounded-lg gap-0.5 text-xs',
        className,
      ].join(' ')}
      title={`Odometer: ${formattedStr} KM`}
    >
      <span className="text-amber-400 shrink-0 mr-0.5 text-[10px]">⏱️</span>
      {chars.map((char, index) => (
        <span
          key={index}
          className="relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white font-black font-mono border border-slate-800 rounded min-w-[14px] h-5 text-[11px] px-1 flex items-center justify-center"
        >
          {char}
        </span>
      ))}
      {showUnit && <span className="font-black text-amber-400 text-[9px] uppercase pl-0.5">KM</span>}
    </div>
  );
}

export default AnalogOdometer;
