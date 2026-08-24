export type MapPoint = {
  longitude: number
  latitude: number
}

export type LayerStatus = 'active' | 'available' | 'soon'
export type LayerGroup = 'territory' | 'protection' | 'current' | 'community'

export type MapLayerDefinition = {
  id: string
  label: string
  description: string
  enabled: boolean
  status: LayerStatus
  group: LayerGroup
}

export type GeospatialSourceConfig = {
  geojsonBaseUrl?: string
  pmtilesBaseUrl?: string
  rasterTilesBaseUrl?: string
}
