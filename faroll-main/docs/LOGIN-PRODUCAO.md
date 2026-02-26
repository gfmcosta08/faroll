# Corrigir login no site online (Invalid API Key)

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
