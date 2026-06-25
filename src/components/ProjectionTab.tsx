import { useState } from 'react';
import { Debt, StrategyType } from '../types';
import { Rocket, Info, Download } from 'lucide-react';
import { useProjection } from '../hooks/useProjection';
import { formatMonths } from '../utils';
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

  // Core Math Engine abstracted into a custom hook
  const { monthlyData, kpis } = useProjection({
    income,
    fixedCosts,
    debts,
    debtPct,
    savingsPct,
    personalPct,
    strategy,
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
    const csvRows: string[] = [];

    // Header & metadata
    csvRows.push('REPORTE PLAN MAESTRO DE ACELERACIÓN FINANCIERA');
    csvRows.push(`Fecha de generación: ${new Date().toLocaleDateString('es-ES')} ${new Date().toLocaleTimeString('es-ES')}`);
    csvRows.push('');

    // Profile summary
    csvRows.push('1. RESUMEN DEL PERFIL FINANCIERO');
    csvRows.push(`Moneda seleccionada;${currency}`);
    csvRows.push(`Ingresos Mensuales;${income.toFixed(2)}`);
    csvRows.push(`Costos Fijos Totales;${totalCosts.toFixed(2)}`);
    csvRows.push(`Sobrante Mensual Neto (La Base - El Escáner);${surplus.toFixed(2)}`);
    csvRows.push(`Pago Extra de Deudas;${debtPct}% (${monthlyExtraDebtPayoff.toFixed(2)} /mes)`);
    csvRows.push(`Reserva de Ahorros;${savingsPct}% (${monthlySavingsBuild.toFixed(2)} /mes)`);
    csvRows.push(`Gastos Personales;${personalPct}% (${monthlyPersonalSpend.toFixed(2)} /mes)`);
    csvRows.push(`Estrategia de Deuda;${strategy === 'snowball' ? 'Bola de Nieve (Menor Saldo)' : 'Avalancha (Mayor Interés)'}`);
    csvRows.push('');

    // Performance outcomes
    csvRows.push('2. PROYECCIÓN DE LOGROS E IMPACTO');
    csvRows.push(`Años Ahorrados en Deuda;${kpis.yearsSaved === 0 ? 'Sin Deudas' : `${kpis.yearsSaved} Años`}`);
    csvRows.push(`Intereses Totales Evitados;${kpis.totalInterestSaved.toFixed(2)}`);
    const finalMonth = monthlyData[monthlyData.length - 1];
    if (finalMonth) {
      csvRows.push(`Patrimonio Proyectado a 10 años (Status Quo);${finalMonth.statusQuoValue.toFixed(2)}`);
      csvRows.push(`Patrimonio Proyectado a 10 años (Acelerador);${finalMonth.acceleratorValue.toFixed(2)}`);
      csvRows.push(`Diferencia de Riqueza Generada;${(finalMonth.acceleratorValue - finalMonth.statusQuoValue).toFixed(2)}`);
    }
    csvRows.push('');

    // Debts registered
    csvRows.push('3. INVENTARIO DE DEUDAS');
    csvRows.push('ID;Nombre de la Deuda;Saldo Pendiente;Pago Mínimo');
    if (debts.length === 0) {
      csvRows.push('-;Sin deudas registradas;0.00;0.00');
    } else {
      debts.forEach((debt, idx) => {
        csvRows.push(`${idx + 1};${debt.name || `Deuda ${idx + 1}`};${debt.balance.toFixed(2)};${debt.minPayment.toFixed(2)}`);
      });
    }
    csvRows.push('');

    // Month-by-month trajectory
    csvRows.push('4. TRAYECTORIA MENSUAL PROYECTADA (120 MESES)');
    csvRows.push('Mes;Año;Patrimonio Status Quo;Patrimonio Acelerador;Deuda Status Quo;Deuda Acelerador;Activos Status Quo;Activos Acelerador');
    monthlyData.forEach((row) => {
      csvRows.push([
        row.month,
        row.year,
        row.statusQuoValue.toFixed(2),
        row.acceleratorValue.toFixed(2),
        row.statusQuoDebt.toFixed(2),
        row.acceleratorDebt.toFixed(2),
        row.statusQuoAssets.toFixed(2),
        row.acceleratorAssets.toFixed(2)
      ].join(';'));
    });

    const csvContent = csvRows.join('\n');
    // Prepend UTF-8 Byte Order Mark (BOM) so Excel reads international characters perfectly
    const blob = new Blob(['\uFEFF', csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Reporte_Acelerador_Financiero_${new Date().toISOString().slice(0, 10)}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-12" id="projection-tab-root">
      
      {/* Description & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" id="projection-tab-header-text">
        <div className="flex flex-col gap-1.5">
          <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${
            isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'
          }`}>
            Tu Futuro Arquitectónico
          </h2>
          <p className={`text-sm md:text-base ${
            isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'
          }`}>
            La proyección muestra el impacto acumulativo de tu acelerador en tu patrimonio neto total (activos menos pasivos).
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
          />

          {/* Advice Encouraging Card */}
          <div className={`p-5 rounded-2xl border flex flex-col gap-3 ${
            isDarkMode ? 'bg-black border-[#3d4a42]/20 text-[#dee4de]' : 'bg-[#f5fbf5] border-[#bccac0]/30 text-[#171d19]'
          }`} id="projection-advice-card">
            <div className="flex items-center gap-2">
              <Rocket className={`w-4 h-4 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
              <h4 className="font-bold text-xs font-display">Multiplicación Inteligente</h4>
            </div>
            <p className="text-[10px] leading-relaxed opacity-90">
              Un CDT, CDP o Depósito a Plazo Fijo al 10% de interés anual te permite blindar tu dinero contra la inflación y acelerar de manera exponencial tu patrimonio neto, sin asumir riesgos de mercado.
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
