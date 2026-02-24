-- ===========================================
-- SISTEMA DE AUTENTICAÇÃO E CONTROLE DE ACESSO
-- ===========================================

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('cliente', 'profissional', 'dependente', 'secretaria', 'admin');

-- 2. Tabela de roles de usuário (separada da profiles para segurança)
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'cliente',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Tabela de perfis
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cpf TEXT,
    pais TEXT DEFAULT 'Brasil',
    estado TEXT,
    cidade TEXT,
    avatar_url TEXT,
    -- Campos específicos para profissionais
    profissao TEXT,
    especialidades TEXT[],
    tipo_atendimento TEXT,
    descricao TEXT,
    registro TEXT,
    -- Configurações de antecedência (profissionais)
    antecedencia_agendamento INTEGER DEFAULT 1440, -- 24h em minutos
    antecedencia_cancelamento INTEGER DEFAULT 2880, -- 48h em minutos
    -- Configurações de notificação
    notificacoes JSONB DEFAULT '{"receberMensagens": true, "agendamentoCriado": true, "agendamentoCancelado": true, "proximoCompromisso": true, "eventoCalendarioPessoal": true, "alteracaoRegrasProfissional": true}'::jsonb,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 4. Tabela de vínculos profissional-cliente
CREATE TABLE public.professional_client_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    proposta_aceita BOOLEAN DEFAULT false,
    gcoins_liberados BOOLEAN DEFAULT false,
    data_vinculo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (professional_id, client_id)
);

-- 5. Tabela de vínculos dependente-responsável
CREATE TABLE public.dependent_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    permissions JSONB DEFAULT '{"chatComVinculados": true, "verCalendario": true, "verCompromissos": true, "negociarProposta": false, "enviarArquivos": false, "consumirGcoin": false, "agendarCancelar": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (dependent_id, responsible_id)
);

-- 6. Tabela de vínculos secretária-profissional
CREATE TABLE public.secretary_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretary_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    permissions JSONB DEFAULT '{"gerenciarAgenda": true, "negociarProposta": true, "liberarGcoins": true, "acessoFinanceiro": true, "acessoClinico": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (secretary_id, professional_id)
);

-- 7. Tabela de Gcoins (créditos por vínculo)
CREATE TABLE public.gcoins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    proposta_id UUID,
    quantidade INTEGER NOT NULL DEFAULT 0,
    consumido INTEGER NOT NULL DEFAULT 0,
    disponivel INTEGER GENERATED ALWAYS AS (quantidade - consumido) STORED,
    data_liberacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (professional_id, client_id)
);

-- 8. Tabela de propostas
CREATE TABLE public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    valor_acordado DECIMAL(10,2) NOT NULL,
    quantidade_gcoins INTEGER NOT NULL,
    descricao_acordo TEXT,
    antecedencia_minima INTEGER DEFAULT 24, -- em horas
    prazo_cancelamento INTEGER DEFAULT 48, -- em horas
    comprovante_anexo TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviada', 'aceita', 'recusada')),
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_resposta TIMESTAMP WITH TIME ZONE
);

-- 9. Tabela de eventos do calendário (eventos pessoais, agendamentos, bloqueios)
CREATE TABLE public.calendar_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    dependent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('evento_pessoal', 'agendamento', 'bloqueio')),
    titulo TEXT,
    descricao TEXT,
    data DATE NOT NULL,
    hora_inicio TIME,
    hora_fim TIME,
    -- Campos específicos para agendamentos
    status TEXT DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'cancelado', 'concluido')),
    gcoin_consumido BOOLEAN DEFAULT false,
    -- Campos específicos para bloqueios
    data_fim DATE, -- Para bloqueios de período
    faixas_horario JSONB, -- Array de {horaInicio, horaFim}
    motivo TEXT,
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 10. Tabela de mensagens de chat
CREATE TABLE public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 11. Tabela de notificações
CREATE TABLE public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('mensagem', 'agendamento', 'cancelamento', 'lembrete', 'alteracao_regras')),
    titulo TEXT NOT NULL,
    descricao TEXT,
    lida BOOLEAN DEFAULT false,
    entidade_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 12. Tabela de logs de auditoria
