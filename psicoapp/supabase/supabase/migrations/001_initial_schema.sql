-- =====================================================
-- PSICOAPP - Schema Inicial (Multiespecialidade)
-- Projeto: kdgoikloqfczlyiuqhiy
-- Execute no SQL Editor do Supabase
-- =====================================================

-- Extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 1. CLÍNICAS
-- =====================================================
CREATE TABLE public.clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  document TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  business_hours_start TIME DEFAULT '08:00',
  business_hours_end TIME DEFAULT '18:00',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- =====================================================
-- 2. ESPECIALIDADES
-- =====================================================
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO public.specialties (name) VALUES
  ('Psicologia'),
  ('Odontologia'),
  ('Nutrição'),
  ('Fisioterapia'),
  ('Fonoaudiologia'),
  ('Medicina'),
  ('Outros');

-- =====================================================
-- 3. PERFIS DE USUÁRIO (extende auth.users)
-- =====================================================
CREATE TYPE public.user_role AS ENUM (
  'dono_clinica',
  'profissional',
  'secretaria',
  'paciente'
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role user_role NOT NULL,
  clinic_id UUID REFERENCES public.clinics(id) ON DELETE SET NULL,
  professional_id UUID, -- FK depois de criar professionals
  full_name TEXT,
  email TEXT,
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- =====================================================
-- 4. PROFISSIONAIS
-- =====================================================
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  default_consultation_duration_minutes INT DEFAULT 50,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- FK de profiles para professionals
ALTER TABLE public.profiles
  ADD CONSTRAINT fk_profiles_professional
  FOREIGN KEY (professional_id) REFERENCES public.professionals(id) ON DELETE SET NULL;

-- =====================================================
-- 5. HORÁRIOS DOS PROFISSIONAIS
-- =====================================================
CREATE TABLE public.professional_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week INT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=domingo
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(professional_id, day_of_week)
);

-- =====================================================
-- 6. PACIENTES
-- =====================================================
CREATE TABLE public.patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  birth_date DATE,
  cpf TEXT,
  address TEXT,
  health_insurance TEXT,
  insurance_number TEXT,
  responsible_name TEXT,
  notes TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_patients_clinic ON public.patients(clinic_id);
CREATE INDEX idx_patients_phone ON public.patients(phone);
CREATE INDEX idx_patients_status ON public.patients(status);
