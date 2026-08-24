import type { MapLayerDefinition } from '~/types/map'

export function useMapLayers() {
  const layers = ref<MapLayerDefinition[]>([
    { id: 'elevation', label: 'Cotas del terreno', description: 'Altura del terreno', enabled: false, status: 'soon' },
    { id: 'contours', label: 'Curvas de nivel', description: 'Líneas de igual altura', enabled: false, status: 'soon' },
    { id: 'water', label: 'Cursos de agua', description: 'Ríos, lagunas y canales del mapa base', enabled: true, status: 'active' },
    { id: 'defenses', label: 'Defensas', description: 'Infraestructura de protección', enabled: false, status: 'soon' },
    { id: 'historic', label: 'Zonas históricamente inundadas', description: 'Antecedentes documentados', enabled: false, status: 'soon' },
  ])

  function toggleLayer(id: string) {
    const layer = layers.value.find(item => item.id === id)
    if (layer && layer.status !== 'soon') layer.enabled = !layer.enabled
  }

  return { layers, toggleLayer }
}
