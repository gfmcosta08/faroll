-- =====================================================
-- PSICOAPP - Módulo Financeiro
-- =====================================================

CREATE TYPE public.payment_method AS ENUM (
  'dinheiro',
  'pix',
  'cartao_credito',
  'cartao_debito',
  'convenio',
  'transferencia',
  'outro'
);

-- =====================================================
-- PAGAMENTOS / RECEITA
-- =====================================================
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  paid BOOLEAN DEFAULT false,
  payment_method payment_method,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_payments_clinic ON public.payments(clinic_id);
CREATE INDEX idx_payments_professional ON public.payments(professional_id);
CREATE INDEX idx_payments_paid_at ON public.payments(paid_at);

-- =====================================================
-- VALOR POR CONSULTA (por profissional/especialidade)
-- =====================================================
CREATE TABLE public.consultation_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_to DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(clinic_id, professional_id, specialty_id, effective_from)
);
