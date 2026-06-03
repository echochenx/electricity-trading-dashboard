<script setup>
import ChartCard from '../components/insights/ChartCard.vue'
import { chartConfigs } from '../components/insights/charts.js'

const sections = [
  { title: '供需基本面', desc: '谁在发电、谁在用电、缺口从何而来', start: 0, end: 4 },
  { title: '供需如何决定价格', desc: '缺口大小驱动电价高低，周/月/节节奏各不同', start: 4, end: 8 },
  { title: '策略基础', desc: '价差空间有多大、负荷预测能多准，决定策略的边界', start: 8, end: 10 },
]
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
      <p class="text-[14px] text-[#64748b] mt-1 ml-9">供给 → 需求 → 缺口 → 价格 → 规律 → 策略，一条线读懂广东现货市场</p>
    </div>

    <!-- 分层展示 -->
    <div v-for="sec in sections" :key="sec.title" class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <span class="text-[15px] font-semibold text-[#1a2332]">{{ sec.title }}</span>
        <span class="text-[12px] text-[#94a3b8]">— {{ sec.desc }}</span>
      </div>
      <div class="grid grid-cols-2 gap-5">
        <ChartCard
          v-for="chart in chartConfigs.slice(sec.start, sec.end)"
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
  </div>
</template>
