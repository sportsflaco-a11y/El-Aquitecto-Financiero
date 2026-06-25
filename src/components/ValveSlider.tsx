import React from 'react';
import { LucideIcon } from 'lucide-react';

interface ValveSliderProps {
  isDarkMode: boolean;
  currency: string;
  icon: React.ReactNode;
  label: string;
  description: string;
  subDescription: string;
  percentage: number;
  monthlyAmount: number;
  color: string;
  badgeBgClass: string;
  textClass: string;
  btnTextClass: string;
  onChange: (val: number) => void;
  id: string;
}

export default function ValveSlider({
  isDarkMode,
  currency,
  icon,
  label,
  description,
  subDescription,
  percentage,
  monthlyAmount,
  color,
  badgeBgClass,
  textClass,
  btnTextClass,
  onChange,
  id,
}: ValveSliderProps) {
  
  // Dynamic styled slider track
  const getSliderStyle = (value: number, activeColor: string) => {
    const trackColor = isDarkMode ? '#171d19' : '#f3f4f6';
    return {
      background: `linear-gradient(to right, ${activeColor} 0%, ${activeColor} ${value}%, ${trackColor} ${value}%, ${trackColor} 100%)`
    };
  };

  return (
    <div className={`p-5 md:p-6 rounded-2xl border transition-all ${
      isDarkMode 
        ? 'bg-[#0a0f0c] border-[#3d4a42]/30 hover:border-[#3d4a42]/60 shadow-[0_4px_20px_rgba(0,0,0,0.15)]' 
        : 'bg-white border-gray-200/80 hover:border-gray-300 shadow-sm'
    }`} id={id}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <span className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${badgeBgClass}`}>
            {icon}
          </span>
          <div>
            <span className="font-bold text-sm md:text-base font-display block leading-none">{label}</span>
            <p className="text-2xs text-gray-400 dark:text-[#87948b] mt-1">{description}</p>
          </div>
        </div>
        
        <div className="flex items-baseline gap-1 sm:text-right shrink-0">
          <span className={`text-xl md:text-2xl font-black font-display ${textClass}`}>
            {currency}{monthlyAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-xs text-gray-400 dark:text-[#87948b]">/mes</span>
        </div>
      </div>

      <div className="flex items-center gap-4 py-2">
        <button
          type="button"
          onClick={() => onChange(percentage - 5)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all shrink-0 cursor-pointer select-none active:scale-95 ${
            isDarkMode 
              ? `bg-[#171d19] hover:bg-[#1f2621] border border-[#3d4a42]/40 ${btnTextClass}` 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title="Reducir 5%"
        >
          &minus;
        </button>

        <div className="relative flex-1 flex items-center">
          <input
            type="range"
            min="0"
            max="100"
            className="w-full h-2 rounded-lg appearance-none cursor-pointer outline-none transition-all
                       [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                       [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 
                       [&::-webkit-slider-thumb]:border-white dark:[&::-webkit-slider-thumb]:border-[#0a0f0c] [&::-webkit-slider-thumb]:shadow-md 
                       [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:active:scale-125"
            style={{
              ...getSliderStyle(percentage, color),
              '--thumb-color': color,
            } as React.CSSProperties}
            value={percentage}
            onChange={(e) => onChange(Number(e.target.value))}
          />
          {/* Custom style to override tailwind range thumb color dynamically if possible, or just let default tailwind class handle it but inline style background handles track */}
          <style>{`
            #${id} input[type=range]::-webkit-slider-thumb {
              background-color: ${color} !important;
            }
            #${id} input[type=range]::-moz-range-thumb {
              background-color: ${color} !important;
            }
          `}</style>
        </div>

        <button
          type="button"
          onClick={() => onChange(percentage + 5)}
          className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-all shrink-0 cursor-pointer select-none active:scale-95 ${
            isDarkMode 
              ? `bg-[#171d19] hover:bg-[#1f2621] border border-[#3d4a42]/40 ${btnTextClass}` 
              : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
          }`}
          title="Aumentar 5%"
        >
          +
        </button>

        <div className="w-12 text-right">
          <span className={`font-extrabold text-sm font-display px-2 py-1 rounded ${textClass} ${badgeBgClass.split(' ')[0]}`}>
            {percentage}%
          </span>
        </div>
      </div>

      <p className="text-xs text-gray-500 dark:text-[#87948b] leading-relaxed border-t border-gray-100 dark:border-[#3d4a42]/10 pt-2.5 mt-1">
        {subDescription}
      </p>
    </div>
  );
}
