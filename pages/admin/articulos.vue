<script setup lang="ts">
import {
  ArrowDown,
  ArrowUp,
  Check,
  CircleAlert,
  ExternalLink,
  FileText,
  Heading2,
  Info,
  List,
  LoaderCircle,
  MessageSquareQuote,
  Newspaper,
  Pilcrow,
  Plus,
  Save,
  Trash2,
} from 'lucide-vue-next'
import type {
  Article,
  ArticleBlock,
  ArticleCategory,
  ArticleInput,
  ArticleStatus,
  ArticleVisualVariant,
} from '~/types/content'

definePageMeta({ layout: 'admin' })
useHead({ title: 'Administración de artículos' })

const CATEGORIES: ArticleCategory[] = ['Proyecto', 'Guías', 'Datos abiertos']
const VISUALS: Array<{ value: ArticleVisualVariant; label: string; description: string }> = [
  { value: 'topography', label: 'Topografía', description: 'Curvas de nivel y territorio' },
  { value: 'reading', label: 'Lectura', description: 'Documentos y claves' },
  { value: 'sources', label: 'Fuentes', description: 'Datos y trazabilidad' },
]
const BLOCK_TYPES: Array<{ value: ArticleBlock['type']; label: string; icon: typeof Pilcrow }> = [
  { value: 'paragraph', label: 'Párrafo', icon: Pilcrow },
  { value: 'heading', label: 'Subtítulo', icon: Heading2 },
  { value: 'callout', label: 'Destacado', icon: Info },
  { value: 'quote', label: 'Cita', icon: MessageSquareQuote },
  { value: 'list', label: 'Lista', icon: List },
]

function emptyForm(): ArticleInput {
  return {
    title: '',
    slug: '',
    excerpt: '',
    category: 'Proyecto',
    publishedAt: new Date().toLocaleDateString('en-CA'),
    readingMinutes: 4,
    visual: 'topography',
    kicker: '',
    summary: [''],
    blocks: [{ type: 'paragraph', text: '' }],
    status: 'draft',
  }
}

const form = reactive<ArticleInput>(emptyForm())
const slugWasEdited = ref(false)
const validationErrors = ref<string[]>([])
const saveError = ref('')
const savedArticle = ref<Article | null>(null)
const saving = ref(false)
const loadingArticles = ref(true)
const articlesError = ref('')
const articles = ref<Article[]>([])
const { createArticle, fetchArticles } = useArticles()

watch(() => form.title, (title) => {
  if (!slugWasEdited.value) form.slug = slugify(title)
})

onMounted(loadArticles)

function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120)
}

function editSlug() {
  slugWasEdited.value = true
  form.slug = slugify(form.slug)
}

function createBlock(type: ArticleBlock['type']): ArticleBlock {
  if (type === 'list') return { type, items: [''] }
  if (type === 'callout') return { type, tone: 'information', title: '', text: '' }
  return { type, text: '' }
}

function changeBlockType(index: number, type: ArticleBlock['type']) {
  form.blocks[index] = createBlock(type)
}

