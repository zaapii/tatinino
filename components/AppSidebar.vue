<script setup lang="ts">
import { Map, Waves, Newspaper, Landmark, ArrowUpRight, PanelLeftClose, PanelLeftOpen, ShieldCheck } from 'lucide-vue-next'

defineProps<{ collapsed: boolean }>()
const emit = defineEmits<{ toggle: [] }>()

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
  <aside
    class="sticky top-0 z-40 h-dvh flex-col overflow-hidden border-r border-ink/10 bg-ink pb-5 pt-7 text-white transition-[padding] duration-300 ease-out motion-reduce:transition-none"
    :class="collapsed ? 'px-3' : 'px-5'"
  >
    <div class="flex gap-2" :class="collapsed ? 'flex-col items-center' : 'items-center justify-between'">
      <NuxtLink
        to="/mapa"
        class="flex min-w-0 items-center rounded-xl py-1"
        :class="collapsed ? 'justify-center px-0' : 'gap-3 px-2'"
        :title="collapsed ? 'Santa Fe — Información Hídrica' : undefined"
        :aria-label="collapsed ? 'Ir al mapa' : undefined"
      >
        <div class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/25">
          <span class="absolute left-0 right-0 top-[45%] h-px -rotate-12 bg-river-light" />
          <span class="absolute left-0 right-0 top-[58%] h-px rotate-6 bg-river-light/60" />
          <span class="size-2 rounded-full bg-sand" />
        </div>
        <span v-if="!collapsed" class="ui-label whitespace-nowrap text-white/55">Plataforma</span>
      </NuxtLink>
      <button
        type="button"
        class="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/55 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river-light"
        :aria-label="collapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'"
        :aria-expanded="!collapsed"
        :title="collapsed ? 'Expandir menú' : 'Contraer menú'"
        @click="emit('toggle')"
      >
        <PanelLeftOpen v-if="collapsed" :size="17" aria-hidden="true" />
        <PanelLeftClose v-else :size="17" aria-hidden="true" />
      </button>
    </div>

    <NuxtLink v-if="!collapsed" to="/mapa" class="mt-5 block rounded-xl px-2 py-1">
      <p class="max-w-[190px] text-[1.34rem] font-semibold leading-[1.02] tracking-[-.035em]">Santa Fe —<br>Información Hídrica</p>
      <p class="mt-3 max-w-[190px] text-xs leading-relaxed text-white/55">Información para la prevención y la toma de decisiones</p>
    </NuxtLink>

    <nav class="space-y-1" :class="collapsed ? 'mt-8' : 'mt-10'" aria-label="Secciones principales">
      <NuxtLink
        v-for="item in items"
        :key="item.to"
        :to="item.to"
        class="group flex items-center rounded-xl py-3 transition-colors"
        :class="[
          isActive(item.to) ? 'bg-white text-ink' : 'text-white/72 hover:bg-white/8 hover:text-white',
          collapsed ? 'justify-center px-0' : 'gap-3 px-3',
        ]"
        :title="collapsed ? item.label : undefined"
        :aria-label="collapsed ? item.label : undefined"
      >
        <component :is="item.icon" :size="19" :stroke-width="1.8" class="shrink-0" aria-hidden="true" />
        <div v-if="!collapsed" class="min-w-0 flex-1">
          <p class="text-sm font-semibold">{{ item.label }}</p>
          <p class="mt-0.5 text-[11px] opacity-55">{{ item.hint }}</p>
        </div>
        <ArrowUpRight v-if="!collapsed" :size="15" class="opacity-35 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
      </NuxtLink>
    </nav>

    <div class="mt-auto">
      <div class="border-t border-white/12 pt-5" :class="collapsed ? '' : 'mb-5'">
        <div
          class="flex text-white/66"
          :class="collapsed ? 'justify-center' : 'items-start gap-2.5'"
          :title="collapsed ? 'Datos abiertos · Fuentes verificables · Actualización permanente' : undefined"
        >
          <ShieldCheck :size="16" class="mt-0.5 shrink-0 text-river-light" />
          <p v-if="!collapsed" class="text-[11px] leading-relaxed">Datos abiertos · Fuentes verificables · Actualización permanente</p>
          <span v-else class="sr-only">Datos abiertos · Fuentes verificables · Actualización permanente</span>
        </div>
      </div>
      <div v-if="!collapsed" class="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
        <p class="ui-label text-white/35">Espacio institucional</p>
        <p class="mt-1.5 text-xs text-white/55">Iniciativa de Tati Restagno</p>
      </div>
    </div>
  </aside>
</template>
