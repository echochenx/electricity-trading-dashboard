<script setup>
import ChartCard from '../components/insights/ChartCard.vue'
import { chartConfigs } from '../components/insights/charts.js'
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-[22px] font-bold text-[#1a2332] flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        市场洞察
      </h1>
      <p class="text-[14px] text-[#64748b] mt-1 ml-9">基于广东现货市场15个月数据的交互式分析</p>
    </div>

    <!-- 图表网格 -->
    <div class="grid grid-cols-2 gap-5">
      <ChartCard
        v-for="chart in chartConfigs"
        :key="chart.key"
        :title="chart.title"
        :tag="chart.tag"
        :tag-color="chart.tagColor"
        :icon="chart.icon"
        :description="chart.description"
        :option="chart.option"
        :height="chart.height"
      />
    </div>
  </div>
</template>
