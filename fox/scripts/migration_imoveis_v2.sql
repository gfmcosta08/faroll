-- Migration v2: campos extras de imóvel
ALTER TABLE imoveis
  ADD COLUMN IF NOT EXISTS suites         INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS banheiros      INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS vagas_garagem  INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS endereco       TEXT,
  ADD COLUMN IF NOT EXISTS numero        TEXT,
  ADD COLUMN IF NOT EXISTS complemento   TEXT,
  ADD COLUMN IF NOT EXISTS iptu          DECIMAL(15,2),
  ADD COLUMN IF NOT EXISTS varanda       BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS caracteristicas TEXT;

-- Novos tipos permitidos ficam no frontend (coluna tipo é TEXT livre)
-- Novos status: vendido_outro já era suportado
