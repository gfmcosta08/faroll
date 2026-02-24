const https = require('https');

const sql = `
-- Garantir que a tabela calendar_events tenha as colunas necessárias para sincronização
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS data_fim DATE;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS faixas_horario JSONB DEFAULT '[]';
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS external_id TEXT;
ALTER TABLE public.calendar_events ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Criar índice para busca rápida por external_id se não existir
CREATE INDEX IF NOT EXISTS idx_calendar_events_external_id ON public.calendar_events(external_id);

-- Recarregar o cache do PostgREST
NOTIFY pgrst, 'reload schema';
`;

const data = JSON.stringify({ query: sql });

// Usando as mesmas credenciais do arquivo run_sql_final.cjs
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8';
const options = {
    hostname: 'btndyypkyrlktkadymuv.supabase.co',
    path: '/rest/v1/rpc/exec_sql_antigravity',
    method: 'POST',
    headers: {
        'apikey': key,
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
    }
};

const req = https.request(options, (res) => {
    let body = '';
    res.on('data', (d) => body += d);
    res.on('end', () => {
        console.log('Status:', res.statusCode);
        console.log('Body:', body);
    });
});

req.on('error', (e) => {
    console.error(e);
});

req.write(data);
req.end();
