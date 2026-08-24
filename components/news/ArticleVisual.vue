<script setup lang="ts">
import { BookOpenText, ScanSearch, CheckCheck } from 'lucide-vue-next'
import type { ArticleVisualVariant } from '~/types/content'

defineProps<{ variant: ArticleVisualVariant; compact?: boolean }>()
</script>

<template>
  <div class="article-visual relative isolate overflow-hidden" :class="[`article-visual--${variant}`, compact ? 'min-h-44' : 'min-h-[270px] sm:min-h-[360px]']" aria-hidden="true">
    <template v-if="variant === 'topography'">
      <div class="contour contour-a" /><div class="contour contour-b" /><div class="contour contour-c" />
      <div class="absolute bottom-5 left-5 z-10 sm:bottom-7 sm:left-7">
        <p class="ui-label text-river-light">Territorio · Método · Lectura</p>
        <p class="mt-2 max-w-[13rem] text-lg font-semibold leading-tight text-white sm:text-xl">Del dato técnico a una herramienta pública</p>
      </div>
      <div class="gauge absolute inset-y-0 right-5 w-7 border-x border-white/15 sm:right-8">
        <span v-for="n in 11" :key="n" class="block h-[9.09%] border-t border-white/35" :class="n % 2 ? 'w-1/2' : 'w-full'" />
      </div>
    </template>
    <template v-else-if="variant === 'reading'">
      <div class="reading-grid absolute inset-0" />
      <ScanSearch :size="compact ? 34 : 46" :stroke-width="1.25" class="absolute left-5 top-5 text-ink sm:left-7 sm:top-7" />
      <div class="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
        <p class="ui-label text-ink/48">Guía de lectura</p>
        <div class="mt-3 space-y-2"><span class="block h-1.5 w-4/5 rounded-full bg-ink/16"/><span class="block h-1.5 w-3/5 rounded-full bg-ink/12"/><span class="block h-1.5 w-2/5 rounded-full bg-river/50"/></div>
      </div>
    </template>
    <template v-else>
      <div class="source-orbit source-orbit-a"/><div class="source-orbit source-orbit-b"/>
      <CheckCheck :size="compact ? 36 : 50" :stroke-width="1.25" class="absolute left-5 top-5 text-white sm:left-7 sm:top-7" />
      <div class="absolute bottom-5 left-5 right-5 sm:bottom-7 sm:left-7 sm:right-7">
        <p class="ui-label text-white/55">Origen · Fecha · Método</p>
        <div class="mt-3 flex items-center gap-2 text-white"><BookOpenText :size="17"/><span class="text-sm font-semibold">Información que se puede revisar</span></div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.article-visual { border-radius: 1.15rem; background: #092235; }
.article-visual--reading { background: #dfeceb; }
.article-visual--sources { background: #1c9eda; }
.contour { position: absolute; border: 1px solid rgba(119, 190, 192, .28); border-radius: 48% 52% 58% 42%; transform: rotate(-13deg); }
.contour-a { width: 78%; height: 94%; right: -13%; top: -34%; }
.contour-b { width: 62%; height: 75%; right: -2%; top: -23%; }
.contour-c { width: 45%; height: 53%; right: 10%; top: -10%; }
.gauge { opacity: .75; }
.reading-grid { background-image: linear-gradient(rgba(9,34,53,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(9,34,53,.08) 1px, transparent 1px); background-size: 28px 28px; mask-image: linear-gradient(to bottom right, #000, transparent 82%); }
.source-orbit { position: absolute; border: 1px solid rgba(255,255,255,.2); border-radius: 999px; }
.source-orbit-a { width: 20rem; height: 20rem; right: -9rem; top: -11rem; }
.source-orbit-b { width: 13rem; height: 13rem; right: -4rem; top: -6rem; }
</style>
