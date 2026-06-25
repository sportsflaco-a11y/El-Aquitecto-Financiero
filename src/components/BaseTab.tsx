import { FixedCost } from '../types';
import { Plus, HelpCircle, Banknote, Home, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import FormattedInput from './FormattedInput';
import FixedCostRow from './FixedCostRow';

interface BaseTabProps {
  isDarkMode: boolean;
  currency: string;
  income: number;
  setIncome: (inc: number) => void;
  fixedCosts: FixedCost[];
  setFixedCosts: (costs: FixedCost[]) => void;
  onNext: () => void;
}

export default function BaseTab({
  isDarkMode,
  currency,
  income,
  setIncome,
  fixedCosts,
  setFixedCosts,
  onNext,
}: BaseTabProps) {

  // Add another non-negotiable cost row
  const addCostRow = () => {
    const newCost: FixedCost = {
      id: crypto.randomUUID(),
      name: '',
      value: 0,
    };
    setFixedCosts([...fixedCosts, newCost]);
  };

  // Delete cost row
  const removeCostRow = (id: string) => {
    setFixedCosts(fixedCosts.filter(cost => cost.id !== id));
  };

  // Update cost name or value
  const updateCostRow = (id: string, field: 'name' | 'value', val: any) => {
    setFixedCosts(
      fixedCosts.map(cost => {
        if (cost.id === id) {
          return { ...cost, [field]: val };
        }
        return cost;
      })
    );
  };

  // Calculations
  const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
  const surplus = Math.max(0, income - totalCosts);
  const exceedsLimit = income > 0 ? (totalCosts > income * 0.8) : (totalCosts > 0);
  const costPercentage = income > 0 ? (totalCosts / income) * 100 : (totalCosts > 0 ? 100 : 0);

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-12" id="base-tab-root">
      {/* Step description */}
      <div className="flex flex-col gap-1.5" id="base-tab-header-text">
        <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${
          isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'
        }`}>
          Establece tus Cimientos
        </h2>
        <p className={`text-sm md:text-base ${
          isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'
        }`}>
          Ingresa tus números mensuales para calcular tu excedente real.
        </p>
      </div>

      {/* Bento Grid Layout for Inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="base-grid-layout">
        
        {/* Monthly Income Card */}
        <div className={`lg:col-span-5 rounded-2xl p-6 border ambient-shadow flex flex-col justify-between gap-6 ${
          isDarkMode 
            ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' 
            : 'bg-white border-[#bccac0]/30 text-[#171d19]'
        }`} id="income-card">
          <div>
            <div className={`flex items-center gap-3 border-b pb-4 mb-6 ${
              isDarkMode ? 'border-[#3d4a42]/20' : 'border-gray-100'
            }`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-[#d5e3fc] text-[#57657a]'
              }`}>
                <Banknote className="w-5 h-5 fill-current" />
              </div>
              <h3 className="text-base md:text-lg font-bold">Ingresos Netos</h3>
            </div>

            <div className="flex flex-col gap-2">
              <label className={`text-xs md:text-sm font-semibold tracking-wide uppercase ${
                isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'
              }`} htmlFor="monthly-income-input">
                Ingreso Mensual Total
              </label>
              <div className="relative">
                <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-medium text-base md:text-lg ${
                  isDarkMode ? 'text-[#bccac0]' : 'text-gray-400'
                }`}>
                  {currency}
                </span>
                <FormattedInput
                  id="monthly-income-input"
                  placeholder="0.00"
                  className={`w-full pl-10 pr-4 py-3 rounded-xl border font-sans text-base md:text-lg focus:outline-none focus:ring-2 transition-all ${
                    isDarkMode 
                      ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]' 
                      : 'bg-[#f5fbf5] border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
                  }`}
                  value={income}
                  onChange={setIncome}
                />
              </div>
              <p className={`text-xs mt-1 flex items-center gap-1 ${
                isDarkMode ? 'text-[#87948b]' : 'text-gray-400'
              }`}>
                <HelpCircle className="w-3.5 h-3.5" />
                Después de impuestos e ingresos secundarios habituales.
              </p>
            </div>
          </div>
        </div>

        {/* Non-negotiable costs Card */}
        <div className={`lg:col-span-7 rounded-2xl p-6 border ambient-shadow flex flex-col gap-6 ${
          isDarkMode 
            ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' 
            : 'bg-white border-[#bccac0]/30 text-[#171d19]'
        }`} id="fixed-costs-card">
          <div className={`flex items-center gap-3 border-b pb-4 ${
            isDarkMode ? 'border-[#3d4a42]/20' : 'border-gray-100'
          }`}>
            <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400 flex items-center justify-center">
              <Home className="w-5 h-5 fill-current" />
            </div>
            <h3 className="text-base md:text-lg font-bold">Gastos Innegociables (Sin Deudas)</h3>
          </div>

          <div className="flex flex-col gap-4 max-h-[28rem] overflow-y-auto pr-1" id="costs-grid-container">
            <AnimatePresence initial={false}>
              {fixedCosts.map((cost) => (
                <FixedCostRow
                  key={cost.id}
                  cost={cost}
                  isDarkMode={isDarkMode}
                  currency={currency}
                  onUpdate={updateCostRow}
                  onRemove={removeCostRow}
                />
              ))}
            </AnimatePresence>

            {fixedCosts.length === 0 && (
              <div className="text-center py-6 text-gray-400 dark:text-[#87948b]">
                No hay costos agregados. Agrega tus gastos obligatorios mensuales.
              </div>
            )}
          </div>

          <button
            onClick={addCostRow}
            className={`self-start mt-2 py-2 px-4 rounded-lg border border-dashed font-display text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
              isDarkMode 
                ? 'border-[#3d4a42] text-[#68dba9] hover:bg-[#3d4a42]/20' 
                : 'border-[#bccac0] text-[#006948] hover:bg-[#dee4de]/30'
            }`}
            id="add-cost-row-btn"
          >
            <Plus className="w-4 h-4" />
            Añadir otro costo innegociable
          </button>
        </div>
      </div>

      {/* Visual warning if costs exceed 80% of income */}
      <AnimatePresence>
        {exceedsLimit && (
          <motion.div
            initial={{ opacity: 0, y: 10, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`w-full max-w-3xl mx-auto p-4 rounded-xl border flex items-start gap-3 overflow-hidden ${
              isDarkMode 
                ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
                : 'bg-amber-50 border-amber-200 text-amber-900'
            }`}
            id="costs-warning-alert"
          >
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="font-bold text-sm font-display">Alerta de Gasto Elevado</h4>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                Tus costos innegociables representan el <span className="font-bold">{costPercentage.toFixed(1)}%</span> de tus ingresos totales. Esto supera el límite saludable recomendado del 80%, reduciendo de forma crítica tu capacidad para acumular ahorros o amortizar deudas con rapidez. Considera optimizar tus gastos fijos.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Banner Box & CTA */}
      <motion.div 
        layout
        className={`w-full max-w-3xl mx-auto mt-6 rounded-2xl p-6 md:p-8 active-shadow flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden text-white ${
          isDarkMode ? 'bg-[#25a475]' : 'bg-[#006948]'
        }`}
        id="surplus-banner"
      >
        {/* Subtle decorative radial gradient glow */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none" />
        
        <div className="flex flex-col gap-1 text-center md:text-left z-10 w-full md:w-auto" id="surplus-text-container">
          <span className="text-xs uppercase tracking-wider font-semibold opacity-90">
            Dinero Sobrante Mensual
          </span>
          <div className="text-2xl md:text-4xl font-display font-bold flex items-baseline justify-center md:justify-start gap-1">
            <span>{currency}</span>
            <span id="surplus-number-display">{surplus.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
          </div>
        </div>

        <button
          onClick={onNext}
          className={`w-full md:w-auto px-6 py-4 rounded-full font-display font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md cursor-pointer ${
            isDarkMode 
              ? 'bg-[#0a0f0c] text-[#68dba9] hover:bg-[#171d19]' 
              : 'bg-white text-[#006948] hover:bg-[#f5fbf5]'
          }`}
          id="analyze-debts-cta"
        >
          Analizar deudas con Escáner
          <ArrowRight className="w-4 h-4" />
        </button>
      </motion.div>
    </div>
  );
}
