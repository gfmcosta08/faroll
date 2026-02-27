# Passo a passo Supabase — Acesso aos painéis (Health-App / Fox Imobiliário)

Este guia descreve como aplicar a migration e liberar acessos aos painéis no Supabase.

---

## Passo 1: Aplicar a migration (criar as colunas)

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard) e abra o projeto do FarolBR.
2. No menu lateral, abra **SQL Editor**.
3. Clique em **New query**.
4. Cole exatamente o conteúdo abaixo:

```sql
-- Acesso aos painéis contratados (Health-App e Fox Imobiliário).
-- Apenas admin altera; usuário vê no perfil e usa o botão "Acessar painel".
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS acesso_health_app boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS acesso_fox_imobiliario boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.profiles.acesso_health_app IS 'Liberado pelo admin após contratação do Health-App';
COMMENT ON COLUMN public.profiles.acesso_fox_imobiliario IS 'Liberado pelo admin após contratação do Fox Imobiliário';
```

5. Clique em **Run** (ou Ctrl+Enter).
6. Confirme que a execução terminou sem erro (mensagem de sucesso na parte inferior).

---

## Passo 2: Conferir as colunas (opcional)

1. No menu lateral, vá em **Table Editor**.
2. Selecione a tabela **profiles**.
3. Verifique se existem as colunas **acesso_health_app** e **acesso_fox_imobiliario** (tipo boolean, default false). Em perfis já existentes, o valor deve aparecer como `false`.

---

## Passo 3: Liberar acesso para um usuário (teste ou produção)

1. Ainda em **Table Editor** → **profiles**, localize a linha do perfil do usuário que deve ter acesso (use o filtro por e-mail ou nome se quiser).
2. Na linha desse perfil:
   - Para liberar **Health-App:** na coluna `acesso_health_app`, altere para **true**.
   - Para liberar **Fox Imobiliário:** na coluna `acesso_fox_imobiliario`, altere para **true**.
3. Salve (check ou botão Save, conforme a interface).
4. O usuário precisa fazer **logout e login** (ou recarregar a sessão) para o front carregar os novos valores; depois disso, na tela de perfil dele aparecerá a seção "Seus painéis" e os botões correspondentes.

---

## Passo 4: (Opcional) Liberar via SQL

Se preferir usar o SQL Editor em vez do Table Editor:

```sql
-- Troque 'EMAIL_DO_USUARIO' pelo e-mail do perfil que você quer liberar
UPDATE public.profiles
SET
  acesso_health_app = true,   -- ou false para remover
  acesso_fox_imobiliario = true   -- ou false para remover
WHERE email = 'EMAIL_DO_USUARIO';
```

Execute a query e, em seguida, o usuário deve fazer logout/login para ver o botão "Acessar painel".

---

## Resumo

| Item | Status |
|------|--------|
| Migration criada | `supabase/migrations/20260224120000_profiles_acesso_paineis.sql` |
| Colunas em `profiles` | `acesso_health_app`, `acesso_fox_imobiliario` (boolean, default false) |
| Quem altera | Apenas admin (via Table Editor ou SQL); usuário só lê no próprio perfil |
| Onde o usuário vê | **Configurações** e **Perfil** (ao visualizar um profissional), seção "Seus painéis", após logout/login com as flags true |

Nada quebra se a migration ainda não foi aplicada; porém o login pode falhar ao buscar o perfil (colunas inexistentes). Aplique a migration antes de depender dos acessos.

---

## Troubleshooting: painéis não aparecem

Se você já aplicou a migration e marcou `true` no perfil, mas os painéis não aparecem:

1. **Fez deploy?** O site online precisa ter o código atualizado (ProfileScreen, ConfigScreen, useAuth). Rode `npm run build` e faça o deploy do FarolBR.
2. **Perfil correto?** Edite o perfil cujo `user_id` corresponde ao usuário logado (auth.users.id). Na tabela `profiles`, use o filtro por `user_id` ou `email` para achar a linha certa.
3. **Sessão antiga?** Faça **logout** e **login** de novo — o `useAuth` carrega o perfil no login; valores alterados só entram após um novo login.
4. **Onde procurar?** Os painéis aparecem em **Configurações** (menu inferior) e também no **Perfil** (ao clicar em um profissional na Galeria e ir para a tela de perfil dele).
