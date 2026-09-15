import { createClient } from 'npm:@supabase/supabase-js@2'

const STAC_SEARCH_URL = 'https://catalogue.dataspace.copernicus.eu/stac/search'
const TOKEN_URL = 'https://identity.dataspace.copernicus.eu/auth/realms/CDSE/protocol/openid-connect/token'
const PROCESS_URL = 'https://sh.dataspace.copernicus.eu/process/v1'
const STORAGE_BUCKET = 'satellite-imagery'
const COLLECTION = 'sentinel-2-l2a'
const RENDER_PROFILE = '2500-q95-v1'
const BOUNDS = { west: -60.82, south: -31.76, east: -60.55, north: -31.49 }
const CENTER: [number, number] = [-60.7005, -31.6333]

type StacFeature = {
  id: string
  bbox?: number[]
  properties: { datetime: string, 'eo:cloud_cover'?: number }
}

type StacResponse = { features?: StacFeature[] }

function requiredSecret(name: string) {
  const value = Deno.env.get(name)
  if (!value) throw new Error(`Missing required secret: ${name}`)
  return value
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
  })
}

function sceneContainsCenter(scene: StacFeature) {
  const bbox = scene.bbox
  return Boolean(bbox && bbox.length >= 4
    && bbox[0]! <= CENTER[0] && CENTER[0] <= bbox[2]!
    && bbox[1]! <= CENTER[1] && CENTER[1] <= bbox[3]!)
}

async function fetchCandidate(maxCloudCover: number) {
  const until = new Date()
  const from = new Date(until)
  from.setUTCDate(from.getUTCDate() - 21)
  const response = await fetch(STAC_SEARCH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      collections: [COLLECTION],
      bbox: [BOUNDS.west, BOUNDS.south, BOUNDS.east, BOUNDS.north],
      datetime: `${from.toISOString()}/${until.toISOString()}`,
      limit: 40,
      sortby: [{ field: 'datetime', direction: 'desc' }],
    }),
  })
  if (!response.ok) throw new Error(`Copernicus STAC returned ${response.status}`)
  const catalogue = await response.json() as StacResponse
  const candidates = (catalogue.features ?? []).filter((scene) => {
    const cloudCover = scene.properties['eo:cloud_cover']
    return Number.isFinite(cloudCover) && Number(cloudCover) <= maxCloudCover
  })
  return candidates.find(sceneContainsCenter) ?? candidates[0] ?? null
}

async function fetchAccessToken(clientId: string, clientSecret: string) {
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'client_credentials', client_id: clientId, client_secret: clientSecret }),
  })
  if (!response.ok) throw new Error(`Copernicus authentication returned ${response.status}`)
  const data = await response.json() as { access_token?: string }
  if (!data.access_token) throw new Error('Copernicus authentication did not return an access token')
  return data.access_token
}

async function renderScene(scene: StacFeature, accessToken: string) {
  const capturedAt = new Date(scene.properties.datetime)
  const from = new Date(Date.UTC(capturedAt.getUTCFullYear(), capturedAt.getUTCMonth(), capturedAt.getUTCDate()))
  const to = new Date(from.getTime() + 86_399_999)
  const response = await fetch(PROCESS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json', Accept: 'image/jpeg' },
    body: JSON.stringify({
      input: {
        bounds: {
          bbox: [BOUNDS.west, BOUNDS.south, BOUNDS.east, BOUNDS.north],
          properties: { crs: 'http://www.opengis.net/def/crs/OGC/1.3/CRS84' },
        },
        data: [{
          type: COLLECTION,
          dataFilter: {
            timeRange: { from: from.toISOString(), to: to.toISOString() },
            mosaickingOrder: 'mostRecent',
          },
        }],
      },
      output: {
        width: 2500,
        height: 2500,
        responses: [{ identifier: 'default', format: { type: 'image/jpeg', quality: 95 } }],
      },
      evalscript: `//VERSION=3
function setup() {
  return { input: ["B02", "B03", "B04"], output: { bands: 3, sampleType: "AUTO" } };
}
function evaluatePixel(sample) {
  return [2.5 * sample.B04, 2.5 * sample.B03, 2.5 * sample.B02];
}`,
    }),
  })
  if (!response.ok) {
    const detail = (await response.text()).slice(0, 500)
    throw new Error(`Sentinel Hub Process API returned ${response.status}: ${detail}`)
  }
  return await response.arrayBuffer()
}

