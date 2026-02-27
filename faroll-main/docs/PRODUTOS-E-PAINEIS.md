# Produtos e painéis: vínculo com o site FarolBR

## Como está hoje

### 1. Site FarolBR (faroll-main)
- **URL:** https://farollbr.com.br
- É o produto principal: landing, cadastro, login, galeria, calendário, perfil, chat, etc.
- **Auth:** Supabase (usuários em `profiles`).

### 2. Oferta de automação (já existe no código)
- No **Perfil** do profissional (tela de perfil no app), existe o **AutomationOfferCard**:
  - Se a profissão for da **categoria saúde** → mostra card do **Health-App** (“Automatize sua agenda, prontuários…”), com botão “Conhecer o Health-App” que hoje aponta para **/app/saude (mesmo domínio)**.
  - Se a profissão for da **categoria imobiliário** (ex.: Corretor de Imóveis) → mostra card do **Fox Imobiliário** (“Secretária virtual para corretores…”), com botão “Conhecer o Fox Imobiliário” que hoje aponta para **/app/imoveis (mesmo domínio)**.
- Ou seja: já existe um **banner/oferta** por categoria, mas:
  - Os links são **paths no mesmo domínio** (/app/saude, /app/imoveis); não é necessário domínio separado por produto.
  - Não existe “cliente pagou → você libera → botão **Acessar painel**” no perfil. O card é só divulgação para todos daquela categoria.

### 3. Painéis (apps separados)
- **Health-App** (saúde): pasta `psicoapp/`. Next.js. Dashboard, agenda, pacientes, etc.
- **Fox Imobiliário** (imobiliário): pasta `fox/dashboard/`. Vite + React. Dashboard por perfil (dono, corretor, secretária), imóveis, leads.
- Hoje **não estão ligados** ao site FarolBR: são apps com deploy e auth próprios. O cliente não “entra pelo site” neles; entraria direto na URL de cada um (quando estiverem publicados).

---

## O que falta para o fluxo que você quer

Você quer:
1. Cliente se cadastra no **site FarolBR** (farollbr.com.br).
2. **Saúde:** banner “Automate your business” / “Automatize seu negócio” → cliente paga valor à parte → você **habilita** no cadastro dele → aparece um botão **“Acessar painel”** (Health-App).
3. **Imobiliário:** mesmo fluxo com banner para o produto imobiliário → cliente paga → você habilita → botão **“Acessar painel”** (FOX Dashboard).
4. O cliente acessa o painel **a partir do site** (por esse botão).

Para isso ser possível, precisa:

### No site FarolBR (faroll-main)
1. **Banners no fluxo de cadastro/perfil**
   - Manter ou reforçar o card de oferta (AutomationOfferCard) como “Automate your business” / “Automatize seu negócio” para saúde e imobiliário.
   - Opcional: banner também na **tela de registro** (por exemplo, após escolher profissão), não só no perfil.
2. **Campo “produto habilitado” por usuário**
   - No banco (ex.: tabela `profiles` ou tabela `assinaturas_produto`): algo como `acesso_health_app` (boolean) e `acesso_fox_imobiliario` (boolean), ou um único campo “produtos_habilitados” (array).
   - Só você (admin) altera isso, após o pagamento do cliente.
3. **Botão “Acessar painel” na área logada**
   - Na tela de perfil (ou em um menu “Meu painel”): um botão **“Acessar painel”** (ou “Ir para o Health-App” / “Ir para o Dashboard imobiliário”) que:
     - Só aparece se o perfil daquele usuário tiver o produto habilitado (`acesso_health_app` ou `acesso_fox_imobiliario`).
     - Ao clicar, leva para **paths no mesmo domínio**: `/app/saude` ou `/app/imoveis`.
4. **Um único domínio (sem domínio por produto)**
   - O AutomationOfferCard já aponta para **/app/saude** e **/app/imoveis**. O deploy (ex.: farollbr.com.br) deve servir o Health-App em `/app/saude` e o Fox Imobiliário em `/app/imoveis` (ex.: Vercel rewrites ou path-based routing).

### Como você acessa hoje (e como o cliente acessaria depois)

- **Site FarolBR**
  - Acesso: https://farollbr.com.br (produção) ou `npm run dev` em `faroll-main` (localhost).
- **Health-App**
  - Código: `psicoapp/`. Rodar local: `cd psicoapp && npm run dev` (geralmente http://localhost:3000).
  - Para o cliente “acessar pelo site”: o site teria que mostrar o botão “Acessar painel” apontando para a URL onde o Psicoapp estiver publicado (ex.: psico.farollbr.com.br). Essa URL hoje **não existe** até você fazer o deploy do Psicoapp.
- **Fox Imobiliário**
  - Código: `fox/dashboard/`. Rodar local: `cd fox/dashboard && npm run dev`.
  - Depende de uma API (ex.: `/api/dashboard/empresa`, `/api/corretores`); sem o backend, o front abre mas os dados do dashboard podem não carregar.
  - Para o cliente “acessar pelo site”: mesmo raciocínio – publicar o FOX em uma URL (ex.: imoveis.farollbr.com.br) e o botão no FarolBR apontar para lá.

---

## Resumo direto

| Pergunta | Resposta |
|----------|----------|
| Os três (site, Health-App, Fox Imobiliário) estão **ligados** ao site FarolBR? | Não. O site só tem um **card de oferta** (AutomationOfferCard) no perfil que leva a links externos. Não há “botão Acessar painel” condicionado a produto pago. |
| Como **eu** acesso os painéis hoje? | **Site:** farollbr.com.br. **Health-App:** rodar `npm run dev` em `psicoapp/` (localhost:3000). **Fox Imobiliário:** `npm run dev` em `fox/dashboard/` (e backend da API se necessário). |
| Como o **cliente** acessaria pelo site? | Só depois de: (1) ter campos no banco “acesso_health_app” / “acesso_fox”; (2) você habilitar isso após o pagamento; (3) ter botão “Acessar painel” no perfil que só aparece quando habilitado e que aponta para a URL onde cada painel estiver publicado. |

Se quiser, no próximo passo podemos desenhar juntos os campos no Supabase (ex.: `acesso_health_app`, `acesso_fox_imobiliario`) e onde exatamente colocar o botão “Acessar painel” na interface do FarolBR.
