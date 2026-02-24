import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, ShieldX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface AdminGuardProps {
  children: ReactNode;
}

type GuardState = 'loading' | 'authorized' | 'unauthorized' | 'no-session';

/**
 * AdminGuard - Guarda centralizado para o painel administrativo.
 * 
 * Responsabilidades:
 * 1. Aguarda sessão estar totalmente reidratada
 * 2. Verifica se usuário possui role 'admin'
 * 3. Exibe loading enquanto valida
 * 4. Bloqueia renderização dos filhos até autorização confirmada
 */
export function AdminGuard({ children }: AdminGuardProps) {
  const navigate = useNavigate();
  const [state, setState] = useState<GuardState>('loading');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkAdminAccess = async () => {
      try {
        console.log('[AdminGuard] Checking session...');
        
        // Aguarda sessão
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('[AdminGuard] Session error:', sessionError);
          if (mounted) {
            setState('no-session');
            setIsReady(true);
          }
          return;
        }

        if (!session) {
          console.log('[AdminGuard] No session found');
          if (mounted) {
            setState('no-session');
            setIsReady(true);
          }
          return;
        }

        console.log('[AdminGuard] Session found, checking admin role for user:', session.user.id);

        // Verifica role admin
        const { data: roles, error: rolesError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .eq('role', 'admin');

        if (rolesError) {
          console.error('[AdminGuard] Roles error:', rolesError);
          if (mounted) {
            setState('unauthorized');
            setIsReady(true);
          }
          return;
        }

        const isAdmin = roles && roles.length > 0;
        console.log('[AdminGuard] Is admin:', isAdmin);

        if (mounted) {
          setState(isAdmin ? 'authorized' : 'unauthorized');
          setIsReady(true);
        }
      } catch (error) {
        console.error('[AdminGuard] Unexpected error:', error);
        if (mounted) {
          setState('unauthorized');
          setIsReady(true);
        }
      }
    };

    checkAdminAccess();

    // Listener para mudanças de auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[AdminGuard] Auth state changed:', event);
      
      if (event === 'SIGNED_OUT' || !session) {
        if (mounted) {
          setState('no-session');
        }
        return;
      }

      // Re-verificar role ao mudar auth
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        checkAdminAccess();
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Loading state - sempre exibir enquanto não está pronto
  if (!isReady || state === 'loading') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Sem sessão - redireciona para login
  if (state === 'no-session') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <CardTitle>Sessão Expirada</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Sua sessão expirou ou você não está logado.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Fazer Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Não autorizado
  if (state === 'unauthorized') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <ShieldX className="h-16 w-16 text-destructive mx-auto mb-4" />
            <CardTitle className="text-destructive">Acesso Negado</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o painel administrativo.
            </p>
            <p className="text-sm text-muted-foreground">
              Esta área é restrita a usuários com papel de administrador.
            </p>
            <Button onClick={() => navigate('/')} className="w-full">
              Voltar para o App
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Autorizado - renderiza children
  return <>{children}</>;
}
