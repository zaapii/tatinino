<script setup lang="ts">
const emit = defineEmits<{ policy: [] }>()
const route = useRoute()
const items = [
  { to: '/mapa', label: 'Mapa', icon: '/figma/nav-map.svg' },
  { to: '/el-nino', label: 'El Niño', icon: '/figma/nav-weather.svg' },
]
const isActive = (to: string) => to === '/mapa' ? ['/', '/mapa'].includes(route.path.replace(/\/$/, '') || '/') : route.path.startsWith(to)
</script>

<template>
  <aside class="map-sidebar sticky top-0 z-40 h-dvh flex-col">
    <NuxtLink to="/mapa" class="sidebar-logo" aria-label="Mapa del agua"><img src="/figma/sidebar-logo.png" width="91" height="79" alt="Mapa del agua" /></NuxtLink>
    <nav aria-label="Secciones principales">
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to" :class="{ active: isActive(item.to) }" :aria-current="isActive(item.to) ? 'page' : undefined"><img :src="item.icon" width="32" height="32" alt="" />{{ item.label }}</NuxtLink>
    </nav>
    <button class="policy-link" @click="emit('policy')">Política de datos</button>
  </aside>
</template>

<style scoped>
.map-sidebar { background: #3a4863; color: white; padding: 23px 23px 28px; }
.sidebar-logo { display: block; width: 91px; margin-bottom: 32px; }
.sidebar-logo img { width: 91px; height: 79px; object-fit: contain; }
nav { display: grid; gap: 15px; }
nav a { display: flex; align-items: center; gap: 8px; width: 100%; min-height: 38px; padding: 3px; border-radius: 5px; font-size: 13px; font-weight: 500; white-space: nowrap; }
nav a.active, nav a:hover { background: #1a2741; }
nav img { width: 32px; height: 32px; flex-shrink: 0; }
.policy-link { margin-top: auto; font-size: 12px; line-height: 22px; text-align: left; white-space: nowrap; cursor: pointer; }
.policy-link:hover { text-decoration: underline; }
</style>
