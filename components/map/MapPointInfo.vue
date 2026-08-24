<script setup lang="ts">
import { MapPin, X, DatabaseZap } from 'lucide-vue-next'
import type { MapPoint } from '~/types/map'

defineProps<{ point: MapPoint }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <section class="surface-panel absolute inset-x-3 bottom-3 z-40 rounded-2xl p-4 sm:inset-auto sm:right-5 sm:top-[132px] sm:w-[330px]" aria-live="polite">
    <header class="flex items-start justify-between gap-4">
      <div><p class="ui-label text-river">Consulta en el mapa</p><h2 class="mt-1 text-lg font-semibold tracking-[-.02em]">Información del punto</h2></div>
      <button class="grid size-8 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar información" @click="$emit('close')"><X :size="18"/></button>
    </header>
    <div class="mt-4 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10">
      <div class="bg-white p-3"><p class="ui-label text-[9px] text-ink/42">Latitud</p><p class="mt-1 font-mono text-xs">{{ point.latitude.toFixed(6) }}</p></div>
      <div class="bg-white p-3"><p class="ui-label text-[9px] text-ink/42">Longitud</p><p class="mt-1 font-mono text-xs">{{ point.longitude.toFixed(6) }}</p></div>
    </div>
    <div class="mt-3 flex items-start gap-3 rounded-xl bg-mist p-3.5"><MapPin :size="18" class="mt-0.5 shrink-0 text-river"/><div><p class="text-xs font-semibold">Cota del terreno</p><p class="mt-1 text-xs text-ink/57">Datos aún no disponibles</p></div></div>
    <p class="mt-3 flex gap-2 text-[11px] leading-relaxed text-ink/50"><DatabaseZap :size="15" class="mt-0.5 shrink-0"/> Los valores definitivos serán obtenidos de modelos digitales de elevación oficiales.</p>
  </section>
</template>
