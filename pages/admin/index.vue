<script setup lang="ts">
import {
  Activity,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Download,
  FilterX,
  LoaderCircle,
  MapPin,
  Radio,
  RefreshCw,
  TriangleAlert,
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
  reported: 'Reportado',
  verified: 'Verificado',
  in_progress: 'En gestión',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
}
const STATUS_CLASSES: Record<CitizenReportStatus, string> = {
  reported: 'bg-amber-50 text-amber-700 ring-amber-200',
  verified: 'bg-sky-50 text-sky-700 ring-sky-200',
  in_progress: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  resolved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  dismissed: 'bg-slate-100 text-slate-600 ring-slate-200',
}

const reports = ref<AdminCitizenReport[]>([])
const loading = ref(true)
const refreshing = ref(false)
const loadError = ref('')
const selectedNeighborhood = ref(ALL)
const selectedTopic = ref(ALL)
const lastUpdated = ref<Date | null>(null)
const { fetchAdminReports, subscribeToAdminReports } = useAdminReports()
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
)))

const activeFilterCount = computed(() => Number(selectedNeighborhood.value !== ALL) + Number(selectedTopic.value !== ALL))
const pendingReports = computed(() => filteredReports.value.filter(report => !['resolved', 'dismissed'].includes(report.status)).length)
const resolvedReports = computed(() => filteredReports.value.filter(report => report.status === 'resolved').length)
const reportsLast7Days = computed(() => {
  const threshold = Date.now() - 7 * 24 * 60 * 60 * 1000
  return filteredReports.value.filter(report => new Date(report.createdAt).getTime() >= threshold).length
})
const visibleNeighborhoods = computed(() => new Set(filteredReports.value.map(neighborhoodOf)).size)
const latestReports = computed(() => filteredReports.value.slice(0, 8))

const numberFormatter = new Intl.NumberFormat('es-AR')
const dateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit' })

const topicScopedReports = computed(() => reports.value.filter(report => (
  selectedTopic.value === ALL || report.topic === selectedTopic.value
)))
const neighborhoodScopedReports = computed(() => reports.value.filter(report => (
  selectedNeighborhood.value === ALL || neighborhoodOf(report) === selectedNeighborhood.value
)))

function countBy<T>(items: T[], keyFor: (item: T) => string) {
  return items.reduce<Record<string, number>>((counts, item) => {
    const key = keyFor(item)
    counts[key] = (counts[key] ?? 0) + 1
    return counts
  }, {})
}

const neighborhoodRanking = computed(() => {
  const counts = countBy(topicScopedReports.value, neighborhoodOf)
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 12)
})

const topicDistribution = computed(() => {
  const counts = countBy(neighborhoodScopedReports.value, report => report.topic)
  return TOPICS.map(topic => ({ name: topic, value: counts[topic] ?? 0 }))
    .filter(item => item.value > 0)
})

type HeatmapTooltipParam = { value: [number, number, number] }
type HeatmapLabelParam = { value: [number, number, number] }

const matrixNeighborhoods = computed(() => {
  const counts = countBy(reports.value, neighborhoodOf)
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([name]) => name)
})

