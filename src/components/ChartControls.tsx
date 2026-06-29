import { TrendingUp, Zap } from 'lucide-react';

interface ChartControlsProps {
  isDarkMode: boolean;
  chartMode: 'overview' | 'debt_compare';
  setChartMode: (mode: 'overview' | 'debt_compare') => void;
  focusMode: 'all' | 'debts';
  setFocusMode: (mode: 'all' | 'debts') => void;
  setHoverIndex: (idx: number | null) => void;
}

export default function ChartControls({
  isDarkMode,
  chartMode,
  setChartMode,
  focusMode,
  setFocusMode,
  setHoverIndex,
}: ChartControlsProps) {
  return (
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
  );
}
