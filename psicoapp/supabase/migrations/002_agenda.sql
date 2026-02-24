-- =====================================================
-- PSICOAPP - Agenda Inteligente
-- =====================================================

-- Status de agendamento
CREATE TYPE public.appointment_status AS ENUM (
  'agendado',
  'confirmado',
  'realizado',
  'cancelado',
  'falta',      -- no-show
  'reagendado'
);

-- =====================================================
-- BLOQUEIO DE HORÁRIOS
-- =====================================================
CREATE TABLE public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_blocked_slots_professional ON public.blocked_slots(professional_id);
CREATE INDEX idx_blocked_slots_dates ON public.blocked_slots(start_at, end_at);

-- =====================================================
-- CONSULTAS / AGENDAMENTOS
-- =====================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 50,
  status appointment_status DEFAULT 'agendado',
  confirmed_at TIMESTAMPTZ,
  reminder_sent_at TIMESTAMPTZ,
  source TEXT, -- 'manual', 'online', 'whatsapp'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_appointments_clinic ON public.appointments(clinic_id);
CREATE INDEX idx_appointments_professional ON public.appointments(professional_id);
CREATE INDEX idx_appointments_patient ON public.appointments(patient_id);
CREATE INDEX idx_appointments_scheduled ON public.appointments(scheduled_at);
CREATE INDEX idx_appointments_status ON public.appointments(status);

-- =====================================================
-- LISTA DE ESPERA
-- =====================================================
CREATE TABLE public.waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  specialty_id UUID NOT NULL REFERENCES public.specialties(id),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_phone TEXT,
  preferred_date_start DATE,
  preferred_date_end DATE,
  status TEXT DEFAULT 'aguardando' CHECK (status IN ('aguardando', 'notificado', 'agendou', 'desistiu')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
