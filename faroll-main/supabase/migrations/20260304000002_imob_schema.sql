-- =====================================================
-- FAROLL IMÓVEIS — Schema imob
-- Projeto: btndyypkyrlktkadymuv
-- Execute no SQL Editor do Supabase
-- =====================================================

CREATE SCHEMA IF NOT EXISTS imob;

-- Permissões
GRANT USAGE ON SCHEMA imob TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA imob GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- =====================================================
-- 1. TIPOS
-- =====================================================
CREATE TYPE imob.user_role AS ENUM (
  'dono_imobiliaria',
  'gerente',
  'corretor',
  'secretaria'
);

CREATE TYPE imob.plano AS ENUM (
  'trial',
  'basic',
  'pro',
  'enterprise'
);

-- =====================================================
-- 2. EMPRESAS (tenant raiz — multi-tenant isolado por empresa_id)
-- =====================================================
CREATE TABLE imob.empresas (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome                TEXT NOT NULL,
  cnpj                TEXT,
  numero_whatsapp     TEXT,
  grupo_whatsapp_id   TEXT,
  plano               imob.plano DEFAULT 'trial',
  trial_expira_em     TIMESTAMPTZ DEFAULT (now() + interval '14 days'),
  ativo               BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 3. PERFIS (extende auth.users — login único com faroll-main)
-- =====================================================
CREATE TABLE imob.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        imob.user_role NOT NULL DEFAULT 'dono_imobiliaria',
  empresa_id  UUID REFERENCES imob.empresas(id) ON DELETE SET NULL,
  nome        TEXT,
  email       TEXT,
  telefone    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- 4. CORRETORES (pode ter user_id para login ou não)
-- =====================================================
CREATE TABLE imob.corretores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  empresa_id  UUID NOT NULL REFERENCES imob.empresas(id) ON DELETE CASCADE,
  nome        TEXT NOT NULL,
  email       TEXT,
  telefone    TEXT,
  perfil      imob.user_role DEFAULT 'corretor',
  ativo       BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 5. IMÓVEIS (schema completo com campos v2 + v3)
-- =====================================================
CREATE TABLE imob.imoveis (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id                  UUID NOT NULL REFERENCES imob.empresas(id) ON DELETE CASCADE,
  corretor_id                 UUID REFERENCES imob.corretores(id) ON DELETE SET NULL,

  -- Identificação
  codigo_interno              TEXT,
  titulo                      TEXT,
  proprietario_nome           TEXT,
  proprietario_telefone       TEXT,
  exclusividade               BOOLEAN DEFAULT false,

  -- Tipo e finalidade
  tipo                        TEXT CHECK (tipo IN ('casa','apto','terreno','chacara','comercial','outros')),
  finalidade                  TEXT DEFAULT 'venda' CHECK (finalidade IN ('venda','aluguel','ambos')),
  status                      TEXT DEFAULT 'disponivel'
                                CHECK (status IN ('disponivel','vendido_corretor','vendido_outro','alugado','inativo')),

  -- Localização
  cep                         TEXT,
  endereco                    TEXT,
  numero                      TEXT,
  complemento                 TEXT,
  bairro                      TEXT,
  cidade                      TEXT,
  estado                      TEXT,
  nome_condominio_edificio    TEXT,
  andar                       INT,
  numero_apartamento          TEXT,
  ponto_referencia            TEXT,
  latitude                    DECIMAL(10,8),
  longitude                   DECIMAL(11,8),

  -- Financeiro
  valor                       DECIMAL(15,2),
  valor_aluguel               DECIMAL(15,2),
  iptu                        DECIMAL(15,2),
  condominio                  BOOLEAN DEFAULT false,
  valor_condominio            DECIMAL(15,2),
  aceita_financiamento        BOOLEAN DEFAULT false,
  aceita_fgts                 BOOLEAN DEFAULT false,
  aceita_consorcio            BOOLEAN DEFAULT false,
  aceita_proposta             BOOLEAN DEFAULT true,
  valor_minimo                DECIMAL(15,2),
  permuta                     BOOLEAN DEFAULT false,
  valor_estimado_mercado      DECIMAL(15,2),
  comissao_pct                DECIMAL(5,2) DEFAULT 6.0,
  data_ultima_atualizacao_preco DATE,

  -- Áreas (m²)
  metragem                    DECIMAL(10,2),
  area_total                  DECIMAL(10,2),
  area_construida             DECIMAL(10,2),
  area_util                   DECIMAL(10,2),
  area_terreno                DECIMAL(10,2),

  -- Cômodos
  quartos                     INT DEFAULT 0,
  suites                      INT DEFAULT 0,
  banheiros                   INT DEFAULT 1,
  vagas_garagem               INT DEFAULT 0,
  vagas_cobertas              INT DEFAULT 0,
  vagas_descobertas           INT DEFAULT 0,

  -- Dependências (boolean)
  lavabo                      BOOLEAN DEFAULT false,
  sacada                      BOOLEAN DEFAULT false,
  varanda                     BOOLEAN DEFAULT false,
  varanda_gourmet             BOOLEAN DEFAULT false,
  escritorio                  BOOLEAN DEFAULT false,
  closet                      BOOLEAN DEFAULT false,
  dependencia_empregada       BOOLEAN DEFAULT false,
  deposito                    BOOLEAN DEFAULT false,
  porao                       BOOLEAN DEFAULT false,
  sotao                       BOOLEAN DEFAULT false,
  area_servico                BOOLEAN DEFAULT false,

  -- Amenidades
  area_pet                    BOOLEAN DEFAULT false,
  mobiliado                   BOOLEAN DEFAULT false,
  semi_mobiliado              BOOLEAN DEFAULT false,
  planejados                  BOOLEAN DEFAULT false,
  ar_condicionado             BOOLEAN DEFAULT false,
  aquecimento_solar           BOOLEAN DEFAULT false,
  energia_solar               BOOLEAN DEFAULT false,
  piscina                     BOOLEAN DEFAULT false,
  churrasqueira               BOOLEAN DEFAULT false,
  area_gourmet                BOOLEAN DEFAULT false,
  jardim                      BOOLEAN DEFAULT false,
  quintal                     BOOLEAN DEFAULT false,
  vista_mar                   BOOLEAN DEFAULT false,
  vista_panoramica            BOOLEAN DEFAULT false,
  frente_rua                  BOOLEAN DEFAULT false,
  condominio_fechado          BOOLEAN DEFAULT false,
  portaria_24h                BOOLEAN DEFAULT false,
  elevador                    BOOLEAN DEFAULT false,
  academia                    BOOLEAN DEFAULT false,
  salao_festas                BOOLEAN DEFAULT false,
  playground                  BOOLEAN DEFAULT false,
  quadra                      BOOLEAN DEFAULT false,
  caracteristicas             TEXT,

  -- Condição do imóvel
  estado_imovel               TEXT DEFAULT 'pronto_morar',
  ano_construcao              INT,
  ultima_reforma              INT,

  -- Mídia
  video_url                   TEXT,
  tour_url                    TEXT,
  planta_baixa_url            TEXT,

  -- Situação legal
  matricula_registrada        BOOLEAN DEFAULT false,
  escritura_ok                BOOLEAN DEFAULT false,
  quitado                     BOOLEAN DEFAULT false,
  alienado                    BOOLEAN DEFAULT false,
  financiado_banco            BOOLEAN DEFAULT false,
  regularizado                BOOLEAN DEFAULT false,
  habite_se                   BOOLEAN DEFAULT false,
  documentacao_pendente       TEXT,
  observacoes_juridicas       TEXT,

  -- Marketing / Bot
  faixa_preco                 TEXT,
  perfil_comprador            TEXT,
  palavras_chave              TEXT,
  descricao_curta             TEXT,
  descricao_longa             TEXT,
  destaques                   TEXT,

  -- Estratégico
  nivel_urgencia              TEXT DEFAULT 'media',
  probabilidade_venda         INT,
  destaque                    BOOLEAN DEFAULT false,
  visualizacoes               INT DEFAULT 0,
  observacao                  TEXT,

  -- Venda
  data_cadastro               TIMESTAMPTZ DEFAULT now(),
  data_venda                  DATE,
  valor_venda                 DECIMAL(15,2),
  corretor_venda_id           UUID REFERENCES imob.corretores(id),
  observacao_venda            TEXT,

  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. FOTOS DOS IMÓVEIS
-- =====================================================
CREATE TABLE imob.imovel_fotos (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id  UUID NOT NULL REFERENCES imob.imoveis(id) ON DELETE CASCADE,
  url        TEXT NOT NULL,
  ordem      INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. HISTÓRICO DE PREÇO
-- =====================================================
CREATE TABLE imob.imovel_historico_preco (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  imovel_id      UUID NOT NULL REFERENCES imob.imoveis(id) ON DELETE CASCADE,
  valor_anterior DECIMAL(15,2),
  valor_novo     DECIMAL(15,2),
  alterado_em    TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. LEADS
-- =====================================================
CREATE TABLE imob.leads (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id            UUID NOT NULL REFERENCES imob.empresas(id) ON DELETE CASCADE,
  corretor_id           UUID REFERENCES imob.corretores(id) ON DELETE SET NULL,
  telefone              TEXT NOT NULL,
  nome                  TEXT,
  email                 TEXT,
  origem                TEXT DEFAULT 'whatsapp',
  orcamento_min         DECIMAL(15,2),
  orcamento_max         DECIMAL(15,2),
  preferencias          JSONB DEFAULT '{}',
  status_lead           TEXT DEFAULT 'novo'
                          CHECK (status_lead IN ('novo','em_atendimento','visita','proposta','fechado','perdido')),
  motivo_perda          TEXT,
  score                 INT DEFAULT 0,
  tentativas_contato    INT DEFAULT 0,
  bot_ativo             BOOLEAN DEFAULT true,
  bot_desativado_em     TIMESTAMPTZ,
  bot_desativado_por    TEXT,
  data_primeiro_contato TIMESTAMPTZ DEFAULT now(),
  ultima_interacao      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(empresa_id, telefone)
);

-- =====================================================
-- 9. INTERAÇÕES (histórico de mensagens)
-- =====================================================
CREATE TABLE imob.interacoes (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id            UUID NOT NULL REFERENCES imob.leads(id) ON DELETE CASCADE,
  mensagem           TEXT,
  tipo               TEXT DEFAULT 'cliente' CHECK (tipo IN ('cliente','bot','humano')),
  formato            TEXT DEFAULT 'texto' CHECK (formato IN ('texto','audio')),
  transcricao        TEXT,
  intencao_detectada TEXT,
  sentimento         TEXT,
  imoveis_sugeridos  JSONB DEFAULT '[]',
  lida               BOOLEAN DEFAULT false,
  duracao_audio      INT,
  data               TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. SESSÕES DO BOT
-- =====================================================
CREATE TABLE imob.sessoes_bot (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id          UUID NOT NULL REFERENCES imob.leads(id) ON DELETE CASCADE UNIQUE,
  historico        JSONB DEFAULT '[]',
  ultima_atualizacao TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. RLS — habilitar em todas as tabelas
-- =====================================================
ALTER TABLE imob.empresas               ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.corretores             ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.imoveis                ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.imovel_fotos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.imovel_historico_preco ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.leads                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.interacoes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.sessoes_bot            ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. RLS POLICIES — isolamento por empresa
-- =====================================================

-- Empresas: usuário vê apenas a própria empresa
CREATE POLICY "imob: user sees own empresa" ON imob.empresas
  FOR ALL USING (
    id IN (
      SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
    )
  );

-- Perfis: usuário vê apenas o próprio
CREATE POLICY "imob: user sees own profile" ON imob.profiles
  FOR ALL USING (user_id = auth.uid());

-- Corretores: scoped pela empresa do usuário
CREATE POLICY "imob: corretores scoped by empresa" ON imob.corretores
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
    )
  );

-- Imóveis: scoped pela empresa do usuário
CREATE POLICY "imob: imoveis scoped by empresa" ON imob.imoveis
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
    )
  );

-- Fotos: scoped pelos imóveis da empresa
CREATE POLICY "imob: fotos scoped by empresa" ON imob.imovel_fotos
  FOR ALL USING (
    imovel_id IN (
      SELECT i.id FROM imob.imoveis i
      WHERE i.empresa_id IN (
        SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Histórico de preço: scoped pelos imóveis da empresa
CREATE POLICY "imob: historico_preco scoped by empresa" ON imob.imovel_historico_preco
  FOR ALL USING (
    imovel_id IN (
      SELECT i.id FROM imob.imoveis i
      WHERE i.empresa_id IN (
        SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Leads: scoped pela empresa do usuário
CREATE POLICY "imob: leads scoped by empresa" ON imob.leads
  FOR ALL USING (
    empresa_id IN (
      SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
    )
  );

-- Interações: scoped pelos leads da empresa
CREATE POLICY "imob: interacoes scoped by empresa" ON imob.interacoes
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM imob.leads l
      WHERE l.empresa_id IN (
        SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Sessões bot: scoped pelos leads da empresa
CREATE POLICY "imob: sessoes_bot scoped by empresa" ON imob.sessoes_bot
  FOR ALL USING (
    lead_id IN (
      SELECT l.id FROM imob.leads l
      WHERE l.empresa_id IN (
        SELECT empresa_id FROM imob.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- =====================================================
-- 13. INDEXES
-- =====================================================
CREATE INDEX ON imob.imoveis (empresa_id);
CREATE INDEX ON imob.imoveis (status);
CREATE INDEX ON imob.imoveis (finalidade);
CREATE INDEX ON imob.imoveis (tipo);
CREATE INDEX ON imob.imoveis (cidade);
CREATE INDEX ON imob.leads (empresa_id);
CREATE INDEX ON imob.leads (status_lead);
CREATE INDEX ON imob.leads (telefone);
CREATE INDEX ON imob.interacoes (lead_id);
CREATE INDEX ON imob.imovel_fotos (imovel_id);
