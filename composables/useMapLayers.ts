import type { MapLayerDefinition } from '~/types/map'

export function useMapLayers() {
  const layers = ref<MapLayerDefinition[]>([
    { id: 'elevation', label: 'Cotas del terreno', description: 'Altura y características del terreno', enabled: false, status: 'soon', group: 'territory' },
    { id: 'vulnerability', label: 'Vulnerabilidad territorial', description: 'Zonas caracterizadas por fuentes oficiales', enabled: false, status: 'soon', group: 'territory' },
    { id: 'runoff', label: 'Cuencas de escurrimiento', description: 'Recorridos y comportamiento superficial del agua', enabled: false, status: 'soon', group: 'territory' },
    { id: 'historic', label: 'Antecedentes de anegamiento', description: 'Registros históricos documentados', enabled: false, status: 'soon', group: 'territory' },
    { id: 'defenses', label: 'Terraplenes y defensas', description: 'Infraestructura de protección hídrica', enabled: false, status: 'soon', group: 'protection' },
    { id: 'reservoirs', label: 'Reservorios', description: 'Áreas de almacenamiento y regulación', enabled: false, status: 'soon', group: 'protection' },
    { id: 'drainage', label: 'Canales y desagües', description: 'Red de conducción del agua urbana', enabled: false, status: 'soon', group: 'protection' },
    { id: 'pumping', label: 'Estaciones de bombeo', description: 'Componentes operativos del sistema', enabled: false, status: 'soon', group: 'protection' },
    { id: 'storm-drains', label: 'Bocas de tormenta', description: 'Infraestructura de captación pluvial', enabled: false, status: 'soon', group: 'protection' },
    { id: 'water', label: 'Ríos y cursos de agua', description: 'Paraná, Salado, lagunas y canales del mapa base', enabled: true, status: 'active', group: 'current' },
    { id: 'river-levels', label: 'Niveles de los ríos', description: 'Mediciones y tendencias oficiales', enabled: false, status: 'soon', group: 'current' },
    { id: 'rainfall', label: 'Precipitaciones y pronósticos', description: 'Información meteorológica actualizada', enabled: false, status: 'soon', group: 'current' },
    { id: 'alerts', label: 'Alertas oficiales', description: 'Comunicados meteorológicos e hidrológicos', enabled: false, status: 'soon', group: 'current' },
    { id: 'citizen-reports', label: 'Reportes de la comunidad', description: 'Puntos informados, validados y en seguimiento', enabled: false, status: 'soon', group: 'community' },
  ])

  function toggleLayer(id: string) {
    const layer = layers.value.find(item => item.id === id)
    if (layer && layer.status !== 'soon') layer.enabled = !layer.enabled
  }

  return { layers, toggleLayer }
}
