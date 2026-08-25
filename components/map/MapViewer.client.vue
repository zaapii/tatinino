<script setup lang="ts">
import type { GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl'
import type { CitizenReport, MapLayerDefinition, MapPoint, MapSelection } from '~/types/map'

const emit = defineEmits<{
  pointSelected: [selection: MapSelection]
  reportLocationSelected: [point: MapPoint]
  ready: []
  loadingChange: [count: number]
  layerError: [message: string]
}>()

const props = defineProps<{
  waterVisible: boolean
  layers: MapLayerDefinition[]
  reports: CitizenReport[]
  reportsVisible: boolean
  placingReport: boolean
  reportLocation: MapPoint | null
}>()

const mapConfig = useMapConfig()
const mapElement = ref<HTMLDivElement | null>(null)
const loadingSources = new Set<string>()
const baseLayerIds: string[] = []
let map: MapLibreMap | undefined

const reportSourceId = 'citizen-reports'
const reportHaloLayerId = 'citizen-reports-halo'
const reportPointLayerId = 'citizen-reports-point'
const draftSourceId = 'citizen-report-draft'
const draftHaloLayerId = 'citizen-report-draft-halo'
const draftPointLayerId = 'citizen-report-draft-point'

const sourceIdFor = (id: string) => `hydraulic-${id}`
const styleIdsFor = (id: string): [string, string, string, string] => [
  `hydraulic-${id}-fill`,
  `hydraulic-${id}-line`,
  `hydraulic-${id}-point`,
  `hydraulic-${id}-label`,
]

function updateLoadingState() {
  emit('loadingChange', loadingSources.size)
}

function simplifyBaseMap() {
  if (!map?.isStyleLoaded()) return

  const unnecessaryDetail = /(building|housenumber|poi|aeroway|airport|railway|transit|shield)/i
  for (const layer of map.getStyle().layers ?? []) {
    if (unnecessaryDetail.test(layer.id)) {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
      continue
    }
    baseLayerIds.push(layer.id)
  }
}

function updateBaseVisibility(visible: boolean) {
  if (!map?.isStyleLoaded()) return
  for (const layerId of baseLayerIds) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function addHydraulicLayer(definition: MapLayerDefinition) {
  if (!map || !definition.source) return
  const sourceId = sourceIdFor(definition.id)
  const source = definition.source

  if (!map.getSource(sourceId)) {
    const configuredBase = mapConfig.externalSources.geojsonBaseUrl?.replace(/\/$/, '')
    const dataBase = configuredBase || '/data/hydraulics'
    map.addSource(sourceId, {
      type: 'geojson',
      data: `${dataBase}/${source.file}`,
      generateId: true,
    })
    loadingSources.add(sourceId)
    updateLoadingState()
  }

  const visibility: 'visible' | 'none' = definition.enabled ? 'visible' : 'none'
  const shared = { source: sourceId, minzoom: source.minZoom, layout: { visibility } }

  if (!map.getLayer(styleIdsFor(definition.id)[0])) {
    map.addLayer({
      ...shared,
      id: styleIdsFor(definition.id)[0],
      type: 'fill',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-color': source.color,
        'fill-opacity': source.fillOpacity ?? 0.12,
        'fill-outline-color': source.color,
      },
    })
  }

  if (!map.getLayer(styleIdsFor(definition.id)[1])) {
    map.addLayer({
      ...shared,
      id: styleIdsFor(definition.id)[1],
      type: 'line',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': source.color,
        'line-opacity': 0.9,
        'line-width': [
          'interpolate', ['linear'], ['zoom'],
          source.minZoom, Math.max(0.75, (source.lineWidth ?? 1.3) * 0.72),
          17, (source.lineWidth ?? 1.3) * 1.65,
        ],
        ...(source.dashed ? { 'line-dasharray': [2.2, 1.6] } : {}),
      },
    })
  }

  if (!map.getLayer(styleIdsFor(definition.id)[2])) {
    map.addLayer({
      ...shared,
      id: styleIdsFor(definition.id)[2],
      type: 'circle',
      filter: ['==', ['geometry-type'], 'Point'],
      paint: {
        'circle-color': source.color,
        'circle-radius': [
          'interpolate', ['linear'], ['zoom'],
          source.minZoom, Math.max(2, (source.pointRadius ?? 3.4) * 0.72),
          17, (source.pointRadius ?? 3.4) * 1.25,
        ],
        'circle-opacity': 0.9,
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 1.15,
      },
    })
  }

  if (definition.id === 'conduit-elevations' && !map.getLayer(styleIdsFor(definition.id)[3])) {
    map.addLayer({
      id: styleIdsFor(definition.id)[3],
      type: 'symbol',
      source: sourceId,
      minzoom: 14,
      filter: ['all', ['==', ['geometry-type'], 'Point'], ['has', 'display_label']],
      layout: {
        visibility,
        'text-field': ['get', 'display_label'],
        'text-font': ['Open Sans Regular'],
        'text-size': 10.5,
        'text-offset': [0, 1.15],
        'text-anchor': 'top',
        'text-padding': 5,
      },
      paint: {
        'text-color': source.color,
        'text-halo-color': 'rgba(255, 255, 255, 0.95)',
        'text-halo-width': 1.4,
      },
    })
  }
}

function reportGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.reports.map(report => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [report.point.longitude, report.point.latitude] },
      properties: {
        id: report.id,
        topic: report.topic,
        description: report.description,
        createdAt: report.createdAt,
        statusLabel: 'Reportado · sin verificar',
        photoName: report.photoName ?? '',
      },
    })),
  }
}

function draftGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.reportLocation
      ? [{
          type: 'Feature' as const,
          geometry: { type: 'Point' as const, coordinates: [props.reportLocation.longitude, props.reportLocation.latitude] },
          properties: {},
        }]
      : [],
  }
}

function addCitizenReportLayers() {
  if (!map) return
  if (!map.getSource(reportSourceId)) map.addSource(reportSourceId, { type: 'geojson', data: reportGeoJson() })

  if (!map.getLayer(reportHaloLayerId)) {
    map.addLayer({
      id: reportHaloLayerId,
      source: reportSourceId,
      type: 'circle',
      layout: { visibility: props.reportsVisible ? 'visible' : 'none' },
      paint: { 'circle-radius': 12, 'circle-color': '#d94841', 'circle-opacity': 0.18, 'circle-blur': 0.15 },
    })
  }
  if (!map.getLayer(reportPointLayerId)) {
    map.addLayer({
      id: reportPointLayerId,
      source: reportSourceId,
      type: 'circle',
      layout: { visibility: props.reportsVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 16, 8],
        'circle-color': '#d94841',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2.2,
      },
    })
  }

  if (!map.getSource(draftSourceId)) map.addSource(draftSourceId, { type: 'geojson', data: draftGeoJson() })
  if (!map.getLayer(draftHaloLayerId)) {
    map.addLayer({
      id: draftHaloLayerId,
      source: draftSourceId,
      type: 'circle',
      paint: { 'circle-radius': 18, 'circle-color': '#d94841', 'circle-opacity': 0.16 },
    })
  }
  if (!map.getLayer(draftPointLayerId)) {
    map.addLayer({
      id: draftPointLayerId,
      source: draftSourceId,
      type: 'circle',
      paint: { 'circle-radius': 8, 'circle-color': '#d94841', 'circle-stroke-color': '#ffffff', 'circle-stroke-width': 3 },
    })
  }
}

function updateReportData() {
  if (!map?.isStyleLoaded()) return
  ;(map.getSource(reportSourceId) as GeoJSONSource | undefined)?.setData(reportGeoJson())
}

function updateDraftData() {
  if (!map?.isStyleLoaded()) return
  ;(map.getSource(draftSourceId) as GeoJSONSource | undefined)?.setData(draftGeoJson())
}

