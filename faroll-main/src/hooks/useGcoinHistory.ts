import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/contexts/AuthContext';

export type GcoinTransactionType = 'liberacao' | 'consumo' | 'extorno';

export interface GcoinTransaction {
  id: string;
  tipo: GcoinTransactionType;
  quantidade: number;
  data: Date;
  descricao: string;
  appointmentId?: string;
}

export interface GcoinHistoryData {
  professionalId: string;
  professionalNome?: string;
  clientId: string;
  clientNome?: string;
  saldoAtual: number;
  totalLiberado: number;
  totalConsumido: number;
  transactions: GcoinTransaction[];
}

/**
 * Hook para buscar histórico completo de Gcoins de um vínculo
 */
export function useGcoinHistory(professionalId: string | undefined) {
  const { user } = useAuthContext();
  const profileId = user?.profileId;
  
  return useQuery({
    queryKey: ['gcoin-history', professionalId, profileId],
    queryFn: async (): Promise<GcoinHistoryData | null> => {
      if (!profileId || !professionalId) return null;
      
      // Busca o registro de Gcoin do vínculo
      const { data: gcoinData, error: gcoinError } = await supabase
        .from('gcoins')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('client_id', profileId)
        .maybeSingle();
      
      if (gcoinError) throw gcoinError;
      
      // Se não há Gcoins, retorna vazio
      if (!gcoinData) {
        return {
          professionalId,
          clientId: profileId,
          saldoAtual: 0,
          totalLiberado: 0,
          totalConsumido: 0,
          transactions: [],
        };
      }
      
      // Busca agendamentos para montar histórico de consumos/extornos
      const { data: appointments, error: appointmentsError } = await supabase
        .from('calendar_events')
        .select('id, data, hora_inicio, status, gcoin_consumido, created_at, titulo')
        .eq('professional_id', professionalId)
        .eq('client_id', profileId)
        .eq('tipo', 'agendamento')
        .order('created_at', { ascending: false });
      
      if (appointmentsError) throw appointmentsError;
      
      const transactions: GcoinTransaction[] = [];
      
      // Adiciona liberação inicial
      transactions.push({
        id: `lib-${gcoinData.id}`,
        tipo: 'liberacao',
        quantidade: gcoinData.quantidade,
        data: new Date(gcoinData.data_liberacao),
        descricao: `Liberação de ${gcoinData.quantidade} Gcoins`,
      });
      
      // Processa agendamentos para consumos e extornos
      appointments?.forEach((apt) => {
        const aptDate = new Date(apt.created_at);
        
        if (apt.status === 'cancelado') {
          if (apt.gcoin_consumido === false) {
            // Cancelado COM extorno (gcoin devolvido)
            transactions.push({
              id: `ext-${apt.id}`,
              tipo: 'extorno',
              quantidade: 1,
              data: aptDate,
              descricao: `Extorno - Cancelamento dentro do prazo`,
              appointmentId: apt.id,
            });
            // Também houve consumo antes
            transactions.push({
              id: `con-${apt.id}`,
              tipo: 'consumo',
              quantidade: 1,
              data: aptDate,
              descricao: `Agendamento: ${apt.titulo || 'Consulta'}`,
              appointmentId: apt.id,
            });
          } else if (apt.gcoin_consumido === true) {
            // Cancelado SEM extorno (gcoin perdido)
            transactions.push({
              id: `con-${apt.id}`,
              tipo: 'consumo',
              quantidade: 1,
              data: aptDate,
              descricao: `Consumo perdido - Cancelamento fora do prazo`,
              appointmentId: apt.id,
            });
          }
        } else if (apt.gcoin_consumido === true) {
          // Agendamento ativo com consumo
          transactions.push({
            id: `con-${apt.id}`,
            tipo: 'consumo',
            quantidade: 1,
            data: aptDate,
            descricao: `Agendamento: ${apt.titulo || 'Consulta'} - ${apt.data}`,
            appointmentId: apt.id,
          });
        }
      });
      
      // Ordena por data (mais recente primeiro)
      transactions.sort((a, b) => b.data.getTime() - a.data.getTime());
      
      return {
        professionalId,
        clientId: profileId,
        saldoAtual: gcoinData.disponivel ?? 0,
        totalLiberado: gcoinData.quantidade,
        totalConsumido: gcoinData.consumido,
        transactions,
      };
    },
    enabled: !!profileId && !!professionalId,
  });
}
