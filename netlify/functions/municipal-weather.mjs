const SOURCE_URL = 'https://santafeciudad.gov.ar/wp-json/clima/v1/datos'

export default async () => {
  try {
    const response = await fetch(SOURCE_URL, {
      headers: {
        Accept: 'application/json',
        Referer: 'https://santafeciudad.gov.ar/direccion-de-gestion-de-riesgo/monitoreo/',
      },
    })
    if (!response.ok) throw new Error(`La fuente municipal respondió ${response.status}`)
    const payload = await response.text()
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, max-age=300, s-maxage=300',
      },
      body: payload,
    }
  }
  catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
      body: JSON.stringify({ error: error instanceof Error ? error.message : 'No se pudo consultar la fuente municipal.' }),
    }
  }
}
