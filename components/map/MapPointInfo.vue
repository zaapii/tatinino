<script setup lang="ts">
import { ArrowUpRight, MapPin, X, DraftingCompass, LandPlot, TriangleAlert, Waves } from 'lucide-vue-next'
import type { MapSelection } from '~/types/map'

const props = defineProps<{ point: MapSelection }>()
defineEmits<{
  close: []
}>()
const isCitizenReport = computed(() => props.point.feature?.layerId === 'citizen-reports')
const isGraveReport = computed(() => isCitizenReport.value && props.point.feature?.properties.severity === 'grave')
const isRenabapNeighborhood = computed(() => props.point.feature?.layerId === 'renabap-neighborhoods')
const isRiverLevel = computed(() => props.point.feature?.layerId === 'river-levels')
const isRiverReference = computed(() => isRiverLevel.value && props.point.feature?.properties.isRiverReference === true)

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
  display_value: 'Cota interpretada',
  classification: 'Clasificación',
  radius_m_drawing_units: 'Radio en plano',
  topic: 'Tema',
  description: 'Descripción',
  neighborhood: 'Barrio',
  createdAt: 'Carga',
  statusLabel: 'Estado',
  severityLabel: 'Severidad',
  photoName: 'Foto',
  photoUrl: 'Imagen',
  barrio: 'Barrio popular',
  familias: 'Familias registradas',
  renabap_id: 'ID RENABAP',
  localidad: 'Localidad',
  departamento: 'Departamento',
  provincia: 'Provincia',
  stationName: 'Estación',
  levelLabel: 'Altura',
  observedAtLabel: 'Medición',
  updatedAtLabel: 'Publicación',
  trendLabel: 'Tendencia',
  riverStatusLabel: 'Referencia',
  lowWaterLevelLabel: 'Aguas bajas',
  alertLevelLabel: 'Alerta',
  evacuationLevelLabel: 'Evacuación',
  sourceName: 'Organismo',
}

const detailRows = computed(() => {
  if (!props.point.feature) return []
  const preferredKeys = isCitizenReport.value
    ? ['severityLabel', 'neighborhood', 'description', 'createdAt', 'statusLabel', 'photoName']
    : isRiverLevel.value
      ? ['stationName', 'levelLabel', 'observedAtLabel', 'trendLabel', 'riverStatusLabel', 'lowWaterLevelLabel', 'alertLevelLabel', 'evacuationLevelLabel', 'sourceName']
    : isRenabapNeighborhood.value
      ? ['barrio', 'familias', 'renabap_id', 'localidad', 'departamento', 'provincia']
      : ['display_value', 'text', 'classification', 'layer', 'entity_type', 'handle', 'radius_m_drawing_units']
  return preferredKeys
    .filter(key => props.point.feature?.properties[key] !== undefined && props.point.feature?.properties[key] !== null && props.point.feature?.properties[key] !== '')
    .map(key => ({ key, label: propertyLabels[key] ?? key, value: props.point.feature!.properties[key] }))
})

function detailRowClass(key: string) {
  if (key === 'severityLabel' && props.point.feature?.properties.severity === 'grave') return 'bg-[#fff5f5]'
  if (key === 'severityLabel') return 'bg-[#fff9e8]'
  if (key === 'alertLevelLabel') return 'bg-[#fff8e6]'
  if (key === 'evacuationLevelLabel') return 'bg-[#fff5f5]'
  return 'bg-white'
}

function detailLabelClass(key: string) {
  if (key === 'severityLabel' && props.point.feature?.properties.severity === 'grave') return 'text-[#b9312b]'
  if (key === 'severityLabel') return 'text-[#8a650c]'
  if (key === 'alertLevelLabel') return 'text-[#a66d13]'
  if (key === 'evacuationLevelLabel') return 'text-[#c83232]'
  return 'text-ink/40'
}

function detailValueClass(key: string) {
  if (key === 'severityLabel' && props.point.feature?.properties.severity === 'grave') return 'font-semibold text-[#b9312b]'
  if (key === 'severityLabel') return 'font-semibold text-[#8a650c]'
  if (key === 'alertLevelLabel') return 'font-semibold text-[#a66d13]'
  if (key === 'evacuationLevelLabel') return 'font-semibold text-[#c83232]'
  return 'text-ink/72'
}
</script>

