import { Hourglass, Rocket } from 'lucide-react';
import { formatMonths } from '../utils';

interface DebtPayoffCardProps {
  isDarkMode: boolean;
  sqDebtFreeMonth: number;
  acDebtFreeMonth: number;
  yearsSaved: number;
}

export default function DebtPayoffCard({
  isDarkMode,
  sqDebtFreeMonth,
  acDebtFreeMonth,
  yearsSaved,
}: DebtPayoffCardProps) {
  return (
    <div className={`p-6 rounded-2xl border ambient-shadow flex flex-col gap-4 transition-colors ${
      isDarkMode ? 'bg-black border-[#3d4a42]/30 text-[#dee4de]' : 'bg-[#f5fbf5] border-gray-100 text-[#171d19]'
    }`} id="debt-payoff-card">
      <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-400 dark:text-[#87948b] flex items-center gap-2">
        <Hourglass className="w-4 h-4 text-amber-500" />
        Tiempo para Salir de Deudas
      </h3>
      
      <div className="flex flex-col gap-3 mt-1">
        <div className={`flex flex-col p-3 rounded-xl border transition-colors ${
          isDarkMode ? 'border-red-950/20 bg-black' : 'border-red-100/50 bg-[#f5fbf5]'
        }`}>
          <span className="text-[10px] font-bold uppercase text-red-500/80 tracking-wider">Solo Cuotas Fijas (Mínimos)</span>
          <span className="text-base font-black font-display tracking-tight text-red-500/90 mt-0.5">
            {sqDebtFreeMonth === -1 ? 'Más de 10 años (120+ meses)' : formatMonths(sqDebtFreeMonth)}
          </span>
          <span className="text-[10px] text-gray-400 mt-1 leading-normal">
            Pagando únicamente el mínimo mensual de cada deuda de El Escáner.
          </span>
        </div>

        <div className={`flex flex-col p-3 rounded-xl border transition-colors ${
          isDarkMode ? 'border-emerald-950/20 bg-black' : 'border-emerald-100/50 bg-[#f5fbf5]'
        }`}>
          <span className="text-[10px] font-bold uppercase text-emerald-500 tracking-wider">Plan de Aceleración</span>
          <span className="text-base font-black font-display tracking-tight text-emerald-500 mt-0.5 font-display flex items-center gap-1.5 flex-wrap">
            {acDebtFreeMonth === -1 ? 'Más de 10 años' : formatMonths(acDebtFreeMonth)}
            <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-[#68dba9] font-sans font-extrabold uppercase shrink-0">
              Tu Acelerador
            </span>
          </span>
          <span className="text-[10px] text-gray-400 mt-1 leading-normal">
            Inyectando el pago adicional de la Válvula más el efecto bola de nieve/avalancha.
          </span>
        </div>
      </div>

      {yearsSaved > 0 && (
        <div className={`p-3 border rounded-xl text-center text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
          isDarkMode ? 'bg-black border-emerald-500/20 text-[#68dba9]' : 'bg-[#f5fbf5] border-emerald-500/20 text-emerald-600'
        }`}>
          <Rocket className="w-4 h-4 shrink-0" />
          ¡Te liberas de deudas {yearsSaved === 1 ? '1 año' : `${yearsSaved} años`} antes!
        </div>
      )}
    </div>
  );
}
