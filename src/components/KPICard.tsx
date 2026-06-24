import { ReactNode } from 'react';

interface KPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  isDarkMode: boolean;
  highlight?: boolean;
}

export default function KPICard({
  label,
  value,
  icon,
  isDarkMode,
  highlight = false,
}: KPICardProps) {
  const cardBg = highlight
    ? isDarkMode
      ? 'bg-amber-950/20 border-amber-500/30 text-amber-400'
      : 'bg-amber-50 border-amber-200 text-amber-800'
    : isDarkMode
      ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]'
      : 'bg-white border-gray-100 text-[#171d19]';

  const labelColor = highlight
    ? 'text-amber-500/80 dark:text-amber-400/80'
    : 'text-gray-400 dark:text-[#87948b]';

  const iconBg = isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-[#d5e3fc] text-[#57657a]';

  return (
    <div className={`p-5 md:p-6 rounded-2xl border ambient-shadow flex items-center justify-between transition-all duration-300 ${cardBg}`}>
      <div className="flex flex-col gap-1">
        <span className={`text-2xs uppercase tracking-wider font-bold ${labelColor}`}>
          {label}
        </span>
        <div className="text-xl md:text-3xl font-black font-display tracking-tight">
          {value}
        </div>
      </div>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
    </div>
  );
}
