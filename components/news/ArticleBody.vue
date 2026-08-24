<script setup lang="ts">
import { Info, TriangleAlert, Quote } from 'lucide-vue-next'
import type { ArticleBlock } from '~/types/content'

defineProps<{ blocks: ArticleBlock[] }>()
</script>

<template>
  <div class="article-body">
    <template v-for="(block, index) in blocks" :key="index">
      <p v-if="block.type === 'paragraph'" class="text-[1.05rem] leading-[1.82] text-ink/72 sm:text-lg">{{ block.text }}</p>
      <h2 v-else-if="block.type === 'heading'" class="pt-6 text-2xl font-semibold leading-tight tracking-[-.035em] sm:text-3xl">{{ block.text }}</h2>
      <ul v-else-if="block.type === 'list'" class="space-y-3 border-y border-ink/10 py-5">
        <li v-for="item in block.items" :key="item" class="flex gap-3 text-base leading-relaxed text-ink/68"><span class="mt-[.7rem] size-1.5 shrink-0 rounded-full bg-river"/>{{ item }}</li>
      </ul>
      <aside v-else-if="block.type === 'callout'" class="rounded-2xl p-5 sm:p-6" :class="block.tone === 'attention' ? 'bg-[#fff7e8]' : 'bg-mist'">
        <div class="flex items-start gap-3"><TriangleAlert v-if="block.tone === 'attention'" :size="20" class="mt-0.5 shrink-0 text-[#a66d13]"/><Info v-else :size="20" class="mt-0.5 shrink-0 text-river"/><div><p class="text-sm font-semibold">{{ block.title }}</p><p class="mt-2 text-sm leading-relaxed text-ink/62">{{ block.text }}</p></div></div>
      </aside>
      <blockquote v-else class="relative border-l-2 border-river py-3 pl-6 text-xl font-medium leading-relaxed tracking-[-.02em] text-ink sm:text-2xl"><Quote :size="18" class="mb-3 text-river"/>{{ block.text }}</blockquote>
    </template>
  </div>
</template>

<style scoped>
.article-body { display: grid; gap: 1.75rem; }
</style>
