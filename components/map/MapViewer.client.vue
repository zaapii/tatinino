<script setup lang="ts">
import type { ExpressionSpecification, GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl'
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
let resizeObserver: ResizeObserver | undefined

const reportSourceId = 'citizen-reports'
const reportHaloLayerId = 'citizen-reports-halo'
const reportPointLayerId = 'citizen-reports-point'
const draftSourceId = 'citizen-report-draft'
const draftHaloLayerId = 'citizen-report-draft-halo'
const draftPointLayerId = 'citizen-report-draft-point'

const reportStatusLabels: Record<CitizenReport['status'], string> = {
  reported: 'Reportado · sin verificar',
  verified: 'Verificado',
  in_progress: 'En intervención',
  resolved: 'Resuelto',
  dismissed: 'Descartado',
}

type ReportIconKind = 'storm-drain' | 'waste' | 'flooded-street' | 'drainage' | 'defense' | 'other'

const reportIcons: Array<{ id: string, topic: string, kind: ReportIconKind }> = [
  { id: 'report-marker-storm-drain', topic: 'Boca de tormenta obstruida', kind: 'storm-drain' },
  { id: 'report-marker-waste', topic: 'Basura o residuos', kind: 'waste' },
  { id: 'report-marker-flooded-street', topic: 'Calle anegada', kind: 'flooded-street' },
  { id: 'report-marker-drainage', topic: 'Canal o desagüe', kind: 'drainage' },
  { id: 'report-marker-defense', topic: 'Defensa o terraplén', kind: 'defense' },
  { id: 'report-marker-other', topic: 'Otro', kind: 'other' },
]

function drawWave(context: CanvasRenderingContext2D, y: number) {
  context.beginPath()
  context.moveTo(15, y)
  context.bezierCurveTo(18, y - 2.5, 20, y + 2.5, 23, y)
  context.bezierCurveTo(26, y - 2.5, 28, y + 2.5, 31, y)
  context.stroke()
}

function drawReportGlyph(context: CanvasRenderingContext2D, kind: ReportIconKind) {
  context.strokeStyle = '#9f302d'
  context.fillStyle = '#9f302d'
  context.lineWidth = 2
  context.lineCap = 'round'
  context.lineJoin = 'round'

  if (kind === 'storm-drain') {
    context.strokeRect(15, 15, 16, 13)
    for (const x of [19, 23, 27]) {
      context.beginPath()
      context.moveTo(x, 17)
      context.lineTo(x, 26)
      context.stroke()
    }
    return
  }

  if (kind === 'waste') {
    context.strokeRect(17, 17, 12, 12)
    context.beginPath()
    context.moveTo(15, 16)
    context.lineTo(31, 16)
    context.moveTo(20, 13.5)
    context.lineTo(26, 13.5)
    context.moveTo(20, 20)
    context.lineTo(20, 26)
    context.moveTo(26, 20)
    context.lineTo(26, 26)
    context.stroke()
    return
  }

  if (kind === 'flooded-street') {
    drawWave(context, 18)
    drawWave(context, 23)
    drawWave(context, 28)
    return
  }

  if (kind === 'drainage') {
    context.beginPath()
    context.moveTo(23, 13)
    context.lineTo(23, 29)
    context.moveTo(23, 20)
    context.lineTo(16, 16)
    context.moveTo(23, 23)
    context.lineTo(30, 19)
    context.stroke()
    context.beginPath()
    context.moveTo(20, 27)
    context.lineTo(23, 30)
    context.lineTo(26, 27)
    context.stroke()
    return
  }

  if (kind === 'defense') {
    context.beginPath()
    context.moveTo(14, 29)
    context.lineTo(23, 14)
    context.lineTo(32, 29)
    context.closePath()
    context.stroke()
    context.beginPath()
    context.moveTo(18, 25)
    context.lineTo(28, 25)
    context.moveTo(20, 21)
    context.lineTo(26, 21)
    context.stroke()
    return
  }

  context.beginPath()
  context.moveTo(23, 15)
  context.lineTo(23, 24)
  context.stroke()
  context.beginPath()
  context.arc(23, 29, 1.25, 0, Math.PI * 2)
  context.fill()
}

function createReportIcon(kind: ReportIconKind) {
  const pixelRatio = 2
  const width = 46
  const height = 54
  const canvas = document.createElement('canvas')
  canvas.width = width * pixelRatio
  canvas.height = height * pixelRatio
  const context = canvas.getContext('2d')
  if (!context) throw new Error('No se pudo crear el marcador de reclamo.')
  context.scale(pixelRatio, pixelRatio)

  context.shadowColor = 'rgba(9, 34, 53, .25)'
  context.shadowBlur = 4
  context.shadowOffsetY = 2
  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(23, 22, 21, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.moveTo(11, 37)
  context.lineTo(23, 53)
  context.lineTo(35, 37)
  context.closePath()
  context.fill()

  context.shadowColor = 'transparent'
  context.fillStyle = '#d94841'
  context.beginPath()
  context.arc(23, 22, 18, 0, Math.PI * 2)
  context.fill()
  context.beginPath()
  context.moveTo(13, 35)
  context.lineTo(23, 49)
  context.lineTo(33, 35)
  context.closePath()
  context.fill()

  context.fillStyle = '#ffffff'
  context.beginPath()
  context.arc(23, 22, 13.5, 0, Math.PI * 2)
  context.fill()
  drawReportGlyph(context, kind)

  return { image: context.getImageData(0, 0, canvas.width, canvas.height), pixelRatio }
}

function addReportIcons() {
  if (!map) return
  for (const definition of reportIcons) {
    if (map.hasImage(definition.id)) continue
    const { image, pixelRatio } = createReportIcon(definition.kind)
    map.addImage(definition.id, image, { pixelRatio })
  }
}

const reportIconExpression = [
  'match', ['get', 'topic'],
  ...reportIcons.flatMap(definition => [definition.topic, definition.id]),
  'report-marker-other',
] as unknown as ExpressionSpecification

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
        neighborhood: report.neighborhood ?? '',
        createdAt: report.createdAt,
        statusLabel: reportStatusLabels[report.status],
        photoName: report.photoName ?? '',
        photoUrl: report.photoUrl ?? '',
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
  addReportIcons()
  if (!map.getSource(reportSourceId)) map.addSource(reportSourceId, { type: 'geojson', data: reportGeoJson() })
  else updateReportData()

  if (!map.getLayer(reportHaloLayerId)) {
    map.addLayer({
      id: reportHaloLayerId,
      source: reportSourceId,
      type: 'circle',
      layout: { visibility: props.reportsVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 16, 16, 23],
        'circle-color': '#d94841',
        'circle-opacity': 0.2,
        'circle-blur': 0.35,
      },
    })
  }
  if (!map.getLayer(reportPointLayerId)) {
    map.addLayer({
      id: reportPointLayerId,
      source: reportSourceId,
      type: 'symbol',
      layout: {
        visibility: props.reportsVisible ? 'visible' : 'none',
        'icon-image': reportIconExpression,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.72, 13, 0.86, 17, 1],
        'icon-anchor': 'bottom',
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
        'icon-padding': 2,
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
  if (!map) return
  ;(map.getSource(reportSourceId) as GeoJSONSource | undefined)?.setData(reportGeoJson())
}

function updateDraftData() {
  if (!map) return
  ;(map.getSource(draftSourceId) as GeoJSONSource | undefined)?.setData(draftGeoJson())
}

function updateReportVisibility(visible: boolean) {
  if (!map?.isStyleLoaded()) return
  for (const layerId of [reportHaloLayerId, reportPointLayerId]) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function updateHydraulicLayerVisibility(layerId: string) {
  if (!map?.isStyleLoaded()) return
  const definition = props.layers.find(layer => layer.id === layerId)
  if (!definition) return

  for (const styleId of styleIdsFor(layerId)) {
    if (map.getLayer(styleId)) map.setLayoutProperty(styleId, 'visibility', definition.enabled ? 'visible' : 'none')
  }
}

function refreshMapRendering() {
  if (!map?.isStyleLoaded()) return
  map.resize()
  syncHydraulicLayers()
  updateReportData()
  updateDraftData()
  updateReportVisibility(props.reportsVisible)
  map.triggerRepaint()
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
      sourceFile: 'Registro público de reclamos ciudadanos',
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
    requestAnimationFrame(() => requestAnimationFrame(refreshMapRendering))
    map?.once('idle', refreshMapRendering)
    emit('ready')
  })

  map.on('sourcedata', event => {
    if (!event.sourceId?.startsWith('hydraulic-') || !event.isSourceLoaded) return
    loadingSources.delete(event.sourceId)
    updateLoadingState()
    updateHydraulicLayerVisibility(event.sourceId.replace('hydraulic-', ''))
    map?.triggerRepaint()
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

  resizeObserver = new ResizeObserver(() => {
    requestAnimationFrame(() => map?.resize())
  })
  resizeObserver.observe(mapElement.value)
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
  map?.remove()
})
</script>

<template>
  <div ref="mapElement" class="h-full w-full bg-[#dbe8e7]" aria-label="Mapa interactivo del sistema hidráulico de Santa Fe Capital" />
</template>
