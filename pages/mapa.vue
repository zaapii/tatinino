<script setup lang="ts">
import { reportDesignOrder } from '~/utils/reportDesign'
import { ArrowDown, CircleAlert, Cloud, Crosshair, LoaderCircle, Radio, Waves, X } from 'lucide-vue-next'
import type { BaseMapKind, CitizenReport, MapPoint, MapSelection, RiverLevelReading } from '~/types/map'
import MapViewerClient from '~/components/map/MapViewer.client.vue'
import MapPointInfoPanel from '~/components/map/MapPointInfo.vue'

useSeoMeta({
  title: 'Mapa del Agua',
  description: 'Mapa del Agua de Santa Fe: consultá niveles de los ríos, capas de riesgo hídrico y reclamos vecinales en un mapa interactivo.',
  ogTitle: 'Mapa del Agua',
  ogDescription: 'Mapa del Agua de Santa Fe: niveles de los ríos, riesgo hídrico y reclamos vecinales.',
  twitterTitle: 'Mapa del Agua - Tati Restagno',
  twitterDescription: 'Mapa del Agua de Santa Fe: niveles de los ríos, riesgo hídrico y reclamos vecinales.',
})

const { layers, toggleLayer } = useMapLayers()
const selectedPoint = ref<MapSelection | null>(null)
const layersOpen = ref(false)
const baseMap = ref<BaseMapKind>('simple')
const reportOpen = ref(false)
const infoOpen = ref(false)
const mapReady = ref(false)
const loadingLayerCount = ref(0)
const layerError = ref('')
const reportsError = ref('')
const reportsLoading = ref(true)
const riverLevelsError = ref('')
const riverLevelsLoading = ref(true)
const placingReport = ref(false)
const reportLocation = ref<MapPoint | null>(null)
const reports = ref<CitizenReport[]>([])
const reportTopics = ref([...reportDesignOrder])
const filteredReports = computed(() => reports.value.filter(report => reportTopics.value.includes(report.topic)))
watch(reportTopics, () => { if (selectedPoint.value?.feature?.layerId === 'citizen-reports') selectedPoint.value = null })
const riverLevels = ref<RiverLevelReading[]>([])
const { fetchReports, subscribeToReports } = useCitizenReports()
const { fetchRiverLevels } = useRiverLevels()
let stopReportSubscription: (() => void) | undefined
let reportRefreshTimer: ReturnType<typeof setInterval> | undefined
let riverLevelRefreshTimer: ReturnType<typeof setInterval> | undefined
const waterVisible = computed(() => layers.value.find(layer => layer.id === 'water')?.enabled ?? true)
const reportsVisible = computed(() => layers.value.find(layer => layer.id === 'citizen-reports')?.enabled ?? true)
const riverLevelsVisible = computed(() => layers.value.find(layer => layer.id === 'river-levels')?.enabled ?? true)

watch(layersOpen, (open) => { if (open) reportOpen.value = false })
watch(reportOpen, (open) => { if (open) layersOpen.value = false })

function requestReportLocation() {
  placingReport.value = true
  reportOpen.value = false
  layersOpen.value = false
  infoOpen.value = false
  selectedPoint.value = null
}

function setReportLocation(point: MapPoint) {
  reportLocation.value = point
  placingReport.value = false
  reportOpen.value = true
}

function cancelReportLocation() {
  placingReport.value = false
  reportOpen.value = true
}

function goToMetrics() {
  document.getElementById('metricas')?.scrollIntoView({
    behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth',
    block: 'start',
  })
}

function upsertReport(report: CitizenReport) {
  const index = reports.value.findIndex(item => item.id === report.id)
  if (index === -1) reports.value.unshift(report)
  else reports.value[index] = report
}

function finishReportSubmission() {
  reportLocation.value = null
}

async function syncApprovedReports(showError = false) {
  try {
    const approvedReports = await fetchReports()
    reports.value = approvedReports
    const selectedReportId = selectedPoint.value?.feature?.layerId === 'citizen-reports'
      ? String(selectedPoint.value.feature.properties.id ?? '')
      : ''
    if (selectedReportId && !approvedReports.some(report => report.id === selectedReportId)) selectedPoint.value = null
    if (showError) reportsError.value = ''
  }
  catch (error) {
    if (showError) reportsError.value = error instanceof Error ? error.message : 'No se pudieron sincronizar los reclamos.'
    throw error
  }
}

function refreshReportsOnFocus() {
  void syncApprovedReports(true).catch(() => undefined)
  void syncRiverLevels().catch(() => undefined)
}

async function syncRiverLevels(force = false) {
  try {
    const nextLevels = await fetchRiverLevels(force)
    riverLevels.value = nextLevels
    riverLevelsError.value = nextLevels.every(reading => reading.error)
      ? 'No se pudieron consultar las escalas oficiales de los ríos.'
      : ''
  }
  catch (error) {
    riverLevelsError.value = error instanceof Error ? error.message : 'No se pudieron consultar los niveles de los ríos.'
  }
  finally {
    riverLevelsLoading.value = false
  }
}

