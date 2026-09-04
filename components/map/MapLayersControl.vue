<script setup lang="ts">
import { Layers3, X, Info } from 'lucide-vue-next'
import type { LayerGroup, MapLayerDefinition } from '~/types/map'

const props = defineProps<{ layers: MapLayerDefinition[] }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const open = defineModel<boolean>('open', { default: false })
const expandedInfoId = ref<string | null>(null)

const groups: { id: LayerGroup; label: string; hint: string }[] = [
  { id: 'territory', label: 'Territorio y riesgo', hint: 'Cómo es y cómo responde la ciudad' },
  { id: 'protection', label: 'Sistema de protección', hint: 'Infraestructura y componentes críticos' },
  { id: 'current', label: 'Situación actual', hint: 'Datos que cambian con cada escenario' },
  { id: 'community', label: 'Participación', hint: 'Información reportada por la comunidad' },
]

const groupedLayers = computed(() => groups.map(group => ({
  ...group,
  layers: props.layers.filter(layer => layer.group === group.id),
})))

const formatCount = (count: number) => new Intl.NumberFormat('es-AR').format(count)
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 bottom-0 z-30 p-3 sm:inset-auto sm:bottom-auto sm:left-5 sm:top-[132px] sm:p-0">
    <button v-if="!open" class="pointer-events-auto flex items-center gap-2 rounded-xl bg-ink px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-ink-soft" @click="open = true">
      <Layers3 :size="18" /> Capas
    </button>
    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-4 opacity-0">
      <section v-if="open" class="surface-panel pointer-events-auto max-h-[76dvh] w-full overflow-auto rounded-2xl p-4 sm:w-[350px]" aria-label="Control de capas">
        <header class="flex items-center justify-between border-b border-ink/10 pb-3">
          <div class="flex items-center gap-2"><Layers3 :size="18" class="text-river"/><h2 class="font-semibold">Capas del mapa</h2></div>
          <button class="grid size-8 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar capas" @click="open = false"><X :size="18"/></button>
        </header>
        <div class="space-y-5 py-3">
          <section v-for="group in groupedLayers" :key="group.id">
            <div class="mb-1 px-1"><p class="ui-label text-[9px] text-river">{{ group.label }}</p><p class="mt-0.5 text-[10px] text-ink/40">{{ group.hint }}</p></div>
            <div class="divide-y divide-ink/8">
              <div v-for="layer in group.layers" :key="layer.id" class="flex gap-3 py-3">
                <button role="switch" :aria-label="`${layer.enabled ? 'Ocultar' : 'Mostrar'} ${layer.label}`" :aria-checked="layer.enabled" :disabled="layer.status === 'soon'" class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition disabled:cursor-not-allowed" :class="layer.enabled ? 'bg-river' : 'bg-ink/14'" @click="emit('toggle', layer.id)">
                  <span class="absolute top-0.5 size-4 rounded-full bg-white shadow-sm transition-all" :class="layer.enabled ? 'left-[18px]' : 'left-0.5'" />
                </button>
                <div class="min-w-0 flex-1">
                  <div class="flex items-start justify-between gap-2">
                    <p class="flex min-w-0 items-center gap-2 text-sm font-semibold leading-snug">
                      <span v-if="layer.id === 'citizen-reports'" class="flex shrink-0 gap-0.5" aria-label="Grave en rojo; medio en amarillo"><span class="size-2 rounded-full bg-[#d94841]"/><span class="size-2 rounded-full bg-[#e0ad2f]"/></span>
                      <span v-else-if="layer.source || layer.color" class="size-2 shrink-0 rounded-full" :style="{ backgroundColor: layer.source?.color ?? layer.color }"/>
                      {{ layer.label }}
                    </p>
                    <div class="flex shrink-0 items-center gap-1.5">
                      <span v-if="layer.status === 'soon'" class="ui-label rounded-full bg-ink/5 px-2 py-1 text-[8px] text-ink/42">Próx.</span>
                      <span v-else-if="layer.source" class="font-mono text-[9px] text-ink/38">{{ formatCount(layer.source.featureCount) }}</span>
                      <span v-else-if="layer.id === 'citizen-reports'" class="ui-label rounded-full bg-[#d94841]/10 px-2 py-1 text-[8px] text-[#b9312b]">Público</span>
                      <span v-else-if="layer.id === 'river-levels'" class="ui-label rounded-full bg-river/10 px-2 py-1 text-[8px] text-river">INA</span>
                      <span v-else class="ui-label rounded-full bg-river/8 px-2 py-1 text-[8px] text-river">Base</span>
                      <button
                        class="grid size-7 place-items-center rounded-lg text-ink/45 transition hover:bg-river/8 hover:text-river"
                        :class="expandedInfoId === layer.id ? 'bg-river/10 text-river' : ''"
                        :aria-expanded="expandedInfoId === layer.id"
                        :aria-label="`Información sobre ${layer.label}`"
                        @click="expandedInfoId = expandedInfoId === layer.id ? null : layer.id"
                      ><Info :size="15"/></button>
                    </div>
                  </div>
                  <Transition enter-active-class="transition duration-150" enter-from-class="-translate-y-1 opacity-0" leave-active-class="transition duration-100" leave-to-class="-translate-y-1 opacity-0">
                    <div v-if="expandedInfoId === layer.id" class="mt-2 rounded-lg bg-mist px-3 py-2.5">
                      <p class="ui-label text-[8px] text-river">Resumen provisional</p>
                      <p class="mt-1 text-[11px] leading-relaxed text-ink/58">{{ layer.description }}</p>
                    </div>
                  </Transition>
                </div>
              </div>
            </div>
          </section>
        </div>
        <p class="mt-2 flex gap-2 rounded-xl bg-mist p-3 text-[11px] leading-relaxed text-ink/58"><Info :size="15" class="mt-0.5 shrink-0 text-river"/> Las capas se cargan al activarlas. Las cifras indican entidades gráficas del plano CAD, no obras únicas inventariadas.</p>
      </section>
    </Transition>
  </div>
</template>
