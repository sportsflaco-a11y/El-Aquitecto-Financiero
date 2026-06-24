import { useState, useEffect } from 'react';
import Header from './components/Header';
import WelcomeScreen from './components/WelcomeScreen';
import BaseTab from './components/BaseTab';
import ScannerTab from './components/ScannerTab';
import ValveTab from './components/ValveTab';
import ProjectionTab from './components/ProjectionTab';
import { AppState, FixedCost, Debt, StrategyType } from './types';
import { Database, ShieldAlert, Sliders, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const LOCAL_STORAGE_KEY = 'el_arquitecto_state_v1';

const initialFixedCosts: FixedCost[] = [
  { id: '1', name: 'Renta / Hipoteca', value: 1500 },
  { id: '2', name: 'Servicios Básicos', value: 300 },
];

const initialDebts: Debt[] = [
  { id: '1', name: 'Tarjeta de Crédito', balance: 5000, interestRate: 18.5, minPayment: 150 },
  { id: '2', name: 'Préstamo de Auto', balance: 12000, interestRate: 5.5, minPayment: 250 },
];

export default function App() {
  // Initialize state from local storage or defaults
  const [hasStarted, setHasStarted] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_started`);
    return saved ? JSON.parse(saved) : false;
  });

  const [currency, setCurrency] = useState<string>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_currency`);
    if (!saved) return 'USD';
    if (saved === '$') return 'USD';
    if (saved === '€') return 'EUR';
    if (saved === 'S/.') return 'PEN';
    return saved;
  });

  const getCurrencySymbol = (code: string) => {
    const symbols: Record<string, string> = {
      USD: '$',
      EUR: '€',
      MXN: '$',
      COP: '$',
      ARS: '$',
      CLP: '$',
      PEN: 'S/.',
    };
    return symbols[code] || '$';
  };

  const currencySymbol = getCurrencySymbol(currency);

  const [income, setIncome] = useState<number>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_income`);
    return saved ? Number(saved) : 5000;
  });

  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_fixed_costs`);
    return saved ? JSON.parse(saved) : initialFixedCosts;
  });

  const [debts, setDebts] = useState<Debt[]>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_debts`);
    return saved ? JSON.parse(saved) : initialDebts;
  });

  const [acceleratorStrength, setAcceleratorStrength] = useState<number>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_acc_strength`);
    return saved ? Number(saved) : 50;
  });

  const [strategy, setStrategy] = useState<StrategyType>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_strategy`);
    return (saved as StrategyType) || 'avalanche';
  });

  const [savingsAllocation, setSavingsAllocation] = useState<number>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_savings_alloc`);
    return saved ? Number(saved) : 30;
  });

  const [activeTab, setActiveTab] = useState<'base' | 'escaner' | 'valvula' | 'proyeccion'>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_active_tab`);
    return (saved as any) || 'base';
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem(`${LOCAL_STORAGE_KEY}_dark_mode`);
    return saved ? JSON.parse(saved) : false;
  });

  // Persist State to Local Storage on changes
  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_started`, JSON.stringify(hasStarted));
  }, [hasStarted]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_currency`, currency);
  }, [currency]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_income`, String(income));
  }, [income]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_fixed_costs`, JSON.stringify(fixedCosts));
  }, [fixedCosts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_debts`, JSON.stringify(debts));
  }, [debts]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_acc_strength`, String(acceleratorStrength));
  }, [acceleratorStrength]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_strategy`, strategy);
  }, [strategy]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_savings_alloc`, String(savingsAllocation));
  }, [savingsAllocation]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_active_tab`, activeTab);
  }, [activeTab]);

  useEffect(() => {
    localStorage.setItem(`${LOCAL_STORAGE_KEY}_dark_mode`, JSON.stringify(isDarkMode));
    // Apply theme classes to HTML document element for smooth Tailwind styling
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#0f1511';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f5fbf5';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const resetApp = () => {
    setHasStarted(false);
    setActiveTab('base');
  };

  // Calculations for sub-navigation support
  const totalCosts = fixedCosts.reduce((sum, cost) => sum + (Number(cost.value) || 0), 0);

  // Determine current step index out of 4
  const getStepNumber = () => {
    switch (activeTab) {
      case 'base': return 1;
      case 'escaner': return 2;
      case 'valvula': return 3;
      case 'proyeccion': return 4;
      default: return 1;
    }
  };

  const step = getStepNumber();

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-300 ${
      isDarkMode ? 'bg-[#0f1511] text-[#dee4de]' : 'bg-[#f5fbf5] text-[#171d19]'
    }`}>
      
      {/* Top Header Navigation */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
        hasStarted={hasStarted}
        resetApp={resetApp}
      />

      {/* Main Container */}
      <main className="pt-20 md:pt-24 min-h-[calc(100vh-5rem)]">
        
        {!hasStarted ? (
          <WelcomeScreen
            isDarkMode={isDarkMode}
            currency={currency}
            setCurrency={setCurrency}
            onStart={() => setHasStarted(true)}
          />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col gap-6 md:gap-8">
            
            {/* Step Stepper Progress Bar */}
            <section className="flex flex-col gap-4 max-w-xl" id="progress-indicator-section">
              <div className="flex items-center w-full gap-2">
                <div className={`h-1 flex-1 rounded-full ${step >= 1 ? (isDarkMode ? 'bg-[#25a475]' : 'bg-[#006948]') : 'bg-gray-200 dark:bg-[#303632]'}`} />
                <div className={`h-1 flex-1 rounded-full ${step >= 2 ? (isDarkMode ? 'bg-[#25a475]' : 'bg-[#006948]') : 'bg-gray-200 dark:bg-[#303632]'}`} />
                <div className={`h-1 flex-1 rounded-full ${step >= 3 ? (isDarkMode ? 'bg-[#25a475]' : 'bg-[#006948]') : 'bg-gray-200 dark:bg-[#303632]'}`} />
                <div className={`h-1 flex-1 rounded-full ${step >= 4 ? (isDarkMode ? 'bg-[#25a475]' : 'bg-[#006948]') : 'bg-gray-200 dark:bg-[#303632]'}`} />
                <span className="text-xs font-bold font-display ml-2">{step}/4</span>
              </div>
            </section>

            {/* Active Workspace / Form Views */}
            <div className="min-h-[60vh]" id="tab-workspace">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.25 }}
                >
                  {activeTab === 'base' && (
                    <BaseTab
                      isDarkMode={isDarkMode}
                      currency={currencySymbol}
                      income={income}
                      setIncome={setIncome}
                      fixedCosts={fixedCosts}
                      setFixedCosts={setFixedCosts}
                      onNext={() => setActiveTab('escaner')}
                    />
                  )}

                  {activeTab === 'escaner' && (
                    <ScannerTab
                      isDarkMode={isDarkMode}
                      currency={currencySymbol}
                      debts={debts}
                      setDebts={setDebts}
                      onNext={() => setActiveTab('valvula')}
                    />
                  )}

                  {activeTab === 'valvula' && (
                    <ValveTab
                      isDarkMode={isDarkMode}
                      currency={currencySymbol}
                      income={income}
                      totalCosts={totalCosts}
                      acceleratorStrength={acceleratorStrength}
                      setAcceleratorStrength={setAcceleratorStrength}
                      strategy={strategy}
                      setStrategy={setStrategy}
                      savingsAllocation={savingsAllocation}
                      setSavingsAllocation={setSavingsAllocation}
                      onNext={() => setActiveTab('proyeccion')}
                    />
                  )}

                  {activeTab === 'proyeccion' && (
                    <ProjectionTab
                      isDarkMode={isDarkMode}
                      currency={currencySymbol}
                      income={income}
                      fixedCosts={fixedCosts}
                      debts={debts}
                      acceleratorStrength={acceleratorStrength}
                      strategy={strategy}
                      savingsAllocation={savingsAllocation}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar (Visible on mobile only, matching screens perfectly) */}
      {hasStarted && (
        <nav 
          className={`md:hidden fixed bottom-0 left-0 right-0 h-20 border-t flex items-center justify-around px-2 pb-safe z-50 transition-colors duration-300 ${
            isDarkMode 
              ? 'bg-[#0a0f0c] border-[#3d4a42]/60 text-[#dee4de]' 
              : 'bg-white border-[#bccac0]/60 text-[#171d19]'
          }`}
          id="mobile-bottom-nav"
        >
          {/* Base tab button */}
          <button
            onClick={() => setActiveTab('base')}
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
              activeTab === 'base'
                ? isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
                : 'text-gray-400'
            }`}
            id="mobile-nav-base"
          >
            <Database className={`w-5 h-5 ${activeTab === 'base' ? 'fill-current' : ''}`} />
            <span className="text-[10px] font-bold font-display">La Base</span>
          </button>

          {/* Scanner tab button */}
          <button
            onClick={() => setActiveTab('escaner')}
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
              activeTab === 'escaner'
                ? isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
                : 'text-gray-400'
            }`}
            id="mobile-nav-escaner"
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] font-bold font-display">El Escáner</span>
          </button>

          {/* Valve tab button */}
          <button
            onClick={() => setActiveTab('valvula')}
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
              activeTab === 'valvula'
                ? isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
                : 'text-gray-400'
            }`}
            id="mobile-nav-valvula"
          >
            <Sliders className="w-5 h-5" />
            <span className="text-[10px] font-bold font-display">La Válvula</span>
          </button>

          {/* Projection tab button */}
          <button
            onClick={() => setActiveTab('proyeccion')}
            className={`flex flex-col items-center justify-center flex-1 py-1 gap-1 transition-all ${
              activeTab === 'proyeccion'
                ? isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
                : 'text-gray-400'
            }`}
            id="mobile-nav-proyeccion"
          >
            <TrendingUp className="w-5 h-5" />
            <span className="text-[10px] font-bold font-display">Proyección</span>
          </button>
        </nav>
      )}
    </div>
  );
}
