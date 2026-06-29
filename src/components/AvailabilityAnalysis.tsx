import { motion } from 'motion/react';
import { ShieldAlert } from 'lucide-react';

interface AvailabilityAnalysisProps {
  isDarkMode: boolean;
  income: number;
  lossOfAvailability: number;
}

export default function AvailabilityAnalysis({
  isDarkMode,
  income,
  lossOfAvailability,
}: AvailabilityAnalysisProps) {
  return (
    <>
      {/* Loss of Availability Analysis */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`p-5 rounded-2xl border flex flex-col md:flex-row gap-4 items-start ${
          isDarkMode 
            ? 'bg-[#0a0f0c] border-[#3d4a42]/30 text-[#dee4de]' 
            : 'bg-white border-gray-100 text-[#171d19]'
        }`}
        id="availability-analysis-box"
      >
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
          isDarkMode ? 'bg-[#1b211d] text-[#68dba9]' : 'bg-[#e8f5e9] text-[#006948]'
        }`}>
          <ShieldAlert className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-sm md:text-base font-display">Indicador Pérdida de Disponibilidad</h4>
          <p className={`text-xs md:text-sm mt-1 leading-relaxed ${
            isDarkMode ? 'text-[#bccac0]' : 'text-gray-600'
          }`}>
            Sirve para medir el porcentaje de ingreso que se está destinando a pagar deudas que no son innegociables, deudas que se podrían evitar. Este es un porcentaje del dinero que se está dejando de ahorrar o de invertir y que se está entregando a los acreedores. <strong>Entre más cercano esté a cero, mucho mejor.</strong>
          </p>
          
          {income === 0 ? (
            <div className={`mt-3 text-xs p-3 rounded-lg border ${
              isDarkMode ? 'bg-[#121815] border-[#3d4a42]/20 text-yellow-400' : 'bg-yellow-50 border-yellow-100 text-yellow-800'
            }`}>
              Debes configurar tus ingresos mensuales en la pestaña <strong>La Base</strong> para calcular tu diagnóstico personalizado de disponibilidad.
            </div>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              <span className="text-xs font-bold font-display uppercase tracking-wider text-gray-400 dark:text-[#87948b]">
                Diagnóstico de tu disponibilidad:
              </span>
              <div className={`p-3 rounded-xl border flex flex-col gap-1 ${
                lossOfAvailability === 0
                  ? isDarkMode ? 'bg-emerald-950/20 border-emerald-500/20 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-900'
                  : lossOfAvailability <= 15
                    ? isDarkMode ? 'bg-blue-950/20 border-blue-500/20 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-900'
                    : lossOfAvailability <= 40
                      ? isDarkMode ? 'bg-amber-950/20 border-amber-500/20 text-amber-300' : 'bg-amber-50 border-amber-100 text-amber-900'
                      : isDarkMode ? 'bg-rose-950/20 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-900'
              }`}>
                <div className="font-bold text-xs md:text-sm flex items-center gap-2">
                  <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                    lossOfAvailability === 0
                      ? 'bg-emerald-500'
                      : lossOfAvailability <= 15
                        ? 'bg-blue-500'
                        : lossOfAvailability <= 40
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                  }`} />
                  {lossOfAvailability === 0 && 'Nivel Óptimo: 0% de pérdida'}
                  {lossOfAvailability > 0 && lossOfAvailability <= 15 && `Nivel Saludable / Moderado: ${lossOfAvailability.toFixed(1)}% de pérdida`}
                  {lossOfAvailability > 15 && lossOfAvailability <= 40 && `Nivel de Advertencia: ${lossOfAvailability.toFixed(1)}% de pérdida`}
                  {lossOfAvailability > 40 && `Alerta Crítica: ${lossOfAvailability.toFixed(1)}% de pérdida`}
                </div>
                <p className="text-2xs md:text-xs leading-relaxed opacity-90">
                  {lossOfAvailability === 0 && 'Excelente, no registras deudas activas. Tienes plena libertad y control sobre tus flujos de ingresos mensuales para ser asignados de forma estratégica.'}
                  {lossOfAvailability > 0 && lossOfAvailability <= 15 && 'Estás en un rango controlable. Sin embargo, intenta amortizar estas deudas rápidamente para liberar ese porcentaje de ingresos y destinarlo a tu propio crecimiento financiero.'}
                  {lossOfAvailability > 15 && lossOfAvailability <= 40 && 'Atención: Estás entregando una porción considerable de tu capacidad mensual. Esta pérdida de disponibilidad restringe significativamente tu velocidad para construir patrimonio.'}
                  {lossOfAvailability > 40 && 'Alerta Crítica: Estás entregando más del 40% de tus ingresos totales directamente a los acreedores. Estás en un estado de estrangulamiento financiero severo; priorizar el desmonte de estos pasivos es imperativo para tu supervivencia económica.'}
                </p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Structural Risk Alert */}
      {lossOfAvailability >= 2 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            lossOfAvailability > 5
              ? isDarkMode 
                ? 'bg-rose-950/15 border-rose-500/30 text-rose-300' 
                : 'bg-rose-50 border-rose-100 text-rose-950'
              : isDarkMode 
                ? 'bg-amber-950/10 border-amber-500/20 text-amber-300' 
                : 'bg-amber-50 border-amber-100 text-amber-900'
          }`}
          id="scanner-alert-box"
        >
          <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${lossOfAvailability > 5 ? 'text-rose-500' : 'text-amber-500'}`} />
          <div>
            <h4 className="font-bold text-sm font-display">
              {lossOfAvailability > 5 ? 'Riesgo Estructural Detectado' : 'Está Asumiendo Riesgos Altos'}
            </h4>
            <p className="text-xs mt-1 leading-relaxed opacity-95">
              {lossOfAvailability > 5 ? (
                'Tienes más de un 5% de pérdida de disponibilidad, es decir, más del 5% de tus ingresos están comprometidos con el pago de intereses y de deuda no indispensable. Este dinero mensual que se entrega a acreedores, es un dinero que estás dejando de ahorrar o de invertir.'
              ) : (
                'Tienes entre un 2% y 5% de pérdida de disponibilidad, es decir, entre el 2% y el 5% de tus ingresos están comprometidos con el pago de intereses y de deuda no indispensable. Este dinero mensual que se entrega a acreedores, es un dinero que estás dejando de ahorrar o de invertir.'
              )}
            </p>
          </div>
        </motion.div>
      )}
    </>
  );
}
