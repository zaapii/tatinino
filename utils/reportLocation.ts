import type { MapPoint } from '~/types/map'

export function isReportPointInBounds(point: MapPoint) {
  return Number.isFinite(point.latitude) && Number.isFinite(point.longitude)
    && point.latitude >= -31.82 && point.latitude <= -31.45
    && point.longitude >= -60.95 && point.longitude <= -60.45
}
