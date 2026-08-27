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
  photoUrl: string | null
  status: CitizenReportStatus
  createdAt: string
}

export type AdminReportStatusFilter = CitizenReportStatus | 'all'

export type AdminReportFilters = {
  status: AdminReportStatusFilter
  topic?: string
  neighborhood?: string
}

export type AdminReportPageRequest = AdminReportFilters & {
  page: number
  pageSize: number
}

export type AdminReportPage = {
  reports: AdminCitizenReport[]
  count: number
}

export type AdminReportCounts = {
  total: number
  pending: number
  approved: number
  rejected: number
}

export type AdminChartSelection = {
  name: string
  seriesName: string
  value: unknown
}