<template>
  <section class="surface-panel absolute inset-x-3 bottom-3 z-40 max-h-[72dvh] overflow-auto rounded-2xl p-4 sm:inset-auto sm:right-5 sm:top-[132px] sm:w-[348px]" aria-live="polite">
    <header class="flex items-start justify-between gap-4">
      <div class="min-w-0">
        <p v-if="!isCitizenReport" class="ui-label text-river">Consulta en el mapa</p>
        <h2 class="text-lg font-semibold tracking-[-.02em]" :class="!isCitizenReport ? 'mt-1' : ''">{{ point.feature?.layerLabel ?? 'Ubicación consultada' }}</h2>
      </div>
      <button class="grid size-8 shrink-0 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar información" @click="$emit('close')"><X :size="18"/></button>
    </header>

    <div v-if="point.feature && isCitizenReport" class="mt-4">
      <div class="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5" :class="isGraveReport ? 'bg-[#fff5f5]' : 'bg-[#fff9e8]'">
        <span class="ui-label text-[8px]" :class="isGraveReport ? 'text-[#b9312b]' : 'text-[#8a650c]'">Severidad</span>
        <span class="text-xs font-semibold" :class="isGraveReport ? 'text-[#b9312b]' : 'text-[#8a650c]'">{{ point.feature.properties.severityLabel ?? point.feature.properties.severity }}</span>
      </div>

      <a v-if="point.feature.properties.photoUrl" :href="String(point.feature.properties.photoUrl)" target="_blank" rel="noopener noreferrer" class="mt-3 block overflow-hidden rounded-xl border border-ink/10 bg-mist">
        <img :src="String(point.feature.properties.photoUrl)" :alt="`Foto del reclamo: ${point.feature.layerLabel}`" class="max-h-52 w-full object-cover"/>
      </a>

      <div class="mt-3">
        <p class="ui-label text-[8px] text-ink/40">Descripción</p>
        <p class="mt-1.5 whitespace-pre-wrap text-xs leading-relaxed text-ink/72">{{ point.feature.properties.description || 'Sin descripción' }}</p>
      </div>
    </div>

    <div v-else-if="point.feature" class="mt-4">
      <div class="flex items-center gap-3 rounded-xl p-3.5 text-white" :style="{ backgroundColor: point.feature.color }">
        <Waves v-if="isRiverLevel" :size="18" class="shrink-0"/>
        <LandPlot v-else-if="isRenabapNeighborhood" :size="18" class="shrink-0"/>
        <DraftingCompass v-else :size="18" class="shrink-0"/>
        <div><p class="text-xs font-semibold">{{ isRiverReference ? 'Referencia repetida sobre el cauce' : isRiverLevel ? 'Escala hidrométrica oficial' : isRenabapNeighborhood ? 'Barrio popular · RENABAP' : 'Elemento del plano hidráulico' }}</p><p class="mt-0.5 text-[10px] text-white/75">{{ isRiverLevel ? String(point.feature.properties.dataStateLabel ?? 'Último dato disponible') : isRenabapNeighborhood ? 'Delimitación territorial del registro nacional' : `${geometryLabels[point.feature.geometryType] ?? point.feature.geometryType} · Actualización 2025` }}</p></div>
      </div>

      <dl v-if="detailRows.length" class="mt-3 divide-y divide-ink/8 overflow-hidden rounded-xl border border-ink/10">
        <div v-for="row in detailRows" :key="row.key" class="grid grid-cols-[110px_1fr] gap-3 px-3 py-2.5" :class="detailRowClass(row.key)">
          <dt class="ui-label text-[8px]" :class="detailLabelClass(row.key)">{{ row.label }}</dt>
          <dd class="break-words text-right font-mono text-[10px]" :class="detailValueClass(row.key)">{{ row.value }}</dd>
        </div>
      </dl>

      <p v-if="point.feature.layerId === 'conduit-elevations'" class="mt-3 flex gap-2 rounded-xl bg-[#fff8ea] p-3 text-[11px] leading-relaxed text-ink/65"><TriangleAlert :size="15" class="mt-0.5 shrink-0 text-[#a66d13]"/> Es una cota de fondo de conducto inferida por el prefijo FC del plano. No representa la altura de la calle ni del terreno.</p>
      <p v-else-if="point.feature.layerId === 'elevation'" class="mt-3 flex gap-2 rounded-xl bg-[#fff8ea] p-3 text-[11px] leading-relaxed text-ink/65"><TriangleAlert :size="15" class="mt-0.5 shrink-0 text-[#a66d13]"/> El significado y la unidad de esta anotación no están clasificados. Se conserva únicamente para revisar el plano original.</p>
      <p v-else-if="isRenabapNeighborhood" class="mt-3 flex gap-2 rounded-xl bg-[#b64f7a]/8 p-3 text-[11px] leading-relaxed text-ink/65"><TriangleAlert :size="15" class="mt-0.5 shrink-0 text-[#8d3158]"/> La delimitación y la cantidad de familias corresponden al archivo RENABAP incorporado. No representan límites catastrales ni un relevamiento en tiempo real.</p>
      <p v-else-if="isRiverReference" class="mt-3 flex gap-2 rounded-xl bg-[#fff8ea] p-3 text-[11px] leading-relaxed text-ink/65"><TriangleAlert :size="15" class="mt-0.5 shrink-0 text-[#a66d13]"/> Esta etiqueta repite el dato de la estación indicada. No es una medición en esta ubicación ni una estimación de la altura local.</p>
      <p v-else-if="isRiverLevel && point.feature.properties.isStale" class="mt-3 flex gap-2 rounded-xl bg-[#fff8ea] p-3 text-[11px] leading-relaxed text-ink/65"><TriangleAlert :size="15" class="mt-0.5 shrink-0 text-[#a66d13]"/> Esta estación presenta demora. Se muestra la última medición disponible y su fecha, pero no debe interpretarse como un valor actual.</p>
      <p v-else-if="isRiverLevel" class="mt-3 flex gap-2 rounded-xl bg-river/8 p-3 text-[11px] leading-relaxed text-ink/65"><Waves :size="15" class="mt-0.5 shrink-0 text-river"/> Dato oficial de referencia. La escala no reemplaza las alertas ni las indicaciones de los organismos de emergencia.</p>
      <a v-if="isRiverLevel && point.feature.properties.dataUrl" :href="String(point.feature.properties.dataUrl)" target="_blank" rel="noopener noreferrer" class="mt-3 flex items-center justify-between rounded-xl border border-river/15 bg-river/5 px-3 py-2.5 text-[10px] font-semibold text-river transition hover:bg-river/10">Ver serie oficial del INA <ArrowUpRight :size="14"/></a>
    </div>

    <div v-else class="mt-4 flex items-start gap-3 rounded-xl bg-mist p-3.5"><MapPin :size="18" class="mt-0.5 shrink-0 text-river"/><div><p class="text-xs font-semibold">Sin elemento técnico seleccionado</p><p class="mt-1 text-xs leading-relaxed text-ink/57">Activá una capa o acercate al mapa para consultar su información.</p></div></div>

    <div v-if="!isCitizenReport" class="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-ink/10 bg-ink/10">
      <div class="bg-white p-3"><p class="ui-label text-[9px] text-ink/42">Latitud</p><p class="mt-1 font-mono text-xs">{{ point.latitude.toFixed(6) }}</p></div>
      <div class="bg-white p-3"><p class="ui-label text-[9px] text-ink/42">Longitud</p><p class="mt-1 font-mono text-xs">{{ point.longitude.toFixed(6) }}</p></div>
    </div>


    <p v-if="!isCitizenReport" class="mt-3 text-[10px] leading-relaxed text-ink/46">{{ isRiverLevel ? 'Fuente: API pública del Sistema de Información y Alerta Hidrológico del Instituto Nacional del Agua. Las fechas y umbrales corresponden a cada estación.' : isRenabapNeighborhood ? 'Fuente: archivo “Barrios RENABAP.csv”, convertido a GeoJSON sin modificar sus coordenadas WGS84 ni sus atributos principales.' : 'Fuente: Plano Hidráulica Santa Fe, actualización 2025. Conversión GeoJSON provista para esta maqueta; proyección de origen asumida y pendiente de validación técnica.' }}</p>
  </section>
</template>
