import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  // Fails loudly during local dev / build if the env vars are missing,
  // instead of silently breaking auth at runtime.
  console.error(
    'Faltan las variables de entorno VITE_SUPABASE_URL y/o VITE_SUPABASE_ANON_KEY. ' +
    'Revisa tu archivo .env o la configuración de variables de entorno en Vercel.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
