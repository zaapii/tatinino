<script setup lang="ts">
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Clock3,
  Database,
  Layers3,
  LoaderCircle,
  MapPinned,
  RefreshCw,
  ScanSearch,
  TriangleAlert,
} from 'lucide-vue-next'
import type { AdminCitizenReport } from '~/types/admin'
import type { CitizenReportStatus } from '~/types/map'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Métricas de reclamos' })

const TIME_ZONE = 'America/Argentina/Cordoba'
const WITHOUT_NEIGHBORHOOD = 'Sin barrio informado'
const STATUS_ORDER: CitizenReportStatus[] = ['pending', 'approved', 'rejected']
const STATUS_LABELS: Record<CitizenReportStatus, string> = {
  pending: 'Pendientes',
  approved: 'Aprobados',
  rejected: 'Rechazados',
}
const STATUS_COLORS: Record<CitizenReportStatus, string> = {
  pending: '#d59a27',
  approved: '#0b9c70',
  rejected: '#d94841',
}
const DAY_KEYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_LABELS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
const chartFont = 'Instrument Sans Variable, Instrument Sans, sans-serif'
const monoFont = 'IBM Plex Mono, monospace'

const reports = ref<AdminCitizenReport[]>([])
const loading = ref(true)
const refreshing = ref(false)
const loadError = ref('')
const lastUpdated = ref<Date | null>(null)
const { fetchAllAdminReports } = useAdminReports()

const numberFormatter = new Intl.NumberFormat('es-AR')
const percentFormatter = new Intl.NumberFormat('es-AR', { maximumFractionDigits: 1 })
const dateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric', timeZone: TIME_ZONE })
const timeFormatter = new Intl.DateTimeFormat('es-AR', { hour: '2-digit', minute: '2-digit', timeZone: TIME_ZONE })
const zonedPartsFormatter = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  weekday: 'short',
  hour: '2-digit',
  hourCycle: 'h23',
  timeZone: TIME_ZONE,
})

