<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'
import type { Article } from '~/types/content'

defineProps<{ article: Article; featured?: boolean }>()
</script>

<template>
  <article class="group">
    <NuxtLink :to="`/novedades/${article.slug}`" class="block">
      <NewsArticleVisual :variant="article.visual" :compact="!featured" class="transition-transform duration-500 group-hover:-translate-y-1" />
      <div class="mt-5 flex items-start justify-between gap-5">
        <div>
          <div class="flex flex-wrap items-center gap-2.5 ui-label text-[9px]"><span class="text-river">{{ article.category }}</span><span class="size-1 rounded-full bg-ink/22"/><span class="text-ink/42">{{ article.publishedAt }}</span></div>
          <h2 class="mt-3 font-semibold leading-[1.06] tracking-[-.035em] transition-colors group-hover:text-river" :class="featured ? 'max-w-3xl text-3xl sm:text-4xl lg:text-[2.7rem]' : 'text-[1.35rem] sm:text-2xl'">{{ article.title }}</h2>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-ink/58">{{ article.excerpt }}</p>
        </div>
        <span class="mt-1 grid size-10 shrink-0 place-items-center rounded-full border border-ink/15 transition group-hover:border-river group-hover:bg-river group-hover:text-white"><ArrowUpRight :size="18"/></span>
      </div>
      <div class="mt-5 flex items-center justify-between border-t border-ink/10 pt-3 ui-label text-[9px] text-ink/40"><span>{{ article.kicker }}</span><span>{{ article.readingTime }}</span></div>
    </NuxtLink>
  </article>
</template>
