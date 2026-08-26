import type { CitizenReportStatus } from '~/types/map'

export type AdminCitizenReport = {
  id: string
  topic: string
  description: string
  neighborhood: string | null
  latitude: number
  longitude: number
  photoPath: string | null
  photoName: string | null
  status: CitizenReportStatus
  createdAt: string
}

export type AdminChartSelection = {
  name: string
  seriesName: string
  value: unknown
}
