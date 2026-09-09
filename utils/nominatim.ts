let nextRequestAt = 0

export async function fetchNominatim(url: URL) {
  const requestAt = Math.max(Date.now(), nextRequestAt)
  nextRequestAt = requestAt + 1100
  const delay = requestAt - Date.now()
  if (delay > 0) await new Promise(resolve => setTimeout(resolve, delay))
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error('No se pudo consultar la ubicación.')
  return response
}
