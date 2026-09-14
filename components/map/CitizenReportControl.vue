<script setup lang="ts">
import { Building2, Camera, CheckCircle2, LoaderCircle, LocateFixed, MapPin, MessageSquareWarning, Navigation, X } from 'lucide-vue-next'
import type { CitizenReportForm, MapPoint } from '~/types/map'
import { isReportPointInBounds } from '~/utils/reportLocation'
import { useReportAddressLookup } from '~/composables/useReportAddressLookup'
import { citizenReportCategories } from '~/utils/citizenReportCategories'

const props = defineProps<{
  hideTrigger?: boolean
  location: MapPoint | null
  selectingLocation: boolean
}>()

const emit = defineEmits<{
  requestLocation: []
  cancelLocation: []
  created: []
  locationSelected: [point: MapPoint]
  clearLocation: []
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

const selectedCategory = computed(() => citizenReportCategories.find(category => category.topic === topic.value))
const contactName = ref('')
const contactPhone = ref('')
const contactEmail = ref('')
const address = ref('')
const selectedAddress = ref('')
const addressResults = ref<Array<{ label: string, point: MapPoint }>>([])
const locating = ref(false)
const locationError = ref('')
const locationHint = ref('')
const { searchAddress } = useReportAddressLookup()
let locationRequestId = 0

function invalidateAddress() {
  ++locationRequestId
  locating.value = false
  addressResults.value = []
  locationError.value = ''
  locationHint.value = ''
  emit('clearLocation')
  selectedAddress.value = ''
}

async function findAddress() {
  if (!address.value.trim() || locating.value) return
  const requestId = ++locationRequestId
  locating.value = true
  locationError.value = ''
  addressResults.value = []
  try {
    const results = await searchAddress(address.value.trim())
    if (requestId !== locationRequestId) return
    addressResults.value = results
    if (!results.length) locationError.value = 'No encontramos esa dirección en Santa Fe. Probá con otra dirección o marcá el punto en el mapa.'
  }
  catch {
    if (requestId === locationRequestId) locationError.value = 'No pudimos buscar la dirección. Podés marcar el punto en el mapa.'
  }
  finally {
    if (requestId === locationRequestId) locating.value = false
  }
}

function selectAddress(result: { label: string, point: MapPoint }) {
  ++locationRequestId
  locating.value = false
  selectedAddress.value = result.label
  address.value = result.label
  addressResults.value = []
  locationHint.value = 'Ubicación estimada por la dirección. Podés ajustarla en el mapa.'
  emit('locationSelected', result.point)
}

function markOnMap() {
  ++locationRequestId
  locating.value = false
  selectedAddress.value = ''
  address.value = ''
  addressResults.value = []
  locationError.value = ''
  locationHint.value = ''
  emit('requestLocation')
}

function useCurrentLocation() {
  if (!navigator.geolocation) {
    locationError.value = 'Este navegador no permite consultar tu ubicación. Usá la dirección o el mapa.'
    return
  }
  const requestId = ++locationRequestId
  locating.value = true
  locationError.value = ''
  navigator.geolocation.getCurrentPosition(position => {
    if (requestId !== locationRequestId) return
    locating.value = false
    const point = { latitude: position.coords.latitude, longitude: position.coords.longitude }
    if (!isReportPointInBounds(point)) {
      locationError.value = 'Tu ubicación está fuera del área de Santa Fe. Escribí la dirección del reclamo o marcala en el mapa.'
      return
    }
    selectedAddress.value = ''
    address.value = ''
    addressResults.value = []
    locationHint.value = 'Ubicación del dispositivo, precisión aproximada de ' + Math.round(position.coords.accuracy) + ' m. Podés ajustarla en el mapa.'
    emit('locationSelected', point)
  }, error => {
    if (requestId !== locationRequestId) return
    locating.value = false
    locationError.value = error.code === 1
      ? 'No se autorizó el acceso a tu ubicación. Podés usar la dirección o el mapa.'
      : 'No pudimos obtener tu ubicación. Probá de nuevo o usá la dirección o el mapa.'
  }, { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 })
}

const canSubmit = computed(() => Boolean(selectedCategory.value && photoFile.value && description.value.length <= 200 && props.location && isReportPointInBounds(props.location) && !locating.value))

watch(
  () => props.location ? `${props.location.latitude}:${props.location.longitude}` : '',
  async () => {
    const requestId = ++neighborhoodRequestId
    neighborhood.value = ''
    neighborhoodHint.value = ''
    resolvingNeighborhood.value = false
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
  if (!canSubmit.value || !props.location || !photoFile.value || saving.value) return
  saving.value = true
  submitError.value = ''

  try {
    await createReport({
      topic: topic.value,
      description: description.value.trim(),
      neighborhood: neighborhood.value.trim() || undefined,
      photoName: photoName.value || undefined,
      photoFile: photoFile.value,
      address: selectedAddress.value || undefined,
      contactName: contactName.value.trim() || undefined,
      contactPhone: contactPhone.value.trim() || undefined,
      contactEmail: contactEmail.value.trim() || undefined,
      point: props.location,
    } satisfies CitizenReportForm)
    emit('created')
    submitted.value = true
    contactName.value = ''
    contactPhone.value = ''
    contactEmail.value = ''
    address.value = ''
    selectedAddress.value = ''
    addressResults.value = []
    locationHint.value = ''
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
  ++locationRequestId
  ++neighborhoodRequestId
  if (photoPreview.value) URL.revokeObjectURL(photoPreview.value)
})
</script>

<template>
  <div class="pointer-events-none absolute bottom-0 left-[112px] z-30 p-3 sm:bottom-auto sm:left-5 sm:p-0" :class="open ? 'sm:top-[70px]' : 'sm:top-[70px]'">
    <button v-if="!open && !selectingLocation && !hideTrigger" class="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#d94841] px-3.5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-[#c93a34] sm:px-4" @click="open = true">
      <MessageSquareWarning :size="18"/><span class="sm:hidden">Reclamo</span><span class="hidden sm:inline">Cargá tu reclamo</span>
    </button>

    <Transition enter-active-class="transition duration-200" enter-from-class="translate-y-4 opacity-0" leave-active-class="transition duration-150" leave-to-class="translate-y-4 opacity-0">
      <section v-if="open" class="report-panel surface-panel pointer-events-auto fixed inset-x-3 bottom-3 flex max-h-[calc(100dvh-88px)] flex-col overflow-hidden rounded-2xl sm:absolute sm:bottom-auto sm:left-0 sm:top-0 sm:max-h-[calc(100dvh-216px)] sm:w-[378px] lg:max-h-[calc(100dvh-152px)]" aria-label="Cargar un reclamo ciudadano">
        <header class="relative z-10 flex shrink-0 items-start justify-between gap-4 px-5 py-5 text-white">
          <div><p class="ui-label text-white/70">Participación ciudadana</p><h2 class="mt-1 text-lg font-semibold">Cargá tu reclamo</h2></div>
          <button type="button" class="grid size-8 shrink-0 place-items-center rounded-full border border-[#67bdf0] text-[#67bdf0] transition hover:bg-white/10" aria-label="Cerrar formulario" @click="open = false"><X :size="18"/></button>
        </header>

        <div v-if="submitted" class="report-panel-body min-h-0 flex-1 overflow-y-auto px-4 py-7 text-center sm:px-5">
          <span class="mx-auto grid size-12 place-items-center rounded-full bg-[#d94841]/10 text-[#d94841]"><CheckCircle2 :size="25"/></span>
          <h3 class="mt-4 text-base font-semibold">Reclamo guardado</h3>
          <p class="mx-auto mt-2 max-w-[270px] text-xs leading-relaxed text-ink/55">Quedó pendiente de revisión. Se verá en el mapa cuando el equipo administrador lo apruebe.</p>
          <button class="mt-5 rounded-xl border border-ink/12 px-4 py-2.5 text-xs font-semibold transition hover:bg-mist" @click="startAnother">Cargar otro reclamo</button>
        </div>

        <form v-else class="report-panel-body flex min-h-0 flex-1 flex-col overflow-hidden" @submit.prevent="submitReport">
          <div class="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <label class="block">
            <span class="ui-label text-[9px] text-ink/50">1. Categoría · Obligatoria</span>
            <select v-model="topic" required class="mt-1.5 w-full rounded-xl border border-ink/14 bg-white px-3 py-3 text-xs outline-none transition focus:border-river focus:ring-2 focus:ring-river/12">
              <option value="" disabled>Seleccioná el tipo de problema</option>
              <option v-for="category in citizenReportCategories" :key="category.topic" :value="category.topic">{{ category.topic }}</option>
            </select>
<p v-if="selectedCategory" class="mt-2 rounded-lg bg-mist p-3 text-[11px] leading-relaxed text-ink/65" aria-live="polite">{{ selectedCategory.description }}</p>
          </label>



          <div>
            <p class="ui-label text-[9px] text-ink/50">2. Foto · Obligatoria</p>
            <label class="mt-1.5 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-ink/18 px-3 py-3 transition hover:border-river/50 hover:bg-river/3">
              <span class="grid size-9 shrink-0 place-items-center overflow-hidden rounded-lg bg-mist text-river">
                <img v-if="photoPreview" :src="photoPreview" class="h-full w-full object-cover" alt="Vista previa de la foto"/>
                <Camera v-else :size="17"/>
              </span>
              <span class="min-w-0"><span class="block truncate text-xs font-semibold">{{ photoName || 'Adjuntar una foto' }}</span><span class="mt-0.5 block text-[10px] text-ink/42">JPG, PNG, WebP, HEIC o HEIF · máximo 5 MB</span></span>
              <input type="file" aria-label="Foto del reclamo (obligatoria)" aria-required="true" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" class="sr-only" @change="choosePhoto">
            </label>
          </div>

          <label class="block">
            <span class="ui-label text-[9px] text-ink/50">3. Descripción · Opcional</span>
            <textarea v-model="description" rows="3" maxlength="200" placeholder="Contanos qué está pasando y desde cuándo…" class="mt-1.5 h-[92px] w-full resize-none rounded-xl border border-ink/14 bg-white px-3 py-3 text-base leading-relaxed outline-none transition placeholder:text-ink/32 focus:border-river focus:ring-2 focus:ring-river/12 sm:text-xs"/>
            <span class="mt-1 block text-right font-mono text-[9px] text-ink/35">{{ description.length }}/200</span>
          </label>

          <div>
            <p class="ui-label text-[9px] text-ink/50">4. Ubicación · Obligatoria</p>
            <label class="mt-2 block text-[11px] text-ink/60">Escribir la dirección
              <input v-model="address" maxlength="300" placeholder="Calle y altura, Santa Fe" class="mt-1.5 w-full rounded-xl border border-ink/14 px-3 py-3 text-xs" @input="invalidateAddress" @keydown.enter.prevent="findAddress">
            </label>
            <button type="button" :disabled="!address.trim() || locating" class="mt-2 rounded-lg border border-river/25 px-3 py-2 text-xs font-semibold text-river disabled:opacity-40" @click="findAddress">Buscar dirección</button>
            <ul v-if="addressResults.length" class="mt-2 divide-y divide-ink/10 rounded-xl border border-ink/14" aria-label="Direcciones encontradas">
              <li v-for="result in addressResults" :key="result.label"><button type="button" class="w-full p-3 text-left text-xs leading-relaxed hover:bg-mist" @click="selectAddress(result)">{{ result.label }}</button></li>
            </ul>
            <div v-if="location" class="mt-1.5 flex items-center gap-3 rounded-xl border border-[#d94841]/20 bg-[#d94841]/6 p-3">
              <span class="grid size-9 shrink-0 place-items-center rounded-full bg-[#d94841] text-white"><MapPin :size="17"/></span>
              <div class="min-w-0 flex-1"><p class="text-xs font-semibold">Punto marcado</p><p class="mt-0.5 truncate font-mono text-[9px] text-ink/46">{{ location.latitude.toFixed(6) }}, {{ location.longitude.toFixed(6) }}</p></div>
              <button type="button" class="rounded-lg px-2 py-1.5 text-[10px] font-semibold text-[#b9312b] hover:bg-[#d94841]/8" @click="markOnMap">Cambiar</button>
            </div>
            <button type="button" class="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl border border-river/25 bg-river/6 px-4 py-3 text-xs font-semibold text-river transition hover:bg-river/10" @click="markOnMap"><LocateFixed :size="17"/> Seleccionar un punto en el mapa</button>
            <button type="button" :disabled="locating" class="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-river/25 px-3 py-3 text-xs font-semibold text-river disabled:opacity-40" @click="useCurrentLocation"><LocateFixed :size="17"/> Utilizar mi ubicación actual</button>
            <p v-if="locating" class="mt-2 text-[11px] text-river" role="status">Buscando ubicación…</p>
            <p v-if="locationHint" class="mt-2 text-[10px] leading-relaxed text-ink/55">{{ locationHint }}</p>
            <p v-if="location && !isReportPointInBounds(location)" class="mt-2 text-[11px] text-[#a62e29]" role="alert">Seleccioná una ubicación dentro del área de Santa Fe.</p>
            <p v-if="locationError" class="mt-2 text-[11px] text-[#a62e29]" role="alert">{{ locationError }}</p>
          </div>

          <label v-if="location" class="block">
            <span class="ui-label flex items-center gap-1.5 text-[9px] text-ink/50"><Building2 :size="13" class="text-river"/> Barrio</span>
            <div class="relative mt-1.5">
              <input v-model.trim="neighborhood" maxlength="120" :placeholder="resolvingNeighborhood ? 'Buscando barrio…' : 'Escribí el barrio si lo conocés'" :disabled="resolvingNeighborhood" class="w-full rounded-xl border border-ink/14 bg-white px-3 py-3 text-xs outline-none transition placeholder:text-ink/32 focus:border-river focus:ring-2 focus:ring-river/12 disabled:bg-mist disabled:text-ink/45">
              <LoaderCircle v-if="resolvingNeighborhood" :size="15" class="absolute right-3 top-3 animate-spin text-river"/>
            </div>
            <span v-if="neighborhoodHint" class="mt-1.5 block text-[9px] leading-relaxed text-ink/42">{{ neighborhoodHint }}</span>
          </label>

          <fieldset class="space-y-3">
            <legend class="ui-label text-[9px] text-ink/50">5. Contacto · Opcional</legend>
            <p class="text-xs leading-relaxed text-ink/60">Déjanos tu contacto para avisarte sobre las novedades del reclamo</p>
            <label class="block text-[11px] text-ink/60">Nombre y Apellido (opcional)<input v-model="contactName" autocomplete="name" maxlength="120" class="mt-1.5 w-full rounded-xl border border-ink/14 px-3 py-3 text-xs"></label>
            <label class="block text-[11px] text-ink/60">Teléfono (opcional)<input v-model="contactPhone" type="tel" autocomplete="tel" maxlength="40" class="mt-1.5 w-full rounded-xl border border-ink/14 px-3 py-3 text-xs"></label>
            <label class="block text-[11px] text-ink/60">Mail (opcional)<input v-model="contactEmail" type="email" autocomplete="email" maxlength="254" class="mt-1.5 w-full rounded-xl border border-ink/14 px-3 py-3 text-xs"></label>
          </fieldset>

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

<style scoped>
.report-panel {
  border-color: rgba(9, 34, 53, .24);
  background: #1f2a49;
  box-shadow: 0 16px 38px rgba(9, 22, 39, .28);
}
.report-panel-body {
  margin: 0 16px 16px;
  background: #fff;
}
</style>
