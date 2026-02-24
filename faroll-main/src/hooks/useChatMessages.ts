import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  professional_id: string;
  client_id: string;
  sender_id: string;
  content: string;
  attachment: string | null;
  created_at: string;
}

interface SendMessagePayload {
  professionalId: string;
  clientId: string;
  senderId: string;
  content: string;
  attachment?: string;
}

/**
 * Hook para buscar mensagens persistidas entre cliente e profissional
 * RLS garante que apenas participantes (ou admin) podem ver as mensagens
 */
export function useChatMessages(professionalId: string | undefined, clientId: string | undefined) {
  return useQuery({
    queryKey: ['chat-messages', professionalId, clientId],
    queryFn: async (): Promise<ChatMessage[]> => {
      if (!professionalId || !clientId) return [];
      
      const { data, error } = await supabase
        .from('chat_messages')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: true });
      
      if (error) {
        console.error('Erro ao buscar mensagens:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!professionalId && !!clientId,
    staleTime: 1000 * 30, // 30 segundos
  });
}

/**
 * Hook para enviar nova mensagem (persiste no banco)
 * RLS garante que apenas participantes podem enviar mensagens
 */
export function useSendChatMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (payload: SendMessagePayload): Promise<ChatMessage> => {
      const { data, error } = await supabase
        .from('chat_messages')
        .insert({
          professional_id: payload.professionalId,
          client_id: payload.clientId,
          sender_id: payload.senderId,
          content: payload.content,
          attachment: payload.attachment || null,
        })
        .select()
        .single();
      
      if (error) {
        console.error('Erro ao enviar mensagem:', error);
        throw error;
      }
      
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalida cache para atualizar lista de mensagens
      queryClient.invalidateQueries({
        queryKey: ['chat-messages', variables.professionalId, variables.clientId]
      });
    },
  });
}

/**
 * Hook para buscar o nome de um perfil pelo ID
 */
export function useProfileName(profileId: string | undefined) {
  return useQuery({
    queryKey: ['profile-name', profileId],
    queryFn: async () => {
      if (!profileId) return null;
      
      const { data, error } = await supabase
        .from('profiles')
        .select('nome')
        .eq('id', profileId)
        .maybeSingle();
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
        return null;
      }
      
      return data?.nome || 'Usuário';
    },
    enabled: !!profileId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}
