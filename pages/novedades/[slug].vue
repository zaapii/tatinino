<script setup lang="ts">
import { ArrowLeft, Clock3, CircleCheck, RotateCcw, ShieldCheck } from 'lucide-vue-next'

const route = useRoute()
const { articles, getArticleBySlug } = useArticles()
const article = getArticleBySlug(String(route.params.slug))

if (!article) {
  throw createError({ statusCode: 404, statusMessage: 'La publicación no existe' })
}

const related = articles.filter(item => item.slug !== article.slug).slice(0, 2)

useSeoMeta({
  title: article.title,
  description: article.excerpt,
  ogTitle: article.title,
  ogDescription: article.excerpt,
})
</script>

<template>
  <article class="bg-paper">
    <header class="px-6 pb-12 pt-10 sm:px-10 sm:pb-16 sm:pt-14 lg:px-14 lg:pb-20 lg:pt-16">
      <div class="mx-auto max-w-6xl">
        <NuxtLink to="/novedades" class="group inline-flex items-center gap-2 text-xs font-semibold text-ink/55 hover:text-river"><ArrowLeft :size="16" class="transition-transform group-hover:-translate-x-1"/> Volver a Novedades</NuxtLink>
        <div class="mt-12 grid gap-10 lg:grid-cols-[1.15fr_.85fr] lg:items-end lg:gap-20">
          <div>
            <div class="flex flex-wrap items-center gap-3 ui-label text-[9px]"><span class="text-river">{{ article.category }}</span><span class="size-1 rounded-full bg-ink/20"/><span class="text-ink/40">{{ article.publishedAt }}</span></div>
            <h1 class="mt-5 max-w-4xl text-[clamp(2.7rem,5.4vw,5.6rem)] font-semibold leading-[.92] tracking-[-.06em]">{{ article.title }}</h1>
          </div>
          <div class="border-l border-ink/12 pl-5 lg:mb-1">
            <p class="text-base leading-relaxed text-ink/62">{{ article.excerpt }}</p>
            <p class="mt-5 flex items-center gap-2 text-[11px] text-ink/42"><Clock3 :size="14"/> {{ article.readingTime }}</p>
          </div>
        </div>
      </div>
    </header>

    <div class="px-6 sm:px-10 lg:px-14">
      <div class="mx-auto max-w-6xl"><NewsArticleVisual :variant="article.visual" /></div>
    </div>

    <div class="px-6 py-14 sm:px-10 sm:py-20 lg:px-14 lg:py-24">
      <div class="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[280px_1fr] lg:gap-24">
        <aside class="lg:sticky lg:top-10 lg:self-start">
          <p class="ui-label text-river">En síntesis</p>
          <ul class="mt-5 divide-y divide-ink/10 border-y border-ink/10">
            <li v-for="item in article.summary" :key="item" class="flex gap-3 py-4 text-xs leading-relaxed text-ink/62"><CircleCheck :size="16" class="mt-0.5 shrink-0 text-river"/>{{ item }}</li>
          </ul>
          <div class="mt-6 rounded-xl bg-mist p-4"><p class="flex items-center gap-2 text-xs font-semibold"><ShieldCheck :size="15" class="text-river"/> Contenido de muestra</p><p class="mt-2 text-[11px] leading-relaxed text-ink/50">Esta nota demuestra el formato editorial. No constituye una comunicación oficial.</p></div>
        </aside>
        <div class="max-w-3xl">
          <p class="mb-8 ui-label text-ink/38">{{ article.kicker }}</p>
          <NewsArticleBody :blocks="article.blocks" />
          <footer class="mt-14 border-t border-ink/12 pt-6">
            <div class="flex items-start gap-3"><RotateCcw :size="17" class="mt-0.5 shrink-0 text-river"/><div><p class="text-xs font-semibold">Actualizaciones y correcciones</p><p class="mt-1 text-xs leading-relaxed text-ink/48">Cuando una publicación cambie, este espacio indicará qué se modificó y cuándo.</p></div></div>
          </footer>
        </div>
      </div>
    </div>

    <section class="border-t border-ink/10 bg-white px-6 py-14 sm:px-10 sm:py-20 lg:px-14">
      <div class="mx-auto max-w-6xl"><p class="ui-label text-river">Seguir leyendo</p><div class="mt-8 grid gap-14 md:grid-cols-2 md:gap-10"><NewsArticleCard v-for="item in related" :key="item.slug" :article="item" /></div></div>
    </section>
    <AppFooter />
  </article>
</template>
