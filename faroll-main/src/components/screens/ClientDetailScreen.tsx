import { useState } from 'react';
import { motion } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Navigation } from '@/components/layout/Navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useApp } from '@/contexts/AppContext';
import { ProfessionalRecord } from '@/types';
import { 
  ArrowLeft, 
  MessageCircle, 
  CalendarDays, 
  Coins, 
  FileText, 
  Plus,
  User,
  ClipboardList,
  Activity,
  Scale,
  NotebookPen
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

export function ClientDetailScreen() {
  const { 
    navigate, 
    goBack,
    getActiveContacts, 
    getGcoinsForProfessional,
    getAppointmentsForProfessional,
    selectedProfessional,
    user,
    getProfessionalRecords,
    addProfessionalRecord,
  } = useApp();

  // Em modo teste, simula um cliente selecionado
  const [selectedClientId] = useState('cliente_responsavel_001');
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [newRecord, setNewRecord] = useState({
    tipo: 'observacao' as ProfessionalRecord['tipo'],
    titulo: '',
    conteudo: '',
    dados: {} as Record<string, string | number>,
  });
  const [newMetricKey, setNewMetricKey] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');

  // Dados mock do cliente (em modo teste)
  const clienteInfo = {
    id: 'cliente_responsavel_001',
    nome: 'Usuário Teste',
    email: 'usuario@teste.com',
    telefone: '(11) 99999-9999',
    dataNascimento: '15/03/1985',
    foto: '/avatar-1.jpg',
  };

  // Obter Gcoins deste vínculo
  const gcoin = selectedProfessional ? getGcoinsForProfessional(selectedProfessional.id) : null;
  
  // Obter registros profissionais
  const records = selectedProfessional 
    ? getProfessionalRecords(selectedProfessional.id, selectedClientId)
    : [];

  // Obter compromissos futuros
  const appointments = selectedProfessional 
    ? getAppointmentsForProfessional(selectedProfessional.id).filter(
        a => a.clienteId === selectedClientId && new Date(a.data) >= new Date()
      )
    : [];

  const handleAddRecord = () => {
    if (!newRecord.titulo || !newRecord.conteudo) {
      toast.error('Preencha título e conteúdo');
      return;
    }

    if (!selectedProfessional) return;

    addProfessionalRecord({
      profissionalId: selectedProfessional.id,
      clienteId: selectedClientId,
      tipo: newRecord.tipo,
      titulo: newRecord.titulo,
      conteudo: newRecord.conteudo,
      dados: Object.keys(newRecord.dados).length > 0 ? newRecord.dados : undefined,
      criadoPor: user?.nome || 'Profissional',
    });

    setNewRecord({
      tipo: 'observacao',
      titulo: '',
      conteudo: '',
      dados: {},
    });
    setShowAddRecord(false);
    toast.success('Registro adicionado com sucesso!');
  };

  const handleAddMetric = () => {
    if (!newMetricKey || !newMetricValue) return;
    setNewRecord(prev => ({
      ...prev,
      dados: {
        ...prev.dados,
        [newMetricKey]: isNaN(Number(newMetricValue)) ? newMetricValue : Number(newMetricValue),
      },
    }));
    setNewMetricKey('');
    setNewMetricValue('');
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

  if (!selectedProfessional) {
    navigate('contatos');
    return null;
  }

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
                <AvatarImage src={clienteInfo.foto} alt={clienteInfo.nome} />
                <AvatarFallback>
                  <User className="h-6 w-6" />
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-xl font-bold text-foreground">{clienteInfo.nome}</h1>
                <p className="text-sm text-muted-foreground">Cliente vinculado</p>
              </div>
            </div>
          </div>

          {/* Dados do Cliente */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Nome Completo</p>
                  <p className="font-medium">{clienteInfo.nome}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Data de Nascimento</p>
                  <p className="font-medium">{clienteInfo.dataNascimento}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Telefone</p>
                  <p className="font-medium">{clienteInfo.telefone}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">E-mail</p>
                  <p className="font-medium">{clienteInfo.email}</p>
                </div>
              </div>

              <Button 
                className="w-full mt-4"
                onClick={() => navigate('chat')}
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Abrir Chat
              </Button>
            </CardContent>
          </Card>

          {/* Informações do Vínculo */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Coins className="h-5 w-5 text-primary" />
                Informações do Vínculo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Gcoins Disponíveis</p>
                  <p className="text-2xl font-bold text-primary">{gcoin?.disponivel || 0}</p>
                </div>
                <div className="p-3 bg-muted/50 rounded-lg">
                  <p className="text-sm text-muted-foreground">Compromissos Futuros</p>
                  <p className="text-2xl font-bold">{appointments.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Histórico de Compromissos com este profissional */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Histórico de Compromissos
              </CardTitle>
            </CardHeader>
            <CardContent>
              {appointments.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">
                  <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-50" />
                  <p>Nenhum compromisso futuro agendado.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {appointments.map((appt) => (
                    <div key={appt.id} className="p-3 rounded-lg bg-muted/30 border border-border">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">Atendimento</p>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(appt.data), "dd/MM/yyyy", { locale: ptBR })} às {appt.hora}
                          </p>
                        </div>
                        <Badge variant={appt.status === 'confirmado' ? 'default' : 'secondary'}>
                          {appt.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Histórico Profissional */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Histórico Profissional
                </CardTitle>
                <Button size="sm" onClick={() => setShowAddRecord(true)}>
                  <Plus className="h-4 w-4 mr-1" />
                  Novo Registro
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Formulário para adicionar registro */}
              {showAddRecord && (
                <Card className="border-primary/50">
                  <CardContent className="p-4 space-y-4">
                    <div className="space-y-2">
                      <Label>Tipo de Registro</Label>
                      <Select 
                        value={newRecord.tipo} 
                        onValueChange={(v) => setNewRecord(prev => ({ ...prev, tipo: v as ProfessionalRecord['tipo'] }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-background border shadow-lg z-50">
                          <SelectItem value="avaliacao">Avaliação</SelectItem>
                          <SelectItem value="metrica">Métrica</SelectItem>
                          <SelectItem value="plano">Plano</SelectItem>
                          <SelectItem value="observacao">Observação</SelectItem>
                          <SelectItem value="relatorio">Relatório</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Título</Label>
                      <Input 
                        placeholder="Ex: Avaliação física inicial"
                        value={newRecord.titulo}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, titulo: e.target.value }))}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Conteúdo</Label>
                      <Textarea 
                        placeholder="Descreva os detalhes..."
                        rows={4}
                        value={newRecord.conteudo}
                        onChange={(e) => setNewRecord(prev => ({ ...prev, conteudo: e.target.value }))}
                      />
                    </div>

                    {/* Dados estruturados (métricas) */}
                    {(newRecord.tipo === 'metrica' || newRecord.tipo === 'avaliacao') && (
                      <div className="space-y-2">
                        <Label>Dados/Métricas</Label>
                        <div className="flex gap-2">
                          <Input 
                            placeholder="Campo (ex: peso)"
                            value={newMetricKey}
                            onChange={(e) => setNewMetricKey(e.target.value)}
                            className="flex-1"
                          />
                          <Input 
                            placeholder="Valor (ex: 75)"
                            value={newMetricValue}
                            onChange={(e) => setNewMetricValue(e.target.value)}
                            className="flex-1"
                          />
                          <Button type="button" variant="outline" onClick={handleAddMetric}>
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                        {Object.keys(newRecord.dados).length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {Object.entries(newRecord.dados).map(([key, value]) => (
                              <Badge key={key} variant="secondary">
                                {key}: {value}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="flex gap-2 pt-2">
                      <Button variant="outline" onClick={() => setShowAddRecord(false)} className="flex-1">
                        Cancelar
                      </Button>
                      <Button onClick={handleAddRecord} className="flex-1">
                        Salvar Registro
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Lista de registros */}
              {records.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>Nenhum registro profissional ainda.</p>
                  <p className="text-sm">Adicione avaliações, métricas e observações.</p>
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
