# Secretária Eletrônica WhatsApp com Google Calendar

Este projeto segue a arquitetura de 3 camadas (Diretiva, Orquestração, Execução) conforme definido em seu arquivo `AGENTS.md`.

## Estrutura do Projeto
- `directives/`: Contém a "alma" da secretária, as regras de negócio em Markdown.
- `execution/`: Scripts determinísticos para lidar com APIs.
  - `google_calendar_tool.py`: Busca horários e agenda eventos.
  - `whatsapp_handler.py`: Envia mensagens via API de WhatsApp.
- `main.py`: O servidor Flask (webhook) que orquestra a inteligência artificial e as ferramentas.
- `.env`: Onde você deve colocar suas chaves de API.

## Pré-requisitos
1. **Python 3.10+** instalado.
2. **Google Cloud Project**:
   - Ative a Google Calendar API.
   - Crie uma credencial do tipo "OAuth Client ID" (Desktop App).
   - Baixe o JSON e salve como `credentials.json` na raiz deste projeto.
3. **OpenAI API Key**: Para processar a linguagem natural.
4. **Instância de WhatsApp**: (Ex: Evolution API, Uazapi, etc) que suporte webhooks.

## Como Iniciar
1. Instale as dependências:
   ```bash
   pip install -r requirements.txt
   ```
2. Configure o arquivo `.env` com suas chaves.
3. Execute o servidor:
   ```bash
   python main.py
   ```
4. Configure o Webhook na sua API de WhatsApp para apontar para `http://seu-ip:5000/webhook`.

## Fluxo da Secretária
1. **Saudação**: Se apresenta como assistente.
2. **Entendimento**: Ouve o cliente e identifica se o objetivo é agendamento.
3. **Consulta**: Verifica na Agenda do Google os horários livres.
4. **Sugestão**: Oferece 3 a 4 horários ou sugere alternativas.
5. **Confirmação**: Agenda e envia o link do convite.