Deno.serve(async (request) => {
  if (request.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)

  try {
    const supabase = createClient(
      requiredSecret('SUPABASE_URL'),
      requiredSecret('SUPABASE_SERVICE_ROLE_KEY'),
      { auth: { persistSession: false, autoRefreshToken: false } },
    )
    const cronSecret = request.headers.get('x-cron-secret')
    if (!cronSecret) return jsonResponse({ error: 'Unauthorized' }, 401)
    const { data: secretIsValid, error: secretError } = await supabase
      .rpc('verify_satellite_cron_secret', { candidate: cronSecret })
    if (secretError) throw secretError
    if (!secretIsValid) return jsonResponse({ error: 'Unauthorized' }, 401)
    const body = await request.json().catch(() => ({})) as { force?: boolean }
    const force = body.force === true

    const maxCloudCover = Math.min(100, Math.max(0, Number(Deno.env.get('SATELLITE_MAX_CLOUD_COVER') ?? 30)))
    const scene = await fetchCandidate(maxCloudCover)
    if (!scene) return jsonResponse({ status: 'no_candidate', maxCloudCover })

    const { data: existing, error: existingError } = await supabase
      .from('satellite_scenes').select('id,storage_path').eq('product_id', scene.id).maybeSingle()
    if (existingError) throw existingError
    if (existing && !force) return jsonResponse({ status: 'already_cached', productId: scene.id })

    const accessToken = await fetchAccessToken(
      requiredSecret('COPERNICUS_CLIENT_ID'),
      requiredSecret('COPERNICUS_CLIENT_SECRET'),
    )
    const image = await renderScene(scene, accessToken)
    if (image.byteLength > 15 * 1024 * 1024) throw new Error('Rendered satellite image exceeds the Storage file limit')

    const capturedAt = new Date(scene.properties.datetime)
    const safeProductId = scene.id.replace(/[^a-zA-Z0-9_-]/g, '_')
    const storagePath = `sentinel-2/${capturedAt.getUTCFullYear()}/${String(capturedAt.getUTCMonth() + 1).padStart(2, '0')}/${safeProductId}-${RENDER_PROFILE}.jpg`
    const { error: uploadError } = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, image, {
      contentType: 'image/jpeg', cacheControl: '31536000', upsert: Boolean(existing),
    })
    if (uploadError) throw uploadError

    const { error: insertError } = await supabase.from('satellite_scenes').upsert({
      ...(existing ? { id: existing.id } : {}),
      provider: 'copernicus', collection: COLLECTION, product_id: scene.id,
      captured_at: capturedAt.toISOString(), cloud_cover: scene.properties['eo:cloud_cover'] ?? null,
      storage_path: storagePath,
      west: BOUNDS.west, south: BOUNDS.south, east: BOUNDS.east, north: BOUNDS.north,
      status: 'published',
    }, { onConflict: 'product_id' })
    if (insertError) {
      if (!existing) await supabase.storage.from(STORAGE_BUCKET).remove([storagePath])
      throw insertError
    }
    const { error: archiveError } = await supabase
      .from('satellite_scenes')
      .update({ status: 'archived' })
      .eq('status', 'published')
      .neq('product_id', scene.id)
    if (archiveError) throw archiveError

    return jsonResponse({
      status: 'published', productId: scene.id, capturedAt: capturedAt.toISOString(),
      cloudCover: scene.properties['eo:cloud_cover'] ?? null, bytes: image.byteLength,
    })
  }
  catch (error) {
    console.error(error)
    return jsonResponse({ error: error instanceof Error ? error.message : 'Unknown error' }, 500)
  }
})
