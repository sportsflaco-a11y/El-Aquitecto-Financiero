import { useEffect } from 'react';
import { StrategyType, Debt } from '../types';
import { Sliders, Zap, Shield, Scale, ArrowRight } from 'lucide-react';
import ValveSlider from './ValveSlider';
import { formatCurrencyNumber } from '../utils';

interface ValveTabProps {
  isDarkMode: boolean;
  currency: string;
  currencyCode: string;
  income: number;
  fixedCosts: { value: number }[];
  debts: Debt[];
  debtPct: number;
  setDebtPct: (val: number) => void;
  savingsPct: number;
  setSavingsPct: (val: number) => void;
  personalPct: number;
  setPersonalPct: (val: number) => void;
  onNext: () => void;
}

export default function ValveTab({
  isDarkMode,
  currency,
  currencyCode,
  income,
  fixedCosts,
  debts,
  debtPct,
  setDebtPct,
  savingsPct,
  setSavingsPct,
  personalPct,
  setPersonalPct,
  onNext,
}: ValveTabProps) {

  // Calculations
  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
  const totalDebtPayments = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  
  // Real Surplus is La Base minus El Escáner
  const surplus = Math.max(0, income - totalFixedCosts - totalDebtPayments);

  // Force 0% for extra debt payment when minimum debt payment is 0 and redistribute
  useEffect(() => {
    if (totalDebtPayments === 0 && debtPct > 0) {
      setDebtPct(0);
      const remaining = 100;
      const otherSum = savingsPct + personalPct;
      if (otherSum > 0) {
        const newSavings = Math.round((savingsPct / otherSum) * remaining);
        setSavingsPct(newSavings);
        setPersonalPct(remaining - newSavings);
      } else {
        setSavingsPct(50);
        setPersonalPct(50);
      }
    }
  }, [totalDebtPayments, debtPct, savingsPct, personalPct, setDebtPct, setSavingsPct, setPersonalPct]);

  const monthlyExtraDebtPayoff = surplus * (debtPct / 100);
  const monthlySavingsBuild = surplus * (savingsPct / 100);
  const monthlyPersonalSpend = surplus * (personalPct / 100);

  // Dynamic Auto-balancing slider logic to ensure 100% total sum
  const handleSliderChange = (key: 'debt' | 'savings' | 'personal', newValue: number) => {
    const val = Math.max(0, Math.min(100, newValue));
    const otherKeys = (['debt', 'savings', 'personal'] as const).filter(k => k !== key);
    const remaining = 100 - val;

    const currentValues = {
      debt: debtPct,
      savings: savingsPct,
      personal: personalPct,
    };

    const otherSum = currentValues[otherKeys[0]] + currentValues[otherKeys[1]];

    let newVal0 = 0;
    let newVal1 = 0;

    if (otherSum > 0) {
      newVal0 = Math.round((currentValues[otherKeys[0]] / otherSum) * remaining);
      newVal1 = remaining - newVal0;
    } else {
      newVal0 = Math.round(remaining / 2);
      newVal1 = remaining - newVal0;
    }

    // Safety constraint to avoid any floating sum errors
    if (val + newVal0 + newVal1 !== 100) {
      newVal1 = 100 - val - newVal0;
    }

    if (key === 'debt') {
      setDebtPct(val);
      if (otherKeys[0] === 'savings') {
        setSavingsPct(newVal0);
        setPersonalPct(newVal1);
      } else {
        setPersonalPct(newVal0);
        setSavingsPct(newVal1);
      }
    } else if (key === 'savings') {
      setSavingsPct(val);
      if (otherKeys[0] === 'debt') {
        setDebtPct(newVal0);
        setPersonalPct(newVal1);
      } else {
        setPersonalPct(newVal0);
        setDebtPct(newVal1);
      }
    } else if (key === 'personal') {
      setPersonalPct(val);
      if (otherKeys[0] === 'debt') {
        setDebtPct(newVal0);
        setSavingsPct(newVal1);
      } else {
        setSavingsPct(newVal0);
        setDebtPct(newVal1);
      }
    }
  };

  return (
    <div className="flex flex-col gap-8 md:gap-10 pb-12" id="valve-tab-root">
      
      {/* Description */}
      <div className="flex flex-col gap-1.5" id="valve-tab-header-text">
        <h2 className={`text-xl md:text-2xl font-bold tracking-tight ${
          isDarkMode ? 'text-[#dee4de]' : 'text-[#171d19]'
        }`}>
          La Válvula de Aceleración
        </h2>
        <p className={`text-sm md:text-base ${
          isDarkMode ? 'text-[#bccac0]' : 'text-[#3d4a42]'
        }`}>
          Distribuye el excedente de dinero mensual después de cubrir tus gastos innegociables (sin deudas) y el pago mínimo de deudas.
        </p>
      </div>

      {/* Math Reference Banner */}
      <div className={`p-5 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isDarkMode ? 'bg-[#0f1511] border-[#3d4a42]/30' : 'bg-emerald-50/40 border-emerald-100'
      }`} id="valve-reference-banner">
        <div className="flex items-start gap-3">
          <div className={`p-2 rounded-xl mt-0.5 ${
            isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-emerald-100/60 text-[#006948]'
          }`}>
            <Sliders className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-bold text-sm md:text-base font-display">Sobrante Mensual Disponible</h4>
            <p className="text-xs text-gray-400 dark:text-[#87948b] mt-0.5">
              Calculado como: <strong className="text-emerald-500 font-sans">La Base</strong> ({currency}{formatCurrencyNumber(income, currencyCode)}) 
              &minus; <strong className="text-emerald-500 font-sans">Gastos Innegociables (Sin Deudas)</strong> ({currency}{formatCurrencyNumber(totalFixedCosts, currencyCode)})
              &minus; <strong className="text-amber-500 font-sans">Mínimo Deudas</strong> ({currency}{formatCurrencyNumber(totalDebtPayments, currencyCode)})
            </p>
          </div>
        </div>
        <div className="flex flex-col items-start md:items-end">
          <span className="text-xs font-semibold text-gray-400 dark:text-[#87948b]">Excedente Real</span>
          <span className={`text-xl md:text-2xl font-extrabold font-display ${
            isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
          }`}>
            {currency}{formatCurrencyNumber(surplus, currencyCode)}/mes
          </span>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-4xl mx-auto w-full" id="valve-grid-layout">
        
        {/* Controls Card */}
        <div className={`rounded-2xl p-6 border ambient-shadow flex flex-col gap-6 ${
          isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
        }`} id="valve-controls-card">
          
          <div className={`flex items-center justify-between border-b pb-4 ${
            isDarkMode ? 'border-[#3d4a42]/20' : 'border-gray-100'
          }`}>
            <div className="flex items-center gap-3">
              <h3 className="text-base md:text-lg font-bold">Distribución de Flujos</h3>
            </div>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
              isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-emerald-50 text-emerald-800'
            }`}>
              Total Asignado: 100%
            </span>
          </div>

          {/* Option 1: Aceleración de Deudas */}
          <ValveSlider
            id="valve-option-debt"
            isDarkMode={isDarkMode}
            currency={currency}
            currencyCode={currencyCode}
            icon={<Zap className="w-5 h-5 fill-amber-500" />}
            label="Aceleración de Deudas"
            description="Para amortizar el capital de los pasivos"
            subDescription="Amortización adicional de tus pasivos para disminuir los intereses y acortar drásticamente los plazos. Al abonar a capital “matas” la raíz de los intereses."
            percentage={debtPct}
            monthlyAmount={monthlyExtraDebtPayoff}
            color="#f59e0b"
            badgeBgClass="bg-amber-500/10 text-amber-500"
            textClass="text-amber-500"
            btnTextClass="text-amber-400 border border-[#3d4a42]/40"
            onChange={(val) => handleSliderChange('debt', val)}
            disabled={totalDebtPayments === 0}
            disabledMessage="No tienes deudas activas registradas. El porcentaje se fija automáticamente en 0%."
          />

          {/* Option 2: Reserva de Ahorros */}
          <ValveSlider
            id="valve-option-savings"
            isDarkMode={isDarkMode}
            currency={currency}
            currencyCode={currencyCode}
            icon={<Shield className="w-5 h-5" />}
            label="Reserva de Ahorros"
            description="Para construir un fondo seguro de protección"
            subDescription="Capital líquido para blindar tu tranquilidad psicológica y aprovechar oportunidades estratégicas futuras."
            percentage={savingsPct}
            monthlyAmount={monthlySavingsBuild}
            color="#6366f1"
            badgeBgClass="bg-indigo-500/10 text-indigo-500"
            textClass="text-indigo-500"
            btnTextClass="text-indigo-400 border border-[#3d4a42]/40"
            onChange={(val) => handleSliderChange('savings', val)}
          />

          {/* Option 3: Gastos Personales */}
          <ValveSlider
            id="valve-option-personal"
            isDarkMode={isDarkMode}
            currency={currency}
            currencyCode={currencyCode}
            icon={<Scale className="w-5 h-5" />}
            label="Gastos Personales"
            description="Para estilo de vida y bienestar actual"
            subDescription="Presupuesto libre sin culpas destinado a recreación, estilo de vida y consumos variables del día a día."
            percentage={personalPct}
            monthlyAmount={monthlyPersonalSpend}
            color="#0ea5e9"
            badgeBgClass="bg-sky-500/10 text-sky-500"
            textClass="text-sky-500"
            btnTextClass="text-sky-400 border border-[#3d4a42]/40"
            onChange={(val) => handleSliderChange('personal', val)}
          />

        </div>

      </div>

      {/* Next CTA Panel */}
      <div className="flex justify-end mt-4" id="valve-nav-container">
        <button
          onClick={onNext}
          className={`w-full sm:w-auto px-8 py-4 rounded-xl font-display font-bold text-sm md:text-base flex items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 shadow-md hover:shadow-xl cursor-pointer ${
            isDarkMode 
              ? 'bg-[#25a475] text-[#00311f] hover:bg-[#68dba9]' 
              : 'bg-[#006948] text-white hover:bg-[#00855d]'
          }`}
          id="valve-next-btn"
        >
          Proyectar Libertad
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
}

