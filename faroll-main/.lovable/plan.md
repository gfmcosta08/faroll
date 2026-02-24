
# Plano: Ajuste Visual Final para Referencia Farollbr

## Analise das Imagens de Referencia

Comparando as imagens enviadas com o estado atual do codigo, identifico os seguintes ajustes necessarios:

### 1. Calendario - Cores dos Eventos (CalendarScreen.tsx)
**Atual:** Verde (hsl 142) para pessoal, Azul (hsl 217) para agendamentos, Vermelho (hsl 0) para bloqueios
**Referencia (imagem Capturar6.PNG):** Roxo (#5B4FE5) para atendimentos, Turquesa/Ciano (#4ECDC4) para pessoal, Cinza (#95A5A6) para bloqueios

Arquivos afetados:
- `src/components/screens/CalendarScreen.tsx` - Trocar todas as cores inline `hsl(142...)` por turquesa, `hsl(217...)` por roxo, `hsl(0, 84%...)` por cinza
- `src/components/ui/calendar-with-dots.tsx` - Atualizar cores dos dots se aplicavel

### 2. Landing Page - Secao "Como Funciona" (LandingPage.tsx)
**Atual:** Nao existe essa secao
**Referencia (imagem Capturar-4.PNG):** 4 cards com icones coloridos (Cliente=roxo, Profissional=turquesa, Dependente=coral/verde, Secretaria=amarelo)

Adicionar secao visual entre Hero e Profissionais (apenas markup + classes Tailwind, sem logica nova).

### 3. Landing Page - Cards de Profissionais
**Atual:** Cards complexos com descricao e badges de especialidade
**Referencia (imagens):** Cards mais simples e limpos - foto circular, nome, badge de categoria, localizacao com pin, estrela grande com nota, botao "Avaliar"

Simplificar o `className` dos cards para layout mais centrado e clean.

### 4. Landing Page - Secao de Busca
**Referencia (Capturar1-3.PNG):** Faixa roxa com "Encontre o profissional ideal" e barra de busca com 3 campos + botao "Buscar"

Adicionar secao visual apos profissionais em destaque.

### 5. Galeria - Badges de Especialidade
**Atual:** `variant="secondary"` (cinza)
**Referencia:** Badges em roxo claro (usar `variant="specialty"`)

---

## Detalhamento Tecnico

### Arquivo 1: `src/components/screens/CalendarScreen.tsx`
Apenas troca de valores CSS inline (cores):

| De | Para | Contexto |
|----|------|----------|
| `hsl(142, 71%, 45%)` | `hsl(174, 58%, 56%)` | Eventos pessoais (turquesa) |
| `hsl(217, 91%, 60%)` | `hsl(245, 74%, 60%)` | Agendamentos (roxo) |
| `hsl(0, 84%, 60%)` | `hsl(0, 0%, 60%)` | Bloqueios (cinza) |

Legenda atualizada de acordo.

### Arquivo 2: `src/components/landing/LandingPage.tsx`
- Adicionar secao "Como funciona" com 4 cards (apenas divs com classes Tailwind e icones Lucide existentes)
- Adicionar secao "Encontre o profissional ideal" com fundo roxo
- Simplificar visual dos cards de profissionais para layout centrado
- Nenhuma alteracao em funcoes, useEffect, useState ou queries

### Arquivo 3: `src/components/screens/GalleryScreen.tsx`
- Trocar `variant="secondary"` por `variant="specialty"` nos badges de especialidade (linha ~415)
- Nenhuma alteracao em logica de filtros ou queries

### Arquivo 4: `src/components/ui/calendar-with-dots.tsx`
- Verificar e alinhar cores dos dots com a nova paleta (turquesa/roxo/cinza)

---

## O Que NAO Sera Alterado

- Zero alteracoes em funcoes JavaScript/TypeScript
- Zero alteracoes em hooks, useEffect, useState
- Zero alteracoes em queries do Supabase
- Zero alteracoes em event handlers
- Zero alteracoes em rotas ou autenticacao
- Apenas: valores de cor em `style={}`, classes `className`, e markup visual estatico

---

## Resumo

| Arquivo | Tipo de Mudanca |
|---------|-----------------|
| CalendarScreen.tsx | Trocar cores inline (verde→turquesa, azul→roxo, vermelho→cinza) |
| LandingPage.tsx | Adicionar secoes visuais "Como funciona" e "Busca" com classes Tailwind |
| GalleryScreen.tsx | Trocar variant de badges |
| calendar-with-dots.tsx | Alinhar cores dos dots |
