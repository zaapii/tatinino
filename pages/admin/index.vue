<script setup lang="ts">
import {
  Activity,
  Ban,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Download,
  Eye,
  FilterX,
  ImageIcon,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  TriangleAlert,
  X,
} from 'lucide-vue-next'
import type { AdminChartSelection, AdminCitizenReport } from '~/types/admin'
import type { CitizenReportStatus } from '~/types/map'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Administración de reclamos' })

const ALL = '__all__'
const WITHOUT_NEIGHBORHOOD = 'Sin barrio informado'
const TOPICS = [
  'Boca de tormenta obstruida',
  'Basura o residuos',
  'Calle anegada',
  'Canal o desagüe',
  'Defensa o terraplén',
  'Otro',
]
const TOPIC_COLORS: Record<string, string> = {
  'Boca de tormenta obstruida': '#1c9eda',
  'Basura o residuos': '#f3b85b',
  'Calle anegada': '#0877ad',
  'Canal o desagüe': '#78ccef',
  'Defensa o terraplén': '#173d52',
  'Otro': '#8da2ae',
}
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

const reports = ref<AdminCitizenReport[]>([])
const loading = ref(true)
const refreshing = ref(false)
const loadError = ref('')
const selectedNeighborhood = ref(ALL)
const selectedTopic = ref(ALL)
const selectedStatus = ref<typeof ALL | CitizenReportStatus>(ALL)
const lastUpdated = ref<Date | null>(null)
const selectedReport = ref<AdminCitizenReport | null>(null)
const moderatingId = ref('')
const actionError = ref('')
const actionNotice = ref('')
const { fetchAdminReports, moderateReport, subscribeToAdminReports } = useAdminReports()
let unsubscribe: (() => void) | undefined

const neighborhoodOf = (report: AdminCitizenReport) => report.neighborhood?.trim() || WITHOUT_NEIGHBORHOOD

const neighborhoodOptions = computed(() => [...new Set(reports.value.map(neighborhoodOf))].sort((a, b) => {
  if (a === WITHOUT_NEIGHBORHOOD) return 1
  if (b === WITHOUT_NEIGHBORHOOD) return -1
  return a.localeCompare(b, 'es')
}))

const filteredReports = computed(() => reports.value.filter(report => (
  (selectedNeighborhood.value === ALL || neighborhoodOf(report) === selectedNeighborhood.value)
  && (selectedTopic.value === ALL || report.topic === selectedTopic.value)
  && (selectedStatus.value === ALL || report.status === selectedStatus.value)
)))

const activeFilterCount = computed(() => (
  Number(selectedNeighborhood.value !== ALL)
  + Number(selectedTopic.value !== ALL)
  + Number(selectedStatus.value !== ALL)
))
const pendingReports = computed(() => reports.value.filter(report => report.status === 'pending').length)
const approvedReports = computed(() => reports.value.filter(report => report.status === 'approved').length)
const rejectedReports = computed(() => reports.value.filter(report => report.status === 'rejected').length)

const numberFormatter = new Intl.NumberFormat('es-AR')
const dateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' })

const neighborhoodScopedReports = computed(() => reports.value.filter(report => (
  selectedNeighborhood.value === ALL || neighborhoodOf(report) === selectedNeighborhood.value
)).filter(report => selectedStatus.value === ALL || report.status === selectedStatus.value))

