import type { RealtimeChannel } from '@supabase/supabase-js'
import type { AdminCitizenReport } from '~/types/admin'
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
const PAGE_SIZE = 1000

function mapAdminReport(row: AdminCitizenReportRow): AdminCitizenReport {
  return {
    id: row.id,
    topic: row.topic,
    description: row.description,
    neighborhood: row.neighborhood,
    latitude: row.latitude,
    longitude: row.longitude,
    photoPath: row.photo_path,
    photoName: row.photo_name,
    status: row.status,
    createdAt: row.created_at,
  }
}

export function useAdminReports() {
  async function fetchAdminReports() {
    const supabase = useSupabaseClient()
    const reports: AdminCitizenReport[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from('citizen_reports')
        .select(ADMIN_REPORT_COLUMNS)
        .order('created_at', { ascending: false })
        .range(from, from + PAGE_SIZE - 1)

      if (error) throw new Error(`No se pudieron cargar los reclamos: ${error.message}`)

      const page = (data as AdminCitizenReportRow[]).map(mapAdminReport)
      reports.push(...page)
      if (page.length < PAGE_SIZE) break
      from += PAGE_SIZE
    }

    return reports
  }

  function subscribeToAdminReports(onInsert: (report: AdminCitizenReport) => void) {
    const supabase = useSupabaseClient()
    const channel: RealtimeChannel = supabase
      .channel('admin-citizen-reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'citizen_reports' },
        payload => onInsert(mapAdminReport(payload.new as AdminCitizenReportRow)),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }

  return { fetchAdminReports, subscribeToAdminReports }
}
