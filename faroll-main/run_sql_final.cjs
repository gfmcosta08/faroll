const https = require('https');

const sql = `
-- Adicionar colunas de arrays se não existirem
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profession_ids UUID[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS specialization_ids UUID[] DEFAULT '{}';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_audience_ids UUID[] DEFAULT '{}';

-- Garantir que as tabelas base estão prontas
CREATE TABLE IF NOT EXISTS public.professions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    registro_tipo TEXT,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.specializations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profession_id UUID REFERENCES public.professions(id) ON DELETE CASCADE,
    nome TEXT NOT NULL,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(profession_id, nome)
);

CREATE TABLE IF NOT EXISTS public.target_audiences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL UNIQUE,
    ordem INTEGER DEFAULT 0,
    ativa BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Inserir 30 Profissões (apenas se não houver)
INSERT INTO public.professions (nome, registro_tipo, ativa)
SELECT nome, registro_tipo, ativa FROM (VALUES 
('Psicologia', 'CRP', true), ('Psiquiatria', 'CRM', true), ('Nutrição', 'CRN', true), 
('Fisioterapia', 'CREFITO', true), ('Fonoaudiologia', 'CRFA', true), ('Terapia Ocupacional', 'CREFITO', true),
('Psicopedagogia', 'Registro', true), ('Neuropsicologia', 'CRP', true), ('Medicina da Família', 'CRM', true),
('Pediatria', 'CRM', true), ('Geriatria', 'CRM', true), ('Ginecologia', 'CRM', true),
('Dermatologia', 'CRM', true), ('Endocrinologia', 'CRM', true), ('Cardiologia', 'CRM', true),
('Neurologia', 'CRM', true), ('Ortopedia', 'CRM', true), ('Oftalmologia', 'CRM', true),
('Odontologia', 'CRO', true), ('Enfermagem', 'COREN', true), ('Farmácia', 'CRF', true),
('Educação Física', 'CREF', true), ('Assistência Social', 'CRESS', true), ('Musicoterapia', 'Registro', true),
('Arteterapia', 'Registro', true), ('Equoterapia', 'Registro', true), ('Doula', 'Registro', true),
('Consultoria de Amamentação', 'Registro', true), ('Acompanhamento Terapêutico', 'Registro', true), ('Terapias Holísticas', 'Registro', true)
) AS v(nome, registro_tipo, ativa)
ON CONFLICT (nome) DO NOTHING;

-- Inserir especialidades para Psicologia
INSERT INTO public.specializations (profession_id, nome) 
SELECT id, unnest(ARRAY['TCC', 'Psicanálise', 'Gestalt', 'ABA', 'EMDR', 'Fenomenologia', 'Sistêmica', 'Humanista', 'Hospitalar', 'Esportiva', 'Infantil', 'Casal e Família']) 
FROM public.professions WHERE nome = 'Psicologia'
ON CONFLICT DO NOTHING;

-- RLS
ALTER TABLE public.professions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specializations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.target_audiences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public view professions" ON public.professions;
CREATE POLICY "Public view professions" ON public.professions FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert professions" ON public.professions;
CREATE POLICY "Users can insert professions" ON public.professions FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public view specializations" ON public.specializations;
CREATE POLICY "Public view specializations" ON public.specializations FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert specializations" ON public.specializations;
CREATE POLICY "Users can insert specializations" ON public.specializations FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Public view target_audiences" ON public.target_audiences;
CREATE POLICY "Public view target_audiences" ON public.target_audiences FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can insert target_audiences" ON public.target_audiences;
CREATE POLICY "Users can insert target_audiences" ON public.target_audiences FOR INSERT WITH CHECK (true);
`;

const data = JSON.stringify({ query: sql });

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
