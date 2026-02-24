-- RLS para professional_schedules e consultation_prices
CREATE POLICY "Professional schedules: por clinic via professional"
  ON public.professional_schedules FOR ALL
  USING (
    professional_id IN (SELECT id FROM public.professionals WHERE clinic_id = public.get_user_clinic_id())
  )
  WITH CHECK (
    professional_id IN (SELECT id FROM public.professionals WHERE clinic_id = public.get_user_clinic_id())
  );

CREATE POLICY "Consultation prices: por clinic"
  ON public.consultation_prices FOR ALL
  USING (clinic_id = public.get_user_clinic_id())
  WITH CHECK (clinic_id = public.get_user_clinic_id());
