import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export interface GcoinBalance {
  id: string;
  professional_id: string;
  client_id: string;
  quantidade: number;
  consumido: number;
  disponivel: number;
  proposta_id: string | null;
}

/**
 * Hook para consultar saldo de Gcoins em tempo real
 */
export function useGcoinsQuery() {
  const { user } = useAuthContext();
  const profileId = user?.profileId;
  
  return useQuery({
    queryKey: ['gcoins', profileId],
    queryFn: async () => {
      if (!profileId) return [];
      
      const { data, error } = await supabase
        .from('gcoins')
        .select('*')
        .or(`professional_id.eq.${profileId},client_id.eq.${profileId}`);
      
      if (error) throw error;
      return data as GcoinBalance[];
    },
    enabled: !!profileId,
    staleTime: 1000 * 60, // 1 minuto
  });
}

/**
 * Hook para verificar saldo de Gcoin em um vínculo específico
 */
export function useGcoinBalanceForLink(professionalId: string | undefined) {
  const { user } = useAuthContext();
  const profileId = user?.profileId;
  
  return useQuery({
    queryKey: ['gcoin-balance', professionalId, profileId],
    queryFn: async () => {
      if (!profileId || !professionalId) return null;
      
      // Busca o Gcoin onde o usuário é o cliente (consumidor)
      const { data, error } = await supabase
        .from('gcoins')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('client_id', profileId)
        .maybeSingle();
      
      if (error) throw error;
      return data as GcoinBalance | null;
    },
    enabled: !!profileId && !!professionalId,
  });
}

/**
 * Hook para verificar se o usuário pode agendar com um profissional
 * Baseado na Regra de Ouro: só quem possui Gcoins pode agendar
 */
export function useCanScheduleWithProfessional(professionalId: string | undefined) {
  const { user } = useAuthContext();
  const profileId = user?.profileId;
  const role = user?.role;
  
  return useQuery({
    queryKey: ['can-schedule', professionalId, profileId],
    queryFn: async () => {
      if (!profileId || !professionalId) return false;
      
      // Dependente nunca pode agendar
      if (role === 'dependente') return false;
      
      // Verifica se o usuário é o CONSUMIDOR (cliente) no vínculo E tem saldo
      const { data, error } = await supabase
        .from('gcoins')
        .select('disponivel, client_id, professional_id')
        .eq('professional_id', professionalId)
        .eq('client_id', profileId)
        .gt('disponivel', 0)
        .maybeSingle();
      
      if (error) {
        console.error('[Gcoin] Erro ao verificar permissão:', error);
        return false;
      }
      
      // Só pode agendar se encontrou um registro (é consumidor) e tem saldo > 0
      return data !== null;
    },
    enabled: !!profileId && !!professionalId,
  });
}

/**
 * Hook para criar agendamento (com consumo automático de Gcoin via trigger)
 */
export function useCreateAppointment() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const profileId = user?.profileId;
  
  return useMutation({
    mutationFn: async (appointment: {
      professional_id: string;
      data: string; // YYYY-MM-DD
      hora_inicio: string; // HH:MM
      titulo?: string;
    }) => {
      if (!profileId) throw new Error('Usuário não autenticado');
      
      const { data, error } = await supabase
        .from('calendar_events')
        .insert({
          user_id: profileId,
          professional_id: appointment.professional_id,
          client_id: profileId,
          tipo: 'agendamento',
          data: appointment.data,
          hora_inicio: appointment.hora_inicio,
          titulo: appointment.titulo || 'Consulta',
          status: 'agendado',
        })
        .select()
        .single();
      
      if (error) {
        // Erro do trigger: saldo insuficiente
        if (error.message?.includes('Saldo insuficiente')) {
          throw new Error('Saldo insuficiente de Gcoins para este vínculo');
        }
        throw error;
      }
      
      return data;
    },
    onSuccess: () => {
      // Invalida cache de Gcoins e agendamentos
      queryClient.invalidateQueries({ queryKey: ['gcoins'] });
      queryClient.invalidateQueries({ queryKey: ['gcoin-balance'] });
      queryClient.invalidateQueries({ queryKey: ['can-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

/**
 * Hook para cancelar agendamento (com extorno condicional via trigger)
 */
export function useCancelAppointment() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const { data, error } = await supabase
        .from('calendar_events')
        .update({ status: 'cancelado' })
        .eq('id', appointmentId)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalida cache de Gcoins e agendamentos
      queryClient.invalidateQueries({ queryKey: ['gcoins'] });
      queryClient.invalidateQueries({ queryKey: ['gcoin-balance'] });
      queryClient.invalidateQueries({ queryKey: ['can-schedule'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
