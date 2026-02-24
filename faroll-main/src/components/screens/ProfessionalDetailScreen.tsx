import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { useApp } from '@/contexts/AppContext';
import { ProfessionalRecord } from '@/types';
import { GcoinHistoryCard } from '@/components/gcoin/GcoinHistoryCard';
import { RatingSystem, useExistingRating } from '@/components/professional/RatingSystem';
import { 
  ArrowLeft, 
  MessageCircle, 
  CalendarDays, 
  Coins, 
  FileText, 
  Clock,
  User,
  ClipboardList,
  Activity,
  Scale,
  NotebookPen,
  AlertCircle,
  CheckCircle,
  Star
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function ProfessionalDetailScreen() {
  const { 
    navigate, 
    goBack,
    selectedProfessional,
    getGcoinsForProfessional,
    getProposalForProfessional,
    getProfessionalSettings,
    getProfessionalRecords,
    user,
    canScheduleWithProfessional,
  } = useApp();

  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);

  // Hook para buscar avaliação existente (usa user.id como clientId)
  const clientId = user?.id || '';
  const { rating: existingRating, refetch: refetchRating } = useExistingRating(
    selectedProfessional?.id || '',
    clientId
  );

  useEffect(() => {
    if (clientId && selectedProfessional?.id) {
      refetchRating();
    }
  }, [clientId, selectedProfessional?.id]);

  if (!selectedProfessional) {
    navigate('contatos');
    return null;
  }

  const gcoin = getGcoinsForProfessional(selectedProfessional.id);
  const proposal = getProposalForProfessional(selectedProfessional.id);
  const settings = getProfessionalSettings(selectedProfessional.id);
  
  // Verifica se pode agendar (regra: quem possui Gcoins no vínculo pode agendar)
  const canSchedule = canScheduleWithProfessional(selectedProfessional.id);
  
  // Obter registros profissionais (somente leitura para o cliente)
  const records = getProfessionalRecords(selectedProfessional.id, 'cliente_responsavel_001');

  const handleRatingSuccess = () => {
    setRatingDialogOpen(false);
    refetchRating();
  };

  const formatMinutesToHours = (minutos: number) => {
    const horas = Math.floor(minutos / 60);
    const mins = minutos % 60;
    if (horas === 0) return `${mins} minutos`;
    if (mins === 0) return `${horas} hora${horas > 1 ? 's' : ''}`;
    return `${horas}h ${mins}min`;
  };

  const getRecordIcon = (tipo: ProfessionalRecord['tipo']) => {
    switch (tipo) {
      case 'avaliacao': return <ClipboardList className="h-4 w-4" />;
      case 'metrica': return <Activity className="h-4 w-4" />;
      case 'plano': return <FileText className="h-4 w-4" />;
      case 'observacao': return <NotebookPen className="h-4 w-4" />;
      case 'relatorio': return <Scale className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getRecordTypeLabel = (tipo: ProfessionalRecord['tipo']) => {
    switch (tipo) {
      case 'avaliacao': return 'Avaliação';
      case 'metrica': return 'Métrica';
      case 'plano': return 'Plano';
      case 'observacao': return 'Observação';
      case 'relatorio': return 'Relatório';
      default: return tipo;
    }
  };

  // Determinar o tipo de painel por profissão
  const getProfessionContent = () => {
    const profissao = selectedProfessional.profissao.toLowerCase();
    if (profissao.includes('educador') || profissao.includes('físico') || profissao.includes('personal')) {
      return {
        titulo: 'Treinos e Evolução',
        descricao: 'Métricas físicas, planos de treino e evolução corporal',
        tipos: ['metrica', 'plano', 'avaliacao'],
      };
    }
    if (profissao.includes('nutricion')) {
      return {
        titulo: 'Plano Alimentar',
        descricao: 'Dieta, ajustes alimentares e histórico de evolução',
        tipos: ['plano', 'metrica', 'avaliacao'],
      };
    }
    if (profissao.includes('psicolog') || profissao.includes('psiquiatr')) {
      return {
        titulo: 'Orientações e Registros',
        descricao: 'Orientações e registros de acompanhamento',
        tipos: ['observacao', 'avaliacao'],
      };
    }
    if (profissao.includes('fisioter')) {
      return {
        titulo: 'Exercícios e Evolução',
        descricao: 'Evolução funcional e exercícios prescritos',
        tipos: ['plano', 'metrica', 'avaliacao'],
      };
    }
    return {
      titulo: 'Acompanhamento',
      descricao: 'Registros e evolução do atendimento',
      tipos: ['observacao', 'metrica', 'plano', 'avaliacao'],
    };
  };

  const professionContent = getProfessionContent();

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
          {/* Header com botão voltar */}
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => goBack()}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-3 flex-1">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedProfessional.foto} alt={selectedProfessional.nome} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-foreground">{selectedProfessional.nome}</h1>
                <p className="text-sm text-muted-foreground">{selectedProfessional.profissao}</p>
              </div>
            </div>
          </div>

          {/* Informações do Profissional */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Sobre o Profissional
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Localização</p>
                  <p className="font-medium">{selectedProfessional.cidade}, {selectedProfessional.estado}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Atendimento</p>
                  <p className="font-medium">{selectedProfessional.tipo}</p>
                </div>
              </div>
              <Separator />
              <div>
                <p className="text-muted-foreground text-sm mb-1">Mini Currículo</p>
                <p className="text-sm">{selectedProfessional.descricao}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {selectedProfessional.especialidades.map((esp) => (
                  <Badge key={esp} variant="secondary">{esp}</Badge>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                Registro: {selectedProfessional.registro}
              </div>
            </CardContent>
          </Card>

          {/* Alerta de Gcoins */}
          <Alert className="border-primary bg-primary/5">
            <Coins className="h-4 w-4" />
            <AlertDescription className="flex items-center justify-between">
              <span>
                Você possui <strong className="text-primary">{gcoin?.disponivel || 0} Gcoins</strong> disponíveis com este profissional.
              </span>
            </AlertDescription>
          </Alert>

          {/* Informações do Vínculo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Vínculo Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gcoins Disponíveis</p>
                  <p className="text-2xl font-bold text-primary">{gcoin?.disponivel || 0}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gcoins Utilizados</p>
                  <p className="text-2xl font-bold">{gcoin?.consumido || 0}</p>
                </div>
              </div>

              <div className="flex gap-2 flex-wrap">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('chat')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Chat
                </Button>
                {canSchedule && (
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate('calendario-profissional')}
                  >
                    <CalendarDays className="h-4 w-4 mr-2" />
                    Agendar
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => navigate('proposta')}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Proposta
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Gcoins */}
          <GcoinHistoryCard professionalId={selectedProfessional.id} />

          {/* Avaliação do Profissional */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Star className="h-5 w-5 text-primary" />
                Avaliação
              </CardTitle>
            </CardHeader>
            <CardContent>
              {existingRating ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-5 h-5 ${
                            star <= existingRating.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'fill-muted text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      Sua avaliação: {existingRating.rating}/5
                    </span>
                  </div>
                  {existingRating.comentario && (
                    <p className="text-sm text-muted-foreground italic">
                      "{existingRating.comentario}"
                    </p>
                  )}
                  <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Star className="h-4 w-4 mr-2" />
                        Editar Avaliação
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <RatingSystem
                        professionalId={selectedProfessional.id}
                        clientId={clientId}
                        onRatingSubmitted={handleRatingSuccess}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground mb-3">
                    Você ainda não avaliou este profissional
                  </p>
                  <Dialog open={ratingDialogOpen} onOpenChange={setRatingDialogOpen}>
                    <DialogTrigger asChild>
                      <Button>
                        <Star className="h-4 w-4 mr-2" />
                        Avaliar Profissional
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                      <RatingSystem
                        professionalId={selectedProfessional.id}
                        clientId={clientId}
                        onRatingSubmitted={handleRatingSuccess}
                      />
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary" />
                Regras de Agendamento e Cancelamento
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Antecedência para Agendamento</p>
                  <p className="text-sm text-muted-foreground">
                    Mínimo de {formatMinutesToHours(settings.antecedenciaAgendamento)} antes do horário desejado
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <AlertCircle className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Antecedência para Cancelamento</p>
                  <p className="text-sm text-muted-foreground">
                    Mínimo de {formatMinutesToHours(settings.antecedenciaCancelamento)} sem penalidade
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Proposta Aceita */}
          {proposal && proposal.status === 'aceita' && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Proposta Aceita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Valor Acordado</p>
                    <p className="font-semibold">R$ {proposal.valorAcordado.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Gcoins do Pacote</p>
                    <p className="font-semibold">{proposal.quantidadeGcoins} Gcoins</p>
                  </div>
                </div>
                <Separator />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Descrição do Acordo</p>
                  <p className="text-sm">{proposal.descricaoAcordo}</p>
                </div>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>Aceita em: {format(new Date(proposal.dataResposta || proposal.dataCriacao), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Conteúdo Profissional Específico */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                {professionContent.titulo}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{professionContent.descricao}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              {records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum registro ainda.</p>
                  <p className="text-sm">Registros de acompanhamento aparecerão aqui.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {records.map((record) => (
                    <Card key={record.id} className="border-l-4 border-l-primary">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {getRecordIcon(record.tipo)}
                            <Badge variant="outline">{getRecordTypeLabel(record.tipo)}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(record.criadoEm), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <h4 className="font-semibold mb-1">{record.titulo}</h4>
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{record.conteudo}</p>
                        
                        {record.dados && Object.keys(record.dados).length > 0 && (
                          <>
                            <Separator className="my-3" />
                            <div className="flex flex-wrap gap-2">
                            {Object.entries(record.dados).map(([key, value]) => (
                              <Badge key={key} variant="secondary">
                                {key}: {String(value)}
                              </Badge>
                            ))}
                            </div>
                          </>
                        )}
                        
                        <p className="text-xs text-muted-foreground mt-3">
                          Registrado por: {record.criadoPor}
                        </p>
                      </CardContent>
                    </Card>
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
