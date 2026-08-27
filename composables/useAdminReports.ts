import type { RealtimeChannel } from '@supabase/supabase-js'
import type {
  AdminCitizenReport,
  AdminReportCounts,
  AdminReportFilters,
  AdminReportPage,
  AdminReportPageRequest,
} from '~/types/admin'
import type { CitizenReportStatus } from '~/types/map'

type AdminCitizenReportRow = {
  id: string
  topic: string
  description: string
  neighborhood: string | null
  latitude: number
  longitude: number
  photo_path: string | null
  photo_name: string | null
  status: CitizenReportStatus
  created_at: string
}

const ADMIN_REPORT_COLUMNS = 'id, topic, description, neighborhood, latitude, longitude, photo_path, photo_name, status, created_at'
const EXPORT_PAGE_SIZE = 1000
const PHOTOS_BUCKET = 'citizen-report-photos'

function mapAdminReport(row: AdminCitizenReportRow): AdminCitizenReport {
  const supabase = useSupabaseClient()
  return {
    id: row.id,
    topic: row.topic,
    description: row.description,
    neighborhood: row.neighborhood,
    latitude: row.latitude,
    longitude: row.longitude,
    photoPath: row.photo_path,
    photoName: row.photo_name,
    photoUrl: row.photo_path
      ? supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(row.photo_path).data.publicUrl
      : null,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function useAdminReports() {
  async function fetchAdminReportsPage(request: AdminReportPageRequest): Promise<AdminReportPage> {
    const supabase = useSupabaseClient()
    const from = (request.page - 1) * request.pageSize
    const to = from + request.pageSize - 1
    let query = supabase
      .from('citizen_reports')
      .select(ADMIN_REPORT_COLUMNS, { count: 'exact' })
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })
      .range(from, to)

    if (request.status !== 'all') query = query.eq('status', request.status)
    if (request.topic) query = query.eq('topic', request.topic)
    if (request.neighborhood?.trim()) query = query.ilike('neighborhood', `%${request.neighborhood.trim()}%`)

    const { data, count, error } = await query
    if (error) throw new Error(`No se pudieron cargar los reclamos: ${error.message}`)

    return {
      reports: (data as AdminCitizenReportRow[]).map(mapAdminReport),
      count: count ?? 0,
    }
  }

  async function fetchAdminReportCounts(): Promise<AdminReportCounts> {
    const supabase = useSupabaseClient()
    const countStatus = async (status?: CitizenReportStatus) => {
      let query = supabase.from('citizen_reports').select('id', { count: 'exact', head: true })
      if (status) query = query.eq('status', status)
      const { count, error } = await query
      if (error) throw new Error(`No se pudieron cargar los indicadores: ${error.message}`)
      return count ?? 0
    }

    const [total, pending, approved, rejected] = await Promise.all([
      countStatus(),
      countStatus('pending'),
      countStatus('approved'),
      countStatus('rejected'),
    ])

    return { total, pending, approved, rejected }
  }

  async function fetchAdminReportsForExport(filters: AdminReportFilters) {
    const supabase = useSupabaseClient()
    const reports: AdminCitizenReport[] = []
    let from = 0

    while (true) {
      let query = supabase
        .from('citizen_reports')
        .select(ADMIN_REPORT_COLUMNS)
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + EXPORT_PAGE_SIZE - 1)

      if (filters.status !== 'all') query = query.eq('status', filters.status)
      if (filters.topic) query = query.eq('topic', filters.topic)
      if (filters.neighborhood?.trim()) query = query.ilike('neighborhood', `%${filters.neighborhood.trim()}%`)

      const { data, error } = await query

      if (error) throw new Error(`No se pudieron exportar los reclamos: ${error.message}`)

      const page = (data as AdminCitizenReportRow[]).map(mapAdminReport)
      reports.push(...page)
      if (page.length < EXPORT_PAGE_SIZE) break
      from += EXPORT_PAGE_SIZE
    }

    return reports
  }

  function subscribeToAdminReports(onChange: () => void) {
    const supabase = useSupabaseClient()
    const channel: RealtimeChannel = supabase
      .channel('admin-citizen-reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citizen_reports' },
        onChange,
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'citizen_reports' },
        onChange,
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }

  async function moderateReport(id: string, status: Extract<CitizenReportStatus, 'approved' | 'rejected'>) {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase
      .from('citizen_reports')
      .update({ status })
      .eq('id', id)
      .select(ADMIN_REPORT_COLUMNS)
      .single()

    if (error) throw new Error(`No se pudo actualizar el reclamo: ${error.message}`)
    return mapAdminReport(data as AdminCitizenReportRow)
  }

  return {
    fetchAdminReportCounts,
    fetchAdminReportsForExport,
    fetchAdminReportsPage,
    moderateReport,
    subscribeToAdminReports,
  }
}
