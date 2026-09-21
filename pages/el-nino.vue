<script setup lang="ts">
import { ArrowUpRight } from 'lucide-vue-next'

useSeoMeta({
  title: 'El Niño en Santa Fe - Mapa del Agua',
  description: 'Qué es el fenómeno de El Niño, cómo puede influir en las lluvias de Santa Fe y qué documentos oficiales regulan la emergencia hídrica.',
  ogTitle: 'El Niño en Santa Fe - Mapa del Agua - Tati Restagno',
  ogDescription: 'Qué es El Niño y qué documentos oficiales regulan la emergencia hídrica en Santa Fe.',
  twitterTitle: 'El Niño en Santa Fe - Mapa del Agua - Tati Restagno',
  twitterDescription: 'Qué es El Niño y qué documentos oficiales regulan la emergencia hídrica en Santa Fe.',
})

useHead({
  script: [{
    type: 'application/ld+json',
    innerHTML: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'El Niño en Santa Fe - Mapa del Agua - Tati Restagno',
      headline: 'El Niño en Santa Fe',
      url: 'https://tatirestagno.com/el-nino/',
      description: 'Qué es el fenómeno de El Niño, cómo puede influir en las lluvias de Santa Fe y qué documentos oficiales regulan la emergencia hídrica.',
      isPartOf: {
        '@type': 'WebSite',
        name: 'Mapa del Agua - Tati Restagno',
        url: 'https://tatirestagno.com/mapa/',
      },
      inLanguage: 'es-AR',
    }),
  }],
})

const documents = [
  {
    title: 'Ley de emergencia hídrica niño N° 14.477',
    url: 'https://santafeciudad.gov.ar/wp-content/uploads/2026/08/Ley-de-emergencia-hidrica-nino-N%C2%B014477.pdf',
  },
  {
    title: 'Decreto Municipal Emergencia Niño',
    url: 'https://santafeciudad.gov.ar/wp-content/uploads/2026/08/Decreto-Municipal-emergencia-nino.pdf',
  },
  {
    title: 'Decreto N° 1708-2010',
    url: 'https://santafeciudad.gov.ar/wp-content/uploads/2026/08/DECRETO-1708-2010.pdf',
  },
  {
    title: 'Decreto N° 1708-2010 (Anexo)',
    url: 'https://santafeciudad.gov.ar/wp-content/uploads/2026/08/Decreto-N%C2%B0-1708-2010-Anexo.pdf',
  },
  {
    title: 'Ordenanza N° 11.512',
    url: 'https://santafeciudad.gov.ar/wp-content/uploads/2026/08/Ordenanza-N%C2%B0-11.512.pdf',
  },
]
</script>

<template>
  <div class="nino-page">
    <div class="nino-content">

      <h1>
        <span class="sr-only">
          El Niño en Santa Fe
        </span>

        <img
          src="/figma/el-nino/title.png"
          width="438"
          height="144"
          alt=""
        >
      </h1>

      <div class="nino-copy">
        <p>
          El Niño es un
          <strong>fenómeno climático natural</strong>
          que se produce cada algunos años y puede modificar los patrones
          habituales de lluvias y temperaturas en distintas regiones del mundo.
        </p>

        <p>
          En nuestra zona, puede favorecer períodos con precipitaciones más
          frecuentes o más intensas de lo habitual, aunque eso no significa que
          vaya a llover de manera permanente, ni que necesariamente se produzcan
          situaciones de emergencia.
        </p>

        <p class="nino-source">
          Fuente para comprender el fenómeno:
          <a
            href="https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/ensostuff/ensofaq.shtml"
            target="_blank"
            rel="noopener noreferrer"
          >
            Centro de Predicción Climática de NOAA
          </a>.
        </p>
      </div>

      <section
        class="nino-purpose"
        aria-labelledby="purpose-title"
      >
        <h2 id="purpose-title">
          <span class="sr-only">
            ¿Por qué existe este mapa?
          </span>

          <img
            src="/figma/el-nino/subtitle.png"
            width="298"
            height="40"
            alt=""
          >
        </h2>

        <div class="nino-copy">
          <p>
            Frente a estos escenarios,
            <strong>
              la prevención y el mantenimiento de la infraestructura hídrica
              son fundamentales.
            </strong>
          </p>

          <p>
            Por eso creamos este mapa: una
            <strong class="highlight">
              herramienta para identificar y prevenir los riesgos relacionados
              con el agua
            </strong>,
            principalmente inundaciones, desbordes de ríos y acumulaciones de
            agua por lluvias intensas, de cara a la llegada de El Niño.
          </p>

          <p>
            El mapa permite hacer visibles los problemas, ordenar los reclamos
            y generar información confiable para que los vecinos puedan
            organizarse y prevenir situaciones de riesgo.
          </p>
        </div>
      </section>

      <p class="nino-callout">
        A partir de esta información, vamos a poder coordinar acciones con el
        Gobierno Municipal, agilizar reclamos y exigir que los problemas se
        solucionen antes de que una emergencia los convierta en un riesgo para
        miles de familias.
      </p>

      <section
        id="documentos"
        class="documents"
        aria-labelledby="documents-title"
      >
        <h2
          id="documents-title"
          class="sr-only"
        >
          Documentos oficiales sobre la emergencia hídrica
        </h2>

        <a
          v-for="document in documents"
          :key="document.title"
          class="document-card"
          :href="document.url"
          target="_blank"
          rel="noopener noreferrer"
          :aria-label="`${document.title} (PDF, abre en una pestaña nueva)`"
        >
          <span
            class="document-art"
            aria-hidden="true"
          />

          <span class="document-card-bottom">
            <strong>
              {{ document.title }}
            </strong>

            <ArrowUpRight
              :size="22"
              aria-hidden="true"
            />
          </span>
        </a>
      </section>

    </div>

    <AppFooter />
  </div>
