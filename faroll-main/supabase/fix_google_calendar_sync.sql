-- =====================================================================
-- FIX: google_sync_settings — corrigir FK para auth.users(id)
-- Problema: user_id referenciava profiles(id) mas o código usa o auth UID
-- Execute no SQL Editor: https://supabase.com/dashboard/project/btndyypkyrlktkadymuv/sql/new
-- =====================================================================

-- 1. Remover FK antiga (profiles.id) e adicionar para auth.users(id)
ALTER TABLE public.google_sync_settings
  DROP CONSTRAINT IF EXISTS google_sync_settings_user_id_fkey;

ALTER TABLE public.google_sync_settings
  ADD CONSTRAINT google_sync_settings_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Corrigir RLS policies (eram complexas/com bug, agora simplificadas)
DROP POLICY IF EXISTS "Users can view their own sync settings" ON public.google_sync_settings;
DROP POLICY IF EXISTS "Users can update their own sync settings" ON public.google_sync_settings;
DROP POLICY IF EXISTS "Users can insert their own sync settings" ON public.google_sync_settings;
DROP POLICY IF EXISTS "Users can delete their own sync settings" ON public.google_sync_settings;

CREATE POLICY "Users can view their own sync settings"
  ON public.google_sync_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync settings"
  ON public.google_sync_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sync settings"
  ON public.google_sync_settings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own sync settings"
  ON public.google_sync_settings FOR DELETE
  USING (auth.uid() = user_id);
