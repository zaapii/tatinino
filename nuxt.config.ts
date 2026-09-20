import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '@fontsource/ibm-plex-mono/400.css',
    'maplibre-gl/dist/maplibre-gl.css',
    '~/assets/css/main.css',
  ],
  modules: ['@vueuse/nuxt'],
  routeRules: {
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
  },
  runtimeConfig: {
    public: {
      geojsonBaseUrl: '',
      pmtilesBaseUrl: '',
      rasterTilesBaseUrl: '',
      supabaseUrl: 'https://spjrxnkompyyjbztzzlo.supabase.co',
      supabasePublishableKey: 'sb_publishable_xp0Kt1YLcjrmAJWEZ6MYFg_tRov9YF8',
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { exclude: ['maplibre-gl'] },
  },
  app: {
    head: {
      htmlAttrs: { lang: 'es-AR' },
      titleTemplate: '%s - Tati Restagno',
      meta: [
        { name: 'description', content: 'Mapa de prevención y gestión hídrica de Santa Fe. Consultá el riesgo hídrico y los problemas de tu barrio.' },
        { name: 'theme-color', content: '#092235' },
        { name: 'robots', content: 'index,follow,max-image-preview:large' },
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'Mapa del Agua - Tati Restagno' },
        { property: 'og:locale', content: 'es_AR' },
        { property: 'og:image', content: 'https://tatirestagno.com/portada-mapa-del-agua.png' },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'Mapa del Agua de Santa Fe' },
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:image', content: 'https://tatirestagno.com/portada-mapa-del-agua.png' },
        { name: 'twitter:image:alt', content: 'Mapa del Agua de Santa Fe' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      ],
    },
  },
  nitro: { preset: 'static' },
})
