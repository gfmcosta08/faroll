import { useAuthContext } from "@/contexts/AuthContext";
import { AppProvider, useApp } from "@/contexts/AppContext";
import { LandingPage } from "@/components/landing/LandingPage";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { GalleryScreen } from "@/components/screens/GalleryScreen";
import { ProfessionalGallery } from "@/components/professional/ProfessionalGallery";

import { CalendarScreen } from "@/components/screens/CalendarScreen";
import { ContactsScreen } from "@/components/screens/ContactsScreen";
import { SolicitacoesScreen } from "@/components/screens/SolicitacoesScreen";
import { ProfileScreen } from "@/components/screens/ProfileScreen";
import { ChatScreen } from "@/components/screens/ChatScreen";
import { ProposalScreen } from "@/components/screens/ProposalScreen";
import { ConfigScreen } from "@/components/screens/ConfigScreen";
import { NewDependentScreen } from "@/components/screens/NewDependentScreen";
import { EditDependentScreen } from "@/components/screens/EditDependentScreen";
import { SupportScreen } from "@/components/screens/SupportScreen";
import { ManageScheduleScreen } from "@/components/screens/ManageScheduleScreen";
import { ProfessionalCalendarScreen } from "@/components/screens/ProfessionalCalendarScreen";
import { PersonalCalendarScreen } from "@/components/screens/PersonalCalendarScreen";
import { NotificationsScreen } from "@/components/screens/NotificationsScreen";
import { ClientDetailScreen } from "@/components/screens/ClientDetailScreen";
import { ProfessionalDetailScreen } from "@/components/screens/ProfessionalDetailScreen";
import { GlobalErrorBoundary } from "@/components/GlobalErrorBoundary";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Component, ErrorInfo, ReactNode, useState } from "react";

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
      configuracoes: "Configurações",
      calendario: "Calendário",
      contatos: "Contatos",
      solicitacoes: "Solicitações",
      perfil: "Perfil",
      chat: "Chat",
      proposta: "Proposta",
      config: "Configurações",
      "novo-dependente": "Novo Dependente",
      "editar-dependente": "Editar Dependente",
      suporte: "Suporte",
      "gerenciar-agenda": "Gerenciar Agenda",
      "calendario-profissional": "Calendário Profissional",
      "calendario-pessoal": "Calendário Pessoal",
      notificacoes: "Notificações",
      "cliente-detalhe": "Detalhes do Cliente",
      "profissional-detalhe": "Detalhes do Profissional",
    };
    return names[s] || s;
  };

  const renderScreen = () => {
    switch (screen) {
      case "galeria":
        return <GalleryScreen />;
      case "galeria-profissionais":
        return <ProfessionalGallery />;
      case "configuracoes":
        return <ConfigScreen />;
      case "calendario":
        return <CalendarScreen />;
      case "contatos":
        return <ContactsScreen />;
      case "solicitacoes":
        return <SolicitacoesScreen />;
      case "perfil":
        return <ProfileScreen />;
      case "chat":
        return <ChatScreen />;
      case "proposta":
        return <ProposalScreen />;
      case "config":
        return <ConfigScreen />;
      case "novo-dependente":
        return <NewDependentScreen />;
      case "editar-dependente":
        return <EditDependentScreen />;
      case "suporte":
        return <SupportScreen />;
      case "gerenciar-agenda":
        return <ManageScheduleScreen />;
      case "calendario-profissional":
        return <ProfessionalCalendarScreen />;
      case "calendario-pessoal":
        return <PersonalCalendarScreen />;
      case "notificacoes":
        return <NotificationsScreen />;
      case "cliente-detalhe":
        return <ClientDetailScreen />;
      case "profissional-detalhe":
        return <ProfessionalDetailScreen />;
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
  const [showLanding, setShowLanding] = useState(true);
  // Permite que usuários autenticados voltem à LandingPage pelo logo
  const [overrideLanding, setOverrideLanding] = useState(false);

  if (loading) {
    return <LoadingScreen />;
  }

  if (!isAuthenticated) {
    if (showLanding) {
      return <LandingPage onLogin={() => setShowLanding(false)} onRegister={() => setShowLanding(false)} />;
    }
    return <AuthScreen onBackToLanding={() => setShowLanding(true)} />;
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
