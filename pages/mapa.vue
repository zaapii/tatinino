<script setup lang="ts">
import { CircleAlert, Crosshair, Database, LoaderCircle, Radio, X } from 'lucide-vue-next'
import type { CitizenReport, CitizenReportForm, MapPoint, MapSelection } from '~/types/map'
import MapViewerClient from '~/components/map/MapViewer.client.vue'
import MapPointInfoPanel from '~/components/map/MapPointInfo.vue'

useSeoMeta({
  title: 'Mapa de riesgo hídrico',
  description: 'Mapa interactivo para comprender riesgos, anticipar escenarios y fortalecer la prevención en Santa Fe Capital.',
})

const { layers, toggleLayer } = useMapLayers()
const selectedPoint = ref<MapSelection | null>(null)
const layersOpen = ref(false)
const reportOpen = ref(false)
const infoOpen = ref(false)
const mapReady = ref(false)
const loadingLayerCount = ref(0)
const layerError = ref('')
const placingReport = ref(false)
const reportLocation = ref<MapPoint | null>(null)
const reports = ref<CitizenReport[]>([
  { id: 'demo-1', topic: 'Boca de tormenta obstruida', description: 'La boca está cubierta por hojas y residuos después de la última lluvia.', point: { longitude: -60.7114, latitude: -31.6361 }, createdAt: 'Hoy · 09:20', status: 'reported' },
  { id: 'demo-2', topic: 'Calle anegada', description: 'Se acumula agua sobre la calzada y dificulta el paso peatonal.', point: { longitude: -60.6952, latitude: -31.6465 }, createdAt: 'Ayer · 18:45', status: 'reported' },
  { id: 'demo-3', topic: 'Basura o residuos', description: 'Hay residuos acumulados junto al canal que podrían impedir el escurrimiento.', point: { longitude: -60.7248, latitude: -31.6218 }, createdAt: 'Ayer · 11:10', status: 'reported' },
])
const waterVisible = computed(() => layers.value.find(layer => layer.id === 'water')?.enabled ?? true)
const reportsVisible = computed(() => layers.value.find(layer => layer.id === 'citizen-reports')?.enabled ?? true)

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

function addReport(form: CitizenReportForm) {
  reports.value.push({
    ...form,
    id: `demo-${Date.now()}`,
    createdAt: 'Recién agregado',
    status: 'reported',
  })
  const reportLayer = layers.value.find(layer => layer.id === 'citizen-reports')
  if (reportLayer) reportLayer.enabled = true
  reportLocation.value = null
}
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#dfe9e8]">
    <ClientOnly>
      <MapViewerClient
        :water-visible="waterVisible"
        :layers="layers"
        :reports="reports"
        :reports-visible="reportsVisible"
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

    <header class="surface-panel absolute inset-x-0 top-0 z-20 flex min-h-[98px] items-start justify-between gap-4 border-x-0 border-t-0 px-4 py-4 sm:inset-x-5 sm:top-5 sm:min-h-0 sm:rounded-2xl sm:border sm:px-5 sm:py-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 class="text-lg font-semibold leading-tight tracking-[-.025em] sm:text-[1.35rem]">Mapa de riesgo hídrico de Santa Fe</h1>
          <span class="ui-label rounded-full border border-river/20 bg-river/8 px-2.5 py-1 text-[9px] text-river">Plano hidráulico · 2025</span>
        </div>
        <p class="mt-1.5 max-w-2xl text-[11px] leading-snug text-ink/55 sm:text-xs">Explorá el sistema de protección, escurrimiento y drenaje de la ciudad a partir del plano técnico suministrado.</p>
      </div>
      <div class="hidden shrink-0 items-center gap-2 text-[10px] text-ink/48 md:flex"><span class="size-1.5 rounded-full bg-river"/> Base simplificada · OpenFreeMap</div>
    </header>

    <MapLayersControl v-if="!reportOpen && !placingReport" v-model:open="layersOpen" :layers="layers" @toggle="toggleLayer" />
    <MapCitizenReportControl v-if="!layersOpen" v-model:open="reportOpen" :location="reportLocation" :selecting-location="placingReport" @request-location="requestReportLocation" @cancel-location="cancelReportLocation" @submit="addReport" />
    <MapInformationPanel v-if="!placingReport" v-model="infoOpen" />
    <MapElevationLegend v-if="!placingReport" :layers="layers" />
    <MapPointInfoPanel v-if="selectedPoint && !placingReport" :point="selectedPoint" @close="selectedPoint = null" />

    <div v-if="placingReport" class="pointer-events-none absolute inset-x-3 top-[116px] z-40 flex justify-center sm:top-[124px]">
      <div class="surface-panel pointer-events-auto flex w-full max-w-[560px] items-center gap-3 rounded-2xl p-3 shadow-xl sm:p-3.5">
        <span class="grid size-10 shrink-0 place-items-center rounded-full bg-[#d94841] text-white"><Crosshair :size="20"/></span>
        <div class="min-w-0 flex-1"><p class="text-xs font-semibold sm:text-sm">Marcá la ubicación exacta</p><p class="mt-0.5 text-[10px] leading-snug text-ink/52 sm:text-[11px]">Tocá o hacé clic sobre el punto del mapa donde está el problema.</p></div>
        <button class="shrink-0 rounded-lg px-2.5 py-2 text-[10px] font-semibold text-ink/55 transition hover:bg-mist" @click="cancelReportLocation">Cancelar</button>
      </div>
    </div>

    <div v-if="loadingLayerCount" class="surface-panel pointer-events-none absolute bottom-[66px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold"><LoaderCircle :size="14" class="animate-spin text-river"/> Cargando {{ loadingLayerCount === 1 ? 'capa' : `${loadingLayerCount} capas` }}…</div>
    <div v-else-if="layerError" class="surface-panel absolute bottom-[66px] left-1/2 z-30 flex w-[min(92%,420px)] -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold"><CircleAlert :size="15" class="shrink-0 text-[#b75e37]"/><span class="min-w-0 flex-1">{{ layerError }}</span><button class="grid size-6 shrink-0 place-items-center rounded-md hover:bg-mist" aria-label="Cerrar error" @click="layerError = ''"><X :size="13"/></button></div>

    <div v-if="!selectedPoint && !layersOpen && !reportOpen && !placingReport" class="pointer-events-none absolute bottom-[66px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-[10px] text-white/85 backdrop-blur sm:hidden">Tocá el mapa para consultar un punto</div>
  </div>
</template>
