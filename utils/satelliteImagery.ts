export const SATELLITE_SERVICE = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer'

export function satelliteCaptureLabel(results: Array<{ attributes?: Record<string, unknown> }>) {
  const dates = [...new Set(results.map(result => String(result.attributes?.SRC_DATE ?? '')))]
    .filter(value => {
      if (!/^\d{8}$/.test(value)) return false
      const year = Number(value.slice(0, 4)), month = Number(value.slice(4, 6)), day = Number(value.slice(6, 8))
      const date = new Date(Date.UTC(year, month - 1, day))
      return year >= 1900 && date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day
    }).sort()
  const formatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' })
  const format = (value: string) => formatter.format(new Date(Date.UTC(Number(value.slice(0, 4)), Number(value.slice(4, 6)) - 1, Number(value.slice(6, 8)))))
  if (!dates.length) return 'Fecha no disponible'
  if (dates.length > 1) return `Capturas: ${format(dates[0]!)} – ${format(dates.at(-1)!)}`
  return `Captura: ${format(dates[0]!)}`
}
