<script setup lang="ts">
import type { Map as MapLibreMap } from 'maplibre-gl'
import type { MapPoint } from '~/types/map'

const emit = defineEmits<{
  pointSelected: [point: MapPoint]
  ready: []
}>()

const props = defineProps<{ waterVisible: boolean }>()
const mapElement = ref<HTMLDivElement | null>(null)
let map: MapLibreMap | undefined

function updateWaterVisibility(visible: boolean) {
  if (!map?.isStyleLoaded()) return
  for (const layer of map.getStyle().layers ?? []) {
    if (layer.id.toLowerCase().includes('water')) {
      map.setLayoutProperty(layer.id, 'visibility', visible ? 'visible' : 'none')
    }
  }
}

watch(() => props.waterVisible, updateWaterVisibility)

onMounted(async () => {
  if (!mapElement.value) return
  const maplibregl = await import('maplibre-gl')
  const config = useMapConfig()
  map = new maplibregl.Map({
    container: mapElement.value,
    style: config.baseStyle,
    center: config.center,
    zoom: config.zoom,
    minZoom: config.minZoom,
    maxZoom: config.maxZoom,
    attributionControl: false,
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')
  map.once('load', () => {
    updateWaterVisibility(props.waterVisible)
    emit('ready')
  })
  map.on('click', event => {
    emit('pointSelected', { longitude: event.lngLat.lng, latitude: event.lngLat.lat })
  })
})

onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="mapElement" class="h-full w-full bg-[#dbe8e7]" aria-label="Mapa interactivo de Santa Fe Capital" />
</template>
