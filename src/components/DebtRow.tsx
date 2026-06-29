import { Debt } from '../types';
import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import FormattedInput from './FormattedInput';

interface DebtRowProps {
  key?: string;
  debt: Debt;
  index: number;
  currency: string;
  isDarkMode: boolean;
  onUpdate: (id: string, field: keyof Debt, value: any) => void;
  onRemove: (id: string) => void;
}

export default function DebtRow({
  debt,
  index,
  currency,
  isDarkMode,
  onUpdate,
  onRemove,
}: DebtRowProps) {
  const isHighInterest = debt.interestRate >= 10;
  const hasAlert = isHighInterest && debt.balance > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={`p-4 rounded-xl border relative flex flex-col gap-4 ${
        hasAlert
          ? isDarkMode ? 'bg-amber-950/5 border-amber-500/20' : 'bg-amber-50/30 border-amber-200'
          : isDarkMode ? 'bg-[#0f1511]/40 border-[#3d4a42]/20' : 'bg-[#f5fbf5]/40 border-gray-100'
      }`}
      id={`debt-row-${index}`}
    >
      {/* Row Header with action */}
      <div className="flex items-center justify-between gap-4">
        <input
          type="text"
          placeholder="Nombre del Pasivo (e.g. Tarjeta Visa)"
          className={`bg-transparent font-sans text-xs md:text-sm font-semibold focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 w-full py-1 ${
            isDarkMode ? 'text-[#dee4de] focus:text-[#68dba9]' : 'text-[#171d19] focus:text-[#006948]'
          }`}
          value={debt.name}
          onChange={(e) => onUpdate(debt.id, 'name', e.target.value)}
        />
        <div className="flex items-center gap-2 shrink-0">
          {hasAlert && (
            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
              isDarkMode ? 'bg-amber-500/20 text-amber-300' : 'bg-amber-100 text-amber-800'
            }`}>
              Tasa Alta
            </span>
          )}
          <button
            onClick={() => onRemove(debt.id)}
            className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors cursor-pointer"
            aria-label="Eliminar pasivo"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wide font-bold text-gray-400 dark:text-[#87948b]">
            Saldo Pendiente
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs ${
              isDarkMode ? 'text-[#bccac0]' : 'text-gray-400'
            }`}>
              {currency}
            </span>
            <FormattedInput
              placeholder="0.00"
              className={`w-full pl-8 pr-3 py-2 rounded-lg border font-sans text-xs md:text-sm focus:outline-none focus:ring-2 transition-all ${
                isDarkMode 
                  ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]' 
                  : 'bg-[#f5fbf5] border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
              }`}
              value={debt.balance}
              onChange={(val) => onUpdate(debt.id, 'balance', val)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wide font-bold text-gray-400 dark:text-[#87948b]">
            Tasa de Interés Anual <span className="normal-case font-medium text-[9px] text-gray-500 dark:text-[#728276]">(tasa mes vencido multiplicado por 12)</span>
          </label>
          <div className="relative">
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 font-sans text-xs ${
              isDarkMode ? 'text-[#bccac0]' : 'text-gray-400'
            }`}>
              %
            </span>
            <input
              type="number"
              placeholder="0.0"
              step="0.1"
              className={`w-full pl-3 pr-8 py-2 rounded-lg border font-sans text-xs md:text-sm focus:outline-none focus:ring-2 transition-all ${
                isDarkMode 
                  ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]' 
                  : 'bg-[#f5fbf5] border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
              }`}
              value={debt.interestRate || ''}
              onChange={(e) => onUpdate(debt.id, 'interestRate', Math.max(0, Number(e.target.value)))}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] uppercase tracking-wide font-bold text-gray-400 dark:text-[#87948b]">
            Pago Mensual Mínimo <span className="normal-case font-medium text-[9px] text-gray-500 dark:text-[#728276]">(incluye capital e intereses)</span>
          </label>
          <div className="relative">
            <span className={`absolute left-3 top-1/2 -translate-y-1/2 font-sans text-xs ${
              isDarkMode ? 'text-[#bccac0]' : 'text-gray-400'
            }`}>
              {currency}
            </span>
            <FormattedInput
              placeholder="0.00"
              className={`w-full pl-8 pr-3 py-2 rounded-lg border font-sans text-xs md:text-sm focus:outline-none focus:ring-2 transition-all ${
                isDarkMode 
                  ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]' 
                  : 'bg-[#f5fbf5] border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
              }`}
              value={debt.minPayment}
              onChange={(val) => onUpdate(debt.id, 'minPayment', val)}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}
