# Unificação Faroll Saúde + Faroll Imóveis — Plano de Implementação

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Unificar psicoapp e fox/dashboard no Supabase principal do faroll-main, com login único, schemas isolados e branding "Faroll Saúde" / "Faroll Imóveis".

**Architecture:** Supabase único (`btndyypkyrlktkadymuv`) com schemas `health` (psicoapp) e `imob` (fox). Login via `auth.users` compartilhado. Acesso controlado por flags `acesso_health_app` / `acesso_fox_imobiliario` em `public.profiles`. Fox dashboard substituirá seu próprio JWT pelo Supabase JWT do faroll.

**Tech Stack:** React+Vite (faroll-main, fox/dashboard), Next.js (psicoapp), Flask/Python (fox backend), Supabase (PostgreSQL + Auth), Vercel (deploy).

**Design doc:** `docs/plans/2026-03-04-unificacao-faroll-saude-imoveis-design.md`

---

## Fase 1 — SQL: Criar schemas `health` e `imob` no Supabase principal

> Execute no Supabase SQL Editor do projeto `btndyypkyrlktkadymuv`.
> Acesse: https://supabase.com/dashboard → projeto FarolBR → SQL Editor → New query.

---

### Task 1: Criar schema `health` e tabelas do Faroll Saúde

**Files:**
- Create: `faroll-main/supabase/migrations/20260304000001_health_schema.sql`

**Step 1: Criar o arquivo de migration**

```sql
-- =====================================================
-- FAROLL SAÚDE — Schema health
-- Executa no projeto btndyypkyrlktkadymuv
-- =====================================================

CREATE SCHEMA IF NOT EXISTS health;

-- Permissões
GRANT USAGE ON SCHEMA health TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA health GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- Extensões (se ainda não existem)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. TIPO: roles do health
CREATE TYPE health.user_role AS ENUM (
  'dono_clinica',
  'profissional',
  'secretaria',
  'paciente'
);

-- 2. CLÍNICAS (tenant raiz — multi-tenant isolado por clinic_id)
CREATE TABLE health.clinics (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL,
  document              TEXT,
  address               TEXT,
  phone                 TEXT,
  email                 TEXT,
  business_hours_start  TIME DEFAULT '08:00',
  business_hours_end    TIME DEFAULT '18:00',
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

-- 3. ESPECIALIDADES
CREATE TABLE health.specialties (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

INSERT INTO health.specialties (name) VALUES
  ('Psicologia'), ('Odontologia'), ('Nutrição'),
  ('Fisioterapia'), ('Fonoaudiologia'), ('Medicina'), ('Outros');

-- 4. PERFIS (extende auth.users — compartilhado com faroll-main via mesmo auth.users)
CREATE TABLE health.profiles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role            health.user_role NOT NULL,
  clinic_id       UUID REFERENCES health.clinics(id) ON DELETE SET NULL,
  nome            TEXT,
  email           TEXT,
  telefone        TEXT,
  avatar_url      TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- 5. PROFISSIONAIS
CREATE TABLE health.professionals (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  clinic_id       UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  specialty_id    UUID REFERENCES health.specialties(id),
  nome            TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  registro        TEXT,
  bio             TEXT,
  ativo           BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 6. PACIENTES
CREATE TABLE health.patients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  nome            TEXT NOT NULL,
  email           TEXT,
  telefone        TEXT,
  data_nascimento DATE,
  observacoes     TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 7. AGENDAMENTOS
CREATE TABLE health.appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  professional_id   UUID NOT NULL REFERENCES health.professionals(id) ON DELETE CASCADE,
  patient_id        UUID NOT NULL REFERENCES health.patients(id) ON DELETE CASCADE,
  inicio            TIMESTAMPTZ NOT NULL,
  fim               TIMESTAMPTZ NOT NULL,
  status            TEXT DEFAULT 'agendado' CHECK (status IN ('agendado','confirmado','cancelado','realizado')),
  observacoes       TEXT,
  valor             DECIMAL(10,2),
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- 8. HORÁRIOS DISPONÍVEIS
CREATE TABLE health.schedules (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id   UUID NOT NULL REFERENCES health.professionals(id) ON DELETE CASCADE,
  dia_semana        INT NOT NULL CHECK (dia_semana BETWEEN 0 AND 6),
  hora_inicio       TIME NOT NULL,
  hora_fim          TIME NOT NULL,
  duracao_minutos   INT DEFAULT 50,
  ativo             BOOLEAN DEFAULT true
);

-- 9. LEADS WHATSAPP
CREATE TABLE health.whatsapp_leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id       UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  phone           TEXT NOT NULL,
  nome            TEXT,
  status          TEXT DEFAULT 'novo',
  mensagem        TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

-- 10. FINANCEIRO
CREATE TABLE health.financeiro (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id         UUID NOT NULL REFERENCES health.clinics(id) ON DELETE CASCADE,
  appointment_id    UUID REFERENCES health.appointments(id),
  patient_id        UUID REFERENCES health.patients(id),
  descricao         TEXT,
  valor             DECIMAL(10,2) NOT NULL,
  tipo              TEXT DEFAULT 'receita' CHECK (tipo IN ('receita','despesa')),
  status_pagamento  TEXT DEFAULT 'pendente' CHECK (status_pagamento IN ('pendente','pago','cancelado')),
  data_vencimento   DATE,
  data_pagamento    DATE,
  created_at        TIMESTAMPTZ DEFAULT now()
);

-- RLS: habilitar em todas as tabelas health
ALTER TABLE health.clinics          ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.profiles         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.professionals    ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.patients         ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.appointments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.schedules        ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.whatsapp_leads   ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.financeiro       ENABLE ROW LEVEL SECURITY;
ALTER TABLE health.specialties      ENABLE ROW LEVEL SECURITY;

-- RLS policies: usuário vê apenas dados da própria clínica
CREATE POLICY "health: user sees own clinic data" ON health.clinics
  FOR ALL USING (
    id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "health: user sees own profile" ON health.profiles
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "health: scoped by clinic" ON health.professionals
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "health: scoped by clinic" ON health.patients
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "health: scoped by clinic" ON health.appointments
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "health: scoped by clinic" ON health.schedules
  FOR ALL USING (
    professional_id IN (
      SELECT id FROM health.professionals
      WHERE clinic_id IN (
        SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "health: scoped by clinic" ON health.whatsapp_leads
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "health: scoped by clinic" ON health.financeiro
  FOR ALL USING (
    clinic_id IN (
      SELECT clinic_id FROM health.profiles WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "health: specialties public read" ON health.specialties
  FOR SELECT USING (true);
```

