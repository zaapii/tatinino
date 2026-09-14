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
    zoom: 12.35,
    minZoom: 10,
    maxZoom: 18,
    baseStyle: 'https://tiles.openfreemap.org/styles/positron',
    externalSources,
  }
}
