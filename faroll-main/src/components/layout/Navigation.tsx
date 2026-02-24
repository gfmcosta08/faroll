import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSolicitacoesCount } from '@/hooks/useSolicitacoes';
import { LayoutGrid, CalendarDays, Users, Settings, HeadphonesIcon, ArrowLeft, LogOut, Inbox } from 'lucide-react';

export function Navigation() {
  const appContext = useApp();
  const authContext = useAuthContext();
  const { naoRespondidas } = useSolicitacoesCount();

  // Guard defensivo: garantir que os contextos existem
  if (!appContext || !authContext) {
    return null;
  }

  // GUARD: Extrair com fallbacks para evitar crash se propriedades não existirem
  const navigate = appContext.navigate || (() => {});
  const screen = appContext.screen || 'galeria';
  const goBack = appContext.goBack || (() => {});
  const screenHistory = appContext.screenHistory || [];
  const signOut = authContext.signOut || (async () => ({ success: false, error: 'SignOut não disponível' }));

  const navItems = [
    { icon: LayoutGrid, label: 'Galeria', screen: 'galeria' as const },
    { icon: Inbox, label: 'Solicitações', screen: 'solicitacoes' as const, badge: naoRespondidas },
    { icon: CalendarDays, label: 'Calendário', screen: 'calendario' as const },
    { icon: Users, label: 'Contatos', screen: 'contatos' as const },
    { icon: Settings, label: 'Configurações', screen: 'config' as const },
    { icon: HeadphonesIcon, label: 'Suporte', screen: 'suporte' as const },
  ];

  // Mostra botão voltar se há histórico ou está em telas específicas
  const showBack = screenHistory.length > 0 || ['perfil', 'chat', 'novo-dependente', 'editar-dependente', 'proposta', 'calendario-profissional', 'profissional-detalhe', 'cliente-detalhe', 'gerenciar-agenda', 'calendario-pessoal', 'solicitacoes'].includes(screen);

  const handleLogout = async () => {
    console.log('[Navigation] handleLogout called');
    // LOGOUT DETERMINÍSTICO: Sempre desloga e redireciona, mesmo com erro
    await signOut();
    // Força limpeza completa e redirecionamento (independente do resultado)
    window.location.href = '/';
  };

  return (
    <motion.nav 
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="flex items-center justify-center gap-2 px-4 py-3 border-b border-border bg-card shadow-sm"
    >
      {showBack && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => goBack()}
          className="mr-auto"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
      )}
      {navItems.map((item) => (
        <Button
          key={item.screen}
          variant={screen === item.screen ? 'default' : 'ghost'}
          size="sm"
          onClick={() => navigate(item.screen)}
          className="gap-1.5 relative"
        >
          <item.icon className="h-4 w-4" />
          <span className="hidden sm:inline">{item.label}</span>
          {item.badge && item.badge > 0 && (
            <Badge 
              variant="coral" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
            >
              {item.badge > 9 ? '9+' : item.badge}
            </Badge>
          )}
        </Button>
      ))}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="ml-auto text-destructive hover:text-destructive hover:bg-destructive/10"
      >
        <LogOut className="h-4 w-4" />
        <span className="hidden sm:inline ml-1.5">Sair</span>
      </Button>
    </motion.nav>
  );
}
