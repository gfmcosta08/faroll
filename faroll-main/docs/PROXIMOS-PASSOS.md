# Próximos passos – continuar o projeto

**Última atualização:** 03/03/2026 (fim do dia)

---

## ⚠️ PRIORIDADE AMANHÃ: Confirmar fix do login (Invalid API Key)

### O que foi feito hoje (03/03/2026)
Investigamos e corrigimos o root cause do erro “Invalid API key” em produção:

**Root cause encontrado:** O Vercel tinha **duas variáveis** com a chave Supabase, e o código (`env.ts`) usa `VITE_SUPABASE_PUBLISHABLE_KEY` com prioridade sobre `VITE_SUPABASE_ANON_KEY`. Apenas a `ANON_KEY` havia sido atualizada com a chave nova; a `PUBLISHABLE_KEY` ainda tinha a chave antiga/inválida.

**O que foi corrigido:**
- ✅ `VITE_SUPABASE_ANON_KEY` → atualizada com a chave atual do Supabase dashboard
- ✅ `VITE_SUPABASE_PUBLISHABLE_KEY` → também atualizada com a mesma chave
- ✅ Deploy disparado (commit `70da7b1`) às ~23:35 de 03/03/2026

**Último commit:** `70da7b1` — “trigger deploy: fix VITE_SUPABASE_PUBLISHABLE_KEY no Vercel”

### Amanhã: primeira coisa a fazer

1. Abrir **https://farollbr.com.br** em **aba anônima**
2. Tentar fazer login com suas credenciais
3. **Se funcionar:** ✅ problema resolvido — pode seguir com as pendências abaixo
4. **Se ainda der erro “Invalid API key”:**
   - Abrir F12 → Network → clicar em `/auth/v1/token` → ver `apikey` no Request Headers
   - Verificar no Vercel se `VITE_SUPABASE_PUBLISHABLE_KEY` foi salva corretamente (Settings → Environment Variables)
   - Verificar se o deploy `70da7b1` está como **Ready + Current** no Vercel → Deployments

### Variáveis corretas no Vercel (conferir se necessário)
| Variável | Ambiente | Valor esperado |
|---|---|---|
| `VITE_SUPABASE_URL` | Production | `https://btndyypkyrlktkadymuv.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Production | chave anon atual do Supabase → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Production | **mesma chave** da ANON_KEY acima |

---

## Estado atual do projeto

- **Repositório:** branch `main`, tudo commitado e em push.
- **farollbr.com.br:** login com erro “Invalid API key” (fix aplicado, confirmar amanhã).
- **Integração domínio único:** Rewrites no `faroll-main/vercel.json` para `/app/saude` e `/app/imoveis` em produção.
- **Painéis no perfil:** Botões “Acessar painel” para quem tem `acesso_health_app` ou `acesso_fox_imobiliario` (ver `SUPABASE-PAINEIS-ACESSO.md`).
- **Fox (imoveis):** `fox/dashboard/vercel.json` atualizado.

---

## Pendências conhecidas (após confirmar login)

- **Redesign da landing:** enviar referências visuais; ajustar: imagem de natureza fora, mais ênfase na logo, carrossel de profissionais, seção “cadastro, busca, contato e agenda” menor, informativos em estilo jornal.

---

## Checklist 404 /app/imoveis

Se `https://farollbr.com.br/app/imoveis` retornar 404:

1. **Vercel → projeto dashboard (Fox)**  
   - **Settings → General** → **Root Directory** deve ser **`fox/dashboard`** (caminho relativo à raiz do repositório).  
   - Se estiver vazio ou diferente (ex.: `dashboard`, `fox`), alterar para **`fox/dashboard`** e salvar.

2. **Redeploy do projeto dashboard**  
   - **Deployments** → último deploy → **Redeploy** com **"Clear build cache"** marcado.  
   - Aguardar 2–3 minutos.

3. **Testar na ordem:**  
   - Primeiro: **https://dashboard-coral-two-64.vercel.app/app/imoveis**  
     Se ainda der 404 aqui, o problema está no build/config do Fox (ver Build Logs; Build Command `npm run build`, Output Directory `dist`).  
   - Depois: **https://farollbr.com.br/app/imoveis**  
     Se funcionar, o rewrite do faroll-main está correto e o problema era o deploy do Fox.

---

## Pendências conhecidas

- **Redesign da landing:** você vai enviar referências visuais; aí ajustamos: imagem de natureza fora, mais ênfase na logo, carrossel de profissionais, seção “cadastro, busca, contato e agenda” menor, informativos em estilo jornal.

---

## Arquivos úteis

| Arquivo | Uso |
|--------|-----|
| `faroll-main/vercel.json` | Rewrites para saude e imoveis |
| `fox/dashboard/vercel.json` | Rewrites para servir SPA em `/app/imoveis` |
| `faroll-main/docs/SUPABASE-PAINEIS-ACESSO.md` | Migration e flags de acesso aos painéis |
| `faroll-main/docs/PRODUTOS-E-PAINEIS.md` | Visão geral produtos e painéis |
| `faroll-main/docs/LOGIN-PRODUCAO.md` | Login em produção |

---

Para retomar: abrir este doc e seguir a seção **“Amanhã: primeira coisa a fazer”**.
