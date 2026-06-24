import { useMemo } from 'react';
import { Info } from 'lucide-react';
import { MonthData } from '../hooks/useProjection';

interface WealthChartProps {
  isDarkMode: boolean;
  currency: string;
  monthlyData: MonthData[];
  hoverIndex: number | null;
  setHoverIndex: (idx: number | null) => void;
}

export default function WealthChart({
  isDarkMode,
  currency,
  monthlyData,
  hoverIndex,
  setHoverIndex,
}: WealthChartProps) {
  // Render SVG Dimensions & points
  const points = useMemo(() => {
    const sampledData = monthlyData.filter((_, idx) => idx % 6 === 0 || idx === 119); // 21 sample points
    
    // Find min and max value to fit in SVG
    const allValues = sampledData.flatMap(d => [d.statusQuoValue, d.acceleratorValue]);
    const maxVal = Math.max(...allValues, 10000); // at least 10,000 for display
    const minVal = Math.min(...allValues, 0);

    const width = 600;
    const height = 300;
    const padding = 40;

    const scaleX = (idx: number) => padding + (idx / (sampledData.length - 1)) * (width - 2 * padding);
    const scaleY = (val: number) => {
      const range = maxVal - minVal;
      const heightRange = height - 2 * padding;
      return height - padding - ((val - minVal) / range) * heightRange;
    };

    const sqPoints = sampledData.map((d, idx) => `${scaleX(idx).toFixed(1)},${scaleY(d.statusQuoValue).toFixed(1)}`).join(' ');
    const acPoints = sampledData.map((d, idx) => `${scaleX(idx).toFixed(1)},${scaleY(d.acceleratorValue).toFixed(1)}`).join(' ');

    return {
      sqPoints,
      acPoints,
      samples: sampledData,
      scaleX,
      scaleY,
      width,
      height,
      padding,
      maxVal,
      minVal,
    };
  }, [monthlyData]);

  const activeHoverData = hoverIndex !== null ? points.samples[hoverIndex] : null;

  return (
    <div className="relative w-full overflow-hidden select-none" id="svg-chart-container">
      <svg 
        viewBox={`0 0 ${points.width} ${points.height}`} 
        className="w-full h-auto overflow-visible"
      >
        {/* Grid Lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((p, idx) => {
          const y = points.padding + p * (points.height - 2 * points.padding);
          const gridVal = points.maxVal - p * (points.maxVal - points.minVal);
          return (
            <g key={idx}>
              <line 
                x1={points.padding} 
                y1={y} 
                x2={points.width - points.padding} 
                y2={y} 
                stroke={isDarkMode ? '#3d4a42' : '#e4eae4'} 
                strokeWidth="1" 
                strokeOpacity="0.5" 
              />
              <text 
                x={points.padding - 5} 
                y={y + 4} 
                textAnchor="end" 
                className="font-sans text-[9px] fill-gray-400 font-medium"
              >
                {currency}{gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* X Axis Years */}
        {points.samples.map((d, idx) => {
          if (idx % 4 === 0 || idx === points.samples.length - 1) {
            const x = points.scaleX(idx);
            return (
              <text 
                key={idx}
                x={x} 
                y={points.height - points.padding + 15} 
                textAnchor="middle" 
                className="font-sans text-[9px] fill-gray-400 font-medium"
              >
                Año {d.year}
              </text>
            );
          }
          return null;
        })}

        {/* Render Status Quo Line */}
        <polyline
          fill="none"
          stroke="#ef4444"
          strokeWidth="2.5"
          strokeDasharray="4 4"
          points={points.sqPoints}
        />

        {/* Render Accelerator Line */}
        <polyline
          fill="none"
          stroke={isDarkMode ? '#68dba9' : '#059669'}
          strokeWidth="3.5"
          points={points.acPoints}
        />

        {/* Hover Interaction Dots & Lines */}
        {points.samples.map((d, idx) => {
          const x = points.scaleX(idx);
          return (
            <rect
              key={idx}
              x={x - 10}
              y={points.padding}
              width={20}
              height={points.height - 2 * points.padding}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoverIndex(idx)}
              onMouseLeave={() => setHoverIndex(null)}
            />
          );
        })}

        {/* Active hover crosshair and points */}
        {hoverIndex !== null && activeHoverData && (
          <g>
            <line
              x1={points.scaleX(hoverIndex)}
              y1={points.padding}
              x2={points.scaleX(hoverIndex)}
              y2={points.height - points.padding}
              stroke={isDarkMode ? '#6d7a72' : '#bccac0'}
              strokeWidth="1.5"
              strokeDasharray="2 2"
            />
            {/* Status Quo Hover Dot */}
            <circle
              cx={points.scaleX(hoverIndex)}
              cy={points.scaleY(activeHoverData.statusQuoValue)}
              r="5"
              fill="#ef4444"
            />
            {/* Accelerator Hover Dot */}
            <circle
              cx={points.scaleX(hoverIndex)}
              cy={points.scaleY(activeHoverData.acceleratorValue)}
              r="6"
              fill={isDarkMode ? '#68dba9' : '#059669'}
              stroke={isDarkMode ? '#0f1511' : '#ffffff'}
              strokeWidth="1.5"
            />
          </g>
        )}
      </svg>

      {/* Live Tooltip Panel Overlay */}
      {hoverIndex !== null && activeHoverData && (
        <div 
          className={`absolute top-4 left-1/2 -translate-x-1/2 p-3 rounded-xl border shadow-lg text-xs flex flex-col gap-1.5 z-40 ${
            isDarkMode ? 'bg-[#171d19] border-[#3d4a42] text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
          }`}
          id="chart-tooltip"
        >
          <div className="font-bold border-b pb-1 font-display flex items-center justify-between gap-10">
            <span>Mes {activeHoverData.month} (Año {activeHoverData.year})</span>
            {activeHoverData.acceleratorDebt > 0 && (
              <span className="px-1.5 py-0.5 rounded text-[8px] bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-400 font-bold uppercase">
                En Deuda
              </span>
            )}
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between gap-6 font-sans">
              <span className="text-gray-400">Status Quo:</span>
              <span className="font-bold font-display text-red-500">
                {currency}{activeHoverData.statusQuoValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex items-center justify-between gap-6 font-sans">
              <span className="text-gray-400">Acelerador:</span>
              <span className="font-bold font-display text-emerald-500">
                {currency}{activeHoverData.acceleratorValue.toLocaleString('en-US', { maximumFractionDigits: 0 })}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
