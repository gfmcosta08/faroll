-- Acesso aos painéis contratados (Health-App e Fox Imobiliário).
-- Apenas admin altera; usuário vê no perfil e usa o botão "Acessar painel".
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS acesso_health_app boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acesso_fox_imobiliario boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.acesso_health_app IS 'Liberado pelo admin após contratação do Health-App';
COMMENT ON COLUMN public.profiles.acesso_fox_imobiliario IS 'Liberado pelo admin após contratação do Fox Imobiliário';
