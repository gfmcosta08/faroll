# Próximos passos – continuar o projeto

**Última atualização:** 24/02/2025 (fim do dia)

---

## Estado atual

- **Repositório:** branch `main` limpa, tudo commitado e em push.
- **farollbr.com.br:** OK (portal principal).
- **Integração domínio único:** Rewrites no `faroll-main/vercel.json` para `/app/saude` e `/app/imoveis` já commitados e em produção.
- **Painéis no perfil:** Botões "Acessar painel" em Perfil/Configurações para quem tem `acesso_health_app` ou `acesso_fox_imobiliario` (ver `SUPABASE-PAINEIS-ACESSO.md`).
- **Fox (imoveis):** `fox/dashboard/vercel.json` atualizado (outputDirectory, rewrites para `/app/imoveis` e `/app/imoveis/`).

---

## Amanhã: primeira coisa a fazer

1. **Testar as URLs (após os deploys da Vercel terem rodado):**
   - https://farollbr.com.br/app/saude  
   - https://farollbr.com.br/app/imoveis  

2. **Se `/app/imoveis` ainda der 404:**
   - No **Vercel** → projeto **dashboard** (Fox).
   - Conferir **Root Directory** = `fox/dashboard`.
   - Se estiver vazio ou diferente, corrigir para `fox/dashboard` e fazer **Redeploy** (opção “Clear build cache” se quiser).

3. **Variáveis no Vercel (Fox):** Garantir que o projeto **dashboard** tem `VITE_API_URL` configurada para produção.

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