function validDate(value: string) {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

function dateParts(date: Date) {
  return Object.fromEntries(zonedPartsFormatter.formatToParts(date).map(part => [part.type, part.value]))
}

function neighborhoodOf(report: AdminCitizenReport) {
  return report.neighborhood?.trim() || WITHOUT_NEIGHBORHOOD
}

function percentage(value: number, total: number) {
  return total ? `${percentFormatter.format((value / total) * 100)}%` : '0%'
}

async function loadMetrics(silent = false) {
  if (silent) refreshing.value = true
  else loading.value = true
  loadError.value = ''
  try {
    reports.value = await fetchAllAdminReports()
    lastUpdated.value = new Date()
  }
  catch (error) {
    loadError.value = error instanceof Error ? error.message : 'No se pudieron cargar todos los reclamos.'
  }
  finally {
    loading.value = false
    refreshing.value = false
  }
}

onMounted(() => void loadMetrics())

const statusCounts = computed(() => {
  const counts: Record<CitizenReportStatus, number> = { pending: 0, approved: 0, rejected: 0 }
  for (const report of reports.value) counts[report.status] += 1
  return counts
})

const reviewedCount = computed(() => statusCounts.value.approved + statusCounts.value.rejected)
const withPhotoCount = computed(() => reports.value.filter(report => Boolean(report.photoPath)).length)
const neighborhoodsCount = computed(() => new Set(reports.value.map(neighborhoodOf).filter(name => name !== WITHOUT_NEIGHBORHOOD)).size)
const pendingOlderThanWeek = computed(() => reports.value.filter(report => {
  if (report.status !== 'pending') return false
  const created = validDate(report.createdAt)
  return created ? Date.now() - created.getTime() > 7 * 86_400_000 : false
}).length)

const metricCards = computed(() => [
  { label: 'Reclamos totales', value: numberFormatter.format(reports.value.length), detail: 'Todas las filas disponibles', icon: Database, color: '#1c9eda' },
  { label: 'Tasa de aprobación', value: percentage(statusCounts.value.approved, reviewedCount.value), detail: `${numberFormatter.format(reviewedCount.value)} decisiones tomadas`, icon: CheckCircle2, color: '#0b9c70' },
  { label: 'Con fotografía', value: percentage(withPhotoCount.value, reports.value.length), detail: `${numberFormatter.format(withPhotoCount.value)} adjuntos`, icon: Camera, color: '#7966d8' },
  { label: 'Barrios identificados', value: numberFormatter.format(neighborhoodsCount.value), detail: 'Nombres únicos informados', icon: MapPinned, color: '#0877ad' },
  { label: 'Pendientes +7 días', value: numberFormatter.format(pendingOlderThanWeek.value), detail: 'Requieren seguimiento', icon: Clock3, color: '#d94841' },
])

const activity = computed(() => {
  const dated = reports.value
    .map(report => ({ report, date: validDate(report.createdAt) }))
    .filter((item): item is { report: AdminCitizenReport, date: Date } => Boolean(item.date))
  const timestamps = dated.map(item => item.date.getTime())
  const spanDays = timestamps.length > 1 ? (Math.max(...timestamps) - Math.min(...timestamps)) / 86_400_000 : 0
  const monthly = spanDays > 120
  const groups = new Map<string, Record<CitizenReportStatus, number>>()

  for (const item of dated) {
    const parts = dateParts(item.date)
    const key = monthly ? `${parts.year}-${parts.month}` : `${parts.year}-${parts.month}-${parts.day}`
    const current = groups.get(key) ?? { pending: 0, approved: 0, rejected: 0 }
    current[item.report.status] += 1
    groups.set(key, current)
  }

  const keys = [...groups.keys()].sort()
  const labels = keys.map(key => {
    const [year, month, day] = key.split('-').map(Number)
    return monthly
      ? new Intl.DateTimeFormat('es-AR', { month: 'short', year: '2-digit', timeZone: 'UTC' }).format(new Date(Date.UTC(year!, month! - 1, 15)))
      : `${String(day).padStart(2, '0')}/${String(month).padStart(2, '0')}`
  })
  let accumulated = 0
  const cumulative = keys.map(key => {
    const counts = groups.get(key)!
    accumulated += counts.pending + counts.approved + counts.rejected
    return accumulated
  })

  return {
    keys,
    labels,
    monthly,
    cumulative,
    byStatus: Object.fromEntries(STATUS_ORDER.map(status => [status, keys.map(key => groups.get(key)![status])])) as Record<CitizenReportStatus, number[]>,
  }
})

const activityOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 450,
  textStyle: { fontFamily: chartFont },
  color: STATUS_ORDER.map(status => STATUS_COLORS[status]),
  tooltip: { trigger: 'axis', backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff', fontFamily: chartFont } },
  legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#516775', fontSize: 11 } },
  grid: { left: 44, right: 50, top: 42, bottom: activity.value.labels.length > 35 ? 52 : 32 },
  dataZoom: activity.value.labels.length > 35 ? [{ type: 'inside' }, { type: 'slider', height: 15, bottom: 4, borderColor: 'transparent', backgroundColor: '#edf4f3', fillerColor: 'rgba(28,158,218,.16)', handleSize: 0 }] : [],
  xAxis: { type: 'category', data: activity.value.labels, boundaryGap: true, axisTick: { show: false }, axisLine: { lineStyle: { color: '#dce6e8' } }, axisLabel: { color: '#718792', fontSize: 10, fontFamily: monoFont } },
  yAxis: [
    { type: 'value', minInterval: 1, axisLabel: { color: '#718792', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf2f3' } } },
    { type: 'value', minInterval: 1, axisLabel: { color: '#1c9eda', fontSize: 10 }, splitLine: { show: false } },
  ],
  series: [
    ...STATUS_ORDER.map(status => ({ name: STATUS_LABELS[status], type: 'bar', stack: 'reclamos', barMaxWidth: 18, emphasis: { focus: 'series' }, itemStyle: { color: STATUS_COLORS[status], borderRadius: status === 'rejected' ? [3, 3, 0, 0] : 0 }, data: activity.value.byStatus[status] })),
    { name: 'Acumulado', type: 'line', yAxisIndex: 1, smooth: true, showSymbol: false, lineStyle: { color: '#1c9eda', width: 2.5 }, areaStyle: { color: 'rgba(28,158,218,.08)' }, data: activity.value.cumulative },
  ],
}))

const statusOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 450,
  textStyle: { fontFamily: chartFont },
  tooltip: { trigger: 'item', backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff' }, formatter: '{b}<br/><strong>{c}</strong> · {d}%' },
  legend: { bottom: 0, left: 'center', icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#516775', fontSize: 11 } },
  series: [{
    name: 'Estado',
    type: 'pie',
    radius: ['58%', '79%'],
    center: ['50%', '44%'],
    avoidLabelOverlap: true,
    label: { show: false },
    itemStyle: { borderColor: '#fff', borderWidth: 4, borderRadius: 6 },
    data: STATUS_ORDER.map(status => ({ name: STATUS_LABELS[status], value: statusCounts.value[status], itemStyle: { color: STATUS_COLORS[status] } })),
  }],
}))

