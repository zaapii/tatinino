<template>
  <header class="map-hero" aria-label="Mapa del agua">
    <div class="risk-banner">
      <strong>+1700</strong>
      <span>familias en riesgo hídrico</span>
    </div>

    <div class="hero-grid" aria-hidden="true" />
    <div class="hero-map" aria-hidden="true">
      <img src="/figma/header-map.png" alt="" />
    </div>

    <div class="hero-content">
      <h1><img src="/figma/header-logo.png" width="542" height="143" alt="Mapa del agua" /></h1>
      <p class="hero-tagline">Un mapa de prevención y gestión del riesgo hídrico</p>
      <p class="hero-description">
        Un lugar donde cualquier vecino puede denunciar<br class="desktop-break" />
        los problemas de su barrio. Una herramienta para<br class="desktop-break" />
        organizar a la comunidad y combatir las fake news<br class="desktop-break" />
        con información confiable.
      </p>
    </div>

    <div class="hero-waterline" aria-hidden="true" />
  </header>
</template>

<style scoped>
.map-hero {
  position: relative;
  height: 459px;
  overflow: hidden;
  background: #f7f7f7;
  color: #1a2741;
}
.risk-banner {
  position: relative;
  z-index: 4;
  display: flex;
  height: 63px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  overflow: hidden;
  background: linear-gradient(90deg, rgba(130,17,22,.15), transparent 28%, transparent 72%, rgba(130,17,22,.15)), #c93636;
  color: #f7f7f7;
  line-height: 28px;
}
.risk-banner::after {
  position: absolute;
  inset: 0;
  background: repeating-linear-gradient(176deg, transparent 0 5px, rgba(255,255,255,.025) 5px 6px);
  content: "";
  pointer-events: none;
}
.risk-banner strong { font-size: 40px; font-weight: 600; letter-spacing: -.035em; }
.risk-banner span { font-size: 30px; font-weight: 500; }
.hero-grid {
  position: absolute;
  z-index: 2;
  inset: 0;
  background-image: linear-gradient(rgba(26,39,65,.22) 1px, transparent 1px), linear-gradient(90deg, rgba(26,39,65,.22) 1px, transparent 1px);
  background-position: center top;
  background-size: 109px 109px;
  pointer-events: none;
}
.hero-map {
  position: absolute;
  z-index: 1;
  top: 63px;
  right: 0;
  width: min(80.86vw, 1035px);
  height: 376px;
  overflow: hidden;
}
.hero-map img {
  position: absolute;
  top: -246px;
  left: 57px;
  width: 1235px;
  max-width: none;
  height: 662px;
  object-fit: cover;
}
.hero-content {
  position: relative;
  z-index: 3;
  width: 542px;
  margin-left: max(32px, calc((100% - 1102px) / 2));
  padding-top: 53px;
}
h1 { margin: 0; }
h1 img { display: block; width: 542px; height: 143px; object-fit: contain; }
.hero-tagline {
  display: flex;
  width: 537px;
  height: 42px;
  align-items: center;
  justify-content: center;
  margin: -20px 0 0 5px;
  background: #0e1928;
  color: #f7f7f7;
  font-size: 17.5px;
  font-weight: 500;
  line-height: 28px;
  text-transform: uppercase;
}
.hero-description { margin: 19px 0 0 5px; font-size: 15px; font-weight: 400; line-height: 22px; }
.hero-waterline { position: absolute; z-index: 5; right: 0; bottom: 0; left: 0; height: 20px; background: #1a2741; }
@media (max-width: 767px) {
  .map-hero { height: 430px; }
  .risk-banner { height: 54px; gap: 5px; padding: 0 16px; text-align: center; }
  .risk-banner strong { font-size: 27px; }
  .risk-banner span { font-size: 17px; }
  .hero-grid { background-size: 72px 72px; opacity: .68; }
  .hero-map { top: 54px; width: 100%; height: 356px; opacity: .34; }
  .hero-map img { top: -65px; left: 10%; width: 680px; height: auto; }
  .hero-content { width: auto; margin: 0; padding: 60px 22px 0; }
  h1 img { width: min(100%, 430px); height: auto; }
  .hero-tagline { width: min(calc(100% - 8px), 426px); height: auto; min-height: 38px; margin-top: -10px; padding: 6px 12px; font-size: 12px; line-height: 16px; text-align: center; }
  .hero-description { max-width: 410px; margin-top: 18px; font-size: 13px; line-height: 19px; }
  .desktop-break { display: none; }
}
</style>
