<script setup lang="ts">
import type { RiverLevelReading } from '~/types/map'
import { fetchInaRiverForecast } from '~/utils/inaRiverForecast'

const props = defineProps<{ readings: RiverLevelReading[], loading: boolean }>()

const forecasts = ref<Awaited<ReturnType<typeof fetchInaRiverForecast>>>([])
const forecastLoading = ref(true)
const forecastError = ref(false)
const controller = new AbortController()
let refreshTimer: ReturnType<typeof setInterval> | undefined

const rows = computed(() => [
  ...props.readings.filter(reading => reading.id === 'santa-fe'),
  ...props.readings.filter(reading => reading.id !== 'santa-fe'),
].map(reading => ({
  reading,
  forecast: forecasts.value.find(entry => entry.stationId === reading.id),
})))
const bulletinDate = computed(() => {
  const issuedOn = forecasts.value[0]?.issuedOn
  return forecasts.value.every(entry => entry.issuedOn === issuedOn) ? issuedOn : undefined
})

const dateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', timeZone: 'America/Argentina/Cordoba',
})
const forecastDateFormatter = new Intl.DateTimeFormat('es-AR', {
  day: '2-digit', month: '2-digit', timeZone: 'UTC',
})
const levelFormatter = new Intl.NumberFormat('es-AR', {
  minimumFractionDigits: 2, maximumFractionDigits: 2,
})

function formatLevel(level: number | null) {
  return level === null ? '—' : `${levelFormatter.format(level)} m`
}

async function loadForecast() {
  forecastLoading.value = true
  try {
    forecasts.value = await fetchInaRiverForecast(AbortSignal.any([controller.signal, AbortSignal.timeout(12_000)]))
    forecastError.value = false
  }
  catch {
    forecasts.value = []
    forecastError.value = true
  }
  finally {
    forecastLoading.value = false
  }
}

onMounted(() => {
  void loadForecast()
  refreshTimer = setInterval(loadForecast, 30 * 60_000)
})

onBeforeUnmount(() => {
  controller.abort()
  if (refreshTimer) clearInterval(refreshTimer)
})
</script>

<template>
  <div class="level-comparison">
    <table v-if="rows.length" aria-describedby="river-table-note">
      <caption class="sr-only">Mediciones y pronósticos de altura por estación</caption>
      <thead>
        <tr>
          <th scope="col">Estación</th>
          <th scope="col">Medición</th>
          <th scope="col">Pronóstico</th>
          <th scope="col">Tendencia</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="{ reading, forecast } in rows" :key="reading.id" :class="{ 'port-row': reading.id === 'santa-fe' }">
          <th scope="row">
            {{ reading.stationName }}
            <small>{{ reading.riverName }}</small>
            <small class="thresholds">
              <span class="alert-threshold">Alerta: {{ formatLevel(reading.alertLevel) }}</span>
              <span class="evacuation-threshold">Evacuación: {{ formatLevel(reading.evacuationLevel) }}</span>
            </small>
          </th>
          <td :class="!reading.isStale ? reading.status : undefined">
            <strong>{{ formatLevel(reading.level) }}</strong>
            <small v-if="reading.observedAt">
              <time :datetime="reading.observedAt">{{ dateFormatter.format(new Date(reading.observedAt)) }}</time>
              <span v-if="reading.isStale"> · Con demora</span>
            </small>
            <small v-if="!reading.isStale && reading.status === 'alert'">En alerta</small>
            <small v-if="!reading.isStale && reading.status === 'evacuation'">Nivel de evacuación</small>
          </td>
          <td v-for="column in (['forecast', 'outlook'] as const)" :key="column">
            <template v-if="forecast?.[column]">
              <strong>{{ formatLevel(forecast[column].level) }}</strong>
              <small>A {{ forecast[column].days }} días</small>
              <small><time :datetime="forecast[column].validOn">{{ forecastDateFormatter.format(new Date(forecast[column].validOn)) }}</time></small>
            </template>
            <span v-else aria-label="Sin dato disponible">—</span>
          </td>
        </tr>
      </tbody>
    </table>
    <p v-else-if="loading" class="table-note" role="status">Consultando estaciones…</p>
    <p v-else class="table-note">No se pudieron consultar las estaciones.</p>
    <p id="river-table-note" class="table-note">
      <span v-if="forecastLoading && !forecasts.length" role="status">Consultando pronósticos del INA…</span>
      <span v-else-if="forecastError" role="status">No se pudo cargar el pronóstico del INA.</span>
      <button v-if="forecastError && !forecastLoading" type="button" @click="loadForecast">Reintentar</button>
      <span v-else-if="!forecastLoading && !forecasts.length">El INA no tiene pronósticos vigentes para estas estaciones.</span>
      <span v-else-if="forecasts.length">
        Valores centrales del boletín<template v-if="bulletinDate"> del <time :datetime="bulletinDate">{{ forecastDateFormatter.format(new Date(bulletinDate)) }}</time></template>.
        Los plazos se cuentan desde su emisión.
      </span>
      <span v-if="rows.length">— indica dato no disponible.</span>
      <a href="https://www.ina.gov.ar/alerta/index.php?seccion=8" target="_blank" rel="noopener noreferrer">Boletines del INA</a>
    </p>
  </div>
</template>

<style scoped>
.level-comparison { margin-top: 20px; }
table { width: 100%; table-layout: fixed; border-collapse: separate; border-spacing: 0; border: 1px solid #51617c; border-radius: 10px; overflow: hidden; font-size: 13px; }
thead { background: #273754; }
th, td { padding: 10px 9px; text-align: left; vertical-align: top; }
thead th:first-child { width: 36%; }
tbody > tr > * { border-top: 1px solid #51617c; }
tbody th { font-weight: 650; }
tbody .port-row { background: #273754; }
td strong { font-variant-numeric: tabular-nums; white-space: nowrap; }
small { display: block; margin-top: 3px; color: #c5d2e6; font-size: 11px; line-height: 1.25; }
.thresholds { display: flex; flex-wrap: wrap; gap: 2px 5px; font-variant-numeric: tabular-nums; }
.alert-threshold { color: #ffba73; }
.evacuation-threshold { color: #ffa3a8; }
@media (min-width: 640px) {
  .evacuation-threshold::before { margin-right: 5px; color: #c5d2e6; content: '|'; }
}
.alert { background: #573916; color: #ffda8c; }
.evacuation { background: #71252e; color: #ffd6d8; }
.alert small, .evacuation small { color: inherit; }
.table-note { display: flex; flex-wrap: wrap; align-items: baseline; gap: 5px 12px; margin-top: 10px; color: #c5d2e6; font-size: 11px; line-height: 1.5; }
.table-note a, .table-note button { color: #ace0ff; text-decoration: underline; cursor: pointer; }
@media (max-width: 420px) {
  table { font-size: 11px; }
  th, td { padding: 8px 4px; }
  small { font-size: 10px; }
}
@media (max-width: 360px) {
  thead th:first-child { width: 40%; }
}
</style>
