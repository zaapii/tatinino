<script setup lang="ts">
import { ArrowDown, BookOpenCheck, UsersRound, RadioTower, Layers3, ShieldCheck, CloudRain, MessageSquareWarning, Building2, ArrowRight, CircleCheckBig } from 'lucide-vue-next'

useSeoMeta({
  title: 'Acerca del proyecto',
  description: 'Una infraestructura pública de conocimiento, prevención y organización comunitaria frente al riesgo hídrico en Santa Fe.',
})

const pillars = [
  { title: 'Información que se comprende', text: 'Datos oficiales, territorializados y acompañados por contexto para que puedan ser leídos sin conocimientos técnicos.', icon: BookOpenCheck },
  { title: 'Participación que se puede seguir', text: 'Reportes de vecinos e instituciones con mecanismos claros de validación, estado y respuesta.', icon: UsersRound },
  { title: 'Comunicación que se verifica', text: 'Alertas, comunicados y actualizaciones trazables durante períodos de incertidumbre o emergencia.', icon: RadioTower },
]

const scopes = [
  { label: 'Territorio', icon: Layers3, items: ['Cotas y características del terreno', 'Vulnerabilidad y antecedentes', 'Cuencas y recorridos de escurrimiento'] },
  { label: 'Protección', icon: ShieldCheck, items: ['Terraplenes y defensas', 'Reservorios, canales y desagües', 'Bombeo y bocas de tormenta'] },
  { label: 'Situación actual', icon: CloudRain, items: ['Niveles del Paraná y el Salado', 'Precipitaciones y pronósticos', 'Alertas oficiales'] },
  { label: 'Comunidad', icon: MessageSquareWarning, items: ['Reportes territoriales', 'Validación y seguimiento', 'Problemas, intervenciones y respuestas'] },
]

const reportStates = ['Reportado', 'En revisión', 'Verificado', 'Con respuesta']
</script>

