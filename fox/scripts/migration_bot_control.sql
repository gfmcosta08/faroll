-- =============================================================
-- APP FOX — Migration: Controle do Bot por Lead
-- =============================================================

ALTER TABLE leads
  -- Liga/desliga bot para este lead específico
  ADD COLUMN IF NOT EXISTS bot_ativo          BOOLEAN DEFAULT true,
  -- Quando o bot foi desativado (para calcular os 10 min)
  ADD COLUMN IF NOT EXISTS bot_desativado_em  TIMESTAMPTZ,
  -- Quem desativou (nome da secretária / corretor)
  ADD COLUMN IF NOT EXISTS bot_desativado_por TEXT;
