export type MapPoint = {
  longitude: number
  latitude: number
}

export type MapFeatureInfo = {
  layerId: string
  layerLabel: string
  color: string
  geometryType: string
  sourceFile: string
  properties: Record<string, string | number | boolean | null>
}

export type MapSelection = MapPoint & {
  feature?: MapFeatureInfo
}

export type CitizenReport = {
  id: string
  topic: string
  description: string
  neighborhood?: string
  point: MapPoint
  createdAt: string
  photoName?: string
  photoUrl?: string
  status: CitizenReportStatus
}

export type CitizenReportStatus = 'pending' | 'approved' | 'rejected'

export type CitizenReportForm = Omit<CitizenReport, 'id' | 'createdAt' | 'photoUrl' | 'status'> & {
  photoFile?: File
}

export type LayerStatus = 'active' | 'available' | 'soon'
export type LayerGroup = 'territory' | 'protection' | 'current' | 'community'

export type HydraulicLayerSource = {
  file: string
  dataUrl?: string
  featureCount: number
  color: string
  minZoom: number
  lineWidth?: number
  pointRadius?: number
  fillOpacity?: number
  dashed?: boolean
  labelProperty?: string
  labelMinZoom?: number
}

export type MapLayerDefinition = {
  id: string
  label: string
  description: string
  enabled: boolean
  status: LayerStatus
  group: LayerGroup
  source?: HydraulicLayerSource
  color?: string
}

export type GeospatialSourceConfig = {
  geojsonBaseUrl?: string
  pmtilesBaseUrl?: string
  rasterTilesBaseUrl?: string
}
