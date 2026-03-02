# Corrigir login no site online (Invalid API Key)

O código já aplica `.trim()` nas variáveis Supabase (`src/integrations/supabase/env.ts`) para evitar "Invalid API Key" por espaços/quebras de linha colados na Vercel. O que falta é **configuração** (variáveis na Vercel e Redirect URLs no Supabase) e **novo deploy** após alterar env.

Siga estes passos **no navegador** — o assistente não tem acesso às suas contas.

---

## 1. Vercel (variáveis de ambiente)

### Onde encontrar no Vercel

Você está na **Overview** do projeto. Para achar **Settings** e **Environment Variables**:

- **Opção A (link direto):** abra no navegador:
  - **Configurações do projeto:**  
    `https://vercel.com/gianpaolo-ferreira-matos-costas-projects/faroll-main/settings`
  - **Variáveis de ambiente (direto):**  
    `https://vercel.com/gianpaolo-ferreira-matos-costas-projects/faroll-main/settings/environment-variables`

- **Opção B (pelo menu):** na página do projeto **faroll-main**, no topo:
  - Clique no nome do projeto **faroll-main** ou no **⋮** (três pontinhos) e procure **Settings** / **Configurações**.
  - Ou na barra de abas (Overview, Deployments, Analytics…), role para a direita e veja se aparece **Settings**.

Dentro de **Settings**, no menu lateral esquerdo, clique em **Environment Variables**.

### O que fazer nas Environment Variables

1. Na página **Environment Variables**, clique em **Add New** (ou **Add**).
2. Adicione estas variáveis para **Production** (e marque **Preview** se quiser):

   | Name | Value |
   |------|--------|
   | `VITE_SUPABASE_URL` | `https://btndyypkyrlktkadymuv.supabase.co` |
   | `VITE_SUPABASE_ANON_KEY` | *(copie no passo 2 abaixo)* |

3. Clique em **Save** em cada uma.

### Novo deploy (para as variáveis valerem)

Na Vercel, **Redeploy** em deploys "prebuilt" não usa as variáveis novas. É preciso **criar um novo deploy**:

**Opção 1 – Push no Git (recomendado)**  
No seu PC, na pasta do projeto:
```bash
cd d:\GDrive\Farollintegrado
git commit --allow-empty -m "trigger deploy: atualizar env"
git push origin main
```
A Vercel faz um deploy novo automaticamente e usa as variáveis atuais.

**Opção 2 – Pela Vercel**  
- Aba **Deployments** → botão **Create Deployment** (ou **Deploy**), se existir.  
- Ou use a Opção 1.

**Opção 3 – Pelo terminal (Vercel CLI)**  
```bash
cd d:\GDrive\Farollintegrado\faroll-main
npx vercel --prod
```

---

## 2. Supabase (copiar a chave e liberar a URL)

1. Acesse **https://supabase.com** → seu projeto.
2. **Settings** (ícone engrenagem) → **API**.
   - Em **Project API keys**, copie a chave **anon** / **public** (não use service_role).
   - Use essa chave no passo 1 acima em `VITE_SUPABASE_ANON_KEY`.
3. **Authentication** → **URL Configuration**.
   - **Site URL:** coloque a URL do seu site, ex.: `https://farolbr.com.br`
   - **Redirect URLs:** adicione `https://farolbr.com.br` e `https://farolbr.com.br/**`
4. Clique em **Save**.

---

## 3. Conferir

Depois do redeploy na Vercel, acesse o site online e tente logar de novo.  
Se ainda der erro, confira se não há espaço ou quebra de linha no valor de `VITE_SUPABASE_ANON_KEY` na Vercel.

---

## 4. Checklist rápido (se o erro voltar)

| # | Onde verificar | Ação |
|---|----------------|------|
| 1 | Vercel → faroll-main → Environment Variables | Valor de `VITE_SUPABASE_ANON_KEY` idêntico à chave **anon** em Supabase → Settings → API, sem espaço/newline no final. |
| 2 | Vercel → Deployments | Novo deploy (push no Git ou Redeploy com **"Clear build cache"** marcado). |
| 3 | Supabase → Authentication → URL Configuration | Site URL e Redirect URLs com `https://farolbr.com.br` e `https://farolbr.com.br/**`. |
| 4 | Navegador | Testar em aba anônima; abrir F12 e ver se o erro no console é "Invalid API Key" (confirma que a causa é env no build). |

---

## 5. Domínio farollbr.com.br abrindo site antigo (mesmo em anônimo)

Se ao **digitar** farollbr.com.br você vê o site antigo e "Invalid API Key", mas ao **clicar no link** da Vercel o site novo abre e o login funciona, o domínio está recebendo build antigo (cache da CDN ou domínio apontando para deploy antigo).

**O que foi feito no código:**
- Em `vercel.json` foram adicionados headers `Cache-Control: public, max-age=0, must-revalidate` para `/` e `/index.html`, para que o HTML da entrada não fique em cache e sempre busque a versão nova após um deploy.

**Passos após cada novo deploy:**
1. Na Vercel → **Deployments** → confirme que o deploy mais recente está **Ready** e é o de **Production**.
2. Em **Settings** → **Domains**, confira se `farollbr.com.br` está listado e vinculado a este projeto (o domínio passa a servir o deploy que está como Production).
3. Aguarde 1–2 minutos após o deploy ficar Ready e teste de novo em **janela anônima** digitando `https://farollbr.com.br`.
4. Se ainda aparecer o site antigo, na Vercel em **Deployments** → no deploy **novo** (Ready) → abra o deploy e use **Promote to Production** se existir, para garantir que esse deploy seja o que o domínio usa.
