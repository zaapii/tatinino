<script setup lang="ts">
import { Facebook, MessageCircle } from 'lucide-vue-next'

const url = 'https://tatirestagno.com/mapa/'
const message = 'Entrá al Mapa del Agua para consultar la situación hídrica de Santa Fe y denunciar los problemas en tu barrio.'
const links = [
  { label: 'Facebook', href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, icon: Facebook },
  { label: 'X', href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(url)}`, icon: null },
  { label: 'WhatsApp', href: `https://wa.me/?text=${encodeURIComponent(`${message} ${url}`)}`, icon: MessageCircle },
]
</script>

<template>
  <div class="share-links">
    <strong>Compartí el mapa en tus redes</strong>
    <nav aria-label="Compartir el Mapa del Agua">
      <a v-for="link in links" :key="link.label" :href="link.href" target="_blank" rel="noopener noreferrer" :aria-label="`Compartir en ${link.label}`" :title="`Compartir en ${link.label}`">
        <component :is="link.icon" v-if="link.icon" :size="17" aria-hidden="true" />
        <span v-else aria-hidden="true">𝕏</span>
      </a>
    </nav>
  </div>
</template>

<style scoped>
.share-links { display: flex; flex-wrap: wrap; align-items: center; gap: 12px 16px; font-size: 12px; }
.share-links nav { display: flex; align-items: center; gap: 7px; }
.share-links a { display: grid; width: 34px; height: 34px; place-items: center; border: 1px solid currentColor; border-radius: 50%; color: inherit; opacity: .8; transition: opacity .15s, background-color .15s; }
.share-links a:hover { opacity: 1; background: #4ba6de33; }
.share-links a span { font-size: 18px; font-weight: 600; }
</style>
