<script setup lang="ts">
import {
  Ban,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleDot,
  Download,
  Eye,
  FilterX,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  Search,
  TriangleAlert,
  X,
} from 'lucide-vue-next'
import type { AdminCitizenReport, AdminReportCounts, AdminReportStatusFilter } from '~/types/admin'
import type { CitizenReportStatus } from '~/types/map'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Administración de reclamos' })

const ALL = '__all__'
const PAGE_SIZE = 50
const WITHOUT_NEIGHBORHOOD = 'Sin barrio informado'
const TOPICS = [
  'Boca de tormenta obstruida',
  'Basura o residuos',
  'Calle anegada',
  'Canal o desagüe',
  'Defensa o terraplén',
  'Otro',
]
const STATUS_LABELS: Record<CitizenReportStatus, string> = {
  pending: 'Pendiente',
  approved: 'Aprobado',
  rejected: 'Rechazado',
}
const STATUS_CLASSES: Record<CitizenReportStatus, string> = {
  pending: 'bg-amber-50 text-amber-700 ring-amber-200',
  approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  rejected: 'bg-red-50 text-red-700 ring-red-200',
}
const STATUS_TABS: Array<{ value: AdminReportStatusFilter, label: string, description: string }> = [
  { value: 'pending', label: 'Pendientes', description: 'Esperan revisión' },
  { value: 'approved', label: 'Aprobados', description: 'Visibles en el mapa' },
  { value: 'rejected', label: 'Rechazados', description: 'Ocultos del mapa' },
  { value: 'all', label: 'Todos', description: 'Historial completo' },
]

const reports = ref<AdminCitizenReport[]>([])
const counts = ref<AdminReportCounts>({ total: 0, pending: 0, approved: 0, rejected: 0 })
const totalReports = ref(0)
const page = ref(1)
const loading = ref(true)
const refreshing = ref(false)
const exporting = ref(false)
const loadError = ref('')
const selectedTopic = ref(ALL)
const selectedStatus = ref<AdminReportStatusFilter>('pending')
const neighborhoodQuery = ref('')
const lastUpdated = ref<Date | null>(null)
const selectedReport = ref<AdminCitizenReport | null>(null)
const moderatingId = ref('')
const actionError = ref('')
const actionNotice = ref('')
const moderationTable = ref<HTMLElement | null>(null)
const {
  fetchAdminReportCounts,
  fetchAdminReportsForExport,
  fetchAdminReportsPage,
  moderateReport,
  subscribeToAdminReports,
} = useAdminReports()
let unsubscribe: (() => void) | undefined
let latestRequest = 0

const numberFormatter = new Intl.NumberFormat('es-AR')
const dateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' })
const neighborhoodOf = (report: AdminCitizenReport) => report.neighborhood?.trim() || WITHOUT_NEIGHBORHOOD
const activeFilterCount = computed(() => Number(selectedTopic.value !== ALL) + Number(Boolean(neighborhoodQuery.value.trim())))
const pageCount = computed(() => Math.max(1, Math.ceil(totalReports.value / PAGE_SIZE)))
const firstVisibleReport = computed(() => totalReports.value ? (page.value - 1) * PAGE_SIZE + 1 : 0)
const lastVisibleReport = computed(() => Math.min(page.value * PAGE_SIZE, totalReports.value))
const currentStatusLabel = computed(() => STATUS_TABS.find(tab => tab.value === selectedStatus.value)?.label.toLowerCase() ?? 'reclamos')
const visiblePages = computed(() => {
  const maximum = pageCount.value
  const start = Math.max(1, Math.min(page.value - 2, maximum - 4))
  const end = Math.min(maximum, start + 4)
  return Array.from({ length: end - start + 1 }, (_, index) => start + index)
})

function statusCount(status: AdminReportStatusFilter) {
  return status === 'all' ? counts.value.total : counts.value[status]
}

function currentFilters() {
  return {
    status: selectedStatus.value,
    topic: selectedTopic.value === ALL ? undefined : selectedTopic.value,
    neighborhood: neighborhoodQuery.value.trim() || undefined,
  }
}

