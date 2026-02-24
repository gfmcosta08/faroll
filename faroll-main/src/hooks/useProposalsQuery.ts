import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface Proposal {
  id: string;
  professional_id: string;
  client_id: string;
  valor_acordado: number;
  quantidade_gcoins: number;
  descricao_acordo: string | null;
  antecedencia_minima: number | null;
  prazo_cancelamento: number | null;
  comprovante_anexo: string | null;
  status: string;
  data_criacao: string;
  data_resposta: string | null;
}

/**
 * Hook para buscar propostas do usuário
 */
export function useProposalsQuery() {
  const { user } = useAuthContext();
  const profileId = user?.profileId;
  
  return useQuery({
    queryKey: ['proposals', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .or(`professional_id.eq.${profileId},client_id.eq.${profileId}`)
        .order('data_criacao', { ascending: false });
      
      if (error) throw error;
      return data as Proposal[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60,
  });
}

/**
 * Hook para buscar proposta de um profissional específico
 */
export function useProposalForProfessional(professionalId: string | undefined) {
  const { user } = useAuthContext();
  const profileId = user?.profileId;
  
  return useQuery({
    queryKey: ['proposal', professionalId, profileId],
    queryFn: async () => {
      if (!profileId || !professionalId) return null;
      
      // Busca proposta onde o usuário é cliente ou profissional
      const { data, error } = await supabase
        .from('proposals')
        .select('*')
        .eq('professional_id', professionalId)
        .or(`client_id.eq.${profileId},professional_id.eq.${profileId}`)
        .order('data_criacao', { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data as Proposal | null;
    },
    enabled: !!profileId && !!professionalId,
  });
}

/**
 * Hook para enviar proposta (profissional → cliente)
 */
export function useSendProposal() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const profileId = user?.profileId;
  
  return useMutation({
    mutationFn: async (proposal: {
      client_id: string;
      valor_acordado: number;
      quantidade_gcoins: number;
      descricao_acordo?: string;
      antecedencia_minima?: number;
      prazo_cancelamento?: number;
      comprovante_anexo?: string;
    }) => {
      if (!profileId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('proposals')
        .insert({
          professional_id: profileId,
          client_id: proposal.client_id,
          valor_acordado: proposal.valor_acordado,
          quantidade_gcoins: proposal.quantidade_gcoins,
          descricao_acordo: proposal.descricao_acordo,
          antecedencia_minima: proposal.antecedencia_minima,
          prazo_cancelamento: proposal.prazo_cancelamento,
          comprovante_anexo: proposal.comprovante_anexo,
          status: 'enviada',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal'] });
    },
  });
}

/**
 * Hook para responder proposta (cliente aceita ou recusa)
 * NOTA: Trigger on_proposal_accepted libera Gcoins automaticamente quando aceita
 */
export function useRespondProposal() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ proposalId, accept }: { proposalId: string; accept: boolean }) => {
      const { data, error } = await supabase
        .from('proposals')
        .update({ status: accept ? 'aceita' : 'recusada' })
        .eq('id', proposalId)
        .select()
        .single();
      
      if (error) throw error;
      return data as Proposal;
    },
    onSuccess: () => {
      // Invalida todos os caches relacionados
      queryClient.invalidateQueries({ queryKey: ['proposals'] });
      queryClient.invalidateQueries({ queryKey: ['proposal'] });
      queryClient.invalidateQueries({ queryKey: ['gcoins'] });
      queryClient.invalidateQueries({ queryKey: ['gcoin-balance'] });
      queryClient.invalidateQueries({ queryKey: ['can-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['professional-links'] });
    },
  });
}
