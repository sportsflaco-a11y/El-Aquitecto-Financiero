import { MonthData } from '../hooks/useProjection';
import { formatCurrencyNumber } from '../utils';

interface ChartTooltipProps {
  isDarkMode: boolean;
  currency: string;
  currencyCode: string;
  chartMode: 'overview' | 'debt_compare';
  activeHoverData: MonthData;
  showDebt: boolean;
  showSavings: boolean;
  showCDT: boolean;
  showStatusQuo: boolean;
  focusMode: 'all' | 'debts';
  cdtAnnualRatePct?: number;
}

export default function ChartTooltip({
  isDarkMode,
  currency,
  currencyCode,
  chartMode,
  activeHoverData,
  showDebt,
  showSavings,
  showCDT,
  showStatusQuo,
  focusMode,
  cdtAnnualRatePct = 10,
}: ChartTooltipProps) {
  return (
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
                <span className="text-gray-400">Deuda con Aceleración:</span>
                <span className="font-bold font-display text-amber-500">
                  {currency}{formatCurrencyNumber(activeHoverData.debtWithPlan, currencyCode)}
                </span>
              </div>
            )}
            {showSavings && focusMode === 'all' && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-gray-400">Ahorro Tradic. (2%):</span>
                <span className="font-bold font-display text-blue-500">
                  {currency}{formatCurrencyNumber(activeHoverData.savingsBasic, currencyCode)}
                </span>
              </div>
            )}
            {showCDT && focusMode === 'all' && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-gray-400 font-bold text-emerald-600 dark:text-[#68dba9]">CDT (Tasa Fija {cdtAnnualRatePct}%):</span>
                <span className="font-black font-display text-emerald-500">
                  {currency}{formatCurrencyNumber(activeHoverData.savingsCDT, currencyCode)}
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
                  {currency}{formatCurrencyNumber(activeHoverData.debtWithPlan, currencyCode)}
                </span>
              </div>
            )}
            {showStatusQuo && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-gray-400">Mínimos Fijos (Status Quo):</span>
                <span className="font-bold font-display text-red-500">
                  {currency}{formatCurrencyNumber(activeHoverData.debtStatusQuo, currencyCode)}
                </span>
              </div>
            )}
            {showStatusQuo && showDebt && activeHoverData.debtStatusQuo - activeHoverData.debtWithPlan > 0 && (
              <div className="text-[10px] text-emerald-500 font-medium text-center border-t border-dashed border-gray-100 dark:border-[#3d4a42]/20 pt-1">
                ¡Deuda reducida en {currency}{formatCurrencyNumber(activeHoverData.debtStatusQuo - activeHoverData.debtWithPlan, currencyCode)}!
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
