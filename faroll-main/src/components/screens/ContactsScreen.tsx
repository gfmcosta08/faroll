import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useApp } from '@/contexts/AppContext';
import { CalendarDays, MessageCircle, FileText, User, Coins, Users, Briefcase } from 'lucide-react';

export function ContactsScreen() {
  // GUARD DEFENSIVO: Não destructure diretamente; validar contexto primeiro
  const app = useApp();
  
  // GUARD: Se contexto não está pronto, mostra loading
  if (!app) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando contatos...</p>
      </div>
    );
  }

  const { 
    getActiveContacts, 
    professionals = [], 
    selectProfessional, 
    navigate, 
    user,
    getGcoinsForProfessional,
    canScheduleWithProfessional,
  } = app;

  const activeContacts = getActiveContacts?.() || [];
  // GUARD DEFENSIVO: Usar optional chaining para evitar crash se user for null
  const userRole = user?.role;
  const isClient = userRole === 'cliente' || userRole === 'dependente';
  const isProfessional = userRole === 'profissional' || userRole === 'secretaria';

  // Handler para clicar no card do contato (abre tela de detalhe)
  const handleContactClick = (profissionalId: string) => {
    const professional = professionals.find(p => p.id === profissionalId);
    if (professional) {
      selectProfessional(professional);
      // Cliente vê detalhes do profissional
      if (isClient) {
        navigate('profissional-detalhe');
      } else {
        // Profissional vê detalhes do cliente
        navigate('cliente-detalhe');
      }
    }
  };

  const handleChatClick = (profissionalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const professional = professionals.find(p => p.id === profissionalId);
    if (professional) {
      selectProfessional(professional);
      navigate('chat');
    }
  };

  const handleCalendarClick = (profissionalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const professional = professionals.find(p => p.id === profissionalId);
    if (professional) {
      selectProfessional(professional);
      // Verifica se pode agendar (regra: quem possui Gcoins no vínculo pode agendar)
      // Se não pode agendar, ainda pode visualizar a agenda (mas sem opção de marcar)
      navigate('calendario-profissional');
    }
  };

  const handleProposalClick = (profissionalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const professional = professionals.find(p => p.id === profissionalId);
    if (professional) {
      selectProfessional(professional);
      navigate('proposta');
    }
  };

  // Renderiza um card de contato
  const renderContactCard = (contact: typeof activeContacts[0]) => {
    const gcoin = getGcoinsForProfessional(contact.profissionalId);
    // Verifica se pode agendar (regra: quem possui Gcoins no vínculo pode agendar)
    const canScheduleContact = canScheduleWithProfessional(contact.profissionalId);
    
    return (
      <motion.div
        key={contact.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
      >
        <Card 
          className="hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => handleContactClick(contact.profissionalId)}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <Avatar className="h-14 w-14">
                <AvatarImage src={contact.profissionalFoto} alt={contact.profissionalNome} />
                <AvatarFallback>
                  {contact.profissionalNome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">
                  {isProfessional ? 'Usuário Teste' : contact.profissionalNome}
                </h3>
                
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge variant="default" className="bg-primary hover:bg-primary/90">
                    Atendimento ativo
                  </Badge>
                  
                  {contact.compromissosFuturos > 0 && (
                    <Badge variant="secondary" className="flex items-center gap-1">
                      <CalendarDays className="h-3 w-3" />
                      {contact.compromissosFuturos} compromisso{contact.compromissosFuturos > 1 ? 's' : ''}
                    </Badge>
                  )}

                  {gcoin && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Coins className="h-3 w-3" />
                      {gcoin.disponivel} Gcoins
                    </Badge>
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                {/* Botão de calendário: só exibe se pode agendar OU se é cliente */}
                {(canScheduleContact || isClient) && (
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={(e) => handleCalendarClick(contact.profissionalId, e)}
                    title={canScheduleContact ? "Agendar" : "Ver Agenda"}
                  >
                    <CalendarDays className="h-4 w-4" />
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={(e) => handleProposalClick(contact.profissionalId, e)}
                  title="Ver Proposta"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button 
                  size="icon"
                  onClick={(e) => handleChatClick(contact.profissionalId, e)}
                  title="Abrir Chat"
                >
                  <MessageCircle className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <Navigation />
      
      <main className="container mx-auto px-4 py-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center gap-2 mb-6">
            <User className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isProfessional ? 'Contatos' : 'Meus Contatos'}
            </h1>
          </div>

          {activeContacts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <p className="text-muted-foreground">
                  {isProfessional 
                    ? 'Você ainda não possui clientes com vínculo ativo.'
                    : 'Você ainda não possui contatos com vínculo ativo.'}
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Contatos aparecem aqui após proposta aceita e Gcoins liberados.
                </p>
              </CardContent>
            </Card>
          ) : isProfessional ? (
            // Visualização para profissional: separada em seções
            <div className="space-y-6">
              {/* Seção de Clientes */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Users className="h-5 w-5 text-primary" />
                    Clientes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {activeContacts.map((contact) => renderContactCard(contact))}
                </CardContent>
              </Card>

              {/* Seção de Profissionais (outros profissionais vinculados) */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Briefcase className="h-5 w-5 text-primary" />
                    Profissionais
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4 text-muted-foreground">
                    <p className="text-sm">Nenhum profissional vinculado.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Visualização para cliente: lista simples
            <div className="space-y-3">
              {activeContacts.map((contact) => renderContactCard(contact))}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}
