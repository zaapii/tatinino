<script setup lang="ts">
import type { ExpressionSpecification, FilterSpecification, GeoJSONSource, Map as MapLibreMap, MapGeoJSONFeature } from 'maplibre-gl'
import type { CitizenReport, MapLayerDefinition, MapPoint, MapSelection, RiverLevelReading } from '~/types/map'
import { citizenReportCategories, citizenReportSeverities, citizenReportSeverity, type CitizenReportSeverity } from '~/utils/citizenReportCategories'
import MapPointInfoPanel from '~/components/map/MapPointInfo.vue'
import type { Popup } from 'maplibre-gl'
import { reportDesignIcons } from '~/utils/reportDesign'
import { SATELLITE_SERVICE, satelliteCaptureLabel } from '~/utils/satelliteImagery'

const emit = defineEmits<{
  pointSelected: [selection: MapSelection]
  selectionClosed: []
  reportLocationSelected: [point: MapPoint]
  ready: []
  loadingChange: [count: number]
  layerError: [message: string]
}>()

const props = defineProps<{
  selectedReport: MapSelection | null
  baseMap: 'simple' | 'satellite'
  waterVisible: boolean
  layers: MapLayerDefinition[]
  reports: CitizenReport[]
  reportsVisible: boolean
  riverLevels: RiverLevelReading[]
  riverLevelsVisible: boolean
  placingReport: boolean
  reportLocation: MapPoint | null
}>()

const mapConfig = useMapConfig()
const mapElement = shallowRef<HTMLDivElement | null>(null)
const loadingSources = new Set<string>()
const baseLayerIds: string[] = []
let map: MapLibreMap | undefined
let resizeObserver: ResizeObserver | undefined
let resizeFrame: number | undefined
let styleReady = false
const satelliteDate = ref('Consultando fecha…')
let imageryTimer: ReturnType<typeof setTimeout> | undefined
let imageryRequest: AbortController | undefined
let reportPulseTimer: ReturnType<typeof setInterval> | undefined

function scheduleImageryDate() {
  clearTimeout(imageryTimer)
  imageryRequest?.abort()
  imageryRequest = undefined
  satelliteDate.value = 'Consultando fecha…'
  if (!map || !styleReady || props.baseMap !== 'satellite' || !props.waterVisible) return
  imageryTimer = setTimeout(() => void fetchImageryDate(), 350)
}

async function fetchImageryDate() {
  if (!map || !styleReady) return
  const request = new AbortController()
  imageryRequest = request
  const timeout = setTimeout(() => request.abort(), 8000)
  const center = map.getCenter()
  const point = props.selectedReport ?? { longitude: center.lng, latitude: center.lat }
  const bounds = map.getBounds()
  const canvas = map.getCanvas()
  const params = new URLSearchParams({
    f: 'json', geometry: `${point.longitude},${point.latitude}`, geometryType: 'esriGeometryPoint', sr: '4326',
    mapExtent: `${bounds.getWest()},${bounds.getSouth()},${bounds.getEast()},${bounds.getNorth()}`,
    imageDisplay: `${canvas.clientWidth},${canvas.clientHeight},96`, tolerance: '0', returnGeometry: 'false',
    layers: 'visible:5,6,7,8,9,10,11,12,13,14,15,16,17,18',
  })
  try {
    const response = await fetch(`${SATELLITE_SERVICE}/identify?${params}`, { signal: request.signal })
    if (!response.ok) throw new Error('Metadata unavailable')
    const data = await response.json()
    if (data.error || !Array.isArray(data.results)) throw new Error('Invalid metadata')
    if (imageryRequest === request && !request.signal.aborted) satelliteDate.value = satelliteCaptureLabel(data.results)
  }
  catch {
    if (imageryRequest === request) satelliteDate.value = 'Fecha no disponible'
  }
  finally { clearTimeout(timeout) }
}
let reportPopup: Popup | undefined
let popupResizeObserver: ResizeObserver | undefined
let createPopup: (() => Popup) | undefined
const popupHost = shallowRef<HTMLElement | null>(null)

function closeReportPopup() {
  popupResizeObserver?.disconnect()
  popupResizeObserver = undefined
  reportPopup?.off('close', onPopupClosed)
  reportPopup?.remove()
  reportPopup = undefined
  popupHost.value = null
}

function onPopupClosed() {
  closeReportPopup()
  emit('selectionClosed')
}

