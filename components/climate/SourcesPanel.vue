<script setup lang="ts">
import { ExternalLink, CheckCircle2, Eye, CloudSun, GitBranch } from 'lucide-vue-next'

const sources = [
  { name: 'Servicio Meteorológico Nacional', role: 'Información meteorológica nacional' },
  { name: 'Instituto Nacional del Agua', role: 'Información hidrológica' },
  { name: 'CONICET', role: 'Investigación científica' },
  { name: 'NOAA', role: 'Monitoreo climático internacional' },
  { name: 'Organismos provinciales y municipales', role: 'Información territorial y operativa' },
]

const classes = [
  { label: 'Dato observado', text: 'Una medición registrada.', icon: Eye },
  { label: 'Pronóstico', text: 'Una estimación para un plazo definido.', icon: CloudSun },
  { label: 'Escenario', text: 'Una posibilidad analizada, no una predicción.', icon: GitBranch },
]
</script>

<template>
  <section id="fuentes" class="border-y border-ink/10 bg-white px-6 py-16 sm:px-10 lg:px-14 lg:py-20">
    <div class="mx-auto max-w-6xl">
      <div class="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:gap-20">
        <div>
          <p class="ui-label text-river">Transparencia</p>
          <h2 class="waterline mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Fuentes y<br>metodología</h2>
          <p class="mt-6 max-w-md text-sm leading-relaxed text-ink/60">Cada publicación deberá indicar de dónde proviene, cuándo se actualizó y cómo debe interpretarse.</p>
        </div>
        <div>
          <div class="divide-y divide-ink/10 border-y border-ink/10">
            <div v-for="source in sources" :key="source.name" class="group flex items-center gap-4 py-4">
              <CheckCircle2 :size="17" class="shrink-0 text-river"/>
              <div class="min-w-0 flex-1"><p class="text-sm font-semibold">{{ source.name }}</p><p class="mt-0.5 text-xs text-ink/48">{{ source.role }}</p></div>
              <ExternalLink :size="15" class="text-ink/25"/>
            </div>
          </div>
        </div>
      </div>

      <div id="metodologia" class="mt-14 rounded-2xl bg-mist p-5 sm:p-7">
        <p class="text-base font-semibold">Esta plataforma diferencia datos observados, pronósticos y escenarios.</p>
        <div class="mt-5 grid gap-3 md:grid-cols-3">
          <div v-for="item in classes" :key="item.label" class="flex gap-3 border-t border-ink/15 pt-4"><component :is="item.icon" :size="18" class="shrink-0 text-river"/><div><p class="text-xs font-semibold">{{ item.label }}</p><p class="mt-1 text-xs leading-relaxed text-ink/52">{{ item.text }}</p></div></div>
        </div>
      </div>
    </div>
  </section>
</template>
