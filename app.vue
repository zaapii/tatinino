<script setup lang="ts">
const route = useRoute()
const canonicalPath = computed(() => `${route.path === '/' ? '/mapa' : route.path.replace(/\/+$/, '')}/`)
useHead({
  link: [{ rel: 'canonical', href: computed(() => `https://tatirestagno.com${canonicalPath.value}`) }],
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Mapa del Agua - Tati Restagno',
      url: 'https://tatirestagno.com/mapa/',
      inLanguage: 'es-AR',
      description: 'Mapa del Agua de Santa Fe con niveles de ríos y reclamos vecinales.',
    }),
  }],
})
useSeoMeta({ ogUrl: computed(() => `https://tatirestagno.com${canonicalPath.value}`) })
</script>

<template>
  <NuxtRouteAnnouncer />
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>