<template>
  <div class="bg-paper">
    <header class="relative overflow-hidden border-b border-ink/10 px-6 pb-16 pt-12 sm:px-10 sm:pb-20 sm:pt-16 lg:px-14 lg:pb-24 lg:pt-20">
      <div class="pointer-events-none absolute -right-32 -top-48 size-[38rem] rounded-full border border-river/10"/><div class="pointer-events-none absolute -right-16 -top-36 size-[29rem] rounded-full border border-river/10"/>
      <div class="relative mx-auto max-w-6xl">
        <div class="flex flex-wrap items-center justify-between gap-4"><p class="ui-label text-river">Una política pública de prevención</p><p class="ui-label text-ink/38">Santa Fe Capital · Propuesta institucional</p></div>
        <div class="mt-16 grid items-end gap-10 lg:mt-24 lg:grid-cols-[1.15fr_.55fr] lg:gap-20">
          <div><p class="ui-label text-ink/40">Mapa interactivo de riesgos y cuidados</p><h1 class="mt-5 max-w-4xl text-[clamp(3rem,6.4vw,6.5rem)] font-semibold leading-[.88] tracking-[-.065em]">Conocer antes<br>de la emergencia<span class="text-river">.</span></h1></div>
          <div class="pb-1"><p class="text-lg leading-relaxed text-ink/64">Una infraestructura pública para comprender los riesgos, anticipar escenarios y fortalecer la capacidad colectiva de prevención y respuesta.</p><a href="#proposito" class="group mt-8 flex items-center justify-between border-b border-ink/20 pb-3 text-xs font-semibold">Conocer el proyecto <ArrowDown :size="17" class="transition-transform group-hover:translate-y-1"/></a></div>
        </div>
      </div>
    </header>

    <div id="proposito">
      <section class="px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div class="mx-auto max-w-6xl">
          <div class="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><div><p class="ui-label text-river">Propósito</p><h2 class="waterline mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Pasar de informar tarde a conocer antes.</h2></div><div><p class="text-xl font-medium leading-relaxed tracking-[-.02em] text-ink/76 sm:text-2xl">La comunidad no debería recibir información únicamente cuando la emergencia ya ocurrió.</p><p class="mt-7 max-w-3xl text-base leading-relaxed text-ink/58">La plataforma busca hacer pública información oficial, actualizada y territorializada para que cada persona pueda reconocer los riesgos de su entorno, comprender la evolución de un escenario y acceder a orientaciones confiables.</p></div></div>
          <div class="mt-16 grid gap-px overflow-hidden rounded-2xl border border-ink/10 bg-ink/10 md:grid-cols-3">
            <article v-for="pillar in pillars" :key="pillar.title" class="bg-white p-6 sm:p-8"><component :is="pillar.icon" :size="22" class="text-river"/><h3 class="mt-12 text-xl font-semibold tracking-[-.025em]">{{ pillar.title }}</h3><p class="mt-3 text-sm leading-relaxed text-ink/55">{{ pillar.text }}</p></article>
          </div>
        </div>
      </section>

      <section class="bg-mist px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div class="mx-auto max-w-6xl"><div class="grid gap-8 lg:grid-cols-[.75fr_1.25fr] lg:gap-20"><div><p class="ui-label text-river">Un mapa, cuatro sistemas</p><h2 class="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Información estructural, dinámica y comunitaria.</h2></div><p class="max-w-2xl text-base leading-relaxed text-ink/60">Las capas no se publicarán como datos aislados. Cada una deberá explicar su procedencia, actualización, alcance y relación con el sistema hídrico de la ciudad.</p></div>
          <div class="mt-14 grid gap-4 sm:grid-cols-2">
            <article v-for="scope in scopes" :key="scope.label" class="rounded-2xl border border-ink/10 bg-white p-6 sm:p-7"><div class="flex items-center gap-3"><span class="grid size-10 place-items-center rounded-full bg-mist"><component :is="scope.icon" :size="19" class="text-river"/></span><h3 class="text-lg font-semibold">{{ scope.label }}</h3></div><ul class="mt-6 divide-y divide-ink/8 border-y border-ink/8"><li v-for="item in scope.items" :key="item" class="flex gap-3 py-3 text-xs leading-relaxed text-ink/58"><CircleCheckBig :size="15" class="mt-0.5 shrink-0 text-river"/>{{ item }}</li></ul></article>
          </div>
        </div>
      </section>

      <section class="px-6 py-16 sm:px-10 lg:px-14 lg:py-24">
        <div class="mx-auto max-w-6xl"><div class="grid gap-12 lg:grid-cols-[.7fr_1.3fr] lg:gap-24"><div><p class="ui-label text-river">Participación con trazabilidad</p><h2 class="mt-3 text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Reportar no es lo mismo que verificar.</h2><p class="mt-5 text-sm leading-relaxed text-ink/55">La plataforma deberá mostrar siempre quién produjo cada información y en qué estado se encuentra.</p></div><div><p class="text-lg leading-relaxed text-ink/68">Vecinos, organizaciones, escuelas y clubes podrán señalar puntos críticos. Esos aportes serán visibles sin confundirse con información oficial y deberán contar con validación y seguimiento.</p>
          <div class="mt-10 flex flex-col gap-2 sm:flex-row sm:items-center"><template v-for="(state, index) in reportStates" :key="state"><div class="relative flex-1 rounded-xl border border-ink/10 bg-white p-4"><p class="ui-label text-[9px] text-ink/35">Estado</p><p class="mt-2 text-sm font-semibold">{{ state }}</p></div><ArrowRight v-if="index < reportStates.length - 1" :size="16" class="mx-auto shrink-0 rotate-90 text-ink/25 sm:rotate-0"/></template></div>
          <p class="mt-6 rounded-xl bg-mist p-4 text-xs leading-relaxed text-ink/58">La futura base pública permitirá conocer problemas reportados, intervenciones realizadas y respuestas del Estado.</p></div></div></div>
      </section>

      <section class="px-6 pb-16 sm:px-10 lg:px-14 lg:pb-24">
        <div class="mx-auto max-w-6xl overflow-hidden rounded-[1.5rem] bg-ink text-white"><div class="grid lg:grid-cols-[.78fr_1.22fr]"><div class="border-b border-white/10 p-7 sm:p-10 lg:border-b-0 lg:border-r lg:p-12"><Building2 :size="24" class="text-river-light"/><p class="ui-label mt-8 text-river-light">Responsabilidad institucional</p><h2 class="mt-4 text-3xl font-semibold tracking-[-.04em]">Impulsar, controlar y garantizar acceso.</h2></div><div class="p-7 sm:p-10 lg:p-12"><p class="text-lg leading-relaxed text-white/72">Desde el Concejo Municipal, la responsabilidad no es sustituir las funciones ejecutivas ni las capacidades técnicas de los organismos especializados.</p><p class="mt-6 text-sm leading-relaxed text-white/50">Es promover políticas públicas, fortalecer los mecanismos de control y garantizar que la información necesaria para el cuidado de la comunidad sea pública, accesible y trazable.</p></div></div>
          <div class="border-t border-white/10 px-7 py-8 sm:px-10 lg:px-12"><p class="max-w-4xl text-xl font-medium leading-relaxed tracking-[-.02em] sm:text-2xl">El mapa no es únicamente una plataforma tecnológica. Es una infraestructura pública de conocimiento, prevención y organización comunitaria frente al riesgo hídrico.</p></div>
        </div>
      </section>
    </div>
    <AppFooter />
  </div>
</template>
