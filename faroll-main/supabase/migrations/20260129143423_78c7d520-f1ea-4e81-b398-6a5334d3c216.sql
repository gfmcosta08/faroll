-- Criar função SECURITY DEFINER para verificar se um profile pertence a um profissional
CREATE OR REPLACE FUNCTION public.is_professional_profile(profile_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = profile_user_id
      AND role = 'profissional'
  )
$$;

-- Remover política antiga problemática
DROP POLICY IF EXISTS "Usuarios podem ver perfis com relacionamento" ON public.profiles;

-- Nova política: permite ver perfis de profissionais ativos
CREATE POLICY "Usuarios podem ver perfis de profissionais ativos"
ON public.profiles
FOR SELECT
USING (
  -- Sempre pode ver próprio perfil
  (auth.uid() = user_id)
  OR
  -- Pode ver profissionais com perfil ativo (galeria pública)
  (perfil_ativo = true AND public.is_professional_profile(user_id))
);