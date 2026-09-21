export type MunicipalWeatherStation = {
  id: string
  name: string
  updatedAt: string
  temperature: string
  humidity: string
  pressure: string
  barometricTrend: string
  wind: string
  gust: string
  rainToday: string
  rainMonth: string
  lastRain: string
}

const MUNICIPAL_WEATHER_URL = 'https://santafeciudad.gov.ar/wp-json/clima/v1/datos'
const WEATHER_PROXY_URL = '/api/meteorologia'

type ApiRecord = Record<string, unknown>

function asRecord(value: unknown): ApiRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as ApiRecord : null
}

function text(value: unknown) {
  if (value === null || value === undefined || value === '') return '—'
  if (typeof value === 'number') return Number.isInteger(value) ? String(value) : value.toLocaleString('es-AR', { maximumFractionDigits: 2 })
  return String(value).trim() || '—'
}

function stationsFrom(response: unknown): ApiRecord[] {
  if (Array.isArray(response)) return response.map(asRecord).filter((item): item is ApiRecord => Boolean(item))
  const root = asRecord(response)
  if (!root) return []
  for (const key of ['estaciones', 'stations', 'datos', 'data', 'results']) {
    if (Array.isArray(root[key])) return root[key].map(asRecord).filter((item): item is ApiRecord => Boolean(item))
  }
  return Object.values(root).map(asRecord).filter((item): item is ApiRecord => Boolean(item))
}

function normalizeStation(station: ApiRecord, index: number): MunicipalWeatherStation {
  const wind = [text(station.velocidad_viento), text(station.direccion_viento)].filter(value => value !== '—').join(' ')
  const gust = [text(station.velocidad_viento_rafaga), text(station.direccion_viento_rafaga)].filter(value => value !== '—').join(' ')
  return {
    id: text(station.nombre) === '—' ? `station-${index}` : text(station.nombre),
    name: text(station.ubicacion),
    updatedAt: text(station.fecha_hora),
    temperature: text(station.temperatura),
    humidity: text(station.humedad),
    pressure: text(station.presion_atmosferica),
    barometricTrend: text(station.tendencia_barica),
    wind: wind || '—',
    gust: gust || '—',
    rainToday: text(station.precipitacion),
    rainMonth: text(station.precipitacion_mensual),
    lastRain: text(station.precipitacion_ultimo_evento),
  }
}

export function useMunicipalWeatherStations() {
  async function fetchStations() {
    const response = await fetch(WEATHER_PROXY_URL, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error(`La API municipal respondió ${response.status}`)
    const stations = stationsFrom(await response.json()).map(normalizeStation)
    if (!stations.length) throw new Error('La API municipal no devolvió estaciones.')
    return stations.slice(0, 6)
  }

  return { fetchStations, municipalWeatherUrl: MUNICIPAL_WEATHER_URL }
}
