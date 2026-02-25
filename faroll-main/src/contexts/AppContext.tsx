import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Professional,
  Dependent,
  DependentePermissions,
  SecretariaPermissions,
  ChatMessage,
  User,
  AppScreen,
  Contact,
  Proposal,
  Gcoin,
  ScheduleBlock,
  BlockType,
  TimeRange,
  AuditLog,
  AuditActionType,
  PersonalEvent,
  Appointment,
  NotificationSettings,
  Notification,
  ProfessionalRecord
} from '@/types';
import { AuthUser } from '@/hooks/useAuth';
import { useAuthContext } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { SUPABASE_URL } from "@/integrations/supabase/env";

// Permissões padrão para Dependente (menor)
export const defaultDependentePermissions: DependentePermissions = {
  chatComVinculados: true,
  verCalendario: true,
  verCompromissos: true,
  negociarProposta: false,
  enviarArquivos: false,
  consumirGcoin: false,
  agendarCancelar: false,
};

// Permissões padrão para Secretária
export const defaultSecretariaPermissions: SecretariaPermissions = {
  gerenciarAgenda: true,
  negociarProposta: true,
  liberarGcoins: true,
  acessoFinanceiro: true,
  acessoClinico: false,
};

// Configurações de notificação padrão
export const defaultNotificationSettings: NotificationSettings = {
  receberMensagens: true,
  agendamentoCriado: true,
  agendamentoCancelado: true,
  proximoCompromisso: true,
  eventoCalendarioPessoal: true,
  alteracaoRegrasProfissional: true,
};


interface AppState {
  user: User | null;
  screen: AppScreen;
  screenHistory: AppScreen[]; // Histórico de navegação para botão Voltar
  selectedProfessional: Professional | null;
  selectedDependent: Dependent | null;
  professionals: Professional[];
  dependents: Dependent[];
  contacts: Contact[];
  proposals: Proposal[];
  gcoins: Gcoin[];
  scheduleBlocks: ScheduleBlock[];
  appointments: Appointment[];
  personalEvents: PersonalEvent[];
  notifications: Notification[];
  auditLogs: AuditLog[];
  professionalRecords: ProfessionalRecord[];
  chats: Record<string, ChatMessage[]>;
  supportChats: Record<string, ChatMessage[]>;
  isGoogleSyncEnabled: boolean;
}

