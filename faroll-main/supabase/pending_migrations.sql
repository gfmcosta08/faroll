-- =====================================================================
-- PENDING MIGRATIONS — FarolBR
-- Projeto Supabase: btndyypkyrlktkadymuv
--
-- Execute este arquivo no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/btndyypkyrlktkadymuv/sql/new
--
-- Todas as declarações usam IF NOT EXISTS — seguro para re-executar.
-- =====================================================================

-- =====================================================================
-- PARTE 1: ENUM (cria apenas se não existir)
-- =====================================================================

DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('cliente', 'profissional', 'dependente', 'secretaria', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================================
-- PARTE 2: COLUNAS AUSENTES EM PROFILES
-- =====================================================================

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS perfil_ativo BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS categoria_profissao TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_refresh_token TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS google_calendar_token_expiry TIMESTAMP WITH TIME ZONE;

-- =====================================================================
-- PARTE 3: TABELAS AUSENTES
-- =====================================================================

-- 3.1 Vínculos profissional-cliente
CREATE TABLE IF NOT EXISTS public.professional_client_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    proposta_aceita BOOLEAN DEFAULT false,
    gcoins_liberados BOOLEAN DEFAULT false,
    data_vinculo TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (professional_id, client_id)
);

-- 3.2 Vínculos dependente-responsável
CREATE TABLE IF NOT EXISTS public.dependent_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    dependent_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    responsible_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    permissions JSONB DEFAULT '{"chatComVinculados": true, "verCalendario": true, "verCompromissos": true, "negociarProposta": false, "enviarArquivos": false, "consumirGcoin": false, "agendarCancelar": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (dependent_id, responsible_id)
);

-- 3.3 Vínculos secretária-profissional
CREATE TABLE IF NOT EXISTS public.secretary_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    secretary_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    permissions JSONB DEFAULT '{"gerenciarAgenda": true, "negociarProposta": true, "liberarGcoins": true, "acessoFinanceiro": true, "acessoClinico": false}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (secretary_id, professional_id)
);

-- 3.4 Gcoins
CREATE TABLE IF NOT EXISTS public.gcoins (
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

-- 3.5 Propostas
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    valor_acordado DECIMAL(10,2) NOT NULL,
    quantidade_gcoins INTEGER NOT NULL,
    descricao_acordo TEXT,
    antecedencia_minima INTEGER DEFAULT 24,
    prazo_cancelamento INTEGER DEFAULT 48,
    comprovante_anexo TEXT,
    status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviada', 'aceita', 'recusada')),
    data_criacao TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    data_resposta TIMESTAMP WITH TIME ZONE
);

-- 3.6 Mensagens de chat
CREATE TABLE IF NOT EXISTS public.chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    attachment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3.7 Notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    tipo TEXT NOT NULL CHECK (tipo IN ('mensagem', 'agendamento', 'cancelamento', 'lembrete', 'alteracao_regras')),
    titulo TEXT NOT NULL,
    descricao TEXT,
    lida BOOLEAN DEFAULT false,
    entidade_id UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 3.8 Logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
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

-- 3.9 Prontuários profissionais
CREATE TABLE IF NOT EXISTS public.professional_records (
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

-- 3.10 Avaliações de profissionais
CREATE TABLE IF NOT EXISTS public.professional_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    client_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    rating NUMERIC(3,1) NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comentario TEXT,
    anonimo BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (professional_id, client_id)
);

-- =====================================================================
-- PARTE 4: RLS — HABILITAR NAS NOVAS TABELAS
-- =====================================================================

ALTER TABLE public.professional_client_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependent_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.secretary_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gcoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_ratings ENABLE ROW LEVEL SECURITY;

-- =====================================================================
-- PARTE 5: FUNÇÕES AUXILIARES (OR REPLACE — seguro re-executar)
-- =====================================================================

CREATE OR REPLACE FUNCTION public.get_my_profile_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT public.has_role(auth.uid(), 'admin')
$$;

CREATE OR REPLACE FUNCTION public.has_client_link(prof_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.professional_client_links WHERE professional_id = prof_id AND client_id = public.get_my_profile_id())
$$;

CREATE OR REPLACE FUNCTION public.has_professional_link(cli_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.professional_client_links WHERE client_id = cli_id AND professional_id = public.get_my_profile_id())
$$;