const matrixData = computed(() => {
  const cells = new Map<string, number>()
  for (const report of reports.value) {
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

const neighborhoodOption = computed<Record<string, unknown>>(() => {
  const entries = [...neighborhoodRanking.value].reverse()
  return {
    animationDuration: 500,
    aria: { enabled: true, description: 'Cantidad de reclamos por barrio.' },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: (value: number) => `${value} reclamos` },
    grid: { left: 138, right: 26, top: 8, bottom: 26 },
    xAxis: { type: 'value', minInterval: 1, axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: '#e8eef0' } }, axisLabel: { color: '#78909c' } },
    yAxis: { type: 'category', data: entries.map(([name]) => name), axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#294756', fontSize: 11, width: 120, overflow: 'truncate' } },
    series: entries.length ? [{
      name: 'Reclamos',
      type: 'bar',
      data: entries.map(([, value]) => value),
      barWidth: 14,
      label: { show: true, position: 'right', color: '#294756', fontWeight: 600 },
      itemStyle: { color: '#1c9eda', borderRadius: [0, 7, 7, 0] },
      emphasis: { itemStyle: { color: '#0877ad' } },
    }] : [],
    graphic: entries.length ? [] : [emptyGraphic('No hay datos para este filtro')],
  }
})

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
    loadError.value = error instanceof Error ? error.message : 'No se pudieron cargar las métricas.'
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(async () => {
  await loadReports()
  unsubscribe = subscribeToAdminReports((report) => {
    if (reports.value.some(current => current.id === report.id)) return
    reports.value.unshift(report)
    lastUpdated.value = new Date()
  })
})

onBeforeUnmount(() => unsubscribe?.())

function clearFilters() {
  selectedNeighborhood.value = ALL
  selectedTopic.value = ALL
}

function selectNeighborhood(selection: AdminChartSelection) {
  if (!selection.name) return
  selectedNeighborhood.value = selectedNeighborhood.value === selection.name ? ALL : selection.name
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
              <p class="ui-label text-river-light">Mesa de situación</p>
              <span class="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[10px] font-semibold text-white/65"><Radio :size="11" class="text-river-light" /> En tiempo real</span>
            </div>
            <h1 class="mt-4 text-[clamp(2.1rem,4vw,4.2rem)] font-semibold leading-[.9] tracking-[-.065em]">Lectura territorial<br><span class="text-river-light">de reclamos.</span></h1>
            <p class="mt-5 max-w-xl text-sm leading-relaxed text-white/55">Explorá dónde se concentran los reportes y qué problemas aparecen con mayor frecuencia.</p>
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

      <section class="relative z-10 mx-2 -mt-1 grid gap-3 rounded-b-2xl border border-t-0 border-ink/10 bg-white p-4 shadow-[0_12px_30px_rgba(9,34,53,.06)] sm:grid-cols-2 lg:mx-5 lg:grid-cols-[1fr_1fr_auto] lg:px-5" aria-label="Filtros del tablero">
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
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Reclamos en la vista</p><span class="grid size-8 place-items-center rounded-lg bg-river/10 text-river-ink"><CircleDot :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(filteredReports.length) }}</p>
            <p class="mt-2 text-xs text-ink/45">de {{ numberFormatter.format(reports.length) }} registros totales</p>
          </article>
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Pendientes</p><span class="grid size-8 place-items-center rounded-lg bg-amber-50 text-amber-600"><Activity :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(pendingReports) }}</p>
            <p class="mt-2 text-xs text-ink/45">requieren revisión o seguimiento</p>
          </article>
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Barrios visibles</p><span class="grid size-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><MapPin :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(visibleNeighborhoods) }}</p>
            <p class="mt-2 text-xs text-ink/45">con reclamos en esta selección</p>
          </article>
          <article class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-start justify-between"><p class="ui-label text-ink/42">Últimos 7 días</p><span class="grid size-8 place-items-center rounded-lg bg-sky-50 text-river-ink"><CheckCircle2 :size="16" /></span></div>
            <p class="mt-6 font-mono text-[2.15rem] leading-none tracking-[-.06em] text-ink">{{ numberFormatter.format(reportsLast7Days) }}</p>
            <p class="mt-2 text-xs text-ink/45">{{ resolvedReports }} resueltos en la vista</p>
          </article>
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

        <section class="mt-3 grid gap-3 xl:grid-cols-[minmax(360px,.72fr)_minmax(0,1.28fr)]">
          <article class="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div class="border-b border-ink/8 px-5 py-4"><p class="ui-label text-river-ink">Concentración</p><h2 class="mt-1.5 text-lg font-semibold tracking-[-.025em]">Reclamos por barrio</h2><p class="mt-1 text-xs text-ink/45">Tocá una barra para aislar el barrio.</p></div>
            <div class="px-2 py-3"><AdminReportChart :option="neighborhoodOption" :height="`${Math.max(310, neighborhoodRanking.length * 31 + 70)}px`" @select="selectNeighborhood" /></div>
          </article>

          <article class="overflow-hidden rounded-2xl border border-ink/10 bg-white">
            <div class="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 px-5 py-4 sm:px-6">
              <div><p class="ui-label text-river-ink">Registro reciente</p><h2 class="mt-1.5 text-lg font-semibold tracking-[-.025em]">Últimos reclamos de la vista</h2></div>
              <span class="font-mono text-xs text-ink/42">{{ latestReports.length }} / {{ filteredReports.length }}</span>
            </div>

            <div v-if="!latestReports.length" class="grid min-h-[280px] place-items-center px-6 text-center"><div><CircleDot :size="24" class="mx-auto text-ink/25" /><p class="mt-3 text-sm font-semibold">No hay reclamos para esta combinación</p><button class="mt-3 text-xs font-semibold text-river-ink" @click="clearFilters">Limpiar filtros</button></div></div>

            <div v-else class="hidden overflow-x-auto md:block">
              <table class="w-full min-w-[720px] border-collapse text-left">
                <thead><tr class="border-b border-ink/8 text-[10px] uppercase tracking-[.08em] text-ink/40"><th class="px-6 py-3 font-mono font-normal">Fecha</th><th class="px-4 py-3 font-mono font-normal">Barrio</th><th class="px-4 py-3 font-mono font-normal">Tipo</th><th class="px-4 py-3 font-mono font-normal">Estado</th></tr></thead>
                <tbody>
                  <tr v-for="report in latestReports" :key="report.id" class="border-b border-ink/6 last:border-0 hover:bg-mist/45">
                    <td class="whitespace-nowrap px-6 py-4 text-xs text-ink/48">{{ dateFormatter.format(new Date(report.createdAt)) }}</td>
                    <td class="max-w-[180px] truncate px-4 py-4 text-sm font-semibold">{{ neighborhoodOf(report) }}</td>
                    <td class="max-w-[220px] truncate px-4 py-4 text-xs text-ink/65">{{ report.topic }}</td>
                    <td class="px-4 py-4"><span class="inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[report.status]">{{ STATUS_LABELS[report.status] }}</span></td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div v-if="latestReports.length" class="divide-y divide-ink/8 md:hidden">
              <article v-for="report in latestReports" :key="report.id" class="p-5">
                <div class="flex items-start justify-between gap-3"><p class="text-sm font-semibold">{{ neighborhoodOf(report) }}</p><span class="shrink-0 text-[10px] text-ink/40">{{ dateFormatter.format(new Date(report.createdAt)) }}</span></div>
                <p class="mt-2 text-xs text-ink/60">{{ report.topic }}</p>
                <span class="mt-3 inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ring-1 ring-inset" :class="STATUS_CLASSES[report.status]">{{ STATUS_LABELS[report.status] }}</span>
              </article>
            </div>
          </article>
        </section>
      </template>
    </div>
  </div>
</template>
