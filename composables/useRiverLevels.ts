import type { RiverLevelReading, RiverLevelStatus, RiverLevelTrend } from '~/types/map'

type InaObservation = {
  valor: number
  timestart: string
  timeupdate: string
}

type InaObservationResponse = {
  data?: InaObservation[]
}

type RiverStationDefinition = Omit<
  RiverLevelReading,
  'level' | 'previousLevel' | 'observedAt' | 'updatedAt' | 'status' | 'trend' | 'isStale' | 'dataUrl' | 'error'
>

const INA_DATA_BASE_URL = 'https://alerta.ina.gob.ar/pub/datos/datos'
const CACHE_KEY = 'santa-fe-river-levels-v3'
const CACHE_DURATION_MS = 30 * 60 * 1000
const STALE_AFTER_MS = 72 * 60 * 60 * 1000
const LOOKBACK_DAYS = 45

const stations: RiverStationDefinition[] = [
  {
    id: 'parana',
    riverName: 'Río Paraná',
    stationName: 'Paraná · Túnel Subfluvial',
    mapLabel: 'Túnel',
    seriesId: 29,
    point: { latitude: -31.7182378629681, longitude: -60.5225697750899 },
    lowWaterLevel: 1.61,
    alertLevel: 4.7,
    evacuationLevel: 5,
    sourceName: 'INA · Prefectura Naval Argentina',
  },
  {
    id: 'santa-fe',
    riverName: 'Río Santa Fe',
    stationName: 'Puerto Santa Fe · Dique II',
    mapLabel: 'Puerto',
    seriesId: 30,
    point: { latitude: -31.6514772196376, longitude: -60.7002319185745 },
    lowWaterLevel: 2,
    alertLevel: 5.3,
    evacuationLevel: 5.7,
    sourceName: 'INA · Prefectura Naval Argentina',
  },
  {
    id: 'salado-santo-tome',
    riverName: 'Río Salado',
    stationName: 'Santo Tomé',
    mapLabel: 'Santo Tomé',
    seriesId: 3044,
    point: { latitude: -31.667601, longitude: -60.752233 },
    lowWaterLevel: null,
    alertLevel: 4.7,
    evacuationLevel: null,
    sourceName: 'INA · Red Hidrológica Nacional · FICH',
  },
  {
    id: 'salado-recreo',
    riverName: 'Río Salado',
    stationName: 'Recreo · RP 70',
    mapLabel: 'Recreo',
    seriesId: 103,
    point: { latitude: -31.4912222222222, longitude: -60.7805555555556 },
    lowWaterLevel: null,
    alertLevel: 4.7,
    evacuationLevel: null,
    sourceName: 'INA · Red Hidrológica Nacional',
  },
  {
    id: 'colastine-rn-168',
    riverName: 'Río Colastiné',
    stationName: 'Colastiné · RN 168',
    mapLabel: 'RN 168',
    seriesId: 8313,
    point: { latitude: -31.6611111111111, longitude: -60.6019444444444 },
    lowWaterLevel: null,
    alertLevel: null,
    evacuationLevel: null,
    sourceName: 'INA · Red Hidrológica Nacional (SAT)',
  },
]

function apiDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function normalizedTimestamp(value: string) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}-03:00`
}

function statusFor(level: number | null, station: RiverStationDefinition): RiverLevelStatus {
  if (level === null) return 'unknown'
  if (station.evacuationLevel !== null && level >= station.evacuationLevel) return 'evacuation'
  if (station.alertLevel !== null && level >= station.alertLevel) return 'alert'
  if (station.lowWaterLevel !== null && level < station.lowWaterLevel) return 'low'
  return 'normal'
}

function trendFor(level: number | null, previousLevel: number | null): RiverLevelTrend {
  if (level === null || previousLevel === null) return 'unknown'
  const difference = level - previousLevel
  if (difference > 0.02) return 'rising'
  if (difference < -0.02) return 'falling'
  return 'steady'
}

function unavailableReading(station: RiverStationDefinition, dataUrl: string, error: unknown): RiverLevelReading {
  return {
    ...station,
    level: null,
    previousLevel: null,
    observedAt: null,
    updatedAt: null,
    status: 'unknown',
    trend: 'unknown',
    isStale: true,
    dataUrl,
    error: error instanceof Error ? error.message : 'La estación no devolvió datos.',
  }
}

export function useRiverLevels() {
  async function fetchStation(station: RiverStationDefinition, start: string, end: string): Promise<RiverLevelReading> {
    const dataUrl = `${INA_DATA_BASE_URL}&timeStart=${start}&timeEnd=${end}&seriesId=${station.seriesId}&format=json`

    try {
      const response = await fetch(dataUrl, { headers: { Accept: 'application/json' } })
      if (!response.ok) throw new Error(`La estación respondió con código ${response.status}.`)

      const payload = await response.json() as InaObservationResponse
      const observations = (payload.data ?? [])
        .filter(observation => Number.isFinite(Number(observation.valor)) && observation.timestart)
        .sort((first, second) => first.timestart.localeCompare(second.timestart))
      const latest = observations.at(-1)
      if (!latest) throw new Error('No hay mediciones recientes en la serie oficial.')

      const previous = observations.at(-2)
      const level = Number(latest.valor)
      const previousLevel = previous ? Number(previous.valor) : null
      const observedAt = normalizedTimestamp(latest.timestart)
      const updatedAt = latest.timeupdate ? normalizedTimestamp(latest.timeupdate) : observedAt

      return {
        ...station,
        level,
        previousLevel,
        observedAt,
        updatedAt,
        status: statusFor(level, station),
        trend: trendFor(level, previousLevel),
        isStale: Date.now() - new Date(observedAt).getTime() > STALE_AFTER_MS,
        dataUrl,
      }
    }
    catch (error) {
      return unavailableReading(station, dataUrl, error)
    }
  }

  async function fetchRiverLevels(force = false): Promise<RiverLevelReading[]> {
    if (import.meta.client && !force) {
      const cached = sessionStorage.getItem(CACHE_KEY)
      if (cached) {
        try {
          const parsed = JSON.parse(cached) as { cachedAt: number, readings: RiverLevelReading[] }
          if (Date.now() - parsed.cachedAt < CACHE_DURATION_MS) return parsed.readings
        }
        catch {
          sessionStorage.removeItem(CACHE_KEY)
        }
      }
    }

    const endDate = new Date()
    endDate.setUTCDate(endDate.getUTCDate() + 1)
    const startDate = new Date()
    startDate.setUTCDate(startDate.getUTCDate() - LOOKBACK_DAYS)
    const start = apiDate(startDate)
    const end = apiDate(endDate)
    const readings = await Promise.all(stations.map(station => fetchStation(station, start, end)))

    if (import.meta.client) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), readings }))
    }
    return readings
  }

  return { fetchRiverLevels }
}
