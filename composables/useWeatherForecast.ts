export type ForecastDay = {
  date: string
  weatherCode: number
  temperatureMax: number
  temperatureMin: number
  precipitationProbability: number
  precipitation: number
}

export type WeatherForecast = {
  temperature: number
  apparentTemperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  observedAt: string
  days: ForecastDay[]
}

type OpenMeteoResponse = {
  current: {
    time: string
    temperature_2m: number
    apparent_temperature: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
  }
  daily: {
    time: string[]
    weather_code: number[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    precipitation_probability_max: number[]
    precipitation_sum: number[]
  }
}

const WEATHER_URL = 'https://api.open-meteo.com/v1/forecast'

export function useWeatherForecast() {
  async function fetchForecast(): Promise<WeatherForecast> {
    const url = new URL(WEATHER_URL)
    const query = {
        latitude: -31.6333,
        longitude: -60.7,
        current: 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code',
        daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum',
        timezone: 'America/Argentina/Cordoba',
        forecast_days: 6,
    }
    Object.entries(query).forEach(([key, value]) => url.searchParams.set(key, String(value)))
    const result = await fetch(url)
    if (!result.ok) throw new Error(`El servicio meteorológico respondió con código ${result.status}.`)
    const response = await result.json() as OpenMeteoResponse

    return {
      temperature: response.current.temperature_2m,
      apparentTemperature: response.current.apparent_temperature,
      humidity: response.current.relative_humidity_2m,
      windSpeed: response.current.wind_speed_10m,
      weatherCode: response.current.weather_code,
      observedAt: response.current.time,
      days: response.daily.time.map((date, index) => ({
        date,
        weatherCode: response.daily.weather_code[index] ?? 0,
        temperatureMax: response.daily.temperature_2m_max[index] ?? 0,
        temperatureMin: response.daily.temperature_2m_min[index] ?? 0,
        precipitationProbability: response.daily.precipitation_probability_max[index] ?? 0,
        precipitation: response.daily.precipitation_sum[index] ?? 0,
      })),
    }
  }

  return { fetchForecast }
}
