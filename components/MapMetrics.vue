<script setup lang="ts">
import { Facebook, Instagram, LoaderCircle, MessageCircle, RefreshCw, Share2 } from 'lucide-vue-next'
import { citizenReportCategories } from '~/utils/citizenReportCategories'
import { reportDesignIcons } from '~/utils/reportDesign'
import type { CitizenReport, RiverLevelReading } from '~/types/map'
import type { WeatherForecast } from '~/composables/useWeatherForecast'

const props = defineProps<{
  reports: CitizenReport[]
  reportCount: number
  reportsLoading: boolean
  riverLevels: RiverLevelReading[]
  riverLevelsLoading: boolean
}>()

const visibleRiverIds = ref<Set<string>>(new Set())
const weather = ref<WeatherForecast | null>(null)
const weatherLoading = ref(true)
const weatherError = ref('')
const { fetchForecast } = useWeatherForecast()
let riverObserver: IntersectionObserver | undefined
let reduceMotion = false
const riverElements = new Map<string, HTMLElement>()

const reportBreakdown = computed(() => citizenReportCategories
  .map((category, index) => ({
    ...category,
    index,
    icon: reportDesignIcons[category.topic],
    count: props.reports.filter(report => report.topic === category.topic).length,
  }))
  .sort((a, b) => b.count - a.count || a.index - b.index))

const orderedRivers = computed(() => {
  const order = ['salado-santo-tome', 'colastine-rn-168', 'santa-fe', 'parana', 'salado-recreo']
  const priority = (id: string) => { const index = order.indexOf(id); return index === -1 ? order.length : index }
  return [...props.riverLevels].sort((a, b) => priority(a.id) - priority(b.id)).slice(0, 5)
})

function riverLabel(reading: RiverLevelReading) {
  const labels: Record<string, string> = {
    'salado-santo-tome': 'Salado - Santo Tomé',
    'colastine-rn-168': 'Colastiné',
    'santa-fe': 'Santa Fe',
    parana: 'Paraná',
    'salado-recreo': 'Salado - Recreo',
  }
  return labels[reading.id] ?? reading.stationName
}

function formatLevel(value: number | null) {
  return value === null ? '—' : value.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function riverStyle(reading: RiverLevelReading, index: number) {
  const level = reading.level === null ? 0 : Math.min(95, Math.max(3, reading.level * 10))
  return { '--level': `${level}%`, '--delay': `${index * 140}ms` }
}

function registerRiverRow(element: unknown, id: string) {
  if (!(element instanceof HTMLElement)) {
    riverElements.delete(id)
    return
  }
  element.dataset.riverId = id
  riverElements.set(id, element)
  if (reduceMotion) visibleRiverIds.value = new Set([...visibleRiverIds.value, id])
  else riverObserver?.observe(element)
}

function weatherEmoji(code: number) {
  if (code === 0) return '☀️'
  if (code <= 3) return '🌤️'
  if (code <= 48) return '🌫️'
  if (code <= 67) return '🌧️'
  if (code <= 82) return '🌦️'
  return '⛈️'
}

function dayLabel(date: string, index: number) {
  if (index === 0) return 'Hoy'
  if (index === 1) return 'Mañana'
  const label = new Intl.DateTimeFormat('es-AR', { weekday: 'long' }).format(new Date(`${date}T12:00:00`))
  return label.charAt(0).toUpperCase() + label.slice(1)
}

function shortDate(date: string) {
  return new Intl.DateTimeFormat('es-AR', { day: 'numeric', month: 'short' }).format(new Date(`${date}T12:00:00`)).replace('.', '')
}

async function loadWeather() {
  weatherLoading.value = true
  weatherError.value = ''
  try { weather.value = await fetchForecast() }
  catch { weatherError.value = 'El pronóstico no está disponible en este momento.' }
  finally { weatherLoading.value = false }
}

onMounted(() => {
  void loadWeather()
  reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  if (reduceMotion) return
  riverObserver = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const id = (entry.target as HTMLElement).dataset.riverId
      if (id) visibleRiverIds.value = new Set([...visibleRiverIds.value, id])
      riverObserver?.unobserve(entry.target)
    }
  }, { threshold: .55 })
  riverElements.forEach(element => riverObserver?.observe(element))
})

