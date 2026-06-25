import { useMemo } from 'react';
import { Debt } from '../types';
import { Plus, AlertTriangle, Landmark, ShieldAlert, ArrowRight, Percent, Coins, TrendingDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KPICard from './KPICard';
import DebtRow from './DebtRow';

interface ScannerTabProps {
  isDarkMode: boolean;
  currency: string;
  debts: Debt[];
  setDebts: (debts: Debt[]) => void;
  onNext: () => void;
}

export default function ScannerTab({
  isDarkMode,
  currency,
  debts,
  setDebts,
  onNext,
}: ScannerTabProps) {

  // Add a new debt row
  const addDebt = () => {
    const newDebt: Debt = {
      id: crypto.randomUUID(),
      name: '',
      balance: 0,
      interestRate: 0,
      minPayment: 0,
    };
    setDebts([...debts, newDebt]);
  };

  // Remove debt row
  const removeDebt = (id: string) => {
    setDebts(debts.filter(d => d.id !== id));
  };

  // Update debt row values
  const updateDebt = (id: string, field: keyof Debt, val: any) => {
    setDebts(
      debts.map(d => {
        if (d.id === id) {
          return { ...d, [field]: val };
        }
        return d;
      })
    );
  };

  // Calculate metrics using useMemo for efficiency and clean isolation
  const metrics = useMemo(() => {
    const totalDebt = debts.reduce((sum, d) => sum + (Number(d.balance) || 0), 0);
    const totalMinPayment = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
    
    // Weighted average interest rate
    const totalDebtForAvg = debts.reduce((sum, d) => sum + (d.balance > 0 ? Number(d.balance) : 0), 0);
    const weightedInterestSum = debts.reduce((sum, d) => sum + (Number(d.balance) * Number(d.interestRate) || 0), 0);
    const avgInterestRate = totalDebtForAvg > 0 ? (weightedInterestSum / totalDebtForAvg) : 0;

    // Monthly Interest Leak (Balance * Rate / 100 / 12)
    const monthlyInterestLeak = debts.reduce((sum, d) => sum + ((Number(d.balance) * (Number(d.interestRate) / 100)) / 12 || 0), 0);

    // High Interest Threshold is 10%
    const isHighInterest = (rate: number) => rate >= 10;
    const highInterestDebtsCount = debts.filter(d => isHighInterest(d.interestRate) && d.balance > 0).length;

    return {
      totalDebt,
      avgInterestRate,
      totalMinPayment,
      monthlyInterestLeak,
      highInterestDebtsCount,
    };
  }, [debts]);

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-12" id="scanner-tab-root">
      
      {/* Description */}
      <div className="flex flex-col gap-1.5" id="scanner-tab-header-text">
        <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${
          isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'
        }`}>
          El Escáner de Deudas
        </h2>
        <p className={`text-sm md:text-base ${
          isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'
        }`}>
          Identifica las fugas de interés que están saboteando tus bases financieras.
        </p>
      </div>

      {/* Debts Table/Form Card - Now placed first */}
      <div className={`rounded-2xl p-6 border ambient-shadow ${
        isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30' : 'bg-white border-gray-100'
      }`} id="debts-list-card">
        <div className={`flex items-center gap-3 border-b pb-4 mb-6 ${
          isDarkMode ? 'border-[#3d4a42]/20' : 'border-gray-100'
        }`}>
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
            isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-[#d5e3fc] text-[#57657a]'
          }`}>
            <Landmark className="w-5 h-5 fill-current" />
          </div>
          <h3 className="text-base md:text-lg font-bold">Listado de Pasivos</h3>
        </div>

        {/* Inputs list - Refactored to utilize DebtRow */}
        <div className="flex flex-col gap-6" id="debts-form-list">
          <AnimatePresence initial={false}>
            {debts.map((debt, index) => (
              <DebtRow
                key={debt.id}
                debt={debt}
                index={index}
                currency={currency}
                isDarkMode={isDarkMode}
                onUpdate={updateDebt}
                onRemove={removeDebt}
              />
            ))}
          </AnimatePresence>

          {debts.length === 0 && (
            <div className="text-center py-8 text-gray-400 dark:text-[#87948b]">
              Excelente, no registras deudas activas. Agrégalas si quieres proyectar un acelerador.
            </div>
          )}
        </div>

        <button
          onClick={addDebt}
          className={`mt-4 py-2.5 px-4 rounded-lg border border-dashed font-display text-xs md:text-sm font-semibold flex items-center gap-2 transition-all cursor-pointer ${
            isDarkMode 
              ? 'border-[#3d4a42] text-[#68dba9] hover:bg-[#3d4a42]/20' 
              : 'border-[#bccac0] text-[#006948] hover:bg-[#dee4de]/30'
          }`}
          id="add-debt-btn"
        >
          <Plus className="w-4 h-4" />
          Añadir otra deuda o pasivo
        </button>
      </div>

      {/* Metrics Banner - Placed after Listado de Pasivos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="scanner-metrics-grid">
        <KPICard
          label="Deuda Total"
          value={`${currency}${metrics.totalDebt.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          isDarkMode={isDarkMode}
          icon={<Coins className="w-5 h-5" />}
        />

        <KPICard
          label="Tasa de Interés Media"
          value={`${metrics.avgInterestRate.toFixed(1)}%`}
          isDarkMode={isDarkMode}
          icon={<Percent className="w-5 h-5" />}
        />

        <KPICard
          label="Pago Mínimo Mensual"
          value={`${currency}${metrics.totalMinPayment.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
          isDarkMode={isDarkMode}
          icon={<TrendingDown className="w-5 h-5" />}
        />

        <KPICard
          label="Fuga de Interés Mensual"
          value={`${currency}${metrics.monthlyInterestLeak.toLocaleString('en-US', { maximumFractionDigits: 2 })}`}
          isDarkMode={isDarkMode}
          highlight={metrics.highInterestDebtsCount > 0}
          icon={metrics.highInterestDebtsCount > 0 ? <AlertTriangle className="w-5 h-5 text-amber-500 animate-pulse" /> : <Coins className="w-5 h-5" />}
        />
      </div>

      {/* Structural Risk Alert */}
      {metrics.highInterestDebtsCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            isDarkMode 
              ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
              : 'bg-amber-50 border-amber-100 text-amber-900'
          }`}
          id="scanner-alert-box"
        >
          <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-bold text-sm font-display">Riesgo Estructural Detectado</h4>
            <p className="text-xs mt-0.5 opacity-90">
              Tienes {metrics.highInterestDebtsCount} {metrics.highInterestDebtsCount === 1 ? 'deuda' : 'deudas'} con tasas superiores al 10%. Estas deudas actúan como fugas de dinero críticas que erosionan tu patrimonio mensual. Es imperativo priorizarlas.
            </p>
          </div>
        </motion.div>
      )}

      {/* Next CTA Panel */}
      <div className="flex justify-end mt-4" id="scanner-nav-container">
        <button
          onClick={onNext}
          className={`w-full sm:w-auto px-8 py-4 rounded-xl font-display font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-xl cursor-pointer ${
            isDarkMode 
              ? 'bg-[#25a475] text-[#00311f] hover:bg-[#68dba9]' 
              : 'bg-[#006948] text-white hover:bg-[#00855d]'
          }`}
          id="scanner-next-btn"
        >
          Configurar Válvula de Aceleración
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
