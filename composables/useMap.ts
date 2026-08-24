import type { GeospatialSourceConfig } from '~/types/map'

export const SANTA_FE_CENTER: [number, number] = [-60.7005, -31.6333]

export function useMapConfig() {
  const runtimeConfig = useRuntimeConfig()

  const externalSources: GeospatialSourceConfig = {
    geojsonBaseUrl: runtimeConfig.public.geojsonBaseUrl as string | undefined,
    pmtilesBaseUrl: runtimeConfig.public.pmtilesBaseUrl as string | undefined,
    rasterTilesBaseUrl: runtimeConfig.public.rasterTilesBaseUrl as string | undefined,
  }

  return {
    center: SANTA_FE_CENTER,
    zoom: 11.6,
    minZoom: 8,
    maxZoom: 18,
    baseStyle: {
      version: 8 as const,
      glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
      sources: {
        openstreetmap: {
          type: 'raster' as const,
          tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
          tileSize: 256,
          attribution: '© OpenStreetMap contributors',
        },
      },
      layers: [
        { id: 'background', type: 'background' as const, paint: { 'background-color': '#dfe9e8' } },
        { id: 'openstreetmap-base', type: 'raster' as const, source: 'openstreetmap', minzoom: 0, maxzoom: 19 },
      ],
    },
    vectorStyleUrl: 'https://tiles.openfreemap.org/styles/positron',
    externalSources,
  }
}
