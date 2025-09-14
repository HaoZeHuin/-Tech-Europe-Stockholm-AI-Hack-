import httpx

def get_daily_update():
    """ Retrieves data for a daily personal update. Data includes headlines, calendar events for today and weather data """
    response = httpx.get("https://ignatiusoey.app.n8n.cloud/webhook/92f56daa-8199-4b3b-b6f3-d968d68301d1")
    data = response.json()
    return data