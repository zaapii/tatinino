<script setup lang="ts">
import { Building2, Camera, CheckCircle2, LoaderCircle, LocateFixed, MapPin, MessageSquareWarning, Navigation, X } from 'lucide-vue-next'
import type { CitizenReportForm, MapPoint } from '~/types/map'

const props = defineProps<{
  location: MapPoint | null
  selectingLocation: boolean
}>()

const emit = defineEmits<{
  requestLocation: []
  cancelLocation: []
  created: []
}>()

const open = defineModel<boolean>('open', { default: false })
const topic = ref('')
const description = ref('')
const neighborhood = ref('')
const photoName = ref('')
const photoFile = ref<File | null>(null)
const photoPreview = ref('')
const submitted = ref(false)
const saving = ref(false)
const submitError = ref('')
const { createReport } = useCitizenReports()
const { lookupNeighborhood } = useNeighborhoodLookup()
const resolvingNeighborhood = ref(false)
const neighborhoodHint = ref('')
let neighborhoodRequestId = 0

const reportTypes = [
  'Boca de tormenta obstruida',
  'Basura o residuos',
  'Calle anegada',
  'Canal o desagüe',
  'Defensa o terraplén',
  'Otro',
]

const canSubmit = computed(() => Boolean(topic.value && description.value.trim().length >= 10 && props.location))

watch(
  () => props.location ? `${props.location.latitude}:${props.location.longitude}` : '',
  async () => {
    const requestId = ++neighborhoodRequestId
    neighborhood.value = ''
    neighborhoodHint.value = ''
    if (!props.location) return

    resolvingNeighborhood.value = true
    try {
      const result = await lookupNeighborhood(props.location)
      if (requestId !== neighborhoodRequestId) return
      neighborhood.value = result ?? ''
      neighborhoodHint.value = result
        ? 'Estimado por OpenStreetMap. Podés corregirlo si es necesario.'
        : 'No encontramos el barrio automáticamente. Podés escribirlo.'
    }
    catch {
      if (requestId === neighborhoodRequestId) neighborhoodHint.value = 'No pudimos estimarlo. Podés escribir el barrio manualmente.'
    }
    finally {
      if (requestId === neighborhoodRequestId) resolvingNeighborhood.value = false
    }
  },
  { immediate: true },
)

function choosePhoto(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (!file) return
  submitError.value = ''
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'].includes(file.type)) {
    submitError.value = 'La foto debe ser JPG, PNG, WebP, HEIC o HEIF.'
    return
  }
  if (file.size > 5 * 1024 * 1024) {
    submitError.value = 'La foto no puede superar los 5 MB.'
    return
  }
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
  photoFile.value = file
  photoName.value = file.name
  photoPreview.value = URL.createObjectURL(file)
}

async function submitReport() {
  if (!canSubmit.value || !props.location || saving.value) return
  saving.value = true
  submitError.value = ''

  try {
    await createReport({
      topic: topic.value,
      description: description.value.trim(),
      neighborhood: neighborhood.value.trim() || undefined,
      photoName: photoName.value || undefined,
      photoFile: photoFile.value ?? undefined,
      point: props.location,
    } satisfies CitizenReportForm)
    emit('created')
    submitted.value = true
    topic.value = ''
    description.value = ''
    neighborhood.value = ''
    photoName.value = ''
    photoFile.value = null
    if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
    photoPreview.value = ''
  }
  catch (error) {
    submitError.value = error instanceof Error ? error.message : 'No se pudo guardar el reclamo.'
  }
  finally {
    saving.value = false
  }
}

function startAnother() {
  submitted.value = false
}

onBeforeUnmount(() => {
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})
</script>

