<template>
  <section class="map-hero" aria-label="Mapa del agua">
    <img class="hero-art" src="/figma/hero.png" alt="" />
    <div class="hero-copy">
      <h1><img src="/figma/logo.png" width="345" height="298" alt="Mapa del agua" /></h1>
      <h2>Un mapa de prevención y gestión<br class="hidden sm:block" /> del riesgo hídrico.</h2>
      <p class="desktop-copy">Un lugar donde cualquier vecino puede denunciar los problemas de su barrio. Una herramienta para organizar a la comunidad y combatir las fake news con información confiable.</p>
      <p class="mobile-copy">¿Hay un problema en tu barrio que puede generar riesgo de inundación?<br />Marcalo en el mapa, subí una foto y contanos qué pasa.</p>
    </div>
  </section>
</template>

<style scoped>
.map-hero { position: relative; height: 612px; overflow: hidden; background: #f7f7f7; color: #1a2741; }
.hero-art { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: center; }
.hero-copy { position: relative; z-index: 1; width: 386px; margin-left: max(32px, calc((100% - 1082px) / 2)); padding-top: clamp(44px, 7vh, 88px); }
h1 img { width: 345px; height: 298px; object-fit: contain; }
h2 { margin-top: 12px; font-size: 20px; line-height: 28px; font-weight: 700; }
.hero-copy p { margin-top: 12px; font-size: 16px; line-height: 22px; }
.mobile-copy { display: none; }
@media (max-width: 1023px) { .map-hero { margin-top: 64px; } }
@media (min-width: 768px) and (max-width: 1100px) { .hero-art { mask-image: linear-gradient(to right, transparent, black 35%); } }
@media (max-width: 767px) {
  .map-hero { height: 433px; }
  .hero-art { opacity: .24; }
  .hero-copy { width: auto; max-width: 420px; margin: 0; padding: 54px 24px 20px; }
  h1 img { width: 230px; height: 199px; }
  .desktop-copy { display: none; }
  .mobile-copy { display: block; font-size: 14px; line-height: 20px; }
}
</style>
