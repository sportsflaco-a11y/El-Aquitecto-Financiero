import { useMemo, useState } from 'react';
import { MonthData } from '../hooks/useProjection';
import ChartControls from './ChartControls';
import ChartLegends from './ChartLegends';
import ChartTooltip from './ChartTooltip';
import { formatCurrencyNumber } from '../utils';

interface WealthChartProps {
  isDarkMode: boolean;
  currency: string;
  currencyCode: string;
  monthlyData: MonthData[];
  hoverIndex: number | null;
  setHoverIndex: (idx: number | null) => void;
  cdtAnnualRatePct?: number;
}

export default function WealthChart({
  isDarkMode,
  currency,
  currencyCode,
  monthlyData,
  hoverIndex,
  setHoverIndex,
  cdtAnnualRatePct = 10,
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
      <ChartControls
        isDarkMode={isDarkMode}
        chartMode={chartMode}
        setChartMode={setChartMode}
        focusMode={focusMode}
        setFocusMode={setFocusMode}
        setHoverIndex={setHoverIndex}
      />

      {/* Interactive Legends (Click on them to show/hide lines and auto-scale Y) */}
      <ChartLegends
        isDarkMode={isDarkMode}
        chartMode={chartMode}
        showDebt={showDebt}
        setShowDebt={setShowDebt}
        showSavings={showSavings}
        setShowSavings={setShowSavings}
        showCDT={showCDT}
        setShowCDT={setShowCDT}
        showStatusQuo={showStatusQuo}
        setShowStatusQuo={setShowStatusQuo}
        focusMode={focusMode}
        cdtAnnualRatePct={cdtAnnualRatePct}
      />

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
                  {currency}{gridVal >= 1000000 ? `${(gridVal / 1000000).toFixed(1)}M` : gridVal >= 1000 ? `${(gridVal / 1000).toFixed(0)}k` : formatCurrencyNumber(gridVal, currencyCode)}
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
          <ChartTooltip
            isDarkMode={isDarkMode}
            currency={currency}
            currencyCode={currencyCode}
            chartMode={chartMode}
            activeHoverData={activeHoverData}
            showDebt={showDebt}
            showSavings={showSavings}
            showCDT={showCDT}
            showStatusQuo={showStatusQuo}
            focusMode={focusMode}
            cdtAnnualRatePct={cdtAnnualRatePct}
          />
        )}
      </div>

    </div>
  );
}
