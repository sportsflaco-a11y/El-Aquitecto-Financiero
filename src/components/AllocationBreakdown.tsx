import React from 'react';
import { PieChart as PieIcon, Info } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { Debt } from '../types';

interface AllocationBreakdownProps {
  isDarkMode: boolean;
  currency: string;
  income: number;
  fixedCosts: { value: number }[];
  debts: Debt[];
  debtPct: number;
  savingsPct: number;
  personalPct: number;
}

export default function AllocationBreakdown({
  isDarkMode,
  currency,
  income,
  fixedCosts,
  debts,
  debtPct,
  savingsPct,
  personalPct,
}: AllocationBreakdownProps) {
  
  // Calculate allocation breakdown
  const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
  const totalMinPayment = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  
  // Surplus is "La Base" - "El Escáner"
  const surplus = Math.max(0, income - totalCosts - totalMinPayment);

  const monthlySavingsBuild = surplus * (savingsPct / 100);
  const monthlyExtraDebtPayoff = surplus * (debtPct / 100);
  const monthlyPersonalSpend = surplus * (personalPct / 100);

  // Split income into 5 distinct categories
  let fixedCostsValue = 0;
  let debtPaymentsValue = 0;
  let savingsReserveValue = 0;
  let occasionalDebtValue = 0;
  let personalSpendValue = 0;

  if (income >= totalCosts + totalMinPayment) {
    fixedCostsValue = totalCosts;
    debtPaymentsValue = totalMinPayment;
    savingsReserveValue = monthlySavingsBuild;
    occasionalDebtValue = monthlyExtraDebtPayoff;
    personalSpendValue = monthlyPersonalSpend;
  } else {
    fixedCostsValue = Math.min(income, totalCosts);
    debtPaymentsValue = Math.min(Math.max(0, income - fixedCostsValue), totalMinPayment);
    savingsReserveValue = 0;
    occasionalDebtValue = 0;
    personalSpendValue = 0;
  }

  const allocationData = [
    { 
      name: 'Gastos Fijos', 
      value: fixedCostsValue, 
      color: isDarkMode ? '#60a5fa' : '#3b82f6', 
      desc: 'Tus cimientos innegociables para el día a día.' 
    },
    { 
      name: 'Pago Deudas', 
      value: debtPaymentsValue, 
      color: isDarkMode ? '#f59e0b' : '#d97706', 
      desc: 'Monto destinado a cubrir los pagos mínimos obligatorios de tus deudas.' 
    },
    { 
      name: 'Reserva de Ahorro', 
      value: savingsReserveValue, 
      color: isDarkMode ? '#818cf8' : '#6366f1', 
      desc: 'Capital del excedente destinado a construir tu fondo de tranquilidad y ahorros.' 
    },
    { 
      name: 'Pago Ocasional de Deudas', 
      value: occasionalDebtValue, 
      color: isDarkMode ? '#34d399' : '#10b981', 
      desc: 'Inyección adicional de tu acelerador para liquidar tus deudas más rápido.' 
    },
    { 
      name: 'Gastos Personales', 
      value: personalSpendValue, 
      color: isDarkMode ? '#fb7185' : '#f43f5e', 
      desc: 'Porción libre del excedente para tu estilo de vida y disfrute personal.' 
    },
  ].filter(item => item.value > 0);

  const totalAllocation = allocationData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className={`rounded-2xl p-6 border ambient-shadow flex flex-col gap-6 ${
      isDarkMode ? 'bg-black border-[#3d4a42]/30 text-[#dee4de]' : 'bg-[#f5fbf5] border-gray-100 text-[#171d19]'
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
                      isDarkMode ? 'border-[#3d4a42]/20 bg-black' : 'border-gray-100 bg-[#f5fbf5]'
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
  );
}