async function loadReports(silent = false) {
  const requestId = ++latestRequest
  if (silent) refreshing.value = true
  else loading.value = true
  loadError.value = ''

  try {
    const [result, nextCounts] = await Promise.all([
      fetchAdminReportsPage({ ...currentFilters(), page: page.value, pageSize: PAGE_SIZE }),
      fetchAdminReportCounts(),
    ])
    if (requestId !== latestRequest) return
    reports.value = result.reports
    totalReports.value = result.count
    counts.value = nextCounts
    lastUpdated.value = new Date()
  }
  catch (error) {
    if (requestId !== latestRequest) return
    loadError.value = error instanceof Error ? error.message : 'No se pudieron cargar los reclamos.'
  }
  finally {
    if (requestId === latestRequest) {
      loading.value = false
      refreshing.value = false
    }
  }
}

const reloadForFilters = useDebounceFn(() => {
  page.value = 1
  void loadReports(true)
}, 300)
const reloadForRealtime = useDebounceFn(() => void loadReports(true), 500)

watch([selectedStatus, selectedTopic, neighborhoodQuery], reloadForFilters)

onMounted(async () => {
  await loadReports()
  unsubscribe = subscribeToAdminReports(reloadForRealtime)
  window.addEventListener('keydown', closeModalOnEscape)
})

onBeforeUnmount(() => {
  unsubscribe?.()
  reloadForFilters.cancel()
  reloadForRealtime.cancel()
  window.removeEventListener('keydown', closeModalOnEscape)
  document.body.style.overflow = ''
})

watch(selectedReport, report => document.body.style.overflow = report ? 'hidden' : '')

function clearFilters() {
  selectedTopic.value = ALL
  neighborhoodQuery.value = ''
}

function closeModalOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') selectedReport.value = null
}

function openReport(report: AdminCitizenReport) {
  actionError.value = ''
  actionNotice.value = ''
  selectedReport.value = report
}

