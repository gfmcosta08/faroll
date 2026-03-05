# Próximos passos – continuar o projeto

**Última atualização:** 04/03/2026 (fim do dia)

---

## 🔴 FAZER PRIMEIRO — Configurações manuais pendentes

### 1. Vercel — projeto `dashboard-coral-two-64` (Faroll Imóveis)

No painel Vercel → projeto `dashboard-coral-two-64`:

**Settings → Environment Variables** — adicionar/atualizar:

| Variável | Valor |
|----------|-------|
| `VITE_SUPABASE_URL` | `https://btndyypkyrlktkadymuv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ0bmR5eXBreXJsa3RrYWR5bXV2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk5NzY1OTAsImV4cCI6MjA4NTU1MjU5MH0.5BYPNbD3cXA-_f_SMzKk4fUCGHOgGON13E13un9zox8` |
| `VITE_API_URL` | URL do backend fox (ex: `https://seu-backend.railway.app`) |

**Settings → General → Root Directory:**
- Verificar se está `fox/dashboard`. Se não estiver, corrigir.

Após salvar → **Redeploy** com "Clear build cache".

---

### 2. Backend fox — preencher `.env`

Arquivo: `fox/backend/.env`

| Variável | Onde buscar |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` secret key |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `UAZAPI_BASE_URL` | Painel UAZAPI |
| `UAZAPI_TOKEN` | Painel UAZAPI |
| `UAZAPI_INSTANCE` | Painel UAZAPI |

---

## ✅ TESTES — O que validar depois das configurações acima

### TESTE 1 — Login no faroll-main (já deve funcionar)
1. Abrir **https://farollbr.com.br** em aba anônima
2. Fazer login com `farollapi@gmail.com`
3. ✅ Esperado: entra no app normalmente, sem "Invalid API key"

---

### TESTE 2 — Acesso liberado no perfil
1. Logado como `farollapi@gmail.com`
2. Ir em **Perfil** (ícone de usuário)
3. ✅ Esperado: dois botões aparecem:
   - "Acessar Faroll Saúde" (botão secundário)
   - "Acessar Faroll Imóveis" (botão secundário)
4. ✅ Esperado: card `AutomationOfferCard` aparece com badge **"Ativo"** e botão **"Acessar Faroll..."** (não "Conhecer")

---

### TESTE 3 — Faroll Saúde (`/app/saude`)
1. Clicar em "Acessar Faroll Saúde" ou ir em **https://farollbr.com.br/app/saude**
2. ✅ Esperado: abre a tela de login do psicoapp com título **"Faroll Saúde | Gestão de Clínicas"**
3. Fazer login com `farollapi@gmail.com`
4. ✅ Esperado: entra no dashboard do psicoapp sem "Failed to fetch"
5. Criar uma clínica de teste (Setup)
6. ✅ Esperado: dados salvos no Supabase → schema `health` → tabela `health.clinics`

Para confirmar no Supabase SQL Editor:
```sql
SELECT * FROM health.clinics ORDER BY created_at DESC LIMIT 5;
SELECT * FROM health.profiles WHERE email = 'farollapi@gmail.com';
```

---

### TESTE 4 — Faroll Imóveis (`/app/imoveis`)
1. Clicar em "Acessar Faroll Imóveis" ou ir em **https://farollbr.com.br/app/imoveis**
2. ✅ Esperado: abre a tela de login com título **"Faroll Imóveis"**
3. Fazer login com `farollapi@gmail.com`
4. ✅ Esperado: entra no dashboard sem 404
5. Nota: o dashboard só funcionará 100% após criar um perfil em `imob.profiles`

Para criar o perfil manualmente no Supabase (necessário para o 1º login):
```sql
-- 1. Primeiro crie uma empresa de teste
INSERT INTO imob.empresas (nome, plano)
VALUES ('Imobiliária Teste', 'trial')
RETURNING id;

