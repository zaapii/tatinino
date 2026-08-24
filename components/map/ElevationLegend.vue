<script setup lang="ts">
import { Mountain } from 'lucide-vue-next'
</script>

<template>
  <section class="surface-panel absolute bottom-4 left-4 z-20 hidden w-[290px] rounded-xl p-3.5 sm:block">
    <div class="flex items-center gap-2"><Mountain :size="15" class="text-river"/><p class="text-xs font-semibold">Altura del terreno sobre el nivel de referencia</p></div>
    <div class="mt-3 h-2 rounded-full bg-gradient-to-r from-[#407d9b] via-[#68b0a2] via-60% to-[#d8be74] opacity-45" />
    <div class="mt-1.5 flex justify-between ui-label text-[9px] text-ink/48"><span>Menor cota</span><span>Mayor cota</span></div>
    <p class="mt-2 text-[10px] text-ink/43">Fuente: pendiente de incorporación</p>
  </section>
</template>
