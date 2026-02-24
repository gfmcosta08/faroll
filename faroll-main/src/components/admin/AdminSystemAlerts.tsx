import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  AlertTriangle, 
  ShieldX, 
  Clock, 
  CheckCircle2,
  XCircle,
  AlertCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface SystemAlert {
  id: string;
  type: 'login_failure' | 'late_cancellation' | 'system_error';
  title: string;
  description: string;
  severity: 'warning' | 'error' | 'info';
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

interface AdminSystemAlertsProps {
  alerts: SystemAlert[];
  loading: boolean;
}

const alertIcons = {
  login_failure: ShieldX,
  late_cancellation: Clock,
  system_error: AlertTriangle,
};

const severityColors = {
  warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  error: 'bg-red-100 text-red-800 border-red-200',
  info: 'bg-blue-100 text-blue-800 border-blue-200',
};

const severityBadgeVariants = {
  warning: 'outline' as const,
  error: 'destructive' as const,
  info: 'secondary' as const,
};

export function AdminSystemAlerts({ alerts, loading }: AdminSystemAlertsProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Alertas do Sistema
          </CardTitle>
          <CardDescription>Eventos críticos que requerem atenção</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array(3).fill(0).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Alertas do Sistema
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Eventos críticos que requerem atenção</CardDescription>
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500 opacity-50" />
            <p>Nenhum alerta no momento</p>
            <p className="text-sm mt-1">O sistema está funcionando normalmente</p>
          </div>
        ) : (
          <ScrollArea className="h-[300px] pr-4">
            <div className="space-y-3">
              {alerts.map((alert) => {
                const Icon = alertIcons[alert.type];
                return (
                  <div 
                    key={alert.id} 
                    className={`p-3 rounded-lg border ${severityColors[alert.severity]}`}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{alert.title}</span>
                          <Badge variant={severityBadgeVariants[alert.severity]} className="text-xs">
                            {alert.severity === 'error' ? 'Crítico' : 
                             alert.severity === 'warning' ? 'Atenção' : 'Info'}
                          </Badge>
                        </div>
                        <p className="text-sm opacity-90">{alert.description}</p>
                        <p className="text-xs opacity-70 mt-1">
                          {format(alert.timestamp, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
