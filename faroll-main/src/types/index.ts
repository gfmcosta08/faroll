export interface Professional {
  id: string;
  nome: string;
  profissao: string;
  especialidades: string[];
  pais: string;
  estado: string;
  cidade: string;
  tipo: 'Online' | 'Presencial' | 'Ambos';
  descricao: string;
  registro: string;
  foto: string;
  // Configurações de antecedência do profissional
  antecedenciaAgendamento?: number; // em minutos
  antecedenciaCancelamento?: number; // em minutos
}

// Permissões para Dependente (menor de idade)
// Algumas são fixas (não editáveis), outras sempre true
export interface DependentePermissions {
  chatComVinculados: boolean;  // configurável
  verCalendario: boolean;      // configurável
  verCompromissos: boolean;    // configurável
  negociarProposta: boolean;   // fixo: false
  enviarArquivos: boolean;     // fixo: false
  consumirGcoin: boolean;      // fixo: false
  agendarCancelar: boolean;    // fixo: false
}

// Permissões para Secretária
// A maioria é editável, exceto acessoClinico
export interface SecretariaPermissions {
  gerenciarAgenda: boolean;    // editável
  negociarProposta: boolean;   // editável
  liberarGcoins: boolean;      // editável
  acessoFinanceiro: boolean;   // editável
  acessoClinico: boolean;      // fixo: false
}

// Union type para permissões de dependentes
export type DependentPermissions = DependentePermissions | SecretariaPermissions;

export interface Dependent {
  id: string;
  nome: string;
  tipo: 'menor' | 'secretaria';
  foto?: string;
  permissions: DependentPermissions;
  // Novos campos obrigatórios
  telefone?: string;
  email?: string;
  cpf?: string;
  login?: string;
  senha?: string; // Em modo teste, armazenado diretamente
  responsavelId?: string;
}

export interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  attachment?: string; // Anexo simulado
}

export type UserRole = 'cliente' | 'profissional' | 'dependente' | 'secretaria' | 'admin';

export interface User {
  id?: string;
  profileId: string;
  nome: string;
  role: UserRole;
  cpf?: string;
  telefone?: string;
  email?: string;
  pais?: string;
  estado?: string;
  cidade?: string;
  avatar_url?: string;
  // Configurações de notificação
  notificacoes?: NotificationSettings;
  // Configurações de antecedência (para profissional)
  antecedenciaAgendamento?: number;
  antecedenciaCancelamento?: number;
}

export interface Contact {
  id: string;
  profissionalId: string;
  profissionalNome: string;
  profissionalFoto: string;
  propostaEnviada: boolean;
  propostaAceita: boolean;
  gcoinsLiberados: boolean;
  dataVinculo: Date;
  compromissosFuturos: number;
}

export type ProposalStatus = 'rascunho' | 'enviada' | 'aceita' | 'recusada';

export interface Proposal {
  id: string;
  profissionalId: string;
  clienteId: string;
  valorAcordado: number;
  quantidadeGcoins: number;
  descricaoAcordo: string;
  antecedenciaMinima: number; // em horas
  prazoCancelamento: number; // em horas
  comprovanteAnexo?: string;
  status: ProposalStatus;
  dataCriacao: Date;
  dataResposta?: Date;
}

// Gcoin: crédito de serviço vinculado a UM profissional e UM cliente
export interface Gcoin {
  id: string;
  profissionalId: string;
  clienteId: string;
  quantidade: number;
  propostaId: string;
  dataLiberacao: Date;
  consumido: number; // quantidade já utilizada
  disponivel: number; // quantidade disponível (quantidade - consumido)
}

// Tipos de bloqueio de agenda do profissional
// APENAS: dia ou periodo (período = intervalo de datas livre)
export type BlockType = 'dia' | 'periodo' | 'google_sync';

// Faixa de horário para bloqueio
export interface TimeRange {
  horaInicio: string;
  horaFim: string;
}