**Step 2: Executar no Supabase SQL Editor**

Acesse: https://supabase.com/dashboard → projeto `btndyypkyrlktkadymuv` → SQL Editor → New query → cole o SQL → Run.

Resultado esperado: `Success. No rows returned.`

**Step 3: Verificar no Table Editor**

No Supabase → Table Editor → confirmar que aparecem tabelas com prefixo `health.`.

**Step 4: Commit**

```bash
git add faroll-main/supabase/migrations/20260304000001_health_schema.sql
git commit -m "feat(db): criar schema health para Faroll Saude"
```

---

### Task 2: Criar schema `imob` e tabelas do Faroll Imóveis

**Files:**
- Create: `faroll-main/supabase/migrations/20260304000002_imob_schema.sql`

**Step 1: Criar o arquivo de migration**

```sql
-- =====================================================
-- FAROLL IMÓVEIS — Schema imob
-- Executa no projeto btndyypkyrlktkadymuv
-- =====================================================

CREATE SCHEMA IF NOT EXISTS imob;

GRANT USAGE ON SCHEMA imob TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA imob GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- 1. IMÓVEIS
CREATE TABLE imob.imoveis (
  id                            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                       UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  -- Identificação
  titulo                        TEXT,
  tipo                          TEXT,
  finalidade                    TEXT CHECK (finalidade IN ('venda','aluguel','ambos')),
  status                        TEXT DEFAULT 'disponivel',
  -- Localização
  cep                           TEXT,
  cidade                        TEXT,
  bairro                        TEXT,
  rua                           TEXT,
  numero                        TEXT,
  estado                        TEXT,
  complemento                   TEXT,
  latitude                      DECIMAL(10,8),
  longitude                     DECIMAL(11,8),
  -- Proprietário
  proprietario_nome             TEXT,
  proprietario_telefone         TEXT,
  exclusividade                 BOOLEAN DEFAULT false,
  -- Financeiro
  valor_venda                   DECIMAL(15,2),
  valor_aluguel                 DECIMAL(15,2),
  aceita_proposta               BOOLEAN DEFAULT true,
  valor_minimo                  DECIMAL(15,2),
  permuta                       BOOLEAN DEFAULT false,
  aceita_fgts                   BOOLEAN DEFAULT false,
  aceita_consorcio              BOOLEAN DEFAULT false,
  comissao_pct                  DECIMAL(5,2) DEFAULT 6.0,
  -- Características
  area_total                    DECIMAL(10,2),
  area_construida               DECIMAL(10,2),
  quartos                       INT DEFAULT 0,
  banheiros                     INT DEFAULT 0,
  vagas                         INT DEFAULT 0,
  -- Extras
  fotos                         TEXT[] DEFAULT '{}',
  descricao                     TEXT,
  created_at                    TIMESTAMPTZ DEFAULT now(),
  updated_at                    TIMESTAMPTZ DEFAULT now()
);

-- 2. LEADS
CREATE TABLE imob.leads (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  phone           TEXT NOT NULL,
  nome            TEXT,
  demand          TEXT,
  status          TEXT DEFAULT 'novo',
  imovel_id       UUID REFERENCES imob.imoveis(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. BOT CONTROL
CREATE TABLE imob.bot_control (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ativo       BOOLEAN DEFAULT true,
  config      JSONB DEFAULT '{}',
  updated_at  TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE imob.imoveis      ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.leads        ENABLE ROW LEVEL SECURITY;
ALTER TABLE imob.bot_control  ENABLE ROW LEVEL SECURITY;

-- Corretor vê apenas seus próprios dados
CREATE POLICY "imob: user sees own imoveis" ON imob.imoveis
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "imob: user sees own leads" ON imob.leads
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "imob: user sees own bot" ON imob.bot_control
  FOR ALL USING (user_id = auth.uid());
```