onMounted(() => {
  stopReportSubscription = subscribeToReports(upsertReport, id => {
    reports.value = reports.value.filter(report => report.id !== id)
    if (selectedPoint.value?.feature?.layerId === 'citizen-reports' && selectedPoint.value.feature.properties.id === id) selectedPoint.value = null
  })
  void syncApprovedReports()
    .catch(error => reportsError.value = error instanceof Error ? error.message : 'No se pudieron sincronizar los reclamos.')
    .finally(() => reportsLoading.value = false)
  void syncRiverLevels()
  window.addEventListener('focus', refreshReportsOnFocus)
  reportRefreshTimer = setInterval(() => void syncApprovedReports(true).catch(() => undefined), 30_000)
  riverLevelRefreshTimer = setInterval(() => void syncRiverLevels(true), 30 * 60_000)
})

onBeforeUnmount(() => {
  stopReportSubscription?.()
  window.removeEventListener('focus', refreshReportsOnFocus)
  if (reportRefreshTimer) clearInterval(reportRefreshTimer)
  if (riverLevelRefreshTimer) clearInterval(riverLevelRefreshTimer)
})
</script>

<template>
  <div>
  <section class="relative h-dvh overflow-hidden bg-[#dfe9e8] lg:h-[915px]" aria-label="Mapa interactivo">
    <ClientOnly>
      <MapViewerClient
        :selected-report="selectedPoint?.feature?.layerId === 'citizen-reports' && !placingReport && !reportOpen ? selectedPoint : null"
        @selection-closed="selectedPoint = null"
        :base-map="baseMap"
        :recent-satellite-scene="null"
        :water-visible="waterVisible"
        :layers="layers"
        :reports="filteredReports"
        :reports-visible="reportsVisible"
        :river-levels="riverLevels"
        :river-levels-visible="riverLevelsVisible"
        :placing-report="placingReport"
        :report-location="reportLocation"
        @ready="mapReady = true"
        @loading-change="loadingLayerCount = $event"
        @layer-error="layerError = $event"
        @point-selected="selectedPoint = $event"
        @report-location-selected="setReportLocation"
      />
      <template #fallback><div class="h-full w-full animate-pulse bg-[#dfe9e8]" /></template>
    </ClientOnly>

    <div v-if="!mapReady" class="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#e8f0ef]">
      <div class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm"><Radio :size="15" class="animate-pulse text-river"/> Preparando el mapa…</div>
    </div>

    <div v-if="!placingReport" class="map-actions absolute left-3 top-[76px] z-30 flex items-center gap-2 lg:left-5 lg:top-5">
      <button class="map-action layers-action" :aria-expanded="layersOpen" @click="layersOpen = !layersOpen"><img src="/figma/layers.svg" width="29" height="29" alt="" />Capas</button>
      <button class="map-action report-action" :aria-expanded="reportOpen" @click="reportOpen = !reportOpen">Cargá tu reclamo</button>
    </div>

    <MapLayersControl hide-trigger v-if="!reportOpen && !placingReport" v-model:open="layersOpen" v-model:base-map="baseMap" v-model:report-topics="reportTopics" :layers="layers" :report-count="reports.length" @toggle="toggleLayer" />
    <a v-if="!selectedPoint && !placingReport && !layersOpen && !reportOpen" href="#obra-garello" class="garello-map-card">
      <span class="garello-map-status">Obra paralizada</span>
      <strong>Terraplén Garello</strong>
      <span>Colastiné Sur · Ver información ↓</span>
    </a>
    <MapCitizenReportControl hide-trigger v-if="!layersOpen" v-model:open="reportOpen" :location="reportLocation" :selecting-location="placingReport" @request-location="requestReportLocation" @cancel-location="cancelReportLocation" @location-selected="setReportLocation" @clear-location="reportLocation = null" @created="finishReportSubmission" />
    <MapPointInfoPanel v-if="selectedPoint && selectedPoint.feature?.layerId !== 'citizen-reports' && !placingReport && !reportOpen" :point="selectedPoint" @close="selectedPoint = null" />

    <div v-if="placingReport" class="pointer-events-none absolute inset-x-3 top-[116px] z-40 flex justify-center sm:top-[124px]">
      <div class="surface-panel pointer-events-auto flex w-full max-w-[560px] items-center gap-3 rounded-2xl p-3 shadow-xl sm:p-3.5">
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-[#d94841] text-white"><Crosshair :size="20"/></span>
        <div class="min-w-0 flex-1"><p class="text-xs font-semibold sm:text-sm">Marcá la ubicación exacta</p><p class="mt-0.5 text-[10px] leading-snug text-ink/52 sm:text-[11px]">Tocá o hacé clic sobre el punto del mapa donde está el problema.</p></div>
        <button class="shrink-0 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-ink/55 transition hover:bg-mist" @click="cancelReportLocation">Cancelar</button>
      </div>
    </div>

    <div v-if="loadingLayerCount" class="surface-panel pointer-events-none absolute bottom-[66px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold"><LoaderCircle :size="14" class="animate-spin text-river"/> Cargando {{ loadingLayerCount === 1 ? 'capa' : `${loadingLayerCount} capas` }}…</div>
    <div v-else-if="riverLevelsLoading" class="surface-panel pointer-events-none absolute bottom-[66px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold"><Waves :size="14" class="animate-pulse text-river"/> Consultando niveles de los ríos…</div>
    <div v-else-if="reportsLoading" class="surface-panel pointer-events-none absolute bottom-[66px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold"><Cloud :size="14" class="animate-pulse text-river"/> Sincronizando reclamos…</div>
    <div v-else-if="reportsError" class="surface-panel absolute bottom-[66px] left-1/2 z-30 flex w-[min(92%,420px)] -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold"><CircleAlert :size="15" class="shrink-0 text-[#b75e37]"/><span class="min-w-0 flex-1">{{ reportsError }}</span><button class="grid size-6 shrink-0 place-items-center rounded-md hover:bg-mist" aria-label="Cerrar error" @click="reportsError = ''"><X :size="13"/></button></div>
    <div v-else-if="layerError" class="surface-panel absolute bottom-[66px] left-1/2 z-30 flex w-[min(92%,420px)] -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold"><CircleAlert :size="15" class="shrink-0 text-[#b75e37]"/><span class="min-w-0 flex-1">{{ layerError }}</span><button class="grid size-6 shrink-0 place-items-center rounded-md hover:bg-mist" aria-label="Cerrar error" @click="layerError = ''"><X :size="13"/></button></div>
    <div v-else-if="riverLevelsError" class="surface-panel absolute bottom-[66px] left-1/2 z-30 flex w-[min(92%,420px)] -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold"><CircleAlert :size="15" class="shrink-0 text-[#b75e37]"/><span class="min-w-0 flex-1">{{ riverLevelsError }}</span><button class="grid size-6 shrink-0 place-items-center rounded-md hover:bg-mist" aria-label="Cerrar error" @click="riverLevelsError = ''"><X :size="13"/></button></div>

    <div v-if="!selectedPoint && !layersOpen && !reportOpen && !placingReport" class="pointer-events-none absolute bottom-[66px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-[10px] text-white/85 backdrop-blur sm:hidden">Tocá el mapa para consultar un punto</div>

    <button
      v-if="!selectedPoint && !layersOpen && !reportOpen && !placingReport"
      type="button"
      class="metrics-jump"
      aria-label="Ir a las métricas de impacto, ríos y pronóstico"
      @click="goToMetrics"
    >
      <span>Ver métricas</span>
      <ArrowDown :size="14" :stroke-width="2.25" />
    </button>
  </section>
  <MapMetrics
    :reports="reports"
    :report-count="reports.length"
    :reports-loading="reportsLoading"
    :river-levels="riverLevels"
    :river-levels-loading="riverLevelsLoading"
  />
  <MapSeoContent />
  </div>
</template>

<style scoped>
.map-action { display: flex; align-items: center; justify-content: center; gap: 8px; height: 38px; padding: 0 16px; border-radius: 24px; color: white; font-size: 13px; font-weight: 500; box-shadow: 0 3px 4px #0003; cursor: pointer; }
.layers-action { background: #1a2741; padding-left: 10px; }
.report-action { background: #c93636; }
.map-action:hover { filter: brightness(1.1); }
.garello-map-card { position: absolute; z-index: 30; top: 20px; right: 20px; display: grid; gap: 4px; width: 205px; border-radius: 10px; background: #fff; padding: 12px 14px; color: #1a2741; box-shadow: 0 7px 24px #09223530; font-size: 11px; }
.garello-map-card strong { font-size: 14px; }
.garello-map-status { color: #ad2929; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .06em; }
.garello-map-card:hover { box-shadow: 0 10px 28px #09223545; }
.metrics-jump {
  position: absolute;
  z-index: 31;
  bottom: 16px;
  left: 50%;
  display: flex;
  height: 38px;
  transform: translateX(-50%);
  align-items: center;
  gap: 9px;
  border: 1px solid rgba(255,255,255,.22);
  border-radius: 999px;
  background: #1a2741;
  padding: 0 15px 0 17px;
  color: #fff;
  box-shadow: 0 5px 18px rgba(13,25,49,.28);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: .015em;
  cursor: pointer;
  transition: transform .2s ease, background-color .2s ease, box-shadow .2s ease;
}
.metrics-jump:hover { transform: translateX(-50%) translateY(-2px); background: #233454; box-shadow: 0 8px 22px rgba(13,25,49,.34); }
.metrics-jump:active { transform: translateX(-50%) translateY(0); }
.metrics-jump svg { color: #71bce7; }
@media (max-width: 639px) { .garello-map-card { top: 126px; right: 12px; width: 178px; padding: 10px 12px; } }
</style>
