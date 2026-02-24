-- Dados iniciais para teste
INSERT INTO public.clinics (id, name)
SELECT '11111111-1111-1111-1111-111111111111', 'Minha Clínica'
WHERE NOT EXISTS (SELECT 1 FROM public.clinics LIMIT 1);

INSERT INTO public.professionals (clinic_id, specialty_id, name, default_consultation_duration_minutes)
SELECT 
  '11111111-1111-1111-1111-111111111111',
  (SELECT id FROM public.specialties WHERE name = 'Psicologia' LIMIT 1),
  'Profissional Exemplo',
  50
WHERE EXISTS (SELECT 1 FROM public.clinics WHERE id = '11111111-1111-1111-1111-111111111111')
  AND NOT EXISTS (SELECT 1 FROM public.professionals WHERE clinic_id = '11111111-1111-1111-1111-111111111111');
