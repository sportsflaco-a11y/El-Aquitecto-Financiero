import { useState } from 'react';
import { Debt, StrategyType } from '../types';
import { Rocket, Info, Download } from 'lucide-react';
import { useProjection } from '../hooks/useProjection';
import { formatMonths, downloadCSVReport } from '../utils';
import { useLocalStorageState } from '../hooks/useLocalStorageState';
import WealthChart from './WealthChart';
import AllocationBreakdown from './AllocationBreakdown';
import DebtPayoffCard from './DebtPayoffCard';
import WealthAccumulationCard from './WealthAccumulationCard';

interface ProjectionTabProps {
  isDarkMode: boolean;
  currency: string;
  income: number;
  fixedCosts: { value: number }[];
  debts: Debt[];
  debtPct: number;
  savingsPct: number;
  personalPct: number;
  strategy: StrategyType;
}

export default function ProjectionTab({
  isDarkMode,
  currency,
  income,
  fixedCosts,
  debts,
  debtPct,
  savingsPct,
  personalPct,
  strategy,
}: ProjectionTabProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // User defined CDT / deposit rate (%) with localStorage support
  const [cdtAnnualRatePct, setCdtAnnualRatePct] = useLocalStorageState<number>(
    'el_arquitecto_cdt_rate_v1',
    10
  );

  // Core Math Engine abstracted into a custom hook
  const { monthlyData, kpis } = useProjection({
    income,
    fixedCosts,
    debts,
    debtPct,
    savingsPct,
    personalPct,
    strategy,
    cdtAnnualRate: cdtAnnualRatePct / 100,
  });

  // Calculate allocation breakdown
  const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  
  // Surplus is "La Base" - "El Escáner"
  const surplus = Math.max(0, income - totalCosts - totalMinPayment);

  const monthlySavingsBuild = surplus * (savingsPct / 100);
  const monthlyExtraDebtPayoff = surplus * (debtPct / 100);
  const monthlyPersonalSpend = surplus * (personalPct / 100);

  const handleDownloadReport = () => {
    downloadCSVReport({
      currency,
      income,
      totalCosts,
      surplus,
      debtPct,
      savingsPct,
      personalPct,
      monthlyExtraDebtPayoff,
      monthlySavingsBuild,
      monthlyPersonalSpend,
      strategy,
      kpis,
      monthlyData,
      debts,
    });
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-12" id="projection-tab-root">
      
      {/* Description & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="projection-tab-header-text">
        <div className="flex flex-col gap-1.5">
          <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${
            isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'
          }`}>
            Tu Futuro Financiero
          </h2>
          <p className={`text-sm md:text-base ${
            isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'
          }`}>
            La proyección muestra el impacto acumulado de tu ACELERADOR en tu patrimonio neto (nuevos activos menos antiguos pasivos)
          </p>
        </div>

        <button
          id="btn-download-report"
          onClick={handleDownloadReport}
          className={`flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-sans text-sm font-semibold transition-all shadow-sm shrink-0 active:scale-98 ${
            isDarkMode 
              ? 'bg-[#1e2d24] border border-[#3d4a42] text-[#68dba9] hover:bg-[#25392d]' 
              : 'bg-[#006948] text-white hover:bg-[#005238] hover:shadow-md'
          }`}
        >
          <Download className="w-4 h-4" />
          Descargar Reporte
        </button>
      </div>

      {/* Advice Encouraging Card (Multiplicación Inteligente) */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-6 ${
        isDarkMode ? 'bg-black border-[#3d4a42]/20 text-[#dee4de]' : 'bg-[#f5fbf5] border-[#bccac0]/30 text-[#171d19]'
      }`} id="projection-advice-card">
        <div className="flex-1 flex flex-col gap-3">
          <div className="flex items-center gap-2">
            <Rocket className={`w-4 h-4 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
            <h4 className="font-bold text-sm font-display">Multiplicación Inteligente</h4>
          </div>
          <p className="text-xs md:text-sm leading-relaxed opacity-95">
            Además de blindar tu dinero contra la inflación, es necesario que haya un acelerador que haga crecer exponencialmente tu patrimonio. Hacer depósitos a plazos fijos (CDT, CDAT, CDP) te permite esto sin asumir riesgos de mercado. Busca una tasa de interés anual que supere la inflación mínimo en 4 puntos porcentuales (4%). P. ej.: si la inflación en tu país es del 5,6%, entonces debes obtener en tu depósito como mínimo una tasa del 10% anual.
          </p>
        </div>

        {/* Dynamic Rate input field */}
        <div className="w-full md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-dashed border-gray-200 dark:border-[#3d4a42]/30 pt-4 md:pt-0 md:pl-6 flex flex-col gap-2">
          <label className={`block text-xs font-bold uppercase tracking-wider ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`}>
            Escribe la Tasa de tu Depósito a Plazo en tu país
          </label>
          <div className="relative rounded-xl shadow-sm">
            <input
              type="number"
              min="0"
              max="100"
              step="0.1"
              value={cdtAnnualRatePct}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setCdtAnnualRatePct(isNaN(val) ? 0 : val);
              }}
              className={`w-full font-display font-black text-lg px-4 py-2 rounded-xl transition-all border outline-none focus:ring-2 ${
                isDarkMode 
                  ? 'bg-black border-[#3d4a42]/40 text-[#dee4de] focus:border-[#68dba9] focus:ring-[#68dba9]/20' 
                  : 'bg-white border-gray-200 text-[#171d19] focus:border-[#006948] focus:ring-[#006948]/10'
              }`}
              placeholder="10.0"
            />
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4">
              <span className={`font-black font-display text-lg ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Advice Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="projection-grid-layout">
        
        {/* Left Column: Stack of Charts */}
        <div className="lg:col-span-8 flex flex-col gap-6" id="projection-left-col">
          
          {/* Wealth Chart Card */}
          <div className={`rounded-2xl p-6 border ambient-shadow flex flex-col gap-6 ${
            isDarkMode ? 'bg-black border-[#3d4a42]/30 text-[#dee4de]' : 'bg-[#f5fbf5] border-gray-100 text-[#171d19]'
          }`} id="chart-card">
            
            <div>
              <h3 className="text-base md:text-lg font-bold font-display">Proyección de Riqueza (10 Años)</h3>
            </div>

            {/* SVG Chart Refactored into separate modular component */}
            <WealthChart
              isDarkMode={isDarkMode}
              currency={currency}
              monthlyData={monthlyData}
              hoverIndex={hoverIndex}
              setHoverIndex={setHoverIndex}
              cdtAnnualRatePct={cdtAnnualRatePct}
            />

            <p className="text-2xs text-center text-gray-400 dark:text-[#87948b] italic flex items-center justify-center gap-1">
              <Info className="w-3 h-3" />
              Desplaza el cursor sobre la gráfica para examinar el patrimonio proyectado mes a mes.
            </p>

          </div>

          {/* Income Allocation Pie Chart Card */}
          <AllocationBreakdown
            isDarkMode={isDarkMode}
            currency={currency}
            income={income}
            fixedCosts={fixedCosts}
            debts={debts}
            debtPct={debtPct}
            savingsPct={savingsPct}
            personalPct={personalPct}
          />

        </div>

        {/* Dynamic Outcomes & Stats Side Grid */}
        <div className="lg:col-span-4 flex flex-col gap-4" id="projection-outcomes-col">
          
          {/* Section 1: Debt payoff times (Refactored to separate component) */}
          <DebtPayoffCard
            isDarkMode={isDarkMode}
            sqDebtFreeMonth={kpis.sqDebtFreeMonth}
            acDebtFreeMonth={kpis.acDebtFreeMonth}
            yearsSaved={kpis.yearsSaved}
          />

          {/* Section 2: Savings comparison (Refactored to separate component) */}
          <WealthAccumulationCard
            isDarkMode={isDarkMode}
            currency={currency}
            savingsBasic={monthlyData[119]?.savingsBasic || 0}
            savingsCDT={monthlyData[119]?.savingsCDT || 0}
            cdtAnnualRatePct={cdtAnnualRatePct}
          />

        </div>

      </div>

    </div>
  );
}
