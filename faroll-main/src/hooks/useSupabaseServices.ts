import { supabase } from '@/integrations/supabase/client';
import { useCallback } from 'react';

// ============= TIPOS =============
export interface SupabaseGcoin {
  id: string;
  professional_id: string;
  client_id: string;
  quantidade: number;
  consumido: number;
  disponivel: number | null;
  proposta_id: string | null;
  data_liberacao: string;
}

export interface SupabaseProposal {
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

export interface SupabaseAppointment {
  id: string;
  user_id: string;
  professional_id: string | null;
  client_id: string | null;
  dependent_id: string | null;
  tipo: string;
  titulo: string | null;
  descricao: string | null;
  data: string;
  hora_inicio: string | null;
  hora_fim: string | null;
  status: string | null;
  gcoin_consumido: boolean | null;
  motivo: string | null;
  data_fim: string | null;
  faixas_horario: unknown;
  created_at: string;
}

export interface SupabaseProfile {
  id: string;
  user_id: string;
  nome: string;
  email: string | null;
  antecedencia_agendamento: number | null;
  antecedencia_cancelamento: number | null;
}

// ============= HOOK PRINCIPAL =============
export function useSupabaseServices(profileId: string | undefined) {
  
  // ============= PROPOSTAS =============
  
  /**
   * Busca propostas do usuário (como profissional ou cliente)
   */
  const fetchProposals = useCallback(async () => {
    if (!profileId) return [];
    
    const { data, error } = await supabase
      .from('proposals')
      .select('*')
      .or(`professional_id.eq.${profileId},client_id.eq.${profileId}`)
      .order('data_criacao', { ascending: false });
    
    if (error) {
      console.error('[Supabase] Erro ao buscar propostas:', error);
      return [];
    }
    
    return data as SupabaseProposal[];
  }, [profileId]);
  
  /**
   * Envia uma proposta (profissional → cliente)
   */
  const sendProposal = useCallback(async (proposal: {
    professional_id: string;
    client_id: string;
    valor_acordado: number;
    quantidade_gcoins: number;
    descricao_acordo?: string;
    antecedencia_minima?: number;
    prazo_cancelamento?: number;
    comprovante_anexo?: string;
  }) => {
    const { data, error } = await supabase
      .from('proposals')
      .insert({
        ...proposal,
        status: 'enviada',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao enviar proposta:', error);
      return null;
    }
    
    return data as SupabaseProposal;
  }, []);
  
  /**
   * Responde a uma proposta (cliente aceita ou recusa)
   * NOTA: Trigger on_proposal_accepted libera Gcoins automaticamente
   */
  const respondProposal = useCallback(async (proposalId: string, accept: boolean) => {
    const newStatus = accept ? 'aceita' : 'recusada';
    
    const { data, error } = await supabase
      .from('proposals')
      .update({ 
        status: newStatus,
        // data_resposta é atualizada pelo trigger
      })
      .eq('id', proposalId)
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao responder proposta:', error);
      return null;
    }
    
    return data as SupabaseProposal;
  }, []);
  
  // ============= GCOINS =============
  
  /**
   * Busca Gcoins do usuário (como profissional ou cliente)
   */
  const fetchGcoins = useCallback(async () => {
    if (!profileId) return [];
    
    const { data, error } = await supabase
      .from('gcoins')
      .select('*')
      .or(`professional_id.eq.${profileId},client_id.eq.${profileId}`);
    
    if (error) {
      console.error('[Supabase] Erro ao buscar Gcoins:', error);
      return [];
    }
    
    return data as SupabaseGcoin[];
  }, [profileId]);
  
  /**
   * Busca saldo de Gcoins para um vínculo específico
   */
  const getGcoinBalance = useCallback(async (professionalId: string, clientId: string) => {
    const { data, error } = await supabase
      .from('gcoins')
      .select('disponivel, consumido, quantidade')
      .eq('professional_id', professionalId)
      .eq('client_id', clientId)
      .maybeSingle();
    
    if (error) {
      console.error('[Supabase] Erro ao buscar saldo:', error);
      return null;
    }
    
    return data;
  }, []);
  
  // ============= AGENDAMENTOS =============
  
  /**
   * Cria um agendamento
   * NOTA: Trigger on_appointment_created consome Gcoin automaticamente
   */
  const createAppointment = useCallback(async (appointment: {
    professional_id: string;
    client_id: string;
    data: string; // formato YYYY-MM-DD
    hora_inicio: string; // formato HH:MM
    titulo?: string;
  }) => {
    if (!profileId) return { success: false, error: 'Usuário não autenticado' };
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: profileId,
        professional_id: appointment.professional_id,
        client_id: appointment.client_id,
        tipo: 'agendamento',
        data: appointment.data,
        hora_inicio: appointment.hora_inicio,
        titulo: appointment.titulo || 'Consulta',
        status: 'agendado',
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao criar agendamento:', error);
      // Erro comum: saldo insuficiente (trigger bloqueia)
      if (error.message?.includes('Saldo insuficiente')) {
        return { success: false, error: 'Saldo insuficiente de Gcoins' };
      }
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as SupabaseAppointment };
  }, [profileId]);
  
  /**
   * Cancela um agendamento
   * NOTA: Trigger on_appointment_cancelled faz extorno condicional
   */
  const cancelAppointment = useCallback(async (appointmentId: string) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .update({ status: 'cancelado' })
      .eq('id', appointmentId)
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao cancelar agendamento:', error);
      return { success: false, error: error.message };
    }
    
