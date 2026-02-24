import openai
import os
import json
from dotenv import load_dotenv

load_dotenv()

class AIProcessor:
    def __init__(self, directive_path):
        self.api_key = os.getenv("OPENAI_API_KEY")
        openai.api_key = self.api_key
        
        # Load the directive (SOP)
        try:
            with open(directive_path, 'r', encoding='utf-8') as f:
                self.system_prompt = f.read()
        except Exception as e:
            self.system_prompt = "Você é uma secretária virtual útil."
            print(f"Error loading directive: {e}")

    def process_message(self, history, tools=None):
        """
        Sends the conversation history to OpenAI and handles tool calls.
        """
        messages = [{"role": "system", "content": self.system_prompt}] + history
        
        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages,
                tools=tools,
                tool_choice="auto" if tools else None
            )
            return response.choices[0].message
        except Exception as e:
            print(f"Error in AI processing: {e}")
            return None

    def summarize_demand(self, conversation_history):
        """
        Generates a summary of the user's demand for the CRM.
        """
        summary_prompt = "Resuma a demanda deste cliente em uma frase curta para o CRM. Foco no objetivo (ex: Quer agendar visita, Dúvida sobre preços)."
        messages = conversation_history + [{"role": "user", "content": summary_prompt}]
        
        try:
            response = openai.chat.completions.create(
                model="gpt-4o-mini",
                messages=messages
            )
            return response.choices[0].message.content
        except:
            return "Demanda não identificada"
