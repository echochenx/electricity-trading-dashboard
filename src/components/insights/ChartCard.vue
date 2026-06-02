<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent
} from 'echarts/components'

use([
  CanvasRenderer, LineChart, BarChart, PieChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent
])

const props = defineProps({
  option: { type: Object, required: true },
  title: { type: String, default: '' },
  tag: { type: String, default: '' },
  tagColor: { type: String, default: '#2563eb' },
  description: { type: String, default: '' },
  icon: { type: String, default: '' },
  height: { type: String, default: '280px' },
})

const chartOption = computed(() => ({
  ...props.option,
  animation: true,
  animationDuration: 600,
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#1a2332', fontSize: 12 },
    ...(props.option.tooltip || {}),
  },
  grid: {
    left: 60, right: 20, top: 40, bottom: 40,
    ...(props.option.grid || {}),
  },
}))
</script>

<template>
  <div class="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden hover:shadow-md hover:border-[#cbd5e1] transition-all">
    <!-- 头部 -->
    <div class="px-5 py-3.5 border-b border-[#e2e8f0] flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <span class="w-7 h-7 rounded-lg flex items-center justify-center" :style="{ backgroundColor: tagColor + '15' }">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" :stroke="tagColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="icon"/>
          </svg>
        </span>
        <span class="text-[14px] font-semibold text-[#1a2332]">{{ title }}</span>
      </div>
      <span class="text-[11px] px-2 py-0.5 rounded-full font-medium text-white" :style="{ backgroundColor: tagColor }">{{ tag }}</span>
    </div>

    <!-- 图表 -->
    <VChart :option="chartOption" :style="{ height }" autoresize />

    <!-- 结论 -->
    <div v-if="description" class="px-5 py-3 bg-[#fafbfc] border-t border-[#e2e8f0]">
      <p class="text-[12px] text-[#64748b] leading-relaxed">{{ description }}</p>
    </div>
  </div>
</template>
