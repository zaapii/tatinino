export type MapPoint = {
  longitude: number
  latitude: number
}

export type LayerStatus = 'active' | 'available' | 'soon'

export type MapLayerDefinition = {
  id: string
  label: string
  description: string
  enabled: boolean
  status: LayerStatus
}

export type GeospatialSourceConfig = {
  geojsonBaseUrl?: string
  pmtilesBaseUrl?: string
  rasterTilesBaseUrl?: string
}
