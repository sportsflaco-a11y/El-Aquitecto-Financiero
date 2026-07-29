import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  signUpWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithEmail: (email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// Friendlier Spanish messages for the most common Supabase/Postgres error cases.
function friendlyAuthError(rawMessage: string): string {
  const msg = rawMessage.toLowerCase();
  if (msg.includes('no encontramos una compra')) {
    // Message raised directly by our own Postgres trigger (see supabase-setup.sql)
    return rawMessage;
  }
  if (msg.includes('user already registered') || msg.includes('already registered')) {
    return 'Ya existe una cuenta con este correo. Intenta iniciar sesión en vez de crear una cuenta nueva.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Correo o contraseña incorrectos.';
  }
  if (msg.includes('password should be at least')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Confirma tu correo antes de iniciar sesión — revisa tu bandeja de entrada.';
  }
  return 'Ocurrió un error. Intenta de nuevo en unos segundos.';
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Supabase OAuth (Google) redirects back with ?error=...&error_description=...
    // when the sign-in is rejected (e.g. by our allowed-buyer Postgres trigger).
    const params = new URLSearchParams(window.location.hash.replace('#', '?') || window.location.search);
    const oauthErrorDescription = params.get('error_description');
    if (oauthErrorDescription) {
      setError(friendlyAuthError(decodeURIComponent(oauthErrorDescription)));
      // Clean the error params out of the URL so a refresh doesn't re-show it.
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const clearError = () => setError(null);

  const signUpWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error: signUpError } = await supabase.auth.signUp({ email, password });
    if (signUpError) {
      setError(friendlyAuthError(signUpError.message));
      return false;
    }
    return true;
  };

  const signInWithEmail = async (email: string, password: string) => {
    setError(null);
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
    if (signInError) {
      setError(friendlyAuthError(signInError.message));
      return false;
    }
    return true;
  };

  const signInWithGoogle = async () => {
    setError(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) {
      setError(friendlyAuthError(oauthError.message));
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        error,
        clearError,
        signUpWithEmail,
        signInWithEmail,
        signInWithGoogle,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth debe usarse dentro de un <AuthProvider>');
  }
  return ctx;
}
