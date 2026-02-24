import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Users, 
  UserCheck, 
  Briefcase, 
  Shield,
  Calendar,
  CalendarDays,
  CalendarRange,
  Coins,
  TrendingUp,
  TrendingDown
} from 'lucide-react';

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

interface AdminStatsCardsProps {
  userStats: UserStats | null;
  appointmentStats: AppointmentStats | null;
  gcoinStats: GcoinStats | null;
  loading: boolean;
}

export function AdminStatsCards({ 
  userStats, 
  appointmentStats, 
  gcoinStats, 
  loading 
}: AdminStatsCardsProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {/* User Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Appointment Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
        {/* Gcoin Stats Skeleton */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {Array(3).fill(0).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Usuários por Papel</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <span className="text-2xl font-bold">{userStats?.totalUsers || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Total Usuários</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <UserCheck className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{userStats?.totalClientes || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Clientes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Briefcase className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{userStats?.totalProfissionais || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Profissionais</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-orange-500" />
                <span className="text-2xl font-bold">{userStats?.totalDependentes || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Dependentes</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-5 w-5 text-purple-500" />
                <span className="text-2xl font-bold">{userStats?.totalSecretarias || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Secretárias</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Shield className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{userStats?.totalAdmins || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Admins</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Appointment Statistics */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Agendamentos</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-primary">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{appointmentStats?.today || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Hoje</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarDays className="h-5 w-5 text-blue-500" />
                <span className="text-2xl font-bold">{appointmentStats?.week || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Esta Semana</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-teal-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <CalendarRange className="h-5 w-5 text-teal-500" />
                <span className="text-2xl font-bold">{appointmentStats?.month || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Este Mês</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Gcoin Statistics */}
      <div>
        <h3 className="text-sm font-medium text-muted-foreground mb-3">Gcoins</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <Card className="border-l-4 border-l-green-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-2xl font-bold">{gcoinStats?.totalEmitidos || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Emitidos (Total)</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-red-500" />
                <span className="text-2xl font-bold">{gcoinStats?.totalConsumidos || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Consumidos</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-yellow-500">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Coins className="h-5 w-5 text-yellow-500" />
                <span className="text-2xl font-bold">{gcoinStats?.totalDisponiveis || 0}</span>
              </div>
              <p className="text-sm text-muted-foreground">Disponíveis</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
