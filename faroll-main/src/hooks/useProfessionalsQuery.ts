import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProfessionalProfile {
  id: string;
  nome: string;
  email: string | null;
  avatar_url: string | null;
  profissao: string | null;
  profession_ids: string[] | null;
  especialidades: string[] | null;
  specialization_ids: string[] | null;
  target_audience_ids: string[] | null;
  pais: string | null;
  estado: string | null;
  cidade: string | null;
  tipo_atendimento: string | null;
  descricao: string | null;
  registro: string | null;
  antecedencia_agendamento: number | null;
  antecedencia_cancelamento: number | null;
}

// Busca profissionais reais do banco de dados
export function useProfessionalsQuery() {
  return useQuery({
    queryKey: ['professionals'],
    queryFn: async (): Promise<ProfessionalProfile[]> => {
      // Busca profiles que têm role = 'profissional'
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'profissional');

      if (rolesError) {
        console.error('Erro ao buscar roles:', rolesError);
        return [];
      }

      if (!roles || roles.length === 0) {
        return [];
      }

      const userIds = roles.map(r => r.user_id);

      // Busca os profiles dos profissionais
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select(`
          id,
          nome,
          email,
          avatar_url,
          profissao,
          profession_ids,
          especialidades,
          specialization_ids,
          target_audience_ids,
          pais,
          estado,
          cidade,
          tipo_atendimento,
          descricao,
          registro,
          antecedencia_agendamento,
          antecedencia_cancelamento
        `)
        .in('user_id', userIds);

      if (profilesError) {
        console.error('Erro ao buscar profiles:', profilesError);
        return [];
      }

      return profiles || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

// Busca especializações únicas dos profissionais cadastrados
export function useSpecializationsQuery() {
  return useQuery({
    queryKey: ['specializations'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('especialidades')
        .not('especialidades', 'is', null);

      if (error) {
        console.error('Erro ao buscar especializações:', error);
        return [];
      }

      const allSpecs = data?.flatMap(p => p.especialidades || []) || [];
      return [...new Set(allSpecs)].sort();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Busca profissões únicas dos profissionais cadastrados
export function useProfessionsQuery() {
  return useQuery({
    queryKey: ['professions-in-use'],
    queryFn: async (): Promise<string[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('profissao')
        .not('profissao', 'is', null);

      if (error) {
        console.error('Erro ao buscar profissões:', error);
        return [];
      }

      const allProfs = data?.map(p => p.profissao).filter(Boolean) as string[] || [];
      return [...new Set(allProfs)].sort();
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Busca localizações únicas dos profissionais cadastrados
export function useLocationsQuery() {
  return useQuery({
    queryKey: ['locations-in-use'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('pais, estado, cidade')
        .not('profissao', 'is', null); // Apenas profissionais

      if (error) {
        console.error('Erro ao buscar localizações:', error);
        return { paises: [], estados: [], cidades: [] };
      }

      const paises = [...new Set(data?.map(p => p.pais).filter(Boolean) as string[])].sort();
      const estados = [...new Set(data?.map(p => p.estado).filter(Boolean) as string[])].sort();
      const cidades = [...new Set(data?.map(p => p.cidade).filter(Boolean) as string[])].sort();

      return { paises, estados, cidades };
    },
    staleTime: 1000 * 60 * 5,
  });
}