const topicRows = computed(() => {
  const groups = new Map<string, Record<CitizenReportStatus, number>>()
  for (const report of reports.value) {
    const current = groups.get(report.topic) ?? { pending: 0, approved: 0, rejected: 0 }
    current[report.status] += 1
    groups.set(report.topic, current)
  }
  return [...groups.entries()]
    .map(([name, counts]) => ({ name, counts, total: counts.pending + counts.approved + counts.rejected }))
    .sort((a, b) => a.total - b.total)
})

const topicsOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 450,
  textStyle: { fontFamily: chartFont },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff' } },
  legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#516775', fontSize: 11 } },
  grid: { left: 176, right: 24, top: 40, bottom: 25 },
  xAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#718792', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf2f3' } } },
  yAxis: { type: 'category', data: topicRows.value.map(row => row.name), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#314b5b', fontSize: 10, width: 158, overflow: 'truncate' } },
  series: STATUS_ORDER.map(status => ({ name: STATUS_LABELS[status], type: 'bar', stack: 'estado', barMaxWidth: 18, itemStyle: { color: STATUS_COLORS[status] }, data: topicRows.value.map(row => row.counts[status]) })),
}))

const neighborhoodRows = computed(() => {
  const groups = new Map<string, number>()
  for (const report of reports.value) groups.set(neighborhoodOf(report), (groups.get(neighborhoodOf(report)) ?? 0) + 1)
  return [...groups.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 12)
    .reverse()
})

const neighborhoodsOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 450,
  textStyle: { fontFamily: chartFont },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff' } },
  grid: { left: 154, right: 36, top: 10, bottom: 22 },
  xAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#718792', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf2f3' } } },
  yAxis: { type: 'category', data: neighborhoodRows.value.map(row => row.name), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#314b5b', fontSize: 10, width: 138, overflow: 'truncate' } },
  series: [{ type: 'bar', barMaxWidth: 17, data: neighborhoodRows.value.map(row => row.value), itemStyle: { color: '#0877ad', borderRadius: [0, 5, 5, 0] }, label: { show: true, position: 'right', color: '#516775', fontFamily: monoFont, fontSize: 9 } }],
}))

