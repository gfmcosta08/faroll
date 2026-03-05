/**
 * Variáveis de ambiente Supabase centralizadas e normalizadas.
 * Runtime config (public/config.js) tem prioridade sobre env vars de build-time.
 * Isso garante que o app funcione corretamente mesmo quando o build é feito
 * por pipelines externos (Lovable.dev) que podem ter env vars desatualizadas.
 */

// Runtime config carregado pelo browser via public/config.js (commitado no git)
const runtimeCfg = typeof window !== 'undefined'
  ? (window as any).__FAROLL_CONFIG__ ?? {}
  : {};

const rawUrl = runtimeCfg.supabaseUrl || (import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const pubKey = runtimeCfg.supabaseKey || (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
const anonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY ?? '').trim();

export const SUPABASE_URL = rawUrl;
export const SUPABASE_PUBLISHABLE_KEY = pubKey || anonKey;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const msg = '[Supabase] Variáveis não configuradas. Verifique public/config.js ou env vars Vercel.';
  if (import.meta.env.DEV) throw new Error(msg);
  console.error(msg);
}
