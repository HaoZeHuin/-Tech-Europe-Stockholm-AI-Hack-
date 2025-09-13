export type WeatherKind =
  | 'clear' | 'cloudy' | 'rain' | 'thunder' | 'snow' | 'drizzle' | 'mist';

export async function fetchWeatherViaN8N() {
  const base = import.meta.env.VITE_N8N_WEATHER_URL as string;
  if (!base) throw new Error('Missing VITE_N8N_WEATHER_URL');

  const r = await fetch(base, { headers: { Accept: 'application/json' } });
  if (!r.ok) throw new Error(`n8n weather failed: ${r.status}`);
  const j = await r.json();

  // Your n8n body (strings for main/description, number for id/temp_c; feels_like may be string)
  const main: string = j.main ?? '';
  const id: number = Number(j.id ?? 0);
  const description: string = j.description ?? '';
  const tempC: number = Number(j.temp_c ?? 0);
  const feelsLike: number = Number(j.feels_like ?? j?.main?.feels_like ?? tempC);

  return { kind: mapToKind(main, id), tempC, feelsLike, description, raw: j };
}

function mapToKind(main: string, id: number): WeatherKind {
  switch (main) {
    case 'Thunderstorm': return 'thunder';
    case 'Drizzle':      return 'drizzle';
    case 'Rain':         return 'rain';
    case 'Snow':         return 'snow';
    case 'Clear':        return 'clear';
    case 'Clouds':       return id === 801 ? 'clear' : 'cloudy'; // “few clouds” -> almost clear
    default:             return 'mist'; // Mist/Haze/Fog/Smoke…
  }
}