</template>

<style scoped>
.nino-page {
  min-height: 100vh;
  background: #f7f7f7;
}

.nino-content {
  width: calc(100% - clamp(44px, 10vw, 180px));
  max-width: 1320px;

  margin-left: clamp(22px, 7vw, 90px);
  margin-right: clamp(22px, 4vw, 70px);

  padding: 44px 0 68px;
}

/* -------------------------------------------------
   TITLE
------------------------------------------------- */

h1 img {
  display: block;
  width: min(438px, 100%);
  height: auto;
}

/* -------------------------------------------------
   TEXT COLUMNS
------------------------------------------------- */

.nino-copy {
  max-width: 1100px;
  margin-top: 34px;

  column-count: 2;
  column-gap: 56px;

  font-size: 20px;
  line-height: 1.4;
}

.nino-copy p {
  break-inside: avoid;
  margin: 0 0 24px;
}

.nino-copy strong {
  font-weight: 700;
}

/* -------------------------------------------------
   SOURCE
------------------------------------------------- */

.nino-source {
  font-size: 14px;
  line-height: 1.5;
  color: #56677b;
}

.nino-source a {
  color: #1c6b9d;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* -------------------------------------------------
   PURPOSE
------------------------------------------------- */

.nino-purpose {
  margin-top: 72px;
}

.nino-purpose h2 img {
  display: block;
  width: min(298px, 100%);
  height: auto;
}

.nino-purpose .nino-copy {
  margin-top: 32px;
}

/* -------------------------------------------------
   HIGHLIGHT
------------------------------------------------- */

.highlight {
  background: #4ba6de;
  color: white;

  box-decoration-break: clone;
  -webkit-box-decoration-break: clone;

  padding: 0 2px;
}

/* -------------------------------------------------
   CALLOUT
------------------------------------------------- */

.nino-callout {
  max-width: 1000px;
  margin-top: 64px;

  font-size: 26px;
  font-weight: 500;
  line-height: 1.46;
}

/* -------------------------------------------------
   DOCUMENTS
------------------------------------------------- */

.documents {
  display: grid;

  grid-template-columns:
    repeat(3, minmax(0, 1fr));

  gap: 20px;

  max-width: 1100px;
  margin-top: 72px;
}

.document-card {
  display: flex;
  min-height: 188px;

  overflow: hidden;

  flex-direction: column;

  border-radius: 9px;

  background: #95bf3f;
  color: white;

  box-shadow: 2px 3px 8px #0002;

  transition:
    transform .16s,
    box-shadow .16s;
}

.document-card:hover {
  transform: translateY(-3px);

  box-shadow:
    3px 7px 16px #0003;
}

.document-art {
  display: block;

  height: 58px;
  flex: none;

  background:
    #e7f4cb
    url('/figma/el-nino/card-texture.png')
    center 46% / cover;
}

.document-card-bottom {
  display: flex;

  min-height: 130px;

  flex: 1;

  align-items: end;
  justify-content: space-between;

  gap: 12px;

  padding: 22px 18px 18px;
}

.document-card-bottom strong {
  max-width: 240px;

  font-size: 21px;
  font-weight: 600;
  line-height: 1.22;
}

.document-card-bottom svg {
  flex: none;
}

/* -------------------------------------------------
   VERY LARGE DESKTOP
   3 text columns
------------------------------------------------- */

@media (min-width: 1450px) {
  .nino-content {
    max-width: 1400px;
  }

  .nino-copy {
    max-width: 1250px;

    column-count: 3;
    column-gap: 52px;
  }

  .nino-callout {
    max-width: 1100px;
  }

  .documents {
    max-width: 1200px;
  }
}

/* -------------------------------------------------
   TABLET / SMALL DESKTOP
------------------------------------------------- */

@media (max-width: 1000px) {
  .nino-content {
    width: auto;

    margin-left: clamp(22px, 6vw, 60px);
    margin-right: clamp(22px, 6vw, 60px);
  }

  .nino-copy {
    max-width: 820px;

    column-count: 2;
    column-gap: 40px;

    font-size: 18px;
  }

  .documents {
    grid-template-columns:
      repeat(2, minmax(0, 1fr));
  }
}

/* -------------------------------------------------
   MOBILE
------------------------------------------------- */

@media (max-width: 700px) {
  .nino-content {
    padding: 34px 0 56px;
  }

  .nino-copy {
    max-width: 620px;

    column-count: 1;

    font-size: 17px;
    line-height: 1.45;
  }

  .nino-purpose {
    margin-top: 52px;
  }

  .nino-callout {
    margin-top: 48px;

    font-size: 21px;
  }

  .documents {
    gap: 14px;
  }

  .document-card-bottom strong {
    font-size: 16px;
  }
}

/* -------------------------------------------------
   SMALL MOBILE
------------------------------------------------- */

@media (max-width: 480px) {
  .documents {
    grid-template-columns: 1fr;
  }
}
</style>
