# [Nome da Diretiva]

> Breve descrição de uma linha do que esta diretiva faz.

---

## Objetivo

Descreva claramente o objetivo final desta operação. O que deve ter acontecido quando ela terminar com sucesso?

---

## Entradas

| Campo | Tipo | Origem | Descrição |
|---|---|---|---|
| `campo_1` | string | `.env` / usuário / arquivo | O que é este dado |
| `campo_2` | list | Supabase / Google Sheets | O que é este dado |

---

## Ferramentas / Scripts

Liste os scripts em `execution/` que esta diretiva usa, em ordem de chamada:

1. `execution/script_a.py` — descrição do que faz
2. `execution/script_b.py` — descrição do que faz

---

## Saídas / Deliverables

- **Google Sheet** `Nome da Planilha` (link) — o que contém
- **Supabase** tabela `nome_tabela` — o que é inserido/atualizado
- **Arquivo** `.tmp/resultado.json` — intermediário, pode ser apagado após uso

---

## Fluxo de Execução

```
[Entrada] → script_a.py → [.tmp/intermediario.json] → script_b.py → [Deliverable]
```

---

## Edge Cases e Limitações

- **Limite de API**: ex. Google Sheets aceita no máximo 100 requisições/minuto → usar batch
- **Dados ausentes**: se campo X estiver vazio, pular o registro e logar aviso
- **Falha parcial**: registrar IDs que falharam em `.tmp/erros.json` para reprocessamento

---

## Aprendizados / Atualizações

> Atualize esta seção conforme o loop de self-annealing identificar melhorias.

- `[data]` — descrição do aprendizado ou ajuste feito
