<script setup lang="ts">
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, LockKeyhole, Waves } from 'lucide-vue-next'

definePageMeta({ layout: false })
useHead({ title: 'Acceso administrativo' })

const route = useRoute()
const email = ref('admin@tati.com.ar')
const password = ref('')
const showPassword = ref(false)
const submitting = ref(false)
const checkingSession = ref(true)
const errorMessage = ref(route.query.error === 'unauthorized'
  ? 'Tu cuenta no tiene permisos de administración.'
  : '')

function safeRedirect() {
  const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin'
  return redirect.startsWith('/admin') && redirect !== '/admin/login' ? redirect : '/admin'
}

async function hasAdminAccess(userId: string) {
  const { data, error } = await useSupabaseClient()
    .from('admin_users')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle()
  return !error && Boolean(data)
}

onMounted(async () => {
  const supabase = useSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()
  if (session && await hasAdminAccess(session.user.id)) {
    await navigateTo(safeRedirect())
    return
  }
  if (session) await supabase.auth.signOut()
  checkingSession.value = false
})

async function login() {
  errorMessage.value = ''
  submitting.value = true

  try {
    const supabase = useSupabaseClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value.trim(),
      password: password.value,
    })

    if (error || !data.user) throw new Error('El correo o la contraseña no son correctos.')
    if (!await hasAdminAccess(data.user.id)) {
      await supabase.auth.signOut()
      throw new Error('Esta cuenta no tiene permisos de administración.')
    }

    await navigateTo(safeRedirect())
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'No se pudo iniciar sesión.'
  }
  finally {
    submitting.value = false
  }
}
</script>

<template>
  <main class="relative grid min-h-dvh overflow-hidden bg-ink lg:grid-cols-[minmax(0,1.05fr)_minmax(420px,.7fr)]">
    <div class="pointer-events-none absolute inset-0 opacity-70 [background:radial-gradient(circle_at_15%_18%,rgba(28,158,218,.28),transparent_30%),radial-gradient(circle_at_85%_90%,rgba(120,204,239,.13),transparent_28%)]" />
    <div class="pointer-events-none absolute inset-0 opacity-[.06] [background-image:linear-gradient(rgba(255,255,255,.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.8)_1px,transparent_1px)] [background-size:54px_54px]" />

    <section class="relative hidden min-h-dvh flex-col justify-between px-10 py-10 text-white lg:flex xl:px-16 xl:py-14">
      <NuxtLink to="/mapa" class="flex w-fit items-center gap-3">
        <span class="relative grid size-11 place-items-center overflow-hidden rounded-full border border-white/25">
          <span class="absolute h-px w-full -rotate-12 bg-river-light" />
          <span class="absolute top-[58%] h-px w-full rotate-6 bg-river-light/55" />
          <span class="size-2 rounded-full bg-sand" />
        </span>
        <span class="text-sm font-semibold">Santa Fe · Información Hídrica</span>
      </NuxtLink>

      <div class="max-w-[640px] pb-14">
        <p class="ui-label text-river-light">Mesa de situación · Reclamos ciudadanos</p>
        <h1 class="mt-5 text-[clamp(3rem,6vw,6.8rem)] font-semibold leading-[.86] tracking-[-.07em]">Leer el territorio<br><span class="text-river-light">para decidir.</span></h1>
        <p class="mt-8 max-w-lg text-base leading-relaxed text-white/58">Un acceso reservado para observar patrones, priorizar respuestas y convertir reportes dispersos en una lectura común de la ciudad.</p>
      </div>

      <div class="flex items-center gap-3 text-xs text-white/42"><Waves :size="16" class="text-river-light" /> Información territorial actualizada en tiempo real</div>
    </section>

    <section class="relative flex min-h-dvh items-center justify-center bg-[#f4f8f9] px-5 py-10 lg:rounded-l-[2rem] lg:px-10">
      <div class="w-full max-w-[420px]">
        <NuxtLink to="/mapa" class="mb-12 flex items-center gap-2.5 lg:hidden">
          <span class="grid size-9 place-items-center rounded-full bg-ink text-river-light"><Waves :size="18" /></span>
          <span class="text-sm font-semibold">Santa Fe · Información Hídrica</span>
        </NuxtLink>

        <div class="mb-8 flex size-12 items-center justify-center rounded-2xl border border-river/20 bg-river/10 text-river-ink"><LockKeyhole :size="22" /></div>
        <p class="ui-label text-river-ink">Acceso restringido</p>
        <h2 class="mt-3 text-[2.35rem] font-semibold leading-none tracking-[-.055em] text-ink">Administración</h2>
        <p class="mt-4 text-sm leading-relaxed text-ink/55">Ingresá con una cuenta autorizada para consultar las métricas de reclamos.</p>

        <div v-if="checkingSession" class="mt-10 flex items-center gap-3 rounded-xl border border-ink/10 bg-white p-4 text-sm text-ink/60">
          <LoaderCircle :size="18" class="animate-spin text-river" /> Verificando sesión…
        </div>

        <form v-else class="mt-9 space-y-5" @submit.prevent="login">
          <div>
            <label for="admin-email" class="ui-label text-ink/55">Correo electrónico</label>
            <div class="relative mt-2">
              <KeyRound :size="17" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
              <input id="admin-email" v-model="email" type="email" autocomplete="username" required class="h-13 w-full rounded-xl border border-ink/12 bg-white pl-11 pr-4 text-sm text-ink shadow-sm transition focus:border-river focus:outline-none focus:ring-4 focus:ring-river/10">
            </div>
          </div>

          <div>
            <label for="admin-password" class="ui-label text-ink/55">Contraseña</label>
            <div class="relative mt-2">
              <LockKeyhole :size="17" class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink/35" />
              <input id="admin-password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" required class="h-13 w-full rounded-xl border border-ink/12 bg-white pl-11 pr-12 text-sm text-ink shadow-sm transition focus:border-river focus:outline-none focus:ring-4 focus:ring-river/10">
              <button type="button" class="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-ink/40 transition hover:bg-mist hover:text-ink" :aria-label="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'" @click="showPassword = !showPassword">
                <EyeOff v-if="showPassword" :size="17" /><Eye v-else :size="17" />
              </button>
            </div>
          </div>

          <p v-if="errorMessage" role="alert" class="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-700">{{ errorMessage }}</p>

          <button type="submit" class="group flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-river px-5 text-sm font-semibold text-white shadow-[0_12px_28px_rgba(28,158,218,.25)] transition hover:bg-river-ink disabled:cursor-wait disabled:opacity-60" :disabled="submitting">
            <LoaderCircle v-if="submitting" :size="18" class="animate-spin" />
            <template v-else>Ingresar al panel <ArrowRight :size="17" class="transition-transform group-hover:translate-x-0.5" /></template>
          </button>
        </form>
      </div>
    </section>
  </main>
</template>
