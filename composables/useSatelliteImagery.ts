import type { SatelliteScene } from '~/types/map'

const SATELLITE_BUCKET = 'satellite-imagery'

type SatelliteSceneRow = {
  id: string
  provider: 'copernicus'
  collection: 'sentinel-2-l2a'
  product_id: string
  captured_at: string
  cloud_cover: number | null
  storage_path: string
  west: number
  south: number
  east: number
  north: number
}

function satelliteSceneFromRow(row: SatelliteSceneRow, publicUrl: string): SatelliteScene {
  return {
    id: row.id,
    provider: row.provider,
    collection: row.collection,
    productId: row.product_id,
    capturedAt: row.captured_at,
    cloudCover: row.cloud_cover,
    publicUrl,
    bounds: { west: row.west, south: row.south, east: row.east, north: row.north },
  }
}

export function useSatelliteImagery() {
  const supabase = useSupabaseClient()

  async function fetchLatestSatelliteScene() {
    const { data, error } = await supabase
      .from('satellite_scenes')
      .select('id,provider,collection,product_id,captured_at,cloud_cover,storage_path,west,south,east,north')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) throw new Error(`No se pudo consultar la imagen satelital reciente: ${error.message}`)
    if (!data) return null

    const row = data as SatelliteSceneRow
    const { data: publicAsset } = supabase.storage.from(SATELLITE_BUCKET).getPublicUrl(row.storage_path)
    return satelliteSceneFromRow(row, publicAsset.publicUrl)
  }

  return { fetchLatestSatelliteScene }
}
