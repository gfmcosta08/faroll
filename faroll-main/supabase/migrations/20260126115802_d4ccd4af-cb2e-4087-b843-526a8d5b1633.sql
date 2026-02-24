-- Corrigir políticas RLS muito permissivas
-- Remover políticas existentes e criar novas mais restritivas

-- NOTIFICATIONS: Restringir criação apenas para usuários autenticados
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;
CREATE POLICY "Authenticated users can create notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- AUDIT_LOGS: Restringir criação apenas para usuários autenticados
DROP POLICY IF EXISTS "System can create audit logs" ON public.audit_logs;
CREATE POLICY "Authenticated users can create audit logs" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Corrigir função handle_updated_at para ter search_path definido
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;