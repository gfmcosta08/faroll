import os

file_path = r'd:\farollbr\src\contexts\AppContext.tsx'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Procura o bloco useEffect que começa por volta da linha 237
start_idx = -1
end_idx = -1

for i, line in enumerate(lines):
    if 'Capturar tokens do Google após retorno do OAuth' in line and i > 200:
        start_idx = i
    if start_idx != -1 and '}, [session, state.user?.profileId]);' in line:
        end_idx = i
        break

if start_idx != -1 and end_idx != -1:
    new_effect = """  // Processar retorno do Google OAuth (Captura de Tokens)
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
  }, [session, authUser?.profileId]);
"""
    # Substituir o intervalo
    lines[start_idx:end_idx+1] = [new_effect]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    print("Sucesso: Bloco de captura corrigido.")
else:
    print(f"Erro: Não foi possível encontrar o bloco. Start: {start_idx}, End: {end_idx}")

# Corrigir também o formato de data no syncWithGoogle
with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_data = "data: start.toISOString().split('T')[0]"
new_data = "data: format(start, 'yyyy-MM-dd')"
old_data_fim = "data_fim: end.toISOString().split('T')[0]"
new_data_fim = "data_fim: format(end, 'yyyy-MM-dd')"
old_hora = "hora_inicio: start.toTimeString().split(' ')[0]"
new_hora = "hora_inicio: format(start, 'HH:mm:ss')"
old_hora_fim = "hora_fim: end.toTimeString().split(' ')[0]"
new_hora_fim = "hora_fim: format(end, 'HH:mm:ss')"

content = content.replace(old_data, new_data)
content = content.replace(old_data_fim, new_data_fim)
content = content.replace(old_hora, new_hora)
content = content.replace(old_hora_fim, new_hora_fim)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Sucesso: Formatos de data corrigidos.")
