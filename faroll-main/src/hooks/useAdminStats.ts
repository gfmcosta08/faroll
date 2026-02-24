import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth, format, subDays } from 'date-fns';
import type { SystemAlert } from '@/components/admin/AdminSystemAlerts';

interface UserStats {
  totalUsers: number;
  totalClientes: number;
  totalProfissionais: number;
  totalDependentes: number;
  totalSecretarias: number;
  totalAdmins: number;
}

interface AppointmentStats {
  today: number;
  week: number;
  month: number;
}

interface GcoinStats {
  totalEmitidos: number;
  totalConsumidos: number;
  totalDisponiveis: number;
}

interface RecentUser {
  id: string;
  nome: string;
  email: string | null;
  created_at: string;
  role: string;
}

export function useAdminStats() {
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [appointmentStats, setAppointmentStats] = useState<AppointmentStats | null>(null);
  const [gcoinStats, setGcoinStats] = useState<GcoinStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [alerts, setAlerts] = useState<SystemAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const todayStart = format(startOfDay(now), 'yyyy-MM-dd');
      const todayEnd = format(endOfDay(now), 'yyyy-MM-dd');
      const weekStart = format(startOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const weekEnd = format(endOfWeek(now, { weekStartsOn: 0 }), 'yyyy-MM-dd');
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd');

      // Fetch all data in parallel
      const [
        rolesRes,
        profilesRes,
        todayAppointmentsRes,
        weekAppointmentsRes,
        monthAppointmentsRes,
        gcoinsRes,
        lateCancellationsRes,
        auditLogsRes
      ] = await Promise.all([
        // User roles
        supabase.from('user_roles').select('role'),
        
        // Recent profiles
        supabase
          .from('profiles')
          .select('id, nome, email, created_at, user_id')
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Appointments today
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('tipo', 'agendamento')
          .gte('data', todayStart)
          .lte('data', todayEnd),
        
        // Appointments this week
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('tipo', 'agendamento')
          .gte('data', weekStart)
          .lte('data', weekEnd),
        
        // Appointments this month
        supabase
          .from('calendar_events')
          .select('id', { count: 'exact', head: true })
          .eq('tipo', 'agendamento')
          .gte('data', monthStart)
          .lte('data', monthEnd),
        
        // Gcoins
        supabase.from('gcoins').select('quantidade, consumido, disponivel'),
        
        // Late cancellations (from audit_logs)
        supabase
          .from('audit_logs')
          .select('*')
          .eq('acao', 'cancelamento_tardio')
          .gte('created_at', format(subDays(now, 7), 'yyyy-MM-dd'))
          .order('created_at', { ascending: false })
          .limit(10),
        
        // Recent audit logs for errors
        supabase
          .from('audit_logs')
          .select('*')
          .in('acao', ['erro_sistema', 'falha_login'])
          .gte('created_at', format(subDays(now, 7), 'yyyy-MM-dd'))
          .order('created_at', { ascending: false })
          .limit(10)
      ]);

      // Process user stats
      const roles = rolesRes.data || [];
      setUserStats({
        totalUsers: roles.length,
        totalClientes: roles.filter(r => r.role === 'cliente').length,
        totalProfissionais: roles.filter(r => r.role === 'profissional').length,
        totalDependentes: roles.filter(r => r.role === 'dependente').length,
        totalSecretarias: roles.filter(r => r.role === 'secretaria').length,
        totalAdmins: roles.filter(r => r.role === 'admin').length,
      });

      // Process recent users with roles
      const profiles = profilesRes.data || [];
      if (profiles.length > 0) {
        const userIds = profiles.map(p => p.user_id);
        const { data: userRoles } = await supabase
          .from('user_roles')
          .select('user_id, role')
          .in('user_id', userIds);

        const usersWithRoles = profiles.map(p => ({
          id: p.id,
          nome: p.nome,
          email: p.email,
          created_at: p.created_at,
          role: userRoles?.find(r => r.user_id === p.user_id)?.role || 'cliente',
        }));
        setRecentUsers(usersWithRoles);
      }

      // Process appointment stats
      setAppointmentStats({
        today: todayAppointmentsRes.count || 0,
        week: weekAppointmentsRes.count || 0,
        month: monthAppointmentsRes.count || 0,
      });

      // Process Gcoin stats
      const gcoins = gcoinsRes.data || [];
      setGcoinStats({
        totalEmitidos: gcoins.reduce((sum, g) => sum + (g.quantidade || 0), 0),
        totalConsumidos: gcoins.reduce((sum, g) => sum + (g.consumido || 0), 0),
        totalDisponiveis: gcoins.reduce((sum, g) => sum + (g.disponivel || 0), 0),
      });

      // Process alerts
      const systemAlerts: SystemAlert[] = [];
      
      // Late cancellations
      (lateCancellationsRes.data || []).forEach((log) => {
        systemAlerts.push({
          id: log.id,
          type: 'late_cancellation',
          title: 'Cancelamento Tardio',
          description: log.descricao || `Usuário ${log.user_nome || 'desconhecido'} cancelou agendamento fora do prazo`,
          severity: 'warning',
          timestamp: new Date(log.created_at),
          metadata: { user_id: log.user_id, entidade_id: log.entidade_id }
        });
      });

      // System errors and login failures
      (auditLogsRes.data || []).forEach((log) => {
        if (log.acao === 'erro_sistema') {
          systemAlerts.push({
            id: log.id,
            type: 'system_error',
            title: 'Erro de Sistema',
            description: log.descricao || 'Erro detectado no sistema',
            severity: 'error',
            timestamp: new Date(log.created_at),
          });
        } else if (log.acao === 'falha_login') {
          systemAlerts.push({
            id: log.id,
            type: 'login_failure',
            title: 'Falha de Login',
            description: log.descricao || 'Múltiplas tentativas de login falharam',
            severity: 'warning',
            timestamp: new Date(log.created_at),
          });
        }
      });

      // Sort alerts by timestamp (most recent first)
      systemAlerts.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setAlerts(systemAlerts);

    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    fetchStats();
  }, [fetchStats]);

  return {
    userStats,
    appointmentStats,
    gcoinStats,
    recentUsers,
    alerts,
    loading,
    refreshing,
    refresh,
  };
}