interface AppContextType extends AppState {
  login: (nome: string, role: 'cliente' | 'profissional') => void;
  logout: () => void;
  navigate: (screen: AppScreen) => void;
  goBack: () => void;
  goToLanding: () => void;
  selectProfessional: (professional: Professional) => void;
  selectDependent: (dependent: Dependent) => void;
  addDependent: (dependent: Omit<Dependent, 'id'>) => void;
  updateDependent: (id: string, dependent: Partial<Dependent>) => void;
  removeDependent: (id: string) => void;
  sendMessage: (professionalId: string, message: string, attachment?: string) => void;
  sendSupportMessage: (message: string, attachment?: string) => void;
  updateUser: (data: Partial<User>) => void;
  getActiveContacts: () => Contact[];
  getChatKey: (professionalId: string) => string;
  canSendMessage: () => boolean;
  canSendProposal: () => boolean;
  sendProposal: (proposal: Omit<Proposal, 'id' | 'dataCriacao' | 'status'>) => void;
  respondProposal: (proposalId: string, accept: boolean) => void;
  getProposalForProfessional: (professionalId: string) => Proposal | undefined;
  // Funções de Gcoin
  getGcoinsForProfessional: (professionalId: string) => Gcoin | undefined;
  getGcoinsTotal: () => number;
  hasGcoinsWithProfessional: (professionalId: string) => boolean;
  canLiberarGcoins: () => boolean;
  // Funções de bloqueio de agenda
  addScheduleBlock: (block: Omit<ScheduleBlock, 'id' | 'criadoEm'>) => void;
  removeScheduleBlock: (blockId: string) => void;
  getBlocksForProfessional: (professionalId: string) => ScheduleBlock[];
  isDateBlocked: (professionalId: string, date: Date, hora?: string) => boolean;
  canManageSchedule: () => boolean;
  // Funções de permissão do Dependente
  canAccessChat: () => boolean;
  canViewCalendar: () => boolean;
  canSendFiles: () => boolean;
  canScheduleOrCancel: () => boolean;
  canConsumeGcoin: () => boolean;
  // Verifica permissão de agendamento por vínculo (quem possui Gcoins pode agendar)
  canScheduleWithProfessional: (professionalId: string) => boolean;
  // Funções de permissão da Secretária
  canAccessFinanceiro: () => boolean;
  canAccessClinico: () => boolean;
  isSecretaria: () => boolean;
  // Funções de auditoria
  logAction: (acao: AuditActionType, descricao: string, entidadeId?: string, entidadeTipo?: string) => void;
  getAuditLogs: () => AuditLog[];
  // Funções de agendamento
  createAppointment: (profissionalId: string, data: Date, hora: string) => boolean;
  cancelAppointment: (appointmentId: string) => boolean;
  getAppointmentsForProfessional: (professionalId: string) => Appointment[];
  getAppointmentsForClient: () => Appointment[];
  isTimeSlotAvailable: (professionalId: string, data: Date, hora: string) => boolean;
  validateSchedulingRules: (professionalId: string, data: Date, hora: string) => { valid: boolean; message?: string };
  // Funções de eventos pessoais
  addPersonalEvent: (event: Omit<PersonalEvent, 'id' | 'criadoEm' | 'userId'>) => void;
  removePersonalEvent: (eventId: string) => void;
  getPersonalEvents: () => PersonalEvent[];
  // Funções de notificação
  addNotification: (notification: Omit<Notification, 'id' | 'criadoEm' | 'lida'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
  getNotifications: () => Notification[];
  getUnreadNotificationsCount: () => number;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  // Funções de configuração do profissional
  updateProfessionalSettings: (antecedenciaAgendamento: number, antecedenciaCancelamento: number) => void;
  getProfessionalSettings: (professionalId: string) => { antecedenciaAgendamento: number; antecedenciaCancelamento: number };
  // Funções de histórico profissional
  addProfessionalRecord: (record: Omit<ProfessionalRecord, 'id' | 'criadoEm'>) => void;
  updateProfessionalRecord: (recordId: string, data: Partial<ProfessionalRecord>) => void;
  getProfessionalRecords: (professionalId: string, clienteId: string) => ProfessionalRecord[];
  toggleGoogleSync: (enabled: boolean) => void;
  syncWithGoogle: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

interface AppProviderProps {
  children: ReactNode;
  authUser?: AuthUser;
  onGoToLanding?: () => void;
}

export function AppProvider({ children, authUser, onGoToLanding }: AppProviderProps) {
  const { session, signInWithGoogle } = useAuthContext();
  // GUARD: Verificação defensiva para evitar crash se authUser veio incompleto
  const safeAuthUser = authUser && authUser.profileId && authUser.nome && authUser.role
    ? authUser
    : null;

  // Inicializa com usuário autenticado ou null (modo seguro)
  const initialUser: User | null = safeAuthUser ? {
    id: safeAuthUser.id,
    profileId: safeAuthUser.profileId,
    nome: safeAuthUser.nome,
    role: safeAuthUser.role,
    email: safeAuthUser.email || '',
    notificacoes: defaultNotificationSettings,
  } : null;

  const [state, setState] = useState<AppState>({
    user: initialUser,
    screen: 'galeria',
    screenHistory: [],
    selectedProfessional: null,
    selectedDependent: null,
    professionals: [], // Vazio - dados reais vêm do banco
    dependents: [],
    contacts: [],
    proposals: [],
    gcoins: [],
    scheduleBlocks: [],
    appointments: [],
    personalEvents: [],
    notifications: [],
    auditLogs: [],
    professionalRecords: [],
    chats: {},
    supportChats: {},
    isGoogleSyncEnabled: false,
  });

  // Atualiza usuário quando authUser mudar (com verificação defensiva)
  useEffect(() => {
    // GUARD: Só atualiza se authUser está completo para evitar crash
    if (authUser && authUser.profileId && authUser.nome && authUser.role) {
      setState(prev => ({
        ...prev,
        user: {
          id: authUser.id,
          profileId: authUser.profileId,
          nome: authUser.nome,
          role: authUser.role,
          email: authUser.email || '',
          notificacoes: prev.user?.notificacoes || defaultNotificationSettings,
        },
        screen: prev.screen === 'login' ? 'galeria' : prev.screen,
      }));
    }

    // Carregar dados do banco se logado
    if (authUser?.profileId) {
      // loadGoogleSyncSettings usa auth UID (authUser.id), loadCalendarData usa profileId
      loadGoogleSyncSettings(authUser.id);
      loadCalendarData(authUser.profileId);
    }
  }, [authUser]);

  // Processar retorno do Google OAuth (Captura de Tokens)
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const hash = window.location.hash.substring(1);
      const urlParams = new URLSearchParams(hash);
      const providerToken = urlParams.get('provider_token') || session?.provider_token;
      
      if (providerToken) {
        // Usa o auth UID (session.user.id) que é sempre disponível imediatamente
        // google_sync_settings.user_id agora referencia auth.users(id) diretamente
        const authUid = session?.user?.id || authUser?.id || state.user?.id;
        if (!authUid) {
          return;
        }

        try {
          const { error: upsertError } = await supabase.from('google_sync_settings').upsert({
            user_id: authUid,
            access_token: providerToken,
            refresh_token: urlParams.get('provider_refresh_token') || (session as any)?.provider_refresh_token || null,
            sync_enabled: true,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });

          if (upsertError) throw upsertError;

          setState(prev => ({ 
            ...prev, 
            isGoogleSyncEnabled: true,
            screen: 'gerenciar-agenda'
          }));

          if (window.location.hash) {
            window.history.replaceState(null, '', window.location.pathname);
          }
          
          toast.success("Google Calendar conectado com sucesso!");
          setTimeout(() => syncWithGoogle(true), 500);
        } catch (err) {
          console.error('[Google Sync] Erro na gravação:', err);
          toast.error("Erro ao salvar conexão com Google. Tente novamente.");
        }
      }
    };

    handleOAuthCallback();
  }, [session?.provider_token, session?.user?.id]);

  // Sincronização Automática do Google Calendar
  useEffect(() => {
    let interval: any;

    if (state.user?.profileId && state.isGoogleSyncEnabled) {
      // Primeira sincronização silenciada ao carregar
      syncWithGoogle(true);

      // Sincronização periódica a cada 5 minutos
      interval = setInterval(() => {
        syncWithGoogle(true);
      }, 5 * 60 * 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.user?.profileId, state.isGoogleSyncEnabled]);

  const loadCalendarData = async (profileId: string) => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .or(`user_id.eq.${profileId},professional_id.eq.${profileId},client_id.eq.${profileId}`);

      if (data) {
        // Mapear dados para os estados locais (legado)
        const blocks: ScheduleBlock[] = [];
        const appts: Appointment[] = [];
        const personal: PersonalEvent[] = [];

        data.forEach(item => {
          if (item.tipo === 'evento') {
            personal.push({
              id: item.id,
              userId: item.user_id,
              titulo: item.titulo || '',
              descricao: item.descricao || undefined,
              data: new Date(item.data),
              horaInicio: item.hora_inicio || '',
              horaFim: item.hora_fim || '',
              criadoEm: new Date(item.created_at),
              tipo: 'evento'
            });
          } else if (['dia', 'periodo', 'google_sync'].includes(item.tipo)) {
            blocks.push({
              id: item.id,
              profissionalId: item.professional_id || item.user_id,
              tipo: item.tipo as BlockType,
              dataInicio: new Date(item.data),
              dataFim: new Date(item.data_fim || item.data),
              faixasHorario: (item.faixas_horario as any) || [],
              motivo: item.motivo || undefined,
              criadoEm: new Date(item.created_at)
            });
          } else if (item.tipo === 'agendamento') {
            appts.push({
              id: item.id,
              clienteId: item.client_id || '',
              profissionalId: item.professional_id || '',
              data: new Date(item.data),
              hora: item.hora_inicio || '',
              status: item.status as any || 'confirmado',
              criadoEm: new Date(item.created_at)
            });
          }
        });

        setState(prev => ({
          ...prev,
          scheduleBlocks: blocks,
          appointments: appts,
          personalEvents: personal
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar dados do calendário:', e);
    }
  };



  const login = (nome: string, role: 'cliente' | 'profissional') => {
    // Mantido para compatibilidade - em modo real usa authUser
    const userId = role === 'cliente' ? 'cliente_responsavel_001' : 'profissional_001';

    setState(prev => ({
      ...prev,
      user: { id: userId, nome, role, notificacoes: defaultNotificationSettings },
      screen: 'galeria',
      screenHistory: [],
    }));
  };

  const logout = () => {
    // Em modo real, o logout é controlado pelo AuthContext
    setState(prev => ({
      ...prev,
      user: null,
      screen: 'login',
      screenHistory: [],
    }));
  };

  // Navegação com histórico - guarda tela atual antes de navegar
  // BLINDADO: try-catch para evitar "tela branca" em caso de erro
  const navigate = (screen: AppScreen) => {
    try {
      setState(prev => {
        // Não adiciona ao histórico se for a mesma tela ou login
        if (prev.screen === screen || screen === 'login') {
          return { ...prev, screen };
        }
        // Adiciona tela atual ao histórico
        const newHistory = [...prev.screenHistory, prev.screen];
        return { ...prev, screen, screenHistory: newHistory };
      });
    } catch (error) {
      console.error('[AppContext] navigate error (falling back to galeria):', error);
      // Fallback seguro: volta para galeria
      setState(prev => ({ ...prev, screen: 'galeria', screenHistory: [] }));
    }
  };

  // Voltar para tela anterior do histórico
  // BLINDADO: try-catch para evitar "tela branca" em caso de erro
  const goBack = () => {
    try {
      setState(prev => {
        if (prev.screenHistory.length === 0) {
          // Se não há histórico, volta para galeria
          return { ...prev, screen: 'galeria' };
        }
        // Pega última tela do histórico
        const newHistory = [...prev.screenHistory];
        const previousScreen = newHistory.pop() || 'galeria';
        return { ...prev, screen: previousScreen, screenHistory: newHistory };
      });
    } catch (error) {
      console.error('[AppContext] goBack error (falling back to galeria):', error);
      setState(prev => ({ ...prev, screen: 'galeria', screenHistory: [] }));
    }
  };

  const selectProfessional = (professional: Professional) => {
    setState(prev => ({
      ...prev,
      selectedProfessional: professional,
    }));
  };

  const selectDependent = (dependent: Dependent) => {
    setState(prev => ({
      ...prev,
      selectedDependent: dependent,
      screen: 'editar-dependente',
    }));
  };

  const addDependent = (dependent: Omit<Dependent, 'id'>) => {
    const newDependent = {
      ...dependent,
      id: Date.now().toString(),
      responsavelId: state.user?.id || '',
    };
    setState(prev => ({
      ...prev,
      dependents: [...prev.dependents, newDependent],
      screen: 'config',
    }));
  };

  const updateDependent = (id: string, data: Partial<Dependent>) => {
    setState(prev => ({
      ...prev,
      dependents: prev.dependents.map(d =>
        d.id === id ? { ...d, ...data } : d
      ),
      screen: 'config',
    }));
  };

  const removeDependent = (id: string) => {
    setState(prev => ({
      ...prev,
      dependents: prev.dependents.filter(d => d.id !== id),
    }));
  };

  // Gera chave única de chat: cliente + profissional
  const getChatKey = (professionalId: string): string => {
    const clientId = state.user?.id || '';
    return `${clientId}|${professionalId}`;
  };

  // Verifica se o usuário atual pode enviar mensagens
  const canSendMessage = (): boolean => {
    if (!state.user) return false;

    // Cliente e profissional podem enviar
    if (state.user.role === 'cliente' || state.user.role === 'profissional') {
      return true;
    }

    // Dependente só pode se tiver permissão chatComVinculados
    if (state.user.role === 'dependente') {
      // Em modo teste, dependente pode participar do chat
      // mas mensagens são registradas no chat do responsável
      return true;
    }

    // Secretária não tem permissão de chat clínico
    if (state.user.role === 'secretaria') {
      return false;
    }

    return false;
  };

  const sendMessage = (professionalId: string, message: string, attachment?: string) => {
    if (!canSendMessage()) return;

    // Chat isolado: usa chave do responsável, não do dependente
    const key = getChatKey(professionalId);

    // Identifica remetente (mostra se é dependente participando)
    const senderName = state.user?.role === 'dependente'
      ? `${state.user?.nome} (Dependente)`
      : state.user?.nome || 'Você';

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: senderName,
      content: message,
      timestamp: new Date(),
      attachment,
    };
    setState(prev => ({
      ...prev,
      chats: {
        ...prev.chats,
        [key]: [...(prev.chats[key] || []), newMessage],
      },
    }));
  };

  const sendSupportMessage = (message: string, attachment?: string) => {
    const key = `${state.user?.nome}|${state.user?.role}`;
    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      sender: state.user?.nome || 'Você',
      content: message,
      timestamp: new Date(),
      attachment,
    };
    setState(prev => ({
      ...prev,
      supportChats: {
        ...prev.supportChats,
        [key]: [...(prev.supportChats[key] || []), newMessage],
      },
    }));
  };

  const updateUser = (data: Partial<User>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? { ...prev.user, ...data } : null,
    }));
  };

  const getActiveContacts = (): Contact[] => {
    return state.contacts.filter(
      c => c.propostaEnviada && c.propostaAceita && c.gcoinsLiberados
    );
  };

  // Verifica se o usuário pode enviar proposta
  const canSendProposal = (): boolean => {
    if (!state.user) return false;

    // Apenas profissional pode enviar proposta
    if (state.user.role === 'profissional') {
      return true;
    }

    // Secretária pode enviar se tiver permissão negociarProposta
    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.negociarProposta;
    }

    // Cliente, dependente não podem enviar proposta
    return false;
  };

  // Envia uma proposta (com auditoria)
  const sendProposal = (proposalData: Omit<Proposal, 'id' | 'dataCriacao' | 'status'>) => {
    if (!canSendProposal()) return;

    const newProposal: Proposal = {
      ...proposalData,
      id: Date.now().toString(),
      status: 'enviada',
      dataCriacao: new Date(),
    };

    setState(prev => {
      // Auditoria: registrar ação
      const newLog: AuditLog = {
        id: (Date.now() + 1).toString(),
        usuarioId: prev.user?.nome || 'unknown',
        usuarioNome: prev.user?.nome || 'unknown',
        usuarioRole: prev.user?.role || 'cliente',
        acao: 'proposta_enviada',
        descricao: `Proposta enviada: R$ ${proposalData.valorAcordado} / ${proposalData.quantidadeGcoins} Gcoins`,
        entidadeId: newProposal.id,
        entidadeTipo: 'proposal',
        timestamp: new Date(),
      };


      // Atualiza contato para marcar proposta enviada
      const updatedContacts = prev.contacts.map(c =>
        c.profissionalId === proposalData.profissionalId
          ? { ...c, propostaEnviada: true }
          : c
      );

      return {
        ...prev,
        proposals: [...prev.proposals, newProposal],
        contacts: updatedContacts,
        auditLogs: [...prev.auditLogs, newLog],
      };
    });
  };

  // Responde a uma proposta (aceitar ou recusar) - com auditoria
  const respondProposal = (proposalId: string, accept: boolean) => {
    setState(prev => {
      const proposal = prev.proposals.find(p => p.id === proposalId);
      if (!proposal) return prev;

      const newStatus: 'aceita' | 'recusada' = accept ? 'aceita' : 'recusada';
      const updatedProposals = prev.proposals.map(p =>
        p.id === proposalId
          ? { ...p, status: newStatus, dataResposta: new Date() }
          : p
      );

      // Se aceita, cria vínculo ativo e libera Gcoins
      let updatedContacts = prev.contacts;
      let updatedGcoins = prev.gcoins;
      const newLogs: AuditLog[] = [];

      // Auditoria: registrar resposta da proposta
      newLogs.push({
        id: (Date.now() + 1).toString(),
        usuarioId: prev.user?.nome || 'unknown',
        usuarioNome: prev.user?.nome || 'unknown',
        usuarioRole: prev.user?.role || 'cliente',
        acao: accept ? 'proposta_aceita' : 'proposta_recusada',
        descricao: accept
          ? `Proposta aceita: R$ ${proposal.valorAcordado} / ${proposal.quantidadeGcoins} Gcoins`
          : `Proposta recusada`,
        entidadeId: proposalId,
        entidadeTipo: 'proposal',
        timestamp: new Date(),
      });

      if (accept) {
        const existingContact = prev.contacts.find(c => c.profissionalId === proposal.profissionalId);
        const professional = prev.professionals.find(p => p.id === proposal.profissionalId);

        if (existingContact) {
          updatedContacts = prev.contacts.map(c =>
            c.profissionalId === proposal.profissionalId
              ? { ...c, propostaAceita: true, gcoinsLiberados: true, dataVinculo: new Date() }
              : c
          );
        } else if (professional) {
          // Cria novo contato com vínculo ativo
          const newContact: Contact = {
            id: Date.now().toString(),
            profissionalId: proposal.profissionalId,
            profissionalNome: professional.nome,
            profissionalFoto: professional.foto,
            propostaEnviada: true,
            propostaAceita: true,
            gcoinsLiberados: true,
            dataVinculo: new Date(),
            compromissosFuturos: 0,
          };
          updatedContacts = [...prev.contacts, newContact];
        }

        // Cria Gcoin vinculado à proposta aceita (SSOT: 1 profissional + 1 cliente)
        const existingGcoin = prev.gcoins.find(g => g.profissionalId === proposal.profissionalId);
        if (!existingGcoin) {
          const newGcoin: Gcoin = {
            id: Date.now().toString(),
            profissionalId: proposal.profissionalId,
            clienteId: proposal.clienteId,
            quantidade: proposal.quantidadeGcoins,
            propostaId: proposal.id,
            dataLiberacao: new Date(),
            consumido: 0,
            disponivel: proposal.quantidadeGcoins,
          };
          updatedGcoins = [...prev.gcoins, newGcoin];

          // Auditoria: Gcoin liberado
          newLogs.push({
            id: (Date.now() + 2).toString(),
            usuarioId: prev.user?.nome || 'unknown',
            usuarioNome: prev.user?.nome || 'unknown',
            usuarioRole: prev.user?.role || 'cliente',
            acao: 'gcoin_liberado',
            descricao: `${proposal.quantidadeGcoins} Gcoins liberados para profissional ${proposal.profissionalId}`,
            entidadeId: newGcoin.id,
            entidadeTipo: 'gcoin',
            timestamp: new Date(),
          });
        } else {
          // Adiciona Gcoins ao vínculo existente
          updatedGcoins = prev.gcoins.map(g =>
            g.profissionalId === proposal.profissionalId
              ? {
                ...g,
                quantidade: g.quantidade + proposal.quantidadeGcoins,
                disponivel: g.disponivel + proposal.quantidadeGcoins,
              }
              : g
          );

          // Auditoria: Gcoin adicionado
          newLogs.push({
            id: (Date.now() + 2).toString(),
            usuarioId: prev.user?.nome || 'unknown',
            usuarioNome: prev.user?.nome || 'unknown',
            usuarioRole: prev.user?.role || 'cliente',
            acao: 'gcoin_liberado',
            descricao: `${proposal.quantidadeGcoins} Gcoins adicionados ao vínculo existente`,
            entidadeId: existingGcoin.id,
            entidadeTipo: 'gcoin',
            timestamp: new Date(),
          });
        }
      }

      // Log no console

      return {
        ...prev,
        proposals: updatedProposals,
        contacts: updatedContacts,
        gcoins: updatedGcoins,
        auditLogs: [...prev.auditLogs, ...newLogs],
      };
    });
  };

  // Obtém proposta para um profissional específico
  const getProposalForProfessional = (professionalId: string): Proposal | undefined => {
    return state.proposals.find(p => p.profissionalId === professionalId);
  };

  // ========== FUNÇÕES DE GCOIN (SIMULADAS) ==========

  // Obtém Gcoins para um profissional específico (vínculo isolado)
  const getGcoinsForProfessional = (professionalId: string): Gcoin | undefined => {
    return state.gcoins.find(g => g.profissionalId === professionalId);
  };

  // Retorna total de Gcoins disponíveis (soma de todos os vínculos)
  const getGcoinsTotal = (): number => {
    return state.gcoins.reduce((total, g) => total + g.disponivel, 0);
  };

  // Verifica se existe Gcoins com um profissional específico
  const hasGcoinsWithProfessional = (professionalId: string): boolean => {
    const gcoin = getGcoinsForProfessional(professionalId);
    return gcoin ? gcoin.disponivel > 0 : false;
  };

  // Verifica se o usuário atual pode liberar Gcoins
  // Apenas profissional pode liberar (ou secretária com permissão)
  const canLiberarGcoins = (): boolean => {
    if (!state.user) return false;

    if (state.user.role === 'profissional') {
      return true;
    }

    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.liberarGcoins;
    }

    return false;
  };

  // ========== FUNÇÕES DE BLOQUEIO DE AGENDA ==========

  // Adiciona um novo bloqueio de agenda (com auditoria e Supabase)
  const addScheduleBlock = async (block: Omit<ScheduleBlock, 'id' | 'criadoEm'>) => {
    if (!canManageSchedule() || !state.user?.id) return;

    try {
      const { data, error } = await supabase.from('calendar_events').insert({
        user_id: state.user.profileId,
        professional_id: block.profissionalId,
        tipo: block.tipo,
        data: block.dataInicio.toISOString().split('T')[0],
        data_fim: block.dataFim.toISOString().split('T')[0],
        faixas_horario: block.faixasHorario as any,
        motivo: block.motivo
      }).select().single();

      if (data) {
        const newBlock: ScheduleBlock = {
          ...block,
          id: data.id,
          criadoEm: new Date(data.created_at),
        };

        setState(prev => {
          const newLog: AuditLog = {
            id: (Date.now() + 1).toString(),
            usuarioId: prev.user?.nome || 'unknown',
            usuarioNome: prev.user?.nome || 'unknown',
            usuarioRole: prev.user?.role || 'cliente',
            acao: 'agenda_bloqueio_criado',
            descricao: `Bloqueio de ${block.tipo} criado para ${block.dataInicio.toLocaleDateString()}`,
            entidadeId: newBlock.id,
            entidadeTipo: 'schedule_block',
            timestamp: new Date(),
          };

          return {
            ...prev,
            scheduleBlocks: [...prev.scheduleBlocks, newBlock],
            auditLogs: [...prev.auditLogs, newLog],
          };
        });
        toast.success("Agenda bloqueada com sucesso");
      }
    } catch (e) {
      console.error('Erro ao salvar bloqueio:', e);
      toast.error("Erro ao salvar bloqueio no banco de dados");
    }
  };

  // Remove um bloqueio de agenda (com auditoria e Supabase)
  const removeScheduleBlock = async (blockId: string) => {
    if (!canManageSchedule()) return;

    try {
      const block = state.scheduleBlocks.find(b => b.id === blockId);
      const isGoogleSync = block?.tipo === 'google_sync';

      if (isGoogleSync) {
        // Blocos do Google: blockId é o external_id (ID do evento no Google Calendar)
        // Remove do banco por external_id e também do Google Calendar
        const { error } = await supabase
          .from('calendar_events')
          .delete()
          .eq('external_id', blockId);

        if (error) throw error;

        // Remove do Google Calendar também
        if (state.isGoogleSyncEnabled) {
          deleteEventFromGoogle(blockId);
        }
      } else {
        // Blocos normais: blockId é o UUID do banco
        const { error } = await supabase.from('calendar_events').delete().eq('id', blockId);
        if (error) throw error;
      }

      setState(prev => {
        const newLog: AuditLog = {
          id: (Date.now() + 1).toString(),
          usuarioId: prev.user?.nome || 'unknown',
          usuarioNome: prev.user?.nome || 'unknown',
          usuarioRole: prev.user?.role || 'cliente',
          acao: 'agenda_bloqueio_removido',
          descricao: `Bloqueio removido: ${block?.tipo || 'unknown'}`,
          entidadeId: blockId,
          entidadeTipo: 'schedule_block',
          timestamp: new Date(),
        };

        return {
          ...prev,
          scheduleBlocks: prev.scheduleBlocks.filter(b => b.id !== blockId),
          auditLogs: [...prev.auditLogs, newLog],
        };
      });

      toast.info(isGoogleSync ? "Evento removido do Google Calendar e da agenda" : "Bloqueio removido");
    } catch (e) {
      console.error('Erro ao remover bloqueio:', e);
      toast.error("Erro ao remover bloqueio do banco de dados");
    }
  };

  // Obtém bloqueios de um profissional específico
  const getBlocksForProfessional = (professionalId: string): ScheduleBlock[] => {
    return state.scheduleBlocks.filter(b => b.profissionalId === professionalId);
  };

  // Verifica se uma data/hora está bloqueada para um profissional
  const isDateBlocked = (professionalId: string, date: Date, hora?: string): boolean => {
    const blocks = getBlocksForProfessional(professionalId);

    for (const block of blocks) {
      const dateStart = new Date(block.dataInicio);
      const dateEnd = new Date(block.dataFim);

      // Normaliza as datas para comparação (ignora hora)
      const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const blockStart = new Date(dateStart.getFullYear(), dateStart.getMonth(), dateStart.getDate());
      const blockEnd = new Date(dateEnd.getFullYear(), dateEnd.getMonth(), dateEnd.getDate());

      // Verifica se a data está dentro do período bloqueado
      if (checkDate >= blockStart && checkDate <= blockEnd) {
        // Se não foi passado horário, verifica se existe algum bloqueio para o dia
        if (!hora) {
          // Se existem faixas de horário, o dia não está totalmente bloqueado
          if (block.faixasHorario && block.faixasHorario.length > 0) {
            return false;
          }
          return true;
        }

        // Verifica se o horário cai em alguma das faixas bloqueadas
        if (block.faixasHorario && block.faixasHorario.length > 0) {
          for (const faixa of block.faixasHorario) {
            if (hora >= faixa.horaInicio && hora < faixa.horaFim) {
              return true;
            }
          }
        }
      }
    }

    return false;
  };

  // Verifica se o usuário atual pode gerenciar a agenda
  const canManageSchedule = (): boolean => {
    if (!state.user) return false;

    // Apenas profissional pode gerenciar sua agenda
    if (state.user.role === 'profissional') {
      return true;
    }

    // Secretária pode gerenciar se tiver permissão
    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.gerenciarAgenda;
    }

    // Cliente e dependente NÃO podem gerenciar agenda
    return false;
  };

  // ========== FUNÇÕES DE PERMISSÃO DO DEPENDENTE ==========

  // Verifica se pode acessar chat (dependente: apenas com vínculos)
  const canAccessChat = (): boolean => {
    if (!state.user) return false;

    // Cliente e profissional podem sempre acessar
    if (state.user.role === 'cliente' || state.user.role === 'profissional') {
      return true;
    }

    // Dependente pode acessar chat com vínculos existentes
    if (state.user.role === 'dependente') {
      return defaultDependentePermissions.chatComVinculados;
    }

    // Secretária NÃO pode acessar chat clínico
    if (state.user.role === 'secretaria') {
      return false;
    }

    return false;
  };

  // Verifica se pode visualizar calendário e compromissos
  const canViewCalendar = (): boolean => {
    if (!state.user) return false;

    // Todos podem ver calendário, exceto regras específicas
    if (state.user.role === 'dependente') {
      return defaultDependentePermissions.verCalendario && defaultDependentePermissions.verCompromissos;
    }

    return true;
  };

  // Verifica se pode enviar arquivos
  const canSendFiles = (): boolean => {
    if (!state.user) return false;

    // Dependente NÃO pode enviar arquivos
    if (state.user.role === 'dependente') {
      return defaultDependentePermissions.enviarArquivos; // false
    }

    // Cliente e profissional podem
    if (state.user.role === 'cliente' || state.user.role === 'profissional') {
      return true;
    }

    // Secretária pode se tiver acesso clínico (que é sempre false)
    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.acessoClinico;
    }

    return false;
  };

  // Verifica se pode agendar ou cancelar compromissos
  const canScheduleOrCancel = (): boolean => {
    if (!state.user) return false;

    // Dependente NÃO pode agendar/cancelar
    if (state.user.role === 'dependente') {
      return defaultDependentePermissions.agendarCancelar; // false
    }

    // Cliente pode agendar/cancelar
    if (state.user.role === 'cliente') {
      return true;
    }

    // Profissional pode gerenciar sua agenda
    if (state.user.role === 'profissional') {
      return true;
    }

    // Secretária pode se tiver permissão de gerenciar agenda
    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.gerenciarAgenda;
    }

    return false;
  };

  // ========== PERMISSÃO DE AGENDAMENTO POR VÍNCULO (REGRA DE OURO ABSOLUTA) ==========
  // PRESTADOR NUNCA AGENDA. CONSUMIDOR SEMPRE AGENDA.
  // A definição de papel é feita POR VÍNCULO, não pelo perfil global.
  const canScheduleWithProfessional = (professionalId: string): boolean => {
    if (!state.user) return false;

    // Dependente NUNCA pode agendar
    if (state.user.role === 'dependente') {
      return false;
    }

    // Buscar o vínculo (Gcoin) entre o usuário e o profissional
    const gcoin = getGcoinsForProfessional(professionalId);

    if (!gcoin) {
      return false;
    }

    // REGRA DE OURO: Identificar o PAPEL do usuário NESTE vínculo específico
    const userId = state.user.id || '';
    const isPrestadorNoVinculo = userId === gcoin.profissionalId;
    const isConsumidorNoVinculo = userId === gcoin.clienteId;

    console.log('[REGRA DE OURO] Papel no vínculo:', {
      userId,
      professionalId,
      gcoinProfissionalId: gcoin.profissionalId,
      gcoinClienteId: gcoin.clienteId,
      isPrestadorNoVinculo,
      isConsumidorNoVinculo,
      gcoinsDisponiveis: gcoin.disponivel,
    });

    // BLOQUEIO ABSOLUTO: Se o usuário é o PRESTADOR neste vínculo, NUNCA pode agendar
    if (isPrestadorNoVinculo) {
      console.error('[BLOQUEIO ABSOLUTO] Usuário é o PRESTADOR neste vínculo. Agendamento NEGADO.');
      return false;
    }

    // PERMISSÃO: Se o usuário é o CONSUMIDOR e possui Gcoins disponíveis
    if (isConsumidorNoVinculo && gcoin.disponivel > 0) {
      return true;
    }

    // Caso especial: Secretária pode gerenciar agenda se tiver permissão
    // MAS apenas se o vínculo permitir (não é prestadora)
    if (state.user.role === 'secretaria') {
      if (isPrestadorNoVinculo) {
        console.error('[BLOQUEIO] Secretária não pode agendar para clientes do profissional.');
        return false;
      }
      const canManage = defaultSecretariaPermissions.gerenciarAgenda && isConsumidorNoVinculo && gcoin.disponivel > 0;
      return canManage;
    }

    return false;
  };

  // Verifica se pode consumir Gcoin
  const canConsumeGcoin = (): boolean => {
    if (!state.user) return false;

    // Dependente NÃO pode consumir Gcoin
    if (state.user.role === 'dependente') {
      return defaultDependentePermissions.consumirGcoin; // false
    }

    // Cliente pode consumir seus Gcoins
    if (state.user.role === 'cliente') {
      return true;
    }

    // Profissional não consome, ele libera
    if (state.user.role === 'profissional') {
      return false;
    }

    // Secretária não pode consumir
    if (state.user.role === 'secretaria') {
      return false;
    }

    return false;
  };

  // ========== FUNÇÕES DE PERMISSÃO DA SECRETÁRIA ==========

  // Verifica se pode acessar dados financeiros
  const canAccessFinanceiro = (): boolean => {
    if (!state.user) return false;

    // Secretária pode acessar se tiver permissão
    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.acessoFinanceiro;
    }

    // Profissional pode acessar
    if (state.user.role === 'profissional') {
      return true;
    }

    // Cliente pode ver seus próprios dados financeiros
    if (state.user.role === 'cliente') {
      return true;
    }

    // Dependente NÃO pode acessar
    return false;
  };

  // Verifica se pode acessar conteúdo clínico (SEMPRE false para secretária)
  const canAccessClinico = (): boolean => {
    if (!state.user) return false;

    // Secretária NUNCA pode acessar conteúdo clínico
    if (state.user.role === 'secretaria') {
      return defaultSecretariaPermissions.acessoClinico; // sempre false
    }

    // Profissional e cliente podem
    if (state.user.role === 'profissional' || state.user.role === 'cliente') {
      return true;
    }

    // Dependente pode com vínculo
    if (state.user.role === 'dependente') {
      return defaultDependentePermissions.chatComVinculados;
    }

    return false;
  };

  // Verifica se o usuário atual é secretária
  const isSecretaria = (): boolean => {
    return state.user?.role === 'secretaria';
  };

  // ========== FUNÇÕES DE AUDITORIA ==========

  // Registra uma ação no log de auditoria
  const logAction = (
    acao: AuditActionType,
    descricao: string,
    entidadeId?: string,
    entidadeTipo?: string
  ) => {
    if (!state.user) return;

    const newLog: AuditLog = {
      id: Date.now().toString(),
      usuarioId: state.user.nome, // Em modo teste, usa nome como ID
      usuarioNome: state.user.nome,
      usuarioRole: state.user.role,
      acao,
      descricao,
      entidadeId,
      entidadeTipo,
      timestamp: new Date(),
    };

    setState(prev => ({
      ...prev,
      auditLogs: [...prev.auditLogs, newLog],
    }));

    console.log('[AUDIT LOG]', {
      usuario: newLog.usuarioNome,
      role: newLog.usuarioRole,
      acao: newLog.acao,
      descricao: newLog.descricao,
      timestamp: newLog.timestamp.toISOString(),
    });
  };

  // Retorna todos os logs de auditoria
  const getAuditLogs = (): AuditLog[] => {
    return state.auditLogs;
  };

  // ========== FUNÇÕES DE AGENDAMENTO ==========

  // Verifica se um horário está disponível
  const isTimeSlotAvailable = (professionalId: string, data: Date, hora: string): boolean => {
    // Verifica se está bloqueado
    if (isDateBlocked(professionalId, data, hora)) {
      return false;
    }

    // Verifica se já existe agendamento
    const existingAppointment = state.appointments.find(a =>
      a.profissionalId === professionalId &&
      a.data.toDateString() === data.toDateString() &&
      a.hora === hora &&
      a.status !== 'cancelado'
    );

    return !existingAppointment;
  };

  // Valida regras de antecedência
  const validateSchedulingRules = (professionalId: string, data: Date, hora: string): { valid: boolean; message?: string } => {
    const professional = state.professionals.find(p => p.id === professionalId);
    if (!professional) {
      return { valid: false, message: 'Profissional não encontrado' };
    }

    const antecedenciaMinutos = professional.antecedenciaAgendamento || 1440; // 24h padrão
    const agora = new Date();

    // Cria data/hora do agendamento
    const [horaNum, minutoNum] = hora.split(':').map(Number);
    const dataAgendamento = new Date(data);
    dataAgendamento.setHours(horaNum, minutoNum, 0, 0);

    // Calcula diferença em minutos
    const diffMs = dataAgendamento.getTime() - agora.getTime();
    const diffMinutos = diffMs / (1000 * 60);

    if (diffMinutos < antecedenciaMinutos) {
      const horas = Math.floor(antecedenciaMinutos / 60);
      const minutos = antecedenciaMinutos % 60;
      const tempoFormatado = horas > 0
        ? `${horas}h${minutos > 0 ? ` ${minutos}min` : ''}`
        : `${minutos}min`;
      return {
        valid: false,
        message: `Antecedência mínima de ${tempoFormatado} para agendamento`
      };
    }

    return { valid: true };
  };

  // Cria um agendamento
  const createAppointment = (professionalId: string, data: Date, hora: string): boolean => {
    // REGRA DE OURO: Só pode agendar quem possui Gcoins no vínculo específico
    if (!canScheduleWithProfessional(professionalId)) {
      console.error('[BLOQUEIO] Usuário não possui Gcoins neste vínculo. Agendamento bloqueado.');
      return false;
    }

    // Verifica disponibilidade
    if (!isTimeSlotAvailable(professionalId, data, hora)) {
      return false;
    }

    // Valida regras de antecedência
    const validation = validateSchedulingRules(professionalId, data, hora);
    if (!validation.valid) {
      return false;
    }

    const newAppointment: Appointment = {
      id: Date.now().toString(),
      profissionalId: professionalId,
      clienteId: state.user?.id || 'cliente_responsavel_001',
      clienteNome: state.user?.nome || 'Cliente',
      data,
      hora,
      status: 'agendado',
      criadoEm: new Date(),
    };

    setState(prev => {
      // Auditoria
      const newLog: AuditLog = {
        id: (Date.now() + 1).toString(),
        usuarioId: prev.user?.nome || 'unknown',
        usuarioNome: prev.user?.nome || 'unknown',
        usuarioRole: prev.user?.role || 'cliente',
        acao: 'agendamento_criado',
        descricao: `Agendamento criado para ${data.toLocaleDateString()} às ${hora}`,
        entidadeId: newAppointment.id,
        entidadeTipo: 'appointment',
        timestamp: new Date(),
      };


      // Adiciona notificação para o profissional
      const notificacao: Notification = {
        id: (Date.now() + 2).toString(),
        userId: professionalId,
        tipo: 'agendamento',
        titulo: 'Novo Agendamento',
        descricao: `Agendamento criado para ${data.toLocaleDateString()} às ${hora}`,
        lida: false,
        criadoEm: new Date(),
        entidadeId: newAppointment.id,
      };

      return {
        ...prev,
        appointments: [...prev.appointments, newAppointment],
        notifications: [...prev.notifications, notificacao],
        auditLogs: [...prev.auditLogs, newLog],
      };
    });

    // Push real para o Google Calendar
    if (state.isGoogleSyncEnabled) {
      const dataObj = new Date(data);
      const [h, m] = hora.split(':').map(Number);
      dataObj.setHours(h, m, 0, 0);
      const dataFimObj = new Date(dataObj.getTime() + 60 * 60 * 1000);
      const isProfissional = state.user?.role === 'profissional';
      const titulo = isProfissional
        ? `Cliente: ${newAppointment.clienteNome}`
        : `Consulta — Agendamento`;
      pushEventToGoogle(titulo, dataObj, dataFimObj).then(() => {});
    }

    return true;
  };

  // Cancela um agendamento
  const cancelAppointment = (appointmentId: string): boolean => {
    if (!canScheduleOrCancel()) return false;

    const appointment = state.appointments.find(a => a.id === appointmentId);
    if (!appointment) return false;

    // Remove do Google Calendar se tiver ID externo
    if (state.isGoogleSyncEnabled && (appointment as any).externalId) {
      deleteEventFromGoogle((appointment as any).externalId);
    }

    setState(prev => {
      const newLog: AuditLog = {
        id: (Date.now() + 1).toString(),
        usuarioId: prev.user?.nome || 'unknown',
        usuarioNome: prev.user?.nome || 'unknown',
        usuarioRole: prev.user?.role || 'cliente',
        acao: 'agendamento_cancelado',
        descricao: `Agendamento cancelado: ${appointment.data.toLocaleDateString()} às ${appointment.hora}`,
        entidadeId: appointmentId,
        entidadeTipo: 'appointment',
        timestamp: new Date(),
      };


      // Adiciona notificação
      const notificacao: Notification = {
        id: (Date.now() + 2).toString(),
        userId: appointment.profissionalId,
        tipo: 'cancelamento',
        titulo: 'Agendamento Cancelado',
        descricao: `Agendamento de ${appointment.data.toLocaleDateString()} às ${appointment.hora} foi cancelado`,
        lida: false,
        criadoEm: new Date(),
        entidadeId: appointmentId,
      };

      return {
        ...prev,
        appointments: prev.appointments.map(a =>
          a.id === appointmentId ? { ...a, status: 'cancelado' as const } : a
        ),
        notifications: [...prev.notifications, notificacao],
        auditLogs: [...prev.auditLogs, newLog],
      };
    });

    return true;
  };

  // Obtém agendamentos de um profissional
  const getAppointmentsForProfessional = (professionalId: string): Appointment[] => {
    return state.appointments.filter(a =>
      a.profissionalId === professionalId && a.status !== 'cancelado'
    );
  };

  // Obtém agendamentos do cliente
  const getAppointmentsForClient = (): Appointment[] => {
    return state.appointments.filter(a =>
      a.clienteId === state.user?.id && a.status !== 'cancelado'
    );
  };

  // ========== FUNÇÕES DE EVENTOS PESSOAIS ==========

  const addPersonalEvent = async (event: Omit<PersonalEvent, 'id' | 'criadoEm' | 'userId'>) => {
    if (!state.user?.profileId) return;

    try {
      const { data, error } = await supabase.from('calendar_events').insert({
        user_id: state.user.profileId,
        tipo: 'evento',
        titulo: event.titulo,
        descricao: event.descricao,
        data: event.data.toISOString().split('T')[0],
        hora_inicio: event.horaInicio,
        hora_fim: event.horaFim
      }).select().single();

      if (data) {
        const newEvent: PersonalEvent = {
          ...event,
          id: data.id,
          userId: data.user_id,
          criadoEm: new Date(data.created_at),
        };

        setState(prev => ({
          ...prev,
          personalEvents: [...prev.personalEvents, newEvent],
        }));

        logAction('evento_calendario_pessoal', `Evento "${event.titulo}" criado`, data.id, 'evento');

        // Push real para o Google Calendar
        if (state.isGoogleSyncEnabled) {
          const [hIni, mIni] = event.horaInicio.split(':').map(Number);
          const [hFim, mFim] = event.horaFim.split(':').map(Number);
          const dataInicio = new Date(event.data);
          dataInicio.setHours(hIni, mIni, 0, 0);
          const dataFim = new Date(event.data);
          dataFim.setHours(hFim, mFim, 0, 0);

          pushEventToGoogle(event.titulo, dataInicio, dataFim, event.descricao).then(googleId => {
            if (googleId) {
              // Salva o external_id para poder deletar depois
              supabase.from('calendar_events').update({ external_id: googleId }).eq('id', data.id);
            }
          });
        }
      }
    } catch (e) {
      console.error('Erro ao salvar evento pessoal:', e);
      toast.error("Erro ao salvar evento no servidor");
    }
  };

  const removePersonalEvent = async (eventId: string) => {
    try {
      // Busca o external_id antes de deletar para remover do Google também
      const { data: evData } = await supabase
        .from('calendar_events')
        .select('external_id')
        .eq('id', eventId)
        .single();

      if (evData?.external_id && state.isGoogleSyncEnabled) {
        deleteEventFromGoogle(evData.external_id);
      }

      await supabase.from('calendar_events').delete().eq('id', eventId);
      setState(prev => ({
        ...prev,
        personalEvents: prev.personalEvents.filter(e => e.id !== eventId),
      }));
    } catch (e) {
      console.error('Erro ao remover evento pessoal:', e);
    }
  };

  const getPersonalEvents = (): PersonalEvent[] => {
    if (!state.user?.id) return [];
    return state.personalEvents.filter(e => e.userId === state.user?.id);
  };

  // ========== FUNÇÕES DE NOTIFICAÇÃO ==========

  const addNotification = (notification: Omit<Notification, 'id' | 'criadoEm' | 'lida'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      lida: false,
      criadoEm: new Date(),
    };

    setState(prev => ({
      ...prev,
      notifications: [...prev.notifications, newNotification],
    }));
  };

  const markNotificationAsRead = (notificationId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, lida: true } : n
      ),
    }));
  };

  const getNotifications = (): Notification[] => {
    return state.notifications;
  };

  const getUnreadNotificationsCount = (): number => {
    return state.notifications.filter(n => !n.lida).length;
  };

  const updateNotificationSettings = (settings: Partial<NotificationSettings>) => {
    setState(prev => ({
      ...prev,
      user: prev.user ? {
        ...prev.user,
        notificacoes: {
          ...defaultNotificationSettings,
          ...prev.user.notificacoes,
          ...settings,
        },
      } : null,
    }));
  };

  // ========== FUNÇÕES DE CONFIGURAÇÃO DO PROFISSIONAL ==========

  const updateProfessionalSettings = (antecedenciaAgendamento: number, antecedenciaCancelamento: number) => {
    // Em modo teste, atualiza o primeiro profissional
    setState(prev => {
      const newLog: AuditLog = {
        id: Date.now().toString(),
        usuarioId: prev.user?.nome || 'unknown',
        usuarioNome: prev.user?.nome || 'unknown',
        usuarioRole: prev.user?.role || 'cliente',
        acao: 'regras_antecedencia_alteradas',
        descricao: `Antecedência alterada: Agendamento ${antecedenciaAgendamento}min, Cancelamento ${antecedenciaCancelamento}min`,
        timestamp: new Date(),
      };


      // Notifica clientes vinculados sobre alteração de regras
      const novasNotificacoes: Notification[] = prev.contacts
        .filter(c => c.propostaAceita && c.gcoinsLiberados)
        .map(c => ({
          id: (Date.now() + Math.random()).toString(),
          userId: c.profissionalId,
          tipo: 'alteracao_regras' as const,
          titulo: 'Regras Alteradas',
          descricao: `O profissional alterou as regras de antecedência: Agendamento ${Math.floor(antecedenciaAgendamento / 60)}h, Cancelamento ${Math.floor(antecedenciaCancelamento / 60)}h`,
          lida: false,
          criadoEm: new Date(),
        }));

      return {
        ...prev,
        professionals: prev.professionals.map((p, index) =>
          index === 0 ? { ...p, antecedenciaAgendamento, antecedenciaCancelamento } : p
        ),
        notifications: [...prev.notifications, ...novasNotificacoes],
        auditLogs: [...prev.auditLogs, newLog],
      };
    });
  };

  const getProfessionalSettings = (professionalId: string): { antecedenciaAgendamento: number; antecedenciaCancelamento: number } => {
    const professional = state.professionals.find(p => p.id === professionalId);
    return {
      antecedenciaAgendamento: professional?.antecedenciaAgendamento || 1440,
      antecedenciaCancelamento: professional?.antecedenciaCancelamento || 2880,
    };
  };

  // ========== FUNÇÕES DE HISTÓRICO PROFISSIONAL ==========

  const addProfessionalRecord = (record: Omit<ProfessionalRecord, 'id' | 'criadoEm'>) => {
    const newRecord: ProfessionalRecord = {
      ...record,
      id: Date.now().toString(),
      criadoEm: new Date(),
    };

    setState(prev => ({
      ...prev,
      professionalRecords: [...prev.professionalRecords, newRecord],
    }));
  };

  const updateProfessionalRecord = (recordId: string, data: Partial<ProfessionalRecord>) => {
    setState(prev => ({
      ...prev,
      professionalRecords: prev.professionalRecords.map(r =>
        r.id === recordId ? { ...r, ...data, atualizadoEm: new Date() } : r
      ),
    }));
  };

  // ─── Helpers Google Calendar ───────────────────────────────────────────────

  /** Renova o access_token usando a Edge Function. Retorna o novo token ou null. */
  const refreshGoogleToken = async (): Promise<string | null> => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (!currentSession?.access_token) return null;

      const res = await fetch(
        `${SUPABASE_URL}/functions/v1/google-token-refresh`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${currentSession.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      if (!res.ok) return null;
      const data = await res.json();
      return data.access_token || null;
    } catch (e) {
      console.warn('[Google Sync] Falha ao renovar token:', e);
      return null;
    }
  };

  /**
   * Faz uma chamada autenticada à Google Calendar API.
   * Em caso de 401, tenta renovar o token e repete.
   */
  const callGoogleCalendarAPI = async (
    url: string,
    options: RequestInit,
    _profileId: string,
    retry = true
  ): Promise<Response> => {
    const authUid = session?.user?.id || state.user?.id;
    const { data: settings } = await supabase
      .from('google_sync_settings')
      .select('access_token')
      .eq('user_id', authUid)
      .single();

    const token = settings?.access_token;
    if (!token) throw new Error('Google não conectado.');

    const headers = { ...(options.headers || {}), Authorization: `Bearer ${token}` };
    const res = await fetch(url, { ...options, headers });

    if (res.status === 401 && retry) {
      const newToken = await refreshGoogleToken();
      if (!newToken) {
        // Sem refresh_token ou edge function: pede reconexão
        setState(prev => ({ ...prev, isGoogleSyncEnabled: false }));
        throw new Error('Sessão Google expirada. Reconecte o Google Calendar em Configurações.');
      }
      const retryHeaders = { ...(options.headers || {}), Authorization: `Bearer ${newToken}` };
      return fetch(url, { ...options, headers: retryHeaders });
    }

    return res;
  };

  /** Cria ou atualiza um evento no Google Calendar. Retorna o ID do evento no Google. */
  const pushEventToGoogle = async (
    titulo: string,
    dataInicio: Date,
    dataFim: Date,
    descricao?: string,
    externalId?: string
  ): Promise<string | null> => {
    if (!state.isGoogleSyncEnabled) return null;

    try {
      const body = JSON.stringify({
        summary: titulo,
        description: descricao || '',
        start: { dateTime: dataInicio.toISOString(), timeZone: 'America/Sao_Paulo' },
        end: { dateTime: dataFim.toISOString(), timeZone: 'America/Sao_Paulo' },
      });

      let url = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
      let method = 'POST';

      if (externalId) {
        url = `${url}/${externalId}`;
        method = 'PUT';
      }

      const res = await callGoogleCalendarAPI(
        url,
        { method, headers: { 'Content-Type': 'application/json' }, body },
        ''
      );

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        console.warn('[Google Sync] Falha ao criar evento:', errData);
        return null;
      }

      const gEvent = await res.json();
      return gEvent.id || null;
    } catch (e) {
      console.warn('[Google Sync] Erro ao criar evento no Google:', e);
      return null;
    }
  };

  /** Remove um evento do Google Calendar pelo ID externo. */
  const deleteEventFromGoogle = async (externalId: string): Promise<void> => {
    if (!state.isGoogleSyncEnabled || !externalId) return;

    try {
      await callGoogleCalendarAPI(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${externalId}`,
        { method: 'DELETE' },
        ''
      );
    } catch (e) {
      console.warn('[Google Sync] Erro ao deletar evento no Google:', e);
    }
  };

  // ───────────────────────────────────────────────────────────────────────────

  const loadGoogleSyncSettings = async (userId: string) => {
    try {
      const { data } = await supabase
        .from('google_sync_settings')
        .select('sync_enabled, access_token')
        .eq('user_id', userId)
        .maybeSingle();

      if (data) {
        // Só ativa se tiver o token e estiver marcado como ligado
        const isActive = !!(data.sync_enabled && data.access_token);
        setState(prev => ({ ...prev, isGoogleSyncEnabled: isActive }));
      } else {
        setState(prev => ({ ...prev, isGoogleSyncEnabled: false }));
      }
    } catch (e) {
      console.error('[Google Sync] Erro ao carregar configurações:', e);
    }
  };

  const getProfessionalRecords = (professionalId: string, clienteId: string): ProfessionalRecord[] => {
    return state.professionalRecords
      .filter(r => r.profissionalId === professionalId && r.clienteId === clienteId)
      .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime());
  };

  const toggleGoogleSync = async (enabled: boolean) => {
    const authUid = session?.user?.id || state.user?.id;
    if (!authUid) return;

    try {
      if (enabled) {
        const { data: settings } = await supabase
          .from('google_sync_settings')
          .select('access_token')
          .eq('user_id', authUid)
          .maybeSingle();

        if (!settings?.access_token) {
          signInWithGoogle();
          return;
        }

        await supabase.from('google_sync_settings').update({
          sync_enabled: true,
          updated_at: new Date().toISOString()
        }).eq('user_id', authUid);

        setState(prev => ({ ...prev, isGoogleSyncEnabled: true }));
        syncWithGoogle(true);
      } else {
        await supabase.from('google_sync_settings').delete().eq('user_id', authUid);
        await supabase.from('calendar_events').delete().eq('user_id', state.user?.profileId).eq('tipo', 'google_sync');

        setState(prev => ({
          ...prev,
          isGoogleSyncEnabled: false,
          scheduleBlocks: prev.scheduleBlocks.filter(b => b.tipo !== 'google_sync')
        }));

        toast.success("Sincronização desativada e dados limpos.");
      }
    } catch (e) {
      console.error('[Google Sync] Erro no toggle:', e);
    }
  };

  const syncWithGoogle = async (silent = false) => {
    const authUid = session?.user?.id || state.user?.id;
    if (!authUid || !state.isGoogleSyncEnabled) return;

    const syncLogic = new Promise(async (resolve, reject) => {
      try {
        // 1. Buscar tokens do banco — usa auth UID como user_id
        const { data: settings, error: settingsError } = await supabase
          .from('google_sync_settings')
          .select('*')
          .eq('user_id', authUid)
          .single();

        if (settingsError || !settings?.access_token) {
          reject(new Error("Google não conectado. Configure em 'Gerenciar Regras'."));
          return;
        }

        const timeMin = new Date().toISOString();
        const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

        // 2. Buscar eventos da API Real do Google
        const response = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
          {
            headers: { 'Authorization': `Bearer ${settings.access_token}` }
          }
        );

        if (response.status === 401) {
          const newToken = await refreshGoogleToken();
          if (newToken) {
            const retryResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${timeMin}&timeMax=${timeMax}&singleEvents=true&orderBy=startTime`,
              { headers: { 'Authorization': `Bearer ${newToken}` } }
            );
            if (!retryResponse.ok) {
              reject(new Error("Falha ao sincronizar mesmo após renovar token."));
              return;
            }
            const retryData = await retryResponse.json();
            Object.assign(gData, retryData);
          } else {
            await supabase.from('google_sync_settings').delete().eq('user_id', authUid);
            await supabase.from('calendar_events').delete().eq('user_id', state.user!.profileId).eq('tipo', 'google_sync');
            setState(prev => ({
              ...prev,
              isGoogleSyncEnabled: false,
              scheduleBlocks: prev.scheduleBlocks.filter(b => b.tipo !== 'google_sync')
            }));
            reject(new Error("Sessão Google expirada. Reconecte o Google Calendar em Configurações."));
            return;
          }
        }

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error?.message || "Erro ao acessar Google Calendar API");
        }

        const gData = response.ok ? await response.json() : {};
        const items = gData.items || [];

        // 3. Limpar e Persistir no Supabase — calendar_events usa profileId
        await supabase.from('calendar_events').delete().eq('user_id', state.user!.profileId).eq('tipo', 'google_sync');

        const eventsToInsert = items.map((item: any) => {
          const start = new Date(item.start.dateTime || item.start.date);
          const end = new Date(item.end.dateTime || item.end.date);

          return {
            user_id: state.user!.profileId,
            professional_id: state.user!.profileId,
            tipo: 'google_sync',
            titulo: item.summary || 'Bloqueio Google',
            data: format(start, 'yyyy-MM-dd'),
            data_fim: format(end, 'yyyy-MM-dd'),
            hora_inicio: format(start, 'HH:mm:ss'),
            hora_fim: format(end, 'HH:mm:ss'),
            external_id: item.id,
            motivo: item.summary
          };
        });

        if (eventsToInsert.length > 0) {
          const { error: insError } = await supabase.from('calendar_events').insert(eventsToInsert);
          if (insError) throw insError;
        }

        // 4. Atualizar Estado Local
        const newBlocks: ScheduleBlock[] = eventsToInsert.map((e: any) => ({
          id: e.external_id,
          profissionalId: e.professional_id,
          tipo: 'google_sync',
          dataInicio: new Date(`${e.data}T${e.hora_inicio}`),
          dataFim: new Date(`${e.data_fim}T${e.hora_fim}`),
          motivo: e.titulo,
          criadoEm: new Date()
        }));

        setState(prev => ({
          ...prev,
          scheduleBlocks: [
            ...prev.scheduleBlocks.filter(b => b.tipo !== 'google_sync'),
            ...newBlocks
          ]
        }));

        resolve(true);
      } catch (e: any) {
        console.error('[Google Sync Error]', e);
        reject(e);
      }
    });

    if (silent) {
      try { await syncLogic; } catch (e) { console.warn('[Google Sync Background] Falha:', e); }
    } else {
      toast.promise(syncLogic, {
        loading: 'Sincronizando com Google...',
        success: 'Sincronização concluída!',
        error: (err: any) => `Erro: ${err?.message || 'Tente novamente.'}`,
      });
    }
  };

  return (
    <AppContext.Provider
      value={{
        ...state,
        login,
        logout,
        navigate,
        goBack,
        goToLanding: onGoToLanding || (() => navigate('galeria')),
        selectProfessional,
        selectDependent,
        addDependent,
        updateDependent,
        removeDependent,
        sendMessage,
        sendSupportMessage,
        updateUser,
        getActiveContacts,
        getChatKey,
        canSendMessage,
        canSendProposal,
        sendProposal,
        respondProposal,
        getProposalForProfessional,
        getGcoinsForProfessional,
        getGcoinsTotal,
        hasGcoinsWithProfessional,
        canLiberarGcoins,
        addScheduleBlock,
        removeScheduleBlock,
        getBlocksForProfessional,
        isDateBlocked,
        canManageSchedule,
        canAccessChat,
        canViewCalendar,
        canSendFiles,
        canScheduleOrCancel,
        canScheduleWithProfessional,
        canConsumeGcoin,
        canAccessFinanceiro,
        canAccessClinico,
        isSecretaria,
        logAction,
        getAuditLogs,
        createAppointment,
        cancelAppointment,
        getAppointmentsForProfessional,
        getAppointmentsForClient,
        isTimeSlotAvailable,
        validateSchedulingRules,
        addPersonalEvent,
        removePersonalEvent,
        getPersonalEvents,
        addNotification,
        markNotificationAsRead,
        getNotifications,
        getUnreadNotificationsCount,
        updateNotificationSettings,
        updateProfessionalSettings,
        getProfessionalSettings,
        addProfessionalRecord,
        updateProfessionalRecord,
        getProfessionalRecords,
        toggleGoogleSync,
        syncWithGoogle,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}
