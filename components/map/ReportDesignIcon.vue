<script setup lang="ts">
import { reportDesignIcons } from '~/utils/reportDesign'
defineProps<{ topic: string }>()
</script>

<template>
  <span class="report-design-icon" aria-hidden="true">
    <template v-if="reportDesignIcons[topic]">
      <img :src="`/figma/${reportDesignIcons[topic]}.svg`" alt="" class="base" />
      <img :src="`/figma/${reportDesignIcons[topic]}-glyph.svg`" alt="" class="glyph" :class="{ other: topic === 'Otro' }" />
    </template>
  </span>
</template>

<style scoped>
.report-design-icon { position: relative; display: inline-block; width: 28px; height: 28px; flex-shrink: 0; }
.base { width: 100%; height: 100%; }
.glyph { position: absolute; width: 9.3px; height: 9.3px; left: 9.4px; top: 9.5px; }
.glyph.other { width: 20.7px; height: 20.7px; left: 3.8px; top: 1.8px; }
</style>