function syncReportPopup() {
  const selection = props.selectedReport
  if (!selection) {
    closeReportPopup()
    return
  }
  if (!map || !styleReady || !createPopup) return
  closeReportPopup()
  if (!reportPopup) {
    popupHost.value = document.createElement('div')
    reportPopup = createPopup().setDOMContent(popupHost.value)
      .setLngLat([selection.longitude, selection.latitude]).addTo(map)
    reportPopup.on('close', onPopupClosed)
    popupResizeObserver = new ResizeObserver(() => {
      if (!reportPopup || !props.selectedReport || !map || !popupHost.value) return
      reportPopup.setLngLat([props.selectedReport.longitude, props.selectedReport.latitude])
      const card = popupHost.value.getBoundingClientRect()
      const bounds = map.getContainer().getBoundingClientRect()
      const topMargin = window.innerWidth >= 768 ? 130 : 12
      const dx = card.left < bounds.left + 12 ? card.left - bounds.left - 12
        : card.right > bounds.right - 12 ? card.right - bounds.right + 12 : 0
      const dy = card.top < bounds.top + topMargin ? card.top - bounds.top - topMargin : 0
      if (dx || dy) map.panBy([dx, dy], { duration: 0 })
    })
    popupResizeObserver.observe(popupHost.value)
  }
  else reportPopup.setLngLat([selection.longitude, selection.latitude])
}

