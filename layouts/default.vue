<script setup lang="ts">
const route = useRoute()
const normalizedPath = computed(() => route.path.replace(/\/+$/, '') || '/')
const isMap = computed(() => route.name === 'mapa' || normalizedPath.value === '/mapa' || normalizedPath.value === '/')
const sidebarCollapsed = ref(false)
const sidebarStorageKey = 'public-sidebar-collapsed'

onMounted(() => {
  try {
    sidebarCollapsed.value = localStorage.getItem(sidebarStorageKey) === 'true'
  }
  catch {
    // La preferencia es opcional; la navegación sigue funcionando sin almacenamiento local.
  }
})

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value

  try {
    localStorage.setItem(sidebarStorageKey, String(sidebarCollapsed.value))
  }
  catch {
    // La preferencia se conserva solo durante esta visita si el navegador bloquea localStorage.
  }
}
</script>

<template>
  <div
    class="min-h-dvh bg-paper lg:grid"
    :class="[
      sidebarCollapsed ? 'lg:grid-cols-[80px_minmax(0,1fr)]' : 'lg:grid-cols-[268px_minmax(0,1fr)]',
      isMap ? 'transition-none' : 'transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none',
    ]"
  >
    <AppSidebar class="hidden lg:flex" :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />
    <MobileNavigation class="lg:hidden" />
    <main :class="isMap ? 'h-dvh overflow-hidden pt-16 lg:pt-0' : 'min-w-0 pt-16 lg:pt-0'">
      <slot />
    </main>
  </div>
</template>
