<script setup lang="ts">
const route = useRoute()
const isMap = computed(() => route.path === '/mapa' || route.path === '/')
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
