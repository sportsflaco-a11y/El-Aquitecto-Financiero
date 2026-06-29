import { ShieldCheck } from 'lucide-react';

interface ChartLegendsProps {
  isDarkMode: boolean;
  chartMode: 'overview' | 'debt_compare';
  showDebt: boolean;
  setShowDebt: (show: boolean) => void;
  showSavings: boolean;
  setShowSavings: (show: boolean) => void;
  showCDT: boolean;
  setShowCDT: (show: boolean) => void;
  showStatusQuo: boolean;
  setShowStatusQuo: (show: boolean) => void;
  focusMode: 'all' | 'debts';
  cdtAnnualRatePct?: number;
}

export default function ChartLegends({
  isDarkMode,
  chartMode,
  showDebt,
  setShowDebt,
  showSavings,
  setShowSavings,
  showCDT,
  setShowCDT,
  showStatusQuo,
  setShowStatusQuo,
  focusMode,
  cdtAnnualRatePct = 10,
}: ChartLegendsProps) {
  return (
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
              <span>Deuda con Aceleración</span>
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
                CDT Garantizado ({cdtAnnualRatePct}%)
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
  );
}
