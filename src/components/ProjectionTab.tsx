import { useState } from 'react';
import { Debt, StrategyType } from '../types';
import { Hourglass, DollarSign, Rocket, Info, PieChart as PieIcon } from 'lucide-react';
import { useProjection } from '../hooks/useProjection';
import WealthChart from './WealthChart';
import KPICard from './KPICard';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

interface ProjectionTabProps {
  isDarkMode: boolean;
  currency: string;
  income: number;
  fixedCosts: { value: number }[];
  debts: Debt[];
  acceleratorStrength: number;
  strategy: StrategyType;
  savingsAllocation: number;
}

export default function ProjectionTab({
  isDarkMode,
  currency,
  income,
  fixedCosts,
  debts,
  acceleratorStrength,
  strategy,
  savingsAllocation,
}: ProjectionTabProps) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Core Math Engine abstracted into a custom hook
  const { monthlyData, kpis } = useProjection({
    income,
    fixedCosts,
    debts,
    acceleratorStrength,
    strategy,
    savingsAllocation,
  });

  // Calculate allocation breakdown
  const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  const surplus = Math.max(0, income - totalCosts);
  const committedAccelerator = surplus * (acceleratorStrength / 100);

  const savingsPercent = strategy === 'balanced' ? savingsAllocation : 0;
  const debtPercent = 100 - savingsPercent;

  const monthlySavingsBuild = committedAccelerator * (savingsPercent / 100);
  const monthlyExtraDebtPayoff = committedAccelerator * (debtPercent / 100);

  // Allocation of income
  const fixedCostsValue = Math.min(income, totalCosts);
  const debtRepaymentsValue = Math.min(Math.max(0, income - fixedCostsValue), totalMinPayment + monthlyExtraDebtPayoff);
  const savingsValue = Math.max(0, income - fixedCostsValue - debtRepaymentsValue);

  const allocationData = [
    { 
      name: 'Costos Fijos', 
      value: fixedCostsValue, 
      color: isDarkMode ? '#60a5fa' : '#3b82f6', 
      desc: 'Tus cimientos innegociables para el día a día.' 
    },
    { 
      name: 'Pago de Deudas', 
      value: debtRepaymentsValue, 
      color: isDarkMode ? '#f87171' : '#ef4444', 
      desc: 'Mínimos requeridos más inyección de tu acelerador.' 
    },
    { 
      name: 'Ahorro e Inversión', 
      value: savingsValue, 
      color: isDarkMode ? '#34d399' : '#10b981', 
      desc: 'Capital que construye tu riqueza futura y remanente libre.' 
    },
  ].filter(item => item.value > 0);

  const totalAllocation = allocationData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-12" id="projection-tab-root">
      
      {/* Description */}
      <div className="flex flex-col gap-1.5" id="projection-tab-header-text">
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

      {/* Main Grid: Chart & Advice Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="projection-grid-layout">
        
        {/* Left Column: Stack of Charts */}
        <div className="lg:col-span-8 flex flex-col gap-6" id="projection-left-col">
          
          {/* Wealth Chart Card */}
          <div className={`rounded-2xl p-6 border ambient-shadow flex flex-col gap-6 ${
            isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
          }`} id="chart-card">
            
            <div>
              <h3 className="text-base md:text-lg font-bold font-display">Proyección de Riqueza (10 Años)</h3>
              <div className="flex items-center gap-6 mt-3 flex-wrap">
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-1 border-t-2 border-dashed border-red-500 block" />
                  <span className="text-gray-400 dark:text-[#87948b] font-semibold">Status Quo (Ritmo Actual)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="w-4 h-1 bg-emerald-500 block rounded" />
                  <span className="text-gray-400 dark:text-[#87948b] font-semibold">Acelerador (Plano Maestro)</span>
                </div>
              </div>
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
          <div className={`rounded-2xl p-6 border ambient-shadow flex flex-col gap-6 ${
            isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
          }`} id="income-allocation-card">
            
            <div>
              <h3 className="text-base md:text-lg font-bold font-display flex items-center gap-2">
                <PieIcon className={`w-5 h-5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
                Distribución Mensual de Ingresos
              </h3>
              <p className={`text-xs mt-1 ${isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'}`}>
                Desglose de cómo se asignan tus ingresos mensuales entre tus obligaciones básicas, pago de deudas y acumulación de riqueza.
              </p>
            </div>

            {income > 0 && allocationData.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                
                {/* Pie Chart Container */}
                <div className="md:col-span-5 flex justify-center items-center">
                  <div className="w-full max-w-[200px] h-[200px]" id="recharts-pie-container">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {allocationData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            backgroundColor: isDarkMode ? '#171d19' : '#ffffff',
                            borderColor: isDarkMode ? '#3d4a42' : '#e4eae4',
                            borderRadius: '12px',
                            color: isDarkMode ? '#dee4de' : '#171d19',
                            fontFamily: 'Inter, sans-serif',
                            fontSize: '12px',
                            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                          }}
                          formatter={(value: any) => [
                            `${currency}${Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 })}`, 
                            'Monto'
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Legend Table/Details List */}
                <div className="md:col-span-7 flex flex-col gap-4">
                  <div className="flex flex-col gap-3">
                    {allocationData.map((item, index) => {
                      const pct = totalAllocation > 0 ? (item.value / totalAllocation) * 100 : 0;
                      return (
                        <div 
                          key={index} 
                          className={`p-3 rounded-xl border flex flex-col gap-1 transition-all hover:bg-gray-50/50 dark:hover:bg-white/5 ${
                            isDarkMode ? 'border-[#3d4a42]/20 bg-[#0f1511]/30' : 'border-gray-100 bg-gray-50/30'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex items-center gap-2">
                              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                              <span className="text-xs font-bold font-display">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-semibold text-gray-400">
                                {pct.toFixed(1)}%
                              </span>
                              <span className="text-xs font-black font-display text-right min-w-[60px]">
                                {currency}{item.value.toLocaleString('en-US', { maximumFractionDigits: 0 })}
                              </span>
                            </div>
                          </div>
                          
                          {/* Small visual bar indicator */}
                          <div className="w-full h-1 bg-gray-100 dark:bg-[#1b211d] rounded-full overflow-hidden mt-1">
                            <div 
                              className="h-full rounded-full transition-all duration-500" 
                              style={{ width: `${pct}%`, backgroundColor: item.color }}
                            />
                          </div>

                          <span className="text-[10px] text-gray-400 dark:text-[#87948b] leading-tight">
                            {item.desc}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-10 text-gray-400 dark:text-[#87948b] text-sm">
                Por favor, ingresa tus ingresos y gastos en la pestaña de <strong>Cimientos</strong> para visualizar el gráfico de distribución.
              </div>
            )}

          </div>

        </div>

        {/* Dynamic Outcomes & Stats Side Grid */}
        <div className="lg:col-span-4 flex flex-col gap-4" id="projection-outcomes-col">
          
          {/* KPI Card 1: Años Ahorrados using reusable KPICard component */}
          <KPICard
            label="Años Ahorrados en Deuda"
            value={kpis.yearsSaved === 0 ? 'Sin Deudas' : `${kpis.yearsSaved} Años`}
            isDarkMode={isDarkMode}
            highlight={kpis.yearsSaved > 0 && !isDarkMode}
            icon={<Hourglass className="w-6 h-6 animate-spin-slow" />}
          />

          {/* KPI Card 2: Intereses Evitados using reusable KPICard component */}
          <KPICard
            label="Intereses Evitados"
            value={`${currency}${kpis.totalInterestSaved.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
            isDarkMode={isDarkMode}
            icon={<DollarSign className="w-6 h-6" />}
          />

          {/* Advice Encouraging Card */}
          <div className={`p-6 rounded-2xl border ambient-shadow flex flex-col gap-4 ${
            isDarkMode ? 'bg-[#1b211d]/50 border-[#3d4a42]/40 text-[#dee4de]' : 'bg-[#f5fbf5] border-[#bccac0]/30 text-[#171d19]'
          }`} id="projection-advice-card">
            <div className="flex items-center gap-3">
              <Rocket className={`w-5 h-5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
              <h4 className="font-bold text-sm font-display">¡Tú puedes lograrlo!</h4>
            </div>
            <p className="text-xs leading-relaxed opacity-90">
              Cada paso cuenta. Al modular tus cimientos y regular la vávula del acelerador, pones a trabajar el tiempo a tu favor de manera compuesta. ¡Tu libertad financiera total está a tu alcance!
            </p>
          </div>

        </div>

      </div>

    </div>
  );
}
