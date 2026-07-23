import React from 'react';
import { Trash2 } from 'lucide-react';
import { motion } from 'motion/react';
import { FixedCost } from '../types';
import FormattedInput from './FormattedInput';

interface FixedCostRowProps {
  key?: string;
  cost: FixedCost;
  isDarkMode: boolean;
  currency: string;
  currencyCode: string;
  onUpdate: (id: string, field: 'name' | 'value', val: any) => void;
  onRemove: (id: string) => void;
}

export default function FixedCostRow({
  cost,
  isDarkMode,
  currency,
  currencyCode,
  onUpdate,
  onRemove,
}: FixedCostRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col gap-2 relative border-b border-gray-100 dark:border-[#3d4a42]/10 pb-4 last:border-0 last:pb-0"
    >
      <div className="flex items-center justify-between gap-2">
        <input
          type="text"
          placeholder="Nombre del Gasto (e.g. Alquiler)"
          className={`bg-transparent font-sans text-xs md:text-sm font-semibold focus:outline-none placeholder-gray-400 dark:placeholder-gray-500 w-full py-1 ${
            isDarkMode ? 'text-[#dee4de] focus:text-[#68dba9]' : 'text-[#171d19] focus:text-[#006948]'
          }`}
          value={cost.name}
          onChange={(e) => onUpdate(cost.id, 'name', e.target.value)}
        />
        <button
          onClick={() => onRemove(cost.id)}
          className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full transition-colors cursor-pointer"
          aria-label="Eliminar gasto"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="relative">
        <span className={`absolute left-4 top-1/2 -translate-y-1/2 font-sans text-sm ${
          isDarkMode ? 'text-[#bccac0]' : 'text-gray-400'
        }`}>
          {currency}
        </span>
        <FormattedInput
          placeholder="0.00"
          currencyCode={currencyCode}
          className={`w-full pl-10 pr-4 py-2.5 rounded-xl border font-sans text-sm md:text-base focus:outline-none focus:ring-2 transition-all ${
            isDarkMode 
              ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]' 
              : 'bg-[#f5fbf5] border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
          }`}
          value={cost.value}
          onChange={(val) => onUpdate(cost.id, 'value', val)}
        />
      </div>
    </motion.div>
  );
}