function updateBaseMap() {
  scheduleImageryDate()
  if (!map || !styleReady) return
  if (props.baseMap === 'satellite' && !map.getSource('satellite')) {
    map.addSource('satellite', {
      type: 'raster',
      tiles: [`${SATELLITE_SERVICE}/tile/{z}/{y}/{x}`],
      tileSize: 256,
      maxzoom: 19,
      attribution: 'Tiles &copy; Esri — Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    })
    const firstOverlay = map.getStyle().layers.find(layer => !initialBaseLayers.has(layer.id))?.id
    map.addLayer({ id: 'satellite', type: 'raster', source: 'satellite' }, firstOverlay)
  }
  if (map.getLayer('satellite')) map.setLayoutProperty('satellite', 'visibility', props.baseMap === 'satellite' && props.waterVisible ? 'visible' : 'none')
}
const initialBaseLayers = new Set<string>()

const reportSourceId = 'citizen-reports'
const reportHaloLayerId = 'citizen-reports-halo'
const reportPointLayerId = 'citizen-reports-point'
const riverLevelSourceId = 'river-levels'
const riverLevelHaloLayerId = 'river-levels-halo'
const riverLevelPointLayerId = 'river-levels-point'
const riverLevelLabelLayerId = 'river-levels-label'
const riverLevelAlertLabelLayerId = 'river-levels-alert-label'
const riverLevelEvacuationLabelLayerId = 'river-levels-evacuation-label'
const riverLevelReferenceLayerId = 'river-levels-reference-label'
const riverLevelReferencePointSourceId = 'river-level-reference-points'
const riverLevelReferencePointLayerId = 'river-level-reference-points-symbol'
const riverLevelMarkerImageId = 'river-level-marker'
const draftSourceId = 'citizen-report-draft'
const draftHaloLayerId = 'citizen-report-draft-halo'
const draftPointLayerId = 'citizen-report-draft-point'

const reportStatusLabels: Record<CitizenReport['status'], string> = {
  pending: 'Pendiente de revisión',
  approved: 'Aprobado para publicación',
  rejected: 'Rechazado',
}

const riverStatusLabels: Record<RiverLevelReading['status'], string> = {
  low: 'Aguas bajas',
  normal: 'Por debajo del nivel de alerta',
  alert: 'Nivel de alerta alcanzado',
  evacuation: 'Nivel de evacuación alcanzado',
  unknown: 'Estado no disponible',
}

const riverStatusColors: Record<RiverLevelReading['status'], string> = {
  low: '#d59a27',
  normal: '#0877ad',
  alert: '#df7626',
  evacuation: '#c43d38',
  unknown: '#78909c',
}

const riverReferenceDefinitions: Array<{ readingId: string, mapNames: string[], points: [number, number][] }> = [
  { readingId: 'parana', mapNames: ['Río Paraná'], points: [[-60.573, -31.574], [-60.565, -31.684]] },
  { readingId: 'santa-fe', mapNames: ['Laguna Setúbal'], points: [[-60.668, -31.602], [-60.676, -31.664]] },
  { readingId: 'salado-recreo', mapNames: ['Río Salado'], points: [[-60.748, -31.583], [-60.771, -31.689]] },
  { readingId: 'colastine-rn-168', mapNames: ['Río Colastiné'], points: [[-60.615, -31.592], [-60.603, -31.665]] },
]

const levelFormatter = new Intl.NumberFormat('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const riverDateFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })
const riverDateTimeFormatter = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })

function levelLabel(value: number | null) {
  return value === null ? 'Sin dato' : `${levelFormatter.format(value)} m`
}

function trendLabel(reading: RiverLevelReading) {
  if (reading.level === null || reading.previousLevel === null || reading.trend === 'unknown') return 'Sin tendencia disponible'
  const difference = reading.level - reading.previousLevel
  if (reading.trend === 'rising') return `Sube ${levelFormatter.format(Math.abs(difference))} m`
  if (reading.trend === 'falling') return `Baja ${levelFormatter.format(Math.abs(difference))} m`
  return 'Permanece estable'
}

function riverReadingProperties(reading: RiverLevelReading) {
  return {
    id: reading.id,
    riverName: reading.riverName,
    stationName: reading.stationName,
    mapTitleLabel: `${reading.riverName} · ${reading.mapLabel}`,
    levelLabel: levelLabel(reading.level),
    observedAtLabel: reading.observedAt ? riverDateFormatter.format(new Date(reading.observedAt)) : 'Sin registro reciente',
    updatedAtLabel: reading.updatedAt ? riverDateTimeFormatter.format(new Date(reading.updatedAt)) : '',
    trendLabel: trendLabel(reading),
    riverStatusLabel: reading.lowWaterLevel === null && reading.alertLevel === null && reading.evacuationLevel === null
      ? 'Sin umbrales oficiales publicados'
      : riverStatusLabels[reading.status],
    lowWaterLevelLabel: reading.lowWaterLevel === null ? '' : levelLabel(reading.lowWaterLevel),
    alertLevelLabel: reading.alertLevel === null ? '' : levelLabel(reading.alertLevel),
    evacuationLevelLabel: reading.evacuationLevel === null ? 'Sin umbral oficial publicado' : levelLabel(reading.evacuationLevel),
    alertMapLabel: reading.alertLevel === null ? 'Alerta s/d' : `Alerta ${levelLabel(reading.alertLevel)}`,
    evacuationMapLabel: reading.evacuationLevel === null ? 'Evac. s/d' : `Evac. ${levelLabel(reading.evacuationLevel)}`,
    sourceName: reading.sourceName,
    dataUrl: reading.dataUrl,
    isStale: reading.isStale,
    dataStateLabel: reading.error ? 'No se pudo consultar' : reading.isStale ? 'Dato con demora' : 'Último dato disponible',
    error: reading.error ?? '',
    markerColor: reading.isStale ? '#718792' : riverStatusColors[reading.status],
  }
}

function riverReferenceEntries() {
  return riverReferenceDefinitions
    .map(definition => ({ definition, reading: props.riverLevels.find(reading => reading.id === definition.readingId) }))
    .filter((entry): entry is { definition: typeof riverReferenceDefinitions[number], reading: RiverLevelReading } => Boolean(entry.reading?.level !== null && entry.reading?.level !== undefined))
}

function riverReferenceReading(name: string) {
  const definition = riverReferenceDefinitions.find(item => item.mapNames.includes(name))
  return definition ? props.riverLevels.find(reading => reading.id === definition.readingId) : undefined
}

function riverReferenceFilter(): FilterSpecification {
  const names = riverReferenceEntries().flatMap(entry => entry.definition.mapNames)
  return names.length
    ? ['in', ['get', 'name'], ['literal', names]]
    : ['==', 1, 0]
}

function riverReferenceTextExpression() {
  return [
    'match',
    ['get', 'name'],
    ...riverReferenceEntries().flatMap(({ definition, reading }) => [
      definition.mapNames,
      `${levelLabel(reading.level)} · ${reading.mapLabel}${reading.isStale ? ' · demorado' : ''}`,
    ]),
    '',
  ] as unknown as ExpressionSpecification
}

function riverReferenceColorExpression() {
  return [
    'match',
    ['get', 'name'],
    ...riverReferenceEntries().flatMap(({ definition, reading }) => [
      definition.mapNames,
      reading.isStale ? '#718792' : riverStatusColors[reading.status],
    ]),
    '#0877ad',
  ] as unknown as ExpressionSpecification
}

type ReportIconKind = 'drain' | 'storm-drain' | 'waste' | 'flooded-street' | 'drainage' | 'defense' | 'housing' | 'construction' | 'other'

const reportIconKinds: Record<string, ReportIconKind> = {
  'Desague tapado': 'drain',
  'Boca de tormenta obstruida': 'storm-drain',
  'Acumulación de basura': 'waste',
  'Calle inundada': 'flooded-street',
  'Canales o zanjones obstruidos': 'drainage',
  'Defensa o terraplén en mal estado': 'defense',
  'Población en zona de riesgo hídrico': 'housing',
  'Obra paralizada': 'construction',
  'Otro': 'other',
}

const reportIcons: Array<{ id: string, topic: string, kind: ReportIconKind, severity: CitizenReportSeverity }> = citizenReportCategories.map(category => ({
  id: `report-marker-${reportIconKinds[category.topic]}-${category.severity}`,
  topic: category.topic,
  kind: reportIconKinds[category.topic] ?? 'other',
  severity: category.severity,
}))

const fallbackReportIconId = 'report-marker-other-medio'

function reportMarkerColor(topic: string) {
  return citizenReportSeverities[citizenReportSeverity(topic)].color
}

function reportSeverityLabel(topic: string) {
  return citizenReportSeverities[citizenReportSeverity(topic)].label
}

function reportGlyphColor(severity: CitizenReportSeverity) {
  return citizenReportSeverities[severity].glyphColor
}

function reportFillColor(severity: CitizenReportSeverity) {
  return citizenReportSeverities[severity].color
}

const reportSeverityColorExpression = [
  'match', ['get', 'severity'],
  'grave', citizenReportSeverities.grave.color,
  citizenReportSeverities.medio.color,
] as unknown as ExpressionSpecification

function loadReportAsset(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('No se pudo cargar un icono del mapa.'))
    image.src = src
  })
}