CREATE OR REPLACE FUNCTION public.is_secretary_of(prof_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.secretary_links WHERE professional_id = prof_id AND secretary_id = public.get_my_profile_id())
$$;

CREATE OR REPLACE FUNCTION public.is_dependent_of(resp_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
    SELECT EXISTS (SELECT 1 FROM public.dependent_links WHERE responsible_id = resp_id AND dependent_id = public.get_my_profile_id())
$$;

CREATE OR REPLACE FUNCTION public.is_professional_profile(profile_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = profile_user_id AND role = 'profissional')
$$;

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- =====================================================================
-- PARTE 6: POLÍTICAS RLS (somente se não existirem)
-- =====================================================================

DO $$ BEGIN
    -- PROFESSIONAL_CLIENT_LINKS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_client_links' AND policyname='View own links') THEN
        CREATE POLICY "View own links" ON public.professional_client_links FOR SELECT USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_client_links' AND policyname='Professionals can create links') THEN
        CREATE POLICY "Professionals can create links" ON public.professional_client_links FOR INSERT WITH CHECK (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_client_links' AND policyname='Participants can update links') THEN
        CREATE POLICY "Participants can update links" ON public.professional_client_links FOR UPDATE USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id());
    END IF;

    -- DEPENDENT_LINKS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dependent_links' AND policyname='View dependent links') THEN
        CREATE POLICY "View dependent links" ON public.dependent_links FOR SELECT USING (dependent_id = public.get_my_profile_id() OR responsible_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='dependent_links' AND policyname='Responsible can manage dependent links') THEN
        CREATE POLICY "Responsible can manage dependent links" ON public.dependent_links FOR ALL USING (responsible_id = public.get_my_profile_id() OR public.is_admin());
    END IF;

    -- SECRETARY_LINKS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='secretary_links' AND policyname='View secretary links') THEN
        CREATE POLICY "View secretary links" ON public.secretary_links FOR SELECT USING (secretary_id = public.get_my_profile_id() OR professional_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='secretary_links' AND policyname='Professional can manage secretary links') THEN
        CREATE POLICY "Professional can manage secretary links" ON public.secretary_links FOR ALL USING (professional_id = public.get_my_profile_id() OR public.is_admin());
    END IF;

    -- GCOINS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gcoins' AND policyname='View own gcoins') THEN
        CREATE POLICY "View own gcoins" ON public.gcoins FOR SELECT USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='gcoins' AND policyname='Participants can manage gcoins') THEN
        CREATE POLICY "Participants can manage gcoins" ON public.gcoins FOR ALL USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id() OR public.is_admin());
    END IF;

    -- PROPOSALS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='proposals' AND policyname='View own proposals') THEN
        CREATE POLICY "View own proposals" ON public.proposals FOR SELECT USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='proposals' AND policyname='Clients can create proposals') THEN
        CREATE POLICY "Clients can create proposals" ON public.proposals FOR INSERT WITH CHECK (client_id = public.get_my_profile_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='proposals' AND policyname='Participants can update proposals') THEN
        CREATE POLICY "Participants can update proposals" ON public.proposals FOR UPDATE USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id());
    END IF;

    -- CHAT_MESSAGES
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='View own chat messages') THEN
        CREATE POLICY "View own chat messages" ON public.chat_messages FOR SELECT USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='chat_messages' AND policyname='Participants can send messages') THEN
        CREATE POLICY "Participants can send messages" ON public.chat_messages FOR INSERT WITH CHECK (sender_id = public.get_my_profile_id() AND (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id()));
    END IF;

    -- NOTIFICATIONS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='View own notifications') THEN
        CREATE POLICY "View own notifications" ON public.notifications FOR SELECT USING (user_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Authenticated users can create notifications') THEN
        CREATE POLICY "Authenticated users can create notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='notifications' AND policyname='Users can update own notifications') THEN
        CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (user_id = public.get_my_profile_id());
    END IF;

    -- AUDIT_LOGS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='Only admin can view audit logs') THEN
        CREATE POLICY "Only admin can view audit logs" ON public.audit_logs FOR SELECT USING (public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='audit_logs' AND policyname='Authenticated users can create audit logs') THEN
        CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
    END IF;

    -- PROFESSIONAL_RECORDS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_records' AND policyname='View own professional records') THEN
        CREATE POLICY "View own professional records" ON public.professional_records FOR SELECT USING (professional_id = public.get_my_profile_id() OR client_id = public.get_my_profile_id() OR public.is_admin());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_records' AND policyname='Professionals can manage records') THEN
        CREATE POLICY "Professionals can manage records" ON public.professional_records FOR ALL USING (professional_id = public.get_my_profile_id() OR public.is_admin());
    END IF;

    -- PROFESSIONAL_RATINGS
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_ratings' AND policyname='Anyone can view ratings') THEN
        CREATE POLICY "Anyone can view ratings" ON public.professional_ratings FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_ratings' AND policyname='Clients can create ratings') THEN
        CREATE POLICY "Clients can create ratings" ON public.professional_ratings FOR INSERT WITH CHECK (client_id = public.get_my_profile_id());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='professional_ratings' AND policyname='Clients can update own ratings') THEN
        CREATE POLICY "Clients can update own ratings" ON public.professional_ratings FOR UPDATE USING (client_id = public.get_my_profile_id());
    END IF;
