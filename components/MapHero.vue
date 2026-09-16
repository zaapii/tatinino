<script setup lang="ts">
const reportRequested = useState('hero-report-requested', () => false)
function goToMap(report = false) {
  if (report) reportRequested.value = true
  document.getElementById('mapa-interactivo')?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })
}
</script>

<template>
  <section class="map-hero" aria-label="Mapa del agua">
    <img class="hero-art" src="/figma/hero.png" alt="" />
    <div class="hero-copy">
      <h1><img src="/figma/logo.png" width="345" height="298" alt="Mapa del agua" /></h1>
      <h2>Un mapa de prevención y gestión<br class="hidden sm:block" /> del riesgo hídrico.</h2>
      <p>Un lugar donde cualquier vecino puede denunciar los problemas de su barrio. Una herramienta para organizar a la comunidad y combatir las fake news con información confiable.</p>
      <button @click="goToMap()">Ver mapa</button>
    </div>
    <div class="hero-report">
      <p><strong>¿Hay un problema en tu barrio que puede generar riesgo de inundación?</strong><br />Marcalo en el mapa, subí una foto y contanos qué pasa.</p>
      <button @click="goToMap(true)">Cargá tu reclamo</button>
    </div>
  </section>
</template>

<style scoped>
.map-hero { position: relative; min-height: max(100svh, 703px); overflow: hidden; background: #f7f7f7; color: #1a2741; }
.hero-art { position: absolute; right: -13%; top: 0; width: 97%; height: calc(100% - 91px); object-fit: cover; }
.hero-copy { position: relative; z-index: 1; width: 386px; margin-left: max(32px, calc((100% - 1082px) / 2)); padding-top: clamp(44px, 7vh, 88px); }
h1 img { width: 345px; height: 298px; object-fit: contain; }
h2 { margin-top: 12px; font-size: 20px; line-height: 28px; font-weight: 700; }
.hero-copy p { margin-top: 12px; font-size: 16px; line-height: 22px; }
button { border-radius: 52px; padding: 12px 18px; font-size: 12px; line-height: 14px; font-weight: 500; cursor: pointer; color: white; background: #1a2741; box-shadow: 0 4px 2px #0004; }
.hero-copy button { margin-top: 19px; }
.hero-report { position: absolute; inset-inline: 0; bottom: 0; z-index: 2; display: flex; align-items: center; justify-content: flex-end; gap: 40px; min-height: 91px; padding: 20px max(32px, calc((100% - 1172px) / 2)); background: #1a2741; color: white; }
.hero-report p { font-size: 13px; line-height: 22px; }
.hero-report button { background: #c93636; flex-shrink: 0; }
@media (min-width: 768px) and (max-width: 1100px) { .hero-art { right: -28%; mask-image: linear-gradient(to right, transparent, black 35%); } }
@media (max-width: 767px) {
  .map-hero { min-height: max(100svh, 760px); padding-bottom: 150px; }
  .hero-art { right: -52%; top: 0; width: 165%; height: calc(100% - 150px); opacity: .24; }
  .hero-copy { width: auto; max-width: 420px; margin: 0; padding: max(42px, 7vh) 24px 32px; }
  h1 img { width: 230px; height: 199px; }
  .hero-report { min-height: 150px; align-items: flex-start; flex-direction: column; justify-content: center; gap: 13px; padding: 22px 24px; }
}
</style>
