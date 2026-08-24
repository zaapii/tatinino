<script setup lang="ts">
import { Menu, X, Map, Waves, Newspaper, ShieldCheck } from 'lucide-vue-next'
const open = ref(false)
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
watch(() => route.path, () => { open.value = false })
</script>

<template>
  <header class="fixed inset-x-0 top-0 z-50 h-16 border-b border-ink/10 bg-white/95 backdrop-blur-xl">
    <div class="flex h-full items-center justify-between px-4">
      <NuxtLink to="/mapa" class="flex items-center gap-2.5">
        <span class="relative grid size-8 place-items-center overflow-hidden rounded-full bg-ink"><span class="h-px w-full -rotate-12 bg-river-light"/><span class="absolute size-1.5 rounded-full bg-sand"/></span>
        <span class="text-[15px] font-semibold leading-none tracking-[-.02em]">Santa Fe · Información Hídrica</span>
      </NuxtLink>
      <button class="grid size-10 place-items-center rounded-xl border border-ink/10" :aria-expanded="open" aria-label="Abrir navegación" @click="open = !open">
        <X v-if="open" :size="20" /><Menu v-else :size="20" />
      </button>
    </div>
    <Transition enter-active-class="transition duration-200" enter-from-class="-translate-y-2 opacity-0" leave-active-class="transition duration-150" leave-to-class="-translate-y-2 opacity-0">
      <nav v-if="open" class="border-b border-ink/10 bg-white p-4 shadow-xl" aria-label="Secciones principales">
        <NuxtLink to="/mapa" class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold" :class="normalizedPath === '/mapa' || normalizedPath === '/' ? 'bg-mist text-river' : ''"><Map :size="19"/> Mapa</NuxtLink>
        <NuxtLink to="/el-nino" class="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold" :class="normalizedPath === '/el-nino' ? 'bg-mist text-river' : ''"><Waves :size="19"/> El Niño</NuxtLink>
        <NuxtLink to="/novedades" class="mt-1 flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold" :class="normalizedPath.startsWith('/novedades') ? 'bg-mist text-river' : ''"><Newspaper :size="19"/> Novedades</NuxtLink>
        <div class="mt-4 flex items-center gap-2 border-t border-ink/10 px-3 pt-4 text-xs text-ink/55"><ShieldCheck :size="15" class="text-river"/> Datos abiertos · Fuentes verificables</div>
      </nav>
    </Transition>
  </header>
</template>
