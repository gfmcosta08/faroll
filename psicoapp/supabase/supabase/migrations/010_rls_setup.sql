-- Função: setup inicial da clínica (cria clínica + profissional + vincula usuário)
CREATE OR REPLACE FUNCTION public.setup_clinic(clinic_name TEXT, professional_name TEXT DEFAULT 'Profissional')
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id UUID;
  v_specialty_id UUID;
  v_professional_id UUID;
BEGIN
  IF clinic_name IS NULL OR trim(clinic_name) = '' THEN
    clinic_name := 'Minha Clínica';
  END IF;

  INSERT INTO public.clinics (name) VALUES (clinic_name) RETURNING id INTO v_clinic_id;

  SELECT id INTO v_specialty_id FROM public.specialties WHERE name = 'Psicologia' LIMIT 1;

  INSERT INTO public.professionals (clinic_id, specialty_id, name, default_consultation_duration_minutes)
  VALUES (v_clinic_id, v_specialty_id, professional_name, 50)
  RETURNING id INTO v_professional_id;

  UPDATE public.profiles
  SET clinic_id = v_clinic_id, role = 'dono_clinica'
  WHERE user_id = auth.uid();

  RETURN v_clinic_id;
END;
$$;
