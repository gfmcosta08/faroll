/**
 * Variáveis de ambiente Supabase centralizadas e normalizadas (trim).
 * Único ponto de leitura para URL e chave; evita "Invalid API Key" por newlines no Vercel.
 */

const rawUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const rawKey =
  (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY) ??
  '';

export const SUPABASE_URL = rawUrl.trim();
export const SUPABASE_PUBLISHABLE_KEY = rawKey.trim();

if (import.meta.env.DEV && (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY)) {
  console.warn(
    '[Supabase] VITE_SUPABASE_URL ou chave não configuradas; login pode falhar com Invalid API Key. Verifique .env e no Vercel.'
  );
}
