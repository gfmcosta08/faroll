-- =====================================================
-- PSICOAPP - WhatsApp / Conversas / Leads
-- Métricas: quem entrou em contato e NÃO agendou
-- =====================================================

-- Status da conversa
CREATE TYPE public.conversation_status AS ENUM (
  'em_conversa',
  'agendou',
  'nao_agendou',
  'abandonou',
  'aguardando_humano'
);

-- Motivo provável da desistência
CREATE TYPE public.drop_reason AS ENUM (
  'valor',
  'horario_indisponivel',
  'convenio_nao_aceito',
  'parou_responder',
  'pediu_info_sumiu',
  'outro',
  'nao_informado'
);

-- =====================================================
-- CONVERSAS (cada contato = 1 conversa)
-- =====================================================
CREATE TABLE public.conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL REFERENCES public.clinics(id) ON DELETE CASCADE,
  phone TEXT NOT NULL,
  patient_id UUID REFERENCES public.patients(id) ON DELETE SET NULL,
  specialty_id UUID REFERENCES public.specialties(id),
  status conversation_status DEFAULT 'em_conversa',
  drop_reason drop_reason DEFAULT 'nao_informado',
  started_at TIMESTAMPTZ DEFAULT now(),
  last_message_at TIMESTAMPTZ DEFAULT now(),
  first_contact_outside_business BOOLEAN DEFAULT false,
  auto_scheduled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversations_clinic ON public.conversations(clinic_id);
CREATE INDEX idx_conversations_phone ON public.conversations(phone);
CREATE INDEX idx_conversations_status ON public.conversations(status);
CREATE INDEX idx_conversations_started ON public.conversations(started_at);

-- =====================================================
-- MENSAGENS DA CONVERSA
-- =====================================================
CREATE TABLE public.conversation_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  direction TEXT NOT NULL CHECK (direction IN ('in', 'out')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_conversation_messages_conversation ON public.conversation_messages(conversation_id);