function updateReportVisibility(visible: boolean) {
  if (!map?.isStyleLoaded()) return
  for (const layerId of [reportHaloLayerId, reportPointLayerId]) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function syncHydraulicLayers() {
  if (!map?.isStyleLoaded()) return

  for (const definition of props.layers) {
    if (!definition.source) continue
    if (definition.enabled) addHydraulicLayer(definition)

    for (const styleId of styleIdsFor(definition.id)) {
      if (map.getLayer(styleId)) map.setLayoutProperty(styleId, 'visibility', definition.enabled ? 'visible' : 'none')
    }
  }

  for (const layerId of [reportHaloLayerId, reportPointLayerId, draftHaloLayerId, draftPointLayerId]) {
    if (map.getLayer(layerId)) map.moveLayer(layerId)
  }
}

function renderedSelectableLayerIds() {
  if (!map) return []
  const hydraulic = props.layers.flatMap(layer => styleIdsFor(layer.id)).filter(id => map?.getLayer(id))
  return map.getLayer(reportPointLayerId) && props.reportsVisible ? [reportPointLayerId, ...hydraulic] : hydraulic
}

function selectableFeaturesNear(point: { x: number; y: number }, tolerance: number) {
  if (!map) return []
  const layers = renderedSelectableLayerIds()
  if (!layers.length) return []
  const bounds: [[number, number], [number, number]] = [
    [point.x - tolerance, point.y - tolerance],
    [point.x + tolerance, point.y + tolerance],
  ]
  return map.queryRenderedFeatures(bounds, { layers })
}

function featureInfo(feature: MapGeoJSONFeature) {
  const properties = Object.fromEntries(
    Object.entries(feature.properties ?? {}).filter((entry): entry is [string, string | number | boolean | null] => {
      const value = entry[1]
      return value === null || ['string', 'number', 'boolean'].includes(typeof value)
    }),
  )

  if (feature.source === reportSourceId) {
    return {
      layerId: reportSourceId,
      layerLabel: String(properties.topic ?? 'Reclamo ciudadano'),
      color: '#d94841',
      geometryType: feature.geometry.type,
      sourceFile: 'Sesión de demostración',
      properties,
    }
  }

  const layerId = feature.source.replace('hydraulic-', '')
  const definition = props.layers.find(layer => layer.id === layerId)
  if (!definition?.source) return undefined

  return {
    layerId,
    layerLabel: definition.label,
    color: definition.source.color,
    geometryType: feature.geometry.type,
    sourceFile: definition.source.file,
    properties,
  }
}

watch(() => props.waterVisible, updateBaseVisibility)
watch(() => props.reportsVisible, updateReportVisibility)
watch(() => props.reports.map(report => `${report.id}:${report.point.longitude}:${report.point.latitude}`).join('|'), updateReportData)
watch(() => props.reportLocation ? `${props.reportLocation.longitude}:${props.reportLocation.latitude}` : '', updateDraftData)
watch(() => props.placingReport, placing => {
  if (map) map.getCanvas().style.cursor = placing ? 'crosshair' : ''
})
watch(
  () => props.layers.map(layer => `${layer.id}:${layer.enabled}`).join('|'),
  syncHydraulicLayers,
)

onMounted(async () => {
  if (!mapElement.value) return
  const maplibregl = await import('maplibre-gl')
  maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs')
  map = new maplibregl.Map({
    container: mapElement.value,
    style: mapConfig.baseStyle,
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    attributionControl: false,
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

  map.once('load', () => {
    simplifyBaseMap()
    updateBaseVisibility(props.waterVisible)
    syncHydraulicLayers()
    addCitizenReportLayers()
    map?.fitBounds([[-60.764, -31.681], [-60.584, -31.553]], {
      padding: { top: 116, right: 24, bottom: 72, left: 24 },
      maxZoom: 12.15,
      duration: 0,
    })
    emit('ready')
  })

  map.on('sourcedata', event => {
    if (!event.sourceId?.startsWith('hydraulic-') || !event.isSourceLoaded) return
    loadingSources.delete(event.sourceId)
    updateLoadingState()
  })

  map.on('error', event => {
    const sourceId = 'sourceId' in event && typeof event.sourceId === 'string' ? event.sourceId : undefined
    if (!sourceId?.startsWith('hydraulic-')) return
    loadingSources.delete(sourceId)
    updateLoadingState()
    const layerId = sourceId.replace('hydraulic-', '')
    const label = props.layers.find(layer => layer.id === layerId)?.label ?? 'la capa seleccionada'
    emit('layerError', `No se pudo cargar ${label}. Reiniciá el servidor local o intentá nuevamente.`)
  })

  map.on('mousemove', event => {
    map!.getCanvas().style.cursor = props.placingReport
      ? 'crosshair'
      : selectableFeaturesNear(event.point, 4).length ? 'pointer' : ''
  })

  map.on('click', event => {
    if (props.placingReport) {
      emit('reportLocationSelected', { longitude: event.lngLat.lng, latitude: event.lngLat.lat })
      return
    }

    const feature = selectableFeaturesNear(event.point, 7)[0]
    emit('pointSelected', {
      longitude: event.lngLat.lng,
      latitude: event.lngLat.lat,
      feature: feature ? featureInfo(feature) : undefined,
    })
  })
})

onBeforeUnmount(() => map?.remove())
</script>

<template>
  <div ref="mapElement" class="h-full w-full bg-[#dbe8e7]" aria-label="Mapa interactivo del sistema hidráulico de Santa Fe Capital" />
</template>
