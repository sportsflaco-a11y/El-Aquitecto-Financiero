import { TrendingUp, ShieldCheck } from 'lucide-react';

interface WealthAccumulationCardProps {
  isDarkMode: boolean;
  currency: string;
  savingsBasic: number;
  savingsCDT: number;
  cdtAnnualRatePct?: number;
}

export default function WealthAccumulationCard({
  isDarkMode,
  currency,
  savingsBasic,
  savingsCDT,
  cdtAnnualRatePct = 10,
}: WealthAccumulationCardProps) {
  return (
    <div className={`p-6 rounded-2xl border ambient-shadow flex flex-col gap-4 transition-colors ${
      isDarkMode ? 'bg-black border-[#3d4a42]/30 text-[#dee4de]' : 'bg-[#f5fbf5] border-gray-100 text-[#171d19]'
    }`} id="wealth-accumulation-card">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-[#87948b] flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-500" />
        Riqueza Acumulada a 10 Años
      </h3>

      <div className="flex flex-col gap-3 mt-1">
        <div className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
          isDarkMode ? 'border-[#3d4a42]/10 bg-black' : 'border-gray-100 bg-[#f5fbf5]'
        }`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Ahorro Tradicional</span>
            <span className="text-[9px] text-gray-400">Rendimiento básico 2% anual</span>
          </div>
          <span className="text-sm font-extrabold font-display text-blue-500">
            {currency}{savingsBasic.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>

        <div className={`flex justify-between items-center p-3 rounded-xl border transition-colors ${
          isDarkMode ? 'border-emerald-500/20 bg-black' : 'border-emerald-500/20 bg-[#f5fbf5]'
        }`}>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              CDT Garantizado
            </span>
            <span className="text-[9px] text-gray-400 font-medium">Depósito Plazo Fijo {cdtAnnualRatePct}% anual</span>
          </div>
          <span className="text-base font-black font-display text-emerald-500">
            {currency}{savingsCDT.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </span>
        </div>
      </div>

      <div className="text-[10px] text-gray-400 dark:text-[#87948b] border-t pt-3 border-dashed border-gray-100 dark:border-[#3d4a42]/20 flex flex-col gap-1">
        <span className="leading-normal">
          * Una vez liquidada tu deuda, el 100% de lo que pagabas mensualmente se <strong>redirecciona automáticamente</strong> a multiplicar tus ahorros en tu plan de inversión.
        </span>
      </div>
    </div>
  );
}
