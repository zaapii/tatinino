<script setup lang="ts">
import { Cable, Clock3, CircleDashed } from 'lucide-vue-next'

const today = new Intl.DateTimeFormat('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date())
</script>

<template>
  <section class="relative overflow-hidden rounded-[1.4rem] bg-ink p-6 text-white sm:p-8">
    <div class="absolute -right-16 -top-20 size-72 rounded-full border border-river-light/15" />
    <div class="absolute -right-5 -top-10 size-52 rounded-full border border-river-light/20" />
    <div class="relative">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <p class="ui-label flex items-center gap-2 text-river-light"><CircleDashed :size="14"/> Situación actual</p>
        <p class="flex items-center gap-2 text-[11px] text-white/45"><Clock3 :size="13"/> Estado revisado: {{ today }}</p>
      </div>
      <div class="mt-12 sm:mt-16">
        <p class="text-sm text-white/55">Estado actualizado</p>
        <h2 class="mt-2 max-w-2xl text-2xl font-semibold leading-tight tracking-[-.035em] sm:text-3xl">Pendiente de conexión con fuentes oficiales</h2>
        <p class="mt-5 flex max-w-xl items-start gap-2.5 text-xs leading-relaxed text-white/55"><Cable :size="16" class="mt-0.5 shrink-0 text-sand"/> Este espacio publicará el estado vigente solo cuando exista una fuente identificada, verificable y fechada.</p>
      </div>
    </div>
  </section>
</template>