<template>
  <div class="pointer-events-none absolute bottom-0 left-[112px] z-30 p-3 sm:bottom-auto sm:left-5 sm:p-0" :class="open ? 'sm:top-[132px]' : 'sm:top-[188px]'">
    <button v-if="!open && !selectingLocation" class="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#d94841] px-3.5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#c93a34] sm:px-4" @click="open = true">
      <MessageSquareWarning :size="18"/><span class="sm:hidden">Reclamo</span><span class="hidden sm:inline">Cargá tu reclamo</span>
    </button>

    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-4 opacity-0">
      <section v-if="open" class="surface-panel pointer-events-auto fixed inset-x-3 bottom-3 flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-2xl sm:absolute sm:bottom-auto sm:left-0 sm:top-0 sm:max-h-[calc(100dvh-216px)] sm:w-[378px] lg:max-h-[calc(100dvh-152px)]" aria-label="Cargar un reclamo ciudadano">
        <header class="flex shrink-0 items-start justify-between gap-4 border-b border-ink/10 px-4 py-4 sm:px-5">
          <div><p class="ui-label text-[#b9312b]">Participación ciudadana</p><h2 class="mt-1 text-lg font-semibold">Cargá tu reclamo</h2></div>
          <button class="grid size-8 place-items-center rounded-lg hover:bg-mist" aria-label="Cerrar formulario" @click="open = false"><X :size="18"/></button>
        </header>

        <div v-if="submitted" class="min-h-0 flex-1 overflow-y-auto px-4 py-7 text-center sm:px-5">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-[#d94841]/10 text-[#d94841]"><CheckCircle2 :size="25"/></span>
          <h3 class="mt-4 text-base font-semibold">Reclamo guardado</h3>
          <p class="mx-auto mt-2 max-w-[270px] text-xs leading-relaxed text-ink/55">Quedó pendiente de revisión. Se verá en el mapa cuando el equipo administrador lo apruebe.</p>
          <button class="mt-5 rounded-xl border border-ink/12 px-4 py-2.5 text-xs font-semibold transition hover:bg-mist" @click="startAnother">Cargar otro reclamo</button>
        </div>

        <form v-else class="flex min-h-0 flex-1 flex-col" @submit.prevent="submitReport">
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
            <div class="flex items-start gap-2 rounded-xl bg-[#d94841]/8 px-3 py-2.5 text-[10px] leading-relaxed text-ink/58">
              <span class="ui-label mt-0.5 shrink-0 rounded-full bg-[#d94841] px-2 py-0.5 text-[8px] text-white">Público</span>
              El reclamo se envía a revisión antes de publicarse en el mapa. No incluyas datos personales.
            </div>

          <label class="block">
            <span class="ui-label text-[9px] text-ink/50">Tema</span>
            <select v-model="topic" required class="mt-1.5 w-full rounded-xl border border-ink/14 bg-white px-3 py-3 text-xs outline-none transition focus:border-river focus:ring-2 focus:ring-river/12">
              <option value="" disabled>Seleccioná el tipo de problema</option>
              <option v-for="type in reportTypes" :key="type" :value="type">{{ type }}</option>
            </select>
          </label>

          <label class="block">
            <span class="ui-label text-[9px] text-ink/50">Descripción</span>
            <textarea v-model="description" rows="3" minlength="10" maxlength="500" required placeholder="Contanos qué está pasando y desde cuándo…" class="mt-1.5 w-full resize-none rounded-xl border border-ink/14 bg-white px-3 py-3 text-xs leading-relaxed outline-none transition placeholder:text-ink/32 focus:border-river focus:ring-2 focus:ring-river/12"/>
            <span class="mt-1 block text-right font-mono text-[9px] text-ink/35">{{ description.length }}/500</span>
          </label>

          <div>
            <p class="ui-label text-[9px] text-ink/50">Foto <span class="normal-case tracking-normal text-ink/32">(opcional)</span></p>
            <label class="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink/18 px-3 py-3 transition hover:border-river/50 hover:bg-river/3">
              <span class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-mist text-river">
                <img v-if="photoPreview" :src="photoPreview" class="h-full w-full object-cover" alt="Vista previa de la foto"/>
                <Camera v-else :size="17"/>
              </span>
              <span class="min-w-0"><span class="block truncate text-xs font-semibold">{{ photoName || 'Adjuntar una foto' }}</span><span class="mt-0.5 block text-[10px] text-ink/42">JPG, PNG, WebP, HEIC o HEIF · máximo 5 MB</span></span>
              <input type="file" accept="image/*" class="sr-only" @change="choosePhoto">
            </label>
          </div>

          <div>
            <p class="ui-label text-[9px] text-ink/50">Ubicación</p>
            <div v-if="location" class="mt-1.5 flex items-center gap-3 rounded-xl border border-[#d94841]/20 bg-[#d94841]/6 p-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#d94841] text-white"><MapPin :size="17"/></span>
              <div class="min-w-0 flex-1"><p class="text-xs font-semibold">Punto marcado</p><p class="mt-0.5 truncate font-mono text-[9px] text-ink/46">{{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}</p></div>
              <button type="button" class="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-[#b9312b] hover:bg-[#d94841]/8" @click="emit('requestLocation')">Cambiar</button>
            </div>
            <button v-else type="button" class="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-river/25 bg-river/6 px-4 py-3 text-xs font-semibold text-river transition hover:bg-river/10" @click="emit('requestLocation')"><LocateFixed :size="17"/> Marcar en el mapa</button>
          </div>

          <label v-if="location" class="block">
            <span class="ui-label flex items-center gap-1.5 text-[9px] text-ink/50"><Building2 :size="13" class="text-river"/> Barrio</span>
            <div class="relative mt-1.5">
              <input v-model.trim="neighborhood" maxlength="120" :placeholder="resolvingNeighborhood ? 'Buscando barrio…' : 'Escribí el barrio si lo conocés'" :disabled="resolvingNeighborhood" class="w-full rounded-xl border border-ink/14 bg-white px-3 py-3 text-xs outline-none transition placeholder:text-ink/32 focus:border-river focus:ring-2 focus:ring-river/12 disabled:bg-mist disabled:text-ink/45">
              <LoaderCircle v-if="resolvingNeighborhood" :size="15" class="absolute right-3 top-3 animate-spin text-river"/>
            </div>
            <span v-if="neighborhoodHint" class="mt-1.5 block text-[9px] leading-relaxed text-ink/42">{{ neighborhoodHint }}</span>
          </label>

            <p v-if="submitError" role="alert" class="rounded-xl bg-[#d94841]/8 px-3 py-2.5 text-[11px] leading-relaxed text-[#a62e29]">{{ submitError }}</p>
          </div>

          <div class="shrink-0 border-t border-ink/10 bg-white px-4 py-3 shadow-[0_-10px_28px_rgba(9,34,53,.06)] sm:px-5">
            <button type="submit" :disabled="!canSubmit || saving" class="flex w-full items-center justify-center gap-2 rounded-xl bg-[#d94841] px-4 py-3.5 text-xs font-semibold text-white transition hover:bg-[#c93a34] disabled:cursor-not-allowed disabled:bg-ink/12 disabled:text-ink/35"><Navigation :size="16" :class="saving ? 'animate-pulse' : ''"/> {{ saving ? 'Enviando reclamo…' : 'Enviar reclamo a revisión' }}</button>
          </div>
        </form>
      </section>
    </Transition>
  </div>
</template>