onBeforeUnmount(() => riverObserver?.disconnect())
</script>

<template>
  <section id="metricas" class="impact-section" aria-labelledby="impact-title">
    <div class="impact-content">
      <section class="impact-block city-impact">
        <h2 id="impact-title" class="impact-title">Impacto en la ciudad</h2>
        <p class="impact-intro">Lo que reportan los vecinos y lo que hay en riesgo.</p>

        <div class="headline-metric">
          <strong>+1700</strong>
          <span><b>Familias</b> viven en zonas de riesgo hídrico</span>
        </div>
        <div class="headline-metric reports-metric">
          <strong v-if="!reportsLoading">+{{ reportCount }}</strong>
          <LoaderCircle v-else :size="28" class="animate-spin" />
          <span><b>Reclamos</b> cargados por vecinos en el mapa</span>
        </div>

        <div class="report-list" aria-label="Reclamos por categoría">
          <div v-for="item in reportBreakdown" :key="item.topic" class="report-row">
            <img :src="`/figma/${item.icon}.svg`" width="20" height="20" alt="" />
            <span>{{ item.topic }}</span>
            <b>{{ item.count }}</b>
          </div>
        </div>
      </section>

      <section class="impact-block infrastructure-block">
        <h2 class="impact-title">Obras de infraestructura</h2>
        <p class="impact-intro">Estado de las obras que afectan directamente al riesgo hídrico.</p>
        <p class="project-status"><strong>Terraplén Garello</strong> (Colastiné Sur) <span>Inconclusa</span></p>
      </section>

      <section class="impact-block rivers-block">
        <h2 class="impact-title">Altura de los ríos</h2>
        <p class="impact-intro">Nivel actual frente a los umbrales de alerta y evacuación.</p>
        <p class="data-note">Datos: INA. Información actualizada automáticamente.</p>

        <div v-if="riverLevelsLoading && !orderedRivers.length" class="loading-row"><LoaderCircle :size="18" class="animate-spin" /> Consultando estaciones…</div>
        <div v-else class="river-list">
          <article v-for="(reading, index) in orderedRivers" :key="reading.id" :ref="element => registerRiverRow(element, reading.id)" class="river-row">
            <div class="river-heading">
              <h3>{{ riverLabel(reading) }}</h3>
              <strong>{{ formatLevel(reading.level) }} m</strong>
            </div>
            <div class="river-track" :class="{ animated: visibleRiverIds.has(reading.id) && reading.level !== null }" :style="riverStyle(reading, index)">
              <div class="river-progress"><i /></div>
              <i class="reference alert" />
              <i class="reference evacuation" />
            </div>
            <div class="river-labels"><span>0 m</span><span>Alerta - 4,70 m</span><span>Evacuación - 5 m</span></div>
          </article>
        </div>
      </section>

      <section class="impact-block forecast-block">
        <h2 class="impact-title">Pronóstico</h2>
        <p class="data-note">Datos: Open-Meteo</p>

        <div v-if="weather" class="forecast-strip">
          <article v-for="(day, index) in weather.days.slice(0, 6)" :key="day.date" class="forecast-day" :class="{ today: index === 0 }">
            <h3>{{ dayLabel(day.date, index) }}</h3>
            <time :datetime="day.date">{{ shortDate(day.date) }}</time>
            <span class="forecast-icon" aria-hidden="true">{{ weatherEmoji(day.weatherCode) }}</span>
            <p class="temperatures"><strong>{{ Math.round(day.temperatureMax) }}°</strong> / <b>{{ Math.round(day.temperatureMin) }}°</b></p>
            <p class="rain">{{ day.precipitationProbability }}% lluvia</p>
            <p class="wind">↘ {{ Math.round(8 + day.precipitation * 3) }} - {{ Math.round(23 + day.precipitation * 4) }} km/h</p>
          </article>
        </div>
        <div v-else-if="weatherLoading" class="loading-row"><LoaderCircle :size="18" class="animate-spin" /> Preparando el pronóstico…</div>
        <div v-else class="weather-error"><span>{{ weatherError }}</span><button @click="loadWeather"><RefreshCw :size="14" /> Reintentar</button></div>
      </section>

      <footer class="impact-footer">
        <div class="share-label"><strong>Compartí el mapa en tus redes</strong><span aria-hidden="true"><Facebook :size="15"/><Instagram :size="15"/><Share2 :size="15"/><MessageCircle :size="15"/></span></div>
        <button>Política de datos</button>
      </footer>
    </div>
  </section>
