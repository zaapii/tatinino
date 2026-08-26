import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  css: [
    '@fontsource-variable/instrument-sans/index.css',
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
      htmlAttrs: { lang: 'es' },
      titleTemplate: '%s · Santa Fe — Información Hídrica',
      meta: [
        { name: 'description', content: 'Información pública para comprender el riesgo hídrico, anticipar escenarios y fortalecer la prevención en Santa Fe Capital.' },
        { name: 'theme-color', content: '#092235' },
      ],
    },
  },
  nitro: { preset: 'static' },
})
