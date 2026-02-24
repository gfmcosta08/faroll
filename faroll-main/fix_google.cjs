const fs = require('fs');
const path = require('path');

const filePath = 'd:\\farollbr\\src\\contexts\\AppContext.tsx';
let content = fs.readFileSync(filePath, 'utf8');

const oldEffectStart = '// Capturar tokens do Google após retorno do OAuth';
const oldEffectEnd = '  }, [session, state.user?.profileId]);';

const startIdx = content.indexOf(oldEffectStart);
const endIdx = content.indexOf(oldEffectEnd, startIdx);

if (startIdx !== -1 && endIdx !== -1) {
    const newEffect = `// Processar retorno do Google OAuth (Captura de Tokens)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash.substring(1);
      const urlParams = new URLSearchParams(hash);
      const providerToken = urlParams.get('provider_token') || session?.provider_token;
      
      if (providerToken) {
        const profileId = authUser?.profileId || state.user?.profileId;
        if (!profileId) return;

        console.log('[Google Sync] Token detectado!');
        try {
          await supabase.from('google_sync_settings').upsert({
            user_id: profileId,
            access_token: providerToken,
            refresh_token: urlParams.get('provider_refresh_token') || (session as any)?.provider_refresh_token || null,
            sync_enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          setState(prev => ({ 
            ...prev, 
            isGoogleSyncEnabled: true,
            screen: 'gerenciar-agenda' 
          }));

          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          setTimeout(() => syncWithGoogle(true), 500);
        } catch (err) {
          console.error('[Google Sync] Erro:', err);
        }
      }
    };

    handleOAuthCallback();
  }, [session, authUser?.profileId]);`;

    const oldContent = content.substring(startIdx, endIdx + oldEffectEnd.length);
    content = content.replace(oldContent, newEffect);
    console.log("Sucesso: Bloco de captura corrigido.");
} else {
    console.log("Erro: Não foi possível encontrar o bloco.");
}

// Corrigir também os formatos de data
content = content.replace(/data: start\.toISOString\(\)\.split\('T'\)\[0\]/g, "data: format(start, 'yyyy-MM-dd')");
content = content.replace(/data_fim: end\.toISOString\(\)\.split\('T'\)\[0\]/g, "data_fim: format(end, 'yyyy-MM-dd')");
content = content.replace(/hora_inicio: start\.toTimeString\(\)\.split\(' '\)\[0\]/g, "hora_inicio: format(start, 'HH:mm:ss')");
content = content.replace(/hora_fim: end\.toTimeString\(\)\.split\(' '\)\[0\]/g, "hora_fim: format(end, 'HH:mm:ss')");

fs.writeFileSync(filePath, content, 'utf8');
console.log("Sucesso: Formatos de data corrigidos.");
