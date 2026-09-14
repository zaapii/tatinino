import type { MapLayerDefinition } from '~/types/map'

export function useMapLayers() {
  const layers = ref<MapLayerDefinition[]>([
    { id: 'water', label: 'Mapa base y cursos de agua', description: 'Calles, barrios, Paraná, Salado, lagunas y canales de OpenStreetMap', enabled: true, status: 'active', group: 'current' },
    { id: 'river-levels', label: 'Niveles de los ríos', description: 'Escalas oficiales de Paraná, Santa Fe, Salado y Colastiné; el valor se repite sobre el cauce como referencia de su estación', enabled: true, status: 'active', group: 'current', color: '#0877ad' },
    { id: 'citizen-reports', label: 'Reclamos', description: 'Puntos aprobados con iconos según categoría; grave en rojo y medio en amarillo', enabled: true, status: 'available', group: 'community', color: '#d94841' },
    {
      id: 'defenses', label: 'Terraplenes y defensas', description: 'Trazado de la infraestructura de protección hídrica', enabled: true, status: 'available', group: 'protection',
      source: { file: 'defensas.geojson', featureCount: 642, color: '#ba6a47', minZoom: 9.5, lineWidth: 5.6 },
    },
    {
      id: 'reservoirs', label: 'Reservorios', description: 'Áreas y perímetros destinados a almacenamiento y regulación', enabled: true, status: 'available', group: 'protection',
      source: { file: 'reservorios.geojson', dataUrl: '/data/hydraulics/reservorios.geojson', featureCount: 31, color: '#2f82a2', minZoom: 10.5, lineWidth: 2.2, fillOpacity: 0.4 },
    },
    {
      id: 'channels', label: 'Canales', description: 'Canales abiertos y canales revestidos a cielo abierto', enabled: true, status: 'available', group: 'protection',
      source: { file: 'canales.geojson', dataUrl: '/data/hydraulics/canales.geojson', featureCount: 90, color: '#198c8e', minZoom: 10.5, lineWidth: 4.2 },
    },
    {
      id: 'renabap-neighborhoods', label: 'Barrios RENABAP', description: '69 polígonos de barrios populares de la localidad de Santa Fe; incluye la cantidad de familias informada en el archivo fuente', enabled: false, status: 'available', group: 'territory',
      source: { file: 'barrios_renabap.geojson', dataUrl: '/data/territory/barrios_renabap.geojson', featureCount: 69, color: '#cf9cb0', minZoom: 9.5, lineWidth: 1.7, fillOpacity: 0.5, labelProperty: 'barrio', labelMinZoom: 11.5 },
    },
    {
      id: 'pumping', label: 'Estaciones de bombeo', description: 'Estaciones, rebombeos y puntos sin obra civil', enabled: false, status: 'available', group: 'protection',
      source: { file: 'estaciones_bombeo.geojson', dataUrl: '/data/hydraulics/estaciones_bombeo.geojson', featureCount: 51, color: '#dda52d', minZoom: 11.5, lineWidth: 1.5, pointRadius: 5.5, fillOpacity: 0.26 },
    },
    {
      id: 'basins', label: 'Cuencas', description: 'Trazados de cuencas extraídos del plano hidráulico 2025', enabled: false, status: 'available', group: 'territory',
      source: { file: 'cuencas.geojson', featureCount: 3583, color: '#4b6d89', minZoom: 10, lineWidth: 1.35, dashed: true },
    },
    {
      id: 'sub-basins', label: 'Subcuencas', description: 'Delimitaciones internas del sistema de escurrimiento', enabled: false, status: 'available', group: 'territory',
      source: { file: 'subcuencas.geojson', featureCount: 1641, color: '#4b6d89', minZoom: 11, lineWidth: 1.1, dashed: true },
    },
  ])

  function toggleLayer(id: string) {
    const layer = layers.value.find(item => item.id === id)
    if (layer && layer.status !== 'soon') layer.enabled = !layer.enabled
  }

  return { layers, toggleLayer }
}
