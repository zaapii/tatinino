# Santa Fe — Información Hídrica

Maqueta frontend de una plataforma pública de información y prevención hídrica para Santa Fe Capital.

## Desarrollo

```bash
mise exec -- npm install
mise exec -- npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Verificación y salida estática

```bash
mise exec -- npm run typecheck
mise exec -- npm run build
mise exec -- npm run generate
```

La salida estática se genera en `.output/public`.

## Netlify

El repositorio incluye `netlify.toml` con:

- comando de build: `npm run generate`
- directorio de publicación: `.output/public`
- redirección de `/` a `/mapa`
- fallback para navegación del lado del cliente

Configurar en Netlify, dentro de **Site configuration → Environment variables**:

```env
NUXT_PUBLIC_SUPABASE_URL=https://spjrxnkompyyjbztzzlo.supabase.co
NUXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xp0Kt1YLcjrmAJWEZ6MYFg_tRov9YF8
```

Son valores públicos que Nuxt incorpora al frontend estático. El repositorio conserva los mismos
valores como fallback, por lo que un deploy existente no se interrumpe si todavía no fueron cargados
en Netlify. Las variables opcionales restantes están documentadas en `.env.example`.

`COPERNICUS_CLIENT_ID` y `COPERNICUS_CLIENT_SECRET` pertenecen exclusivamente a los secretos de la
Edge Function de Supabase. No deben configurarse en Netlify ni usar el prefijo `NUXT_PUBLIC_`.

Después de subir estos cambios, Netlify debe ejecutar un nuevo deploy desde el repositorio. Si el proyecto ya tenía valores configurados en el panel, verificar que no sobrescriban el directorio indicado en `netlify.toml`.

## Datos geoespaciales

El mapa está encapsulado en `components/map/MapViewer.client.vue` y se inicializa solo en el cliente. La configuración del mapa y las futuras ubicaciones de datos están separadas en `composables/useMap.ts`.

Variables públicas preparadas para una distribución S3 + CloudFront:

```env
NUXT_PUBLIC_GEOJSON_BASE_URL=
NUXT_PUBLIC_PMTILES_BASE_URL=
NUXT_PUBLIC_RASTER_TILES_BASE_URL=
```

El MVP utiliza teselas raster de OpenStreetMap. Las capas técnicas permanecen identificadas como pendientes hasta disponer de fuentes oficiales.

El catálogo futuro se organiza en cuatro grupos:

- territorio y riesgo
- sistema de protección
- situación actual
- participación ciudadana

La interfaz de reportes es demostrativa y no envía información. Está preparada para incorporar posteriormente ubicación, categorías, validación, seguimiento y una distinción explícita entre reportes comunitarios e información oficial.

## Alcance institucional

La ruta `/proyecto` presenta el propósito, alcance y rol institucional de la iniciativa. Explica el mapa como una infraestructura pública de conocimiento y organiza la propuesta en información comprensible, participación trazable y comunicación verificable.

## Publicaciones editoriales

La sección `/novedades` utiliza un modelo de contenido basado en bloques definido en `types/content.ts`. Los artículos se guardan en la tabla `articles` de Supabase y se cargan manualmente desde `/admin/articulos`. La lectura pública solo expone filas publicadas; los borradores y las operaciones de escritura están protegidos por las políticas RLS y la lista `admin_users`.

Bloques disponibles en el MVP:

- párrafo
- subtítulo
- lista
- destacado informativo o de atención
- cita

La portada, las tarjetas y la plantilla de lectura consumen el mismo objeto de artículo tipado.

## Caché de imágenes Sentinel-2

La migración `20260915120000_create_satellite_imagery_cache.sql` crea el bucket público
`satellite-imagery`, la tabla `satellite_scenes` y una tarea diaria a las 22:00 UTC. La Edge
Function `update-satellite-imagery` consulta Copernicus, renderiza una imagen RGB de Santa Fe
a 2500 × 2500 píxeles y calidad JPEG 95, y publica un objeto versionado con caché inmutable.

En el visor, la opción `Reciente` muestra Sentinel-2 hasta zoom 14. A partir de ese nivel cambia
automáticamente a la imagen detallada de Esri para evitar ampliar los píxeles de 10 metros.

Antes de desplegar la función, configurar las credenciales OAuth creadas en Copernicus Data
Space:

```powershell
supabase secrets set COPERNICUS_CLIENT_ID=... COPERNICUS_CLIENT_SECRET=...
```

La migración genera automáticamente un secreto independiente en Vault para autenticar Cron.

Después, aplicar la migración y desplegar:

```powershell
supabase db push
supabase functions deploy update-satellite-imagery --no-verify-jwt
```

Para ejecutar la primera actualización sin esperar a Cron, puede lanzarse manualmente el job
`refresh-sentinel-2-imagery` desde Supabase Cron. La función rechaza peticiones que no incluyan
el secreto generado en Vault.

Opcionalmente, `SATELLITE_MAX_CLOUD_COVER` permite cambiar el máximo de nubosidad de escena;
el valor predeterminado es 30.