CREATE TABLE public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_nome TEXT,
    user_role TEXT,
    acao TEXT NOT NULL,
    descricao TEXT,
    entidade_id UUID,
    entidade_tipo TEXT,
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 13. Tabela de registros profissionais (histórico clínico)
CREATE TABLE public.professional_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('avaliacao', 'metrica', 'plano', 'observacao', 'relatorio')),
    titulo TEXT NOT NULL,
    conteudo TEXT,
    dados JSONB,
    anexo TEXT,
    criado_por TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ===========================================
-- FUNÇÕES AUXILIARES PARA RLS (SECURITY DEFINER)
-- ===========================================

-- Função para verificar se usuário tem determinado role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
    )
$$;

-- Função para obter o profile_id do usuário autenticado
CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

-- Função para verificar se é admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Função para verificar se tem vínculo como cliente com profissional
CREATE OR REPLACE FUNCTION public.has_client_link(prof_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.professional_client_links
        WHERE professional_id = prof_id
          AND client_id = public.get_my_profile_id()
    )
$$;

-- Função para verificar se tem vínculo como profissional com cliente
CREATE OR REPLACE FUNCTION public.has_professional_link(cli_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.professional_client_links
        WHERE client_id = cli_id
          AND professional_id = public.get_my_profile_id()
    )
$$;

-- Função para verificar se é secretária de um profissional
CREATE OR REPLACE FUNCTION public.is_secretary_of(prof_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.secretary_links
        WHERE professional_id = prof_id
          AND secretary_id = public.get_my_profile_id()
    )
$$;

-- Função para verificar se é dependente de um responsável
CREATE OR REPLACE FUNCTION public.is_dependent_of(resp_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.dependent_links
        WHERE responsible_id = resp_id
          AND dependent_id = public.get_my_profile_id()
    )
$$;

-- ===========================================
-- HABILITAR RLS EM TODAS AS TABELAS
-- ===========================================

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gcoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_records ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- POLÍTICAS RLS
-- ===========================================

-- USER_ROLES: Apenas admin pode gerenciar, usuários podem ver seu próprio role
CREATE POLICY "Users can view own roles" ON public.user_roles
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can insert roles" ON public.user_roles
    FOR INSERT WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles" ON public.user_roles
    FOR UPDATE USING (public.is_admin());

CREATE POLICY "Only admins can delete roles" ON public.user_roles
    FOR DELETE USING (public.is_admin());

-- PROFILES: Usuários podem ver e atualizar seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles
    FOR SELECT USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Users can view linked profiles" ON public.profiles
    FOR SELECT USING (
        id IN (
            SELECT professional_id FROM public.professional_client_links WHERE client_id = public.get_my_profile_id()
            UNION
            SELECT client_id FROM public.professional_client_links WHERE professional_id = public.get_my_profile_id()
            UNION
            SELECT professional_id FROM public.secretary_links WHERE secretary_id = public.get_my_profile_id()
            UNION
            SELECT responsible_id FROM public.dependent_links WHERE dependent_id = public.get_my_profile_id()
        )
    );

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (user_id = auth.uid() OR public.is_admin());

-- PROFESSIONAL_CLIENT_LINKS
CREATE POLICY "View own links" ON public.professional_client_links
    FOR SELECT USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Professionals can create links" ON public.professional_client_links
    FOR INSERT WITH CHECK (
        professional_id = public.get_my_profile_id()
        OR client_id = public.get_my_profile_id()
    );

CREATE POLICY "Participants can update links" ON public.professional_client_links
    FOR UPDATE USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
    );

-- DEPENDENT_LINKS
CREATE POLICY "View dependent links" ON public.dependent_links
    FOR SELECT USING (
        dependent_id = public.get_my_profile_id() 
        OR responsible_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Responsible can manage dependent links" ON public.dependent_links
    FOR ALL USING (responsible_id = public.get_my_profile_id() OR public.is_admin());

-- SECRETARY_LINKS
CREATE POLICY "View secretary links" ON public.secretary_links
    FOR SELECT USING (
        secretary_id = public.get_my_profile_id() 
        OR professional_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Professional can manage secretary links" ON public.secretary_links
    FOR ALL USING (professional_id = public.get_my_profile_id() OR public.is_admin());

-- GCOINS
CREATE POLICY "View own gcoins" ON public.gcoins
    FOR SELECT USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Participants can manage gcoins" ON public.gcoins
    FOR ALL USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
        OR public.is_admin()
    );

-- PROPOSALS
CREATE POLICY "View own proposals" ON public.proposals
    FOR SELECT USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Clients can create proposals" ON public.proposals
    FOR INSERT WITH CHECK (client_id = public.get_my_profile_id());

CREATE POLICY "Participants can update proposals" ON public.proposals
    FOR UPDATE USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
    );

