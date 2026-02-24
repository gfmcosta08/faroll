# Psicoapp

Gestão inteligente para clínicas multiespecialidade.

## Módulos

- **Auth** – Login, registro, setup de clínica
- **Dashboard** – Visão geral (consultas, pacientes, receita)
- **Agenda** – Calendário por profissional, novo agendamento
- **Pacientes** – Cadastro completo
- **WhatsApp** – Chat simulado para testar fluxo do bot
- **Financeiro** – Receita mensal, pagamentos

## Setup

1. **Variáveis de ambiente**

   Copie `.env.example` para `.env` e preencha:

   - `DATABASE_URL` – string de conexão PostgreSQL (Supabase)
   - `NEXT_PUBLIC_SUPABASE_URL` – URL do projeto Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` – anon key (Supabase > Connect > API)

2. **Auth no Supabase**

   - Auth > URL Configuration > Redirect URLs: `http://localhost:3000/auth/callback`
   - Auth > Providers > Email: habilitado

3. **Migrações**

   ```bash
   npm run db:migrate
   ```

4. **Dev**

   ```bash
   npm run dev
   ```

Acesse: http://localhost:3000
