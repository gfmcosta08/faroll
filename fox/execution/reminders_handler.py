import datetime
from execution.google_calendar_tool import get_calendar_service
from execution.whatsapp_handler import send_message

def check_and_send_reminders():
    """
    Checks for appointments in the next 24h and 2h and sends WhatsApp reminders.
    This should be run periodically (e.g., every hour).
    """
    service = get_calendar_service()
    if not service: return
    
    now = datetime.datetime.utcnow().isoformat() + 'Z'
    # Look ahead 24 hours
    limit = (datetime.datetime.utcnow() + datetime.timedelta(days=1)).isoformat() + 'Z'
    
    events_result = service.events().list(calendarId='primary', timeMin=now,
                                        timeMax=limit, singleEvents=True,
                                        orderBy='startTime').execute()
    events = events_result.get('items', [])
    
    for event in events:
        start_str = event['start'].get('dateTime', event['start'].get('date'))
        start_dt = datetime.datetime.fromisoformat(start_str.replace('Z', '+00:00'))
        
        diff = start_dt - datetime.datetime.now(datetime.timezone.utc)
        minutes = diff.total_seconds() / 60
        
        # Check if it's ~24h (1440 mins) or ~2h (120 mins)
        # Note: In production, track who already received reminders in DB!
        if 1430 < minutes < 1440:
            msg = f"Olá! Lembrete: Você tem um agendamento amanhã às {start_dt.strftime('%H:%M')}: {event.get('summary')}"
            # Logic to find phone number (could be in description or summary)
            # send_message(phone, msg)
            print(f"Reminder 24h: {msg}")
            
        elif 115 < minutes < 125:
            msg = f"Olá! Seu agendamento é daqui a 2 horas ({start_dt.strftime('%H:%M')}). Nos vemos em breve!"
            # send_message(phone, msg)
            print(f"Reminder 2h: {msg}")

if __name__ == "__main__":
    check_and_send_reminders()
