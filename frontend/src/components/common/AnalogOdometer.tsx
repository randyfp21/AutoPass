import React from 'react';

interface AnalogOdometerProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showUnit?: boolean;
  className?: string;
}

export function AnalogOdometer({
  value,
  size = 'sm',
  showUnit = true,
  className = '',
}: AnalogOdometerProps) {
  // Format value into Indonesian formatted string (e.g., 12.500)
  const numericVal = Math.max(0, Math.floor(value || 0));
  const formattedStr = numericVal.toLocaleString('id-ID');
  const chars = formattedStr.split('');

  // Size styling configuration
  const sizeStyles = {
    sm: {
      container: 'px-1.5 py-0.5 rounded-lg gap-0.5 border text-xs',
      digitBox: 'min-w-[14px] h-5 text-[11px] px-1',
      unit: 'text-[9px] pl-0.5 font-bold',
      sep: 'text-[10px] px-0.5',
    },
    md: {
      container: 'px-2 py-1 rounded-xl gap-1 border border-slate-700/80 text-sm shadow-sm',
      digitBox: 'min-w-[18px] h-6 text-xs sm:text-sm px-1.5',
      unit: 'text-[10px] sm:text-xs pl-1 font-bold',
      sep: 'text-xs px-0.5',
    },
    lg: {
      container: 'px-2.5 py-1.5 rounded-2xl gap-1 border border-slate-700 text-base shadow-md',
      digitBox: 'min-w-[22px] h-8 text-sm sm:text-base px-2',
      unit: 'text-xs sm:text-sm pl-1 font-bold',
      sep: 'text-sm px-1',
    },
  };

  const current = sizeStyles[size];

  return (
    <div
      className={[
        'inline-flex items-center bg-slate-950 text-white font-mono select-none border-t border-slate-700/80 border-b border-slate-900 border-x border-slate-800 shadow-inner shrink-0',
        current.container,
        className,
      ].join(' ')}
      title={`Odometer: ${formattedStr} KM`}
    >
      {/* Icon Gauge */}
      <span className="text-amber-400 opacity-90 shrink-0 mr-0.5 text-[10px]">
        ⏱️
      </span>

      {chars.map((char, index) => {
        if (char === '.' || char === ',') {
          return (
            <span
              key={`sep-${index}`}
              className={[
                'font-extrabold text-amber-400/90 shrink-0 self-center leading-none',
                current.sep,
              ].join(' ')}
            >
              .
            </span>
          );
        }

        return (
          <span
            key={`digit-${index}`}
            className={[
              'relative bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white font-black font-mono border border-slate-800/90 rounded flex items-center justify-center shadow-inner shrink-0 leading-none tracking-tighter',
              current.digitBox,
            ].join(' ')}
          >
            {/* Top & Bottom Cylinder Inset Line Highlights */}
            <span className="absolute inset-x-0 top-0 h-[1px] bg-white/10 pointer-events-none" />
            <span className="absolute inset-x-0 bottom-0 h-[1px] bg-black/80 pointer-events-none" />

            {/* Clear Crisp Digit */}
            {char}
          </span>
        );
      })}

      {/* KM Unit Tag */}
      {showUnit && (
        <span
          className={[
            'font-black font-tech tracking-wider text-amber-400 uppercase shrink-0',
            current.unit,
          ].join(' ')}
        >
          KM
        </span>
      )}
    </div>
  );
}

export default AnalogOdometer;