const neighborhoodTopicMatrix = computed(() => {
  const topicTotals = new Map<string, number>()
  const neighborhoodTotals = new Map<string, number>()
  const counts = new Map<string, Map<string, number>>()

  for (const report of reports.value) {
    const neighborhood = neighborhoodOf(report)
    topicTotals.set(report.topic, (topicTotals.get(report.topic) ?? 0) + 1)
    neighborhoodTotals.set(neighborhood, (neighborhoodTotals.get(neighborhood) ?? 0) + 1)

    const neighborhoodCounts = counts.get(neighborhood) ?? new Map<string, number>()
    neighborhoodCounts.set(report.topic, (neighborhoodCounts.get(report.topic) ?? 0) + 1)
    counts.set(neighborhood, neighborhoodCounts)
  }

  const topics = [...topicTotals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const neighborhoods = [...neighborhoodTotals.entries()].sort((a, b) => b[1] - a[1]).map(([name]) => name)
  const data = neighborhoods.flatMap((neighborhood, neighborhoodIndex) => topics.map((topic, topicIndex) => [
    topicIndex,
    neighborhoodIndex,
    counts.get(neighborhood)?.get(topic) ?? 0,
  ]))

  return {
    data,
    neighborhoods,
    topics,
    maximum: Math.max(1, ...data.map(item => Number(item[2]))),
  }
})

const neighborhoodTopicOption = computed<Record<string, unknown>>(() => {
  const hasManyNeighborhoods = neighborhoodTopicMatrix.value.neighborhoods.length > 12
  const hasManyTopics = neighborhoodTopicMatrix.value.topics.length > 8
  const dataZoom: Record<string, unknown>[] = []

  if (hasManyNeighborhoods) {
    dataZoom.push(
      { type: 'inside', yAxisIndex: 0, startValue: 0, endValue: 11 },
      { type: 'slider', yAxisIndex: 0, right: 7, top: 92, bottom: 86, width: 12, borderColor: 'transparent', backgroundColor: '#edf4f3', fillerColor: 'rgba(28,158,218,.16)', handleSize: 0 },
    )
  }

  if (hasManyTopics) {
    dataZoom.push(
      { type: 'inside', xAxisIndex: 0, startValue: 0, endValue: 7 },
      { type: 'slider', xAxisIndex: 0, left: 185, right: 42, bottom: 54, height: 12, borderColor: 'transparent', backgroundColor: '#edf4f3', fillerColor: 'rgba(28,158,218,.16)', handleSize: 0 },
    )
  }

  return {
    animationDuration: 450,
    textStyle: { fontFamily: chartFont },
    tooltip: {
      position: 'top',
      backgroundColor: '#092235',
      borderWidth: 0,
      textStyle: { color: '#fff' },
      formatter: (params: { value: number[] }) => {
        const topic = neighborhoodTopicMatrix.value.topics[params.value[0]!] ?? 'Sin tipo'
        const neighborhood = neighborhoodTopicMatrix.value.neighborhoods[params.value[1]!] ?? WITHOUT_NEIGHBORHOOD
        const amount = Number(params.value[2])
        return `${neighborhood}<br/>${topic}<br/><strong>${numberFormatter.format(amount)} ${amount === 1 ? 'reclamo' : 'reclamos'}</strong>`
      },
    },
    dataZoom,
    grid: { left: 178, right: hasManyNeighborhoods ? 38 : 22, top: 92, bottom: hasManyTopics ? 82 : 66 },
    xAxis: {
      type: 'category',
      data: neighborhoodTopicMatrix.value.topics,
      position: 'top',
      splitArea: { show: true },
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#516775', fontSize: 10, width: 120, overflow: 'truncate', rotate: 18, margin: 12 },
    },
    yAxis: {
      type: 'category',
      data: neighborhoodTopicMatrix.value.neighborhoods,
      inverse: true,
      splitArea: { show: true },
      axisTick: { show: false },
      axisLine: { show: false },
      axisLabel: { color: '#314b5b', fontSize: 10, width: 158, overflow: 'truncate' },
    },
    visualMap: {
      min: 0,
      max: neighborhoodTopicMatrix.value.maximum,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 4,
      itemWidth: 12,
      itemHeight: 120,
      text: ['Más', 'Menos'],
      textStyle: { color: '#718792', fontSize: 9 },
      inRange: { color: ['#edf4f3', '#a9dded', '#1c9eda', '#092235'] },
    },
    series: [{
      name: 'Reclamos',
      type: 'heatmap',
      data: neighborhoodTopicMatrix.value.data,
      label: { show: false },
      itemStyle: { borderColor: '#fff', borderWidth: 2 },
      emphasis: { itemStyle: { borderColor: '#78ccef', borderWidth: 3, shadowBlur: 8, shadowColor: 'rgba(9,34,53,.25)' } },
    }],
  }
})

const heatmap = computed(() => {
  const matrix = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0))
  for (const report of reports.value) {
    const date = validDate(report.createdAt)
    if (!date) continue
    const parts = dateParts(date)
    const day = DAY_KEYS.indexOf(parts.weekday ?? '')
    const hour = Number(parts.hour)
    if (day >= 0 && Number.isInteger(hour) && hour >= 0 && hour <= 23) matrix[day]![hour]! += 1
  }
  const data = matrix.flatMap((hours, day) => hours.map((value, hour) => [hour, day, value]))
  return { data, maximum: Math.max(1, ...data.map(item => Number(item[2]))) }
})

const heatmapOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 400,
  textStyle: { fontFamily: chartFont },
  tooltip: { position: 'top', backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff' }, formatter: (params: { value: number[] }) => `${DAY_LABELS[params.value[1]!]} · ${String(params.value[0]).padStart(2, '0')}:00<br/><strong>${params.value[2]} reclamos</strong>` },
  grid: { left: 42, right: 18, top: 18, bottom: 58 },
  xAxis: { type: 'category', data: Array.from({ length: 24 }, (_, hour) => String(hour).padStart(2, '0')), splitArea: { show: true }, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#718792', fontFamily: monoFont, fontSize: 9, interval: 2 } },
  yAxis: { type: 'category', data: DAY_LABELS, splitArea: { show: true }, axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#516775', fontSize: 10 } },
  visualMap: { min: 0, max: heatmap.value.maximum, calculable: false, orient: 'horizontal', left: 'center', bottom: 4, itemWidth: 12, itemHeight: 110, text: ['Más', 'Menos'], textStyle: { color: '#718792', fontSize: 9 }, inRange: { color: ['#edf4f3', '#9dd9ef', '#1c9eda', '#092235'] } },
  series: [{ type: 'heatmap', data: heatmap.value.data, label: { show: false }, emphasis: { itemStyle: { shadowBlur: 8, shadowColor: 'rgba(9,34,53,.25)' } } }],
}))

const pendingAgeRows = computed(() => {
  const buckets = [
    { label: 'Hasta 24 h', maximum: 1, value: 0 },
    { label: '2–3 días', maximum: 3, value: 0 },
    { label: '4–7 días', maximum: 7, value: 0 },
    { label: '8–30 días', maximum: 30, value: 0 },
    { label: '+30 días', maximum: Infinity, value: 0 },
  ]
  for (const report of reports.value) {
    if (report.status !== 'pending') continue
    const created = validDate(report.createdAt)
    if (!created) continue
    const age = Math.max(0, (Date.now() - created.getTime()) / 86_400_000)
    buckets.find(bucket => age <= bucket.maximum)!.value += 1
  }
  return buckets
})

const pendingAgeOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 450,
  textStyle: { fontFamily: chartFont },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff' } },
  grid: { left: 40, right: 18, top: 15, bottom: 50 },
  xAxis: { type: 'category', data: pendingAgeRows.value.map(row => row.label), axisTick: { show: false }, axisLine: { lineStyle: { color: '#dce6e8' } }, axisLabel: { color: '#718792', fontSize: 9, rotate: 20 } },
  yAxis: { type: 'value', minInterval: 1, axisLabel: { color: '#718792', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf2f3' } } },
  series: [{ type: 'bar', barMaxWidth: 34, data: pendingAgeRows.value.map((row, index) => ({ value: row.value, itemStyle: { color: index < 3 ? '#d59a27' : '#d94841', borderRadius: [5, 5, 0, 0] } })), label: { show: true, position: 'top', color: '#516775', fontFamily: monoFont, fontSize: 9 } }],
}))

const qualityRows = computed(() => [
  { label: 'Fotografía', available: withPhotoCount.value, missing: reports.value.length - withPhotoCount.value },
  { label: 'Barrio', available: reports.value.filter(report => neighborhoodOf(report) !== WITHOUT_NEIGHBORHOOD).length, missing: reports.value.filter(report => neighborhoodOf(report) === WITHOUT_NEIGHBORHOOD).length },
  { label: 'Descripción detallada', available: reports.value.filter(report => report.description.trim().length >= 20).length, missing: reports.value.filter(report => report.description.trim().length < 20).length },
])

const qualityOption = computed<Record<string, unknown>>(() => ({
  animationDuration: 450,
  textStyle: { fontFamily: chartFont },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#092235', borderWidth: 0, textStyle: { color: '#fff' } },
  legend: { top: 0, right: 0, icon: 'circle', itemWidth: 8, itemHeight: 8, textStyle: { color: '#516775', fontSize: 11 } },
  grid: { left: 135, right: 20, top: 42, bottom: 24 },
  xAxis: { type: 'value', max: reports.value.length || 1, axisLabel: { color: '#718792', fontSize: 10 }, splitLine: { lineStyle: { color: '#edf2f3' } } },
  yAxis: { type: 'category', data: qualityRows.value.map(row => row.label), axisTick: { show: false }, axisLine: { show: false }, axisLabel: { color: '#314b5b', fontSize: 10 } },
  series: [
    { name: 'Disponible', type: 'bar', stack: 'calidad', barMaxWidth: 22, data: qualityRows.value.map(row => row.available), itemStyle: { color: '#1c9eda' } },
    { name: 'Faltante o breve', type: 'bar', stack: 'calidad', barMaxWidth: 22, data: qualityRows.value.map(row => row.missing), itemStyle: { color: '#dfe8ea', borderRadius: [0, 5, 5, 0] } },
  ],
}))

