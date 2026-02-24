-- Função segura para promover usuário a admin
-- APENAS executável via service_role (backend/migration)
-- Bloqueia chamadas de usuários autenticados normais

CREATE OR REPLACE FUNCTION public.promote_user_to_admin(user_email TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  target_user_id uuid;
  target_profile_id uuid;
  result JSON;
BEGIN
  -- VERIFICAÇÃO DE SEGURANÇA: Apenas service_role pode executar
  -- auth.role() retorna 'service_role' quando chamado via service key
  -- Bloqueia 'anon' e 'authenticated'
  IF current_setting('request.jwt.claims', true)::json->>'role' NOT IN ('service_role') THEN
    RAISE EXCEPTION 'Acesso negado: apenas service_role pode promover admins';
  END IF;
  
  -- Busca o user_id pelo email no auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuário não encontrado com email: %', user_email;
  END IF;
  
  -- Busca o profile_id
  SELECT id INTO target_profile_id
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  -- Verifica se já é admin
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = target_user_id AND role = 'admin'
  ) THEN
    RETURN json_build_object(
      'success', false,
      'message', 'Usuário já possui role admin',
      'user_id', target_user_id
    );
  END IF;
  
  -- Insere o role admin
  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'admin');
  
  RETURN json_build_object(
    'success', true,
    'message', 'Usuário promovido a admin com sucesso',
    'user_id', target_user_id,
    'profile_id', target_profile_id,
    'email', user_email
  );
END;
$$;

-- Remove permissão de execução pública (segurança adicional)
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) FROM anon;
REVOKE EXECUTE ON FUNCTION public.promote_user_to_admin(TEXT) FROM authenticated;

-- Função auxiliar para verificar contagem de admins
CREATE OR REPLACE FUNCTION public.count_admins()
RETURNS INTEGER
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.user_roles WHERE role = 'admin'
$$;

-- Permite apenas leitura para admins
REVOKE EXECUTE ON FUNCTION public.count_admins() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.count_admins() FROM anon;

-- Comentário de documentação
COMMENT ON FUNCTION public.promote_user_to_admin(TEXT) IS 
'Promove um usuário a admin. APENAS executável via service_role key (backend/migration). 
Uso: SELECT promote_user_to_admin(''email@exemplo.com'');';