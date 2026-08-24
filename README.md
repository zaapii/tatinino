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

## Publicaciones editoriales

La sección `/novedades` utiliza un modelo de contenido basado en bloques definido en `types/content.ts`. Los ejemplos viven temporalmente en `composables/useArticles.ts` y pueden reemplazarse más adelante por la salida de un CMS o editor WYSIWYG sin cambiar las plantillas.

Bloques disponibles en el MVP:

- párrafo
- subtítulo
- lista
- destacado informativo o de atención
- cita

La portada, las tarjetas y la plantilla de lectura consumen el mismo objeto de artículo tipado.
