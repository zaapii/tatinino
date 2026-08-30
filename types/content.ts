export type ArticleCategory = 'Proyecto' | 'Guías' | 'Datos abiertos'
export type ArticleVisualVariant = 'topography' | 'reading' | 'sources'
export type ArticleStatus = 'draft' | 'published'

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; title: string; text: string; tone: 'information' | 'attention' }
  | { type: 'quote'; text: string }

export type Article = {
  id: string
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  publishedAt: string
  readingTime: string
  visual: ArticleVisualVariant
  kicker: string
  summary: string[]
  blocks: ArticleBlock[]
  status: ArticleStatus
  createdAt: string
  updatedAt: string
}

export type ArticleInput = {
  slug: string
  title: string
  excerpt: string
  category: ArticleCategory
  publishedAt: string
  readingMinutes: number
  visual: ArticleVisualVariant
  kicker: string
  summary: string[]
  blocks: ArticleBlock[]
  status: ArticleStatus
}