    return { success: true, data: data as SupabaseAppointment };
  }, []);
  
  /**
   * Busca agendamentos do usuário
   */
  const fetchAppointments = useCallback(async () => {
    if (!profileId) return [];
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('tipo', 'agendamento')
      .or(`professional_id.eq.${profileId},client_id.eq.${profileId}`)
      .neq('status', 'cancelado')
      .order('data', { ascending: true });
    
    if (error) {
      console.error('[Supabase] Erro ao buscar agendamentos:', error);
      return [];
    }
    
    return data as SupabaseAppointment[];
  }, [profileId]);
  
  /**
   * Busca configurações de antecedência do profissional
   */
  const getProfessionalSettings = useCallback(async (professionalId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('antecedencia_agendamento, antecedencia_cancelamento')
      .eq('id', professionalId)
      .maybeSingle();
    
    if (error) {
      console.error('[Supabase] Erro ao buscar configurações:', error);
      return null;
    }
    
    return {
      antecedenciaAgendamento: data?.antecedencia_agendamento ?? 1440,
      antecedenciaCancelamento: data?.antecedencia_cancelamento ?? 2880,
    };
  }, []);
  
  // ============= BLOQUEIOS =============
  
  /**
   * Busca bloqueios de agenda de um profissional
   */
  const fetchScheduleBlocks = useCallback(async (professionalId: string) => {
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', professionalId)
      .in('tipo', ['bloqueio_dia', 'bloqueio_periodo'])
      .order('data', { ascending: true });
    
    if (error) {
      console.error('[Supabase] Erro ao buscar bloqueios:', error);
      return [];
    }
    
    return data;
  }, []);
  
  /**
   * Cria um bloqueio de agenda
   */
  const createScheduleBlock = useCallback(async (block: {
    tipo: 'bloqueio_dia' | 'bloqueio_periodo';
    data: string;
    data_fim?: string;
    faixas_horario?: Array<{ horaInicio: string; horaFim: string }>;
    motivo?: string;
  }) => {
    if (!profileId) return null;
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: profileId,
        professional_id: profileId,
        tipo: block.tipo,
        data: block.data,
        data_fim: block.data_fim,
        faixas_horario: block.faixas_horario,
        motivo: block.motivo,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao criar bloqueio:', error);
      return null;
    }
    
    return data;
  }, [profileId]);
  
  /**
   * Remove um bloqueio de agenda
   */
  const deleteScheduleBlock = useCallback(async (blockId: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', blockId);
    
    if (error) {
      console.error('[Supabase] Erro ao remover bloqueio:', error);
      return false;
    }
    
    return true;
  }, []);
  
  // ============= EVENTOS PESSOAIS =============
  
  /**
   * Busca eventos pessoais do usuário
   */
  const fetchPersonalEvents = useCallback(async () => {
    if (!profileId) return [];
    
    const { data, error } = await supabase
      .from('calendar_events')
      .select('*')
      .eq('user_id', profileId)
      .eq('tipo', 'evento')
      .order('data', { ascending: true });
    
    if (error) {
      console.error('[Supabase] Erro ao buscar eventos:', error);
      return [];
    }
    
    return data;
  }, [profileId]);
  
  /**
   * Cria um evento pessoal
   */
  const createPersonalEvent = useCallback(async (event: {
    titulo: string;
    descricao?: string;
    data: string;
    hora_inicio?: string;
    hora_fim?: string;
  }) => {
    if (!profileId) return null;
    
    const { data, error } = await supabase
      .from('calendar_events')
      .insert({
        user_id: profileId,
        tipo: 'evento',
        titulo: event.titulo,
        descricao: event.descricao,
        data: event.data,
        hora_inicio: event.hora_inicio,
        hora_fim: event.hora_fim,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao criar evento:', error);
      return null;
    }
    
    return data;
  }, [profileId]);
  
  /**
   * Remove um evento pessoal
   */
  const deletePersonalEvent = useCallback(async (eventId: string) => {
    const { error } = await supabase
      .from('calendar_events')
      .delete()
      .eq('id', eventId);
    
    if (error) {
      console.error('[Supabase] Erro ao remover evento:', error);
      return false;
    }
    
    return true;
  }, []);
  
  // ============= VÍNCULOS =============
  
  /**
   * Busca vínculos profissional-cliente
   */
  const fetchProfessionalLinks = useCallback(async () => {
    if (!profileId) return [];
    
    const { data, error } = await supabase
      .from('professional_client_links')
      .select(`
        *,
        professional:profiles!professional_client_links_professional_id_fkey(id, nome, avatar_url),
        client:profiles!professional_client_links_client_id_fkey(id, nome, avatar_url)
      `)
      .or(`professional_id.eq.${profileId},client_id.eq.${profileId}`);
    
    if (error) {
      console.error('[Supabase] Erro ao buscar vínculos:', error);
      return [];
    }
    
    return data;
  }, [profileId]);
  
  /**
   * Cria um vínculo profissional-cliente
   */
  const createProfessionalLink = useCallback(async (clientId: string) => {
    if (!profileId) return null;
    
    const { data, error } = await supabase
      .from('professional_client_links')
      .insert({
        professional_id: profileId,
        client_id: clientId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('[Supabase] Erro ao criar vínculo:', error);
      return null;
    }
    
    return data;
  }, [profileId]);
  
  return {
    // Propostas
    fetchProposals,
    sendProposal,
    respondProposal,
    // Gcoins
    fetchGcoins,
    getGcoinBalance,
    // Agendamentos
    createAppointment,
    cancelAppointment,
    fetchAppointments,
    getProfessionalSettings,
    // Bloqueios
    fetchScheduleBlocks,
    createScheduleBlock,
    deleteScheduleBlock,
    // Eventos pessoais
    fetchPersonalEvents,
    createPersonalEvent,
    deletePersonalEvent,
    // Vínculos
    fetchProfessionalLinks,
    createProfessionalLink,
  };
}
