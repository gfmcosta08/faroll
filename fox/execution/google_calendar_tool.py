import datetime
import os.path
from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

# If modifying these scopes, delete the file token.json.
SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds = None
    # The file token.json stores the user's access and refresh tokens, and is
    # created automatically when the authorization flow completes for the first
    # time.
    token_path = os.path.join(os.path.dirname(__file__), '..', 'token.json')
    creds_path = os.path.join(os.path.dirname(__file__), '..', 'credentials.json')

    if os.path.exists(token_path):
        creds = Credentials.from_authorized_user_file(token_path, SCOPES)
    
    # If there are no (valid) credentials available, let the user log in.
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists(creds_path):
                print(f"Error: {creds_path} not found. Please provide Google API credentials.")
                return None
            flow = InstalledAppFlow.from_client_secrets_file(creds_path, SCOPES)
            creds = flow.run_local_server(port=0)
        # Save the credentials for the next run
        with open(token_path, 'w') as token:
            token.write(creds.to_json())

    try:
        service = build('calendar', 'v3', credentials=creds)
        return service
    except HttpError as error:
        print(f'An error occurred: {error}')
        return None

def get_free_slots(date_iso, business_start=9, business_end=18):
    """
    Returns free slots for a given day.
    date_iso: YYYY-MM-DD
    """
    service = get_calendar_service()
    if not service: return []

    # Define the time range for the search (start and end of the day in UTC/ISO)
    # Note: For production, handle timezones more carefully.
    time_min = f"{date_iso}T00:00:00Z"
    time_max = f"{date_iso}T23:59:59Z"

    events_result = service.events().list(calendarId='primary', timeMin=time_min,
                                        timeMax=time_max, singleEvents=True,
                                        orderBy='startTime').execute()
    events = events_result.get('items', [])

    # Convert events to list of (start_hour, end_hour)
    occupied_ranges = []
    for event in events:
        start_str = event['start'].get('dateTime', event['start'].get('date'))
        end_str = event['end'].get('dateTime', event['end'].get('date'))
        
        try:
            # Simple parsing for '2026-02-20T10:00:00-03:00'
            start_dt = datetime.datetime.fromisoformat(start_str.replace('Z', '+00:00'))
            end_dt = datetime.datetime.fromisoformat(end_str.replace('Z', '+00:00'))
            occupied_ranges.append((start_dt, end_dt))
        except ValueError:
            continue

    free_slots = []
    # Check every hour from business_start to business_end
    for hour in range(business_start, business_end):
        slot_start = datetime.datetime.fromisoformat(f"{date_iso}T{hour:02d}:00:00-03:00") # Assuming BRT for slots
        slot_end = slot_start + datetime.timedelta(hours=1)
        
        is_free = True
        for occ_start, occ_end in occupied_ranges:
            # Overlap check: (start1 < end2) and (end1 > start2)
            if slot_start < occ_end and slot_end > occ_start:
                is_free = False
                break
        
        if is_free:
            free_slots.append(f"{hour:02d}:00")

    return free_slots

def create_event(start_time, end_time, summary, description=""):
    service = get_calendar_service()
    if not service: return None

    event = {
      'summary': summary,
      'description': description,
      'start': {
        'dateTime': start_time, # ISO format '2023-05-28T09:00:00-07:00'
        'timeZone': 'America/Sao_Paulo',
      },
      'end': {
        'dateTime': end_time,
        'timeZone': 'America/Sao_Paulo',
      },
    }

    event = service.events().insert(calendarId='primary', body=event).execute()
    return event.get('htmlLink')

if __name__ == '__main__':
    # Test
    # print(get_free_slots('2026-02-20'))
    pass