END $$;

-- Política profiles: ver profissionais ativos (galeria pública)
DROP POLICY IF EXISTS "Usuarios podem ver perfis com relacionamento" ON public.profiles;
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='profiles' AND policyname='Usuarios podem ver perfis de profissionais ativos') THEN
        CREATE POLICY "Usuarios podem ver perfis de profissionais ativos" ON public.profiles FOR SELECT
        USING ((auth.uid() = user_id) OR (perfil_ativo = true AND public.is_professional_profile(user_id)));
    END IF;
END $$;

-- =====================================================================
-- PARTE 7: TRIGGERS (nas novas tabelas)
-- =====================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_professional_records_updated_at') THEN
        CREATE TRIGGER set_professional_records_updated_at
            BEFORE UPDATE ON public.professional_records
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_professional_ratings_updated_at') THEN
        CREATE TRIGGER set_professional_ratings_updated_at
            BEFORE UPDATE ON public.professional_ratings
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- =====================================================================
-- PARTE 8: TRIGGER DE PROPOSTA ACEITA
-- =====================================================================

CREATE OR REPLACE FUNCTION public.handle_proposal_accepted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'aceita' AND (OLD.status IS NULL OR OLD.status <> 'aceita') THEN
    INSERT INTO public.gcoins (professional_id, client_id, quantidade, consumido, proposta_id, data_liberacao)
    VALUES (NEW.professional_id, NEW.client_id, NEW.quantidade_gcoins, 0, NEW.id, now())
    ON CONFLICT (professional_id, client_id) DO UPDATE
      SET quantidade = gcoins.quantidade + EXCLUDED.quantidade;
    NEW.data_resposta := now();
    UPDATE public.professional_client_links
    SET gcoins_liberados = true, proposta_aceita = true
    WHERE professional_id = NEW.professional_id AND client_id = NEW.client_id;
  END IF;
  RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_proposal_accepted') THEN
        CREATE TRIGGER on_proposal_accepted
            BEFORE UPDATE ON public.proposals
            FOR EACH ROW EXECUTE FUNCTION public.handle_proposal_accepted();
    END IF;
END $$;

-- =====================================================================
-- PARTE 9: GOOGLE CALENDAR SYNC — external_id em calendar_events
-- =====================================================================

ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS external_id TEXT;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calendar_events_external_id') THEN
        CREATE INDEX idx_calendar_events_external_id ON public.calendar_events(external_id);
    END IF;
END $$;

-- =====================================================================
-- PARTE 10: PROFISSÃO CORRETOR DE IMÓVEIS
-- =====================================================================

DO $$
DECLARE v_prof_id uuid;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.professions WHERE nome = 'Corretor de Imóveis') THEN
        INSERT INTO public.professions (nome, registro_tipo, ativa)
        VALUES ('Corretor de Imóveis', 'CRECI', true)
        RETURNING id INTO v_prof_id;

        INSERT INTO public.specializations (nome, profession_id, ativa) VALUES
        ('Residencial', v_prof_id, true),
        ('Comercial', v_prof_id, true),
        ('Rural', v_prof_id, true),
        ('Lançamentos', v_prof_id, true),
        ('Lotes', v_prof_id, true),
        ('Alto Padrão', v_prof_id, true),
        ('Imóveis Industriais', v_prof_id, true),
        ('Avaliação de Imóveis', v_prof_id, true);
    END IF;
END $$;

-- =====================================================================
-- FIM — Execute e confirme que todas as linhas foram concluídas com sucesso
-- =====================================================================
