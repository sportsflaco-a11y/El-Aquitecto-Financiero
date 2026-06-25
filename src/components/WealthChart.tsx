import { useMemo, useState } from 'react';
import { Info, TrendingUp, ShieldCheck, Zap } from 'lucide-react';
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
  // Mode selection: 'overview' (Deuda vs Ahorro) or 'debt_compare' (Plan vs Mínimos Fijos)
  const [chartMode, setChartMode] = useState<'overview' | 'debt_compare'>('overview');
  
  // Focus Mode to maximize vertical detail of the debt curves
  const [focusMode, setFocusMode] = useState<'all' | 'debts'>('all');

  // Legend Toggles
  const [showCDT, setShowCDT] = useState(true);
  const [showSavings, setShowSavings] = useState(true);
  const [showDebt, setShowDebt] = useState(true);
  const [showStatusQuo, setShowStatusQuo] = useState(true);

  // Render SVG Dimensions & points
  const points = useMemo(() => {
    const sampledData = monthlyData.filter((_, idx) => idx % 6 === 0 || idx === 119); // 21 sample points
    
    // Find min and max value to fit in SVG based on active chartMode & focusMode
    const allValues = sampledData.flatMap(d => {
      const vals: number[] = [];
      if (chartMode === 'overview') {
        if (showDebt) vals.push(d.debtWithPlan);
        // If focusMode is 'debts', we temporarily exclude savings from the Y-axis auto-scaler
        if (focusMode === 'all') {
          if (showSavings) vals.push(d.savingsBasic);
          if (showCDT) vals.push(d.savingsCDT);
        }
      } else {
        if (showDebt) vals.push(d.debtWithPlan);
        if (showStatusQuo) vals.push(d.debtStatusQuo);
      }
      return vals;
    });
    
    // Ensure we don't have empty array
    const maxVal = allValues.length > 0 ? Math.max(...allValues, 100) : 1000;
    const minVal = 0;

    const width = 600;
    const height = 300;
    const padding = 45;

    const scaleX = (idx: number) => padding + (idx / (sampledData.length - 1)) * (width - 2 * padding);
    const scaleY = (val: number) => {
      const range = maxVal - minVal;
      const heightRange = height - 2 * padding;
      return height - padding - ((val - minVal) / range) * heightRange;
    };

    const debtStatusQuoPoints = sampledData.map((d, idx) => `${scaleX(idx).toFixed(1)},${scaleY(d.debtStatusQuo).toFixed(1)}`).join(' ');
    const debtWithPlanPoints = sampledData.map((d, idx) => `${scaleX(idx).toFixed(1)},${scaleY(d.debtWithPlan).toFixed(1)}`).join(' ');
    const savingsBasicPoints = sampledData.map((d, idx) => `${scaleX(idx).toFixed(1)},${scaleY(d.savingsBasic).toFixed(1)}`).join(' ');
    const savingsCDTPoints = sampledData.map((d, idx) => `${scaleX(idx).toFixed(1)},${scaleY(d.savingsCDT).toFixed(1)}`).join(' ');

    return {
      debtStatusQuoPoints,
      debtWithPlanPoints,
      savingsBasicPoints,
      savingsCDTPoints,
      samples: sampledData,
      scaleX,
      scaleY,
      width,
      height,
      padding,
      maxVal,
      minVal,
    };
  }, [monthlyData, chartMode, focusMode, showCDT, showSavings, showDebt, showStatusQuo]);

  const activeHoverData = hoverIndex !== null ? points.samples[hoverIndex] : null;

  return (
    <div className="flex flex-col gap-4" id="wealth-chart-wrapper">
      
      {/* Chart Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 w-full" id="chart-controls">
        {/* Mode Select Tabs */}
        <div className={`flex justify-center md:justify-start gap-1 p-1 rounded-xl w-full md:w-max border transition-colors ${
          isDarkMode 
            ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de]' 
            : 'bg-[#f5fbf5] border-gray-200/60 text-[#171d19]'
        }`} id="chart-tabs">
          <button
            type="button"
            onClick={() => { setChartMode('overview'); setHoverIndex(null); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartMode === 'overview'
                ? isDarkMode
                  ? 'bg-[#1b211d] text-[#68dba9] shadow-sm'
                  : 'bg-[#006948] text-white shadow-sm'
                : isDarkMode
                  ? 'text-[#87948b] hover:text-white hover:bg-[#3d4a42]/10'
                  : 'text-gray-400 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Plan: Deuda vs. Ahorros
          </button>

          <button
            type="button"
            onClick={() => { setChartMode('debt_compare'); setHoverIndex(null); }}
            className={`flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              chartMode === 'debt_compare'
                ? isDarkMode
                  ? 'bg-[#1b211d] text-[#68dba9] shadow-sm'
                  : 'bg-[#006948] text-white shadow-sm'
                : isDarkMode
                  ? 'text-[#87948b] hover:text-white hover:bg-[#3d4a42]/10'
                  : 'text-gray-400 hover:text-gray-950 hover:bg-gray-100'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Aceleración: Plan vs. Mínimos Fijos
          </button>
        </div>

        {/* Focus Mode Selection (Rescales Y Axis instantly!) */}
        {chartMode === 'overview' && (
          <div className={`flex items-center gap-1 p-1 rounded-xl border self-center md:self-auto transition-colors ${
            isDarkMode 
              ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de]' 
              : 'bg-[#f5fbf5] border-gray-200/60 text-[#171d19]'
          }`} id="chart-focus">
            <button
              type="button"
              onClick={() => { setFocusMode('all'); setHoverIndex(null); }}
              className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                focusMode === 'all'
                  ? isDarkMode
                    ? 'bg-[#1b211d] text-[#68dba9]'
                    : 'bg-[#006948] text-white'
                  : isDarkMode
                    ? 'text-[#87948b] hover:text-white hover:bg-[#3d4a42]/10'
                    : 'text-gray-400 hover:text-gray-900'
              }`}
            >
              Ver Todo
            </button>
            <button
              type="button"
              onClick={() => { setFocusMode('debts'); setHoverIndex(null); }}
              className={`flex items-center gap-1 px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                focusMode === 'debts'
                  ? 'bg-amber-500 text-white shadow-sm font-extrabold'
                  : isDarkMode
                    ? 'text-[#87948b] hover:text-amber-400 hover:bg-[#3d4a42]/10'
                    : 'text-gray-400 hover:text-amber-500'
              }`}
              title="Ajusta el eje Y al tamaño de tu deuda para ver las curvas en alta resolución"
            >
              <span>🔍 Zoom a Deuda</span>
            </button>
          </div>
        )}
      </div>

      {/* Interactive Legends (Click on them to show/hide lines and auto-scale Y) */}
      <div className={`flex flex-col gap-1.5 p-2.5 rounded-xl border transition-colors ${
        isDarkMode 
          ? 'bg-[#0f1511] border-[#3d4a42]/30 text-[#dee4de]' 
          : 'bg-[#f5fbf5] border-gray-200/50 text-[#171d19]'
      }`} id="chart-legends-container">
        <span className={`text-[10px] font-medium select-none ${isDarkMode ? 'text-[#87948b]' : 'text-gray-400'}`}>
          💡 Presiona las leyendas para activar/desactivar curvas y reajustar la escala:
        </span>
        <div className="flex flex-wrap items-center gap-2.5 text-xs" id="chart-legends">
          {chartMode === 'overview' ? (
            <>
              <button
                type="button"
                onClick={() => setShowDebt(!showDebt)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-left ${
                  showDebt 
                    ? isDarkMode
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 font-bold'
                      : 'bg-amber-500/10 border-amber-500/30 text-amber-600 font-bold' 
                    : isDarkMode
                      ? 'bg-transparent border-[#3d4a42]/30 text-gray-600 line-through'
                      : 'bg-transparent border-gray-200/40 text-gray-400 line-through'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showDebt ? 'bg-amber-500' : isDarkMode ? 'bg-[#3d4a42]' : 'bg-gray-300'}`} />
                <span>Deuda con Plan</span>
              </button>

              <button
                type="button"
                disabled={focusMode === 'debts'}
                onClick={() => setShowSavings(!showSavings)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-left ${
                  focusMode === 'debts'
                    ? isDarkMode
                      ? 'opacity-30 cursor-not-allowed border-[#3d4a42]/20 text-gray-700'
                      : 'opacity-30 cursor-not-allowed border-gray-200 text-gray-300'
                    : showSavings 
                      ? isDarkMode
                        ? 'bg-blue-500/10 border-blue-500/30 text-blue-400 font-bold cursor-pointer'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-600 font-bold cursor-pointer' 
                      : isDarkMode
                        ? 'bg-transparent border-[#3d4a42]/30 text-gray-600 line-through cursor-pointer'
                        : 'bg-transparent border-gray-200/40 text-gray-400 line-through cursor-pointer'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showSavings && focusMode === 'all' ? 'bg-blue-500' : isDarkMode ? 'bg-[#3d4a42]' : 'bg-gray-300'}`} />
                <span>Ahorro Tradicional (2%)</span>
              </button>

              <button
                type="button"
                disabled={focusMode === 'debts'}
                onClick={() => setShowCDT(!showCDT)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all text-left ${
                  focusMode === 'debts'
                    ? isDarkMode
                      ? 'opacity-30 cursor-not-allowed border-[#3d4a42]/20 text-gray-700'
                      : 'opacity-30 cursor-not-allowed border-gray-200 text-gray-300'
                    : showCDT 
                      ? isDarkMode
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-[#68dba9] font-black cursor-pointer'
                        : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-black cursor-pointer' 
                      : isDarkMode
                        ? 'bg-transparent border-[#3d4a42]/30 text-gray-600 line-through cursor-pointer'
                        : 'bg-transparent border-gray-200/40 text-gray-400 line-through cursor-pointer'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${showCDT && focusMode === 'all' ? 'bg-[#10b981]' : isDarkMode ? 'bg-[#3d4a42]' : 'bg-gray-300'}`} />
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  CDT Garantizado (10%)
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowDebt(!showDebt)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-left ${
                  showDebt 
                    ? isDarkMode
                      ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#68dba9] font-bold'
                      : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 font-bold' 
                    : isDarkMode
                      ? 'bg-transparent border-[#3d4a42]/30 text-gray-600 line-through'
                      : 'bg-transparent border-gray-200/40 text-gray-400 line-through'
                }`}
              >
                <span className={`w-4 h-1 block rounded ${showDebt ? 'bg-emerald-500' : isDarkMode ? 'bg-[#3d4a42]' : 'bg-gray-300'}`} />
                <span>Deuda con Acelerador (Tu Plan)</span>
              </button>

              <button
                type="button"
                onClick={() => setShowStatusQuo(!showStatusQuo)}
                className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border transition-all cursor-pointer text-left ${
                  showStatusQuo 
                    ? isDarkMode
                      ? 'bg-red-500/10 border-red-500/30 text-red-400 font-bold'
                      : 'bg-red-500/10 border-red-500/30 text-red-500 font-bold' 
                    : isDarkMode
                      ? 'bg-transparent border-[#3d4a42]/30 text-gray-600 line-through'
                      : 'bg-transparent border-gray-200/40 text-gray-400 line-through'
                }`}
              >
                <span className={`w-4 h-1 block rounded ${showStatusQuo ? 'border-t-2 border-dashed border-red-500' : isDarkMode ? 'border-t-2 border-dashed border-[#3d4a42]' : 'border-t-2 border-dashed border-gray-300'}`} />
                <span>Deuda con Mínimos (Solo cuotas fijas)</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* SVG Canvas Area */}
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
                  className="font-sans text-[9px] fill-gray-400 font-semibold"
                >
                  {currency}{gridVal >= 1000000 ? `${(gridVal / 1000000).toFixed(1)}M` : gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : gridVal.toFixed(0)}
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
                  className="font-sans text-[9px] fill-gray-400 font-semibold"
                >
                  Año {d.year}
                </text>
              );
            }
            return null;
          })}

          {/* Render Lines depending on chartMode and active states */}
          {chartMode === 'overview' ? (
            <>
              {/* Savings CDT Line (10% Guaranteed CDT) */}
              {showCDT && focusMode === 'all' && (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points={points.savingsCDTPoints}
                />
              )}

              {/* Savings Basic Line (2%) */}
              {showSavings && focusMode === 'all' && (
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  points={points.savingsBasicPoints}
                />
              )}

              {/* Debt with Plan Line */}
              {showDebt && (
                <polyline
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="3.5"
                  points={points.debtWithPlanPoints}
                />
              )}
            </>
          ) : (
            <>
              {/* Status Quo Debt Line (Dashed Red) */}
              {showStatusQuo && (
                <polyline
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  points={points.debtStatusQuoPoints}
                />
              )}

              {/* Debt with Plan Line (Solid Emerald) */}
              {showDebt && (
                <polyline
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                  points={points.debtWithPlanPoints}
                />
              )}
            </>
          )}

          {/* Hover Interaction Hotspots */}
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

              {chartMode === 'overview' ? (
                <g>
                  {/* Debt with Plan Dot */}
                  {showDebt && (
                    <circle
                      cx={points.scaleX(hoverIndex)}
                      cy={points.scaleY(activeHoverData.debtWithPlan)}
                      r="5"
                      fill="#f59e0b"
                      stroke={isDarkMode ? '#000000' : '#ffffff'}
                      strokeWidth="1"
                    />
                  )}
                  {/* Savings Basic Dot */}
                  {showSavings && focusMode === 'all' && (
                    <circle
                      cx={points.scaleX(hoverIndex)}
                      cy={points.scaleY(activeHoverData.savingsBasic)}
                      r="5"
                      fill="#3b82f6"
                      stroke={isDarkMode ? '#000000' : '#ffffff'}
                      strokeWidth="1"
                    />
                  )}
                  {/* Savings CDT Dot */}
                  {showCDT && focusMode === 'all' && (
                    <circle
                      cx={points.scaleX(hoverIndex)}
                      cy={points.scaleY(activeHoverData.savingsCDT)}
                      r="6"
                      fill="#10b981"
                      stroke={isDarkMode ? '#000000' : '#ffffff'}
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              ) : (
                <g>
                  {/* Debt Status Quo Dot */}
                  {showStatusQuo && (
                    <circle
                      cx={points.scaleX(hoverIndex)}
                      cy={points.scaleY(activeHoverData.debtStatusQuo)}
                      r="5"
                      fill="#ef4444"
                    />
                  )}
                  {/* Debt with Plan Dot */}
                  {showDebt && (
                    <circle
                      cx={points.scaleX(hoverIndex)}
                      cy={points.scaleY(activeHoverData.debtWithPlan)}
                      r="6"
                      fill="#10b981"
                      stroke={isDarkMode ? '#000000' : '#ffffff'}
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              )}
            </g>
          )}
        </svg>

        {/* Live Tooltip Panel Overlay */}
        {hoverIndex !== null && activeHoverData && (
          <div 
            className={`absolute top-2 left-1/2 -translate-x-1/2 p-3.5 rounded-2xl border shadow-lg text-xs flex flex-col gap-2 z-40 w-[240px] ${
              isDarkMode ? 'bg-[#171d19] border-[#3d4a42] text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
            }`}
            id="chart-tooltip"
          >
            <div className="font-bold border-b pb-1 font-display flex items-center justify-between">
              <span>Mes {activeHoverData.month} (Año {activeHoverData.year})</span>
              {activeHoverData.debtWithPlan > 0 ? (
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 font-bold uppercase">
                  Con Deuda
                </span>
              ) : (
                <span className="px-1.5 py-0.5 rounded text-[8px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-[#68dba9] font-bold uppercase">
                  Libre de Deuda
                </span>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              {chartMode === 'overview' ? (
                <>
                  {showDebt && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-gray-400">Deuda con Plan:</span>
                      <span className="font-bold font-display text-amber-500">
                        {currency}{activeHoverData.debtWithPlan.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  {showSavings && focusMode === 'all' && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-gray-400">Ahorro Tradic. (2%):</span>
                      <span className="font-bold font-display text-blue-500">
                        {currency}{activeHoverData.savingsBasic.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  {showCDT && focusMode === 'all' && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-gray-400 font-bold text-emerald-600 dark:text-[#68dba9]">CDT Garantizado (10%):</span>
                      <span className="font-black font-display text-emerald-500">
                        {currency}{activeHoverData.savingsCDT.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {showDebt && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-gray-400">Plan de Aceleración:</span>
                      <span className="font-bold font-display text-emerald-500">
                        {currency}{activeHoverData.debtWithPlan.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  {showStatusQuo && (
                    <div className="flex items-center justify-between gap-6">
                      <span className="text-gray-400">Mínimos Fijos (Status Quo):</span>
                      <span className="font-bold font-display text-red-500">
                        {currency}{activeHoverData.debtStatusQuo.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  )}
                  {showStatusQuo && showDebt && activeHoverData.debtStatusQuo - activeHoverData.debtWithPlan > 0 && (
                    <div className="text-[10px] text-emerald-500 font-medium text-center border-t border-dashed border-gray-100 dark:border-[#3d4a42]/20 pt-1">
                      ¡Deuda reducida en {currency}{(activeHoverData.debtStatusQuo - activeHoverData.debtWithPlan).toLocaleString('en-US', { maximumFractionDigits: 0 })}!
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
