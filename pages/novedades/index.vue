<script setup lang="ts">
import { ArrowDown, CircleCheck, Rss } from 'lucide-vue-next'

useSeoMeta({
  title: 'Novedades',
  description: 'Notas, guías y explicaciones sobre información hídrica, territorio y prevención en Santa Fe.',
})

const { articles } = useArticles()
const featured = articles[0]!
const secondary = articles.slice(1)
</script>

<template>
  <div class="bg-paper">
    <header class="relative overflow-hidden border-b border-ink/10 px-6 pb-14 pt-12 sm:px-10 sm:pb-20 sm:pt-16 lg:px-14 lg:pb-24 lg:pt-20">
      <div class="absolute inset-y-0 right-6 hidden w-12 border-x border-ink/8 lg:block" aria-hidden="true">
        <span v-for="n in 12" :key="n" class="block h-[8.33%] border-t border-ink/15" :class="n % 2 ? 'w-1/2' : 'w-full'" />
      </div>
      <div class="mx-auto max-w-6xl">
        <div class="flex flex-wrap items-center justify-between gap-4">
          <p class="ui-label flex items-center gap-2 text-river"><Rss :size="14"/> Publicación pública</p>
          <p class="ui-label text-ink/38">Archivo abierto · Edición de muestra</p>
        </div>
        <div class="mt-16 grid items-end gap-10 lg:mt-24 lg:grid-cols-[1fr_.58fr] lg:gap-24">
          <div>
            <p class="ui-label text-ink/42">Notas · Guías · Metodología</p>
            <h1 class="mt-4 max-w-3xl text-[clamp(3.3rem,7.4vw,7rem)] font-semibold leading-[.84] tracking-[-.07em]">Novedades<span class="text-river">.</span></h1>
          </div>
          <div class="pb-1">
            <p class="text-lg leading-relaxed text-ink/64">Historias y explicaciones para comprender mejor el agua, el territorio y las decisiones que nos involucran.</p>
            <a href="#ultima-edicion" class="group mt-8 flex items-center justify-between border-b border-ink/20 pb-3 text-xs font-semibold">Ver última edición <ArrowDown :size="17" class="transition-transform group-hover:translate-y-1"/></a>
          </div>
        </div>
      </div>
    </header>

    <div id="ultima-edicion" class="px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
      <div class="mx-auto max-w-6xl">
        <div class="mb-12 flex flex-wrap items-center justify-between gap-5 border-b border-ink/10 pb-5">
          <div><p class="ui-label text-river">Última edición</p><p class="mt-1 text-sm text-ink/48">Tres ejemplos preparados para una publicación periódica</p></div>
          <div class="flex items-center gap-2 rounded-full bg-mist px-3 py-2 text-[11px] text-ink/58"><CircleCheck :size="14" class="text-river"/> Contenido de demostración</div>
        </div>

        <NewsArticleCard :article="featured" featured />

        <div class="my-16 flex items-center gap-4 sm:my-20"><span class="ui-label shrink-0 text-ink/40">También en esta edición</span><span class="h-px w-full bg-ink/10"/></div>
        <div class="grid gap-14 md:grid-cols-2 md:gap-8 lg:gap-12">
          <NewsArticleCard v-for="article in secondary" :key="article.slug" :article="article" />
        </div>

        <section class="mt-20 grid overflow-hidden rounded-[1.4rem] bg-ink text-white lg:grid-cols-[1fr_.7fr]">
          <div class="p-6 sm:p-9 lg:p-12"><p class="ui-label text-river-light">Sobre esta sección</p><h2 class="mt-4 max-w-xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Información que explica antes de opinar.</h2><p class="mt-5 max-w-xl text-sm leading-relaxed text-white/56">Las publicaciones futuras podrán organizarse por tema, fecha y tipo de contenido. Cada nota conservará su autoría, fuentes y fecha de actualización.</p></div>
          <div class="border-t border-white/10 p-6 sm:p-9 lg:border-l lg:border-t-0 lg:p-12"><p class="ui-label text-white/38">Criterio editorial</p><ul class="mt-5 space-y-3 text-sm text-white/68"><li>Lenguaje claro</li><li>Fuentes identificadas</li><li>Incertidumbre explícita</li><li>Sin datos simulados</li></ul></div>
        </section>
      </div>
    </div>
    <AppFooter />
  </div>
</template>
