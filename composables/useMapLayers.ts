import type { MapLayerDefinition } from '~/types/map'

export function useMapLayers() {
  const layers = ref<MapLayerDefinition[]>([
    {
      id: 'conduit-elevations', label: 'Cotas de fondo de conductos', description: '796 valores FC identificados; no representan la altura de la calle o el terreno', enabled: true, status: 'available', group: 'territory',
      source: { file: 'cotas_fondo_conductos.geojson', featureCount: 796, color: '#9b6b32', minZoom: 11.5, lineWidth: 1, pointRadius: 3 },
    },
    {
      id: 'elevation', label: 'Anotaciones numéricas sin clasificar', description: 'Medidas heterogéneas del CAD; se conservan para auditoría, no como altitud', enabled: false, status: 'available', group: 'territory',
      source: { file: 'cotas.geojson', featureCount: 10399, color: '#716961', minZoom: 13.5, lineWidth: 1, pointRadius: 2 },
    },
    { id: 'vulnerability', label: 'Vulnerabilidad territorial', description: 'Zonas caracterizadas por fuentes oficiales', enabled: false, status: 'soon', group: 'territory' },
    {
      id: 'basins', label: 'Cuencas', description: 'Trazados de cuencas extraídos del plano hidráulico 2025', enabled: false, status: 'available', group: 'territory',
      source: { file: 'cuencas.geojson', featureCount: 3583, color: '#385f7d', minZoom: 10, lineWidth: 1.35, dashed: true },
    },
    {
      id: 'sub-basins', label: 'Subcuencas', description: 'Delimitaciones internas del sistema de escurrimiento', enabled: false, status: 'available', group: 'territory',
      source: { file: 'subcuencas.geojson', featureCount: 1641, color: '#69999b', minZoom: 11, lineWidth: 1.1, dashed: true },
    },
    { id: 'historic', label: 'Antecedentes de anegamiento', description: 'Registros históricos documentados', enabled: false, status: 'soon', group: 'territory' },
    {
      id: 'defenses', label: 'Terraplenes y defensas', description: 'Trazado de la infraestructura de protección hídrica', enabled: true, status: 'available', group: 'protection',
      source: { file: 'defensas.geojson', featureCount: 642, color: '#b75e37', minZoom: 9.5, lineWidth: 2.8 },
    },
    {
      id: 'reservoirs', label: 'Reservorios', description: 'Áreas y perímetros destinados a almacenamiento y regulación', enabled: true, status: 'available', group: 'protection',
      source: { file: 'reservorios.geojson', featureCount: 374, color: '#237b9d', minZoom: 10.5, lineWidth: 1.5, fillOpacity: 0.18 },
    },
    {
      id: 'channels', label: 'Canales', description: 'Canales abiertos y canales revestidos a cielo abierto', enabled: true, status: 'available', group: 'protection',
      source: { file: 'canales.geojson', featureCount: 668, color: '#168d8c', minZoom: 10.5, lineWidth: 2.2, pointRadius: 3 },
    },
    {
      id: 'conduits', label: 'Conductos', description: 'Red de conducción representada en el plano hidráulico', enabled: false, status: 'available', group: 'protection',
      source: { file: 'conductos.geojson', featureCount: 10672, color: '#47789a', minZoom: 12.5, lineWidth: 1.2, pointRadius: 2.5 },
    },
    {
      id: 'pumping', label: 'Estaciones de bombeo', description: 'Estaciones, rebombeos y puntos sin obra civil', enabled: true, status: 'available', group: 'protection',
      source: { file: 'estaciones_bombeo.geojson', featureCount: 142, color: '#d59a27', minZoom: 11.5, lineWidth: 1.5, pointRadius: 5.5, fillOpacity: 0.26 },
    },
    {
      id: 'pump-houses', label: 'Casas de bombas', description: 'Edificaciones y referencias asociadas al bombeo', enabled: false, status: 'available', group: 'protection',
      source: { file: 'casabombas.geojson', featureCount: 21, color: '#77598d', minZoom: 12, lineWidth: 1.7, pointRadius: 5, fillOpacity: 0.22 },
    },
    {
      id: 'storm-drains', label: 'Bocas de tormenta', description: 'Elementos CAD de la infraestructura de captación pluvial', enabled: false, status: 'available', group: 'protection',
      source: { file: 'bocas_tormenta.geojson', featureCount: 16469, color: '#34aaa9', minZoom: 14, lineWidth: 1, pointRadius: 2.8, fillOpacity: 0.2 },
    },
    {
      id: 'access-holes', label: 'Bocas de registro', description: 'Registros de inspección de la red de drenaje', enabled: false, status: 'available', group: 'protection',
      source: { file: 'bocas_registro.geojson', featureCount: 4254, color: '#627f96', minZoom: 13.5, lineWidth: 1, pointRadius: 3.2, fillOpacity: 0.18 },
    },
    {
      id: 'culverts', label: 'Alcantarillas', description: 'Pasos y elementos de conducción bajo vías o terraplenes', enabled: false, status: 'available', group: 'protection',
      source: { file: 'alcantarillas.geojson', featureCount: 177, color: '#65894d', minZoom: 12.5, lineWidth: 2, pointRadius: 4 },
    },
    {
      id: 'gravity-outlets', label: 'Descargas por gravedad', description: 'Puntos y trazados de descarga sin bombeo', enabled: false, status: 'available', group: 'protection',
      source: { file: 'descargas_gravedad.geojson', featureCount: 22, color: '#d07832', minZoom: 11.5, lineWidth: 2.2, pointRadius: 5 },
    },
    { id: 'water', label: 'Mapa base y cursos de agua', description: 'Calles, barrios, Paraná, Salado, lagunas y canales de OpenStreetMap', enabled: true, status: 'active', group: 'current' },
    { id: 'river-levels', label: 'Niveles de los ríos', description: 'Mediciones y tendencias oficiales', enabled: false, status: 'soon', group: 'current' },
    { id: 'rainfall', label: 'Precipitaciones y pronósticos', description: 'Información meteorológica actualizada', enabled: false, status: 'soon', group: 'current' },
    { id: 'alerts', label: 'Alertas oficiales', description: 'Comunicados meteorológicos e hidrológicos', enabled: false, status: 'soon', group: 'current' },
    { id: 'citizen-reports', label: 'Reclamos ciudadanos', description: 'Puntos cargados por la comunidad y guardados en el registro público; ingresan sin validación oficial', enabled: true, status: 'available', group: 'community', color: '#d94841' },
  ])

  function toggleLayer(id: string) {
    const layer = layers.value.find(item => item.id === id)
    if (layer && layer.status !== 'soon') layer.enabled = !layer.enabled
  }

  return { layers, toggleLayer }
}