function countBy<T>(items: T[], keyFor: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = keyFor(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

const topicDistribution = computed(() => {
  const counts = countBy(neighborhoodScopedReports.value, report => report.topic)
  return TOPICS.map(topic => ({ name: topic, value: counts[topic] ?? 0 }))
    .filter(item => item.value > 0)
})

type HeatmapTooltipParam = { value: [number, number, number] }
type HeatmapLabelParam = { value: [number, number, number] }

const matrixNeighborhoods = computed(() => {
  const scopedReports = reports.value.filter(report => selectedStatus.value === ALL || report.status === selectedStatus.value)
  const counts = countBy(scopedReports, neighborhoodOf)
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name)
})

const matrixData = computed(() => {
  const cells = new Map<string, number>()
  for (const report of reports.value.filter(report => selectedStatus.value === ALL || report.status === selectedStatus.value)) {
    const key = `${neighborhoodOf(report)}\u0000${report.topic}`
    cells.set(key, (cells.get(key) ?? 0) + 1)
  }

  return matrixNeighborhoods.value.flatMap((neighborhood, y) => TOPICS.map((topic, x) => ([
    x,
    y,
    cells.get(`${neighborhood}\u0000${topic}`) ?? 0,
  ])))
})

const matrixMaximum = computed(() => Math.max(1, ...matrixData.value.map(cell => cell[2] as number)))

const emptyGraphic = (message: string) => ({
  type: 'text',
  left: 'center',
  top: 'middle',
  style: { text: message, fill: '#78909c', font: '13px Instrument Sans' },
})

const matrixOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 500,
  aria: { enabled: true, description: 'Matriz de reclamos por barrio y por tipo.' },
  tooltip: {
    position: 'top',
    backgroundColor: '#092235',
    borderWidth: 0,
    textStyle: { color: '#fff', fontFamily: 'Instrument Sans' },
    formatter: (params: HeatmapTooltipParam) => {
      const [topicIndex, neighborhoodIndex, value] = params.value
      return `<strong>${matrixNeighborhoods.value[neighborhoodIndex]}</strong><br>${TOPICS[topicIndex]}: ${value}`
    },
  },
  grid: { left: 154, right: 18, top: 18, bottom: 98 },
  xAxis: {
    type: 'category',
    data: TOPICS,
    splitArea: { show: true },
    axisLine: { lineStyle: { color: '#d8e2e6' } },
    axisTick: { show: false },
    axisLabel: {
      interval: 0,
      rotate: 32,
      color: '#56707e',
      fontSize: 10,
      formatter: (value: string) => value.replace(' obstruida', '').replace('Defensa o ', ''),
    },
  },
  yAxis: {
    type: 'category',
    data: matrixNeighborhoods.value,
    axisLine: { show: false },
    axisTick: { show: false },
    axisLabel: { color: '#294756', fontSize: 11, width: 130, overflow: 'truncate' },
  },
  visualMap: {
    min: 0,
    max: matrixMaximum.value,
    show: false,
    inRange: { color: ['#edf4f3', '#bce7f7', '#56b8e3', '#1c9eda', '#0877ad'] },
  },
  series: matrixData.value.length ? [{
    name: 'Reclamos',
    type: 'heatmap',
    data: matrixData.value,
    label: {
      show: true,
      fontSize: 11,
      formatter: (params: HeatmapLabelParam) => {
        const value = params.value[2]
        return value > 0 && value / matrixMaximum.value >= 0.45
          ? `{onBlue|${value}}`
          : `{onLight|${value}}`
      },
      rich: {
        onBlue: { color: '#ffffff', fontWeight: 700 },
        onLight: { color: '#092235', fontWeight: 500 },
      },
    },
    itemStyle: { borderColor: '#fff', borderWidth: 3, borderRadius: 6 },
    emphasis: { itemStyle: { shadowBlur: 12, shadowColor: 'rgba(9,34,53,.18)' } },
  }] : [],
  graphic: matrixData.value.length ? [] : [emptyGraphic('Todavía no hay reclamos para comparar')],
}))

const topicOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 550,
  aria: { enabled: true, description: 'Distribución de reclamos por tipo.' },
  tooltip: { trigger: 'item', formatter: '{b}<br><strong>{c}</strong> · {d}%' },
  legend: { bottom: 0, left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#56707e', fontSize: 10 }, width: '94%' },
  color: TOPICS.map(topic => TOPIC_COLORS[topic]),
  series: topicDistribution.value.length ? [{
    name: 'Tipo de reclamo',
    type: 'pie',
    radius: ['48%', '72%'],
    center: ['50%', '42%'],
    avoidLabelOverlap: true,
    itemStyle: { borderColor: '#fff', borderWidth: 4, borderRadius: 7 },
    label: { show: false },
    emphasis: { scaleSize: 8, label: { show: true, formatter: '{c}', fontSize: 22, fontWeight: 700, color: '#092235' } },
    data: topicDistribution.value,
  }] : [],
  graphic: topicDistribution.value.length ? [] : [emptyGraphic('No hay datos para este filtro')],
}))