async function goToPage(nextPage: number) {
  if (nextPage < 1 || nextPage > pageCount.value || nextPage === page.value || refreshing.value) return
  page.value = nextPage
  await loadReports(true)
  moderationTable.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

async function reloadAfterModeration() {
  await loadReports(true)
  if (!reports.value.length && totalReports.value > 0 && page.value > 1) {
    page.value -= 1
    await loadReports(true)
  }
}

async function setModeration(report: AdminCitizenReport, status: 'approved' | 'rejected') {
  if (moderatingId.value || report.status === status) return
  moderatingId.value = report.id
  actionError.value = ''
  actionNotice.value = ''

  try {
    const updated = await moderateReport(report.id, status)
    if (selectedReport.value?.id === updated.id) selectedReport.value = updated
    actionNotice.value = status === 'approved'
      ? 'Reclamo aprobado. Ya puede publicarse en el mapa.'
      : 'Reclamo rechazado. Dejó de estar visible en el mapa.'
    await reloadAfterModeration()
  }
  catch (error) {
    actionError.value = error instanceof Error ? error.message : 'No se pudo cambiar el estado del reclamo.'
  }
  finally {
    moderatingId.value = ''
  }
}

function csvCell(value: unknown) {
  const text = String(value ?? '')
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text
  return `"${safeText.replace(/"/g, '""')}"`
}

async function exportCsv() {
  if (exporting.value || totalReports.value === 0) return
  exporting.value = true
  actionError.value = ''
  try {
    const exportReports = await fetchAdminReportsForExport(currentFilters())
    const header = ['ID', 'Fecha', 'Barrio', 'Tipo', 'Estado', 'Descripción', 'Latitud', 'Longitud', 'Foto']
    const rows = exportReports.map(report => [
      report.id, report.createdAt, neighborhoodOf(report), report.topic,
      STATUS_LABELS[report.status], report.description, report.latitude,
      report.longitude, report.photoPath ?? '',
    ])
    const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `reclamos-santa-fe-${selectedStatus.value}-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }
  catch (error) {
    actionError.value = error instanceof Error ? error.message : 'No se pudo generar el archivo CSV.'
  }
  finally {
    exporting.value = false
  }
}
</script>

<template>
  <div class="min-h-dvh px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div class="mx-auto max-w-[1500px]">
      <header class="relative overflow-hidden rounded-[1.75rem] bg-ink px-5 py-6 text-white sm:px-7 sm:py-7 lg:px-9">
        <div class="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50 [background:radial-gradient(circle_at_70%_30%,rgba(28,158,218,.5),transparent_45%)]" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="flex items-center gap-3"><p class="ui-label text-river-light">Moderación ciudadana</p><span class="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[10px] font-semibold text-white/65"><Radio :size="11" class="text-river-light" /> En tiempo real</span></div>
            <h1 class="mt-4 text-[clamp(2.1rem,4vw,4.2rem)] font-semibold leading-[.9] tracking-[-.065em]">Revisión y publicación<br><span class="text-river-light">de reclamos.</span></h1>
            <p class="mt-5 max-w-xl text-sm leading-relaxed text-white/55">La bandeja abre con los pendientes y carga solo 50 reclamos por página. El mapa público continúa mostrando todos los aprobados.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <p v-if="lastUpdated" class="mr-1 text-[11px] text-white/42">Actualizado {{ timeFormatter.format(lastUpdated) }}</p>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-xs font-semibold text-white transition hover:bg-white/14 disabled:opacity-45" :disabled="refreshing" @click="loadReports(true)"><RefreshCw :size="15" :class="refreshing && 'animate-spin'" /> Actualizar</button>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl bg-river px-4 text-xs font-semibold text-white shadow-lg shadow-river/20 transition hover:bg-river-ink disabled:opacity-45" :disabled="!totalReports || exporting" @click="exportCsv"><LoaderCircle v-if="exporting" :size="15" class="animate-spin" /><Download v-else :size="15" /> {{ exporting ? 'Preparando…' : 'Exportar resultados' }}</button>
          </div>
        </div>
      </header>

      <section class="relative z-10 mx-2 -mt-1 rounded-b-2xl border border-t-0 border-ink/10 bg-white p-4 shadow-[0_12px_30px_rgba(9,34,53,.06)] lg:mx-5 lg:px-5" aria-label="Bandejas y filtros">
        <div class="grid gap-2 sm:grid-cols-2 xl:grid-cols-4" role="tablist" aria-label="Estado de publicación">
          <button v-for="tab in STATUS_TABS" :key="tab.value" role="tab" :aria-selected="selectedStatus === tab.value" class="flex items-center justify-between rounded-xl border px-4 py-3 text-left transition" :class="selectedStatus === tab.value ? 'border-river bg-river/8 shadow-[0_0_0_3px_rgba(28,158,218,.09)]' : 'border-ink/8 bg-[#f8faf9] hover:border-river/35 hover:bg-river/5'" @click="selectedStatus = tab.value">
            <span><span class="block text-sm font-semibold text-ink">{{ tab.label }}</span><span class="mt-0.5 block text-[10px] text-ink/42">{{ tab.description }}</span></span>
            <span class="rounded-full px-2.5 py-1 font-mono text-xs" :class="selectedStatus === tab.value ? 'bg-river text-white' : 'bg-white text-ink/55 ring-1 ring-ink/8'">{{ numberFormatter.format(statusCount(tab.value)) }}</span>
          </button>
        </div>
        <div class="mt-4 grid gap-3 border-t border-ink/8 pt-4 sm:grid-cols-2 lg:grid-cols-[minmax(240px,1fr)_minmax(240px,1fr)_auto]">
          <label><span class="ui-label text-ink/45">Barrio</span><span class="relative mt-1.5 block"><Search :size="15" class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" /><input v-model="neighborhoodQuery" type="search" placeholder="Buscar por nombre de barrio" class="h-11 w-full rounded-xl border border-ink/10 bg-[#f6f9fa] pl-9 pr-3 text-sm font-semibold text-ink outline-none transition placeholder:font-normal placeholder:text-ink/32 focus:border-river focus:ring-4 focus:ring-river/10" /></span></label>
          <label><span class="ui-label text-ink/45">Tipo de reclamo</span><span class="relative mt-1.5 block"><select v-model="selectedTopic" class="h-11 w-full appearance-none rounded-xl border border-ink/10 bg-[#f6f9fa] px-3 pr-10 text-sm font-semibold text-ink outline-none transition focus:border-river focus:ring-4 focus:ring-river/10"><option :value="ALL">Todos los tipos</option><option v-for="topic in TOPICS" :key="topic" :value="topic">{{ topic }}</option></select><ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40" /></span></label>
          <button class="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition disabled:text-ink/25 enabled:bg-mist enabled:hover:bg-river/10" :disabled="!activeFilterCount" @click="clearFilters"><FilterX :size="15" /> Limpiar {{ activeFilterCount ? `(${activeFilterCount})` : '' }}</button>
        </div>
      </section>

      <div v-if="loading" class="mt-8 flex min-h-[360px] items-center justify-center rounded-2xl border border-ink/10 bg-white"><div class="text-center"><LoaderCircle :size="28" class="mx-auto animate-spin text-river" /><p class="mt-3 text-sm text-ink/55">Cargando la bandeja de moderación…</p></div></div>
      <div v-else-if="loadError" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><div class="flex items-start gap-3"><TriangleAlert :size="20" class="mt-0.5 shrink-0" /><div><p class="font-semibold">No se pudieron cargar los datos</p><p class="mt-1 text-sm opacity-75">{{ loadError }}</p><button class="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white" @click="loadReports()">Intentar de nuevo</button></div></div></div>

      <section v-else ref="moderationTable" class="mt-6 scroll-mt-5 overflow-hidden rounded-2xl border border-ink/10 bg-white" aria-labelledby="moderation-table-title">
        <div class="flex flex-col gap-4 border-b border-ink/8 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
          <div><p class="ui-label text-river-ink">Bandeja de moderación</p><h2 id="moderation-table-title" class="mt-1.5 text-xl font-semibold tracking-[-.03em]">Reclamos {{ currentStatusLabel }}</h2><p class="mt-1 text-xs text-ink/45">Se solicitan hasta {{ PAGE_SIZE }} filas por página. Abrí “Ver” para revisar la foto y el detalle completo.</p></div>
          <div class="flex items-center gap-2"><LoaderCircle v-if="refreshing" :size="14" class="animate-spin text-river" /><span class="rounded-full bg-mist px-3 py-1.5 font-mono text-xs text-ink/55">{{ numberFormatter.format(totalReports) }} resultados</span></div>
        </div>
        <div v-if="actionNotice || actionError" class="border-b border-ink/8 px-5 py-3 sm:px-6"><p v-if="actionNotice" role="status" class="flex items-center gap-2 text-xs font-semibold text-emerald-700"><Check :size="15" /> {{ actionNotice }}</p><p v-if="actionError" role="alert" class="flex items-center gap-2 text-xs font-semibold text-red-700"><TriangleAlert :size="15" /> {{ actionError }}</p></div>
        <div v-if="!reports.length" class="grid min-h-[300px] place-items-center px-6 text-center"><div><CircleDot :size="24" class="mx-auto text-ink/25" /><p class="mt-3 text-sm font-semibold">No hay reclamos para esta combinación</p><p class="mt-1 text-xs text-ink/42">Probá otra bandeja o quitá los filtros.</p><button v-if="activeFilterCount" class="mt-3 text-xs font-semibold text-river-ink" @click="clearFilters">Limpiar filtros</button></div></div>

        <div v-else class="hidden overflow-x-auto transition md:block" :class="refreshing && 'opacity-60'">
          <table class="w-full min-w-[1080px] border-collapse text-left">
            <thead class="bg-[#f6f9fa] shadow-[0_1px_0_rgba(9,34,53,.08)]"><tr class="text-[10px] uppercase tracking-[.08em] text-ink/40"><th class="px-6 py-3.5 font-mono font-normal">Fecha</th><th class="px-4 py-3.5 font-mono font-normal">Reclamo</th><th class="px-4 py-3.5 font-mono font-normal">Barrio</th><th class="px-4 py-3.5 font-mono font-normal">Foto</th><th class="px-4 py-3.5 font-mono font-normal">Estado</th><th class="px-6 py-3.5 text-right font-mono font-normal">Acciones</th></tr></thead>
            <tbody>
              <tr v-for="report in reports" :key="report.id" class="border-b border-ink/6 last:border-0 hover:bg-mist/35">
                <td class="whitespace-nowrap px-6 py-4 align-top"><p class="text-xs text-ink/62">{{ dateFormatter.format(new Date(report.createdAt)) }}</p><p class="mt-1 font-mono text-[10px] text-ink/35">{{ timeFormatter.format(new Date(report.createdAt)) }}</p></td>
                <td class="max-w-[310px] px-4 py-4 align-top"><p class="text-sm font-semibold">{{ report.topic }}</p><p class="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/50">{{ report.description }}</p></td>
                <td class="max-w-[180px] px-4 py-4 align-top text-xs font-semibold text-ink/70">{{ neighborhoodOf(report) }}</td>
                <td class="px-4 py-4 align-top"><span v-if="report.photoUrl" class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-river-ink"><ImageIcon :size="14" /> Adjunta</span><span v-else class="text-[11px] text-ink/32">Sin foto</span></td>
                <td class="px-4 py-4 align-top"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[report.status]">{{ STATUS_LABELS[report.status] }}</span></td>
                <td class="px-6 py-4 align-top"><div class="flex justify-end gap-2"><button v-if="report.status !== 'approved'" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'approved')"><LoaderCircle v-if="moderatingId === report.id" :size="13" class="animate-spin" /><Check v-else :size="13" /> Aprobar</button><button v-if="report.status !== 'rejected'" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'rejected')"><Ban :size="13" /> Rechazar</button><button class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/12 px-3 text-[11px] font-semibold hover:bg-mist" @click="openReport(report)"><Eye :size="13" /> Ver</button></div></td>
              </tr>
            </tbody>
          </table>
        </div>

        <div v-if="reports.length" class="divide-y divide-ink/8 transition md:hidden" :class="refreshing && 'opacity-60'">
          <article v-for="report in reports" :key="report.id" class="p-5"><div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ report.topic }}</p><p class="mt-1 text-[10px] text-ink/42">{{ dateFormatter.format(new Date(report.createdAt)) }} · {{ neighborhoodOf(report) }}</p></div><span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[report.status]">{{ STATUS_LABELS[report.status] }}</span></div><p class="mt-3 line-clamp-2 text-xs leading-relaxed text-ink/55">{{ report.description }}</p><div class="mt-4 flex gap-2"><button v-if="report.status !== 'approved'" class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 text-[10px] font-semibold text-white disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'approved')"><Check :size="13" /> Aprobar</button><button v-if="report.status !== 'rejected'" class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-[10px] font-semibold text-red-700 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'rejected')"><Ban :size="13" /> Rechazar</button><button class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-ink/12 px-2 text-[10px] font-semibold" @click="openReport(report)"><Eye :size="13" /> Ver</button></div></article>
        </div>

        <footer v-if="totalReports" class="flex flex-col gap-3 border-t border-ink/8 bg-[#f8faf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"><p class="text-xs text-ink/48">Mostrando <strong class="text-ink/70">{{ firstVisibleReport }}–{{ lastVisibleReport }}</strong> de <strong class="text-ink/70">{{ numberFormatter.format(totalReports) }}</strong></p><nav class="flex items-center gap-1" aria-label="Paginación de reclamos"><button class="grid size-9 place-items-center rounded-lg border border-ink/10 bg-white disabled:opacity-30" :disabled="page === 1 || refreshing" aria-label="Página anterior" @click="goToPage(page - 1)"><ChevronLeft :size="16" /></button><button v-for="pageNumber in visiblePages" :key="pageNumber" class="grid size-9 place-items-center rounded-lg text-xs font-semibold" :class="pageNumber === page ? 'bg-ink text-white' : 'border border-ink/10 bg-white hover:bg-mist'" :aria-current="pageNumber === page ? 'page' : undefined" :disabled="refreshing" @click="goToPage(pageNumber)">{{ pageNumber }}</button><button class="grid size-9 place-items-center rounded-lg border border-ink/10 bg-white disabled:opacity-30" :disabled="page === pageCount || refreshing" aria-label="Página siguiente" @click="goToPage(page + 1)"><ChevronRight :size="16" /></button></nav></footer>
      </section>
    </div>

    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
        <div v-if="selectedReport" class="fixed inset-0 z-50 grid place-items-center bg-ink/72 p-3 backdrop-blur-sm sm:p-6" @click.self="selectedReport = null">
          <section role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" class="flex max-h-[92dvh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
            <header class="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-7 sm:py-5"><div class="min-w-0"><div class="flex flex-wrap items-center gap-2"><p class="ui-label text-river-ink">Revisión del reclamo</p><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[selectedReport.status]">{{ STATUS_LABELS[selectedReport.status] }}</span></div><h2 id="report-dialog-title" class="mt-2 text-xl font-semibold tracking-[-.035em] sm:text-2xl">{{ selectedReport.topic }}</h2></div><button class="grid size-10 shrink-0 place-items-center rounded-xl border border-ink/10 hover:bg-mist" aria-label="Cerrar detalle" @click="selectedReport = null"><X :size="19" /></button></header>
            <div class="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
              <div class="flex min-h-[260px] items-center justify-center bg-[#dfe9e8] p-4 sm:min-h-[300px] sm:p-7 lg:min-h-[520px]"><a v-if="selectedReport.photoUrl" :href="selectedReport.photoUrl" target="_blank" rel="noopener noreferrer" class="group relative block max-h-full max-w-full overflow-hidden rounded-2xl bg-ink/5 shadow-[0_16px_45px_rgba(9,34,53,.16)]"><img :src="selectedReport.photoUrl" :alt="`Foto adjunta al reclamo ${selectedReport.topic}`" class="max-h-[55dvh] w-auto max-w-full object-contain lg:max-h-[62dvh]" /><span class="absolute inset-x-3 bottom-3 rounded-xl bg-ink/82 px-3 py-2 text-center text-[10px] font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">Abrir imagen original</span></a><div v-else class="text-center text-ink/38"><span class="mx-auto grid size-14 place-items-center rounded-2xl border border-ink/10 bg-white/65"><ImageIcon :size="25" /></span><p class="mt-3 text-sm font-semibold text-ink/55">Este reclamo no tiene foto</p></div></div>
              <div class="p-5 sm:p-7"><p class="ui-label text-ink/40">Descripción enviada</p><p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/76">{{ selectedReport.description }}</p><dl class="mt-6 divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10"><div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Barrio</dt><dd class="text-right text-xs font-semibold">{{ neighborhoodOf(selectedReport) }}</dd></div><div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Fecha</dt><dd class="text-right text-xs">{{ dateFormatter.format(new Date(selectedReport.createdAt)) }} · {{ timeFormatter.format(new Date(selectedReport.createdAt)) }}</dd></div><div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Ubicación</dt><dd class="flex items-center justify-end gap-1.5 text-right font-mono text-[10px]"><MapPin :size="13" class="text-river" /> {{ selectedReport.latitude.toFixed(6) }}, {{ selectedReport.longitude.toFixed(6) }}</dd></div><div v-if="selectedReport.photoName" class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Archivo</dt><dd class="break-all text-right font-mono text-[10px]">{{ selectedReport.photoName }}</dd></div><div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">ID</dt><dd class="break-all text-right font-mono text-[9px] text-ink/55">{{ selectedReport.id }}</dd></div></dl><div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900"><strong>Antes de publicar:</strong> comprobá que la foto corresponda al reclamo y que no incluya contenido indebido o datos personales.</div></div>
            </div>
            <footer class="flex shrink-0 flex-col gap-3 border-t border-ink/10 bg-[#f8faf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7"><div class="min-h-5 text-xs font-semibold"><p v-if="actionNotice" role="status" class="flex items-center gap-2 text-emerald-700"><Check :size="15" /> {{ actionNotice }}</p><p v-else-if="actionError" role="alert" class="flex items-center gap-2 text-red-700"><TriangleAlert :size="15" /> {{ actionError }}</p></div><div class="flex flex-wrap justify-end gap-2"><button class="h-11 rounded-xl border border-ink/12 bg-white px-4 text-xs font-semibold hover:bg-mist" @click="selectedReport = null">Cerrar</button><button v-if="selectedReport.status !== 'rejected'" class="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700 hover:bg-red-100 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(selectedReport, 'rejected')"><Ban :size="15" /> Rechazar</button><button v-if="selectedReport.status !== 'approved'" class="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(selectedReport, 'approved')"><LoaderCircle v-if="moderatingId === selectedReport.id" :size="15" class="animate-spin" /><Check v-else :size="15" /> Aprobar y publicar</button></div></footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
