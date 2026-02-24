-- ============================================================
-- APP FOX — Schema Completo (Multi-Tenant)
-- Execute no Supabase SQL Editor
-- ============================================================

-- ============================================================
-- EMPRESAS (cada cliente do SaaS)
-- ============================================================
CREATE TABLE IF NOT EXISTS empresas (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome              TEXT NOT NULL,
    cnpj              TEXT UNIQUE,
    numero_whatsapp   TEXT UNIQUE NOT NULL,
    grupo_whatsapp_id TEXT,
    plano             TEXT DEFAULT 'trial',
    trial_expira_em   TIMESTAMPTZ,
    ativo             BOOLEAN DEFAULT true,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- CORRETORES (usuários do sistema)
-- ============================================================
CREATE TABLE IF NOT EXISTS corretores (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id  UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    nome        TEXT NOT NULL,
    email       TEXT UNIQUE NOT NULL,
    telefone    TEXT,
    perfil      TEXT DEFAULT 'corretor', -- 'corretor' | 'gerente' | 'admin'
    ativo       BOOLEAN DEFAULT true,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- IMÓVEIS
-- ============================================================
CREATE TABLE IF NOT EXISTS imoveis (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id           UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    corretor_id          UUID REFERENCES corretores(id),
    codigo_interno       TEXT,
    tipo                 TEXT NOT NULL,           -- casa | apto | terreno | chacara
    bairro               TEXT NOT NULL,
    cidade               TEXT NOT NULL,
    cep                  TEXT,
    latitude             DECIMAL(10, 7),
    longitude            DECIMAL(10, 7),
    valor                DECIMAL(15, 2) NOT NULL,
    quartos              INT,
    metragem             DECIMAL(10, 2),
    area_pet             BOOLEAN DEFAULT false,
    mobiliado            BOOLEAN DEFAULT false,
    condominio           BOOLEAN DEFAULT false,
    valor_condominio     DECIMAL(15, 2),
    aceita_financiamento BOOLEAN DEFAULT false,
    finalidade           TEXT NOT NULL,           -- venda | aluguel
    status               TEXT DEFAULT 'disponivel', -- disponivel | vendido_corretor | vendido_outro | alugado | inativo
    destaque             BOOLEAN DEFAULT false,
    visualizacoes        INT DEFAULT 0,
    observacao           TEXT,
    data_cadastro        TIMESTAMPTZ DEFAULT NOW(),
    -- campos de fechamento
    data_venda           TIMESTAMPTZ,
    valor_venda          DECIMAL(15, 2),
    corretor_venda_id    UUID REFERENCES corretores(id),
    observacao_venda     TEXT
);

CREATE TABLE IF NOT EXISTS imovel_fotos (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
    url       TEXT NOT NULL,
    ordem     INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS imovel_historico_preco (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    imovel_id      UUID NOT NULL REFERENCES imoveis(id) ON DELETE CASCADE,
    valor_anterior DECIMAL(15, 2),
    valor_novo     DECIMAL(15, 2),
    alterado_em    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- LEADS (capturados via WhatsApp)
-- ============================================================
CREATE TABLE IF NOT EXISTS leads (
    id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    empresa_id            UUID NOT NULL REFERENCES empresas(id) ON DELETE CASCADE,
    corretor_id           UUID REFERENCES corretores(id),  -- corretor que assumiu
    telefone              TEXT NOT NULL,
    nome                  TEXT,
    email                 TEXT,
    origem                TEXT DEFAULT 'whatsapp',
    orcamento_min         DECIMAL(15, 2),
    orcamento_max         DECIMAL(15, 2),
    preferencias          JSONB DEFAULT '{}',              -- tipo, bairro, quartos etc
    status_lead           TEXT DEFAULT 'novo',             -- novo | em_atendimento | visita | proposta | fechado | perdido
    motivo_perda          TEXT,
    score                 INT DEFAULT 0,
    tentativas_contato    INT DEFAULT 0,
    data_primeiro_contato TIMESTAMPTZ DEFAULT NOW(),
    ultima_interacao      TIMESTAMPTZ,
    UNIQUE(empresa_id, telefone)
);

-- ============================================================
-- INTERAÇÕES (histórico de mensagens)
-- ============================================================
CREATE TABLE IF NOT EXISTS interacoes (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id            UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    mensagem           TEXT,
    tipo               TEXT NOT NULL,       -- cliente | bot | humano
    formato            TEXT DEFAULT 'texto', -- texto | audio
    transcricao        TEXT,                -- transcrição do áudio (Whisper)
    intencao_detectada TEXT,
    sentimento         TEXT,
    imoveis_sugeridos  JSONB DEFAULT '[]',
    lida               BOOLEAN DEFAULT false,
    duracao_audio      INT,
    data               TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- SESSÕES DO BOT (histórico de conversa para a IA)
-- ============================================================
CREATE TABLE IF NOT EXISTS sessoes_bot (
    id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id            UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    historico          JSONB DEFAULT '[]',
    ultima_atualizacao TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(lead_id)
);

-- ============================================================
-- ROW LEVEL SECURITY (Multi-tenant — isolamento por empresa)
-- ============================================================
ALTER TABLE empresas              ENABLE ROW LEVEL SECURITY;
ALTER TABLE corretores            ENABLE ROW LEVEL SECURITY;
ALTER TABLE imoveis               ENABLE ROW LEVEL SECURITY;
ALTER TABLE imovel_fotos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE imovel_historico_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE interacoes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessoes_bot           ENABLE ROW LEVEL SECURITY;

-- Políticas: service_role bypassa o RLS automaticamente.
-- O backend define app.empresa_id na conexão antes de qualquer query.
CREATE POLICY imoveis_empresa ON imoveis
    USING (empresa_id = current_setting('app.empresa_id', true)::UUID);

CREATE POLICY leads_empresa ON leads
    USING (empresa_id = current_setting('app.empresa_id', true)::UUID);

CREATE POLICY corretores_empresa ON corretores
    USING (empresa_id = current_setting('app.empresa_id', true)::UUID);

-- ============================================================
-- ÍNDICES (performance)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_imoveis_empresa    ON imoveis(empresa_id);
CREATE INDEX IF NOT EXISTS idx_imoveis_status     ON imoveis(status);
CREATE INDEX IF NOT EXISTS idx_imoveis_finalidade ON imoveis(finalidade);
CREATE INDEX IF NOT EXISTS idx_leads_empresa      ON leads(empresa_id);
CREATE INDEX IF NOT EXISTS idx_leads_status       ON leads(status_lead);
CREATE INDEX IF NOT EXISTS idx_leads_telefone     ON leads(telefone);
CREATE INDEX IF NOT EXISTS idx_interacoes_lead    ON interacoes(lead_id);
CREATE INDEX IF NOT EXISTS idx_corretores_empresa ON corretores(empresa_id);

-- ============================================================
-- REALTIME (dashboard ao vivo)
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE leads;
ALTER PUBLICATION supabase_realtime ADD TABLE interacoes;
ALTER PUBLICATION supabase_realtime ADD TABLE imoveis;
