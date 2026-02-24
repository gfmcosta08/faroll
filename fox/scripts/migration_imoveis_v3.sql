-- =============================================================
-- APP FOX — Migration v3: Expansão completa da tabela imoveis
--                         + perfil secretaria
-- =============================================================

ALTER TABLE imoveis

  -- ── 1. Identificação ──────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS titulo                       TEXT,
  ADD COLUMN IF NOT EXISTS proprietario_nome            TEXT,
  ADD COLUMN IF NOT EXISTS proprietario_telefone        TEXT,
  ADD COLUMN IF NOT EXISTS exclusividade                BOOLEAN DEFAULT false,

  -- ── 2. Localização completa ───────────────────────────────────
  ADD COLUMN IF NOT EXISTS estado                       TEXT,
  ADD COLUMN IF NOT EXISTS ponto_referencia             TEXT,
  ADD COLUMN IF NOT EXISTS nome_condominio_edificio     TEXT,
  ADD COLUMN IF NOT EXISTS andar                        INT,
  ADD COLUMN IF NOT EXISTS numero_apartamento           TEXT,
  ADD COLUMN IF NOT EXISTS latitude                     DECIMAL(10,8),
  ADD COLUMN IF NOT EXISTS longitude                    DECIMAL(11,8),

  -- ── 3. Financeiro completo ────────────────────────────────────
  ADD COLUMN IF NOT EXISTS valor_aluguel                DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS aceita_proposta              BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS valor_minimo                 DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS permuta                      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_fgts                  BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aceita_consorcio             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS valor_estimado_mercado       DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS comissao_pct                 DECIMAL(5,2) DEFAULT 6.0,
  ADD COLUMN IF NOT EXISTS data_ultima_atualizacao_preco TIMESTAMPTZ,

  -- ── 4. Áreas (m²) ─────────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS area_total                   DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS area_construida              DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS area_util                    DECIMAL(10,2),
  ADD COLUMN IF NOT EXISTS area_terreno                 DECIMAL(10,2),

  -- ── 5. Vagas detalhadas ───────────────────────────────────────
  ADD COLUMN IF NOT EXISTS vagas_cobertas               INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS vagas_descobertas            INT DEFAULT 0,

  -- ── 6. Cômodos booleanos ──────────────────────────────────────
  ADD COLUMN IF NOT EXISTS lavabo                       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sacada                       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS varanda_gourmet              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escritorio                   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS closet                       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS dependencia_empregada        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS deposito                     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS porao                        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS sotao                        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS area_servico                 BOOLEAN DEFAULT false,

  -- ── 7. Diferenciais extras ────────────────────────────────────
  ADD COLUMN IF NOT EXISTS semi_mobiliado               BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS planejados                   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ar_condicionado              BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS aquecimento_solar            BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS energia_solar                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS piscina                      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS churrasqueira                BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS area_gourmet                 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS jardim                       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quintal                      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vista_mar                    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS vista_panoramica             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS frente_rua                   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS condominio_fechado           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portaria_24h                 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS elevador                     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS academia                     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS salao_festas                 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS playground                   BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quadra                       BOOLEAN DEFAULT false,

  -- ── 8. Estado do imóvel ───────────────────────────────────────
  ADD COLUMN IF NOT EXISTS estado_imovel                TEXT DEFAULT 'pronto_morar',
  ADD COLUMN IF NOT EXISTS ano_construcao               INT,
  ADD COLUMN IF NOT EXISTS ultima_reforma               INT,

  -- ── 9. Mídia (URLs) ───────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS video_url                    TEXT,
  ADD COLUMN IF NOT EXISTS tour_url                     TEXT,
  ADD COLUMN IF NOT EXISTS planta_baixa_url             TEXT,

  -- ── 10. Situação legal ────────────────────────────────────────
  ADD COLUMN IF NOT EXISTS matricula_registrada         BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS escritura_ok                 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS quitado                      BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS alienado                     BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS financiado_banco             BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS regularizado                 BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS habite_se                    BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS documentacao_pendente        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS observacoes_juridicas        TEXT,

  -- ── 11. Bot Intelligence / Marketing ─────────────────────────
  ADD COLUMN IF NOT EXISTS faixa_preco                  TEXT,
  ADD COLUMN IF NOT EXISTS perfil_comprador             TEXT,
  ADD COLUMN IF NOT EXISTS palavras_chave               TEXT,
  ADD COLUMN IF NOT EXISTS descricao_curta              TEXT,
  ADD COLUMN IF NOT EXISTS descricao_longa              TEXT,
  ADD COLUMN IF NOT EXISTS destaques                    TEXT,

  -- ── 12. Dados estratégicos internos ──────────────────────────
  ADD COLUMN IF NOT EXISTS nivel_urgencia               TEXT DEFAULT 'media',
  ADD COLUMN IF NOT EXISTS probabilidade_venda          INT;


-- ── Perfil secretária ──────────────────────────────────────────
-- Remove a constraint antiga e recria com secretaria incluída
ALTER TABLE corretores DROP CONSTRAINT IF EXISTS corretores_perfil_check;
ALTER TABLE corretores
  ADD CONSTRAINT corretores_perfil_check
  CHECK (perfil IN ('gerente', 'corretor', 'secretaria', 'admin'));