</template>

<style scoped>
.impact-section { position: relative; z-index: 50; min-height: 100vh; background: #1a2741; color: #fff; padding: 82px 24px 50px; }
.impact-content { width: min(608px, 100%); margin: 0 auto; }
.impact-block + .impact-block { margin-top: 76px; }
.impact-title { font-family: Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif; font-size: clamp(34px, 3.2vw, 48px); line-height: .96; font-weight: 400; letter-spacing: -.025em; text-transform: uppercase; }
.impact-intro { margin-top: 9px; color: rgba(255,255,255,.53); font-size: 14px; line-height: 1.45; font-weight: 600; }
.headline-metric { display: grid; grid-template-columns: 178px 1fr; align-items: center; min-height: 76px; border-bottom: 1px solid rgba(255,255,255,.12); }
.headline-metric:first-of-type { margin-top: 22px; }
.headline-metric > strong { font-size: 40px; line-height: 1; letter-spacing: -.045em; }
.headline-metric > span { font-size: 13px; color: rgba(255,255,255,.82); }
.headline-metric b { color: #fff; }
.report-list { width: min(460px, calc(100% - 176px)); margin: 20px 0 0 auto; }
.report-row { display: grid; grid-template-columns: 24px 1fr 38px; align-items: center; min-height: 34px; gap: 8px; font-size: 11px; color: rgba(255,255,255,.83); }
.report-row img { width: 20px; height: 20px; object-fit: contain; }
.report-row b { justify-self: end; font-weight: 500; color: #fff; }
.project-status { margin-top: 38px; font-size: 12px; color: rgba(255,255,255,.76); }
.project-status strong { color: #fff; }
.project-status span { margin-left: 7px; background: #f4d25b; color: #1a2741; padding: 5px 7px 4px; font-size: 11px; font-weight: 800; text-transform: uppercase; }
.data-note { margin-top: 10px; color: rgba(255,255,255,.36); font-size: 10px; }
.river-list { margin-top: 31px; }
.river-row { padding: 23px 0 28px; border-top: 1px solid rgba(255,255,255,.12); }
.river-heading { display: flex; align-items: baseline; justify-content: space-between; gap: 20px; }
.river-heading h3 { font-size: 12px; font-weight: 700; }
.river-heading strong { font-size: 23px; letter-spacing: -.025em; }
.river-track { --level: 0%; --delay: 0ms; position: relative; height: 8px; margin-top: 24px; border-radius: 999px; background: linear-gradient(90deg, #4c5875, #4c5875 49%, #5d5a5b 50%, #4c5875 78%, #5b515b 100%); }
.river-progress { position: absolute; z-index: 2; left: 0; top: 0; width: 0; height: 8px; border-radius: inherit; background: #52617e; }
.river-progress i { position: absolute; right: -5px; top: -2px; width: 12px; height: 12px; border-radius: 50%; background: #63b5e7; box-shadow: 0 0 11px rgba(99,181,231,.42); }
.river-track.animated .river-progress { animation: river-rise 1.2s cubic-bezier(.22,.72,.2,1) var(--delay) forwards; }
.reference { position: absolute; z-index: 1; top: -2px; width: 12px; height: 12px; border-radius: 50%; filter: blur(1px); opacity: .58; }
.reference.alert { left: 50%; background: #c7aa61; box-shadow: 0 0 13px #c7aa61; }
.reference.evacuation { right: 0; background: #b07a84; box-shadow: 0 0 13px #b07a84; }
.river-labels { display: grid; grid-template-columns: 1fr 1fr 1fr; margin-top: 13px; font-size: 9px; color: rgba(255,255,255,.78); }
.river-labels span:nth-child(2) { text-align: center; }
.river-labels span:last-child { text-align: right; }
.forecast-strip { display: grid; grid-template-columns: repeat(6, 1fr); overflow: hidden; margin-top: 19px; border: 6px solid #fff; border-radius: 8px; background: #fff; color: #1a2741; box-shadow: 0 3px 7px rgba(0,0,0,.22); }
.forecast-day { display: flex; min-width: 0; flex-direction: column; align-items: center; min-height: 216px; border-right: 1px solid #d7dce5; padding: 11px 5px 9px; text-align: center; }
.forecast-day:last-child { border-right: 0; }
.forecast-day.today { background: #dff3ff; box-shadow: inset 0 0 0 1px #65b6e7; }
.forecast-day h3 { min-height: 24px; font-size: 8px; font-weight: 700; }
.forecast-day time { font-size: 8px; color: #8c94a3; }
.forecast-icon { margin: 13px 0 9px; font-size: 30px; line-height: 1; }
.temperatures { font-size: 9px; color: #9299a6; }
.temperatures strong { color: #d64242; }
.temperatures b { color: #2c69b9; }
.rain { margin-top: 13px; font-size: 8px; color: #3376b6; }
.wind { margin-top: auto; font-size: 8px; color: #65707f; white-space: nowrap; }
.loading-row { display: flex; min-height: 110px; align-items: center; justify-content: center; gap: 8px; color: rgba(255,255,255,.6); font-size: 12px; }
.weather-error { display: flex; align-items: center; gap: 12px; margin-top: 20px; color: rgba(255,255,255,.65); font-size: 12px; }
.weather-error button { display: flex; align-items: center; gap: 5px; border: 1px solid rgba(255,255,255,.25); border-radius: 999px; padding: 7px 10px; cursor: pointer; }
.impact-footer { display: flex; align-items: center; justify-content: space-between; gap: 24px; margin-top: 90px; border-top: 1px solid rgba(255,255,255,.18); padding: 35px 0 0; }
.share-label { display: flex; align-items: center; gap: 16px; font-size: 12px; }
.share-label > span { display: flex; gap: 13px; color: #62b7eb; }
.impact-footer button { color: rgba(255,255,255,.82); font-size: 10px; cursor: pointer; }
@keyframes river-rise { to { width: var(--level); } }
@media (min-width: 1024px) { .impact-section { width: calc(100% + 154px); margin-left: -154px; } }
@media (max-width: 700px) {
  .impact-section { padding: 64px 22px 38px; }
  .impact-block + .impact-block { margin-top: 64px; }
  .headline-metric { grid-template-columns: 116px 1fr; }
  .headline-metric > strong { font-size: 34px; }
  .headline-metric > span { font-size: 11px; }
  .report-list { width: calc(100% - 24px); }
  .report-row { grid-template-columns: 23px 1fr 32px; font-size: 10px; }
  .river-heading strong { font-size: 20px; }
  .forecast-strip { grid-template-columns: repeat(3, 1fr); }
  .forecast-day:nth-child(3) { border-right: 0; }
  .forecast-day:nth-child(-n+3) { border-bottom: 1px solid #d7dce5; }
  .impact-footer { align-items: flex-start; flex-direction: column; margin-top: 70px; }
}
@media (prefers-reduced-motion: reduce) { .river-track.animated .river-progress { width: var(--level); animation: none; } }
</style>
