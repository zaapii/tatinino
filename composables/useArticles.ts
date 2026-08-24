import type { Article } from '~/types/content'

const articles: Article[] = [
  {
    slug: 'como-se-construira-el-mapa-de-cotas',
    title: 'Cómo se construirá el mapa de cotas de Santa Fe',
    excerpt: 'Una mirada simple al proceso que permitirá transformar datos técnicos en una herramienta pública comprensible.',
    category: 'Proyecto',
    publishedAt: '24 AGO 2026',
    readingTime: '4 min de lectura',
    visual: 'topography',
    kicker: 'Detrás del mapa',
    summary: [
      'Los datos deberán provenir de fuentes identificadas y documentadas.',
      'La visualización explicará sus alcances y limitaciones.',
      'Una cota menor no equivale por sí sola a mayor riesgo de inundación.',
    ],
    blocks: [
      { type: 'paragraph', text: 'El mapa de cotas está pensado como una puerta de entrada a la información territorial. Su objetivo no es simplificar un fenómeno complejo hasta volverlo impreciso, sino ayudar a que cualquier persona pueda hacer mejores preguntas sobre el lugar donde vive.' },
      { type: 'heading', text: 'Primero, datos con procedencia conocida' },
      { type: 'paragraph', text: 'Antes de representar alturas del terreno será necesario incorporar modelos digitales de elevación cuya institución responsable, fecha y metodología puedan ser consultadas. La plataforma mantendrá esa información junto a cada capa publicada.' },
      { type: 'callout', tone: 'information', title: 'Una regla editorial del proyecto', text: 'Cuando un dato todavía no esté disponible o no haya sido validado, la interfaz lo dirá de forma explícita. Un espacio vacío es preferible a un valor que pueda confundirse con información oficial.' },
      { type: 'heading', text: 'Después, una traducción visual responsable' },
      { type: 'paragraph', text: 'Los colores, leyendas y controles deberán explicar qué representa cada capa sin exigir conocimientos de cartografía. La lectura del mapa siempre estará acompañada por contexto sobre drenaje, defensas, lluvias y niveles de los ríos.' },
      { type: 'quote', text: 'Visualizar no es afirmar: es ofrecer una forma clara de explorar información documentada.' },
      { type: 'heading', text: 'Una arquitectura preparada para crecer' },
      { type: 'list', items: ['Archivos GeoJSON para conjuntos acotados.', 'PMTiles para capas vectoriales de gran tamaño.', 'Teselas raster para modelos y superficies continuas.', 'Distribución mediante almacenamiento y CDN cuando las fuentes estén disponibles.'] },
    ],
  },
  {
    slug: 'cinco-claves-para-leer-informacion-hidrica',
    title: 'Cinco claves para leer información hídrica sin apresurarse',
    excerpt: 'Una guía breve para diferenciar observaciones, pronósticos y escenarios antes de sacar conclusiones.',
    category: 'Guías',
    publishedAt: '22 AGO 2026',
    readingTime: '3 min de lectura',
    visual: 'reading',
    kicker: 'Lectura ciudadana',
    summary: [
      'Revisar siempre la fecha y la fuente.',
      'Distinguir mediciones de estimaciones.',
      'Leer una variable dentro de su contexto territorial.',
    ],
    blocks: [
      { type: 'paragraph', text: 'La información hídrica puede incluir mediciones, mapas, modelos y comunicados producidos con objetivos diferentes. Leerlos con atención permite evitar interpretaciones alarmistas o conclusiones que los datos no sostienen.' },
      { type: 'heading', text: 'Cinco preguntas útiles' },
      { type: 'list', items: ['¿Quién produjo esta información?', '¿Cuándo fue actualizada?', '¿Es una medición, un pronóstico o un escenario?', '¿Qué territorio y período representa?', '¿Qué limitaciones declara la fuente?'] },
      { type: 'callout', tone: 'attention', title: 'Importante', text: 'Un mapa o indicador aislado no reemplaza las comunicaciones de los organismos de emergencia ni describe por sí solo el comportamiento del agua.' },
      { type: 'heading', text: 'Observar no es pronosticar' },
      { type: 'paragraph', text: 'Un dato observado registra una condición que ya fue medida. Un pronóstico estima una evolución futura dentro de un plazo. Un escenario explora una posibilidad bajo ciertos supuestos. La plataforma identificará cada tipo de contenido con claridad.' },
    ],
  },
  {
    slug: 'que-significa-una-fuente-verificable',
    title: 'Qué significa que una fuente sea verificable',
    excerpt: 'Procedencia, fecha y método: tres datos que convierten una publicación en información que puede revisarse.',
    category: 'Datos abiertos',
    publishedAt: '19 AGO 2026',
    readingTime: '4 min de lectura',
    visual: 'sources',
    kicker: 'Transparencia aplicada',
    summary: [
      'La fuente debe poder identificarse y consultarse.',
      'La fecha permite saber si la información sigue vigente.',
      'La metodología explica cómo se obtuvo el dato.',
    ],
    blocks: [
      { type: 'paragraph', text: 'Decir que una fuente es verificable significa que otra persona puede reconocer su origen, consultar el material de referencia y comprender, al menos en términos generales, cómo fue producido.' },
      { type: 'heading', text: 'La trazabilidad forma parte del dato' },
      { type: 'paragraph', text: 'Una cifra sin procedencia puede parecer precisa y aun así ser imposible de evaluar. Por eso, cada conjunto de datos incorporado a la plataforma deberá conservar su institución responsable, fecha de actualización, cobertura y documentación metodológica.' },
      { type: 'callout', tone: 'information', title: 'Cómo se verá en la plataforma', text: 'Las fuentes aparecerán junto a mapas, indicadores y artículos. Cuando corresponda, también se ofrecerá acceso al recurso original o a su ficha técnica.' },
      { type: 'heading', text: 'Instituciones y responsabilidades diferentes' },
      { type: 'paragraph', text: 'Los organismos meteorológicos, hidrológicos, científicos, provinciales y municipales producen información con escalas y finalidades distintas. Presentarlas juntas exige explicar qué aporta cada una y evitar comparaciones fuera de contexto.' },
      { type: 'quote', text: 'La transparencia no es una nota al pie: es parte de la experiencia de lectura.' },
    ],
  },
]

export function useArticles() {
  const getArticleBySlug = (slug: string) => articles.find(article => article.slug === slug)
  return { articles, getArticleBySlug }
}
