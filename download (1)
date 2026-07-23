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
import { useLocalStorageState } from './hooks/useLocalStorageState';
import { getCurrencySymbol } from './utils';

const LOCAL_STORAGE_KEY = 'el_arquitecto_state_v1';

const initialFixedCosts: FixedCost[] = [
  { id: '1', name: 'Alquiler/Renta', value: 0 },
  { id: '2', name: 'Servicios Básicos', value: 0 },
];

const initialDebts: Debt[] = [
  { id: '1', name: 'Tarjeta de Crédito', balance: 0, interestRate: 0, minPayment: 0 },
  { id: '2', name: 'Préstamo de Auto', balance: 0, interestRate: 0, minPayment: 0 },
];

export default function App() {
  // Initialize state using custom hook useLocalStorageState for clean auto-sync
  const [hasStarted, setHasStarted] = useLocalStorageState<boolean>(
    `${LOCAL_STORAGE_KEY}_started`,
    false
  );

  const [currency, setCurrency] = useLocalStorageState<string>(
    `${LOCAL_STORAGE_KEY}_currency`,
    'USD'
  );

  // Normalize legacy currency values
  useEffect(() => {
    if (currency === '$') setCurrency('USD');
    else if (currency === '€') setCurrency('EUR');
    else if (currency === 'S/.') setCurrency('PEN');
  }, [currency, setCurrency]);

  const currencySymbol = getCurrencySymbol(currency);

  const [income, setIncome] = useLocalStorageState<number>(
    `${LOCAL_STORAGE_KEY}_income`,
    0
  );

  const [fixedCosts, setFixedCosts] = useLocalStorageState<FixedCost[]>(
    `${LOCAL_STORAGE_KEY}_fixed_costs`,
    initialFixedCosts
  );

  const [debts, setDebts] = useLocalStorageState<Debt[]>(
    `${LOCAL_STORAGE_KEY}_debts`,
    initialDebts
  );

  const [debtPct, setDebtPct] = useLocalStorageState<number>(
    `${LOCAL_STORAGE_KEY}_debt_pct`,
    40
  );

  const [savingsPct, setSavingsPct] = useLocalStorageState<number>(
    `${LOCAL_STORAGE_KEY}_savings_pct`,
    30
  );

  const [personalPct, setPersonalPct] = useLocalStorageState<number>(
    `${LOCAL_STORAGE_KEY}_personal_pct`,
    30
  );

  const [strategy, setStrategy] = useLocalStorageState<StrategyType>(
    `${LOCAL_STORAGE_KEY}_strategy`,
    'avalanche'
  );

  const [activeTab, setActiveTab] = useLocalStorageState<'base' | 'escaner' | 'valvula' | 'proyeccion'>(
    `${LOCAL_STORAGE_KEY}_active_tab`,
    'base'
  );

  const [isDarkMode, setIsDarkMode] = useLocalStorageState<boolean>(
    `${LOCAL_STORAGE_KEY}_dark_mode`,
    false
  );

  // Apply theme classes to HTML document element for smooth Tailwind styling
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#000000';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#f5fbf5';
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

  const resetApp = () => {
    setHasStarted(false);
    setActiveTab('base');
    setIncome(0);
    setFixedCosts(initialFixedCosts);
    setDebts(initialDebts);
    setDebtPct(40);
    setSavingsPct(30);
    setPersonalPct(30);
    setStrategy('avalanche');
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
      isDarkMode ? 'bg-black text-[#dee4de]' : 'bg-[#f5fbf5] text-[#171d19]'
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
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-28 md:pb-8 flex flex-col gap-6 md:gap-8">
            
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
                    <div className="flex flex-col gap-6 md:gap-8">
                      <BaseTab
                        isDarkMode={isDarkMode}
                        currency={currencySymbol}
                        currencyCode={currency}
                        income={income}
                        setIncome={setIncome}
                        fixedCosts={fixedCosts}
                        setFixedCosts={setFixedCosts}
                        onNext={() => setActiveTab('escaner')}
                      />
                    </div>
                  )}

                  {activeTab === 'escaner' && (
                    <div className="flex flex-col gap-6 md:gap-8">
                      <ScannerTab
                        isDarkMode={isDarkMode}
                        currency={currencySymbol}
                        currencyCode={currency}
                        income={income}
                        debts={debts}
                        setDebts={setDebts}
                        onNext={() => setActiveTab('valvula')}
                      />
                    </div>
                  )}

                  {activeTab === 'valvula' && (
                    <div className="flex flex-col gap-6 md:gap-8">
                      <ValveTab
                        isDarkMode={isDarkMode}
                        currency={currencySymbol}
                        currencyCode={currency}
                        income={income}
                        fixedCosts={fixedCosts}
                        debts={debts}
                        debtPct={debtPct}
                        setDebtPct={setDebtPct}
                        savingsPct={savingsPct}
                        setSavingsPct={setSavingsPct}
                        personalPct={personalPct}
                        setPersonalPct={setPersonalPct}
                        onNext={() => setActiveTab('proyeccion')}
                      />
                    </div>
                  )}

                  {activeTab === 'proyeccion' && (
                    <div className="flex flex-col gap-6 md:gap-8">
                      <ProjectionTab
                        isDarkMode={isDarkMode}
                        currency={currencySymbol}
                        currencyCode={currency}
                        income={income}
                        fixedCosts={fixedCosts}
                        debts={debts}
                        debtPct={debtPct}
                        savingsPct={savingsPct}
                        personalPct={personalPct}
                        strategy={strategy}
                      />
                    </div>
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
            <span className="text-[10px] font-bold font-display">Tu Proyección</span>
          </button>
        </nav>
      )}
    </div>
  );
}
