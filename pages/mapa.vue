<script setup lang="ts">
import { CircleAlert, Database, LoaderCircle, Radio, X } from 'lucide-vue-next'
import type { MapSelection } from '~/types/map'
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
const waterVisible = computed(() => layers.value.find(layer => layer.id === 'water')?.enabled ?? true)

watch(layersOpen, (open) => { if (open) reportOpen.value = false })
watch(reportOpen, (open) => { if (open) layersOpen.value = false })
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#dfe9e8]">
    <ClientOnly>
      <MapViewerClient :water-visible="waterVisible" :layers="layers" @ready="mapReady = true" @loading-change="loadingLayerCount = $event" @layer-error="layerError = $event" @point-selected="selectedPoint = $event" />
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
      <div class="hidden shrink-0 items-center gap-2 text-[10px] text-ink/48 md:flex"><span class="size-1.5 rounded-full bg-river"/> Mapa base OpenStreetMap</div>
    </header>

    <MapLayersControl v-if="!reportOpen" v-model:open="layersOpen" :layers="layers" @toggle="toggleLayer" />
    <MapCitizenReportControl v-if="!layersOpen" v-model:open="reportOpen" />
    <MapInformationPanel v-model="infoOpen" />
    <MapElevationLegend :layers="layers" />
    <MapPointInfoPanel v-if="selectedPoint" :point="selectedPoint" @close="selectedPoint = null" />

    <section v-if="!selectedPoint" class="surface-panel absolute right-3 top-[164px] z-20 w-[218px] rounded-xl p-3 sm:bottom-[58px] sm:right-[62px] sm:top-auto sm:w-[298px] sm:p-3.5">
      <div class="flex items-center gap-2"><Database :size="15" class="text-river"/><p class="text-[11px] font-semibold sm:text-xs">49.064 entidades CAD georreferenciadas</p></div>
      <p class="mt-2 text-[9px] leading-relaxed text-ink/48 sm:text-[10px]">13 conjuntos GeoJSON derivados del Plano Hidráulica Santa Fe, actualización 2025.</p>
      <p class="mt-2 border-t border-ink/8 pt-2 text-[9px] leading-relaxed text-ink/42">Proyección de origen asumida; requiere validación antes de un uso técnico.</p>
    </section>

    <div v-if="loadingLayerCount" class="surface-panel pointer-events-none absolute bottom-[66px] left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full px-3 py-2 text-[10px] font-semibold"><LoaderCircle :size="14" class="animate-spin text-river"/> Cargando {{ loadingLayerCount === 1 ? 'capa' : `${loadingLayerCount} capas` }}…</div>
    <div v-else-if="layerError" class="surface-panel absolute bottom-[66px] left-1/2 z-30 flex w-[min(92%,420px)] -translate-x-1/2 items-center gap-2 rounded-xl px-3 py-2 text-[10px] font-semibold"><CircleAlert :size="15" class="shrink-0 text-[#b75e37]"/><span class="min-w-0 flex-1">{{ layerError }}</span><button class="grid size-6 shrink-0 place-items-center rounded-md hover:bg-mist" aria-label="Cerrar error" @click="layerError = ''"><X :size="13"/></button></div>

    <div v-if="!selectedPoint && !layersOpen && !reportOpen" class="pointer-events-none absolute bottom-[66px] left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-[10px] text-white/85 backdrop-blur sm:hidden">Tocá el mapa para consultar un punto</div>
  </div>
</template>
