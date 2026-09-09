import type { MapPoint } from '~/types/map'
import { fetchNominatim } from '~/utils/nominatim'
import { isReportPointInBounds } from '~/utils/reportLocation'

type AddressResult = { label: string, point: MapPoint }
const addressCache = new Map<string, AddressResult[]>()

export function useReportAddressLookup() {
  async function searchAddress(address: string): Promise<AddressResult[]> {
    const key = address.trim().toLocaleLowerCase('es-AR')
    if (!key) return []
    if (addressCache.has(key)) return addressCache.get(key)!
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.search = new URLSearchParams({
      q: `${address}, Santa Fe, Argentina`, format: 'jsonv2',
      countrycodes: 'ar', viewbox: '-60.95,-31.82,-60.45,-31.45',
      bounded: '1', limit: '5', 'accept-language': 'es',
    }).toString()
    const response = await fetchNominatim(url)
    const results = await response.json() as Array<{ display_name: string, lat: string, lon: string }>
    const addresses = results.map(result => ({
      label: result.display_name,
      point: { latitude: Number(result.lat), longitude: Number(result.lon) },
    })).filter(result => isReportPointInBounds(result.point))
    addressCache.set(key, addresses)
    return addresses
  }
  return { searchAddress }
}
