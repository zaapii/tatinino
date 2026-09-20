<script setup lang="ts">
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const isMap = computed(() => route.name === 'mapa' || normalizedPath.value === '/mapa' || normalizedPath.value === '/')
const isElNino = computed(() => normalizedPath.value === '/el-nino')
const policyOpen = ref(false)
</script>

<template>
  <div
    id="mapa-interactivo"
    class="min-h-dvh bg-paper lg:pl-[154px]"
  >
    <AppSidebar class="hidden lg:flex" @policy="policyOpen = true" />
    <MobileNavigation class="lg:hidden" @policy="policyOpen = true" />
    <main class="min-w-0 pt-16 lg:pt-0">
      <MapHero v-if="isMap || isElNino" :as-heading="isMap" />
      <slot />
    </main>
  </div>
  <DataPolicyModal v-model="policyOpen" />
</template>
