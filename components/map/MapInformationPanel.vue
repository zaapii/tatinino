<script setup lang="ts">
import { HelpCircle, X, TriangleAlert } from 'lucide-vue-next'
const open = defineModel<boolean>({ default: false })
</script>

<template>
  <button v-if="!open" class="surface-panel absolute right-3 top-[118px] z-20 flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs font-semibold sm:right-5 sm:top-5" @click="open = true"><HelpCircle :size="16" class="text-river"/> <span class="hidden sm:inline">¿Cómo usar este mapa?</span><span class="sm:hidden">Cómo usarlo</span></button>
  <Transition enter-active-class="transition duration-200" enter-from-class="translate-x-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-x-4 opacity-0">
    <section v-if="open" class="surface-panel absolute inset-x-3 top-[118px] z-40 rounded-2xl p-5 sm:inset-x-auto sm:right-5 sm:top-5 sm:w-[390px]">
      <header class="flex items-start justify-between gap-4"><div><p class="ui-label text-river">Guía de lectura</p><h2 class="mt-1 text-lg font-semibold">¿Cómo usar este mapa?</h2></div><button class="grid size-8 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar guía" @click="open = false"><X :size="18"/></button></header>
      <p class="mt-4 text-sm leading-relaxed text-ink/70">Usá <strong>Capas</strong> para combinar cuencas, defensas, reservorios, drenajes y estaciones. Los datos pesados se descargan solo cuando los activás.</p>
      <div class="mt-4 space-y-2 text-xs leading-relaxed text-ink/64">
        <p><strong>Plano técnico 2025:</strong> geometrías convertidas desde el archivo CAD suministrado para esta maqueta.</p>
        <p><strong>Situación actual:</strong> niveles, lluvias, pronósticos y alertas se incorporarán desde fuentes oficiales.</p>
        <p><strong>Participación:</strong> “Cargá tu reclamo” permite probar el flujo, marcar una ubicación y ver el punto rojo en la capa de reclamos. Por ahora es una demostración sin envío ni almacenamiento.</p>
      </div>
      <div class="mt-4 flex gap-3 rounded-xl bg-[#fff8ea] p-4"><TriangleAlert :size="19" class="mt-0.5 shrink-0 text-[#a66d13]"/><p class="text-xs leading-relaxed text-ink/68">Las coordenadas de origen fueron inferidas como POSGAR 2007 / Argentina 5. Solo se rotulan como “cota de fondo” las anotaciones con prefijo FC, CFC o FCa; las demás medidas permanecen sin clasificar. Estos datos sirven para explorar el plano, no para tomar decisiones de ingeniería.</p></div>
      <p class="mt-4 border-t border-ink/10 pt-4 text-[11px] leading-relaxed text-ink/50">El mapa base está simplificado para priorizar calles y manzanas. Seleccioná una línea, punto, área o reclamo para consultar sus detalles.</p>
    </section>
  </Transition>
</template>
