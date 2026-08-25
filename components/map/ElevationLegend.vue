<script setup lang="ts">
import { DraftingCompass } from 'lucide-vue-next'
import type { MapLayerDefinition } from '~/types/map'

const props = defineProps<{ layers: MapLayerDefinition[] }>()
const visibleLayers = computed(() => props.layers.filter(layer => layer.enabled && (layer.source || layer.color)))
</script>

<template>
  <section v-if="visibleLayers.length" class="surface-panel absolute bottom-4 left-4 z-20 hidden w-[252px] rounded-xl p-3.5 sm:block">
    <div class="flex items-center justify-between gap-3"><div class="flex items-center gap-2"><DraftingCompass :size="15" class="text-river"/><p class="text-xs font-semibold">Plano técnico 2025</p></div><span class="font-mono text-[9px] text-ink/38">{{ visibleLayers.length }} activas</span></div>
    <ul class="mt-3 space-y-2">
      <li v-for="layer in visibleLayers.slice(0, 5)" :key="layer.id" class="flex items-center justify-between gap-3 text-[10px] text-ink/62">
        <span class="flex min-w-0 items-center gap-2"><span class="h-0.5 w-5 shrink-0 rounded-full" :style="{ backgroundColor: layer.source?.color ?? layer.color }"/><span class="truncate">{{ layer.label }}</span></span>
        <span class="font-mono text-[8px] text-ink/32">{{ layer.source ? 'CAD' : 'COM.' }}</span>
      </li>
    </ul>
    <p v-if="visibleLayers.length > 5" class="mt-2 text-[9px] text-ink/40">+ {{ visibleLayers.length - 5 }} capas activas</p>
    <p class="mt-3 border-t border-ink/8 pt-2 text-[9px] leading-relaxed text-ink/42">La simbología distingue sistemas; no expresa estado operativo.</p>
  </section>
</template>
