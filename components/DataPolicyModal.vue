<script setup lang="ts">
const open = defineModel<boolean>({ default: false })
const closeButton = shallowRef<HTMLButtonElement | null>(null)

watch(open, async (value) => {
  if (!import.meta.client) return
  document.body.style.overflow = value ? 'hidden' : ''
  if (value) {
    await nextTick()
    closeButton.value?.focus()
  }
})

onBeforeUnmount(() => {
  if (import.meta.client) document.body.style.overflow = ''
})
</script>

<template>
  <Teleport to="body">
    <Transition enter-active-class="transition duration-150" enter-from-class="opacity-0" leave-active-class="transition duration-100" leave-to-class="opacity-0">
      <div v-if="open" class="policy-backdrop" role="presentation" @click.self="open = false" @keydown.esc.prevent="open = false">
        <section class="data-policy" role="dialog" aria-modal="true" aria-labelledby="data-policy-title">
          <button ref="closeButton" class="policy-close" aria-label="Cerrar política de datos" @click="open = false"><img src="/figma/close.svg" width="21" height="21" alt="" /></button>
          <h2 id="data-policy-title">Política de datos</h2>
          <p>Alturas de ríos: datos del Instituto Nacional del Agua (<a href="https://www.ina.gob.ar/" target="_blank" rel="noopener noreferrer">INA</a>).</p>
          <p>Cuencas, subcuencas y estaciones de bombeo: <a href="https://santafeciudad.gov.ar/geo-portal/" target="_blank" rel="noopener noreferrer">GeoPortal</a> de la Municipalidad de Santa Fe.</p>
          <p>Barrios populares: Registro Nacional de Barrios Populares (<a href="https://www.argentina.gob.ar/node/187337" target="_blank" rel="noopener noreferrer">ReNaBaP</a>).</p>
          <p><strong>¿Detectaste un error?</strong> Contactanos para revisarlo y corregirlo.</p>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.policy-backdrop { position: fixed; inset: 0; z-index: 100; display: grid; place-items: center; padding: 16px; background: #000b; }
.data-policy { position: relative; width: 356px; max-width: 100%; max-height: calc(100dvh - 32px); overflow: auto; border-radius: 12px; background: #f7f7f7; color: #1a2741; padding: 36px 24px 28px; box-shadow: 0 18px 55px #0006; }
h2 { font-size: 16px; line-height: 22px; font-weight: 700; }
p { font-size: 14px; line-height: 22px; font-weight: 500; }
p + p { margin-top: 22px; }
a { color: #4ba6de; text-decoration: underline; text-underline-offset: 2px; }
.policy-close { position: absolute; top: 12px; right: 12px; display: grid; place-items: center; width: 28px; height: 28px; cursor: pointer; }
</style>
