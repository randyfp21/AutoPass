import React from 'react';

interface AnalogOdometerProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  showUnit?: boolean;
  className?: string;
}

export function AnalogOdometer({
  value,
  size = 'md',
  showUnit = true,
  className = '',
}: AnalogOdometerProps) {
  // Format number as zero-padded or comma-separated string (e.g. 12,500)
  const formattedStr = Math.max(0, Math.floor(value)).toLocaleString('id-ID');
  const characters = formattedStr.split('');

  // Size variations
  const sizeConfig = {
    sm: {
      box: 'w-4 h-6 text-xs',
      font: 'text-[11px]',
      digitHeight: 24, // 24px height
      gap: 'gap-0.5 p-0.5 rounded-md',
      unit: 'text-[9px] px-1',
    },
    md: {
      box: 'w-5 sm:w-6 h-8 text-sm sm:text-base',
      font: 'text-xs sm:text-sm',
      digitHeight: 32, // 32px height
      gap: 'gap-0.5 sm:gap-1 p-1 rounded-lg',
      unit: 'text-[10px] sm:text-xs px-1.5',
    },
    lg: {
      box: 'w-7 sm:w-8 h-11 text-lg sm:text-xl',
      font: 'text-base sm:text-lg',
      digitHeight: 44, // 44px height
      gap: 'gap-1 p-1.5 rounded-xl',
      unit: 'text-xs sm:text-sm px-2',
    },
  };

  const currentSize = sizeConfig[size];

  return (
    <div
      className={[
        'inline-flex items-center bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 shadow-md font-mono select-none shadow-inner',
        currentSize.gap,
        className,
      ].join(' ')}
      title={`Odometer: ${formattedStr} KM`}
    >
      {characters.map((char, index) => {
        // If separator character (dot or comma)
        if (char === '.' || char === ',') {
          return (
            <span
              key={`sep-${index}`}
              className="text-amber-400/80 font-bold px-0.2 shrink-0 self-end pb-0.5"
            >
              .
            </span>
          );
        }

        const digitNum = parseInt(char, 10);
        if (isNaN(digitNum)) return null;

        return (
          <div
            key={`digit-${index}`}
            className={[
              'relative overflow-hidden bg-slate-950 text-white font-black rounded border border-slate-800 shadow-inner flex items-center justify-center shrink-0 group',
              currentSize.box,
            ].join(' ')}
          >
            {/* Top & Bottom Curved 3D Cylinder Inset Shadows */}
            <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-b from-black/80 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-x-0 bottom-0 h-2 bg-gradient-to-t from-black/80 to-transparent z-10 pointer-events-none" />

            {/* Rolling Digit Drum Reel */}
            <div
              className="transition-transform duration-700 ease-out flex flex-col items-center justify-start w-full"
              style={{
                transform: `translateY(-${digitNum * 10}%)`,
              }}
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <span
                  key={num}
                  className={[
                    'flex items-center justify-center w-full font-mono font-black text-white shrink-0 tracking-tighter',
                    currentSize.box,
                    currentSize.font,
                  ].join(' ')}
                  style={{ height: `${currentSize.digitHeight}px` }}
                >
                  {num}
                </span>
              ))}
            </div>
          </div>
        );
      })}

      {/* KM Unit Badge */}
      {showUnit && (
        <span
          className={[
            'font-black font-tech text-amber-400 tracking-wider shrink-0 uppercase',
            currentSize.unit,
          ].join(' ')}
        >
          KM
        </span>
      )}
    </div>
  );
}

export default AnalogOdometer;