function addReportIcons() {
  if (!map) return
  const currentMap = map
  for (const definition of reportIcons) {
    if (currentMap.hasImage(definition.id)) continue
    currentMap.addImage(definition.id, { width: 92, height: 92, data: new Uint8Array(92 * 92 * 4) }, { pixelRatio: 2 })
    const kind = definition.topic === 'Desague tapado' ? 'drain' : reportDesignIcons[definition.topic]
    // Keep the data's severity; illustration colors must not reclassify reports.
    const base = definition.severity === 'grave' ? 'grave' : 'medio'
    void Promise.all([
      loadReportAsset(`/figma/${base}.svg`),
      kind ? loadReportAsset(`/figma/${kind}-glyph.svg`) : Promise.resolve(null),
    ]).then(([background, glyph]) => {
      if (map !== currentMap || !currentMap.hasImage(definition.id)) return
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = 92
      const context = canvas.getContext('2d')
      if (!context) return
      context.drawImage(background, 0, 0, 92, 92)
      if (glyph) {
        if (kind === 'other') context.drawImage(glyph, 12, 6, 68, 68)
        else context.drawImage(glyph, 31, 32, 30, 30)
      }
      currentMap.updateImage(definition.id, context.getImageData(0, 0, 92, 92))
    }).catch(error => emit('layerError', error.message))
  }
}

const reportIconExpression = [
  'match', ['get', 'topic'],
  ...reportIcons.flatMap(definition => [definition.topic, definition.id]),
  fallbackReportIconId,
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
  if (!map || !styleReady) return

  const unnecessaryDetail = /(building|housenumber|poi|aeroway|airport|railway|transit|shield)/i
  for (const layer of map.getStyle().layers ?? []) {
    initialBaseLayers.add(layer.id)
    if (unnecessaryDetail.test(layer.id)) {
      map.setLayoutProperty(layer.id, 'visibility', 'none')
      continue
    }
    baseLayerIds.push(layer.id)
    if (/(water|waterway|ocean|lake|river)/i.test(layer.id)) {
      if (layer.type === 'fill') {
        map.setPaintProperty(layer.id, 'fill-color', '#a8d9ee')
        map.setPaintProperty(layer.id, 'fill-opacity', 0.82)
      }
      else if (layer.type === 'line') {
        map.setPaintProperty(layer.id, 'line-color', '#55b5dd')
        map.setPaintProperty(layer.id, 'line-opacity', 0.9)
      }
    }
  }
}

function startReportPulse() {
  if (!map || reportPulseTimer || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  let bright = true
  reportPulseTimer = setInterval(() => {
    if (!map?.getLayer(reportHaloLayerId)) return
    bright = !bright
    map.setPaintProperty(reportHaloLayerId, 'circle-opacity', bright ? 0.48 : 0.14)
  }, 850)
}

function updateBaseVisibility(visible: boolean) {
  if (!map || !styleReady) return
  for (const layerId of baseLayerIds) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
  updateBaseMap()
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
      data: source.dataUrl ?? `${dataBase}/${source.file}`,
      generateId: true,
    })
    loadingSources.add(sourceId)
    updateLoadingState()
  }

  const visibility: 'visible' | 'none' = definition.enabled ? 'visible' : 'none'
  const shared = { source: sourceId, minzoom: source.minZoom, layout: { visibility } }
  const lineGeometryFilter: FilterSpecification = definition.id === 'reservoirs'
    ? ['in', ['geometry-type'], ['literal', ['LineString', 'Polygon']]]
    : ['==', ['geometry-type'], 'LineString']

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
      filter: lineGeometryFilter,
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

  if (definition.id !== 'sub-basins' && !map.getLayer(styleIdsFor(definition.id)[2])) {
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
  else if (source.labelProperty && !map.getLayer(styleIdsFor(definition.id)[3])) {
    map.addLayer({
      id: styleIdsFor(definition.id)[3],
      type: 'symbol',
      source: sourceId,
      minzoom: source.labelMinZoom ?? 12,
      filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
      layout: {
        visibility,
        'text-field': ['get', source.labelProperty],
        'text-font': ['Open Sans Regular'],
        'text-size': 11,
        'text-padding': 8,
        'text-max-width': 12,
      },
      paint: {
        'text-color': '#62263f',
        'text-halo-color': 'rgba(255, 255, 255, 0.96)',
        'text-halo-width': 1.5,
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
        severity: citizenReportSeverity(report.topic),
        severityLabel: reportSeverityLabel(report.topic),
        markerColor: reportMarkerColor(report.topic),
      },
    })),
  }
}

function riverLevelGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: props.riverLevels.map(reading => ({
      type: 'Feature' as const,
      geometry: { type: 'Point' as const, coordinates: [reading.point.longitude, reading.point.latitude] },
      properties: riverReadingProperties(reading),
    })),
  }
}

function riverReferencePointGeoJson() {
  return {
    type: 'FeatureCollection' as const,
    features: riverReferenceDefinitions.flatMap(definition => {
      const reading = props.riverLevels.find(item => item.id === definition.readingId)
      if (!reading) return []
      return definition.points.map((coordinates, index) => ({
        type: 'Feature' as const,
        geometry: { type: 'Point' as const, coordinates },
        properties: { ...riverReadingProperties(reading), id: `${reading.id}-reference-${index}`, isRiverReference: true },
      }))
    }),
  }
}

function addRiverLevelMarkerImage() {
  if (!map || map.hasImage(riverLevelMarkerImageId)) return
  const currentMap = map
  currentMap.addImage(riverLevelMarkerImageId, { width: 92, height: 92, data: new Uint8Array(92 * 92 * 4) }, { pixelRatio: 2 })
  void loadReportAsset('/figma/river-level-marker.svg').then(image => {
    if (map !== currentMap || !currentMap.hasImage(riverLevelMarkerImageId)) return
    const canvas = document.createElement('canvas')
    canvas.width = canvas.height = 92
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(image, 0, 0, 92, 92)
    currentMap.updateImage(riverLevelMarkerImageId, context.getImageData(0, 0, 92, 92))
  }).catch(error => emit('layerError', error.message))
}

function addRiverLevelReferenceLayer() {
  if (!map || map.getLayer(riverLevelReferenceLayerId)) return
  map.addLayer({
    id: riverLevelReferenceLayerId,
    source: 'openmaptiles',
    'source-layer': 'waterway',
    type: 'symbol',
    minzoom: 10.25,
    filter: riverReferenceFilter(),
    layout: {
      visibility: props.riverLevelsVisible ? 'visible' : 'none',
      'symbol-placement': 'line',
      'symbol-spacing': 390,
      'text-field': riverReferenceTextExpression(),
      'text-font': ['Open Sans Regular'],
      'text-size': ['interpolate', ['linear'], ['zoom'], 10.25, 10, 14, 11.5],
      'text-letter-spacing': 0.02,
      'text-max-angle': 38,
      'text-padding': 16,
      'text-keep-upright': true,
      'text-allow-overlap': true,
      'text-ignore-placement': true,
      'text-rotation-alignment': 'map',
      'text-pitch-alignment': 'viewport',
    },
    paint: {
      'text-color': riverReferenceColorExpression(),
      'text-halo-color': 'rgba(255, 255, 255, .98)',
      'text-halo-width': 2.2,
      'text-halo-blur': 0.35,
    },
  })
}

function updateRiverLevelReferenceLayer() {
  if (!map?.getLayer(riverLevelReferenceLayerId)) return
  map.setFilter(riverLevelReferenceLayerId, riverReferenceFilter())
  map.setLayoutProperty(riverLevelReferenceLayerId, 'text-field', riverReferenceTextExpression())
  map.setPaintProperty(riverLevelReferenceLayerId, 'text-color', riverReferenceColorExpression())
}

