import { useAuthContext } from "@/contexts/AuthContext";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { LandingPage } from "@/components/landing/LandingPage";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { GalleryScreen } from "@/components/screens/GalleryScreen";
import { ProfessionalGallery } from "@/components/professional/ProfessionalGallery";

import { ConfigScreen } from "@/components/screens/ConfigScreen";
import { SupportScreen } from "@/components/screens/SupportScreen";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Component, ErrorInfo, ReactNode, useState, useEffect } from "react";

class ScreenErrorBoundary extends Component<
  { children: ReactNode; screenName: string; onReset: () => void },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode; screenName: string; onReset: () => void }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error(`[ScreenErrorBoundary] Erro na tela ${this.props.screenName}:`, error, errorInfo);

    if (error.message?.includes("removeChild") || error.message?.includes("insertBefore")) {
      console.warn("[ScreenErrorBoundary] Erro de DOM detectado (provável extensão de navegador) - tentando recuperar");
      setTimeout(() => {
        this.setState({ hasError: false, error: null });
      }, 100);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="text-center space-y-4 max-w-md">
            <h2 className="text-xl font-semibold text-destructive">Erro ao carregar tela</h2>
            <p className="text-muted-foreground">Ocorreu um problema ao carregar a tela "{this.props.screenName}".</p>
            {this.state.error?.message && (
              <pre className="text-xs bg-muted p-3 rounded-md overflow-auto max-h-32 text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-2 justify-center">
              <Button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                }}
                size="sm"
              >
                Tentar novamente
              </Button>
              <Button variant="outline" onClick={this.props.onReset} size="sm">
                Voltar à Galeria
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

function LoadingScreen() {
  return (
    <div className="min-h-screen gradient-health-soft flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    </div>
  );
}

function UserDataRecoveryScreen({ error }: { error?: string | null }) {
  const { signOut, clearLocalAuth } = useAuthContext();

  const handleReload = () => {
    window.location.reload();
  };

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen gradient-health-soft flex items-center justify-center p-4 text-center">
      <div className="w-full max-w-md space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-xl border border-white/50">
        <div className="space-y-2">
          <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground">Sessão encontrada</h1>
          <p className="text-muted-foreground text-sm">
            Estamos preparando seu painel de controle. Isso pode levar alguns segundos dependendo da conexão.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive text-[10px] p-4 rounded-lg text-left border border-destructive/20 font-mono overflow-auto max-h-48 whitespace-pre-wrap">
            <strong>Erro técnico detectado:</strong>
            <div className="mt-1 opacity-80">{error}</div>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={handleReload} className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold">
            Tentar carregar novamente
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={clearLocalAuth} className="h-10 text-xs">
              Limpar dados locais
            </Button>
            <Button variant="secondary" onClick={handleLogout} className="h-10 text-xs">
              Sair da conta
            </Button>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground uppercase tracking-widest pt-2 border-t border-black/5 mt-4">
          Sincronização em andamento...
        </p>
      </div>
    </div>
  );
}

function AppContent() {
  const appContext = useApp();

  if (!appContext) {
    return (
      <div className="min-h-screen gradient-health-soft flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Inicializando...</p>
        </div>
      </div>
    );
  }

  const { screen, user, navigate } = appContext;

  if (!user) {
    return (
      <div className="min-h-screen gradient-health-soft flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Preparando seu acesso...</p>
        </div>
      </div>
    );
  }

  const handleResetToGallery = () => {
    try {
      navigate("galeria");
    } catch {
      window.location.href = "/";
    }
  };

  const getScreenName = (s: string) => {
    const names: Record<string, string> = {
      galeria: "Galeria",
      "galeria-profissionais": "Galeria de Profissionais",
      config: "Configurações",
      configuracoes: "Configurações",
      suporte: "Suporte",
    };
    return names[s] || s;
  };

  const renderScreen = () => {
    switch (screen) {
      case "galeria":
      case "galeria-profissionais":
        return <GalleryScreen />;
      case "configuracoes":
      case "config":
        return <ConfigScreen />;
      case "suporte":
        return <SupportScreen />;
      default:
        return <GalleryScreen />;
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={screen}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <ScreenErrorBoundary screenName={getScreenName(screen)} onReset={handleResetToGallery}>
          {renderScreen()}
        </ScreenErrorBoundary>
      </motion.div>
    </AnimatePresence>
  );
}

function AuthenticatedApp() {
  const { user, loading, isAuthenticated, error } = useAuthContext();
  // true = mostrar tela de login/cadastro (usuário clicou Entrar/Cadastre-se)
  const [showAuthForm, setShowAuthForm] = useState(false);
  // Permite que usuários autenticados voltem à LandingPage pelo logo
  const [overrideLanding, setOverrideLanding] = useState(false);

  // Ao ficar deslogado, sempre mostrar a landing (nunca ficar preso na tela de login)
  useEffect(() => {
    if (!isAuthenticated) setShowAuthForm(false);
  }, [isAuthenticated]);

  // Só mostra loading quando realmente não há sessão ainda (primeiro carregamento).
  if (loading && !user) {
    return <LoadingScreen />;
  }

  // Não autenticado: landing por padrão; só mostra login/cadastro se clicou em Entrar/Cadastre-se
  if (!isAuthenticated) {
    if (showAuthForm) {
      return <AuthScreen onBackToLanding={() => setShowAuthForm(false)} />;
    }
    return (
      <LandingPage
        onLogin={() => setShowAuthForm(true)}
        onRegister={() => setShowAuthForm(true)}
      />
    );
  }

  if (!user) {
    return <UserDataRecoveryScreen error={error} />;
  }

  // Usuário autenticado que clicou no logo: mostra LandingPage com botão para voltar ao app
  if (overrideLanding) {
    return (
      <LandingPage
        onLogin={() => setOverrideLanding(false)}
        onRegister={() => setOverrideLanding(false)}
      />
    );
  }

  return (
    <AppProvider authUser={user} onGoToLanding={() => setOverrideLanding(true)}>
      <AppContent />
    </AppProvider>
  );
}

const Index = () => {
  return <AuthenticatedApp />;
};

export default Index;
