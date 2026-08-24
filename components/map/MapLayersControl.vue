<script setup lang="ts">
import { Layers3, X, Info } from 'lucide-vue-next'
import type { MapLayerDefinition } from '~/types/map'

defineProps<{ layers: MapLayerDefinition[] }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const open = defineModel<boolean>('open', { default: false })
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 sm:inset-auto sm:bottom-auto sm:left-5 sm:top-[132px] sm:p-0">
    <button v-if="!open" class="pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-ink-soft" @click="open = true">
      <Layers3 :size="18" /> Capas
    </button>
    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-4 opacity-0">
      <section v-if="open" class="surface-panel pointer-events-auto max-h-[70dvh] w-full overflow-auto rounded-2xl p-4 sm:w-[326px]" aria-label="Control de capas">
        <header class="flex items-center justify-between border-b border-ink/10 pb-3">
          <div class="flex items-center gap-2"><Layers3 :size="18" class="text-river"/><h2 class="font-semibold">Capas del mapa</h2></div>
          <button class="grid size-8 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar capas" @click="open = false"><X :size="18"/></button>
        </header>
        <div class="divide-y divide-ink/8">
          <div v-for="layer in layers" :key="layer.id" class="flex gap-3 py-3.5">
            <button role="switch" :aria-checked="layer.enabled" :disabled="layer.status === 'soon'" class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition" :class="layer.enabled ? 'bg-river' : 'bg-ink/14'" @click="emit('toggle', layer.id)">
              <span class="absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all" :class="layer.enabled ? 'left-[18px]' : 'left-0.5'" />
            </button>
            <div class="min-w-0 flex-1">
              <div class="flex items-start justify-between gap-2"><p class="text-sm font-semibold leading-snug">{{ layer.label }}</p><span v-if="layer.status === 'soon'" class="ui-label shrink-0 rounded-full bg-ink/5 px-2 py-1 text-[9px] text-ink/45">Próximamente</span></div>
              <p class="mt-1 text-[11px] leading-relaxed text-ink/52">{{ layer.description }}</p>
            </div>
          </div>
        </div>
        <p class="mt-2 flex gap-2 rounded-xl bg-mist p-3 text-[11px] leading-relaxed text-ink/58"><Info :size="15" class="mt-0.5 shrink-0 text-river"/> Solo se muestran datos disponibles en el mapa base. Las capas técnicas se publicarán con sus fuentes.</p>
      </section>
    </Transition>
  </div>
</template>
