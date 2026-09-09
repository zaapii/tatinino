import { citizenReportCategories } from '~/utils/citizenReportCategories'
import { isReportPointInBounds } from '~/utils/reportLocation'
import type { RealtimeChannel } from '@supabase/supabase-js'
import type { CitizenReport, CitizenReportForm, CitizenReportStatus } from '~/types/map'

type CitizenReportRow = {
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

const REPORTS_TABLE = 'citizen_reports'
const PHOTOS_BUCKET = 'citizen-report-photos'
const REPORT_COLUMNS = 'id, topic, description, neighborhood, latitude, longitude, photo_path, photo_name, status, created_at'
const PUBLIC_REPORTS_PAGE_SIZE = 1000

const imageExtensions: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('es-AR', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function rowToReport(row: CitizenReportRow, photoUrl?: string): CitizenReport {
  return {
    id: row.id,
    topic: row.topic,
    description: row.description,
    neighborhood: row.neighborhood ?? undefined,
    point: { latitude: row.latitude, longitude: row.longitude },
    createdAt: formatCreatedAt(row.created_at),
    photoName: row.photo_name ?? undefined,
    photoUrl,
    status: row.status,
  }
}

export function useCitizenReports() {
  function reportFromRow(row: CitizenReportRow) {
    const supabase = useSupabaseClient()
    const photoUrl = row.photo_path
      ? supabase.storage.from(PHOTOS_BUCKET).getPublicUrl(row.photo_path).data.publicUrl
      : undefined
    return rowToReport(row, photoUrl)
  }

  async function fetchReports() {
    const supabase = useSupabaseClient()
    const reports: CitizenReport[] = []
    let from = 0

    while (true) {
      const { data, error } = await supabase
        .from(REPORTS_TABLE)
        .select(REPORT_COLUMNS)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .order('id', { ascending: false })
        .range(from, from + PUBLIC_REPORTS_PAGE_SIZE - 1)

      if (error) throw new Error(`No se pudieron cargar los reclamos: ${error.message}`)

      const page = (data as CitizenReportRow[]).map(reportFromRow)
      reports.push(...page)
      if (page.length < PUBLIC_REPORTS_PAGE_SIZE) break
      from += PUBLIC_REPORTS_PAGE_SIZE
    }

    return reports
  }

  async function createReport(form: CitizenReportForm) {
    if (!citizenReportCategories.some(category => category.topic === form.topic)) throw new Error('Seleccioná una categoría.')
    if (!form.photoFile) throw new Error('Adjuntá una foto del reclamo.')
    if (form.description.length > 200) throw new Error('La descripción no puede superar los 200 caracteres.')
    if (!isReportPointInBounds(form.point)) throw new Error('Seleccioná una ubicación dentro del área de Santa Fe.')
    if (form.neighborhood && (form.neighborhood.length < 2 || form.neighborhood.length > 120)) throw new Error('El barrio debe tener entre 2 y 120 caracteres.')
    if ((form.contactName?.length ?? 0) > 120 || (form.contactPhone?.length ?? 0) > 40 || (form.contactEmail?.length ?? 0) > 254) throw new Error('Revisá la longitud de los datos de contacto.')
    if (form.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail)) throw new Error('Ingresá un mail válido.')
    const supabase = useSupabaseClient()
    let photoPath: string | null = null

    if (form.photoFile) {
      const extension = imageExtensions[form.photoFile.type]
      if (!extension) throw new Error('La foto debe ser JPG, PNG, WebP, HEIC o HEIF.')
      if (form.photoFile.size > 5 * 1024 * 1024) throw new Error('La foto no puede superar los 5 MB.')

      photoPath = `public/${crypto.randomUUID()}.${extension}`
      const { error: uploadError } = await supabase.storage
        .from(PHOTOS_BUCKET)
        .upload(photoPath, form.photoFile, {
          cacheControl: '3600',
          contentType: form.photoFile.type,
          upsert: false,
        })

      if (uploadError) throw new Error(`No se pudo subir la foto: ${uploadError.message}`)
    }

    const { error } = await supabase.rpc('submit_citizen_report', {
      p_topic: form.topic,
      p_description: form.description,
      p_neighborhood: form.neighborhood ?? null,
      p_latitude: form.point.latitude,
      p_longitude: form.point.longitude,
      p_photo_path: photoPath,
      p_photo_name: (form.photoName || form.photoFile.name).slice(0, 180),
      p_address: form.address ?? null,
      p_contact_name: form.contactName ?? null,
      p_contact_phone: form.contactPhone ?? null,
      p_contact_email: form.contactEmail ?? null,
    })

    if (error) throw new Error(`No se pudo guardar el reclamo: ${error.message}`)
  }

  function subscribeToReports(onChange: (report: CitizenReport) => void) {
    const supabase = useSupabaseClient()
    const channel: RealtimeChannel = supabase
      .channel('public-citizen-reports')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: REPORTS_TABLE, filter: 'status=eq.approved' },
        payload => onChange(reportFromRow(payload.new as CitizenReportRow)),
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: REPORTS_TABLE, filter: 'status=eq.approved' },
        payload => onChange(reportFromRow(payload.new as CitizenReportRow)),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }

  return { fetchReports, createReport, subscribeToReports }
}
