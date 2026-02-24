import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Solicitacao {
  id: string; // Unique key: `${client_id}|${professional_id}`
  clientId: string;
  clientNome: string;
  clientAvatar: string | null;
  professionalId: string;
  professionalNome: string;
  professionalAvatar: string | null;
  primeiraMensagem: string;
  primeiraMensagemData: string;
  totalMensagens: number;
  ultimaMensagemData: string;
  respondida: boolean; // true se profissional respondeu
}

/**
 * Hook para buscar solicitações de contato (conversas sem proposta aceita)
 * 
 * LÓGICA:
 * - Busca todas as conversas (chat_messages agrupadas por client_id + professional_id)
 * - Filtra aquelas onde NÃO existe proposta aceita (proposals.status = 'aceita')
 * - Retorna lista de solicitações com dados do cliente/profissional
 */
export function useSolicitacoes() {
  const { user } = useAuthContext();
  
  return useQuery({
    queryKey: ['solicitacoes', user?.profileId],
    queryFn: async (): Promise<Solicitacao[]> => {
      if (!user?.profileId) return [];
      
      const myProfileId = user.profileId;
      const isProfessional = user.role === 'profissional';
      
      // 1. Buscar todas as conversas onde sou participante
      // Agrupa por client_id + professional_id
      const { data: messages, error: messagesError } = await supabase
        .from('chat_messages')
        .select(`
          id,
          professional_id,
          client_id,
          sender_id,
          content,
          created_at
        `)
        .or(isProfessional 
          ? `professional_id.eq.${myProfileId}` 
          : `client_id.eq.${myProfileId}`)
        .order('created_at', { ascending: true });
      
      if (messagesError) {
        console.error('Erro ao buscar mensagens:', messagesError);
        throw messagesError;
      }
      
      if (!messages || messages.length === 0) return [];
      
      // 2. Agrupar mensagens por conversa (client_id + professional_id)
      const conversasMap = new Map<string, typeof messages>();
      
      for (const msg of messages) {
        const key = `${msg.client_id}|${msg.professional_id}`;
        if (!conversasMap.has(key)) {
          conversasMap.set(key, []);
        }
        conversasMap.get(key)!.push(msg);
      }
      
      // 3. Buscar propostas aceitas para filtrar
      const { data: propostasAceitas } = await supabase
        .from('proposals')
        .select('client_id, professional_id')
        .eq('status', 'aceita');
      
      const propostasAceitasSet = new Set(
        (propostasAceitas || []).map(p => `${p.client_id}|${p.professional_id}`)
      );
      
      // 4. Filtrar conversas que NÃO têm proposta aceita
      const conversasSemProposta = Array.from(conversasMap.entries())
        .filter(([key]) => !propostasAceitasSet.has(key));
      
      if (conversasSemProposta.length === 0) return [];
      
      // 5. Buscar dados dos perfis envolvidos
      const allProfileIds = new Set<string>();
      for (const [key] of conversasSemProposta) {
        const [clientId, professionalId] = key.split('|');
        allProfileIds.add(clientId);
        allProfileIds.add(professionalId);
      }
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome, avatar_url')
        .in('id', Array.from(allProfileIds));
      
      const profilesMap = new Map(
        (profiles || []).map(p => [p.id, p])
      );
      
      // 6. Montar lista de solicitações
      const solicitacoes: Solicitacao[] = conversasSemProposta.map(([key, msgs]) => {
        const [clientId, professionalId] = key.split('|');
        const clientProfile = profilesMap.get(clientId);
        const professionalProfile = profilesMap.get(professionalId);
        
        const primeiraMensagem = msgs[0];
        const ultimaMensagem = msgs[msgs.length - 1];
        
        // Verificar se o profissional já respondeu
        const respondida = msgs.some(m => m.sender_id === professionalId);
        
        return {
          id: key,
          clientId,
          clientNome: clientProfile?.nome || 'Cliente',
          clientAvatar: clientProfile?.avatar_url || null,
          professionalId,
          professionalNome: professionalProfile?.nome || 'Profissional',
          professionalAvatar: professionalProfile?.avatar_url || null,
          primeiraMensagem: primeiraMensagem.content,
          primeiraMensagemData: primeiraMensagem.created_at,
          totalMensagens: msgs.length,
          ultimaMensagemData: ultimaMensagem.created_at,
          respondida,
        };
      });
      
      // Ordenar por data da última mensagem (mais recente primeiro)
      solicitacoes.sort((a, b) => 
        new Date(b.ultimaMensagemData).getTime() - new Date(a.ultimaMensagemData).getTime()
      );
      
      return solicitacoes;
    },
    enabled: !!user?.profileId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para contar solicitações não respondidas (para badge)
 */
export function useSolicitacoesCount() {
  const { data: solicitacoes } = useSolicitacoes();
  
  const naoRespondidas = solicitacoes?.filter(s => !s.respondida).length || 0;
  const total = solicitacoes?.length || 0;
  
  return { naoRespondidas, total };
}