function addRiverLevelLayers() {
  if (!map) return
  addRiverLevelMarkerImage()
  const visibility: 'visible' | 'none' = props.riverLevelsVisible ? 'visible' : 'none'
  if (!map.getSource(riverLevelSourceId)) map.addSource(riverLevelSourceId, { type: 'geojson', data: riverLevelGeoJson() })
  else updateRiverLevelData()

  if (!map.getLayer(riverLevelHaloLayerId)) {
    map.addLayer({
      id: riverLevelHaloLayerId,
      source: riverLevelSourceId,
      type: 'circle',
      layout: { visibility },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 15, 16, 22],
        'circle-color': ['get', 'markerColor'],
        'circle-opacity': 0.18,
        'circle-blur': 0.28,
      },
    })
  }
  if (!map.getLayer(riverLevelPointLayerId)) {
    map.addLayer({
      id: riverLevelPointLayerId,
      source: riverLevelSourceId,
      type: 'symbol',
      layout: {
        visibility,
        'icon-image': riverLevelMarkerImageId,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 9, 0.72, 16, 0.95],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })
  }
  if (!map.getLayer(riverLevelLabelLayerId)) {
    map.addLayer({
      id: riverLevelLabelLayerId,
      source: riverLevelSourceId,
      type: 'symbol',
      minzoom: 9,
      layout: {
        visibility,
        'text-field': ['concat', ['get', 'mapTitleLabel'], '\n', ['get', 'levelLabel']],
        'text-font': ['Open Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 10.5, 14, 12],
        'text-offset': [0, 1.35],
        'text-anchor': 'top',
        'text-line-height': 1.18,
        'text-max-width': 24,
        'text-padding': 4,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#092235',
        'text-halo-color': 'rgba(255, 255, 255, .96)',
        'text-halo-width': 2,
      },
    })
  }
  if (!map.getLayer(riverLevelAlertLabelLayerId)) {
    map.addLayer({
      id: riverLevelAlertLabelLayerId,
      source: riverLevelSourceId,
      type: 'symbol',
      minzoom: 9,
      layout: {
        visibility,
        'text-field': ['get', 'alertMapLabel'],
        'text-font': ['Open Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 9.5, 14, 11],
        'text-offset': [0, 4.55],
        'text-anchor': 'top',
        'text-padding': 4,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#c98a17',
        'text-halo-color': 'rgba(255, 255, 255, .98)',
        'text-halo-width': 2,
      },
    })
  }
  if (!map.getLayer(riverLevelEvacuationLabelLayerId)) {
    map.addLayer({
      id: riverLevelEvacuationLabelLayerId,
      source: riverLevelSourceId,
      type: 'symbol',
      minzoom: 9,
      layout: {
        visibility,
        'text-field': ['get', 'evacuationMapLabel'],
        'text-font': ['Open Sans Regular'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 9, 9.5, 14, 11],
        'text-offset': [0, 6.15],
        'text-anchor': 'top',
        'text-padding': 4,
        'text-allow-overlap': true,
        'text-ignore-placement': true,
      },
      paint: {
        'text-color': '#c83232',
        'text-halo-color': 'rgba(255, 255, 255, .98)',
        'text-halo-width': 2,
      },
    })
  }
  addRiverLevelReferenceLayer()
  if (!map.getSource(riverLevelReferencePointSourceId)) map.addSource(riverLevelReferencePointSourceId, { type: 'geojson', data: riverReferencePointGeoJson() })
  if (!map.getLayer(riverLevelReferencePointLayerId)) {
    map.addLayer({
      id: riverLevelReferencePointLayerId,
      source: riverLevelReferencePointSourceId,
      type: 'symbol',
      minzoom: 10,
      layout: {
        visibility,
        'icon-image': riverLevelMarkerImageId,
        'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.62, 16, 0.86],
        'icon-allow-overlap': true,
        'icon-ignore-placement': true,
      },
    })
  }
}

function updateRiverLevelData() {
  if (!map) return
  ;(map.getSource(riverLevelSourceId) as GeoJSONSource | undefined)?.setData(riverLevelGeoJson())
  ;(map.getSource(riverLevelReferencePointSourceId) as GeoJSONSource | undefined)?.setData(riverReferencePointGeoJson())
  updateRiverLevelReferenceLayer()
}

function updateRiverLevelVisibility(visible: boolean) {
  if (!map || !styleReady) return
  for (const layerId of [riverLevelHaloLayerId, riverLevelPointLayerId, riverLevelLabelLayerId, riverLevelAlertLabelLayerId, riverLevelEvacuationLabelLayerId, riverLevelReferenceLayerId, riverLevelReferencePointLayerId]) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
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
      filter: ['==', ['get', 'severity'], 'grave'],
      layout: { visibility: props.reportsVisible ? 'visible' : 'none' },
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 9, 21, 16, 31],
        'circle-color': reportSeverityColorExpression,
        'circle-opacity': 0.42,
        'circle-blur': 0.3,
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
  if (!map || !styleReady) return
  for (const layerId of [reportHaloLayerId, reportPointLayerId]) {
    if (map.getLayer(layerId)) map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
  }
}

function updateHydraulicLayerVisibility(layerId: string) {
  if (!map || !styleReady) return
  const definition = props.layers.find(layer => layer.id === layerId)
  if (!definition) return

  for (const styleId of styleIdsFor(layerId)) {
    if (map.getLayer(styleId)) map.setLayoutProperty(styleId, 'visibility', definition.enabled ? 'visible' : 'none')
  }
}

function refreshMapRendering() {
  if (!map || !styleReady) return
  map.resize()
  syncHydraulicLayers()
  updateReportVisibility(props.reportsVisible)
  updateRiverLevelVisibility(props.riverLevelsVisible)
  map.triggerRepaint()
}

