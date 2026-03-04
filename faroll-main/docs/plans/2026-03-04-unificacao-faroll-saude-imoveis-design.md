# Design: Unificação Faroll Saúde + Faroll Imóveis

**Data:** 2026-03-04
**Status:** Aprovado
**Supabase alvo:** `btndyypkyrlktkadymuv` (farollbr.com.br)

---

## Contexto

Os projetos `psicoapp` (saúde) e `fox/dashboard` (imóveis) tinham projetos Supabase próprios que foram deletados pelo free tier. O objetivo é unificar tudo em um único projeto Supabase, com login único e acesso controlado por contratação.

---

## Decisões

| Item | Decisão |
|------|---------|
| Supabase | Um único projeto (`btndyypkyrlktkadymuv`) |
| Login | Único — conta farollbr.com.br serve os 3 apps |
| Acesso | Por contratação — admin seta flag por usuário |
| Isolamento | Multi-tenant por clínica (`health.*`) e por imobiliária (`imob.*`) |
| Nome health app | **Faroll Saúde** |
| Nome imob app | **Faroll Imóveis** |
| Abordagem DB | Schemas PostgreSQL separados (Abordagem A) |

---

## Arquitetura

```
farollbr.com.br
├── /                → faroll-main (React + Vite)
├── /app/saude/*     → psicoapp / Faroll Saúde (Next.js) [Vercel rewrite]
└── /app/imoveis/*   → fox/dashboard / Faroll Imóveis (React + Vite) [Vercel rewrite]

Supabase btndyypkyrlktkadymuv
├── auth.users           ← LOGIN ÚNICO para todos os apps
├── public.*             ← faroll-main (profiles, user_roles, specializations…)
├── health.*             ← Faroll Saúde
│   ├── health.clinics
│   ├── health.professionals
│   ├── health.patients
│   ├── health.appointments
│   ├── health.schedules
│   ├── health.whatsapp_leads
│   └── health.financeiro
└── imob.*               ← Faroll Imóveis
    ├── imob.imoveis
    ├── imob.leads
    └── imob.bot_control
```

---

## Fluxo de acesso

1. Usuário cria conta em farollbr.com.br → entra em `auth.users` + `public.profiles`
2. Admin seta `acesso_health_app = true` ou `acesso_fox_imobiliario = true` em `public.profiles`
3. No perfil do profissional aparece o `AutomationOfferCard`:
   - `categoria = 'saude'` → card **Faroll Saúde**
   - `categoria = 'imobiliario'` → card **Faroll Imóveis**
4. Card com `acesso = false` → botão "Contratar" (modal de contratação)
5. Card com `acesso = true` → botão "Acessar" → navega para `/app/saude` ou `/app/imoveis`
6. App recebe o JWT do faroll-main e autentica via mesmo `auth.users`

---

## Mudanças por repositório

### faroll-main
- `AutomationOfferCard`: atualizar nomes para "Faroll Saúde" / "Faroll Imóveis"
- `AutomationOfferCard`: adicionar prop `acesso: boolean` e lógica contratado vs não contratado
- Nenhuma mudança no Supabase client (já correto)

### psicoapp (→ Faroll Saúde)
- Atualizar nome/branding para "Faroll Saúde" em títulos, navbar e metadados
- `NEXT_PUBLIC_SUPABASE_URL` → `https://btndyypkyrlktkadymuv.supabase.co`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` → chave anon do projeto faroll-main
- Todas as queries Supabase: adicionar `{ schema: 'health' }`
- Atualizar env vars no Vercel (projeto psicoapp-eosin)

### fox/dashboard (→ Faroll Imóveis)
- Atualizar nome/branding para "Faroll Imóveis" em títulos, navbar e metadados
- `VITE_SUPABASE_URL` → `https://btndyypkyrlktkadymuv.supabase.co`
- `VITE_SUPABASE_ANON_KEY` → chave anon do projeto faroll-main
- Todas as queries Supabase: adicionar `{ schema: 'imob' }`
- Atualizar env vars no Vercel (projeto dashboard-coral-two-64)
- Corrigir Root Directory no Vercel: `fox/dashboard` (fix do 404)

---

## Banco de dados — migrations a criar

### Fase 1: Schemas e migrations `health`
- `CREATE SCHEMA health`
- Adaptar `psicoapp/supabase/migrations/001` a `011` trocando `public.` → `health.`
- Arquivo único: `faroll-main/supabase/migrations/YYYYMMDD_health_schema.sql`

### Fase 2: Schema e migrations `imob`
- `CREATE SCHEMA imob`
- Adaptar `fox/scripts/setup_db.sql` + migrations v2/v3 trocando schema padrão → `imob.`
- Arquivo único: `faroll-main/supabase/migrations/YYYYMMDD_imob_schema.sql`

### Fase 3: Permissões Supabase
- `GRANT USAGE ON SCHEMA health TO anon, authenticated`
- `GRANT USAGE ON SCHEMA imob TO anon, authenticated`
- RLS nos dois schemas (multi-tenant por `clinic_id` no health)

---

## Acesso de teste imediato

Executar no SQL Editor do Supabase (`btndyypkyrlktkadymuv`):

```sql
UPDATE public.profiles
SET acesso_health_app = true,
    acesso_fox_imobiliario = true
WHERE email = 'farollapi@gmail.com';
```

---

## Fora do escopo deste design

- Migração de dados existentes (projetos deletados — sem dados a migrar)
- Redesign do psicoapp ou fox (apenas rebranding de nome)
- Criação de página de contratação/pagamento (CTA aponta para contato/WhatsApp por ora)
