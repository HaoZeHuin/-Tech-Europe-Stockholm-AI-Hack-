import httpx

def get_availability():
    """ Gets availability data from google calendar """
    response = httpx.get("https://ignatiusoey.app.n8n.cloud/webhook/calendar_get_freetime")
    data = response.json()
    print(data)
    return data

def create_event(event_name:str, start:str, end:str):
    """ 
    Creates a new event in google calendar

    Args:
        - event_name: the name of the event to be created
        - start: the start datetime of the event in ISO format
        - end: the end datetime of the event in ISO format
    """
    data = {
        "event_name": event_name,
        "start": start,
        "end": end
    }
    response = httpx.post("https://ignatiusoey.app.n8n.cloud/webhook/create_calendar_event", json=data)
    data = response.json()
    return data

#get_availability()
#create_event("test", "2025-09-16T08:00:00", "2025-09-16T10:00:00")