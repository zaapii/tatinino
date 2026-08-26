<script setup lang="ts">
import { ArrowLeft, BarChart3, ExternalLink, LogOut, ShieldCheck, Waves } from 'lucide-vue-next'

const route = useRoute()
const email = ref('')
const signingOut = ref(false)

onMounted(async () => {
  const { data } = await useSupabaseClient().auth.getUser()
  email.value = data.user?.email ?? ''
})

async function signOut() {
  signingOut.value = true
  await useSupabaseClient().auth.signOut()
  await navigateTo('/admin/login')
}
</script>

<template>
  <div class="min-h-dvh bg-[#eef3f5] lg:grid lg:grid-cols-[250px_minmax(0,1fr)]">
    <aside class="sticky top-0 hidden h-dvh flex-col overflow-hidden bg-ink px-5 py-6 text-white lg:flex">
      <div class="pointer-events-none absolute inset-x-0 top-0 h-56 opacity-30 [background:radial-gradient(circle_at_18%_0%,rgba(28,158,218,.7),transparent_48%)]" />
      <NuxtLink to="/admin" class="relative flex items-center gap-3 rounded-xl px-2 py-1">
        <span class="relative grid size-10 place-items-center overflow-hidden rounded-full border border-white/20 bg-white/5">
          <span class="absolute h-px w-full -rotate-12 bg-river-light" />
          <span class="absolute top-[58%] h-px w-full rotate-6 bg-river-light/55" />
          <span class="size-2 rounded-full bg-sand" />
        </span>
        <span>
          <span class="ui-label block text-white/45">Acceso restringido</span>
          <span class="mt-1 block text-sm font-semibold">Administración</span>
        </span>
      </NuxtLink>

      <nav class="relative mt-10" aria-label="Administración">
        <NuxtLink
          to="/admin"
          class="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition"
          :class="route.path === '/admin' ? 'bg-white text-ink' : 'text-white/65 hover:bg-white/8 hover:text-white'"
        >
          <BarChart3 :size="18" />
          Lectura territorial
        </NuxtLink>
      </nav>

      <div class="relative mt-auto">
        <div class="mb-5 rounded-xl border border-white/10 bg-white/5 p-3.5">
          <div class="flex items-center gap-2 text-river-light">
            <ShieldCheck :size="15" />
            <span class="ui-label text-river-light">Sesión protegida</span>
          </div>
          <p class="mt-2 truncate text-xs text-white/60">{{ email || 'Verificando usuario…' }}</p>
        </div>
        <NuxtLink to="/mapa" class="mb-2 flex items-center gap-2 rounded-lg px-3 py-2.5 text-xs font-semibold text-white/60 transition hover:bg-white/8 hover:text-white">
          <ArrowLeft :size="15" /> Volver al mapa <ExternalLink :size="13" class="ml-auto opacity-40" />
        </NuxtLink>
        <button class="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-xs font-semibold text-white/60 transition hover:bg-white/8 hover:text-white disabled:opacity-40" :disabled="signingOut" @click="signOut">
          <LogOut :size="15" /> {{ signingOut ? 'Cerrando sesión…' : 'Cerrar sesión' }}
        </button>
      </div>
    </aside>

    <div class="min-w-0">
      <header class="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-ink/10 bg-white/90 px-4 backdrop-blur-xl lg:hidden">
        <NuxtLink to="/admin" class="flex items-center gap-2.5">
          <span class="grid size-8 place-items-center rounded-full bg-ink text-river-light"><Waves :size="17" /></span>
          <span><span class="ui-label block text-ink/45">Administración</span><span class="text-sm font-semibold">Reclamos hídricos</span></span>
        </NuxtLink>
        <button class="grid size-10 place-items-center rounded-xl border border-ink/10 bg-white" aria-label="Cerrar sesión" @click="signOut"><LogOut :size="18" /></button>
      </header>
      <main class="min-w-0">
        <slot />
      </main>
    </div>
  </div>
</template>
