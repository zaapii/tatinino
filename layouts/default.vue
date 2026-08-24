<script setup lang="ts">
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const isMap = computed(() => route.name === 'mapa' || normalizedPath.value === '/mapa' || normalizedPath.value === '/')
</script>

<template>
  <div class="min-h-dvh bg-paper lg:grid lg:grid-cols-[268px_1fr]">
    <AppSidebar class="hidden lg:flex" />
    <MobileNavigation class="lg:hidden" />
    <main :class="isMap ? 'h-dvh overflow-hidden pt-16 lg:pt-0' : 'min-w-0 pt-16 lg:pt-0'">
      <slot />
    </main>
  </div>
</template>
