import { StrategyType } from '../types';
import { Sliders, Zap, Award, Scale, HelpCircle, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface ValveTabProps {
  isDarkMode: boolean;
  currency: string;
  income: number;
  totalCosts: number;
  acceleratorStrength: number;
  setAcceleratorStrength: (strength: number) => void;
  strategy: StrategyType;
  setStrategy: (strat: StrategyType) => void;
  savingsAllocation: number;
  setSavingsAllocation: (alloc: number) => void;
  onNext: () => void;
}

export default function ValveTab({
  isDarkMode,
  currency,
  income,
  totalCosts,
  acceleratorStrength,
  setAcceleratorStrength,
  strategy,
  setStrategy,
  savingsAllocation,
  setSavingsAllocation,
  onNext,
}: ValveTabProps) {

  // Calculations
  const surplus = Math.max(0, income - totalCosts);
  const committedAmount = (surplus * (acceleratorStrength / 100));
  
  // Under Avalanche or Snowball, 100% of the accelerator goes to debt. 
  // Under Balanced, it splits based on savingsAllocation.
  const savingsPercent = strategy === 'balanced' ? savingsAllocation : 0;
  const debtPercent = 100 - savingsPercent;

  const monthlySavingsBuild = (committedAmount * (savingsPercent / 100));
  const monthlyExtraDebtPayoff = (committedAmount * (debtPercent / 100));

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
          Decide qué fracción de tu excedente inyectarás como acelerador y bajo qué estrategia.
        </p>
      </div>

      {/* Main content split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="valve-grid-layout">
        
        {/* Controls Card */}
        <div className={`lg:col-span-7 rounded-2xl p-6 border ambient-shadow flex flex-col gap-8 ${
          isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
        }`} id="valve-controls-card">
          
          <div className={`flex items-center gap-3 border-b pb-4 ${
            isDarkMode ? 'border-[#3d4a42]/20' : 'border-gray-100'
          }`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-[#d5e3fc] text-[#57657a]'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <h3 className="text-base md:text-lg font-bold">Ajustes del Acelerador</h3>
          </div>

          {/* Slider 1: Accelerator Strength */}
          <div className="flex flex-col gap-4" id="strength-slider-container">
            <div className="flex items-center justify-between">
              <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-[#87948b] flex items-center gap-1">
                Fuerza del Acelerador
                <span className={`text-xs font-semibold normal-case font-sans ${
                  isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
                }`}>
                  ({acceleratorStrength}%)
                </span>
              </label>
              <span className={`font-display font-bold text-base md:text-lg ${
                isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
              }`}>
                {currency}{committedAmount.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mes
              </span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-emerald-500 ${
                isDarkMode ? 'bg-[#171d19]' : 'bg-gray-100'
              }`}
              value={acceleratorStrength}
              onChange={(e) => setAcceleratorStrength(Number(e.target.value))}
            />
            <p className="text-xs text-gray-400 dark:text-[#87948b]">
              ¿Qué porcentaje del sobrante mensual (${surplus.toFixed(0)}) comprometerás para construir tu libertad financiera? El resto queda libre para gastos variables.
            </p>
          </div>

          {/* Strategy Selection */}
          <div className="flex flex-col gap-4" id="strategy-selection-container">
            <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-[#87948b]">
              Estrategia de Amortización
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Avalanche Button */}
              <button
                onClick={() => setStrategy('avalanche')}
                className={`p-4 rounded-xl border text-left flex flex-col gap-2.5 cursor-pointer hover:scale-[1.01] transition-all ${
                  strategy === 'avalanche'
                    ? isDarkMode
                      ? 'bg-emerald-950/20 border-[#68dba9] text-white'
                      : 'bg-emerald-50/50 border-[#006948] text-[#006948]'
                    : isDarkMode
                      ? 'bg-[#0f1511]/40 border-[#3d4a42]/30 text-[#dee4de] hover:bg-[#171d19]'
                      : 'bg-[#f5fbf5]/40 border-gray-100 text-[#171d19] hover:bg-gray-50'
                }`}
              >
                <Zap className={`w-5 h-5 ${strategy === 'avalanche' ? 'text-amber-500 fill-amber-500' : 'text-gray-400'}`} />
                <div>
                  <h4 className="font-bold text-xs md:text-sm font-display">Avalancha</h4>
                  <p className="text-[10px] md:text-xs opacity-80 mt-0.5">
                    Prioriza deudas con mayor tasa. Ahorra el máximo interés.
                  </p>
                </div>
              </button>

              {/* Snowball Button */}
              <button
                onClick={() => setStrategy('snowball')}
                className={`p-4 rounded-xl border text-left flex flex-col gap-2.5 cursor-pointer hover:scale-[1.01] transition-all ${
                  strategy === 'snowball'
                    ? isDarkMode
                      ? 'bg-emerald-950/20 border-[#68dba9] text-white'
                      : 'bg-emerald-50/50 border-[#006948] text-[#006948]'
                    : isDarkMode
                      ? 'bg-[#0f1511]/40 border-[#3d4a42]/30 text-[#dee4de] hover:bg-[#171d19]'
                      : 'bg-[#f5fbf5]/40 border-gray-100 text-[#171d19] hover:bg-gray-50'
                }`}
              >
                <Award className={`w-5 h-5 ${strategy === 'snowball' ? 'text-emerald-500 fill-emerald-500' : 'text-gray-400'}`} />
                <div>
                  <h4 className="font-bold text-xs md:text-sm font-display">Bola de Nieve</h4>
                  <p className="text-[10px] md:text-xs opacity-80 mt-0.5">
                    Prioriza deudas con menor saldo. Genera victorias psicológicas rápidas.
                  </p>
                </div>
              </button>

              {/* Balanced Button */}
              <button
                onClick={() => setStrategy('balanced')}
                className={`p-4 rounded-xl border text-left flex flex-col gap-2.5 cursor-pointer hover:scale-[1.01] transition-all ${
                  strategy === 'balanced'
                    ? isDarkMode
                      ? 'bg-emerald-950/20 border-[#68dba9] text-white'
                      : 'bg-emerald-50/50 border-[#006948] text-[#006948]'
                    : isDarkMode
                      ? 'bg-[#0f1511]/40 border-[#3d4a42]/30 text-[#dee4de] hover:bg-[#171d19]'
                      : 'bg-[#f5fbf5]/40 border-gray-100 text-[#171d19] hover:bg-gray-50'
                }`}
              >
                <Scale className={`w-5 h-5 ${strategy === 'balanced' ? 'text-indigo-500' : 'text-gray-400'}`} />
                <div>
                  <h4 className="font-bold text-xs md:text-sm font-display">Balanceado</h4>
                  <p className="text-[10px] md:text-xs opacity-80 mt-0.5">
                    Divide el acelerador entre saldar deudas y crear reserva de efectivo.
                  </p>
                </div>
              </button>

            </div>
          </div>

          {/* Conditional Slider 2: Emergency Savings Split */}
          {strategy === 'balanced' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="flex flex-col gap-4 border-t pt-6 border-dashed border-gray-100 dark:border-[#3d4a42]/20"
              id="savings-slider-container"
            >
              <div className="flex items-center justify-between">
                <label className="text-xs md:text-sm font-bold uppercase tracking-wider text-gray-400 dark:text-[#87948b] flex items-center gap-1">
                  Fondo de Emergencia
                  <span className="text-xs font-semibold normal-case text-indigo-500 dark:text-indigo-400">
                    ({savingsAllocation}%)
                  </span>
                </label>
                <span className="font-display font-bold text-sm md:text-base text-indigo-500 dark:text-indigo-400">
                  {currency}{monthlySavingsBuild.toLocaleString('en-US', { maximumFractionDigits: 0 })}/mes
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                step="5"
                className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-gray-100 dark:bg-[#171d19] accent-indigo-500"
                value={savingsAllocation}
                onChange={(e) => setSavingsAllocation(Number(e.target.value))}
              />
              <p className="text-xs text-gray-400 dark:text-[#87948b]">
                Asigna una parte a tu cuenta de ahorros segura (reserva de efectivo). El resto ({debtPercent}%) se usará para pagar deudas de forma acelerada usando el método de Avalancha.
              </p>
            </motion.div>
          )}

        </div>

        {/* Live Impact Allocation Card */}
        <div className={`lg:col-span-5 rounded-2xl p-6 border ambient-shadow flex flex-col justify-between gap-6 ${
          isDarkMode ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' : 'bg-white border-gray-100 text-[#171d19]'
        }`} id="valve-impact-card">
          
          <div>
            <div className={`flex items-center gap-3 border-b pb-4 mb-6 ${
              isDarkMode ? 'border-[#3d4a42]/20' : 'border-gray-100'
            }`}>
              <Zap className={`w-5 h-5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
              <h3 className="text-base md:text-lg font-bold font-display">Destino del Flujo</h3>
            </div>

            <div className="flex flex-col gap-5" id="flow-splits-container">
              
              {/* Split item 1: Surplus */}
              <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-[#3d4a42]/10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 dark:text-[#87948b]">Excedente Disponible</span>
                  <span className="text-2xs text-gray-400 dark:text-gray-500">Mano de obra sobrante total</span>
                </div>
                <span className="text-lg font-bold font-display">
                  {currency}{surplus.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Split item 2: Comitted Accelerator */}
              <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-[#3d4a42]/10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 dark:text-[#87948b]">Acelerador Comprometido</span>
                  <span className="text-2xs text-gray-400 dark:text-gray-500">Impulso activo mensual</span>
                </div>
                <span className={`text-lg font-bold font-display ${
                  isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
                }`}>
                  {currency}{committedAmount.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Split item 3: Debt Payoff */}
              <div className="flex items-center justify-between border-b pb-4 border-gray-100 dark:border-[#3d4a42]/10">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 dark:text-[#87948b]">Pago Extra de Deudas</span>
                  <span className="text-2xs text-gray-400 dark:text-gray-500">Método {strategy === 'snowball' ? 'Bola de Nieve' : 'Avalancha'} ({debtPercent}%)</span>
                </div>
                <span className="text-lg font-bold font-display text-emerald-500">
                  {currency}{monthlyExtraDebtPayoff.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>

              {/* Split item 4: Savings build */}
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-gray-400 dark:text-[#87948b]">Reserva de Ahorros</span>
                  <span className="text-2xs text-gray-400 dark:text-gray-500">Para imprevistos/fondo ({savingsPercent}%)</span>
                </div>
                <span className="text-lg font-bold font-display text-indigo-500">
                  {currency}{monthlySavingsBuild.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </span>
              </div>

            </div>
          </div>

          <div className={`p-4 rounded-xl text-xs text-center border ${
            isDarkMode ? 'bg-[#171d19] border-[#3d4a42]/40 text-[#dee4de]/80' : 'bg-[#f5fbf5] border-[#bccac0]/40 text-[#3d4a42]'
          }`}>
            Al configurar la válvula, permites proyectar tu trayectoria acelerada y compararla contra tu ritmo de pago actual.
          </div>

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