**Step 2: Executar no Supabase SQL Editor**

Mesmos passos do Task 1.

**Step 3: Commit**

```bash
git add faroll-main/supabase/migrations/20260304000002_imob_schema.sql
git commit -m "feat(db): criar schema imob para Faroll Imoveis"
```

---

### Task 3: SQL — Dar acesso imediato a `farollapi@gmail.com`

**Step 1: Executar no Supabase SQL Editor**

```sql
UPDATE public.profiles
SET
  acesso_health_app     = true,
  acesso_fox_imobiliario = true
WHERE email = 'farollapi@gmail.com';
```

Resultado esperado: `1 row updated`.

**Step 2: Verificar**

```sql
SELECT email, acesso_health_app, acesso_fox_imobiliario
FROM public.profiles
WHERE email = 'farollapi@gmail.com';
```

---

## Fase 2 — faroll-main: AutomationOfferCard + ProfileScreen

---

### Task 4: Atualizar `AutomationOfferCard` com nomes e lógica de acesso

**Files:**
- Modify: `faroll-main/src/components/AutomationOfferCard.tsx`

**Context:** O componente atual não verifica se o usuário tem acesso contratado. Precisa de:
1. Nomes "Faroll Saúde" e "Faroll Imóveis" (substituindo "Health-App" e "Fox Imobiliário")
2. Prop `acesso: boolean`
3. `acesso = false` → botão "Conhecer" (mantém comportamento de marketing)
4. `acesso = true` → botão "Acessar" (navega direto para o app)

**Step 1: Substituir o arquivo**