async function loadReports(silent = false) {
  if (silent) refreshing.value = true
  else loading.value = true
  loadError.value = ''

  try {
    reports.value = await fetchAdminReports()
    lastUpdated.value = new Date()
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : 'No se pudieron cargar los reclamos.'
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(async () => {
  await loadReports()
  unsubscribe = subscribeToAdminReports((report) => {
    const index = reports.value.findIndex(current => current.id === report.id)
    if (index === -1) reports.value.unshift(report)
    else reports.value[index] = report
    if (selectedReport.value?.id === report.id) selectedReport.value = report
    lastUpdated.value = new Date()
  })
  window.addEventListener('keydown', closeModalOnEscape)
})

onBeforeUnmount(() => {
  unsubscribe?.()
  window.removeEventListener('keydown', closeModalOnEscape)
  document.body.style.overflow = ''
})

watch(selectedReport, (report) => {
  document.body.style.overflow = report ? 'hidden' : ''
})

function clearFilters() {
  selectedNeighborhood.value = ALL
  selectedTopic.value = ALL
  selectedStatus.value = ALL
}

function selectTopic(selection: AdminChartSelection) {
  if (!selection.name) return
  selectedTopic.value = selectedTopic.value === selection.name ? ALL : selection.name
}

function selectMatrixCell(selection: AdminChartSelection) {
  if (!Array.isArray(selection.value) || selection.value.length < 2) return
  const topic = TOPICS[Number(selection.value[0])]
  const neighborhood = matrixNeighborhoods.value[Number(selection.value[1])]
  if (topic) selectedTopic.value = topic
  if (neighborhood) selectedNeighborhood.value = neighborhood
}

function closeModalOnEscape(event: KeyboardEvent) {
  if (event.key === 'Escape') selectedReport.value = null
}

function openReport(report: AdminCitizenReport) {
  actionError.value = ''
  actionNotice.value = ''
  selectedReport.value = report
}

async function setModeration(report: AdminCitizenReport, status: 'approved' | 'rejected') {
  if (moderatingId.value || report.status === status) return
  moderatingId.value = report.id
  actionError.value = ''
  actionNotice.value = ''

  try {
    const updated = await moderateReport(report.id, status)
    const index = reports.value.findIndex(current => current.id === updated.id)
    if (index !== -1) reports.value[index] = updated
    if (selectedReport.value?.id === updated.id) selectedReport.value = updated
    actionNotice.value = status === 'approved'
      ? 'Reclamo aprobado. Ya puede publicarse en el mapa.'
      : 'Reclamo rechazado. Dejó de estar visible en el mapa.'
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

function exportCsv() {
  const header = ['ID', 'Fecha', 'Barrio', 'Tipo', 'Estado', 'Descripción', 'Latitud', 'Longitud', 'Foto']
  const rows = filteredReports.value.map(report => [
    report.id,
    report.createdAt,
    neighborhoodOf(report),
    report.topic,
    STATUS_LABELS[report.status],
    report.description,
    report.latitude,
    report.longitude,
    report.photoPath ?? '',
  ])
  const csv = [header, ...rows].map(row => row.map(csvCell).join(',')).join('\r\n')
  const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `reclamos-santa-fe-${new Date().toISOString().slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
</script>

<template>
  <div class="min-h-dvh px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div class="mx-auto max-w-[1500px]">
      <header class="relative overflow-hidden rounded-[1.75rem] bg-ink px-5 py-6 text-white sm:px-7 sm:py-7 lg:px-9">
        <div class="pointer-events-none absolute inset-y-0 right-0 w-1/2 opacity-50 [background:radial-gradient(circle_at_70%_30%,rgba(28,158,218,.5),transparent_45%)]" />
        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="flex items-center gap-3">
              <p class="ui-label text-river-light">Moderación ciudadana</p>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[10px] font-semibold text-white/65"><Radio :size="11" class="text-river-light" /> En tiempo real</span>
            </div>
            <h1 class="mt-4 text-[clamp(2.1rem,4vw,4.2rem)] font-semibold leading-[.9] tracking-[-.065em]">Revisión y publicación<br><span class="text-river-light">de reclamos.</span></h1>
            <p class="mt-5 max-w-xl text-sm leading-relaxed text-white/55">Revisá el contenido y la foto de cada envío. Solo los reclamos aprobados aparecen en el mapa público.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <p v-if="lastUpdated" class="mr-1 text-[11px] text-white/42">Actualizado {{ timeFormatter.format(lastUpdated) }}</p>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-xs font-semibold text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-45" :disabled="refreshing" @click="loadReports(true)">
              <RefreshCw :size="15" :class="refreshing && 'animate-spin'" /> Actualizar
            </button>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl bg-river px-4 text-xs font-semibold text-white shadow-lg shadow-river/20 transition hover:bg-river-ink disabled:cursor-not-allowed disabled:opacity-45" :disabled="!filteredReports.length" @click="exportCsv">
              <Download :size="15" /> Exportar vista CSV
            </button>
          </div>
        </div>
      </header>

      <section class="relative z-10 mx-2 -mt-1 grid gap-3 rounded-b-2xl border border-t-0 border-ink/10 bg-white p-4 shadow-[0_12px_30px_rgba(9,34,53,.06)] sm:grid-cols-2 lg:mx-5 lg:grid-cols-[1fr_1fr_1fr_auto] lg:px-5" aria-label="Filtros del tablero">
        <label class="block">
          <span class="ui-label text-ink/45">Barrio</span>
          <span class="relative mt-1.5 block">
            <select v-model="selectedNeighborhood" class="h-11 w-full appearance-none rounded-xl border border-ink/10 bg-[#f6f9fa] px-3 pr-10 text-sm font-semibold text-ink outline-none transition focus:border-river focus:ring-4 focus:ring-river/10">
              <option :value="ALL">Todos los barrios</option>
              <option v-for="neighborhood in neighborhoodOptions" :key="neighborhood" :value="neighborhood">{{ neighborhood }}</option>
            </select>
            <ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40" />
          </span>
        </label>
        <label class="block">
          <span class="ui-label text-ink/45">Publicación</span>
          <span class="relative mt-1.5 block">
            <select v-model="selectedStatus" class="h-11 w-full appearance-none rounded-xl border border-ink/10 bg-[#f6f9fa] px-3 pr-10 text-sm font-semibold text-ink outline-none transition focus:border-river focus:ring-4 focus:ring-river/10">
              <option :value="ALL">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="approved">Aprobados</option>
              <option value="rejected">Rechazados</option>
            </select>
            <ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40" />
          </span>
        </label>
        <label class="block">
          <span class="ui-label text-ink/45">Tipo de reclamo</span>
          <span class="relative mt-1.5 block">
            <select v-model="selectedTopic" class="h-11 w-full appearance-none rounded-xl border border-ink/10 bg-[#f6f9fa] px-3 pr-10 text-sm font-semibold text-ink outline-none transition focus:border-river focus:ring-4 focus:ring-river/10">
              <option :value="ALL">Todos los tipos</option>
              <option v-for="topic in TOPICS" :key="topic" :value="topic">{{ topic }}</option>
            </select>
            <ChevronDown :size="16" class="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink/40" />
          </span>
        </label>
        <button class="mt-auto inline-flex h-11 items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold transition disabled:cursor-default disabled:text-ink/25 enabled:bg-mist enabled:text-ink enabled:hover:bg-river/10" :disabled="!activeFilterCount" @click="clearFilters">
          <FilterX :size="15" /> Limpiar {{ activeFilterCount ? `(${activeFilterCount})` : '' }}
        </button>
      </section>

      <div v-if="loading" class="mt-8 flex min-h-[360px] items-center justify-center rounded-2xl border border-ink/10 bg-white">
        <div class="text-center"><LoaderCircle :size="28" class="mx-auto animate-spin text-river" /><p class="mt-3 text-sm text-ink/55">Construyendo la lectura territorial…</p></div>
      </div>

      <div v-else-if="loadError" class="mt-8 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800">
        <div class="flex items-start gap-3"><TriangleAlert :size="20" class="mt-0.5 shrink-0" /><div><p class="font-semibold">No se pudieron cargar los datos</p><p class="mt-1 text-sm opacity-75">{{ loadError }}</p><button class="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white" @click="loadReports()">Intentar de nuevo</button></div></div>
      </div>

      <template v-else>
        <section class="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Indicadores principales">
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Reclamos totales</p><span class="grid size-8 place-items-center rounded-lg bg-river/10 text-river-ink"><CircleDot :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(reports.length) }}</p>
            <p class="mt-2 text-xs text-ink/45">{{ numberFormatter.format(filteredReports.length) }} en la vista filtrada</p>
          </article>
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Pendientes</p><span class="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600"><Activity :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(pendingReports) }}</p>
            <p class="mt-2 text-xs text-ink/45">todavía no aparecen en el mapa</p>
          </article>
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Aprobados</p><span class="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(approvedReports) }}</p>
            <p class="mt-2 text-xs text-ink/45">publicados actualmente en el mapa</p>
          </article>
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Rechazados</p><span class="grid size-8 place-items-center rounded-lg bg-red-50 text-red-600"><Ban :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(rejectedReports) }}</p>
            <p class="mt-2 text-xs text-ink/45">se pueden volver a aprobar</p>
          </article>
        </section>

        <section class="mt-3 overflow-hidden rounded-2xl border border-ink/10 bg-white" aria-labelledby="moderation-table-title">
          <div class="flex flex-col gap-4 border-b border-ink/8 px-5 py-5 sm:flex-row sm:items-end sm:justify-between sm:px-6">
            <div>
              <p class="ui-label text-river-ink">Bandeja de moderación</p>
              <h2 id="moderation-table-title" class="mt-1.5 text-xl font-semibold tracking-[-.03em]">Todos los reclamos de la vista</h2>
              <p class="mt-1 text-xs text-ink/45">Abrí “Ver” para revisar la foto y el detalle completo antes de decidir.</p>
            </div>
            <span class="shrink-0 rounded-full bg-mist px-3 py-1.5 font-mono text-xs text-ink/55">{{ filteredReports.length }} reclamos</span>
          </div>

          <div v-if="actionNotice || actionError" class="border-b border-ink/8 px-5 py-3 sm:px-6">
            <p v-if="actionNotice" role="status" class="flex items-center gap-2 text-xs font-semibold text-emerald-700"><Check :size="15" /> {{ actionNotice }}</p>
            <p v-if="actionError" role="alert" class="flex items-center gap-2 text-xs font-semibold text-red-700"><TriangleAlert :size="15" /> {{ actionError }}</p>
          </div>

          <div v-if="!filteredReports.length" class="grid min-h-[280px] place-items-center px-6 text-center">
            <div><CircleDot :size="24" class="mx-auto text-ink/25" /><p class="mt-3 text-sm font-semibold">No hay reclamos para esta combinación</p><button class="mt-3 text-xs font-semibold text-river-ink" @click="clearFilters">Limpiar filtros</button></div>
          </div>

          <div v-else class="hidden max-h-[680px] overflow-auto md:block">
            <table class="w-full min-w-[1080px] border-collapse text-left">
              <thead class="sticky top-0 z-10 bg-[#f6f9fa] shadow-[0_1px_0_rgba(9,34,53,.08)]">
                <tr class="text-[10px] uppercase tracking-[.08em] text-ink/40">
                  <th class="px-6 py-3.5 font-mono font-normal">Fecha</th>
                  <th class="px-4 py-3.5 font-mono font-normal">Reclamo</th>
                  <th class="px-4 py-3.5 font-mono font-normal">Barrio</th>
                  <th class="px-4 py-3.5 font-mono font-normal">Foto</th>
                  <th class="px-4 py-3.5 font-mono font-normal">Estado</th>
                  <th class="px-6 py-3.5 text-right font-mono font-normal">Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="report in filteredReports" :key="report.id" class="border-b border-ink/6 last:border-0 hover:bg-mist/35">
                  <td class="whitespace-nowrap px-6 py-4 align-top"><p class="text-xs text-ink/62">{{ dateFormatter.format(new Date(report.createdAt)) }}</p><p class="mt-1 font-mono text-[10px] text-ink/35">{{ timeFormatter.format(new Date(report.createdAt)) }}</p></td>
                  <td class="max-w-[310px] px-4 py-4 align-top"><p class="text-sm font-semibold">{{ report.topic }}</p><p class="mt-1 line-clamp-2 text-xs leading-relaxed text-ink/50">{{ report.description }}</p></td>
                  <td class="max-w-[180px] px-4 py-4 align-top text-xs font-semibold text-ink/70">{{ neighborhoodOf(report) }}</td>
                  <td class="px-4 py-4 align-top"><span v-if="report.photoUrl" class="inline-flex items-center gap-1.5 text-[11px] font-semibold text-river-ink"><ImageIcon :size="14" /> Adjunta</span><span v-else class="text-[11px] text-ink/32">Sin foto</span></td>
                  <td class="px-4 py-4 align-top"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[report.status]">{{ STATUS_LABELS[report.status] }}</span></td>
                  <td class="px-6 py-4 align-top">
                    <div class="flex justify-end gap-2">
                      <button v-if="report.status !== 'approved'" class="inline-flex h-9 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 text-[11px] font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-wait disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'approved')"><LoaderCircle v-if="moderatingId === report.id" :size="13" class="animate-spin" /><Check v-else :size="13" /> Aprobar</button>
                      <button v-if="report.status !== 'rejected'" class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 text-[11px] font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-wait disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'rejected')"><Ban :size="13" /> Rechazar</button>
                      <button class="inline-flex h-9 items-center gap-1.5 rounded-lg border border-ink/12 px-3 text-[11px] font-semibold text-ink transition hover:bg-mist" @click="openReport(report)"><Eye :size="13" /> Ver</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div v-if="filteredReports.length" class="divide-y divide-ink/8 md:hidden">
            <article v-for="report in filteredReports" :key="report.id" class="p-5">
              <div class="flex items-start justify-between gap-3"><div><p class="text-sm font-semibold">{{ report.topic }}</p><p class="mt-1 text-[10px] text-ink/42">{{ dateFormatter.format(new Date(report.createdAt)) }} · {{ neighborhoodOf(report) }}</p></div><span class="shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[report.status]">{{ STATUS_LABELS[report.status] }}</span></div>
              <p class="mt-3 line-clamp-2 text-xs leading-relaxed text-ink/55">{{ report.description }}</p>
              <div class="mt-4 flex gap-2">
                <button v-if="report.status !== 'approved'" class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg bg-emerald-600 px-2 text-[10px] font-semibold text-white disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'approved')"><Check :size="13" /> Aprobar</button>
                <button v-if="report.status !== 'rejected'" class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2 text-[10px] font-semibold text-red-700 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(report, 'rejected')"><Ban :size="13" /> Rechazar</button>
                <button class="inline-flex h-10 flex-1 items-center justify-center gap-1 rounded-lg border border-ink/12 px-2 text-[10px] font-semibold" @click="openReport(report)"><Eye :size="13" /> Ver</button>
              </div>
            </article>
          </div>
        </section>

        <section class="mt-3 grid gap-3 xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,.7fr)]">
          <article class="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div class="flex items-start justify-between border-b border-ink/8 px-5 py-4 sm:px-6">
              <div><p class="ui-label text-river-ink">Matriz territorial</p><h2 class="mt-1.5 text-lg font-semibold tracking-[-.025em]">Barrio × tipo de reclamo</h2><p class="mt-1 text-xs text-ink/45">Seleccioná una celda para filtrar toda la vista.</p></div>
              <span class="hidden rounded-full bg-mist px-2.5 py-1 text-[10px] font-semibold text-ink/50 sm:inline">Top 10 barrios</span>
            </div>
            <div class="overflow-x-auto px-2 py-3 sm:px-4">
              <div class="min-w-[680px]"><AdminReportChart :option="matrixOption" height="390px" @select="selectMatrixCell" /></div>
            </div>
          </article>

          <article class="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div class="border-b border-ink/8 px-5 py-4"><p class="ui-label text-river-ink">Composición</p><h2 class="mt-1.5 text-lg font-semibold tracking-[-.025em]">Tipos de reclamo</h2><p class="mt-1 text-xs text-ink/45">Tocá un segmento para filtrar.</p></div>
            <div class="px-2 py-3"><AdminReportChart :option="topicOption" height="390px" @select="selectTopic" /></div>
          </article>
        </section>

      </template>
    </div>

    <Teleport to="body">
      <Transition enter-active-class="transition duration-200 ease-out" enter-from-class="opacity-0" leave-active-class="transition duration-150 ease-in" leave-to-class="opacity-0">
        <div v-if="selectedReport" class="fixed inset-0 z-50 grid place-items-center bg-ink/72 p-3 backdrop-blur-sm sm:p-6" @click.self="selectedReport = null">
          <section role="dialog" aria-modal="true" aria-labelledby="report-dialog-title" class="flex max-h-[92dvh] w-full max-w-[1080px] flex-col overflow-hidden rounded-[1.5rem] bg-white shadow-2xl">
            <header class="flex items-start justify-between gap-4 border-b border-ink/10 px-5 py-4 sm:px-7 sm:py-5">
              <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="ui-label text-river-ink">Revisión del reclamo</p>
                  <span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[selectedReport.status]">{{ STATUS_LABELS[selectedReport.status] }}</span>
                </div>
                <h2 id="report-dialog-title" class="mt-2 text-xl font-semibold tracking-[-.035em] sm:text-2xl">{{ selectedReport.topic }}</h2>
              </div>
              <button class="grid size-10 shrink-0 place-items-center rounded-xl border border-ink/10 transition hover:bg-mist" aria-label="Cerrar detalle" @click="selectedReport = null"><X :size="19" /></button>
            </header>

            <div class="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-[minmax(0,1.18fr)_minmax(360px,.82fr)]">
              <div class="flex min-h-[300px] items-center justify-center bg-[#dfe9e8] p-4 sm:p-7 lg:min-h-[520px]">
                <a v-if="selectedReport.photoUrl" :href="selectedReport.photoUrl" target="_blank" rel="noopener noreferrer" class="group relative block max-h-full max-w-full overflow-hidden rounded-2xl bg-ink/5 shadow-[0_16px_45px_rgba(9,34,53,.16)]">
                  <img :src="selectedReport.photoUrl" :alt="`Foto adjunta al reclamo ${selectedReport.topic}`" class="max-h-[62dvh] w-auto max-w-full object-contain" />
                  <span class="absolute inset-x-3 bottom-3 rounded-xl bg-ink/82 px-3 py-2 text-center text-[10px] font-semibold text-white opacity-0 backdrop-blur transition group-hover:opacity-100">Abrir imagen original</span>
                </a>
                <div v-else class="text-center text-ink/38"><span class="mx-auto grid size-14 place-items-center rounded-2xl border border-ink/10 bg-white/65"><ImageIcon :size="25" /></span><p class="mt-3 text-sm font-semibold text-ink/55">Este reclamo no tiene foto</p></div>
              </div>

              <div class="p-5 sm:p-7">
                <p class="ui-label text-ink/40">Descripción enviada</p>
                <p class="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-ink/76">{{ selectedReport.description }}</p>

                <dl class="mt-6 divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10">
                  <div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Barrio</dt><dd class="text-right text-xs font-semibold">{{ neighborhoodOf(selectedReport) }}</dd></div>
                  <div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Fecha</dt><dd class="text-right text-xs">{{ dateFormatter.format(new Date(selectedReport.createdAt)) }} · {{ timeFormatter.format(new Date(selectedReport.createdAt)) }}</dd></div>
                  <div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Ubicación</dt><dd class="flex items-center justify-end gap-1.5 text-right font-mono text-[10px]"><MapPin :size="13" class="text-river" /> {{ selectedReport.latitude.toFixed(6) }}, {{ selectedReport.longitude.toFixed(6) }}</dd></div>
                  <div v-if="selectedReport.photoName" class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">Archivo</dt><dd class="break-all text-right font-mono text-[10px]">{{ selectedReport.photoName }}</dd></div>
                  <div class="grid grid-cols-[105px_1fr] gap-3 px-3 py-3"><dt class="ui-label text-[8px] text-ink/40">ID</dt><dd class="break-all text-right font-mono text-[9px] text-ink/55">{{ selectedReport.id }}</dd></div>
                </dl>

                <div class="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-900"><strong>Antes de publicar:</strong> comprobá que la foto corresponda al reclamo y que no incluya contenido indebido o datos personales.</div>
              </div>
            </div>

            <footer class="flex flex-col gap-3 border-t border-ink/10 bg-[#f8faf9] px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <div class="min-h-5 text-xs font-semibold"><p v-if="actionNotice" role="status" class="flex items-center gap-2 text-emerald-700"><Check :size="15" /> {{ actionNotice }}</p><p v-else-if="actionError" role="alert" class="flex items-center gap-2 text-red-700"><TriangleAlert :size="15" /> {{ actionError }}</p></div>
              <div class="flex flex-wrap justify-end gap-2">
                <button class="h-11 rounded-xl border border-ink/12 bg-white px-4 text-xs font-semibold transition hover:bg-mist" @click="selectedReport = null">Cerrar</button>
                <button v-if="selectedReport.status !== 'rejected'" class="inline-flex h-11 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 text-xs font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(selectedReport, 'rejected')"><Ban :size="15" /> Rechazar</button>
                <button v-if="selectedReport.status !== 'approved'" class="inline-flex h-11 items-center gap-2 rounded-xl bg-emerald-600 px-4 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50" :disabled="Boolean(moderatingId)" @click="setModeration(selectedReport, 'approved')"><LoaderCircle v-if="moderatingId === selectedReport.id" :size="15" class="animate-spin" /><Check v-else :size="15" /> Aprobar y publicar</button>
              </div>
            </footer>
          </section>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
