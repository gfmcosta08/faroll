const fs = require('fs');
const filePath = 'd:\\farollbr\\src\\contexts\\AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Refatorar o handleOAuthCallback para ser INFALÍVEL
// Ele vai parar qualquer redirecionamento até salvar o token.
const oldEffectStart = '// Processar retorno do Google OAuth (Captura de Tokens) - PRIORIDADE MÁXIMA';
const oldEffectEnd = '}, [session, authUser?.profileId, state.user?.profileId]);';

const startIdx = content.indexOf(oldEffectStart);
const endIdx = content.indexOf(oldEffectEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newEffect = `// Processar retorno do Google OAuth (Captura de Tokens) - RECONSTRUÇÃO TOTAL
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Capturar da URL (Hash) ou da Sessão
      const hash = window.location.hash.substring(1);
      const urlParams = new URLSearchParams(hash);
      const providerToken = urlParams.get('provider_token') || session?.provider_token;
      
      if (providerToken) {
        const profileId = authUser?.profileId || state.user?.profileId;
        if (!profileId) {
          console.log('[Google Sync] Token presente, mas aguardando perfil...');
          return;
        }

        console.log('[Google Sync] AGENTE: Salvando conexão Google na marra...');
        
        try {
          const { error: upsertError } = await supabase.from('google_sync_settings').upsert({
            user_id: profileId,
            access_token: providerToken,
            refresh_token: urlParams.get('provider_refresh_token') || (session as any)?.provider_refresh_token || null,
            sync_enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          if (upsertError) throw upsertError;

          // Forçar estado visual IMEDIATAMENTE
          setState(prev => ({ 
            ...prev, 
            isGoogleSyncEnabled: true,
            screen: 'gerenciar-agenda' // Forçar ir para tela de agenda
          }));

          // Limpar URL
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          toast.success("AGORA SIM! Google conectado!");
          
          // Sincronizar eventos reais imediatamente
          setTimeout(() => syncWithGoogle(true), 500);
        } catch (err) {
          console.error('[Google Sync] Erro na gravação:', err);
        }
      }
    };

    handleOAuthCallback();
  }, [session?.provider_token, authUser?.profileId, state.user?.profileId]);`;

    const oldContent = content.substring(startIdx, endIdx + oldEffectEnd.length);
    content = content.replace(oldContent, newEffect);
}

fs.writeFileSync(filePath, content, 'utf8');
console.log("Correção de AppContext aplicada.");
