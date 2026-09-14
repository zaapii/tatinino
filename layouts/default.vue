<script setup lang="ts">
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const isMap = computed(() => route.name === 'mapa' || normalizedPath.value === '/mapa' || normalizedPath.value === '/')
const policyOpen = ref(false)
</script>

<template>
  <MapHero v-if="isMap" />
  <div
    id="mapa-interactivo"
    class="min-h-dvh bg-paper lg:grid lg:grid-cols-[154px_minmax(0,1fr)]"

  >
    <AppSidebar class="hidden lg:flex" @policy="policyOpen = true" />
    <MobileNavigation class="lg:hidden" @policy="policyOpen = true" />
    <main :class="isMap ? 'h-dvh overflow-hidden' : 'min-w-0 pt-16 lg:pt-0'">
      <slot />
    </main>
  </div>
  <DataPolicyModal v-model="policyOpen" />
</template>