function addBlock(type: ArticleBlock['type']) {
  form.blocks.push(createBlock(type))
  nextTick(() => document.querySelector(`[data-block-index="${form.blocks.length - 1}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
}

function removeBlock(index: number) {
  if (form.blocks.length === 1) return
  form.blocks.splice(index, 1)
}

function moveBlock(index: number, direction: -1 | 1) {
  const target = index + direction
  if (target < 0 || target >= form.blocks.length) return
  const [block] = form.blocks.splice(index, 1)
  if (block) form.blocks.splice(target, 0, block)
}

function addSummaryItem() {
  if (form.summary.length < 6) form.summary.push('')
}

function addListItem(block: Extract<ArticleBlock, { type: 'list' }>) {
  block.items.push('')
}

function validate() {
  const errors: string[] = []
  if (form.title.trim().length < 5) errors.push('El título debe tener al menos 5 caracteres.')
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(form.slug)) errors.push('El enlace debe usar palabras en minúscula separadas por guiones.')
  if (form.excerpt.trim().length < 20) errors.push('La bajada debe tener al menos 20 caracteres.')
  if (form.kicker.trim().length < 3) errors.push('La etiqueta editorial debe tener al menos 3 caracteres.')
  if (!form.publishedAt) errors.push('Elegí una fecha editorial.')
  if (form.readingMinutes < 1 || form.readingMinutes > 60) errors.push('El tiempo de lectura debe estar entre 1 y 60 minutos.')
  if (!form.summary.some(item => item.trim())) errors.push('Agregá al menos una idea en la síntesis.')

  form.blocks.forEach((block, index) => {
    const label = `Bloque ${index + 1}`
    if (block.type === 'list' && !block.items.some(item => item.trim())) errors.push(`${label}: agregá al menos un elemento a la lista.`)
    else if (block.type === 'callout' && (!block.title.trim() || !block.text.trim())) errors.push(`${label}: completá el título y el contenido del destacado.`)
    else if (block.type !== 'list' && block.type !== 'callout' && !block.text.trim()) errors.push(`${label}: completá el contenido.`)
  })

  validationErrors.value = errors
  return errors.length === 0
}

function sanitizedInput(): ArticleInput {
  return {
    ...form,
    title: form.title.trim(),
    slug: form.slug.trim(),
    excerpt: form.excerpt.trim(),
    kicker: form.kicker.trim(),
    summary: form.summary.map(item => item.trim()).filter(Boolean),
    blocks: form.blocks.map((block) => {
      if (block.type === 'list') return { ...block, items: block.items.map(item => item.trim()).filter(Boolean) }
      if (block.type === 'callout') return { ...block, title: block.title.trim(), text: block.text.trim() }
      return { ...block, text: block.text.trim() }
    }),
  }
}

async function submitArticle() {
  saveError.value = ''
  savedArticle.value = null
  if (!validate()) {
    nextTick(() => document.querySelector('#article-errors')?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
    return
  }

  saving.value = true
  try {
    savedArticle.value = await createArticle(sanitizedInput())
    await loadArticles()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  catch (error) {
    saveError.value = error instanceof Error ? error.message : 'No se pudo guardar el artículo.'
  }
  finally {
    saving.value = false
  }
}

async function loadArticles() {
  loadingArticles.value = true
  articlesError.value = ''
  try {
    articles.value = await fetchArticles({ includeDrafts: true })
  }
  catch (error) {
    articlesError.value = error instanceof Error ? error.message : 'No se pudo cargar el archivo editorial.'
  }
  finally {
    loadingArticles.value = false
  }
}

function startAnotherArticle() {
  Object.assign(form, emptyForm())
  slugWasEdited.value = false
  validationErrors.value = []
  saveError.value = ''
  savedArticle.value = null
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function statusLabel(status: ArticleStatus) {
  return status === 'published' ? 'Publicado' : 'Borrador'
}
</script>

<template>
  <div class="min-h-dvh px-4 py-6 sm:px-6 lg:px-8 lg:py-8 xl:px-10">
    <div class="mx-auto max-w-[1500px]">
      <header class="relative overflow-hidden rounded-[1.75rem] bg-ink px-5 py-7 text-white sm:px-8 lg:px-10 lg:py-9">
        <div class="pointer-events-none absolute inset-y-0 right-0 w-2/3 opacity-40 [background:repeating-radial-gradient(ellipse_at_90%_20%,transparent_0_24px,rgba(120,204,239,.3)_25px_26px)]" />
        <div class="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p class="ui-label flex items-center gap-2 text-river-light"><Newspaper :size="14" /> Archivo editorial</p>
            <h1 class="mt-4 max-w-4xl text-[clamp(2.2rem,4.5vw,4.8rem)] font-semibold leading-[.9] tracking-[-.065em]">Cargar una nota.<br><span class="text-river-light">Bloque por bloque.</span></h1>
            <p class="mt-5 max-w-2xl text-sm leading-relaxed text-white/55">Completá la portada, la síntesis y el cuerpo. Podés guardar como borrador o publicar directamente en Novedades.</p>
          </div>
          <div class="flex gap-2 text-[10px] font-semibold text-white/45">
            <span class="rounded-full border border-white/12 px-3 py-2">Sin código</span>
            <span class="rounded-full border border-white/12 px-3 py-2">Guardado en Supabase</span>
          </div>
        </div>
      </header>

      <section v-if="savedArticle" class="mt-6 flex flex-col gap-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div class="flex items-start gap-3">
          <span class="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-600 text-white"><Check :size="18" /></span>
          <div><p class="font-semibold">Artículo guardado como {{ statusLabel(savedArticle.status).toLowerCase() }}.</p><p class="mt-1 text-sm text-emerald-900/65">“{{ savedArticle.title }}” ya forma parte del archivo editorial.</p></div>
        </div>
        <div class="flex flex-wrap gap-2">
          <NuxtLink v-if="savedArticle.status === 'published'" :to="`/novedades/${savedArticle.slug}`" target="_blank" class="inline-flex h-10 items-center gap-2 rounded-xl border border-emerald-700/20 bg-white px-4 text-xs font-semibold text-emerald-900"><ExternalLink :size="14" /> Ver publicación</NuxtLink>
          <button type="button" class="h-10 rounded-xl bg-emerald-700 px-4 text-xs font-semibold text-white" @click="startAnotherArticle">Cargar otro artículo</button>
        </div>
      </section>

      <div class="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_350px]">
        <form id="article-form" class="min-w-0 space-y-6" @submit.prevent="submitArticle">
          <div v-if="validationErrors.length || saveError" id="article-errors" class="rounded-2xl border border-red-200 bg-red-50 p-5" role="alert">
            <div class="flex items-start gap-3"><CircleAlert :size="19" class="mt-0.5 shrink-0 text-red-600"/><div><p class="text-sm font-semibold text-red-900">Revisá el artículo antes de guardarlo</p><p v-if="saveError" class="mt-2 text-sm text-red-800">{{ saveError }}</p><ul v-if="validationErrors.length" class="mt-2 list-disc space-y-1 pl-4 text-sm text-red-800"><li v-for="error in validationErrors" :key="error">{{ error }}</li></ul></div></div>
          </div>

          <section class="editor-section">
            <div class="section-heading"><span>01</span><div><h2>Portada</h2><p>Lo que una persona ve antes de abrir la nota.</p></div></div>
            <div class="mt-7 grid gap-5">
              <label class="field-label">Título <span>Obligatorio · máximo 180</span><input v-model="form.title" required minlength="5" maxlength="180" class="editor-field text-lg font-semibold" placeholder="Cómo se construirá…"></label>
              <label class="field-label">Enlace <span>Se genera desde el título</span><div class="slug-field"><span>/novedades/</span><input v-model="form.slug" required maxlength="120" placeholder="titulo-del-articulo" @input="editSlug"></div></label>
              <label class="field-label">Bajada <span>{{ form.excerpt.length }}/320</span><textarea v-model="form.excerpt" required minlength="20" maxlength="320" rows="3" class="editor-field resize-y" placeholder="Una frase breve que explique por qué vale la pena leer esta nota." /></label>
            </div>
          </section>

          <section class="editor-section">
            <div class="section-heading"><span>02</span><div><h2>Datos de publicación</h2><p>Cómo se ordena e identifica la nota en el archivo.</p></div></div>
            <div class="mt-7 grid gap-5 sm:grid-cols-2">
              <label class="field-label">Categoría<select v-model="form.category" class="editor-field"><option v-for="category in CATEGORIES" :key="category" :value="category">{{ category }}</option></select></label>
              <label class="field-label">Fecha editorial<input v-model="form.publishedAt" type="date" required class="editor-field"></label>
              <label class="field-label">Tiempo de lectura <span>Minutos</span><input v-model.number="form.readingMinutes" type="number" min="1" max="60" required class="editor-field"></label>
              <label class="field-label">Etiqueta editorial <span>{{ form.kicker.length }}/100</span><input v-model="form.kicker" required minlength="3" maxlength="100" class="editor-field" placeholder="El proyecto por dentro"></label>
            </div>
            <fieldset class="mt-6"><legend class="field-label">Lenguaje visual <span>Ilustración de portada</span></legend><div class="mt-3 grid gap-3 sm:grid-cols-3"><label v-for="visual in VISUALS" :key="visual.value" class="visual-choice" :class="form.visual === visual.value && 'is-selected'"><input v-model="form.visual" type="radio" :value="visual.value" class="sr-only"><span class="visual-mark" :data-visual="visual.value"><i/><i/><i/></span><strong>{{ visual.label }}</strong><small>{{ visual.description }}</small></label></div></fieldset>
          </section>

          <section class="editor-section">
            <div class="section-heading"><span>03</span><div><h2>En síntesis</h2><p>Entre una y seis ideas que acompañan la lectura.</p></div></div>
            <div class="mt-7 space-y-3">
              <div v-for="(_, index) in form.summary" :key="index" class="flex items-center gap-3"><span class="grid size-7 shrink-0 place-items-center rounded-full bg-mist font-mono text-[10px] text-river-ink">{{ index + 1 }}</span><input v-model="form.summary[index]" maxlength="240" class="editor-field" :placeholder="`Idea principal ${index + 1}`"><button v-if="form.summary.length > 1" type="button" class="icon-button" :aria-label="`Eliminar idea ${index + 1}`" @click="form.summary.splice(index, 1)"><Trash2 :size="15" /></button></div>
            </div>
            <button v-if="form.summary.length < 6" type="button" class="add-inline" @click="addSummaryItem"><Plus :size="15" /> Agregar otra idea</button>
          </section>

          <section class="editor-section overflow-hidden">
            <div class="section-heading"><span>04</span><div><h2>Cuerpo de la nota</h2><p>Armá el recorrido de lectura y cambiá el orden cuando lo necesites.</p></div></div>
            <div class="relative mt-8 space-y-4 before:absolute before:bottom-5 before:left-[18px] before:top-5 before:w-px before:bg-river/25">
              <article v-for="(block, index) in form.blocks" :key="index" :data-block-index="index" class="relative pl-12">
                <span class="absolute left-0 top-4 z-10 grid size-9 place-items-center rounded-full border-4 border-white bg-ink font-mono text-[9px] text-white">{{ String(index + 1).padStart(2, '0') }}</span>
                <div class="block-card">
                  <div class="flex flex-wrap items-center justify-between gap-3 border-b border-ink/8 px-4 py-3 sm:px-5">
                    <label class="flex items-center gap-2 text-xs font-semibold"><component :is="BLOCK_TYPES.find(item => item.value === block.type)?.icon" :size="15" class="text-river"/><select :value="block.type" class="rounded-lg border border-ink/10 bg-mist px-2.5 py-2 text-xs" @change="changeBlockType(index, ($event.target as HTMLSelectElement).value as ArticleBlock['type'])"><option v-for="type in BLOCK_TYPES" :key="type.value" :value="type.value">{{ type.label }}</option></select></label>
                    <div class="flex items-center gap-1"><button type="button" class="icon-button" :disabled="index === 0" aria-label="Subir bloque" @click="moveBlock(index, -1)"><ArrowUp :size="14" /></button><button type="button" class="icon-button" :disabled="index === form.blocks.length - 1" aria-label="Bajar bloque" @click="moveBlock(index, 1)"><ArrowDown :size="14" /></button><button type="button" class="icon-button text-red-600" :disabled="form.blocks.length === 1" aria-label="Eliminar bloque" @click="removeBlock(index)"><Trash2 :size="14" /></button></div>
                  </div>
                  <div class="p-4 sm:p-5">
                    <textarea v-if="block.type === 'paragraph'" v-model="block.text" rows="5" class="editor-field resize-y" placeholder="Escribí el párrafo…" />
                    <input v-else-if="block.type === 'heading'" v-model="block.text" maxlength="180" class="editor-field text-lg font-semibold" placeholder="Título de esta sección">
                    <textarea v-else-if="block.type === 'quote'" v-model="block.text" rows="3" class="editor-field resize-y text-lg font-medium" placeholder="Una cita o idea que merece otra cadencia…" />
                    <div v-else-if="block.type === 'callout'" class="grid gap-4"><div class="flex flex-wrap gap-2"><label class="tone-choice" :class="block.tone === 'information' && 'is-selected'"><input v-model="block.tone" type="radio" value="information" class="sr-only"> Información</label><label class="tone-choice attention" :class="block.tone === 'attention' && 'is-selected'"><input v-model="block.tone" type="radio" value="attention" class="sr-only"> Atención</label></div><input v-model="block.title" maxlength="140" class="editor-field font-semibold" placeholder="Título del destacado"><textarea v-model="block.text" rows="4" class="editor-field resize-y" placeholder="Información que querés destacar…" /></div>
                    <div v-else-if="block.type === 'list'" class="space-y-3"><div v-for="(_, itemIndex) in block.items" :key="itemIndex" class="flex items-center gap-3"><span class="size-1.5 shrink-0 rounded-full bg-river"/><input v-model="block.items[itemIndex]" class="editor-field" :placeholder="`Elemento ${itemIndex + 1}`"><button v-if="block.items.length > 1" type="button" class="icon-button" aria-label="Eliminar elemento" @click="block.items.splice(itemIndex, 1)"><Trash2 :size="14" /></button></div><button type="button" class="add-inline !mt-4" @click="addListItem(block)"><Plus :size="14"/> Agregar elemento</button></div>
                  </div>
                </div>
              </article>
            </div>
            <div class="mt-6 rounded-2xl border border-dashed border-ink/15 bg-[#f7fafb] p-4"><p class="ui-label text-ink/40">Agregar un bloque</p><div class="mt-3 flex flex-wrap gap-2"><button v-for="type in BLOCK_TYPES" :key="type.value" type="button" class="inline-flex h-9 items-center gap-2 rounded-lg border border-ink/10 bg-white px-3 text-xs font-semibold text-ink/65 transition hover:border-river/40 hover:text-river-ink" @click="addBlock(type.value)"><component :is="type.icon" :size="14"/> {{ type.label }}</button></div></div>
          </section>

          <button type="submit" class="flex h-13 w-full items-center justify-center gap-2 rounded-xl bg-river px-5 text-sm font-semibold text-white shadow-lg shadow-river/20 transition hover:bg-river-ink disabled:cursor-wait disabled:opacity-55 xl:hidden" :disabled="saving || Boolean(savedArticle)"><LoaderCircle v-if="saving" :size="17" class="animate-spin"/><Save v-else :size="17"/>{{ saving ? 'Guardando…' : savedArticle ? 'Artículo guardado' : form.status === 'published' ? 'Publicar artículo' : 'Guardar borrador' }}</button>
        </form>

        <aside class="space-y-5 xl:sticky xl:top-6">
          <section class="rounded-2xl border border-ink/10 bg-white p-5 shadow-[0_12px_35px_rgba(9,34,53,.07)]">
            <p class="ui-label text-river">Estado editorial</p>
            <div class="mt-4 grid gap-2"><label class="status-choice" :class="form.status === 'draft' && 'is-selected'"><input v-model="form.status" type="radio" value="draft" class="sr-only"><span class="status-dot"/><span><strong>Guardar borrador</strong><small>Solo lo verá la administración.</small></span></label><label class="status-choice" :class="form.status === 'published' && 'is-selected'"><input v-model="form.status" type="radio" value="published" class="sr-only"><span class="status-dot"/><span><strong>Publicar ahora</strong><small>Aparecerá en Novedades.</small></span></label></div>
            <button form="article-form" type="submit" class="mt-5 hidden h-12 w-full items-center justify-center gap-2 rounded-xl bg-river px-4 text-sm font-semibold text-white shadow-lg shadow-river/20 transition hover:bg-river-ink disabled:cursor-wait disabled:opacity-55 xl:flex" :disabled="saving || Boolean(savedArticle)"><LoaderCircle v-if="saving" :size="17" class="animate-spin"/><Save v-else :size="17"/>{{ saving ? 'Guardando…' : savedArticle ? 'Artículo guardado' : form.status === 'published' ? 'Publicar artículo' : 'Guardar borrador' }}</button>
            <p class="mt-3 text-center text-[11px] leading-relaxed text-ink/42">El formulario se valida antes de enviar los datos.</p>
          </section>

          <section class="rounded-2xl border border-ink/10 bg-white p-5">
            <div class="flex items-center justify-between gap-3"><div><p class="ui-label text-ink/40">Archivo</p><h2 class="mt-1 font-semibold">Artículos cargados</h2></div><span class="grid size-9 place-items-center rounded-full bg-mist text-river"><FileText :size="17"/></span></div>
            <div v-if="loadingArticles" class="mt-5 flex items-center gap-2 text-xs text-ink/45"><LoaderCircle :size="14" class="animate-spin"/> Cargando archivo…</div>
            <p v-else-if="articlesError" class="mt-5 text-xs leading-relaxed text-red-700">{{ articlesError }}</p>
            <p v-else-if="!articles.length" class="mt-5 text-xs leading-relaxed text-ink/45">Todavía no hay artículos. El primero que guardes aparecerá acá.</p>
            <ul v-else class="mt-4 divide-y divide-ink/8">
              <li v-for="article in articles.slice(0, 8)" :key="article.id" class="py-3 first:pt-0 last:pb-0"><div class="flex items-start justify-between gap-3"><div class="min-w-0"><p class="line-clamp-2 text-xs font-semibold leading-snug">{{ article.title }}</p><p class="mt-1 font-mono text-[9px] uppercase tracking-wider text-ink/38">{{ statusLabel(article.status) }} · {{ article.publishedAt }}</p></div><NuxtLink v-if="article.status === 'published'" :to="`/novedades/${article.slug}`" target="_blank" class="grid size-7 shrink-0 place-items-center rounded-lg border border-ink/10 text-ink/40 hover:text-river" aria-label="Abrir artículo"><ExternalLink :size="13"/></NuxtLink></div></li>
            </ul>
          </section>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.editor-section { border: 1px solid rgba(9, 34, 53, .1); border-radius: 1.25rem; background: white; padding: clamp(1.25rem, 3vw, 2rem); box-shadow: 0 8px 25px rgba(9, 34, 53, .045); }
.section-heading { display: flex; align-items: flex-start; gap: .9rem; }
.section-heading > span { display: grid; place-items: center; width: 2.35rem; height: 2.35rem; flex: none; border-radius: 999px; background: #092235; color: #78ccef; font: 400 .62rem/1 "IBM Plex Mono", monospace; letter-spacing: .08em; }
.section-heading h2 { font-size: 1.25rem; line-height: 1.2; font-weight: 650; letter-spacing: -.025em; }
.section-heading p { margin-top: .3rem; color: rgba(9, 34, 53, .5); font-size: .78rem; line-height: 1.5; }
.field-label { display: grid; gap: .55rem; color: rgba(9, 34, 53, .78); font-size: .75rem; font-weight: 650; }
.field-label > span { justify-self: end; margin-top: -1.45rem; color: rgba(9, 34, 53, .35); font-family: "IBM Plex Mono", monospace; font-size: .58rem; font-weight: 400; letter-spacing: .04em; text-transform: uppercase; }
.editor-field { width: 100%; min-height: 2.85rem; border: 1px solid rgba(9, 34, 53, .14); border-radius: .75rem; background: #fbfdfd; padding: .72rem .85rem; color: #092235; font-size: .84rem; outline: none; transition: border-color .18s, box-shadow .18s, background .18s; }
.editor-field:focus { border-color: rgba(28, 158, 218, .75); background: white; box-shadow: 0 0 0 3px rgba(28, 158, 218, .1); }
.editor-field::placeholder { color: rgba(9, 34, 53, .28); }
.slug-field { display: flex; min-height: 2.85rem; overflow: hidden; border: 1px solid rgba(9, 34, 53, .14); border-radius: .75rem; background: #fbfdfd; }
.slug-field:focus-within { border-color: rgba(28, 158, 218, .75); box-shadow: 0 0 0 3px rgba(28, 158, 218, .1); }
.slug-field span { display: flex; align-items: center; padding-left: .85rem; color: rgba(9, 34, 53, .36); font: 400 .72rem/1 "IBM Plex Mono", monospace; }
.slug-field input { min-width: 0; flex: 1; background: transparent; padding: .72rem .85rem .72rem 0; color: #092235; font: 400 .72rem/1 "IBM Plex Mono", monospace; outline: none; }
.visual-choice { display: grid; cursor: pointer; grid-template-columns: 2.5rem 1fr; column-gap: .75rem; align-items: center; border: 1px solid rgba(9, 34, 53, .11); border-radius: .9rem; padding: .75rem; transition: border-color .18s, background .18s; }
.visual-choice.is-selected { border-color: rgba(28, 158, 218, .62); background: rgba(237, 244, 243, .7); box-shadow: inset 0 0 0 1px rgba(28, 158, 218, .1); }
.visual-choice strong { font-size: .72rem; }
.visual-choice small { grid-column: 2; color: rgba(9, 34, 53, .42); font-size: .62rem; }
.visual-mark { position: relative; display: grid; grid-row: span 2; place-items: center; width: 2.5rem; height: 2.5rem; overflow: hidden; border-radius: .65rem; background: #092235; }
.visual-mark i { position: absolute; width: 2.8rem; height: 1px; background: #78ccef; transform: rotate(-12deg); }
.visual-mark i:nth-child(2) { transform: translateY(7px) rotate(8deg); opacity: .55; }
.visual-mark i:nth-child(3) { width: .35rem; height: .35rem; border-radius: 99px; background: #f3b85b; transform: none; }
.visual-mark[data-visual="reading"] i { width: 1rem; transform: translateX(-5px) rotate(90deg); }
.visual-mark[data-visual="reading"] i:nth-child(2) { transform: translate(5px, 0) rotate(90deg); }
.visual-mark[data-visual="sources"] i { width: 1.25rem; transform: translateY(-6px); }
.visual-mark[data-visual="sources"] i:nth-child(2) { transform: translateY(6px); }
.block-card { overflow: hidden; border: 1px solid rgba(9, 34, 53, .1); border-radius: 1rem; background: white; box-shadow: 0 5px 18px rgba(9, 34, 53, .045); }
.icon-button { display: grid; width: 2rem; height: 2rem; flex: none; place-items: center; border-radius: .55rem; color: rgba(9, 34, 53, .48); transition: background .18s, color .18s; }
.icon-button:hover:not(:disabled) { background: #edf4f3; color: #0877ad; }
.icon-button:disabled { cursor: not-allowed; opacity: .25; }
.add-inline { display: inline-flex; align-items: center; gap: .4rem; margin-top: 1rem; color: #0877ad; font-size: .72rem; font-weight: 650; }
.tone-choice { cursor: pointer; border: 1px solid rgba(28, 158, 218, .22); border-radius: 99px; background: #edf4f3; padding: .45rem .7rem; color: rgba(9, 34, 53, .55); font-size: .66rem; font-weight: 650; }
.tone-choice.attention { border-color: rgba(166, 109, 19, .2); background: #fff7e8; }
.tone-choice.is-selected { border-color: #1c9eda; color: #0877ad; box-shadow: inset 0 0 0 1px #1c9eda; }
.tone-choice.attention.is-selected { border-color: #a66d13; color: #8a5810; box-shadow: inset 0 0 0 1px #a66d13; }
.status-choice { display: grid; cursor: pointer; grid-template-columns: 1rem 1fr; gap: .65rem; border: 1px solid rgba(9, 34, 53, .1); border-radius: .8rem; padding: .85rem; transition: border-color .18s, background .18s; }
.status-choice.is-selected { border-color: rgba(28, 158, 218, .5); background: #f2f9fb; }
.status-choice strong, .status-choice small { display: block; }
.status-choice strong { font-size: .75rem; }
.status-choice small { margin-top: .2rem; color: rgba(9, 34, 53, .44); font-size: .65rem; line-height: 1.35; }
.status-dot { width: .85rem; height: .85rem; margin-top: .05rem; border: 1px solid rgba(9, 34, 53, .25); border-radius: 99px; box-shadow: inset 0 0 0 3px white; }
.status-choice.is-selected .status-dot { border-color: #1c9eda; background: #1c9eda; }
</style>