const insightRows = computed(() => {
  const topTopic = [...topicRows.value].sort((a, b) => b.total - a.total)[0]
  const topNeighborhood = [...neighborhoodRows.value].reverse()[0]
  const peak = heatmap.value.data.reduce((best, item) => Number(item[2]) > Number(best[2]) ? item : best, [0, 0, 0])
  const dates = reports.value.map(report => validDate(report.createdAt)).filter((date): date is Date => Boolean(date)).sort((a, b) => a.getTime() - b.getTime())
  return [
    { label: 'Tema más frecuente', value: topTopic?.name ?? 'Sin datos', meta: topTopic ? `${numberFormatter.format(topTopic.total)} reclamos` : '', icon: Layers3 },
    { label: 'Barrio con más registros', value: topNeighborhood?.name ?? 'Sin datos', meta: topNeighborhood ? `${numberFormatter.format(topNeighborhood.value)} reclamos` : '', icon: MapPinned },
    { label: 'Momento de mayor carga', value: `${DAY_LABELS[Number(peak[1])] ?? '—'} · ${String(peak[0]).padStart(2, '0')}:00`, meta: `${numberFormatter.format(Number(peak[2]))} reclamos en esa franja`, icon: Clock3 },
    { label: 'Período observado', value: dates.length ? `${dateFormatter.format(dates[0]!)} — ${dateFormatter.format(dates.at(-1)!)}` : 'Sin datos', meta: activity.value.monthly ? 'Agrupación mensual' : 'Agrupación diaria', icon: ScanSearch },
  ]
})
</script>