-- 2. Copie o ID retornado e insira o perfil
-- (substitua USER_ID pelo id do auth.users do farollapi@gmail.com)
-- (substitua EMPRESA_ID pelo id retornado acima)
INSERT INTO imob.profiles (user_id, role, empresa_id, nome, email)
VALUES (
  'USER_ID',
  'dono_imobiliaria',
  'EMPRESA_ID',
  'Faroll API',
  'farollapi@gmail.com'
);
```

Para pegar o USER_ID:
```sql
SELECT id, email FROM auth.users WHERE email = 'farollapi@gmail.com';
```

---

### TESTE 5 — AutomationOfferCard (comportamento por tipo de usuário)

**Usuário profissional da saúde COM acesso:**
- Badge: **"Ativo"**
- Botão: **"Acessar Faroll Saúde"**

**Usuário profissional da saúde SEM acesso:**
- Badge: **"Parceiro"**
- Botão: **"Conhecer o Faroll Saúde"**

**Usuário corretor de imóveis COM acesso:**
- Badge: **"Ativo"**
- Botão: **"Acessar Faroll Imóveis"**

---

### TESTE 6 — Backend fox (após preencher .env)
1. Fazer uma requisição autenticada ao backend (ex: `GET /api/leads`)
2. ✅ Esperado: retorna dados da empresa do usuário logado
3. ✅ Token Supabase aceito (não mais token customizado `fox_token`)
4. ✅ Dados vêm do schema `imob` (não mais schema `public`)

---

## 📋 O que foi implementado hoje (04/03/2026)

### Fase 1 — SQL (executado no Supabase `btndyypkyrlktkadymuv`)
| Arquivo | O que faz |
|---------|-----------|
| `supabase/migrations/20260304000001_health_schema.sql` | Schema `health` com 10 tabelas + RLS para Faroll Saúde |
| `supabase/migrations/20260304000002_imob_schema.sql` | Schema `imob` com 9 tabelas + RLS para Faroll Imóveis |
| SQL avulso | `farollapi@gmail.com` com `acesso_health_app=true` e `acesso_fox_imobiliario=true` |

### Fase 2 — faroll-main (commits na branch `main`)
| Arquivo | Mudança |
|---------|---------|
| `src/components/AutomationOfferCard.tsx` | Renomeado Health-App → Faroll Saúde, Fox Imobiliário → Faroll Imóveis; prop `acesso` (badge Ativo/Parceiro, botão Acessar/Conhecer) |
| `src/components/screens/ProfileScreen.tsx` | Passa prop `acesso` correta; botões "Acessar Faroll Saúde" / "Acessar Faroll Imóveis" |

### Fase 3 — psicoapp (commits na branch `main`)
| Arquivo | Mudança |
|---------|---------|
| `.env` (local) | `NEXT_PUBLIC_SUPABASE_URL` e `ANON_KEY` → projeto `btndyypkyrlktkadymuv` |
| `src/lib/supabase/client.ts` | `{ db: { schema: "health" } }` |
| `src/lib/supabase/server.ts` | `{ db: { schema: "health" } }` |
| `src/lib/supabase/middleware.ts` | `{ db: { schema: "health" } }` |
| `src/app/layout.tsx` | Título `"Faroll Saúde | Gestão de Clínicas"` |
| **Vercel `psicoapp-eosin`** | ✅ Env vars atualizadas (feito pelo usuário) |

### Fase 4 — fox/dashboard (commits na branch `main`)
| Arquivo | Mudança |
|---------|---------|
| `src/lib/supabase.ts` | **Novo** — cliente Supabase com `schema: 'imob'` |
| `src/context/AuthContext.tsx` | Auth migrada para `supabase.auth.signInWithPassword` + perfil de `imob.profiles` |
| `src/api.ts` | Token Bearer vem de `supabase.auth.getSession()` |
| `src/App.tsx` | `PrivateRoute`/`PublicRoute` com `isLoading` para evitar flash |
| `src/pages/Login.tsx` | Título `"Faroll Imóveis"` |

### Fase 5 — fox/backend (commits na branch `main`)
| Arquivo | Mudança |
|---------|---------|
| `api/auth.py` | Remove login customizado; `verify_token` valida JWT via Supabase `/auth/v1/user` + busca `imob.profiles` |
| `database.py` | Headers `Accept-Profile: imob` e `Content-Profile: imob` em todas as requisições PostgREST |
| `.env` | URL e anon key atualizados; `SUPABASE_SERVICE_ROLE_KEY` aguardando preenchimento |

---

## 📌 Commits do dia

| Projeto | Commit | Descrição |
|---------|--------|-----------|
| faroll-main | `5779339` | health_schema.sql |
| faroll-main | `a41ead2` | imob_schema.sql |
| faroll-main | `683cb97` | AutomationOfferCard + ProfileScreen renomeados |
| psicoapp | `bde7b00` | Reconexão Supabase + schema health |
| fox/dashboard | `9475753` | Auth migrada para Supabase |
| fox/backend | `6826aec` | JWT Supabase + schema imob |

---

## 📐 Arquitetura final (referência)

```
farollbr.com.br          →  Vercel: faroll-main  (Vite/React)  — schema: public
farollbr.com.br/app/saude   →  rewrite → psicoapp-eosin.vercel.app  (Next.js) — schema: health
farollbr.com.br/app/imoveis →  rewrite → dashboard-coral-two-64.vercel.app  (React/Vite) — schema: imob

Supabase único: btndyypkyrlktkadymuv
├── public.*    → faroll-main (agendamentos, perfis, profissionais)
├── health.*    → Faroll Saúde (clínicas, pacientes, agendamentos, financeiro)
└── imob.*      → Faroll Imóveis (empresas, imóveis, leads, bot WhatsApp)
```

---

## 🎯 Próximas etapas (após testes passarem)

- [ ] Redesign da landing page (referências visuais pendentes)
- [ ] Onboarding de novas clínicas no Faroll Saúde (fluxo de Setup)
- [ ] Onboarding de novas imobiliárias no Faroll Imóveis (fluxo de criação de empresa)
- [ ] Tela de "Contratação" dentro do faroll-main para ativar acesso aos produtos

---

Para retomar: abrir este doc e seguir **"FAZER PRIMEIRO"** acima.
