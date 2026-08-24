<script setup lang="ts">
import { Map, Waves, Newspaper, Landmark, ArrowUpRight, ShieldCheck } from 'lucide-vue-next'

const route = useRoute()
const items = [
  { to: '/mapa', label: 'Mapa', hint: 'Territorio y capas', icon: Map },
  { to: '/el-nino', label: 'El Niño', hint: 'Contexto climático', icon: Waves },
  { to: '/novedades', label: 'Novedades', hint: 'Notas y explicaciones', icon: Newspaper },
  { to: '/proyecto', label: 'Proyecto', hint: 'Propósito y alcance', icon: Landmark },
]

const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const isActive = (to: string) => to === '/mapa'
  ? normalizedPath.value === '/mapa' || normalizedPath.value === '/'
  : normalizedPath.value.startsWith(to)
</script>

<template>
  <aside class="sticky top-0 z-40 h-dvh flex-col border-r border-ink/10 bg-ink px-5 pb-5 pt-7 text-white">
    <NuxtLink to="/mapa" class="block rounded-xl px-2 py-1">
      <div class="mb-5 flex items-center gap-3">
        <div class="relative grid size-10 place-items-center overflow-hidden rounded-full border border-white/25">
          <span class="absolute left-0 right-0 top-[45%] h-px -rotate-12 bg-river-light" />
          <span class="absolute left-0 right-0 top-[58%] h-px rotate-6 bg-river-light/60" />
          <span class="size-2 rounded-full bg-sand" />
        </div>
        <span class="ui-label text-white/55">Plataforma pública</span>
      </div>
      <p class="max-w-[190px] text-[1.34rem] font-semibold leading-[1.02] tracking-[-.035em]">Santa Fe —<br>Información Hídrica</p>
      <p class="mt-3 max-w-[190px] text-xs leading-relaxed text-white/55">Información para la prevención y la toma de decisiones</p>
    </NuxtLink>

    <nav class="mt-10 space-y-1" aria-label="Secciones principales">
      <NuxtLink v-for="item in items" :key="item.to" :to="item.to" class="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors" :class="isActive(item.to) ? 'bg-white text-ink' : 'text-white/72 hover:bg-white/8 hover:text-white'">
        <component :is="item.icon" :size="19" :stroke-width="1.8" />
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold">{{ item.label }}</p>
          <p class="mt-0.5 text-[11px] opacity-55">{{ item.hint }}</p>
        </div>
        <ArrowUpRight :size="15" class="opacity-35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
      </NuxtLink>
    </nav>

    <div class="mt-auto">
      <div class="mb-5 border-t border-white/12 pt-5">
        <div class="flex items-start gap-2.5 text-white/66">
          <ShieldCheck :size="16" class="mt-0.5 shrink-0 text-river-light" />
          <p class="text-[11px] leading-relaxed">Datos abiertos · Fuentes verificables · Actualización permanente</p>
        </div>
      </div>
      <div class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
        <p class="ui-label text-white/35">Espacio institucional</p>
        <p class="mt-1.5 text-xs text-white/55">Iniciativa de [Nombre]</p>
      </div>
    </div>
  </aside>
</template>
