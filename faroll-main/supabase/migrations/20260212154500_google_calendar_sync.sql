-- =====================================================
-- MIGRATION: Google Calendar Synchronization Support
-- =====================================================

-- 1. Tabela para armazenar configurações e tokens de sincronização
CREATE TABLE IF NOT EXISTS public.google_sync_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    access_token TEXT,
    refresh_token TEXT,
    calendar_id TEXT DEFAULT 'primary',
    sync_enabled BOOLEAN DEFAULT true,
    last_sync TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(user_id)
);

-- Adicionar RLS para google_sync_settings
ALTER TABLE public.google_sync_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own sync settings" ON public.google_sync_settings
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id));

CREATE POLICY "Users can update their own sync settings" ON public.google_sync_settings
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id));

CREATE POLICY "Users can insert their own sync settings" ON public.google_sync_settings
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM public.profiles WHERE id = user_id));

-- 2. Adicionar campo external_id na tabela calendar_events
-- Isso serve para mapear o evento do Farollbr ao evento do Google (e vice-versa)
-- ajudando a evitar duplicidade em sincronizações repetidas.
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='calendar_events' AND column_name='external_id') THEN
        ALTER TABLE public.calendar_events ADD COLUMN external_id TEXT;
        CREATE INDEX idx_calendar_events_external_id ON public.calendar_events(external_id);
    END IF;
END $$;

-- 3. Trigger para updated_at na google_sync_settings
CREATE TRIGGER handle_updated_at_google_sync BEFORE UPDATE ON public.google_sync_settings
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 4. Comentários para documentação
COMMENT ON TABLE public.google_sync_settings IS 'Armazena tokens OAuth e configurações de sincronização com Google Calendar.';
COMMENT ON COLUMN public.calendar_events.external_id IS 'ID do evento no Google Calendar para sincronização bidirecional.';
