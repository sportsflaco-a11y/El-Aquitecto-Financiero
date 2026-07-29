import { useState, FormEvent } from 'react';
import { Mail, Lock, LogIn, UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../hooks/useAuth';

interface AuthScreenProps {
  isDarkMode: boolean;
}

export default function AuthScreen({ isDarkMode }: AuthScreenProps) {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, error, clearError } = useAuth();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSignupSuccess(false);

    if (mode === 'signin') {
      await signInWithEmail(email, password);
    } else {
      const ok = await signUpWithEmail(email, password);
      if (ok) setSignupSuccess(true);
    }

    setSubmitting(false);
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    setMode(newMode);
    setSignupSuccess(false);
    clearError();
  };

  return (
    <div className={`min-h-[calc(100vh-4rem)] flex items-center justify-center px-6 py-12 ${
      isDarkMode ? 'bg-black text-[#dee4de]' : 'bg-[#f5fbf5] text-[#171d19]'
    }`}>
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-sm"
        id="auth-screen-container"
      >
        <h1 className={`font-display text-2xl md:text-3xl font-bold tracking-tight uppercase text-center mb-2 ${
          isDarkMode ? 'text-[#68dba9]' : 'text-[#006948]'
        }`}>
          EL ARQUITECTO FINANCIERO
        </h1>
        <p className={`text-center text-sm mb-8 ${isDarkMode ? 'text-[#87948b]' : 'text-gray-500'}`}>
          Acceso exclusivo para compradores del Pack Elite o Pack Completo VIP
        </p>

        {/* Mode switcher */}
        <div className={`flex rounded-xl p-1 mb-6 ${isDarkMode ? 'bg-[#0f1511]' : 'bg-white border border-[#bccac0]/40'}`}>
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold font-display transition-colors ${
              mode === 'signin'
                ? isDarkMode ? 'bg-[#25a475] text-black' : 'bg-[#006948] text-white'
                : isDarkMode ? 'text-[#87948b]' : 'text-gray-500'
            }`}
            id="auth-mode-signin"
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => switchMode('signup')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold font-display transition-colors ${
              mode === 'signup'
                ? isDarkMode ? 'bg-[#25a475] text-black' : 'bg-[#006948] text-white'
                : isDarkMode ? 'text-[#87948b]' : 'text-gray-500'
            }`}
            id="auth-mode-signup"
          >
            Crear cuenta
          </button>
        </div>

        {signupSuccess && (
          <div className={`mb-4 p-3 rounded-lg text-sm text-center ${
            isDarkMode ? 'bg-[#25a475]/10 text-[#68dba9] border border-[#25a475]/30' : 'bg-[#006948]/10 text-[#006948] border border-[#006948]/20'
          }`}>
            ¡Cuenta creada! Revisa tu correo para confirmar tu cuenta antes de iniciar sesión.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-lg text-sm text-center bg-red-500/10 text-red-500 border border-red-500/25">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="relative">
            <Mail className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-[#728276]' : 'text-gray-400'}`} />
            <input
              type="email"
              required
              placeholder="Correo con el que compraste"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                isDarkMode
                  ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]'
                  : 'bg-white border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
              }`}
              id="auth-email-input"
            />
          </div>

          <div className="relative">
            <Lock className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-[#728276]' : 'text-gray-400'}`} />
            <input
              type="password"
              required
              minLength={6}
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full pl-10 pr-3 py-2.5 rounded-lg border text-sm focus:outline-none focus:ring-2 transition-all ${
                isDarkMode
                  ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] focus:ring-[#68dba9]'
                  : 'bg-white border-[#bccac0]/40 text-[#171d19] focus:ring-[#006948]'
              }`}
              id="auth-password-input"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold font-display transition-all disabled:opacity-60 ${
              isDarkMode ? 'bg-[#68dba9] text-black hover:bg-[#8ae6c0]' : 'bg-[#006948] text-white hover:bg-[#00855d]'
            }`}
            id="auth-submit-button"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : mode === 'signin' ? (
              <><LogIn className="w-4 h-4" /> Iniciar sesión</>
            ) : (
              <><UserPlus className="w-4 h-4" /> Crear cuenta</>
            )}
          </button>
        </form>

        <div className="flex items-center gap-3 my-5">
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-[#3d4a42]/40' : 'bg-[#bccac0]/40'}`} />
          <span className={`text-xs ${isDarkMode ? 'text-[#728276]' : 'text-gray-400'}`}>o</span>
          <div className={`flex-1 h-px ${isDarkMode ? 'bg-[#3d4a42]/40' : 'bg-[#bccac0]/40'}`} />
        </div>

        <button
          type="button"
          onClick={() => signInWithGoogle()}
          className={`w-full flex items-center justify-center gap-2.5 py-2.5 rounded-lg text-sm font-bold font-display border transition-all ${
            isDarkMode
              ? 'bg-[#0f1511] border-[#3d4a42]/40 text-[#dee4de] hover:bg-[#161c18]'
              : 'bg-white border-[#bccac0]/40 text-[#171d19] hover:bg-gray-50'
          }`}
          id="auth-google-button"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Continuar con Google
        </button>

        <p className={`text-center text-xs mt-8 ${isDarkMode ? 'text-[#728276]' : 'text-gray-400'}`}>
          ¿Compraste pero no puedes entrar? Escríbenos a soporte con el correo que usaste en Hotmart.
        </p>
      </motion.div>
    </div>
  );
}
