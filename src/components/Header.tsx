import { Compass, Sun, Moon, Database, ShieldAlert, Sliders, TrendingUp } from 'lucide-react';

interface HeaderProps {
  activeTab: 'base' | 'escaner' | 'valvula' | 'proyeccion';
  setActiveTab: (tab: 'base' | 'escaner' | 'valvula' | 'proyeccion') => void;
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  hasStarted: boolean;
  resetApp: () => void;
}

export default function Header({
  activeTab,
  setActiveTab,
  isDarkMode,
  toggleDarkMode,
  hasStarted,
  resetApp,
}: HeaderProps) {
  return (
    <header className={`fixed top-0 w-full z-50 px-4 md:px-8 h-16 md:h-20 flex items-center justify-between border-b transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-[#1b211d] border-[#3d4a42] text-[#dee4de]' 
        : 'bg-[#e9efe9] border-[#bccac0] text-[#171d19]'
    }`}>
      <div className="flex items-center gap-3">
        <button 
          onClick={resetApp}
          className={`p-2 rounded-full transition-transform active:scale-95 flex items-center justify-center ${
            isDarkMode ? 'hover:bg-[#303632] text-[#68dba9]' : 'hover:bg-[#dee4de] text-[#006948]'
          }`}
          aria-label="Volver al inicio"
          id="header-home-btn"
        >
          <Compass className="w-6 h-6 md:w-7 h-7" />
        </button>
        <span 
          onClick={resetApp}
          className={`font-display text-lg md:text-2xl font-bold tracking-tight cursor-pointer ${
            isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
          }`}
          id="header-brand-title"
        >
          EL ARQUITECTO FINANCIERO
        </span>
      </div>

      {hasStarted && (
        <nav className="hidden md:flex items-center gap-2 lg:gap-4" id="desktop-nav">
          <button
            onClick={() => setActiveTab('base')}
            className={`px-4 py-2 rounded-full font-display text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'base'
                ? isDarkMode
                  ? 'bg-[#25a475] text-[#00311f]'
                  : 'bg-[#006948] text-white'
                : isDarkMode
                  ? 'text-[#bccac0] hover:bg-[#303632]'
                  : 'text-[#3d4a42] hover:bg-[#dee4de]'
            }`}
            id="nav-tab-base"
          >
            <Database className="w-4 h-4" />
            La Base
          </button>

          <button
            onClick={() => setActiveTab('escaner')}
            className={`px-4 py-2 rounded-full font-display text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'escaner'
                ? isDarkMode
                  ? 'bg-[#25a475] text-[#00311f]'
                  : 'bg-[#006948] text-white'
                : isDarkMode
                  ? 'text-[#bccac0] hover:bg-[#303632]'
                  : 'text-[#3d4a42] hover:bg-[#dee4de]'
            }`}
            id="nav-tab-escaner"
          >
            <ShieldAlert className="w-4 h-4" />
            El Escáner
          </button>

          <button
            onClick={() => setActiveTab('valvula')}
            className={`px-4 py-2 rounded-full font-display text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'valvula'
                ? isDarkMode
                  ? 'bg-[#25a475] text-[#00311f]'
                  : 'bg-[#006948] text-white'
                : isDarkMode
                  ? 'text-[#bccac0] hover:bg-[#303632]'
                  : 'text-[#3d4a42] hover:bg-[#dee4de]'
            }`}
            id="nav-tab-valvula"
          >
            <Sliders className="w-4 h-4" />
            La Válvula
          </button>

          <button
            onClick={() => setActiveTab('proyeccion')}
            className={`px-4 py-2 rounded-full font-display text-sm font-semibold flex items-center gap-2 transition-all ${
              activeTab === 'proyeccion'
                ? isDarkMode
                  ? 'bg-[#25a475] text-[#00311f]'
                  : 'bg-[#006948] text-white'
                : isDarkMode
                  ? 'text-[#bccac0] hover:bg-[#303632]'
                  : 'text-[#3d4a42] hover:bg-[#dee4de]'
            }`}
            id="nav-tab-proyeccion"
          >
            <TrendingUp className="w-4 h-4" />
            Proyección
          </button>
        </nav>
      )}

      <button
        onClick={toggleDarkMode}
        className={`p-2.5 rounded-full transition-transform active:scale-95 flex items-center justify-center ${
          isDarkMode 
            ? 'hover:bg-[#303632] text-[#68dba9]' 
            : 'hover:bg-[#dee4de] text-[#006948]'
        }`}
        aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        id="theme-toggle-btn"
      >
        {isDarkMode ? <Sun className="w-5 h-5 md:w-6 h-6" /> : <Moon className="w-5 h-5 md:w-6 h-6" />}
      </button>
    </header>
  );
}
