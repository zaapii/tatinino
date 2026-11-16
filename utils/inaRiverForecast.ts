const INA_FORECAST_URL = 'https://alerta.ina.gob.ar/geoserver/public2/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=public2:tabprono_parana&outputFormat=application%2Fjson'

type InaForecastProperties = {
  estacion_id: number
  fecha_hoy: string
  fecha_pronostico: string
  altura_pronostico: number | null
  fecha_tendencia: string
  altura_tendencia: number | null
}

const stationIds: Record<number, string> = { 29: 'parana', 30: 'santa-fe' }
const dayMs = 86_400_000

function forecastPoint(date: string, level: number | null, issuedOn: string, today: string) {
  const validOn = date?.slice(0, 10)
  const days = (Date.parse(validOn) - Date.parse(issuedOn)) / dayMs
  if (level === null || !Number.isFinite(level) || !(days > 0) || validOn < today) return null
  return { validOn, days, level }
}

export async function fetchInaRiverForecast(signal: AbortSignal) {
  const response = await fetch(INA_FORECAST_URL, { signal })
  if (!response.ok) throw new Error('El INA no devolvió el pronóstico.')

  const payload = await response.json() as { features?: Array<{ properties: InaForecastProperties }> }
  const today = new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Argentina/Cordoba' }).format(new Date())
  const forecasts = (payload.features ?? []).flatMap(({ properties }) => {
    const stationId = stationIds[properties.estacion_id]
    const issuedOn = properties.fecha_hoy?.slice(0, 10)
    if (!stationId || !Number.isFinite(Date.parse(issuedOn)) || issuedOn > today) return []

    const forecast = forecastPoint(properties.fecha_pronostico, properties.altura_pronostico, issuedOn, today)
    const outlook = forecastPoint(properties.fecha_tendencia, properties.altura_tendencia, issuedOn, today)
    return forecast || outlook ? [{ stationId, issuedOn, forecast, outlook }] : []
  })

  return forecasts
}
