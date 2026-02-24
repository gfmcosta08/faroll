import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  LayoutDashboard,
  ArrowLeft,
  RefreshCw,
  LogOut,
  Users,
  Briefcase,
  Coins,
  FileText,
  Lock
} from 'lucide-react';
import { useAuthContext } from '@/contexts/AuthContext';
import { useAdminStats } from '@/hooks/useAdminStats';
import { AdminStatsCards } from './AdminStatsCards';
import { AdminSystemAlerts } from './AdminSystemAlerts';
import { AdminRecentUsers } from './AdminRecentUsers';
import { AdminUserManagement } from './AdminUserManagement';
import { AdminProfessionalManagement } from './AdminProfessionalManagement';
import { AdminGcoinAudit } from './AdminGcoinAudit';
import { AdminAuditLogs } from './AdminAuditLogs';
import { AdminRBACViewer } from './AdminRBACViewer';
import { AdminGuard } from './AdminGuard';
import { AdminTabContent } from './AdminTabContent';
import { AdminErrorBoundary } from './AdminErrorBoundary';

function AdminPanelContent() {
  const { signOut } = useAuthContext();
  const {
    userStats,
    appointmentStats,
    gcoinStats,
    recentUsers,
    alerts,
    loading,
    refreshing,
    refresh
  } = useAdminStats();

  const handleLogout = async () => {
    const result = await signOut();
    if (result.success) {
      window.location.href = '/';
    }
  };

  const handleBackToApp = () => {
    window.location.href = '/';
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToApp}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao App
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-display font-bold">Painel Administrativo</h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={refresh}
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleLogout}
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-6">
        <Tabs defaultValue="dashboard" className="space-y-6">
          <TabsList className="flex flex-wrap h-auto gap-1 p-1">
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="users" className="gap-1.5">
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">Usuários</span>
            </TabsTrigger>
            <TabsTrigger value="professionals" className="gap-1.5">
              <Briefcase className="h-4 w-4" />
              <span className="hidden sm:inline">Profissionais</span>
            </TabsTrigger>
            <TabsTrigger value="gcoins" className="gap-1.5">
              <Coins className="h-4 w-4" />
              <span className="hidden sm:inline">Gcoins</span>
            </TabsTrigger>
            <TabsTrigger value="logs" className="gap-1.5">
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">Logs</span>
            </TabsTrigger>
            <TabsTrigger value="rbac" className="gap-1.5">
              <Lock className="h-4 w-4" />
              <span className="hidden sm:inline">RBAC</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard">
            <AdminTabContent loading={loading} fallbackTitle="Erro no Dashboard">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <AdminStatsCards 
                  userStats={userStats}
                  appointmentStats={appointmentStats}
                  gcoinStats={gcoinStats}
                  loading={false}
                />
                <AdminSystemAlerts 
                  alerts={alerts}
                  loading={false}
                />
              </motion.div>
            </AdminTabContent>
          </TabsContent>

          <TabsContent value="users">
            <AdminTabContent fallbackTitle="Erro na Gestão de Usuários">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <AdminUserManagement />
                <AdminRecentUsers 
                  users={recentUsers}
                  loading={loading}
                />
              </motion.div>
            </AdminTabContent>
          </TabsContent>

          <TabsContent value="professionals">
            <AdminTabContent fallbackTitle="Erro na Gestão de Profissionais">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AdminProfessionalManagement />
              </motion.div>
            </AdminTabContent>
          </TabsContent>

          <TabsContent value="gcoins">
            <AdminTabContent fallbackTitle="Erro na Auditoria de Gcoins">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AdminGcoinAudit />
              </motion.div>
            </AdminTabContent>
          </TabsContent>

          <TabsContent value="logs">
            <AdminTabContent fallbackTitle="Erro nos Logs de Auditoria">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AdminAuditLogs />
              </motion.div>
            </AdminTabContent>
          </TabsContent>

          <TabsContent value="rbac">
            <AdminTabContent fallbackTitle="Erro na Visualização RBAC">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AdminRBACViewer />
              </motion.div>
            </AdminTabContent>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

/**
 * AdminPanel com Guard centralizado e ErrorBoundary global.
 * 
 * Hierarquia:
 * 1. AdminGuard - Valida sessão + role admin antes de renderizar
 * 2. AdminErrorBoundary - Captura erros globais do painel
 * 3. AdminPanelContent - Conteúdo do painel com tabs
 * 4. AdminTabContent - Wrapper por aba com error boundary individual
 */
export function AdminPanel() {
  return (
    <AdminGuard>
      <AdminErrorBoundary fallbackTitle="Erro no Painel Administrativo">
        <AdminPanelContent />
      </AdminErrorBoundary>
    </AdminGuard>
  );
}
