/**
 * Variáveis de ambiente Supabase centralizadas e normalizadas (trim).
 * Único ponto de leitura para URL e chave; evita "Invalid API Key" por newlines no Vercel.
 */

const rawUrl = (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const pubKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const SUPABASE_URL = rawUrl;
export const SUPABASE_PUBLISHABLE_KEY = pubKey || anonKey;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const msg =
    '[Supabase] Variáveis não configuradas. Configure na Vercel (Environment Variables): ' +
    'VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (ou VITE_SUPABASE_PUBLISHABLE_KEY). ' +
    'Copie a chave anon em Supabase → Settings → API. Sem espaço ou quebra no final. ' +
    'Depois: Redeploy com "Clear build cache".';
  if (import.meta.env.DEV) throw new Error(msg);
  console.error(msg);
}
