-- =====================================================
-- PSICOAPP - Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_prices ENABLE ROW LEVEL SECURITY;

-- Função helper: clinic_id do usuário logado
CREATE OR REPLACE FUNCTION public.get_user_clinic_id()
RETURNS UUID AS $$
  SELECT clinic_id FROM public.profiles WHERE user_id = auth.uid()
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Função helper: é dono da clínica?
CREATE OR REPLACE FUNCTION public.is_clinic_owner()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid() AND role = 'dono_clinica'
  )
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- CLINICS: dono pode tudo na sua clínica
CREATE POLICY "Clinics: usuários da clínica podem ver"
  ON public.clinics FOR SELECT
  USING (id = public.get_user_clinic_id() OR public.is_clinic_owner());

CREATE POLICY "Clinics: dono pode inserir/atualizar"
  ON public.clinics FOR ALL
  USING (public.is_clinic_owner());

-- SPECIALTIES: leitura para todos autenticados
CREATE POLICY "Specialties: leitura para autenticados"
  ON public.specialties FOR SELECT
  TO authenticated
  USING (true);

-- PROFILES: usuário vê seu próprio perfil
CREATE POLICY "Profiles: ver próprio"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Profiles: atualizar próprio"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

-- PROFESSIONALS: usuários da clínica
CREATE POLICY "Professionals: ver por clinic"
  ON public.professionals FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Professionals: dono/secretaria inserem"
  ON public.professionals FOR INSERT
  WITH CHECK (
    clinic_id = public.get_user_clinic_id() AND
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('dono_clinica', 'secretaria'))
  );

-- PATIENTS: usuários da clínica
CREATE POLICY "Patients: ver por clinic"
  ON public.patients FOR SELECT
  USING (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Patients: inserir/atualizar por clinic"
  ON public.patients FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- APPOINTMENTS: usuários da clínica
CREATE POLICY "Appointments: por clinic"
  ON public.appointments FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- CONVERSATIONS: usuários da clínica
CREATE POLICY "Conversations: por clinic"
  ON public.conversations FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- PAYMENTS: usuários da clínica
CREATE POLICY "Payments: por clinic"
  ON public.payments FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

-- Demais tabelas: política similar por clinic_id
CREATE POLICY "Blocked slots: por clinic via professional"
  ON public.blocked_slots FOR ALL
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE clinic_id = public.get_user_clinic_id())
  );

CREATE POLICY "Waitlist: por clinic"
  ON public.waitlist FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());

CREATE POLICY "Conversation messages: por conversation"
  ON public.conversation_messages FOR ALL
  USING (
    conversation_id IN (SELECT id FROM public.conversations WHERE clinic_id = public.get_user_clinic_id())
  );

-- Service role (backend/API) bypassa RLS - Supabase já faz isso
-- Para webhooks e scripts, usar service_role key
