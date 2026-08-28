<script setup lang="ts">
import { BarChart, HeatmapChart, LineChart, PieChart } from 'echarts/charts'
import {
  AriaComponent,
  DataZoomComponent,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  VisualMapComponent,
} from 'echarts/components'
import { init, use, type EChartsCoreOption } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import type { AdminChartSelection } from '~/types/admin'

use([
  AriaComponent,
  BarChart,
  CanvasRenderer,
  DataZoomComponent,
  GridComponent,
  HeatmapChart,
  LegendComponent,
  LineChart,
  PieChart,
  TooltipComponent,
  VisualMapComponent,
])

const props = withDefaults(defineProps<{
  option: Record<string, unknown>
  height?: string
}>(), {
  height: '320px',
})

const emit = defineEmits<{
  select: [selection: AdminChartSelection]
}>()

const chartRoot = ref<HTMLElement | null>(null)
let chart: ReturnType<typeof init> | null = null

function renderChart() {
  if (!chart) return
  chart.setOption(props.option as EChartsCoreOption, { notMerge: true })
}

watch(() => props.option, renderChart, { deep: true })

useResizeObserver(chartRoot, () => chart?.resize())

onMounted(() => {
  if (!chartRoot.value) return

  chart = init(chartRoot.value, undefined, {
    renderer: 'canvas',
    devicePixelRatio: Math.min(window.devicePixelRatio, 2),
  })
  chart.on('click', (params) => {
    emit('select', {
      name: String(params.name ?? ''),
      seriesName: String(params.seriesName ?? ''),
      value: params.value,
    })
  })
  renderChart()
})

onBeforeUnmount(() => {
  chart?.dispose()
  chart = null
})
</script>

<template>
  <div ref="chartRoot" class="w-full" :style="{ height }" />
</template>
