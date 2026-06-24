import { useState } from 'react';
import { Compass, ChevronDown, Banknote } from 'lucide-react';
import { motion } from 'motion/react';

interface WelcomeScreenProps {
  isDarkMode: boolean;
  currency: string;
  setCurrency: (curr: string) => void;
  onStart: () => void;
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'Dólar (USD $)' },
  { code: 'EUR', symbol: '€', name: 'Euro (EUR €)' },
  { code: 'MXN', symbol: '$', name: 'Peso Mexicano (MXN $)' },
  { code: 'COP', symbol: '$', name: 'Peso Colombiano (COP $)' },
  { code: 'ARS', symbol: '$', name: 'Peso Argentino (ARS $)' },
  { code: 'CLP', symbol: '$', name: 'Peso Chileno (CLP $)' },
  { code: 'PEN', symbol: 'S/.', name: 'Sol Peruano (PEN S/.)' },
];

export default function WelcomeScreen({
  isDarkMode,
  currency,
  setCurrency,
  onStart,
}: WelcomeScreenProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedCurrency = currencies.find(c => c.code === currency) || currencies[0];

  const handleSelect = (code: string) => {
    setCurrency(code);
    setIsOpen(false);
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex flex-col justify-between py-12 px-6 text-center ${
      isDarkMode ? 'bg-[#0f1511] text-[#dee4de]' : 'bg-[#f5fbf5] text-[#171d19]'
    }`}>
      {/* Empty spacer to push content down to center */}
      <div />

      {/* Main Branding Section */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="flex flex-col items-center gap-10 max-w-xl mx-auto"
        id="welcome-branding-container"
      >
        <h1 className={`font-display text-4xl md:text-6xl font-bold tracking-tight uppercase ${
          isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
        }`} id="welcome-title">
          EL ARQUITECTO
        </h1>

        <div className="flex flex-col gap-4 mt-6">
          <h2 className={`font-display text-xl md:text-2xl font-semibold ${
            isDarkMode ? 'text-[#bccac0]' : 'text-[#00855d]'
          }`} id="welcome-subtitle">
            Construye tu Libertad Financiera
          </h2>
          <p className={`font-sans text-base md:text-lg max-w-md mx-auto ${
            isDarkMode ? 'text-[#bccac0]/80' : 'text-[#3d4a42]'
          }`} id="welcome-description">
            Tu plano maestro para el éxito económico, diseñado por ti
          </p>
        </div>
      </motion.div>

      {/* Interactive Controls Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="flex flex-col items-center gap-4 w-full max-w-sm mx-auto mt-12 relative z-30"
        id="welcome-controls-panel"
      >
        {/* Start Button */}
        <button
          onClick={onStart}
          className={`w-full py-4 px-8 rounded-xl font-display text-lg font-bold shadow-md hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer ${
            isDarkMode 
              ? 'bg-[#25a475] text-[#00311f] hover:bg-[#68dba9]' 
              : 'bg-[#006948] text-white hover:bg-[#00855d]'
          }`}
          id="welcome-start-btn"
        >
          Empezar
        </button>

        {/* Custom Currency Dropdown Selector */}
        <div className="relative w-full" id="currency-dropdown-wrapper">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className={`w-full py-4 px-5 rounded-xl border font-sans text-base flex items-center justify-between transition-all ${
              isDarkMode 
                ? 'bg-[#171d19] border-[#3d4a42] text-[#dee4de] hover:bg-[#1b211d]' 
                : 'bg-[#e4eae4] border-[#bccac0] text-[#171d19] hover:bg-[#dee4de]'
            }`}
            id="currency-selector-btn"
          >
            <div className="flex items-center gap-3">
              <Banknote className={`w-5 h-5 ${isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}`} />
              <span className="font-semibold">{selectedCurrency.name}</span>
            </div>
            <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {isOpen && (
            <div className={`absolute bottom-full mb-2 left-0 right-0 rounded-xl border shadow-xl max-h-60 overflow-y-auto z-50 ${
              isDarkMode 
                ? 'bg-[#171d19] border-[#3d4a42] text-[#dee4de]' 
                : 'bg-white border-[#bccac0] text-[#171d19]'
            }`} id="currency-options-container">
              {currencies.map((curr) => (
                <button
                  key={curr.code}
                  onClick={() => handleSelect(curr.code)}
                  className={`w-full px-5 py-3 text-left font-sans text-sm flex items-center justify-between transition-colors ${
                    isDarkMode 
                      ? 'hover:bg-[#303632] border-b border-[#3d4a42]/30 last:border-0' 
                      : 'hover:bg-[#f5fbf5] border-b border-gray-100 last:border-0'
                  } ${currency === curr.code ? 'font-bold' : ''}`}
                >
                  <span>{curr.name}</span>
                  {currency === curr.code && (
                    <span className={isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'}>✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      {/* Drawing Compass Footer Ornament */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1, delay: 0.4 }}
        className="flex justify-center mt-12"
        id="welcome-compass-decoration"
      >
        <Compass className={`w-12 h-12 stroke-[1.25] ${
          isDarkMode ? 'text-[#dee4de]' : 'text-[#006948]'
        }`} />
      </motion.div>
    </div>
  );
}
