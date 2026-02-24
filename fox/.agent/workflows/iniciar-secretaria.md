---
description: Como rodar a Secretária Eletrônica
---
Este workflow guia o usuário na configuração e execução do projeto.

1. **Configuração de Ambiente**
   - Garanta que o Python está instalado.
   - Instale as dependências: `pip install -r requirements.txt`

2. **Configuração do Google Calendar**
   - Obtenha o `credentials.json` no Google Cloud Console.
   - Coloque o arquivo na raiz do projeto `d:\FOX\`.

3. **Configuração do .env**
   - Edite o arquivo `.env` e insira sua `OPENAI_API_KEY`.
   - Adicione a URL e Token da sua API de WhatsApp.

// turbo
4. **Execução**
   - Rode o comando: `python main.py`

5. **Teste**
   - Envie uma mensagem no WhatsApp: "Olá, gostaria de agendar um horário para amanhã."