<template>
  <div class="min-h-dvh px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div class="mx-auto max-w-[1500px]">
      <header class="relative overflow-hidden rounded-[1.75rem] bg-ink px-5 py-6 text-white sm:px-7 sm:py-8 lg:px-9">
        <div class="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_78%_8%,rgba(28,158,218,.42),transparent_34%),linear-gradient(115deg,transparent_58%,rgba(120,204,239,.08)_58%_59%,transparent_59%)]" />
        <div class="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div class="flex flex-wrap items-center gap-3"><p class="ui-label text-river-light">Observatorio de reclamos</p><span class="inline-flex items-center gap-1.5 rounded-full border border-white/12 bg-white/7 px-2.5 py-1 text-[10px] font-semibold text-white/65"><Database :size="11" class="text-river-light" /> Conjunto completo</span></div>
            <h1 class="mt-4 text-[clamp(2.2rem,4.5vw,4.6rem)] font-semibold leading-[.9] tracking-[-.065em]">Lectura completa<br><span class="text-river-light">del sistema.</span></h1>
            <p class="mt-5 max-w-2xl text-sm leading-relaxed text-white/58">Esta vista solicita todos los reclamos en bloques de 1.000 y calcula las métricas sobre el historial completo. La bandeja de moderación continúa paginada para mantenerse rápida.</p>
          </div>
          <div class="flex flex-wrap items-center gap-3">
            <p v-if="lastUpdated" class="mr-1 text-[11px] text-white/42">Actualizado {{ timeFormatter.format(lastUpdated) }}</p>
            <NuxtLink to="/admin" class="inline-flex h-11 items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-4 text-xs font-semibold text-white transition hover:bg-white/14"><ArrowLeft :size="15" /> Moderar</NuxtLink>
            <button class="inline-flex h-11 items-center gap-2 rounded-xl bg-river px-4 text-xs font-semibold text-white shadow-lg shadow-river/20 transition hover:bg-river-ink disabled:opacity-45" :disabled="loading || refreshing" @click="loadMetrics(true)"><RefreshCw :size="15" :class="refreshing && 'animate-spin'" /> {{ refreshing ? 'Actualizando…' : 'Actualizar todo' }}</button>
          </div>
        </div>
      </header>

      <div v-if="loading" class="mt-6 grid min-h-[420px] place-items-center rounded-2xl border border-ink/10 bg-white"><div class="text-center"><LoaderCircle :size="30" class="mx-auto animate-spin text-river" /><p class="mt-3 text-sm font-semibold">Leyendo el historial completo…</p><p class="mt-1 text-xs text-ink/42">Puede tomar unos segundos si hay muchos reclamos.</p></div></div>
      <div v-else-if="loadError" class="mt-6 rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800"><div class="flex items-start gap-3"><TriangleAlert :size="20" class="mt-0.5 shrink-0" /><div><p class="font-semibold">No se pudieron calcular las métricas</p><p class="mt-1 text-sm opacity-75">{{ loadError }}</p><button class="mt-4 rounded-lg bg-red-700 px-4 py-2 text-xs font-semibold text-white" @click="loadMetrics()">Intentar de nuevo</button></div></div></div>

      <template v-else>
        <section class="relative z-10 mx-2 -mt-1 grid overflow-hidden rounded-b-2xl border border-t-0 border-ink/10 bg-white shadow-[0_12px_30px_rgba(9,34,53,.06)] sm:grid-cols-2 lg:mx-5 lg:grid-cols-5" aria-label="Indicadores generales">
          <article v-for="metric in metricCards" :key="metric.label" class="border-b border-ink/8 p-4 last:border-b-0 sm:border-r sm:last:border-r-0 lg:border-b-0 lg:p-5">
            <div class="flex items-center justify-between"><p class="ui-label text-[9px] text-ink/42">{{ metric.label }}</p><component :is="metric.icon" :size="15" :style="{ color: metric.color }" /></div>
            <p class="mt-3 font-mono text-2xl font-medium tracking-[-.05em] text-ink">{{ metric.value }}</p>
            <p class="mt-1 text-[10px] text-ink/42">{{ metric.detail }}</p>
          </article>
        </section>

        <section v-if="!reports.length" class="mt-6 grid min-h-[360px] place-items-center rounded-2xl border border-ink/10 bg-white px-6 text-center"><div><Database :size="26" class="mx-auto text-ink/25" /><p class="mt-3 text-sm font-semibold">Todavía no hay reclamos para analizar</p><p class="mt-1 text-xs text-ink/42">Las gráficas aparecerán cuando ingrese el primer registro.</p></div></section>

        <div v-else class="mt-6 grid gap-5 xl:grid-cols-12">
          <section class="overflow-hidden rounded-2xl border border-ink/10 bg-white xl:col-span-8">
            <div class="border-b border-ink/8 px-5 py-4 sm:px-6"><p class="ui-label text-river-ink">Pulso histórico</p><div class="mt-1 flex flex-wrap items-end justify-between gap-2"><div><h2 class="text-xl font-semibold tracking-[-.035em]">Altas y crecimiento acumulado</h2><p class="mt-1 text-xs text-ink/45">Cada barra representa cuándo se creó el reclamo, segmentada por su estado actual.</p></div><span class="rounded-full bg-mist px-3 py-1 font-mono text-[10px] text-ink/50">{{ activity.monthly ? 'Por mes' : 'Por día' }}</span></div></div>
            <div class="p-3 sm:p-5"><AdminReportChart :option="activityOption" height="350px" /></div>
          </section>

          <aside class="rounded-2xl bg-ink p-5 text-white sm:p-6 xl:col-span-4">
            <p class="ui-label text-river-light">Hallazgos rápidos</p><h2 class="mt-2 text-xl font-semibold tracking-[-.035em]">Qué está diciendo el historial</h2>
            <div class="mt-5 divide-y divide-white/10 border-y border-white/10">
              <article v-for="insight in insightRows" :key="insight.label" class="grid grid-cols-[34px_1fr] gap-3 py-4"><span class="grid size-8 place-items-center rounded-lg bg-white/8 text-river-light"><component :is="insight.icon" :size="15" /></span><div class="min-w-0"><p class="ui-label text-[8px] text-white/40">{{ insight.label }}</p><p class="mt-1 truncate text-sm font-semibold">{{ insight.value }}</p><p class="mt-1 text-[10px] text-white/40">{{ insight.meta }}</p></div></article>
            </div>
          </aside>

          <section class="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 xl:col-span-4"><p class="ui-label text-river-ink">Publicación</p><h2 class="mt-1 text-lg font-semibold tracking-[-.03em]">Estado actual</h2><p class="mt-1 text-xs text-ink/43">Proporción sobre el historial completo.</p><AdminReportChart class="mt-2" :option="statusOption" height="290px" /></section>
          <section class="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 xl:col-span-8"><p class="ui-label text-river-ink">Motivos</p><h2 class="mt-1 text-lg font-semibold tracking-[-.03em]">Tipos de reclamo por estado</h2><p class="mt-1 text-xs text-ink/43">Permite detectar qué problemas acumulan más pendientes o rechazos.</p><AdminReportChart class="mt-2" :option="topicsOption" height="310px" /></section>

          <section class="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 xl:col-span-8"><p class="ui-label text-river-ink">Ritmo de participación</p><h2 class="mt-1 text-lg font-semibold tracking-[-.03em]">Días y horarios de carga</h2><p class="mt-1 text-xs text-ink/43">Hora local de Santa Fe. El color más oscuro indica mayor actividad.</p><AdminReportChart class="mt-2" :option="heatmapOption" height="310px" /></section>
          <section class="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 xl:col-span-4"><p class="ui-label text-[#b75e37]">Cola de revisión</p><h2 class="mt-1 text-lg font-semibold tracking-[-.03em]">Antigüedad de pendientes</h2><p class="mt-1 text-xs text-ink/43">Cuánto tiempo llevan esperando una decisión.</p><AdminReportChart class="mt-2" :option="pendingAgeOption" height="310px" /></section>

          <section class="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 xl:col-span-7"><p class="ui-label text-river-ink">Territorio</p><h2 class="mt-1 text-lg font-semibold tracking-[-.03em]">Barrios con más reclamos</h2><p class="mt-1 text-xs text-ink/43">Los doce nombres más frecuentes, incluyendo cargas sin barrio informado.</p><AdminReportChart class="mt-2" :option="neighborhoodsOption" height="360px" /></section>
          <section class="rounded-2xl border border-ink/10 bg-white p-5 sm:p-6 xl:col-span-5"><p class="ui-label text-river-ink">Calidad de carga</p><h2 class="mt-1 text-lg font-semibold tracking-[-.03em]">Información disponible</h2><p class="mt-1 text-xs text-ink/43">Cobertura de foto, barrio y descripción de al menos 20 caracteres.</p><AdminReportChart class="mt-2" :option="qualityOption" height="360px" /></section>

          <section class="overflow-hidden rounded-2xl border border-ink/10 bg-white xl:col-span-12">
            <div class="border-b border-ink/8 px-5 py-4 sm:px-6">
              <p class="ui-label text-river-ink">Cruce territorial</p>
              <div class="mt-1 flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 class="text-lg font-semibold tracking-[-.03em]">Matriz barrio × tipo de reclamo</h2>
                  <p class="mt-1 text-xs text-ink/43">Cada celda muestra la cantidad de reclamos para esa combinación. Los barrios y tipos se ordenan por volumen total.</p>
                </div>
                <span class="rounded-full bg-mist px-3 py-1 font-mono text-[10px] text-ink/50">{{ numberFormatter.format(neighborhoodTopicMatrix.neighborhoods.length) }} barrios × {{ numberFormatter.format(neighborhoodTopicMatrix.topics.length) }} tipos</span>
              </div>
            </div>
            <div class="p-3 sm:p-5">
              <AdminReportChart :option="neighborhoodTopicOption" height="480px" />
            </div>
          </section>
        </div>

        <footer class="mt-5 flex flex-col gap-2 rounded-xl border border-ink/8 bg-white px-4 py-3 text-[10px] text-ink/45 sm:flex-row sm:items-center sm:justify-between"><p>Las métricas describen los reclamos recibidos; no prueban por sí solas la existencia ni resolución de un problema hídrico.</p><p class="shrink-0 font-mono">{{ numberFormatter.format(reports.length) }} registros procesados</p></footer>
      </template>
    </div>
  </div>
</template>
