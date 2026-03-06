# Próximos passos – continuar o projeto

**Última atualização:** 05/03/2026 (fim do dia)

---

## 🔴 FAZER PRIMEIRO AO RETOMAR — Verificar e testar

### TESTE OBRIGATÓRIO — Fluxo completo em aba anônima

Antes de qualquer coisa, testar em aba anônima se o fluxo está funcionando:

1. Abrir **https://farollbr.com.br** em aba anônima
2. Fazer login com `farollapi@gmail.com`
3. ✅ Esperado: entra no app (sem "Invalid API key")
4. Ir em Perfil ou Config → clicar **"Acessar Faroll Saúde"**
5. ✅ Esperado: tela "Autenticando..." por 1-2 segundos e vai direto ao dashboard do psicoapp (sem passar pela landing "Health-App")
6. Clicar **"Acessar Faroll Imóveis"**
7. ✅ Esperado: fox/dashboard abre com o usuário já logado

Se ainda der erro → conectar Chrome extension (ler instruções abaixo) e ver console.

---

## 📋 O que foi implementado HOJE (05/03/2026)

### Sessão completa de debugging + fix definitivo

#### Diagnóstico (investigação sistemática)
- **Chaves Supabase no bundle**: corretas (btndyypkyrlktkadymuv hardcoded como fallback no bundle `index-OxM0IhXZ.js`)
- **config.js**: correto e sendo servido
- **Supabase anon key**: válida (testada diretamente → 200 OK)
- **Root cause REAL encontrado**: psicoapp mostra "Health-App" (home antiga) porque usa cookies SSR enquanto farollbr.com.br usa localStorage — sessões nunca eram compartilhadas

#### Fixes implementados

| Arquivo | Mudança | Motivo |
|---------|---------|--------|
| `faroll-main/src/utils/navigateToSubApp.ts` | **NOVO** — obtém access_token da sessão e navega para `/app/saude/auth/handoff?access_token=...&refresh_token=...` | Handoff de sessão: psicoapp usa cookies, farollbr.com.br usa localStorage |
| `faroll-main/src/components/screens/ProfileScreen.tsx` | Botão "Acessar Faroll Saúde" usa `navigateToSaude()` em vez de `<a href>` | Precisa passar token |
| `faroll-main/src/components/screens/ConfigScreen.tsx` | Mesmo fix do ProfileScreen | Precisa passar token |
| `faroll-main/src/components/AutomationOfferCard.tsx` | Nova prop `onCta?: () => void` — quando fornecida, CTA vira `<button onClick>` em vez de `<a href>` | Permite override do comportamento |
| `psicoapp/src/app/auth/handoff/page.tsx` | **NOVO** — page client-side que lê tokens da URL, chama `supabase.auth.setSession()` e redireciona para `/dashboard` | Cria sessão em cookies para o SSR do Next.js |
| `psicoapp/src/app/page.tsx` | `Health-App` → `Faroll Saúde` | Branding correto |

#### Commits do dia

| Projeto | Commit | Descrição |
|---------|--------|-----------|
| faroll-main | `648406d` | fix: runtime config (public/config.js) |
| faroll-main | `8206df9` | fix: cache CDN headers no vercel.json |
| faroll-main | `8b5b0b3` | **fix: token handoff → psicoapp** |
| psicoapp | — | deploy via `vercel deploy --prod --yes` (sem commit git separado) |

#### Estado atual das deployments
- **faroll-main prod**: `faroll-main-81fp1pqt5` (2h atrás, Lovable.dev build do commit `8b5b0b3`)
- **psicoapp prod**: `psicoapp-k4e32ieqq` — incluiu `/auth/handoff` route, "Faroll Saúde" no title ✅

#### Verificações de produção feitas
- `farollbr.com.br` → `<script src="/config.js">` presente ✅
- `farollbr.com.br/config.js` → chave `btndyypkyrlktkadymuv` correta ✅
- `farollbr.com.br/app/saude` → `<h1>Faroll Saúde</h1>` (não mais "Health-App") ✅
- `farollbr.com.br/app/saude/auth/handoff` → 200 OK ✅
- Bundle novo `index-OxM0IhXZ.js` → tem `handoff` + `FAROLL_CONFIG` + keys corretas ✅

