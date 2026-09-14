<script setup lang="ts">
import type { MapLayerDefinition } from '~/types/map'
import { reportDesignOrder } from '~/utils/reportDesign'
const props = defineProps<{ layers: MapLayerDefinition[], reportCount?: number, hideTrigger?: boolean }>()
const emit = defineEmits<{ toggle: [id: string] }>()
const open = defineModel<boolean>('open', { default: false })
const baseMap = defineModel<'simple' | 'satellite'>('baseMap', { default: 'simple' })
const reportTopics = defineModel<string[]>('reportTopics', { default: () => [...reportDesignOrder] })
const expandedInfoId = ref<string | null>(null)
const reportsExpanded = ref(true)
const order = ['citizen-reports', 'river-levels', 'defenses', 'reservoirs', 'channels', 'renabap-neighborhoods', 'pumping', 'basins', 'sub-basins', 'water']
const orderedLayers = computed(() => [...props.layers].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id)))
</script>

<template>
  <div class="pointer-events-none absolute inset-x-0 top-[126px] z-30 px-3 sm:inset-auto sm:left-3 sm:p-0 lg:left-5 lg:top-[70px]">
    <button v-if="!open && !hideTrigger" class="layers-trigger pointer-events-auto" @click="open = true"><img src="/figma/layers.svg" width="29" height="29" alt="" /> Capas</button>
    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-4 opacity-0">
      <section v-if="open" class="layers-panel pointer-events-auto" aria-label="Control de capas">
        <header class="layers-header"><h2>Capas del mapa</h2><button aria-label="Cerrar capas" @click="open = false"><img src="/figma/close.svg" width="21" height="21" alt="" /></button></header>
        <fieldset class="base-options" aria-label="Mapa base">
          <label v-for="option in [{ value: 'simple', label: 'Simple' }, { value: 'satellite', label: 'Satélite' }]" :key="option.value">
            <input v-model="baseMap" type="radio" name="base-map" :value="option.value" />{{ option.label }}
          </label>
        </fieldset>
        <div v-for="layer in orderedLayers" :key="layer.id" class="layer-section">
          <div class="layer-row">
            <button role="switch" :aria-label="`${layer.enabled ? 'Ocultar' : 'Mostrar'} ${layer.label}`" :aria-checked="layer.enabled" :disabled="layer.status === 'soon'" class="layer-switch" @click="emit('toggle', layer.id)"><span /></button>
            <span v-if="layer.id !== 'water'" class="layer-preview" :class="layer.id" aria-hidden="true">
              <img v-if="layer.id === 'citizen-reports'" src="/figma/reports.svg" width="28" height="28" alt="" />
              <img v-else-if="layer.id === 'river-levels'" src="/figma/river.svg" width="24" height="24" alt="" />
            </span>
            <span class="layer-label">{{ layer.label }} <span v-if="layer.id === 'citizen-reports'" class="report-count">{{ props.reportCount ?? 0 }}</span></span>
            <button v-if="layer.id === 'citizen-reports'" class="layer-info" :aria-expanded="reportsExpanded" aria-label="Categorías de reclamos" @click="reportsExpanded = !reportsExpanded"><img src="/figma/chevron.svg" width="16" height="16" alt="" :class="{ '-rotate-90': !reportsExpanded }" /></button>
            <button v-else-if="layer.id !== 'water'" class="layer-info" :aria-expanded="expandedInfoId === layer.id" :aria-label="`Información sobre ${layer.label}`" @click="expandedInfoId = expandedInfoId === layer.id ? null : layer.id"><img src="/figma/info.svg" width="15" height="15" alt="" /></button>
          </div>
          <div v-if="layer.id === 'citizen-reports' && reportsExpanded" class="report-categories">
            <label v-for="topic in reportDesignOrder" :key="topic"><input v-model="reportTopics" type="checkbox" :value="topic" :disabled="!layer.enabled" /><MapReportDesignIcon :topic="topic"/><span>{{ topic === 'Desague tapado' ? 'Desagüe tapado' : topic }}</span></label>
          </div>
          <p v-if="expandedInfoId === layer.id" class="layer-description">{{ layer.description }}</p>
        </div>
      </section>
    </Transition>
  </div>
