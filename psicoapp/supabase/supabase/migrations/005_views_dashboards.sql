-- =====================================================
-- PSICOAPP - Views para Dashboards e Métricas
-- =====================================================

-- View: Leads que NÃO agendaram (métrica estratégica)
CREATE OR REPLACE VIEW public.v_leads_nao_agendaram AS
SELECT
  c.id,
  c.clinic_id,
  c.phone,
  c.patient_id,
  p.name AS patient_name,
  s.name AS specialty_name,
  c.status,
  c.drop_reason,
  c.started_at,
  c.first_contact_outside_business,
  c.auto_scheduled
FROM public.conversations c
LEFT JOIN public.patients p ON p.id = c.patient_id
LEFT JOIN public.specialties s ON s.id = c.specialty_id
WHERE c.status IN ('nao_agendou', 'abandonou');

-- View: Resumo de conversão (conversa → agendamento)
CREATE OR REPLACE VIEW public.v_conversation_conversion AS
SELECT
  clinic_id,
  COUNT(*) AS total_conversas,
  COUNT(*) FILTER (WHERE status = 'agendou') AS total_agendaram,
  COUNT(*) FILTER (WHERE status IN ('nao_agendou', 'abandonou')) AS total_nao_agendaram,
  COUNT(*) FILTER (WHERE first_contact_outside_business) AS fora_horario_comercial,
  COUNT(*) FILTER (WHERE auto_scheduled) AS agendaram_automatico,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE status = 'agendou') / NULLIF(COUNT(*), 0),
    2
  ) AS taxa_conversao_pct
FROM public.conversations
GROUP BY clinic_id;

-- View: Especialidade mais procurada (por conversas)
CREATE OR REPLACE VIEW public.v_especialidade_mais_procurada AS
SELECT
  c.clinic_id,
  s.name AS specialty_name,
  s.id AS specialty_id,
  COUNT(*) AS total_conversas,
  COUNT(*) FILTER (WHERE c.status = 'agendou') AS agendaram
FROM public.conversations c
JOIN public.specialties s ON s.id = c.specialty_id
GROUP BY c.clinic_id, s.id, s.name
ORDER BY total_conversas DESC;

-- View: Receita mensal por clínica
CREATE OR REPLACE VIEW public.v_receita_mensal AS
SELECT
  clinic_id,
  DATE_TRUNC('month', paid_at)::DATE AS mes,
  SUM(amount) AS receita,
  COUNT(*) AS total_pagamentos
FROM public.payments
WHERE paid = true AND paid_at IS NOT NULL
GROUP BY clinic_id, DATE_TRUNC('month', paid_at);

-- View: Taxa de ocupação e no-show
CREATE OR REPLACE VIEW public.v_agenda_metrics AS
SELECT
  a.clinic_id,
  a.professional_id,
  DATE(a.scheduled_at) AS data,
  COUNT(*) AS total_agendados,
  COUNT(*) FILTER (WHERE a.status = 'realizado') AS realizados,
  COUNT(*) FILTER (WHERE a.status = 'falta') AS faltas,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE a.status = 'falta') / NULLIF(COUNT(*), 0),
    2
  ) AS taxa_falta_pct
FROM public.appointments a
GROUP BY a.clinic_id, a.professional_id, DATE(a.scheduled_at);
