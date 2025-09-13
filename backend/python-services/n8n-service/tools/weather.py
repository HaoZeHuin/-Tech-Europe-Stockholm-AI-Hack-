import httpx

def get_weather():
    response = httpx.get("https://ignatiusoey.app.n8n.cloud/webhook/get_weather")
    data = response.json()
    return data

#get_availability()
#create_event("test", "2025-09-16T08:00:00", "2025-09-16T10:00:00")