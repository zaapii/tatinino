<script setup lang="ts">
import { ArrowLeft, ChartNoAxesCombined, ExternalLink, ListChecks, LogOut, Newspaper, PanelLeftClose, PanelLeftOpen, ShieldCheck, Waves } from 'lucide-vue-next'

const route = useRoute()
const email = ref('')
const signingOut = ref(false)
const sidebarCollapsed = ref(false)
const sidebarStorageKey = 'admin-sidebar-collapsed'

onMounted(async () => {
  try {
    sidebarCollapsed.value = localStorage.getItem(sidebarStorageKey) === 'true'
  }
  catch {
    // La preferencia es opcional; la sidebar sigue funcionando sin almacenamiento local.
  }

  const { data } = await useSupabaseClient().auth.getUser()
  email.value = data.user?.email ?? ''
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

async function signOut() {
  signingOut.value = true
  await useSupabaseClient().auth.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div
    class="min-h-dvh bg-[#eef3f5] transition-[grid-template-columns] duration-300 ease-out motion-reduce:transition-none lg:grid"
    :class="sidebarCollapsed ? 'lg:grid-cols-[84px_minmax(0,1fr)]' : 'lg:grid-cols-[250px_minmax(0,1fr)]'"
  >
    <aside
      class="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-ink py-6 text-white transition-[padding] duration-300 ease-out motion-reduce:transition-none lg:flex"
      :class="sidebarCollapsed ? 'px-3' : 'px-5'"
    >
      <div class="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-30 [background:radial-gradient(circle_at_18%_0%,rgba(28,158,218,.7),transparent_48%)]" />
      <div
        class="relative flex gap-2"
        :class="sidebarCollapsed ? 'flex-col items-center' : 'items-center justify-between'"
      >
        <NuxtLink
          to="/admin"
          class="flex min-w-0 items-center rounded-xl py-1"
          :class="sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-2'"
          :title="sidebarCollapsed ? 'Administración' : undefined"
          :aria-label="sidebarCollapsed ? 'Ir a administración' : undefined"
        >
          <span class="relative grid size-10 shrink-0 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/5">
            <span class="absolute h-px w-full -rotate-12 bg-river-light" />
            <span class="absolute top-[58%] h-px w-full rotate-6 bg-river-light/55" />
            <span class="size-2 rounded-full bg-sand" />
          </span>
          <span v-if="!sidebarCollapsed" class="min-w-0 whitespace-nowrap">
            <span class="ui-label block text-white/45">Acceso restringido</span>
            <span class="mt-1 block text-sm font-semibold">Administración</span>
          </span>
        </NuxtLink>

        <button
          type="button"
          class="grid size-9 shrink-0 place-items-center rounded-lg border border-white/10 text-white/55 transition hover:border-white/20 hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-river-light"
          :aria-label="sidebarCollapsed ? 'Expandir menú lateral' : 'Contraer menú lateral'"
          :aria-expanded="!sidebarCollapsed"
          :title="sidebarCollapsed ? 'Expandir menú' : 'Contraer menú'"
          @click="toggleSidebar"
        >
          <PanelLeftOpen v-if="sidebarCollapsed" :size="17" aria-hidden="true" />
          <PanelLeftClose v-else :size="17" aria-hidden="true" />
        </button>
      </div>

      <nav class="relative" :class="sidebarCollapsed ? 'mt-7' : 'mt-10'" aria-label="Administración">
        <NuxtLink
          to="/admin"
          class="flex items-center rounded-xl py-3 text-sm font-semibold transition"
          :class="[
            route.path === '/admin' ? 'bg-white text-ink' : 'text-white/65 hover:bg-white/8 hover:text-white',
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
          ]"
          :title="sidebarCollapsed ? 'Moderar reclamos' : undefined"
          :aria-label="sidebarCollapsed ? 'Moderar reclamos' : undefined"
        >
          <ListChecks :size="18" class="shrink-0" aria-hidden="true" />
          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">Moderar reclamos</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/articulos"
          class="mt-1 flex items-center rounded-xl py-3 text-sm font-semibold transition"
          :class="[
            route.path.startsWith('/admin/articulos') ? 'bg-white text-ink' : 'text-white/65 hover:bg-white/8 hover:text-white',
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
          ]"
          :title="sidebarCollapsed ? 'Artículos' : undefined"
          :aria-label="sidebarCollapsed ? 'Administrar artículos' : undefined"
        >
          <Newspaper :size="18" class="shrink-0" aria-hidden="true" />
          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">Artículos</span>
        </NuxtLink>
        <NuxtLink
          to="/admin/metricas"
          class="mt-1 flex items-center rounded-xl py-3 text-sm font-semibold transition"
          :class="[
            route.path === '/admin/metricas' ? 'bg-white text-ink' : 'text-white/65 hover:bg-white/8 hover:text-white',
            sidebarCollapsed ? 'justify-center px-0' : 'gap-3 px-3',
          ]"
          :title="sidebarCollapsed ? 'Métricas' : undefined"
          :aria-label="sidebarCollapsed ? 'Ver métricas' : undefined"
        >
          <ChartNoAxesCombined :size="18" class="shrink-0" aria-hidden="true" />
          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">Métricas</span>
        </NuxtLink>
      </nav>

      <div class="relative mt-auto">
        <div
          class="mb-5 rounded-xl border border-white/10 bg-white/5"
          :class="sidebarCollapsed ? 'grid place-items-center p-2.5' : 'p-3.5'"
          :title="sidebarCollapsed ? `Sesión protegida: ${email || 'verificando usuario'}` : undefined"
        >
          <div class="flex items-center text-river-light" :class="sidebarCollapsed ? '' : 'gap-2'">
            <ShieldCheck :size="15" class="shrink-0" aria-hidden="true" />
            <span v-if="!sidebarCollapsed" class="ui-label whitespace-nowrap text-river-light">Sesión protegida</span>
            <span v-else class="sr-only">Sesión protegida: {{ email || 'verificando usuario' }}</span>
          </div>
          <p v-if="!sidebarCollapsed" class="mt-2 truncate text-xs text-white/60">{{ email || 'Verificando usuario…' }}</p>
        </div>
        <NuxtLink
          to="/mapa"
          class="mb-2 flex items-center rounded-lg py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/8 hover:text-white"
          :class="sidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-3'"
          :title="sidebarCollapsed ? 'Volver al mapa' : undefined"
          :aria-label="sidebarCollapsed ? 'Volver al mapa' : undefined"
        >
          <ArrowLeft :size="15" class="shrink-0" aria-hidden="true" />
          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">Volver al mapa</span>
          <ExternalLink v-if="!sidebarCollapsed" :size="13" class="ml-auto opacity-40" aria-hidden="true" />
        </NuxtLink>
        <button
          type="button"
          class="flex w-full items-center rounded-lg py-2.5 text-left text-xs font-semibold text-white/60 transition hover:bg-white/8 hover:text-white disabled:opacity-40"
          :class="sidebarCollapsed ? 'justify-center px-0' : 'gap-2 px-3'"
          :disabled="signingOut"
          :title="sidebarCollapsed ? (signingOut ? 'Cerrando sesión…' : 'Cerrar sesión') : undefined"
          :aria-label="sidebarCollapsed ? (signingOut ? 'Cerrando sesión' : 'Cerrar sesión') : undefined"
          @click="signOut"
        >
          <LogOut :size="15" class="shrink-0" aria-hidden="true" />
          <span v-if="!sidebarCollapsed" class="whitespace-nowrap">{{ signingOut ? 'Cerrando sesión…' : 'Cerrar sesión' }}</span>
        </button>
      </div>
    </aside>

    <div class="min-w-0">
      <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <NuxtLink to="/admin" class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-full bg-ink text-river-light"><Waves :size="17" /></span>
          <span><span class="ui-label block text-ink/45">Administración</span><span class="text-sm font-semibold">Información hídrica</span></span>
        </NuxtLink>
        <div class="flex items-center gap-1">
          <NuxtLink to="/admin" class="grid size-9 place-items-center rounded-lg text-ink/45 transition hover:bg-mist hover:text-ink" aria-label="Moderar reclamos"><ListChecks :size="17" /></NuxtLink>
          <NuxtLink to="/admin/articulos" class="grid size-9 place-items-center rounded-lg text-ink/45 transition hover:bg-mist hover:text-ink" aria-label="Administrar artículos"><Newspaper :size="17" /></NuxtLink>
          <NuxtLink to="/admin/metricas" class="grid size-9 place-items-center rounded-lg text-ink/45 transition hover:bg-mist hover:text-ink" aria-label="Ver métricas"><ChartNoAxesCombined :size="17" /></NuxtLink>
          <button class="grid size-9 place-items-center rounded-lg border border-ink/10 bg-white" aria-label="Cerrar sesión" @click="signOut"><LogOut :size="17" /></button>
        </div>
      </header>
      <main class="min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
