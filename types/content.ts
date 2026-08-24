export type ArticleCategory = 'Proyecto' | 'Guías' | 'Datos abiertos'
export type ArticleVisualVariant = 'topography' | 'reading' | 'sources'

export type ArticleBlock =
  | { type: 'paragraph'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'callout'; title: string; text: string; tone: 'information' | 'attention' }
  | { type: 'quote'; text: string }

export type Article = {
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
}
