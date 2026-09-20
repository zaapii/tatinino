<template>
  <section class="bg-paper px-6 py-16 text-ink sm:px-10 lg:px-14 lg:py-20" aria-labelledby="como-usar-mapa">
    <div class="mx-auto max-w-5xl">
      <p class="ui-label text-river">Guía de consulta</p>
      <h2 id="como-usar-mapa" class="mt-3 max-w-3xl text-3xl font-semibold tracking-[-.04em] sm:text-4xl">Cómo usar el Mapa del Agua de Santa Fe</h2>
      <p class="mt-5 max-w-3xl text-base leading-relaxed text-ink/68">Este mapa reúne capas territoriales, alturas de ríos y reclamos vecinales para ayudar a reconocer problemas relacionados con el agua. Cada tipo de información tiene un origen y una fecha de actualización diferentes.</p>
      <div class="mt-10 grid gap-6 md:grid-cols-3">
        <article class="rounded-2xl border border-ink/10 bg-white p-6">
          <h3 class="text-lg font-semibold">¿Cómo consulto mi barrio?</h3>
          <p class="mt-3 text-sm leading-relaxed text-ink/65">Abrí el mapa, usá el botón <strong>Capas</strong> para elegir qué querés ver y tocá un punto para conocer su información. Podés comparar las capas con los reclamos cercanos.</p>
          <a class="mt-4 inline-block text-sm font-semibold text-river underline underline-offset-4" href="#mapa-interactivo">Explorar el mapa</a>
        </article>
        <article class="rounded-2xl border border-ink/10 bg-white p-6">
          <h3 class="text-lg font-semibold">¿Cómo cargo un reclamo?</h3>
          <p class="mt-3 text-sm leading-relaxed text-ink/65">Elegí <strong>Cargá tu reclamo</strong>, marcá el lugar del problema sobre el mapa y completá el formulario. Los reportes vecinales se muestran separados de los datos oficiales.</p>
          <a class="mt-4 inline-block text-sm font-semibold text-river underline underline-offset-4" href="#mapa-interactivo">Ir al mapa</a>
        </article>
        <article class="rounded-2xl border border-ink/10 bg-white p-6">
          <h3 class="text-lg font-semibold">¿Cómo leo la altura de los ríos?</h3>
          <p class="mt-3 text-sm leading-relaxed text-ink/65">Cada estación tiene una escala propia. El nivel observado y los umbrales de alerta y evacuación se consultan en la API pública del <a href="https://alerta.ina.gob.ar/" target="_blank" rel="noopener noreferrer" class="underline underline-offset-2">Instituto Nacional del Agua</a>. Si un umbral no está publicado, se indica como no disponible.</p>
          <a class="mt-4 inline-block text-sm font-semibold text-river underline underline-offset-4" href="#metricas">Ver las alturas</a>
        </article>
      </div>
      <p class="mt-8 max-w-3xl text-xs leading-relaxed text-ink/55">Las mediciones y los reclamos ayudan a interpretar el territorio, pero no reemplazan las alertas ni las instrucciones de los organismos de emergencia. Consultá también la <NuxtLink to="/el-nino" class="underline underline-offset-2">guía sobre El Niño</NuxtLink> y los <NuxtLink to="/el-nino#documentos" class="underline underline-offset-2">documentos oficiales</NuxtLink>.</p>
    </div>
  </section>
</template>
