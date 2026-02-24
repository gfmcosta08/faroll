import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Bell, ArrowLeft, Check, MessageCircle, Calendar, AlertTriangle } from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function NotificationsScreen() {
  const { 
    navigate, 
    user,
    getNotifications, 
    markNotificationAsRead, 
    updateNotificationSettings 
  } = useApp();

  const notifications = getNotifications();
  const settings = user?.notificacoes;

  const getIcon = (tipo: string) => {
    switch (tipo) {
      case 'mensagem': return <MessageCircle className="h-4 w-4" />;
      case 'agendamento': return <Calendar className="h-4 w-4 text-green-500" />;
      case 'cancelamento': return <AlertTriangle className="h-4 w-4 text-destructive" />;
      default: return <Bell className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />

      <main className="p-4 max-w-2xl mx-auto space-y-4">
        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
        >
          <div className="flex items-center gap-4 mb-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('config')}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-xl font-bold">Notificações</h1>
          </div>

          {/* Configurações */}
          <Card className="shadow-card border-0 mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Preferências</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Receber mensagens</Label>
                <Switch 
                  checked={settings?.receberMensagens ?? true}
                  onCheckedChange={(v) => updateNotificationSettings({ receberMensagens: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Agendamento criado</Label>
                <Switch 
                  checked={settings?.agendamentoCriado ?? true}
                  onCheckedChange={(v) => updateNotificationSettings({ agendamentoCriado: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Agendamento cancelado</Label>
                <Switch 
                  checked={settings?.agendamentoCancelado ?? true}
                  onCheckedChange={(v) => updateNotificationSettings({ agendamentoCancelado: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Lembrete de compromisso</Label>
                <Switch 
                  checked={settings?.proximoCompromisso ?? true}
                  onCheckedChange={(v) => updateNotificationSettings({ proximoCompromisso: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Eventos do calendário pessoal</Label>
                <Switch 
                  checked={settings?.eventoCalendarioPessoal ?? true}
                  onCheckedChange={(v) => updateNotificationSettings({ eventoCalendarioPessoal: v })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Alteração de regras do profissional</Label>
                <Switch 
                  checked={settings?.alteracaoRegrasProfissional ?? true}
                  onCheckedChange={(v) => updateNotificationSettings({ alteracaoRegrasProfissional: v })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Lista de notificações */}
          <Card className="shadow-card border-0">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bell className="h-5 w-5 text-primary" />
                Histórico
              </CardTitle>
            </CardHeader>
            <CardContent>
              {notifications.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhuma notificação
                </p>
              ) : (
                <div className="space-y-2">
                  {notifications.map((n) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`flex items-start gap-3 p-3 rounded-lg ${n.lida ? 'bg-muted/30' : 'bg-primary/10'}`}
                    >
                      <div className="mt-1">{getIcon(n.tipo)}</div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{n.titulo}</p>
                        <p className="text-xs text-muted-foreground">{n.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(n.criadoEm), "dd/MM HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!n.lida && (
                        <Button variant="ghost" size="sm" onClick={() => markNotificationAsRead(n.id)}>
                          <Check className="h-3 w-3" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  );
}
