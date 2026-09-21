import type { RiverLevelReading, RiverLevelStatus, RiverLevelTrend } from '~/types/map'

type InaObservation = {
  valor: number
  timestart: string
  timeupdate: string
}

type InaObservationResponse = {
  data?: InaObservation[]
}

type InaStationMetadata = {
  nivel_de_alerta: number | string | null
  nivel_de_evacuacion: number | string | null
  nivel_de_aguas_bajas: number | string | null
}

type InaStationResponse = {
  data?: InaStationMetadata[]
}

type RiverStationDefinition = Omit<
  RiverLevelReading,
  'level' | 'previousLevel' | 'observedAt' | 'updatedAt' | 'status' | 'trend' | 'isStale' | 'dataUrl' | 'error' | 'lowWaterLevel' | 'alertLevel' | 'evacuationLevel' | 'thresholdsLoaded'
> & { siteCode: number }

const INA_DATA_BASE_URL = 'https://alerta.ina.gob.ar/pub/datos/datos'
const INA_STATIONS_BASE_URL = 'https://alerta.ina.gob.ar/pub/datos/estaciones'
const CACHE_KEY = 'santa-fe-river-levels-v4'
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
    siteCode: 29,
    point: { latitude: -31.7182378629681, longitude: -60.5225697750899 },
    sourceName: 'INA · Prefectura Naval Argentina',
  },
  {
    id: 'santa-fe',
    riverName: 'Río Santa Fe',
    stationName: 'Puerto Santa Fe · Dique II',
    mapLabel: 'Puerto',
    seriesId: 30,
    siteCode: 30,
    point: { latitude: -31.6514772196376, longitude: -60.7002319185745 },
    sourceName: 'INA · Prefectura Naval Argentina',
  },
  {
    id: 'salado-santo-tome',
    riverName: 'Río Salado',
    stationName: 'Santo Tomé',
    mapLabel: 'Santo Tomé',
    seriesId: 3044,
    siteCode: 1679,
    point: { latitude: -31.667601, longitude: -60.752233 },
    sourceName: 'INA · Red Hidrológica Nacional · FICH',
  },
  {
    id: 'salado-recreo',
    riverName: 'Río Salado',
    stationName: 'Recreo · RP 70',
    mapLabel: 'Recreo',
    seriesId: 103,
    siteCode: 103,
    point: { latitude: -31.4912222222222, longitude: -60.7805555555556 },
    sourceName: 'INA · Red Hidrológica Nacional',
  },
  {
    id: 'colastine-rn-168',
    riverName: 'Río Colastiné',
    stationName: 'Colastiné · RN 168',
    mapLabel: 'RN 168',
    seriesId: 8313,
    siteCode: 2673,
    point: { latitude: -31.6611111111111, longitude: -60.6019444444444 },
    sourceName: 'INA · Red Hidrológica Nacional (SAT)',
  },
]

function apiDate(date: Date) {
  return date.toISOString().slice(0, 10)
}

function normalizedTimestamp(value: string) {
  return /(?:Z|[+-]\d{2}:?\d{2})$/.test(value) ? value : `${value}-03:00`
}

function statusFor(level: number | null, station: Pick<RiverLevelReading, 'lowWaterLevel' | 'alertLevel' | 'evacuationLevel'>): RiverLevelStatus {
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
    lowWaterLevel: null,
    alertLevel: null,
    evacuationLevel: null,
    thresholdsLoaded: false,
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

function levelFromMetadata(value: number | string | null): number | null {
  if (value === null || value === undefined || value === '') return null
  const level = Number(value)
  return Number.isFinite(level) ? level : null
}

export function useRiverLevels() {
  async function fetchStation(station: RiverStationDefinition, start: string, end: string): Promise<RiverLevelReading> {
    const dataUrl = `${INA_DATA_BASE_URL}&timeStart=${start}&timeEnd=${end}&seriesId=${station.seriesId}&format=json`
    const metadataUrl = `${INA_STATIONS_BASE_URL}&siteCode=${station.siteCode}&format=json`

    try {
      const [response, metadataResponse] = await Promise.all([
        fetch(dataUrl, { headers: { Accept: 'application/json' } }),
        fetch(metadataUrl, { headers: { Accept: 'application/json' } }).catch(() => null),
      ])
      if (!response.ok) throw new Error(`La estación respondió con código ${response.status}.`)

      let metadata: InaStationMetadata | undefined
      if (metadataResponse?.ok) {
        try {
          const payload = await metadataResponse.json() as InaStationResponse
          metadata = payload.data?.[0]
        }
        catch { /* La lectura sigue disponible aunque fallen los metadatos. */ }
      }
      const thresholds = {
        lowWaterLevel: levelFromMetadata(metadata?.nivel_de_aguas_bajas ?? null),
        alertLevel: levelFromMetadata(metadata?.nivel_de_alerta ?? null),
        evacuationLevel: levelFromMetadata(metadata?.nivel_de_evacuacion ?? null),
        thresholdsLoaded: Boolean(metadata),
      }

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
        ...thresholds,
        level,
        previousLevel,
        observedAt,
        updatedAt,
        status: statusFor(level, thresholds),
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
          const hasAvailableReading = parsed.readings.some(reading => !reading.error)
          if (hasAvailableReading && Date.now() - parsed.cachedAt < CACHE_DURATION_MS) return parsed.readings
          sessionStorage.removeItem(CACHE_KEY)
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

    if (import.meta.client && readings.some(reading => !reading.error)) {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ cachedAt: Date.now(), readings }))
    }
    return readings
  }

  return { fetchRiverLevels }
}