-- CALENDAR_EVENTS
CREATE POLICY "View own calendar events" ON public.calendar_events
    FOR SELECT USING (
        user_id = public.get_my_profile_id()
        OR professional_id = public.get_my_profile_id()
        OR client_id = public.get_my_profile_id()
        OR public.is_secretary_of(professional_id)
        OR public.is_admin()
    );

CREATE POLICY "Dependents can view responsible events" ON public.calendar_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.dependent_links dl
            WHERE dl.dependent_id = public.get_my_profile_id()
            AND (dl.responsible_id = user_id OR dl.responsible_id = client_id)
        )
    );

CREATE POLICY "Users can create own events" ON public.calendar_events
    FOR INSERT WITH CHECK (
        user_id = public.get_my_profile_id()
        OR (tipo = 'agendamento' AND client_id = public.get_my_profile_id())
        OR public.is_secretary_of(professional_id)
    );

CREATE POLICY "Users can update own events" ON public.calendar_events
    FOR UPDATE USING (
        user_id = public.get_my_profile_id()
        OR client_id = public.get_my_profile_id()
        OR public.is_secretary_of(professional_id)
    );

CREATE POLICY "Users can delete own events" ON public.calendar_events
    FOR DELETE USING (
        user_id = public.get_my_profile_id()
        OR public.is_secretary_of(professional_id)
    );

-- CHAT_MESSAGES
CREATE POLICY "View own chat messages" ON public.chat_messages
    FOR SELECT USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Participants can send messages" ON public.chat_messages
    FOR INSERT WITH CHECK (
        sender_id = public.get_my_profile_id()
        AND (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id())
    );

-- NOTIFICATIONS
CREATE POLICY "View own notifications" ON public.notifications
    FOR SELECT USING (user_id = public.get_my_profile_id() OR public.is_admin());

CREATE POLICY "System can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (user_id = public.get_my_profile_id());

-- AUDIT_LOGS: Apenas admin pode ver
CREATE POLICY "Only admin can view audit logs" ON public.audit_logs
    FOR SELECT USING (public.is_admin());

CREATE POLICY "System can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (true);

-- PROFESSIONAL_RECORDS: Apenas profissional e cliente envolvidos (secretária NÃO pode ver)
CREATE POLICY "View own professional records" ON public.professional_records
    FOR SELECT USING (
        professional_id = public.get_my_profile_id() 
        OR client_id = public.get_my_profile_id()
        OR public.is_admin()
    );

CREATE POLICY "Professionals can manage records" ON public.professional_records
    FOR ALL USING (professional_id = public.get_my_profile_id() OR public.is_admin());

-- ===========================================
-- TRIGGER PARA CRIAR PERFIL E ROLE AUTOMATICAMENTE
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role app_role;
    raw_meta JSONB;
BEGIN
    raw_meta := NEW.raw_user_meta_data;
    
    -- Determina o role baseado no metadata (padrão: cliente)
    user_role := COALESCE(
        (raw_meta->>'role')::app_role,
        'cliente'
    );
    
    -- Impede criação de admin via signup
    IF user_role = 'admin' THEN
        user_role := 'cliente';
    END IF;
    
    -- Cria o perfil
    INSERT INTO public.profiles (user_id, nome, email)
    VALUES (
        NEW.id,
        COALESCE(raw_meta->>'nome', raw_meta->>'name', split_part(NEW.email, '@', 1)),
        NEW.email
    );
    
    -- Cria o role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
    
    RETURN NEW;
END;
$$;

-- Trigger para novos usuários
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===========================================
-- TRIGGER PARA UPDATED_AT
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_calendar_events_updated_at
    BEFORE UPDATE ON public.calendar_events
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_professional_records_updated_at
    BEFORE UPDATE ON public.professional_records
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();