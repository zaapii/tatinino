<script setup lang="ts">
import { MapPin, X, DraftingCompass, TriangleAlert } from 'lucide-vue-next'
import type { MapSelection } from '~/types/map'

const props = defineProps<{ point: MapSelection }>()
defineEmits<{ close: [] }>()

const geometryLabels: Record<string, string> = {
  Point: 'Punto',
  MultiPoint: 'Conjunto de puntos',
  LineString: 'Línea',
  MultiLineString: 'Conjunto de líneas',
  Polygon: 'Polígono',
  MultiPolygon: 'Conjunto de polígonos',
}

const propertyLabels: Record<string, string> = {
  layer: 'Capa original',
  entity_type: 'Entidad CAD',
  handle: 'Referencia CAD',
  text: 'Anotación',
  numeric_value: 'Valor numérico',
  radius_m_drawing_units: 'Radio en plano',
}

const detailRows = computed(() => {
  if (!props.point.feature) return []
  const preferredKeys = ['text', 'numeric_value', 'layer', 'entity_type', 'handle', 'radius_m_drawing_units']
  return preferredKeys
    .filter(key => props.point.feature?.properties[key] !== undefined && props.point.feature?.properties[key] !== null && props.point.feature?.properties[key] !== '')
    .map(key => ({ label: propertyLabels[key] ?? key, value: props.point.feature!.properties[key] }))
})
</script>

<template>
  <section class="surface-panel absolute inset-x-3 bottom-3 z-40 max-h-[72dvh] overflow-auto rounded-2xl p-4 sm:inset-auto sm:right-5 sm:top-[132px] sm:w-[348px]" aria-live="polite">
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p class="ui-label text-river">Consulta en el mapa</p>
        <h2 class="mt-1 text-lg font-semibold tracking-[-.02em]">{{ point.feature?.layerLabel ?? 'Ubicación consultada' }}</h2>
      </div>
      <button class="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar información" @click="$emit('close')"><X :size="18"/></button>
    </header>

    <div v-if="point.feature" class="mt-4">
      <div class="flex items-center gap-3 rounded-xl p-3.5 text-white" :style="{ backgroundColor: point.feature.color }">
        <DraftingCompass :size="18" class="shrink-0"/>
        <div><p class="text-xs font-semibold">Elemento del plano hidráulico</p><p class="mt-0.5 text-[10px] text-white/75">{{ geometryLabels[point.feature.geometryType] ?? point.feature.geometryType }} · Actualización 2025</p></div>
      </div>

      <dl v-if="detailRows.length" class="mt-3 divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10">
        <div v-for="row in detailRows" :key="row.label" class="grid grid-cols-[110px_1fr] gap-3 bg-white px-3 py-2.5">
          <dt class="ui-label text-[8px] text-ink/40">{{ row.label }}</dt>
          <dd class="break-words text-right font-mono text-[10px] text-ink/72">{{ row.value }}</dd>
        </div>
      </dl>

      <p v-if="point.feature.layerId === 'elevation'" class="mt-3 flex gap-2 rounded-xl bg-[#fff8ea] p-3 text-[11px] leading-relaxed text-ink/65"><TriangleAlert :size="15" class="mt-0.5 shrink-0 text-[#a66d13]"/> Esta anotación no está validada como cota del terreno. Puede referirse a conductos u otros elementos de obra.</p>
    </div>

    <div v-else class="mt-4 flex items-start gap-3 rounded-xl bg-mist p-3.5"><MapPin :size="18" class="mt-0.5 shrink-0 text-river"/><div><p class="text-xs font-semibold">Sin elemento técnico seleccionado</p><p class="mt-1 text-xs leading-relaxed text-ink/57">Activá una capa o acercate al mapa para consultar su información.</p></div></div>

    <div class="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10">
      <div class="bg-white p-3"><p class="ui-label text-[9px] text-ink/42">Latitud</p><p class="mt-1 font-mono text-xs">{{ point.latitude.toFixed(6) }}</p></div>
      <div class="bg-white p-3"><p class="ui-label text-[9px] text-ink/42">Longitud</p><p class="mt-1 font-mono text-xs">{{ point.longitude.toFixed(6) }}</p></div>
    </div>

    <p class="mt-3 text-[10px] leading-relaxed text-ink/46">Fuente: Plano Hidráulica Santa Fe, actualización 2025. Conversión GeoJSON provista para esta maqueta; proyección de origen asumida y pendiente de validación técnica.</p>
  </section>
</template>