---

## 🔧 Pendências técnicas restantes

### 1. Backend fox — preencher `.env`

Arquivo: `fox/backend/.env`

| Variável | Onde buscar |
|----------|-------------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API → `service_role` secret |
| `OPENAI_API_KEY` | platform.openai.com → API Keys |
| `UAZAPI_BASE_URL` | Painel UAZAPI |
| `UAZAPI_TOKEN` | Painel UAZAPI |
| `UAZAPI_INSTANCE` | Painel UAZAPI |

### 2. SQL já executado (referência)

```sql
-- Executado em 05/03/2026:
-- health.setup_clinic(clinic_name, professional_name) → cria clínica + profissional + perfil
-- imob.profiles + imob.empresas para farollapi@gmail.com
-- acesso_health_app = true, acesso_fox_imobiliario = true para farollapi@gmail.com
```

Se precisar re-executar (ex: banco resetado):
```sql
-- Criar perfil imob para farollapi@gmail.com
WITH new_empresa AS (
  INSERT INTO imob.empresas (nome, plano) VALUES ('Imobiliária Faroll', 'trial') RETURNING id
),
user_data AS (
  SELECT id FROM auth.users WHERE email = 'farollapi@gmail.com'
)
INSERT INTO imob.profiles (user_id, role, empresa_id, nome, email)
SELECT u.id, 'dono_imobiliaria', e.id, 'Faroll API', 'farollapi@gmail.com'
FROM user_data u, new_empresa e
ON CONFLICT (user_id) DO NOTHING;

-- Garantir flags de acesso
UPDATE public.profiles
SET acesso_health_app = true, acesso_fox_imobiliario = true
WHERE email = 'farollapi@gmail.com';
```

---

## 📐 Arquitetura atual (referência)

```
farollbr.com.br                   →  faroll-main (Vite/React, schema: public)
                                       Auth: Supabase localStorage
                                       Deploy: Lovable.dev CI/CD (6s prebuilt)
                                       Fix: public/config.js carregado antes do bundle

farollbr.com.br/app/saude        →  proxy → psicoapp-eosin.vercel.app (Next.js, schema: health)
                                       Auth: @supabase/ssr (cookies SSR)
                                       Handoff: /auth/handoff recebe token via URL e cria sessão

farollbr.com.br/app/imoveis      →  proxy → dashboard-coral-two-64.vercel.app (Vite/React, schema: imob)
                                       Auth: Supabase localStorage (mesmo origin → compartilha sessão!)

Supabase único: btndyypkyrlktkadymuv
├── public.*    → faroll-main (agendamentos, perfis, profissionais)
├── health.*    → Faroll Saúde (clínicas, pacientes, agendamentos, financeiro)
└── imob.*      → Faroll Imóveis (empresas, imóveis, leads, bot WhatsApp)
```

---

## ⚠️ Ponto crítico: Lovable.dev CI/CD

**Todo commit em faroll-main no GitHub → Lovable.dev rebuilda em 6s (keys erradas deles) → override.**

**Fix permanente**: `public/config.js` commitado no git → Lovable.dev inclui o arquivo → runtime override funciona.

**NÃO mudar env vars no painel Vercel do faroll-main** — não tem efeito (Lovable.dev usa os deles).

---

## 🎯 Próximas etapas de produto (após testes passarem)

- [ ] Redesign da landing page farollbr.com.br (referências visuais pendentes)
- [ ] Onboarding de novas clínicas no Faroll Saúde (fluxo de Setup)
- [ ] Onboarding de novas imobiliárias no Faroll Imóveis (fluxo de criação de empresa)
- [ ] Tela de "Contratação" dentro do faroll-main para ativar acesso aos produtos
- [ ] Backend fox (UAZAPI + OpenAI) — completar após preencher `.env`

---

Para retomar: abrir este doc, fazer o **TESTE OBRIGATÓRIO** no topo e depois seguir as pendências.