</template>

<style scoped>
.layers-trigger { display: flex; align-items: center; gap: 8px; border-radius: 24px; background: #1a2741; color: white; padding: 5px 18px 5px 12px; font-size: 13px; box-shadow: 0 3px 5px #0003; }
.layers-panel { width: 370px; max-width: 100%; max-height: calc(100dvh - 160px); overflow: auto; padding: 16px 14px 24px; border-radius: 12px; background: #f7f7f7; color: #1a2741; box-shadow: 0 8px 24px #0003; }
.layers-header { display: flex; align-items: center; justify-content: space-between; padding: 4px 6px 16px; border-bottom: 1.5px solid #dcdcda; }
.layers-header h2 { font-size: 16px; font-weight: 700; }
.layers-header button, .layer-info { display: grid; place-items: center; min-width: 28px; min-height: 28px; cursor: pointer; }
.base-options { display: flex; gap: 8px; padding: 16px 18px; background: #fefefe; }
.base-options label { display: flex; align-items: center; justify-content: center; gap: 8px; flex: 1; padding: 12px 8px; border: 1px solid #d6d9df; border-radius: 10px; font-size: 12px; font-weight: 700; cursor: pointer; }
.base-options label:has(:checked) { border-color: #4ba6de; background: #4ba6de18; }
.base-options input { accent-color: #4ba6de; }
.layer-section { border-top: .7px solid #dcdcda; background: #fefefe; }
.layer-section:last-child { border-bottom: 1.5px solid #dcdcda; }
.layer-row { display: flex; align-items: center; gap: 10px; min-height: 49px; padding: 8px 10px; }
.layer-label { flex: 1; font-size: 12px; font-weight: 700; line-height: 17px; }
.report-count { display: inline-grid; min-width: 22px; height: 20px; margin-left: 4px; place-items: center; border-radius: 999px; background: #e6f4fb; padding: 0 6px; color: #0877ad; font-family: var(--font-mono); font-size: 10px; }
.layer-switch { position: relative; width: 25px; height: 14px; flex-shrink: 0; border-radius: 10px; background: #bcc3cc; cursor: pointer; }
.layer-switch[aria-checked=true] { background: #4ba6de; }
.layer-switch span { position: absolute; top: 1px; left: 1px; width: 12px; height: 12px; border-radius: 50%; background: white; transition: transform .15s; }
.layer-switch[aria-checked=true] span { transform: translateX(11px); }
.layer-preview { display: inline-flex; align-items: center; justify-content: center; width: 25px; flex-shrink: 0; border-radius: 1px; }
.layer-preview.defenses { height: 8px; background: #ba6a47; }
.layer-preview.reservoirs { height: 16px; background: #91b5c3; border: 1px solid #2f82a2; }
.layer-preview.channels { height: 8px; background: #198c8e; }
.layer-preview.renabap-neighborhoods { height: 16px; background: #cf9cb0; }
.layer-preview.pumping::after { content: ''; width: 12px; height: 12px; border-radius: 50%; background: #dda52d; }
.layer-preview.basins { height: 16px; border: 1.5px dashed #4b6d89; }
.layer-preview.sub-basins { height: 16px; border: .7px dashed #4b6d89; }
.layer-preview.river-levels { background: #4ba6de; border-radius: 4px; }
.report-categories { padding: 0 8px 14px 58px; }
.report-categories label { display: flex; align-items: center; gap: 6px; min-height: 31px; font-size: 12px; line-height: 16px; cursor: pointer; }
.report-categories input { width: 12px; height: 12px; flex-shrink: 0; accent-color: #1a2741; }
.report-categories label:has(:disabled) { opacity: .5; }
.layer-description { margin: 0 10px 12px 45px; font-size: 11px; line-height: 17px; }
@media (max-width: 639px) { .layers-panel { width: 100%; } }
</style>
