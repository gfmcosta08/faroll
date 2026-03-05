/**
 * Navega para um sub-app (psicoapp/fox-dashboard) passando a sessão Supabase via token handoff.
 *
 * farollbr.com.br usa localStorage para auth.
 * psicoapp usa cookies SSR (@supabase/ssr) — precisa receber o token via URL.
 * fox/dashboard usa localStorage (client-side, mesmo origin) — não precisa de handoff.
 */
import { supabase } from '@/integrations/supabase/client';

export const navigateToSaude = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token && session?.refresh_token) {
      const params = new URLSearchParams({
        access_token: session.access_token,
        refresh_token: session.refresh_token,
      });
      window.location.href = `/app/saude/auth/handoff?${params.toString()}`;
    } else {
      window.location.href = '/app/saude';
    }
  } catch {
    window.location.href = '/app/saude';
  }
};

export const navigateToImoveis = () => {
  // fox/dashboard usa localStorage — mesma origin farollbr.com.br — sem necessidade de handoff
  window.location.href = '/app/imoveis';
};
