# Critérios de Aceite — Sistema de Calendário

> Documento de referência para validação do comportamento esperado do calendário.
> Última atualização: 26/01/2026

---

## Índice

1. [Legenda Visual](#1-legenda-visual)
2. [Eventos Pessoais (🟢)](#2-eventos-pessoais-)
3. [Agendamentos (🔵)](#3-agendamentos-)
4. [Bloqueios de Agenda (🔴)](#4-bloqueios-de-agenda-)
5. [Permissões por Perfil](#5-permissões-por-perfil)
6. [Cenários de Teste](#6-cenários-de-teste)

---

## 1. Legenda Visual

| Cor | Elemento | Significado |
|-----|----------|-------------|
| 🟢 Verde | Bolinha no calendário | Evento pessoal do usuário logado |
| 🔵 Azul | Bolinha no calendário | Agendamento (consulta/atendimento) |
| 🔴 Vermelho | Bolinha no calendário | Bloqueio de agenda (profissional) |

---

## 2. Eventos Pessoais (🟢)

### 2.1 Definição
Evento criado pelo próprio usuário para uso pessoal. Não afeta outros usuários.

### 2.2 Campos Obrigatórios
- [ ] Título
- [ ] Data
- [ ] Hora início
- [ ] Hora fim

### 2.3 Campos Opcionais
- [ ] Descrição

### 2.4 Regras de Negócio
| Regra | Esperado | Status |
|-------|----------|--------|
| Não bloqueia agendamentos | ✅ | |
| Não consome Gcoin | ✅ | |
| Visível apenas para o criador | ✅ | |
| Pode ser excluído pelo criador | ✅ | |

### 2.5 Critérios de Aceite — Cliente

| ID | Cenário | Resultado Esperado |
|----|---------|-------------------|
| EP-C01 | Cliente cria evento pessoal na tela de Calendário | Evento salvo com sucesso |
| EP-C02 | Evento criado aparece no calendário | Bolinha verde no dia correspondente |
| EP-C03 | Evento criado aparece na lista do dia | Exibe título, horário, descrição (se houver) |
| EP-C04 | Cliente exclui evento pessoal | Evento removido do calendário e lista |
| EP-C05 | Cliente visualiza apenas seus eventos | Eventos de outros usuários NÃO aparecem |

### 2.6 Critérios de Aceite — Profissional

| ID | Cenário | Resultado Esperado |
|----|---------|-------------------|
| EP-P01 | Profissional NÃO vê formulário de criar evento na tela principal | Formulário ausente |
| EP-P02 | Profissional cria evento em "Gerenciar Calendário" | Evento salvo com sucesso |
| EP-P03 | Evento criado aparece no calendário do profissional | Bolinha verde no dia |
| EP-P04 | Evento criado aparece na lista do dia | Exibe título, horário, descrição |
| EP-P05 | Profissional exclui evento pessoal | Evento removido |
| EP-P06 | Cliente NÃO vê evento pessoal do profissional | Evento invisível para clientes |

---

## 3. Agendamentos (🔵)

### 3.1 Definição
Compromisso real entre cliente e profissional. Consome Gcoin e aparece nos calendários de ambas as partes.

### 3.2 Campos Obrigatórios
- [ ] Data
- [ ] Hora início
- [ ] Hora fim
- [ ] Profissional (ID)
- [ ] Cliente (ID)

### 3.3 Regras de Negócio
| Regra | Esperado | Status |
|-------|----------|--------|
| Consome 1 Gcoin do vínculo | ✅ | |
| Aparece no calendário do cliente | ✅ | |
| Aparece no calendário do profissional | ✅ | |
| Profissional recebe notificação | ✅ | |
| Respeita antecedência mínima | ✅ | |
| Não permite agendar em horário bloqueado | ✅ | |

### 3.4 Regra de Permissão de Agendamento

> **REGRA DE OURO:** Quem possui Gcoins no vínculo é quem pode agendar.

| Cenário | Pode Agendar? | Motivo |
|---------|---------------|--------|
| Profissional → Seu Cliente | ❌ NÃO | Cliente possui os Gcoins |
| Profissional → Outro Profissional | ✅ SIM | Ele é "cliente" no vínculo |
| Cliente → Profissional | ✅ SIM | Cliente possui os Gcoins |
| Dependente → Profissional | ❌ NÃO | Dependente nunca agenda |
| Secretária → Profissional | Depende | Segue permissões configuradas |

### 3.5 Critérios de Aceite — Agendamento

| ID | Cenário | Resultado Esperado |
|----|---------|-------------------|
| AG-01 | Cliente com Gcoins agenda horário disponível | Agendamento criado |
| AG-02 | Cliente sem Gcoins tenta agendar | Agendamento bloqueado |
| AG-03 | Cliente tenta agendar em horário bloqueado | Agendamento bloqueado |
| AG-04 | Agendamento aparece no calendário do cliente | Bolinha azul + "Consulta com Dr. X" |
| AG-05 | Agendamento aparece no calendário do profissional | Bolinha azul + "Consulta com Cliente Y" |
| AG-06 | Profissional tenta agendar para seu cliente | Botão de agendar indisponível |
| AG-07 | Profissional agenda com outro profissional (como cliente) | Agendamento criado |
| AG-08 | Cancelamento dentro do prazo | Gcoin devolvido |
| AG-09 | Cancelamento fora do prazo | Gcoin consumido |

---

## 4. Bloqueios de Agenda (🔴)

### 4.1 Definição
Horários fechados pelo profissional. Impede agendamentos e é visível para clientes vinculados.

### 4.2 Tipos de Bloqueio
| Tipo | Seleção | Aplicação |
|------|---------|-----------|
| Dia | Uma data específica | Faixas aplicam-se apenas naquele dia |
| Período | Data início + Data fim | Faixas aplicam-se em TODOS os dias do intervalo |

### 4.3 Campos Obrigatórios
- [ ] Tipo (Dia ou Período)
- [ ] Data(s)
- [ ] Uma ou mais faixas de horário (início + fim)

### 4.4 Campos Opcionais
- [ ] Motivo

### 4.5 Regras de Negócio
| Regra | Esperado | Status |
|-------|----------|--------|
| Impede agendamentos nos horários bloqueados | ✅ | |
| Não consome Gcoin | ✅ | |
| Visível para o profissional | ✅ | |
| Visível para todos os clientes vinculados | ✅ | |
| Clientes recebem notificação | ✅ | |

### 4.6 Critérios de Aceite — Bloqueios

| ID | Cenário | Resultado Esperado |
|----|---------|-------------------|
| BL-01 | Profissional cria bloqueio tipo "Dia" | Bloqueio salvo |
| BL-02 | Bloqueio tipo "Dia" aparece no calendário | Bolinha vermelha no dia |
| BL-03 | Bloqueio tipo "Dia" aparece na lista do dia | "Bloqueado — 08:00 às 12:00" |
| BL-04 | Profissional cria bloqueio tipo "Período" | Bloqueio salvo |
| BL-05 | Bloqueio tipo "Período" aparece em TODOS os dias | Bolinha vermelha em cada dia |
| BL-06 | Cada dia do período mostra as faixas | Lista exibe horários bloqueados |
| BL-07 | Cliente vê bloqueio no calendário do profissional | Bolinha vermelha visível |
| BL-08 | Cliente tenta agendar em horário bloqueado | Agendamento impedido |
| BL-09 | Profissional exclui bloqueio | Bloqueio removido de todos os dias |
| BL-10 | Múltiplas faixas de horário no mesmo dia | Todas as faixas exibidas |

---

## 5. Permissões por Perfil

### 5.1 Matriz de Permissões — Calendário

| Ação | Cliente | Profissional | Dependente | Secretária |
|------|---------|--------------|------------|------------|
| Ver calendário próprio | ✅ | ✅ | ⚙️ | ✅ |
| Criar evento pessoal (tela principal) | ✅ | ❌ | ❌ | ❌ |
| Criar evento pessoal (Gerenciar) | N/A | ✅ | N/A | ⚙️ |
| Criar bloqueio | ❌ | ✅ | ❌ | ⚙️ |
| Ver bloqueios do profissional | ✅ | ✅ | ⚙️ | ✅ |
| Agendar consulta | ✅* | ✅** | ❌ | ⚙️ |
| Cancelar consulta | ✅ | ✅ | ❌ | ⚙️ |

> ✅ = Permitido | ❌ = Bloqueado | ⚙️ = Depende de configuração
> 
> *Cliente: apenas se tiver Gcoins com o profissional
> 
> **Profissional: apenas quando é "cliente" no vínculo (agendando com outro profissional)

### 5.2 Dependente

| Permissão | Configurável? | Padrão |
|-----------|---------------|--------|
| Ver calendário | ✅ Sim | true |
| Ver compromissos | ✅ Sim | true |
| Agendar/Cancelar | ❌ Fixo | false |

### 5.3 Secretária

| Permissão | Configurável? | Padrão |
|-----------|---------------|--------|
| Gerenciar agenda | ✅ Sim | true |
| Acesso clínico | ❌ Fixo | false |

---

## 6. Cenários de Teste

### 6.1 Fluxo Completo — Cliente

```
1. [ ] Login como cliente
2. [ ] Acessar tela de Calendário
3. [ ] Verificar legenda de cores visível
4. [ ] Criar evento pessoal com título, horário e descrição
5. [ ] Verificar bolinha verde no dia
6. [ ] Verificar evento na lista do dia
7. [ ] Excluir evento pessoal
8. [ ] Verificar que evento foi removido
9. [ ] Acessar calendário do profissional via Contatos
10. [ ] Verificar bloqueios do profissional visíveis
11. [ ] Agendar consulta em horário disponível
12. [ ] Verificar bolinha azul no calendário próprio
13. [ ] Verificar notificação de confirmação
```

### 6.2 Fluxo Completo — Profissional

```
1. [ ] Login como profissional
2. [ ] Acessar tela de Calendário
3. [ ] Verificar que NÃO há formulário de criar evento
4. [ ] Verificar agendamentos dos clientes visíveis (bolinha azul)
5. [ ] Acessar "Gerenciar Calendário"
6. [ ] Criar evento pessoal
7. [ ] Verificar bolinha verde no calendário
8. [ ] Criar bloqueio tipo "Dia"
9. [ ] Verificar bolinha vermelha no dia
10. [ ] Criar bloqueio tipo "Período" (3 dias)
11. [ ] Verificar bolinha vermelha em todos os 3 dias
12. [ ] Verificar que cada dia mostra as faixas de horário
13. [ ] Acessar Contatos > Cliente
14. [ ] Verificar que NÃO há botão de agendar (é cliente dele)
```

### 6.3 Fluxo de Erro — Agendamento Bloqueado

```
1. [ ] Login como cliente
2. [ ] Profissional tem bloqueio das 10:00 às 12:00
3. [ ] Cliente tenta agendar às 10:30
4. [ ] Sistema deve impedir o agendamento
5. [ ] Mensagem clara de "Horário indisponível"
```

### 6.4 Fluxo de Erro — Sem Gcoins

```
1. [ ] Login como cliente
2. [ ] Cliente NÃO possui Gcoins com profissional X
3. [ ] Cliente tenta agendar com profissional X
4. [ ] Sistema deve impedir o agendamento
5. [ ] Mensagem clara de "Sem créditos disponíveis"
```

---

## Checklist de Validação Final

### Visual
- [ ] Bolinhas coloridas aparecem corretamente no calendário
- [ ] Cores correspondem: verde=pessoal, azul=agendamento, vermelho=bloqueio
- [ ] Lista abaixo do calendário exibe itens do dia selecionado
- [ ] Cada item mostra título/nome e faixa de horário

### Funcional
- [ ] Eventos pessoais isolados por usuário
- [ ] Agendamentos visíveis para ambas as partes
- [ ] Bloqueios impedem agendamentos
- [ ] Bloqueios visíveis para clientes vinculados
- [ ] Permissões de perfil respeitadas

### Dados
- [ ] Eventos persistem após navegação
- [ ] Exclusão remove corretamente o registro
- [ ] Notificações disparadas nos momentos corretos

---

## Histórico de Alterações

| Data | Versão | Descrição |
|------|--------|-----------|
| 26/01/2026 | 1.0 | Documento inicial com todos os critérios |

---

> **Nota:** Este documento deve ser atualizado sempre que novas funcionalidades forem adicionadas ao sistema de calendário.
