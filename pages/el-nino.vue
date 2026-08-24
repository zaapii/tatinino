<script setup lang="ts">
import { Droplets, Sprout, Waves, Route, ArrowDown, BookOpen } from 'lucide-vue-next'

useSeoMeta({
  title: 'El fenómeno de El Niño',
  description: 'Información verificada para entender El Niño y su posible impacto en Santa Fe y el Litoral argentino.',
})

const indicators = [
  { label: 'Precipitaciones', detail: 'Pendiente de fuente oficial', icon: Droplets },
  { label: 'Humedad del suelo', detail: 'Datos en preparación', icon: Sprout },
  { label: 'Niveles de ríos', detail: 'Pendiente de fuente oficial', icon: Waves },
  { label: 'Posibles escenarios', detail: 'Próximamente', icon: Route },
]
</script>

<template>
  <div class="bg-paper">
    <header class="relative overflow-hidden border-b border-ink/10 px-6 pb-14 pt-12 sm:px-10 sm:pb-20 sm:pt-16 lg:px-14 lg:pb-24 lg:pt-20">
      <div class="pointer-events-none absolute right-[-8rem] top-[-17rem] size-[38rem] rounded-full border border-river/10" />
      <div class="pointer-events-none absolute right-[-4rem] top-[-12rem] size-[30rem] rounded-full border border-river/10" />
      <div class="relative mx-auto max-w-6xl">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="ui-label text-river">Clima · Explicado con evidencia</p>
          <p class="ui-label flex items-center gap-2 text-ink/40"><span class="size-1.5 rounded-full bg-river"/> Datos abiertos · Fuentes verificables · Actualización permanente</p>
        </div>
        <div class="mt-16 grid items-end gap-10 lg:mt-24 lg:grid-cols-[1fr_.55fr]">
          <div>
            <h1 class="max-w-3xl text-[clamp(3.1rem,7vw,6.8rem)] font-semibold leading-[.86] tracking-[-.065em]">El fenómeno<br><span class="text-river">de El Niño</span></h1>
            <p class="mt-8 max-w-2xl text-base leading-relaxed text-ink/62 sm:text-lg">Información verificada para entender su funcionamiento y su posible impacto en nuestra región.</p>
          </div>
          <a href="#entender" class="group hidden items-center justify-between border-b border-ink/25 pb-3 text-xs font-semibold lg:flex">Empezar por lo esencial <ArrowDown :size="17" class="transition-transform group-hover:translate-y-1"/></a>
        </div>
      </div>
    </header>

    <div>
      <section id="entender" class="px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div class="mx-auto grid max-w-6xl gap-14 lg:grid-cols-[.65fr_1.35fr] lg:gap-24">
          <div><p class="ui-label text-river">Punto de partida</p><h2 class="waterline mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">¿Qué es<br>El Niño?</h2></div>
          <div class="max-w-3xl">
            <p class="text-xl font-medium leading-relaxed tracking-[-.02em] text-ink/78 sm:text-2xl">Esta sección presentará una explicación científica clara, revisada y acompañada por sus fuentes.</p>
            <div class="mt-8 flex gap-3 border-l-2 border-river/35 pl-5"><BookOpen :size="18" class="mt-0.5 shrink-0 text-river"/><p class="text-sm leading-relaxed text-ink/55">El contenido se incorporará después de validar la redacción con información de organismos especializados. No se publican afirmaciones provisorias como si fueran datos oficiales.</p></div>
          </div>
        </div>
      </section>

      <section class="bg-mist px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div class="mx-auto max-w-6xl">
          <div class="grid gap-10 lg:grid-cols-2 lg:gap-20">
            <div><p class="ui-label text-river">Escala regional</p><h2 class="mt-3 max-w-lg text-3xl font-semibold tracking-[-.04em] sm:text-4xl">¿Cómo puede afectar a nuestra región?</h2></div>
            <div><p class="text-base leading-relaxed text-ink/62">Aquí se explicará la relación posible con Santa Fe y el Litoral argentino a partir de fuentes verificadas, distinguiendo patrones generales, condiciones actuales y niveles de incertidumbre.</p><p class="mt-5 inline-flex rounded-full border border-ink/10 bg-white px-3 py-1.5 ui-label text-[9px] text-ink/45">Contenido científico en preparación</p></div>
          </div>
          <div class="mt-14"><ClimateStatus /></div>
        </div>
      </section>

      <section class="px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div class="mx-auto max-w-6xl">
          <div class="grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:gap-20">
            <div><p class="ui-label text-river">Lectura local</p><h2 class="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">¿Qué significa<br>para Santa Fe?</h2><p class="mt-5 max-w-md text-sm leading-relaxed text-ink/55">Estas variables se mostrarán cuando existan datos vinculados a una fuente y una fecha de actualización.</p></div>
            <div class="grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 sm:grid-cols-2">
              <div v-for="indicator in indicators" :key="indicator.label" class="min-h-40 bg-white p-5 sm:p-6"><component :is="indicator.icon" :size="21" class="text-river"/><p class="mt-8 text-sm font-semibold">{{ indicator.label }}</p><p class="mt-2 text-xs text-ink/45">{{ indicator.detail }}</p></div>
            </div>
          </div>
        </div>
      </section>

      <ClimateSourcesPanel />
    </div>
    <AppFooter />
  </div>
</template>
