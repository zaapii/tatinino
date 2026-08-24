import type { Article } from '~/types/content'

const articles: Article[] = [
  {
    slug: 'como-se-construira-el-mapa-de-cotas',
    title: 'Cómo se construirá el mapa interactivo de riesgo hídrico',
    excerpt: 'Territorio, información actualizada y participación comunitaria reunidos en una infraestructura pública de prevención.',
    category: 'Proyecto',
    publishedAt: '24 AGO 2026',
    readingTime: '4 min de lectura',
    visual: 'topography',
    kicker: 'El proyecto por dentro',
    summary: [
      'La información oficial deberá tener procedencia, fecha y metodología.',
      'El mapa reunirá capas territoriales y datos que cambian con cada escenario.',
      'Los reportes comunitarios se distinguirán de la información verificada.',
    ],
    blocks: [
      { type: 'paragraph', text: 'El mapa está pensado como una puerta de entrada al conocimiento público del territorio. Su objetivo es reunir información que hoy suele encontrarse dispersa y presentarla de una forma que ayude a comprender riesgos, anticipar escenarios y tomar mejores decisiones.' },
      { type: 'heading', text: 'Una base territorial común' },
      { type: 'paragraph', text: 'Cotas, recorridos de escurrimiento, defensas, reservorios, canales, estaciones de bombeo y otros componentes del sistema deberán integrarse con su institución responsable, fecha y documentación metodológica.' },
      { type: 'callout', tone: 'information', title: 'Una regla editorial del proyecto', text: 'Cuando un dato todavía no esté disponible o no haya sido validado, la interfaz lo dirá de forma explícita. Un espacio vacío es preferible a un valor que pueda confundirse con información oficial.' },
      { type: 'heading', text: 'Información que cambia con cada escenario' },
      { type: 'paragraph', text: 'A la estructura física de la ciudad se sumarán niveles y tendencias de los ríos Paraná y Salado, precipitaciones, pronósticos y alertas. Cada publicación diferenciará datos observados, pronósticos y escenarios probables.' },
      { type: 'quote', text: 'Informar durante la incertidumbre también es una política de prevención.' },
      { type: 'heading', text: 'Participar sin confundir las fuentes' },
      { type: 'paragraph', text: 'La comunidad podrá reportar bocas de tormenta obstruidas, desagües tapados, calles anegadas y otros puntos críticos. Esos aportes deberán contar con validación y seguimiento.' },
      { type: 'list', items: ['Identificación clara de los reportes ciudadanos.', 'Estados visibles de revisión y validación.', 'Diferenciación respecto de los datos oficiales.', 'Registro público de problemas, intervenciones y respuestas.'] },
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
