<script setup lang="ts">
import { Menu, X } from 'lucide-vue-next'
const emit = defineEmits<{ policy: [] }>()
const open = ref(false)
const route = useRoute()
watch(() => route.path, () => { open.value = false })
function showPolicy() { open.value = false; emit('policy') }
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 h-16 bg-[#3a4863] text-white">
    <div class="flex h-full items-center justify-between px-4">
      <NuxtLink to="/mapa" aria-label="Mapa del agua"><img src="/figma/sidebar-logo.png" width="52" height="45" alt="Mapa del agua" class="h-[45px] w-[52px] object-contain" /></NuxtLink>
      <button class="grid size-10 place-items-center rounded-lg" :aria-expanded="open" aria-label="Abrir navegación" @click="open = !open"><X v-if="open" :size="20" /><Menu v-else :size="20" /></button>
    </div>
    <nav v-if="open" class="space-y-2 bg-[#3a4863] p-4 shadow-xl" aria-label="Secciones principales">
      <NuxtLink to="/mapa" class="flex items-center gap-2 rounded-md p-2 text-[13px]" :class="route.path === '/mapa' ? 'bg-[#1a2741]' : ''"><img src="/figma/nav-map.svg" width="32" height="32" alt="" />Mapa</NuxtLink>
      <NuxtLink to="/el-nino" class="flex items-center gap-2 rounded-md p-2 text-[13px]" :class="route.path === '/el-nino' ? 'bg-[#1a2741]' : ''"><img src="/figma/nav-weather.svg" width="32" height="32" alt="" />El Niño</NuxtLink>
      <NuxtLink to="/novedades" class="flex items-center gap-2 rounded-md p-2 text-[13px]" :class="route.path.startsWith('/novedades') ? 'bg-[#1a2741]' : ''"><img src="/figma/reports.svg" width="32" height="32" alt="" />Novedades</NuxtLink>
      <NuxtLink to="/proyecto" class="flex items-center gap-2 rounded-md p-2 text-[13px]" :class="route.path === '/proyecto' ? 'bg-[#1a2741]' : ''"><img src="/figma/info.svg" width="32" height="32" alt="" />Proyecto</NuxtLink>
      <button class="px-2 py-4 text-xs" @click="showPolicy">Política de datos</button>
    </nav>
  </header>
</template>
