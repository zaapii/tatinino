import type {
  Article,
  ArticleBlock,
  ArticleCategory,
  ArticleInput,
  ArticleStatus,
  ArticleVisualVariant,
} from '~/types/content'

type ArticleRow = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  published_at: string
  reading_minutes: number
  visual: ArticleVisualVariant
  kicker: string
  summary: string[]
  blocks: ArticleBlock[]
  status: ArticleStatus
  created_at: string
  updated_at: string
}

const articleColumns = [
  'id',
  'slug',
  'title',
  'excerpt',
  'category',
  'published_at',
  'reading_minutes',
  'visual',
  'kicker',
  'summary',
  'blocks',
  'status',
  'created_at',
  'updated_at',
].join(',')

function formatPublicationDate(value: string) {
  const date = new Date(`${value}T12:00:00`)
  const parts = new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Argentina/Cordoba',
  }).formatToParts(date)
  const valueOf = (type: Intl.DateTimeFormatPartTypes) => parts.find(part => part.type === type)?.value ?? ''
  return [valueOf('day'), valueOf('month'), valueOf('year')]
    .join(' ')
    .replaceAll('.', '')
    .toLocaleUpperCase('es-AR')
}

function mapArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    publishedAt: formatPublicationDate(row.published_at),
    readingTime: `${row.reading_minutes} min de lectura`,
    visual: row.visual,
    kicker: row.kicker,
    summary: row.summary,
    blocks: row.blocks,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function readableError(error: { code?: string; message: string }) {
  if (error.code === '23505') return 'Ya existe un artículo con ese enlace.'
  if (error.code === '42501') return 'Tu sesión no tiene permiso para guardar artículos.'
  return `No se pudo guardar el artículo: ${error.message}`
}

export function useArticles() {
  const supabase = useSupabaseClient()

  async function fetchArticles(options: { includeDrafts?: boolean } = {}) {
    let query = supabase
      .from('articles')
      .select(articleColumns)
      .order('published_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (!options.includeDrafts) query = query.eq('status', 'published')

    const { data, error } = await query
    if (error) throw new Error(`No se pudieron cargar los artículos: ${error.message}`)
    return ((data ?? []) as unknown as ArticleRow[]).map(mapArticle)
  }

  async function fetchArticleBySlug(slug: string) {
    const { data, error } = await supabase
      .from('articles')
      .select(articleColumns)
      .eq('slug', slug)
      .eq('status', 'published')
      .maybeSingle()

    if (error) throw new Error(`No se pudo cargar el artículo: ${error.message}`)
    return data ? mapArticle(data as unknown as ArticleRow) : null
  }

  async function createArticle(input: ArticleInput) {
    const { data, error } = await supabase
      .from('articles')
      .insert({
        slug: input.slug,
        title: input.title,
        excerpt: input.excerpt,
        category: input.category,
        published_at: input.publishedAt,
        reading_minutes: input.readingMinutes,
        visual: input.visual,
        kicker: input.kicker,
        summary: input.summary,
        blocks: input.blocks,
        status: input.status,
      })
      .select(articleColumns)
      .single()

    if (error) throw new Error(readableError(error))
    return mapArticle(data as unknown as ArticleRow)
  }

  return { createArticle, fetchArticleBySlug, fetchArticles }
}
