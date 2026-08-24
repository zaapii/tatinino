<script setup lang="ts">
import { SlidersHorizontal, LockKeyhole, Radio } from 'lucide-vue-next'
import type { MapPoint } from '~/types/map'
import MapViewerClient from '~/components/map/MapViewer.client.vue'

useSeoMeta({
  title: 'Mapa de cotas',
  description: 'Mapa interactivo para comprender el terreno y el riesgo hídrico en Santa Fe Capital.',
})

const { layers, toggleLayer } = useMapLayers()
const selectedPoint = ref<MapPoint | null>(null)
const layersOpen = ref(false)
const infoOpen = ref(false)
const mapReady = ref(false)
const waterVisible = computed(() => layers.value.find(layer => layer.id === 'water')?.enabled ?? true)
</script>

<template>
  <div class="relative h-full overflow-hidden bg-[#dfe9e8]">
    <ClientOnly>
      <MapViewerClient :water-visible="waterVisible" @ready="mapReady = true" @point-selected="selectedPoint = $event" />
      <template #fallback><div class="h-full w-full animate-pulse bg-[#dfe9e8]" /></template>
    </ClientOnly>

    <div v-if="!mapReady" class="pointer-events-none absolute inset-0 z-10 grid place-items-center bg-[#e8f0ef]">
      <div class="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-semibold shadow-sm"><Radio :size="15" class="animate-pulse text-river"/> Preparando el mapa…</div>
    </div>

    <header class="surface-panel absolute inset-x-0 top-0 z-20 flex min-h-[98px] items-start justify-between gap-4 border-x-0 border-t-0 px-4 py-4 sm:inset-x-5 sm:top-5 sm:min-h-0 sm:rounded-2xl sm:border sm:px-5 sm:py-4">
      <div class="min-w-0">
        <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h1 class="text-lg font-semibold leading-tight tracking-[-.025em] sm:text-[1.35rem]">Mapa de cotas de Santa Fe</h1>
          <span class="ui-label rounded-full border border-sand/60 bg-[#fff8e9] px-2.5 py-1 text-[9px] text-[#87590f]">MVP · Datos en preparación</span>
        </div>
        <p class="mt-1.5 max-w-2xl text-[11px] leading-snug text-ink/55 sm:text-xs">Visualización del terreno y herramientas para comprender el riesgo hídrico.</p>
      </div>
      <div class="hidden shrink-0 items-center gap-2 text-[10px] text-ink/48 md:flex"><span class="size-1.5 rounded-full bg-river"/> Mapa base OpenStreetMap</div>
    </header>

    <MapLayersControl v-model:open="layersOpen" :layers="layers" @toggle="toggleLayer" />
    <MapInformationPanel v-model="infoOpen" />
    <MapElevationLegend />
    <MapPointInfo v-if="selectedPoint" :point="selectedPoint" @close="selectedPoint = null" />

    <section v-if="!selectedPoint" class="surface-panel absolute right-3 top-[164px] z-20 w-[230px] rounded-xl p-3 sm:bottom-[58px] sm:right-[62px] sm:top-auto sm:w-[310px] sm:p-3.5">
      <div class="flex items-center gap-2"><SlidersHorizontal :size="15" class="text-river"/><p class="text-[11px] font-semibold sm:text-xs">Visualizar terrenos debajo de una cota</p></div>
      <div class="mt-2.5 flex items-center gap-2">
        <LockKeyhole :size="13" class="shrink-0 text-ink/35"/>
        <input disabled type="range" min="0" max="100" value="50" class="h-1 w-full cursor-not-allowed accent-river opacity-30" aria-label="Selector de cota no disponible">
      </div>
      <p class="mt-2 hidden text-[10px] leading-relaxed text-ink/44 sm:block">Permitirá resaltar las áreas que se encuentren debajo del valor elegido.</p>
      <p class="mt-1 text-[9px] font-medium text-ink/48 sm:text-[10px]">Disponible cuando se incorporen los datos de elevación.</p>
    </section>

    <div class="pointer-events-none absolute bottom-3 left-1/2 z-10 -translate-x-1/2 rounded-full bg-ink/80 px-3 py-1.5 text-[10px] text-white/85 backdrop-blur sm:hidden">Tocá el mapa para consultar un punto</div>
  </div>
</template>
