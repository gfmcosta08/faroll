-- =====================================================
-- FAROLL SAÚDE — Schema health
-- Projeto: btndyypkyrlktkadymuv
-- Execute no SQL Editor do Supabase
-- =====================================================

CREATE SCHEMA IF NOT EXISTS health;

-- Permissões
GRANT USAGE ON SCHEMA health TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA health GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Extensões (se ainda não existem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. TIPO: roles do health
-- =====================================================
CREATE TYPE health.user_role AS ENUM (
  'dono_clinica',
  'profissional',
  'secretaria',
  'paciente'
);

-- =====================================================
-- 2. ESPECIALIDADES
-- =====================================================
CREATE TABLE health.specialties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO health.specialties (name) VALUES
  ('Psicologia'),
  ('Odontologia'),
  ('Nutrição'),
  ('Fisioterapia'),
  ('Fonoaudiologia'),
  ('Medicina'),
  ('Outros');

-- =====================================================
-- 3. CLÍNICAS (tenant raiz — multi-tenant isolado por clinic_id)
-- =====================================================
CREATE TABLE health.clinics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  document              TEXT,
  address               TEXT,
  phone                 TEXT,
  email                 TEXT,
  business_hours_start  TIME DEFAULT '08:00',
  business_hours_end    TIME DEFAULT '18:00',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 4. PERFIS (extende auth.users — login único com faroll-main)
-- =====================================================
CREATE TABLE health.profiles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role        health.user_role NOT NULL DEFAULT 'dono_clinica',
  clinic_id   UUID REFERENCES health.clinics(id) ON DELETE SET NULL,
  nome        TEXT,
  email       TEXT,
  telefone    TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now(),
  updated_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- 5. PROFISSIONAIS
-- =====================================================
CREATE TABLE health.professionals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id     UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  specialty_id  UUID REFERENCES health.specialties(id),
  nome          TEXT NOT NULL,
  email         TEXT,
  telefone      TEXT,
  registro      TEXT,
  bio           TEXT,
  ativo         BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 6. PACIENTES
-- =====================================================
CREATE TABLE health.patients (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  nome             TEXT NOT NULL,
  email            TEXT,
  telefone         TEXT,
  data_nascimento  DATE,
  observacoes      TEXT,
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 7. AGENDAMENTOS
-- =====================================================
CREATE TABLE health.appointments (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id        UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  professional_id  UUID NOT NULL REFERENCES health.professionals(id) ON DELETE CASCADE,
  patient_id       UUID NOT NULL REFERENCES health.patients(id) ON DELETE CASCADE,
  inicio           TIMESTAMPTZ NOT NULL,
  fim              TIMESTAMPTZ NOT NULL,
  status           TEXT DEFAULT 'agendado'
                     CHECK (status IN ('agendado','confirmado','cancelado','realizado')),
  observacoes      TEXT,
  valor            DECIMAL(10,2),
  created_at       TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 8. HORÁRIOS DISPONÍVEIS
-- =====================================================
CREATE TABLE health.schedules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id  UUID NOT NULL REFERENCES health.professionals(id) ON DELETE CASCADE,
  dia_semana       INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio      TIME NOT NULL,
  hora_fim         TIME NOT NULL,
  duracao_minutos  INT DEFAULT 50,
  ativo            BOOLEAN DEFAULT true
);

-- =====================================================
-- 9. LEADS WHATSAPP
-- =====================================================
CREATE TABLE health.whatsapp_leads (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id   UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  phone       TEXT NOT NULL,
  nome        TEXT,
  status      TEXT DEFAULT 'novo',
  mensagem    TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 10. FINANCEIRO
-- =====================================================
CREATE TABLE health.financeiro (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES health.appointments(id),
  patient_id        UUID REFERENCES health.patients(id),
  descricao         TEXT,
  valor             DECIMAL(10,2) NOT NULL,
  tipo              TEXT DEFAULT 'receita'
                      CHECK (tipo IN ('receita','despesa')),
  status_pagamento  TEXT DEFAULT 'pendente'
                      CHECK (status_pagamento IN ('pendente','pago','cancelado')),
  data_vencimento   DATE,
  data_pagamento    DATE,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 11. RLS — habilitar em todas as tabelas
-- =====================================================
ALTER TABLE health.clinics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.professionals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.whatsapp_leads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.financeiro       ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.specialties      ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 12. RLS POLICIES — isolamento por clínica
-- =====================================================

-- Clínicas: usuário vê apenas a própria clínica
CREATE POLICY "health: user sees own clinic" ON health.clinics
  FOR ALL USING (
    id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

-- Perfis: usuário vê apenas o próprio
CREATE POLICY "health: user sees own profile" ON health.profiles
  FOR ALL USING (user_id = auth.uid());

-- Profissionais: scoped pela clínica do usuário
CREATE POLICY "health: professionals scoped by clinic" ON health.professionals
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

-- Pacientes: scoped pela clínica do usuário
CREATE POLICY "health: patients scoped by clinic" ON health.patients
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

-- Agendamentos: scoped pela clínica do usuário
CREATE POLICY "health: appointments scoped by clinic" ON health.appointments
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

-- Horários: scoped pelos profissionais da clínica
CREATE POLICY "health: schedules scoped by clinic" ON health.schedules
  FOR ALL USING (
    professional_id IN (
      SELECT p.id FROM health.professionals p
      WHERE p.clinic_id IN (
        SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- Leads WhatsApp: scoped pela clínica
CREATE POLICY "health: leads scoped by clinic" ON health.whatsapp_leads
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

-- Financeiro: scoped pela clínica
CREATE POLICY "health: financeiro scoped by clinic" ON health.financeiro
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

-- Especialidades: leitura pública
CREATE POLICY "health: specialties public read" ON health.specialties
  FOR SELECT USING (true);
