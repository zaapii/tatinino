import type { MapPoint } from '~/types/map'

type NominatimAddress = {
  neighbourhood?: string
  suburb?: string
  quarter?: string
  city_district?: string
  district?: string
  borough?: string
  residential?: string
}

type NominatimResult = {
  address?: NominatimAddress
}

const neighborhoodCache = new Map<string, string | null>()
let lastRequestAt = 0

const wait = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds))

export function useNeighborhoodLookup() {
  async function lookupNeighborhood(point: MapPoint) {
    const cacheKey = `${point.latitude.toFixed(5)},${point.longitude.toFixed(5)}`
    if (neighborhoodCache.has(cacheKey)) return neighborhoodCache.get(cacheKey) ?? undefined

    const remainingDelay = 1000 - (Date.now() - lastRequestAt)
    if (remainingDelay > 0) await wait(remainingDelay)
    lastRequestAt = Date.now()

    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.search = new URLSearchParams({
      format: 'jsonv2',
      lat: String(point.latitude),
      lon: String(point.longitude),
      zoom: '14',
      addressdetails: '1',
      layer: 'address',
      'accept-language': 'es',
    }).toString()

    const response = await fetch(url, { headers: { Accept: 'application/json' } })
    if (!response.ok) throw new Error('No se pudo estimar el barrio automáticamente.')

    const result = await response.json() as NominatimResult
    const address = result.address
    const neighborhood = address?.neighbourhood
      ?? address?.suburb
      ?? address?.quarter
      ?? address?.city_district
      ?? address?.district
      ?? address?.borough
      ?? address?.residential
      ?? null

    neighborhoodCache.set(cacheKey, neighborhood)
    return neighborhood ?? undefined
  }

  return { lookupNeighborhood }
}
