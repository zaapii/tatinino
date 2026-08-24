<script setup lang="ts">
import { MessageSquareWarning, X, Construction, MapPin, CircleDotDashed } from 'lucide-vue-next'

const open = defineModel<boolean>('open', { default: false })

const reportTypes = [
  'Boca de tormenta obstruida',
  'Desagüe o canal tapado',
  'Calle anegada',
  'Problema en defensa o terraplén',
]
</script>

<template>
  <div class="pointer-events-none absolute bottom-0 left-[112px] z-30 p-3 sm:bottom-auto sm:left-5 sm:top-[188px] sm:p-0">
    <button v-if="!open" class="surface-panel pointer-events-auto flex items-center gap-2 rounded-xl px-3.5 py-3 text-sm font-semibold transition hover:bg-mist sm:px-4" @click="open = true">
      <MessageSquareWarning :size="18" class="text-river"/><span class="sm:hidden">Reportar</span><span class="hidden sm:inline">Reportar un problema</span>
    </button>
    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-4 opacity-0">
      <section v-if="open" class="surface-panel pointer-events-auto fixed inset-x-3 bottom-3 max-h-[76dvh] overflow-auto rounded-2xl p-4 sm:absolute sm:bottom-auto sm:left-0 sm:top-0 sm:w-[350px]" aria-label="Reportar un punto crítico">
        <header class="flex items-start justify-between gap-4 border-b border-ink/10 pb-3"><div><p class="ui-label text-river">Participación ciudadana</p><h2 class="mt-1 text-lg font-semibold">Reportar un punto crítico</h2></div><button class="grid size-8 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar reporte" @click="open = false"><X :size="18"/></button></header>
        <div class="mt-4 flex gap-3 rounded-xl bg-mist p-3.5"><Construction :size="18" class="mt-0.5 shrink-0 text-river"/><div><p class="text-xs font-semibold">Función prevista para una próxima etapa</p><p class="mt-1 text-[11px] leading-relaxed text-ink/52">Permitirá ubicar el problema, describirlo y acompañarlo con información útil.</p></div></div>
        <p class="mt-5 ui-label text-[9px] text-ink/40">Tipos de reporte previstos</p>
        <div class="mt-2 divide-y divide-ink/8 border-y border-ink/10">
          <div v-for="type in reportTypes" :key="type" class="flex items-center gap-3 py-3 text-xs font-medium"><MapPin :size="15" class="shrink-0 text-river"/>{{ type }}</div>
        </div>
        <p class="mt-4 flex gap-2 text-[11px] leading-relaxed text-ink/52"><CircleDotDashed :size="16" class="mt-0.5 shrink-0 text-sand"/> Cada reporte tendrá estado de validación y seguimiento. La interfaz distinguirá claramente lo informado por la comunidad de lo verificado oficialmente.</p>
        <button disabled class="mt-5 w-full cursor-not-allowed rounded-xl bg-ink/8 px-4 py-3 text-xs font-semibold text-ink/38">Disponible con el sistema de validación</button>
      </section>
    </Transition>
  </div>
</template>
