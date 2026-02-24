const fs = require('fs');
const filePath = 'd:\\farollbr\\src\\contexts\\AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// 1. Corrigir o efeito de captura de tokens para ser mais agressivo e dar feedback
const oldEffectStart = '// Capturar tokens do Google após retorno do OAuth';
const oldEffectEnd = '}, [session, state.user?.profileId]);';

const startIdx = content.indexOf(oldEffectStart);
const endIdx = content.indexOf(oldEffectEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newEffect = `// Processar retorno do Google OAuth (Captura de Tokens) - REFORÇADO
  useEffect(() => {
    const handleOAuthCallback = async () => {
      // Tentar pegar do HASH (URL) ou da Sessão
      const hash = window.location.hash.substring(1);
      const urlParams = new URLSearchParams(hash);
      const providerToken = urlParams.get('provider_token') || session?.provider_token;
      
      if (providerToken) {
        const profileId = authUser?.profileId || state.user?.profileId;
        if (!profileId) return;

        console.log('[Google Sync] Detectado retorno do Google na URL!');
        
        try {
          // Salvar IMEDIATAMENTE no banco
          const { error: upsertError } = await supabase.from('google_sync_settings').upsert({
            user_id: profileId,
            access_token: providerToken,
            refresh_token: urlParams.get('provider_refresh_token') || (session as any)?.provider_refresh_token || null,
            sync_enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          if (upsertError) throw upsertError;

          // Forçar estado visual e ir para a tela certa
          setState(prev => ({ 
            ...prev, 
            isGoogleSyncEnabled: true,
            screen: 'gerenciar-agenda' 
          }));

          // Feedback visual imediato para o usuário
          toast.success("Google Calendar detectado! Sincronizando eventos...");

          // Limpar URL para não rodar de novo
          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          // Disparar sincronização real
          setTimeout(() => syncWithGoogle(true), 1000);
        } catch (err) {
          console.error('[Google Sync] Erro crítico ao capturar tokens:', err);
          toast.error("Falha ao salvar conexão com Google.");
        }
      }
    };

    handleOAuthCallback();
  }, [session, authUser?.profileId]);`;

    const oldContent = content.substring(startIdx, endIdx + oldEffectEnd.length);
    content = content.replace(oldContent, newEffect);
}

// 2. Garantir que datas e horários usem o formato ISO correto para o banco de dados
content = content.replace(/data: start\.toISOString\(\)\.split\('T'\)\[0\]/g, "data: format(start, 'yyyy-MM-dd')");
content = content.replace(/data_fim: end\.toISOString\(\)\.split\('T'\)\[0\]/g, "data_fim: format(end, 'yyyy-MM-dd')");
content = content.replace(/hora_inicio: start\.toTimeString\(\)\.split\(' '\)\[0\]/g, "hora_inicio: format(start, 'HH:mm:ss')");
content = content.replace(/hora_fim: end\.toTimeString\(\)\.split\(' '\)\[0\]/g, "hora_fim: format(end, 'HH:mm:ss')");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Correções reforçadas aplicadas com sucesso.");