function syncHydraulicLayers() {
  if (!map || !styleReady) return

  for (const definition of props.layers) {
    if (!definition.source) continue
    if (definition.enabled) addHydraulicLayer(definition)

    for (const styleId of styleIdsFor(definition.id)) {
      if (map.getLayer(styleId)) map.setLayoutProperty(styleId, 'visibility', definition.enabled ? 'visible' : 'none')
    }
  }

  for (const layerId of [riverLevelHaloLayerId, riverLevelPointLayerId, riverLevelLabelLayerId, riverLevelAlertLabelLayerId, riverLevelEvacuationLabelLayerId, riverLevelReferenceLayerId, riverLevelReferencePointLayerId, reportHaloLayerId, reportPointLayerId, draftHaloLayerId, draftPointLayerId]) {
    if (map.getLayer(layerId)) map.moveLayer(layerId)
  }
}

function renderedSelectableLayerIds() {
  if (!map) return []
  const hydraulic = props.layers.flatMap(layer => styleIdsFor(layer.id)).filter(id => map?.getLayer(id))
  const specialLayers: string[] = []
  if (map.getLayer(reportPointLayerId) && props.reportsVisible) specialLayers.push(reportPointLayerId)
  if (map.getLayer(riverLevelPointLayerId) && props.riverLevelsVisible) specialLayers.push(riverLevelPointLayerId, riverLevelReferencePointLayerId, riverLevelReferenceLayerId)
  return [...specialLayers, ...hydraulic]
}

function reportNear(point: { x: number; y: number }) {
  if (!map || !styleReady || !props.reportsVisible) return undefined
  const zoom = map.getZoom()
  const scale = zoom <= 9 ? 0.72 : zoom < 13 ? 0.72 + (zoom - 9) * 0.035 : zoom < 17 ? 0.86 + (zoom - 13) * 0.035 : 1
  // Icons are bottom-anchored: their visible body is above the geographic point.
  return props.reports.map(report => {
    const screen = map!.project([report.point.longitude, report.point.latitude])
    const dx = point.x - screen.x
    const dy = point.y - (screen.y - 27 * scale)
    return { report, dx, dy, distance: dx * dx + dy * dy }
  }).filter(hit => Math.abs(hit.dx) <= 23 * scale + 7 && Math.abs(hit.dy) <= 27 * scale + 7)
    .sort((a, b) => a.distance - b.distance)[0]?.report
}

function selectableFeaturesNear(point: { x: number; y: number }, tolerance: number) {
  if (!map || !styleReady) return []
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
      color: String(properties.markerColor ?? citizenReportSeverities.medio.color),
      geometryType: feature.geometry.type,
      sourceFile: 'Registro público de reclamos ciudadanos',
      properties,
    }
  }

  if (feature.layer.id === riverLevelReferenceLayerId) {
    const reading = riverReferenceReading(String(properties.name ?? ''))
    if (!reading) return undefined
    return {
      layerId: riverLevelSourceId,
      layerLabel: reading.riverName,
      color: reading.isStale ? '#718792' : riverStatusColors[reading.status],
      geometryType: feature.geometry.type,
      sourceFile: reading.dataUrl,
      properties: { ...riverReadingProperties(reading), isRiverReference: true },
    }
  }

  if (feature.source === riverLevelSourceId) {
    return {
      layerId: riverLevelSourceId,
      layerLabel: String(properties.riverName ?? 'Nivel del río'),
      color: String(properties.markerColor ?? '#0877ad'),
      geometryType: feature.geometry.type,
      sourceFile: String(properties.dataUrl ?? 'INA · Sistema de Información y Alerta Hidrológico'),
      properties,
    }
  }

  if (feature.source === riverLevelReferencePointSourceId) {
    return {
      layerId: riverLevelSourceId,
      layerLabel: String(properties.riverName ?? 'Nivel del río'),
      color: '#55c3e9',
      geometryType: feature.geometry.type,
      sourceFile: String(properties.dataUrl ?? ''),
      properties,
    }
  }

  const layerId = feature.source.replace('hydraulic-', '')
  const definition = props.layers.find(layer => layer.id === layerId)
  if (!definition?.source) return undefined

  return {
    layerId,
    layerLabel: layerId === 'renabap-neighborhoods' ? String(properties.barrio ?? definition.label) : definition.label,
    color: definition.source.color,
    geometryType: feature.geometry.type,
    sourceFile: definition.source.dataUrl ?? definition.source.file,
    properties,
  }
}

