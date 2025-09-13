import httpx

def get_weather():
    """ Gets weather data  """
    response = httpx.get("https://ignatiusoey.app.n8n.cloud/webhook/get_weather")
    data = response.json()
    return data