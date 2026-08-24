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
  runtimeConfig: {
    public: {
      geojsonBaseUrl: '',
      pmtilesBaseUrl: '',
      rasterTilesBaseUrl: '',
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
        { name: 'description', content: 'Información hídrica pública para la prevención y la toma de decisiones en Santa Fe Capital.' },
        { name: 'theme-color', content: '#092235' },
      ],
    },
  },
  nitro: { preset: 'static' },
})
