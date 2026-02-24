import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useApp } from '@/contexts/AppContext';
import { useAuthContext } from '@/contexts/AuthContext';
import { useSolicitacoes, Solicitacao } from '@/hooks/useSolicitacoes';
import { MessageCircle, Clock, CheckCircle, AlertCircle, Inbox } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function SolicitacoesScreen() {
  const app = useApp();
  const { user } = useAuthContext();
  const { data: solicitacoes, isLoading, error } = useSolicitacoes();
  
  if (!app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
      </div>
    );
  }

  const { navigate, selectProfessional, professionals } = app;
  const isProfessional = user?.role === 'profissional';

  // Handler para abrir chat
  const handleOpenChat = (solicitacao: Solicitacao) => {
    // Encontrar o profissional para selecionar
    const professional = professionals.find(p => p.id === solicitacao.professionalId);
    
    if (professional) {
      selectProfessional(professional);
    } else {
      // Se não encontrar nos profissionais locais, criar um objeto mínimo
      selectProfessional({
        id: solicitacao.professionalId,
        nome: solicitacao.professionalNome,
        profissao: '',
        especialidades: [],
        pais: 'Brasil',
        estado: '',
        cidade: '',
        tipo: 'Online',
        descricao: '',
        registro: '',
        foto: solicitacao.professionalAvatar || '',
      });
    }
    
    navigate('chat');
  };

  // Formatar data relativa
  const formatRelativeDate = (dateStr: string) => {
    try {
      return formatDistanceToNow(new Date(dateStr), {
        addSuffix: true,
        locale: ptBR,
      });
    } catch {
      return 'Data desconhecida';
    }
  };

  // Renderizar card de solicitação
  const renderSolicitacaoCard = (solicitacao: Solicitacao) => {
    const isClient = !isProfessional;
    const otherName = isClient ? solicitacao.professionalNome : solicitacao.clientNome;
    const otherAvatar = isClient ? solicitacao.professionalAvatar : solicitacao.clientAvatar;
    
    return (
      <motion.div
        key={solicitacao.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <Card className="hover:border-primary/50 transition-colors">
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              {/* Avatar */}
              <Avatar className="h-14 w-14 flex-shrink-0">
                <AvatarImage src={otherAvatar || undefined} alt={otherName} />
                <AvatarFallback>
                  {otherName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              
              {/* Informações */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-semibold text-foreground truncate">
                    {otherName}
                  </h3>
                  
                  {/* Status badge */}
                  {solicitacao.respondida ? (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CheckCircle className="h-3 w-3" />
                      Respondida
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" />
                      Aguardando resposta
                    </Badge>
                  )}
                </div>
                
                {/* Primeira mensagem */}
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  "{solicitacao.primeiraMensagem}"
                </p>
                
                {/* Meta info */}
                <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatRelativeDate(solicitacao.primeiraMensagemData)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {solicitacao.totalMensagens} mensagem{solicitacao.totalMensagens > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              
              {/* Botão de ação */}
              <Button
                size="sm"
                onClick={() => handleOpenChat(solicitacao)}
                className="flex-shrink-0"
              >
                <MessageCircle className="h-4 w-4 mr-1" />
                Ver Chat
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Inbox className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-1/3" />
                      <Skeleton className="h-4 w-2/3" />
                      <Skeleton className="h-3 w-1/4" />
                    </div>
                    <Skeleton className="h-9 w-24" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <Navigation />
        <main className="container mx-auto px-4 py-6 max-w-4xl">
          <div className="flex items-center gap-2 mb-6">
            <Inbox className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
          </div>
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <p className="text-muted-foreground">
                Erro ao carregar solicitações. Tente novamente mais tarde.
              </p>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  const solicitacoesNaoRespondidas = solicitacoes?.filter(s => !s.respondida) || [];
  const solicitacoesRespondidas = solicitacoes?.filter(s => s.respondida) || [];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Cabeçalho */}
          <div className="flex items-center gap-2">
            <Inbox className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Solicitações</h1>
            {solicitacoesNaoRespondidas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {solicitacoesNaoRespondidas.length} nova{solicitacoesNaoRespondidas.length > 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          {/* Descrição */}
          <p className="text-muted-foreground">
            {isProfessional 
              ? 'Clientes que iniciaram conversa mas ainda não possuem proposta aceita.'
              : 'Profissionais com quem você iniciou conversa mas ainda não aceitou uma proposta.'
            }
          </p>

          {/* Lista vazia */}
          {(!solicitacoes || solicitacoes.length === 0) && (
            <Card>
              <CardContent className="py-12 text-center">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">
                  {isProfessional 
                    ? 'Nenhuma solicitação de contato no momento.'
                    : 'Você não possui solicitações pendentes.'
                  }
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  {isProfessional 
                    ? 'Quando um cliente iniciar uma conversa, ela aparecerá aqui.'
                    : 'Inicie uma conversa com um profissional na galeria.'
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Seção: Não respondidas */}
          {solicitacoesNaoRespondidas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-destructive" />
                Aguardando resposta ({solicitacoesNaoRespondidas.length})
              </h2>
              {solicitacoesNaoRespondidas.map(renderSolicitacaoCard)}
            </div>
          )}

          {/* Seção: Respondidas */}
          {solicitacoesRespondidas.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Respondidas ({solicitacoesRespondidas.length})
              </h2>
              {solicitacoesRespondidas.map(renderSolicitacaoCard)}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
