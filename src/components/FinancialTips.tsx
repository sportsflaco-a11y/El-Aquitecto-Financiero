import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2, AlertCircle, RefreshCw, BookOpen, Lightbulb } from 'lucide-react';
import { Debt, FixedCost, StrategyType } from '../types';

interface FinancialTipsProps {
  isDarkMode: boolean;
  currency: string;
  activeTab: 'base' | 'escaner' | 'valvula' | 'proyeccion';
  income: number;
  fixedCosts: FixedCost[];
  debts: Debt[];
  debtPct: number;
  savingsPct: number;
  personalPct: number;
  strategy: StrategyType;
}

export default function FinancialTips({
  isDarkMode,
  currency,
  activeTab,
  income,
  fixedCosts,
  debts,
  debtPct,
  savingsPct,
  personalPct,
  strategy,
}: FinancialTipsProps) {
  const [tipText, setTipText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showTechnical, setShowTechnical] = useState<boolean>(false);

  // Load cached tip for the active tab from localStorage if available
  useEffect(() => {
    const cachedTip = localStorage.getItem(`arquitecto_tip_${activeTab}`);
    if (cachedTip) {
      setTipText(cachedTip);
    } else {
      setTipText('');
    }
    setError(null);
    setShowTechnical(false);
  }, [activeTab]);

  const totalFixedCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);
  const totalDebtPayments = debts.reduce((sum, d) => sum + (Number(d.minPayment) || 0), 0);
  const surplus = Math.max(0, income - totalFixedCosts - totalDebtPayments);

  const getFinanceDataPayload = () => {
    return {
      income,
      fixedCosts: totalFixedCosts,
      totalMinPayment: totalDebtPayments,
      surplus,
      strategy,
      debtPct,
      savingsPct,
      personalPct,
      monthlyExtraDebtPayoff: surplus * (debtPct / 100),
      monthlySavingsBuild: surplus * (savingsPct / 100),
      monthlyPersonalSpend: surplus * (personalPct / 100),
      debts: debts.map(d => ({
        name: d.name,
        balance: d.balance,
        interestRate: d.interestRate,
        minPayment: d.minPayment,
      })),
    };
  };

  const getFriendlyErrorMessage = (rawError: string) => {
    const lower = rawError.toLowerCase();
    if (lower.includes('api key') || lower.includes('secrets') || lower.includes('configur')) {
      return 'La clave de API de Gemini no está configurada en los secretos de la aplicación. Por favor, asegúrate de configurar la variable GEMINI_API_KEY.';
    }
    if (lower.includes('503') || lower.includes('demand') || lower.includes('busy') || lower.includes('unavailable') || lower.includes('congestion') || lower.includes('temporal')) {
      return 'El servicio de Inteligencia de Gemini está experimentando una demanda excepcionalmente alta en este momento. Tu progreso está a salvo, por favor dale unos segundos e intenta nuevamente presionando el botón de abajo.';
    }
    if (lower.includes('rate limit') || lower.includes('quota') || lower.includes('429')) {
      return 'Se ha superado temporalmente el límite de consultas permitidas por minuto. Por favor, espera unos instantes antes de volver a consultar.';
    }
    return 'Hemos tenido dificultades para conectar con el asesor financiero inteligente. Verifica tu conexión a internet o vuelve a intentarlo en unos instantes.';
  };

  const fetchTip = async () => {
    setIsLoading(true);
    setError(null);
    setShowTechnical(false);

    try {
      const response = await fetch('/api/gemini/tips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          financeData: getFinanceDataPayload(),
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Error del servidor: ${response.status}`);
      }

      const data = await response.json();
      if (data.text) {
        setTipText(data.text);
        localStorage.setItem(`arquitecto_tip_${activeTab}`, data.text);
      } else {
        throw new Error('No se recibió texto de recomendación.');
      }
    } catch (err: any) {
      console.error('Error fetching tips:', err);
      setError(err.message || 'Ocurrió un error al conectar con el asesor financiero.');
    } finally {
      setIsLoading(false);
    }
  };

  // Human-readable titles for each active tab
  const tabTitles = {
    base: 'Tus Cimientos (Ingresos y Gastos Fijos)',
    escaner: 'Tus Pasivos (Análisis de Deudas)',
    valvula: 'Distribución de Flujos (Tu Excedente)',
    proyeccion: 'Tu Proyección de Libertad Financiera',
  };

  return (
    <div 
      className={`rounded-2xl p-6 border transition-all duration-300 ambient-shadow ${
        isDarkMode 
          ? 'bg-black border-[#3d4a42]/30 text-[#dee4de]' 
          : 'bg-[#f5fbf5] border-[#bccac0]/30 text-[#171d19]'
      }`}
      id={`financial-tips-container-${activeTab}`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl ${
            isDarkMode ? 'bg-[#25a475]/10 text-[#68dba9]' : 'bg-[#006948]/10 text-[#006948]'
          }`}>
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-extrabold tracking-wide uppercase text-gray-400 dark:text-[#87948b] flex items-center gap-1.5">
              Recomendación de Asesor IA
            </h4>
            <h3 className="text-base font-black font-display tracking-tight mt-0.5">
              Tips Financieros para {tabTitles[activeTab]}
            </h3>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchTip}
          disabled={isLoading}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 disabled:opacity-50 ${
            isLoading 
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-zinc-800 dark:text-zinc-400' 
              : isDarkMode
                ? 'bg-[#25a475] hover:bg-[#25a475]/90 text-black shadow-[0_4px_12px_rgba(37,164,117,0.2)]'
                : 'bg-[#006948] hover:bg-[#006948]/95 text-white shadow-[0_4px_12px_rgba(0,105,72,0.15)]'
          }`}
          id="btn-fetch-tips"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Pensando...
            </>
          ) : tipText ? (
            <>
              <RefreshCw className="w-3.5 h-3.5" />
              Actualizar Consejo
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Analizar con Gemini
            </>
          )}
        </button>
      </div>

      <div className="relative min-h-[4rem] flex flex-col justify-center">
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-4 text-center">
            <Loader2 className={`w-8 h-8 animate-spin ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
            <p className="text-xs font-semibold text-gray-400 dark:text-[#87948b] animate-pulse">
              Evaluando tu presupuesto y calculando alternativas óptimas...
            </p>
          </div>
        )}

        {!isLoading && error && (
          <div className={`p-5 rounded-xl border flex flex-col sm:flex-row items-start gap-4 transition-all duration-300 ${
            isDarkMode 
              ? 'bg-[#180f10] border-red-900/40 text-[#ffb4ab]' 
              : 'bg-[#fff0f0] border-red-100 text-red-900'
          }`} id="financial-tips-error-card">
            <div className={`p-3 rounded-full shrink-0 ${
              isDarkMode ? 'bg-red-500/10 text-red-400' : 'bg-red-50 text-red-600'
            }`}>
              <AlertCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 flex flex-col gap-2">
              <span className="text-sm font-black font-display tracking-tight block text-red-500">
                ¡Ups! No pudimos conectar con el Asesor IA
              </span>
              <p className={`text-xs leading-relaxed ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                {getFriendlyErrorMessage(error)}
              </p>
              
              {/* Technical details toggle */}
              <div className="mt-1">
                <button
                  type="button"
                  onClick={() => setShowTechnical(!showTechnical)}
                  className={`text-[10px] font-bold uppercase tracking-wider hover:underline flex items-center gap-1 ${
                    isDarkMode ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {showTechnical ? 'Ocultar detalles técnicos ▲' : 'Ver detalles técnicos ▼'}
                </button>
                {showTechnical && (
                  <pre className={`mt-2 p-2 rounded-lg text-[10px] font-mono overflow-x-auto border ${
                    isDarkMode 
                      ? 'bg-black/60 border-[#3d4a42]/20 text-red-400/90' 
                      : 'bg-white border-red-100 text-red-600/95'
                  }`}>
                    {error}
                  </pre>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={fetchTip} 
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all transform active:scale-95 ${
                    isDarkMode 
                      ? 'bg-red-500/20 hover:bg-red-500/30 text-[#ffb4ab] border border-red-500/30' 
                      : 'bg-red-600 hover:bg-red-700 text-white shadow-sm'
                  }`}
                  id="btn-retry-tips"
                >
                  <RefreshCw className="w-3.5 h-3.5 animate-spin-reverse" />
                  Reintentar ahora
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !error && !tipText && (
          <div className={`p-4 rounded-xl border border-dashed flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left ${
            isDarkMode ? 'border-[#3d4a42]/30 bg-black' : 'border-gray-200 bg-white/40'
          }`}>
            <div className={`p-3 rounded-full ${
              isDarkMode ? 'bg-zinc-900 text-yellow-500/90' : 'bg-yellow-50 text-yellow-600'
            }`}>
              <Lightbulb className="w-6 h-6 animate-bounce" />
            </div>
            <div className="flex-1">
              <span className="text-xs font-extrabold uppercase tracking-wide text-yellow-500/90 dark:text-yellow-400 block mb-0.5">
                Consejo Pendiente de Análisis
              </span>
              <p className="text-xs text-gray-400 dark:text-[#87948b]">
                Haz clic en el botón superior para que nuestro Asesor Financiero IA analice tus datos actuales y te ofrezca una recomendación totalmente personalizada.
              </p>
            </div>
          </div>
        )}

        {!isLoading && !error && tipText && (
          <div 
            className={`p-4 rounded-xl border prose prose-sm max-w-none text-xs leading-relaxed transition-all duration-300 ${
              isDarkMode 
                ? 'bg-[#0a0f0c] border-[#3d4a42]/20 text-gray-300' 
                : 'bg-white border-gray-100 text-gray-700'
            }`}
            id="financial-tips-response-box"
          >
            <div className="whitespace-pre-line font-medium">
              {tipText.split('\n').map((line, idx) => {
                // Render simple markdown headers, bold, and lists
                let element: React.ReactNode = line;
                
                // Bold text replacement
                if (line.includes('**')) {
                  const parts = line.split('**');
                  element = parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="text-[#006948] dark:text-[#68dba9] font-black">{part}</strong> : part);
                }
                
                // Bullet point check
                const isBullet = line.trim().startsWith('-') || line.trim().startsWith('*');
                const cleanLine = isBullet ? line.replace(/^[-*]\s*/, '') : line;
                
                return (
                  <div 
                    key={idx} 
                    className={`${isBullet ? 'pl-4 relative before:content-["•"] before:absolute before:left-1 before:text-emerald-500' : ''} ${line.trim() === '' ? 'h-2' : 'my-1'}`}
                  >
                    {isBullet ? (typeof element === 'string' ? cleanLine : element) : element}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