export interface ScheduleBlock {
  id: string;
  profissionalId: string;
  tipo: BlockType;
  dataInicio: Date;
  dataFim: Date;
  // Múltiplas faixas de horário (obrigatórias para todos os tipos)
  faixasHorario: TimeRange[];
  motivo?: string;
  criadoEm: Date;
}

// Evento pessoal do cliente
export interface PersonalEvent {
  id: string;
  userId: string;
  titulo: string;
  descricao?: string;
  data: Date;
  horaInicio?: string;
  horaFim?: string;
  tipo: 'evento' | 'bloqueio';
  criadoEm: Date;
}

// Compromisso agendado
export interface Appointment {
  id: string;
  profissionalId: string;
  clienteId: string;
  clienteNome?: string; // Nome do cliente para exibição
  dependenteId?: string;
  data: Date;
  hora: string;
  status: 'agendado' | 'confirmado' | 'cancelado' | 'concluido';
  gcoinConsumido?: boolean;
  criadoEm: Date;
}

// Configurações de notificação
export interface NotificationSettings {
  receberMensagens: boolean;
  agendamentoCriado: boolean;
  agendamentoCancelado: boolean;
  proximoCompromisso: boolean;
  eventoCalendarioPessoal: boolean;
  alteracaoRegrasProfissional: boolean;
}

// Notificação
export interface Notification {
  id: string;
  userId: string;
  tipo: 'mensagem' | 'agendamento' | 'cancelamento' | 'lembrete' | 'alteracao_regras';
  titulo: string;
  descricao: string;
  lida: boolean;
  criadoEm: Date;
  entidadeId?: string;
}

// Tipos de ação para auditoria
export type AuditActionType =
  | 'agenda_bloqueio_criado'
  | 'agenda_bloqueio_removido'
  | 'proposta_enviada'
  | 'proposta_aceita'
  | 'proposta_recusada'
  | 'gcoin_liberado'
  | 'agendamento_criado'
  | 'agendamento_cancelado'
  | 'acesso_financeiro'
  | 'regras_antecedencia_alteradas';

// Log de auditoria para ações da secretária
export interface AuditLog {
  id: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioRole: UserRole;
  acao: AuditActionType;
  descricao: string;
  entidadeId?: string; // ID do objeto afetado (proposta, bloqueio, etc.)
  entidadeTipo?: string;
  timestamp: Date;
  ip?: string;
}

// Registro de histórico profissional (vinculado ao par cliente ↔ profissional)
export interface ProfessionalRecord {
  id: string;
  profissionalId: string;
  clienteId: string;
  tipo: 'avaliacao' | 'metrica' | 'plano' | 'observacao' | 'relatorio';
  titulo: string;
  conteudo: string;
  dados?: Record<string, string | number>; // Dados estruturados (peso, medidas, etc.)
  anexo?: string;
  criadoEm: Date;
  atualizadoEm?: Date;
  criadoPor: string; // Nome do profissional ou secretária
}

// Interface para cliente (visão do profissional nos contatos)
export interface ClientContact {
  id: string;
  clienteId: string;
  clienteNome: string;
  clienteFoto?: string;
  profissionalId: string;
  propostaAceita: boolean;
  gcoinsLiberados: boolean;
  gcoinsDisponiveis: number;
  dataVinculo: Date;
  compromissosFuturos: number;
}

export type AppScreen =
  | 'login'
  | 'cadastro'
  | 'galeria'
  | 'galeria-profissionais'
  | 'configuracoes'
  | 'calendario'
  | 'contatos'
  | 'solicitacoes'
  | 'perfil'
  | 'chat'
  | 'proposta'
  | 'config'
  | 'dependentes'
  | 'novo-dependente'
  | 'editar-dependente'
  | 'suporte'
  | 'gerenciar-agenda'
  | 'calendario-profissional'
  | 'calendario-pessoal'
  | 'notificacoes'
  | 'cliente-detalhe'
  | 'profissional-detalhe';