watch(() => props.waterVisible, updateBaseVisibility)
watch(() => props.selectedReport, syncReportPopup)
watch(() => props.selectedReport, scheduleImageryDate)
watch(() => props.baseMap, updateBaseMap)
watch(() => props.reportsVisible, updateReportVisibility)
watch(() => props.riverLevelsVisible, updateRiverLevelVisibility)
watch(() => props.reports.map(report => `${report.id}:${report.point.longitude}:${report.point.latitude}`).join('|'), updateReportData)
watch(() => props.riverLevels.map(reading => `${reading.id}:${reading.level}:${reading.observedAt}:${reading.isStale}:${reading.alertLevel}:${reading.evacuationLevel}`).join('|'), updateRiverLevelData)
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
  if (!mapElement.value) return
  createPopup = () => new maplibregl.Popup({
    closeButton: false,
    closeOnClick: false,
    anchor: 'bottom',
    maxWidth: 'min(348px, calc(100vw - 32px))',
    className: 'citizen-report-popover',
    offset: [0, -42],
  })
  maplibregl.setWorkerUrl('/vendor/maplibre-gl-worker.mjs')
  map = new maplibregl.Map({
    container: mapElement.value,
    style: mapConfig.baseStyle,
    center: mapConfig.center,
    zoom: mapConfig.zoom,
    minZoom: mapConfig.minZoom,
    maxZoom: mapConfig.maxZoom,
    attributionControl: false,
    clickTolerance: 7,
  })
  map.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')
  map.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

  map.once('load', () => {
    styleReady = true
    simplifyBaseMap()
    updateBaseVisibility(props.waterVisible)
    syncHydraulicLayers()
    addCitizenReportLayers()
    startReportPulse()
    addRiverLevelLayers()
    updateBaseMap()
    const mobile = window.innerWidth < 640
    map?.fitBounds(mobile ? [[-60.78, -31.72], [-60.62, -31.55]] : [[-60.82, -31.76], [-60.55, -31.49]], {
      padding: { top: mobile ? 72 : 116, right: 24, bottom: 72, left: 24 },
      maxZoom: mobile ? 13 : 12.55,
      duration: 0,
    })
    requestAnimationFrame(() => requestAnimationFrame(refreshMapRendering))
    map?.once('idle', refreshMapRendering)
    emit('ready')
    syncReportPopup()
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
      : reportNear(event.point) || selectableFeaturesNear(event.point, 4).length ? 'pointer' : ''
  })

  map.on('moveend', scheduleImageryDate)
  map.on('resize', scheduleImageryDate)

  map.on('click', event => {
    if (props.placingReport) {
      emit('reportLocationSelected', { longitude: event.lngLat.lng, latitude: event.lngLat.lat })
      return
    }

    const report = reportNear(event.point)
    if (report) {
      emit('pointSelected', {
        ...report.point,
        feature: {
          layerId: reportSourceId,
          layerLabel: report.topic,
          color: reportMarkerColor(report.topic),
          geometryType: 'Point',
          sourceFile: 'Registro público de reclamos ciudadanos',
          properties: reportGeoJson().features.find(feature => feature.properties.id === report.id)!.properties,
        },
      })
      return
    }
    const feature = selectableFeaturesNear(event.point, 7)[0]
    if (!feature) return
    const featureCoordinates = feature?.geometry.type === 'Point'
      ? feature.geometry.coordinates
      : null
    emit('pointSelected', {
      longitude: featureCoordinates?.[0] ?? event.lngLat.lng,
      latitude: featureCoordinates?.[1] ?? event.lngLat.lat,
      feature: feature ? featureInfo(feature) : undefined,
    })
  })

  resizeObserver = new ResizeObserver(() => {
    if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame)
    resizeFrame = requestAnimationFrame(() => {
      map?.resize()
      resizeFrame = undefined
    })
  })
  resizeObserver.observe(mapElement.value)
})

onBeforeUnmount(() => {
  clearTimeout(imageryTimer)
  if (reportPulseTimer) clearInterval(reportPulseTimer)
  imageryRequest?.abort()
  imageryRequest = undefined
  closeReportPopup()
  styleReady = false
  resizeObserver?.disconnect()
  if (resizeFrame !== undefined) cancelAnimationFrame(resizeFrame)
  map?.remove()
})
</script>

<template>
  <div ref="mapElement" class="h-full w-full bg-[#dbe8e7]" aria-label="Mapa interactivo del sistema hidráulico de Santa Fe Capital" />
  <Teleport v-if="popupHost && selectedReport" :to="popupHost">
    <MapPointInfoPanel :point="selectedReport" popover @close="onPopupClosed" />
  </Teleport>
  <div v-if="baseMap === 'satellite' && waterVisible && !placingReport" class="pointer-events-none absolute bottom-24 left-1/2 z-20 w-max max-w-[calc(100%-32px)] -translate-x-1/2 rounded-xl border border-ink/10 bg-white/95 px-3 py-2 text-center shadow-sm" aria-live="polite">
    <p class="text-xs font-semibold text-ink">{{ satelliteDate }}</p>
    <p class="mt-0.5 text-[10px] text-ink/60">Esri · {{ selectedReport ? 'Ubicación del reclamo' : 'Centro del mapa' }} · La fecha varía según la zona</p>
  </div>
</template>

<style scoped>
:deep(.citizen-report-popover) {
  z-index: 40;
  width: min(348px, calc(100vw - 32px));
  font: inherit;
}
:deep(.citizen-report-popover .maplibregl-popup-content) {
  padding: 0;
  border-radius: 1rem;
  background: transparent;
  box-shadow: 0 8px 28px rgb(9 34 53 / 18%);
}
</style>