```tsx
// faroll-main/src/components/AutomationOfferCard.tsx
import { ExternalLink, Bot, Users, Building2, Lock } from 'lucide-react';
import { Profession } from '@/data/professions';

interface AutomationOfferCardProps {
  profession: Profession;
  acesso: boolean;
}

interface OfferConfig {
  titulo: string;
  subtitulo: string;
  descricao: string;
  beneficios: string[];
  ctaLabelFree: string;
  ctaLabelPago: string;
  ctaHref: string;
  accentColor: string;
  icon: React.ReactNode;
}

function getOfferConfig(profession: Profession): OfferConfig | null {
  if (profession.categoria === 'saude') {
    return {
      titulo: 'Faroll Saúde',
      subtitulo: 'Gestão inteligente para sua clínica',
      descricao: 'Automatize sua agenda, prontuários e cobranças. Foque no que importa: seus pacientes.',
      beneficios: [
        'Agenda online com confirmação automática via WhatsApp',
        'Prontuário digital integrado',
        'Gestão financeira de sessões e planos',
        'Lista de espera inteligente',
      ],
      ctaLabelFree: 'Conhecer o Faroll Saúde',
      ctaLabelPago: 'Acessar Faroll Saúde',
      ctaHref: '/app/saude',
      accentColor: 'blue',
      icon: <Users size={28} className="text-blue-400" />,
    };
  }

  if (profession.categoria === 'imobiliario') {
    return {
      titulo: 'Faroll Imóveis',
      subtitulo: 'Automação para corretores e imobiliárias',
      descricao: 'Atenda leads pelo WhatsApp 24h com IA, gerencie imóveis e acompanhe seu funil de vendas.',
      beneficios: [
        'Atendimento automático via WhatsApp com IA',
        'CRM de leads e pipeline de vendas',
        'Gestão completa do portfólio de imóveis',
        'Dashboard com métricas e ranking da equipe',
      ],
      ctaLabelFree: 'Conhecer o Faroll Imóveis',
      ctaLabelPago: 'Acessar Faroll Imóveis',
      ctaHref: '/app/imoveis',
      accentColor: 'orange',
      icon: <Building2 size={28} className="text-orange-400" />,
    };
  }

  return null;
}

const accentStyles: Record<string, {
  border: string; bg: string; badge: string; btn: string; btnLocked: string; dot: string;
}> = {
  blue: {
    border: 'border-blue-500/30',
    bg: 'bg-blue-500/5',
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    btn: 'bg-blue-600 hover:bg-blue-500 text-white',
    btnLocked: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    dot: 'bg-blue-400',
  },
  orange: {
    border: 'border-orange-500/30',
    bg: 'bg-orange-500/5',
    badge: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    btn: 'bg-orange-500 hover:bg-orange-400 text-white',
    btnLocked: 'bg-slate-700 hover:bg-slate-600 text-slate-300',
    dot: 'bg-orange-400',
  },
};

export function AutomationOfferCard({ profession, acesso }: AutomationOfferCardProps) {
  const offer = getOfferConfig(profession);
  if (!offer) return null;

  const s = accentStyles[offer.accentColor] ?? accentStyles.orange;

  return (
    <div className={`rounded-2xl border ${s.border} ${s.bg} p-6 space-y-4`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${s.border} bg-white/5`}>
            {offer.icon}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-white text-lg">{offer.titulo}</h3>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${s.badge}`}>
                {acesso ? 'Ativo' : 'Parceiro'}
              </span>
            </div>
            <p className="text-sm text-slate-400 font-medium">{offer.subtitulo}</p>
          </div>
        </div>
        <Bot size={18} className="text-slate-600 mt-1" />
      </div>

      {/* Descrição */}
      <p className="text-sm text-slate-300 leading-relaxed">{offer.descricao}</p>

      {/* Benefícios */}
      <ul className="space-y-2">
        {offer.beneficios.map((b, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-400">
            <span className={`w-1.5 h-1.5 rounded-full ${s.dot} mt-1.5 shrink-0`} />
            {b}
          </li>
        ))}
      </ul>

      {/* CTA */}
      {acesso ? (
        <a
          href={offer.ctaHref}
          className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${s.btn}`}
        >
          {offer.ctaLabelPago}
          <ExternalLink size={14} />
        </a>
      ) : (
        <div className="space-y-2">
          <a
            href={offer.ctaHref}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-sm transition-all ${s.btnLocked}`}
          >
            <Lock size={14} />
            {offer.ctaLabelFree}
          </a>
          <p className="text-xs text-slate-500">
            Entre em contato para contratar este serviço.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Atualizar `ProfileScreen.tsx` — passar prop `acesso`**

Arquivo: `faroll-main/src/components/screens/ProfileScreen.tsx`

Linha atual (≈139–143):
```tsx
{user?.role === 'profissional' && professionObj && (
  <div className="mt-4">
    <AutomationOfferCard profession={professionObj} />
  </div>
)}
```

Substituir por:
```tsx
{user?.role === 'profissional' && professionObj && (
  <div className="mt-4">
    <AutomationOfferCard
      profession={professionObj}
      acesso={
        (professionObj.categoria === 'saude' && !!user.acessoHealthApp) ||
        (professionObj.categoria === 'imobiliario' && !!user.acessoFoxImobiliario)
      }
    />
  </div>
)}
```

**Step 3: Build local para verificar TypeScript**

```bash
cd faroll-main && npm run build
```

Resultado esperado: build sem erros de TypeScript.

**Step 4: Commit**

```bash
git add faroll-main/src/components/AutomationOfferCard.tsx
git add faroll-main/src/components/screens/ProfileScreen.tsx
git commit -m "feat(faroll): AutomationOfferCard com branding Faroll Saude/Imoveis e logica de acesso"
```

---

## Fase 3 — psicoapp: Reconectar ao Supabase principal como Faroll Saúde

---

### Task 5: Atualizar cliente Supabase do psicoapp

**Files:**
- Modify: `psicoapp/src/lib/supabase/client.ts`
- Modify: `psicoapp/src/lib/supabase/server.ts`
- Modify: `psicoapp/src/lib/supabase/middleware.ts`
- Modify: `psicoapp/.env`

**Context:** O psicoapp usa `@supabase/ssr`. Basta mudar as env vars e adicionar `{ db: { schema: 'health' } }` no `createClient()`. Isso faz TODAS as queries usarem o schema `health` automaticamente, sem mudar arquivo por arquivo.

**Step 1: Atualizar `.env` do psicoapp**

```env
# psicoapp/.env
DATABASE_URL=postgresql://postgres:[SENHA]@db.btndyypkyrlktkadymuv.supabase.co:5432/postgres

NEXT_PUBLIC_SUPABASE_URL=https://btndyypkyrlktkadymuv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8
```

> NOTA: `DATABASE_URL` — pegue a senha em Supabase → Settings → Database → Connection string.

**Step 2: Atualizar `client.ts` — adicionar schema `health`**

```typescript
// psicoapp/src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { db: { schema: 'health' } }
  );
}
```

**Step 3: Atualizar `server.ts` — adicionar schema `health`**

Arquivo atual: `psicoapp/src/lib/supabase/server.ts`

Localizar a chamada `createServerClient(...)` e adicionar `{ db: { schema: 'health' } }`:

```typescript
// psicoapp/src/lib/supabase/server.ts
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema: 'health' },
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

**Step 4: Atualizar `middleware.ts` — adicionar schema `health`**

Localizar a chamada `createServerClient(...)` no middleware e adicionar `{ db: { schema: 'health' } }` da mesma forma.

**Step 5: Atualizar branding — título da app**

Arquivo: `psicoapp/src/app/layout.tsx` linha 16:

```typescript
export const metadata: Metadata = {
  title: "Faroll Saúde | Gestão de Clínicas",
  description: "Agenda inteligente e gestão para clínicas multiespecialidade — Faroll Saúde",
};
```

**Step 6: Testar localmente**

```bash
cd psicoapp && npm run dev
```

Acessar `http://localhost:3000/app/saude/login` e tentar login com `farollapi@gmail.com`.
Resultado esperado: login funciona (sem "Failed to fetch").

**Step 7: Commit**

```bash
git add psicoapp/src/lib/supabase/client.ts
git add psicoapp/src/lib/supabase/server.ts
git add psicoapp/src/lib/supabase/middleware.ts
git add psicoapp/src/app/layout.tsx
git commit -m "feat(psicoapp): reconectar ao Supabase principal como Faroll Saude (schema health)"
```

---

### Task 6: Atualizar Vercel do psicoapp — env vars de produção

> Esta etapa é manual no dashboard do Vercel.

**Step 1: Acessar Vercel**

- Acesse https://vercel.com/dashboard
- Abra o projeto `psicoapp-eosin` (Faroll Saúde)
- Vá em **Settings → Environment Variables**

**Step 2: Atualizar as variáveis**

| Variável | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://btndyypkyrlktkadymuv.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8` |

**Step 3: Redeploy**

- **Deployments** → último deploy → **Redeploy** com "Clear build cache" marcado.

**Step 4: Testar em produção**

Acesse `https://farollbr.com.br/app/saude/login` em aba anônima.
Resultado esperado: tela de login abre sem "Failed to fetch".

---

## Fase 4 — fox/dashboard: Reconectar ao Supabase principal como Faroll Imóveis

---

### Task 7: Substituir auth do fox/dashboard por Supabase

**Context:** O fox/dashboard usa axios → flask backend com JWT próprio (`fox_token`). Para login único, vamos substituir o `AuthContext` pelo Supabase client do faroll-main. O backend Flask passará a validar tokens Supabase.

**Files:**
- Modify: `fox/dashboard/src/context/AuthContext.tsx`
- Modify: `fox/dashboard/src/api.ts`
- Modify: `fox/dashboard/src/pages/Login.tsx`
- Create: `fox/dashboard/src/lib/supabase.ts`
- Create: `fox/dashboard/.env`

**Step 1: Criar `.env` do fox/dashboard**

```env
# fox/dashboard/.env
VITE_SUPABASE_URL=https://btndyypkyrlktkadymuv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8
VITE_API_URL=http://localhost:8001
```

**Step 2: Instalar Supabase JS no fox/dashboard**

```bash
cd fox/dashboard && npm install @supabase/supabase-js
```

**Step 3: Criar cliente Supabase**

```typescript
// fox/dashboard/src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnon = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnon);
```

**Step 4: Substituir `AuthContext.tsx`**

```typescript
// fox/dashboard/src/context/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  access_token: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) setUser(toAuthUser(session));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ? toAuthUser(session) : null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function toAuthUser(session: Session): AuthUser {
    const u: User = session.user;
    return {
      id: u.id,
      nome: u.user_metadata?.nome ?? u.email?.split('@')[0] ?? 'Usuário',
      email: u.email ?? '',
      access_token: session.access_token,
    };
  }

  async function login(email: string, senha: string): Promise<void> {
    const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
    if (error) throw new Error(error.message);
  }

  function logout() {
    supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider value={{ user, session, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
```

**Step 5: Atualizar `api.ts` — usar token Supabase**

```typescript
// fox/dashboard/src/api.ts
import axios from 'axios';
import { supabase } from './lib/supabase';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:8001';
const api = axios.create({ baseURL });

api.interceptors.request.use(async (cfg) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.access_token && cfg.headers) {
    cfg.headers.Authorization = `Bearer ${session.access_token}`;
  }
  return cfg;
});

api.interceptors.response.use(
  r => r,
  err => {
    if (err.response?.status === 401) {
      supabase.auth.signOut();
      window.location.href = '/app/imoveis/login';
    }
    return Promise.reject(err);
  }
);

export default api;
```

**Step 6: Atualizar branding em `Login.tsx`**

Substituir linha `Fox Imobiliário` (linha ≈36) por `Faroll Imóveis`:

```tsx
<h1 className="text-6xl font-black tracking-tighter bg-gradient-to-r from-orange-400 to-orange-600 bg-clip-text text-transparent">
  Faroll Imóveis
</h1>
<p className="text-slate-500 mt-2 font-medium">Automação para corretores e imobiliárias</p>
```

**Step 7: Verificar TypeScript**

```bash
cd fox/dashboard && npm run build
```

Resultado esperado: sem erros.

**Step 8: Commit**

```bash
git add fox/dashboard/src/lib/supabase.ts
git add fox/dashboard/src/context/AuthContext.tsx
git add fox/dashboard/src/api.ts
git add fox/dashboard/src/pages/Login.tsx
git add fox/dashboard/.env
git commit -m "feat(fox-dashboard): substituir auth proprio por Supabase unificado (Faroll Imoveis)"
```

---

### Task 8: Atualizar backend fox — validar JWT Supabase + schema imob

**Files:**
- Modify: `fox/execution/database_handler.py` (ou onde o Supabase client é criado)
- Modify: `fox/main.py` — endpoint `/api/auth/login` e middleware de auth
- Modify: `fox/.env`

**Step 1: Atualizar `fox/.env`**

```env
# fox/.env
SUPABASE_URL=https://btndyypkyrlktkadymuv.supabase.co
SUPABASE_SERVICE_ROLE_KEY=[pegar em Supabase → Settings → API → service_role key]
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8
SUPABASE_SCHEMA=imob

# Manter outros
OPENAI_API_KEY=...
UAZAPI_BASE_URL=...
UAZAPI_TOKEN=...
```

**Step 2: Verificar `database_handler.py`**

Localizar onde `supabase-py` é inicializado. Deve estar em `fox/execution/database_handler.py`.
Atualizar para usar `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` do `.env` e queries no schema `imob`:

```python
# fox/execution/database_handler.py  (trecho a atualizar)
from supabase import create_client, Client
import os

SUPABASE_URL    = os.getenv("SUPABASE_URL")
SUPABASE_KEY    = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_SCHEMA = os.getenv("SUPABASE_SCHEMA", "imob")

class DatabaseHandler:
    def __init__(self):
        self.client: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        self.schema = SUPABASE_SCHEMA

    def save_lead(self, phone: str, name: str, demand: str, status: str = "novo", user_id: str = None):
        data = {"phone": phone, "nome": name, "demand": demand, "status": status}
        if user_id:
            data["user_id"] = user_id
        self.client.schema(self.schema).table("leads").upsert(data, on_conflict="phone").execute()

    def get_leads(self, user_id: str = None):
        query = self.client.schema(self.schema).table("leads").select("*").order("created_at", desc=True)
        if user_id:
            query = query.eq("user_id", user_id)
        return query.execute().data
```

**Step 3: Atualizar validação JWT no `main.py`**

Substituir o endpoint `/api/auth/login` por validação de JWT Supabase:

```python
# fox/main.py — adicionar helper de validação JWT Supabase
import requests
from functools import wraps

SUPABASE_URL  = os.getenv("SUPABASE_URL")
SUPABASE_ANON = os.getenv("SUPABASE_ANON_KEY")

def get_supabase_user(token: str) -> dict | None:
    """Valida Bearer token no Supabase e retorna o usuário."""
    resp = requests.get(
        f"{SUPABASE_URL}/auth/v1/user",
        headers={"apikey": SUPABASE_ANON, "Authorization": f"Bearer {token}"},
        timeout=5
    )
    if resp.status_code == 200:
        return resp.json()
    return None

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get("Authorization", "")
        if not auth_header.startswith("Bearer "):
            return jsonify({"error": "unauthorized"}), 401
        token = auth_header.split(" ", 1)[1]
        user  = get_supabase_user(token)
        if not user:
            return jsonify({"error": "invalid token"}), 401
        request.supabase_user = user
        return f(*args, **kwargs)
    return decorated
```

Aplicar `@require_auth` nos endpoints que precisam de autenticação.
Remover (ou manter como legacy) o endpoint `/api/auth/login`.

**Step 4: Commit**

```bash
git add fox/.env fox/execution/database_handler.py fox/main.py
git commit -m "feat(fox-backend): validar JWT Supabase + usar schema imob no banco principal"
```

---

## Fase 5 — Vercel: env vars + fix 404

---

### Task 9: Vercel fox/dashboard — env vars e Root Directory

> Passos manuais no dashboard do Vercel.

**Step 1: Atualizar env vars**

- Abra o projeto `dashboard-coral-two-64` no Vercel
- Settings → Environment Variables → adicionar/atualizar:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://btndyypkyrlktkadymuv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGci...un9zox8` (chave anon do faroll) |
| `VITE_API_URL` | URL do fox backend deployado (ex: Railway) |

**Step 2: Corrigir Root Directory (fix 404)**

- Settings → General → **Root Directory**
- Alterar para: `fox/dashboard`
- Salvar

**Step 3: Redeploy com clear cache**

- Deployments → último deploy → Redeploy → marcar "Clear build cache" → Deploy

**Step 4: Testar**

Acessar `https://farollbr.com.br/app/imoveis` em aba anônima.
Resultado esperado: tela de login do Faroll Imóveis aparece (sem 404).

---

## Ordem de execução recomendada

```
Fase 1 (SQL)     → Task 1, 2, 3   — Banco pronto
Fase 2 (faroll)  → Task 4          — Card atualizado
Fase 3 (psicoapp)→ Task 5, 6       — Faroll Saúde funcionando
Fase 4 (fox)     → Task 7, 8       — Faroll Imóveis funcionando
Fase 5 (Vercel)  → Task 9          — 404 corrigido
```

---

## Teste de aceitação final

1. Login em `farollbr.com.br` com `farollapi@gmail.com`
2. Ir em Perfil → ver card **Faroll Saúde** com botão "Acessar" (badge "Ativo")
3. Clicar "Acessar Faroll Saúde" → `farollbr.com.br/app/saude` → entra sem pedir login
4. Ir em Perfil → ver card **Faroll Imóveis** com botão "Acessar" (badge "Ativo")
5. Clicar "Acessar Faroll Imóveis" → `farollbr.com.br/app/imoveis` → entra sem 404 e sem pedir login
6. Outro usuário sem flags → vê os cards mas com botão "Conhecer" (badge "Parceiro") e não consegue entrar
