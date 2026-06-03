<script setup>
import { ref, computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent
} from 'echarts/components'
import simData from '../data/simulation_data.json'

use([CanvasRenderer, LineChart, BarChart, TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent])

const activeStep = ref(0)
const steps = [
  { label: '今日概况', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { label: '报量决策', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { label: '收益结算', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: '深度分析', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
  { label: '历史收益', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
]

// 选择日期（月份+日期二级选择）
const availableMonths = Object.keys(simData.daily).sort()
const selectedMonth = ref(availableMonths[availableMonths.length - 1] || '2026-03')
const monthDays = computed(() => {
  const md = simData.daily[selectedMonth.value]
  return md ? md.days : []
})
const selectedDay = ref(monthDays.value[monthDays.value.length - 1] || '')

// 监听月份切换，自动选该月最后一天
import { watch } from 'vue'
watch(selectedMonth, () => {
  const days = simData.daily[selectedMonth.value]?.days || []
  selectedDay.value = days[days.length - 1] || ''
})

const dayData = computed(() => simData.hourly[selectedDay.value] || [])

// 历史收益Tab的月份选择器
const historyMonth = ref(availableMonths[availableMonths.length - 1] || '2026-03')
const monthDailyData = computed(() => simData.daily[historyMonth.value] || { days: [], strategy_profit: [], best_profit: [] })

// === 今日概况 ===
const daySummary = computed(() => {
  const h = dayData.value
  if (!h.length) return {}
  const totalProfit = h.reduce((s, r) => s + r.strategy_profit, 0)
  const avgLoad = h.reduce((s, r) => s + r.realtime_load, 0) / h.length
  const dartPositive = h.filter(r => r.price_diff > 0).length
  const dartNegative = h.filter(r => r.price_diff < 0).length
  const dartDirection = dartPositive > dartNegative ? '正偏(日前>实时)' : dartPositive < dartNegative ? '负偏(实时>日前)' : '中性'
  const confidence = Math.max(dartPositive, dartNegative) / h.length
  return {
    totalProfit: round(totalProfit),
    avgLoad: round(avgLoad),
    dartDirection,
    dartPositive,
    dartNegative,
    confidence: round(confidence * 100),
    profitHours: h.filter(r => r.strategy_profit > 0).length,
    lossHours: h.filter(r => r.strategy_profit < 0).length,
  }
})

function round(v, d = 2) { return Math.round(v * 10**d) / 10**d }

// 24h收益曲线
const dayChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    textStyle: { color: '#1a2332', fontSize: 12 },
  },
  legend: { data: ['策略收益', 'DART'], top: 0, textStyle: { fontSize: 11, color: '#64748b' } },
  grid: { left: 55, right: 20, top: 36, bottom: 28 },
  xAxis: { type: 'category', data: dayData.value.map(r => `${r.period}:00`), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: [
    { type: 'value', name: '元', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    { type: 'value', name: '元/MWh', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { show: false } },
  ],
  series: [
    { name: '策略收益', type: 'bar', data: dayData.value.map(r => r.strategy_profit), itemStyle: { borderRadius: [3, 3, 0, 0], color: p => p.value >= 0 ? '#16a34a' : '#dc2626' }, barWidth: '50%' },
    { name: 'DART', type: 'line', yAxisIndex: 1, data: dayData.value.map(r => r.price_diff), lineStyle: { width: 1.5, color: '#eab308' }, itemStyle: { color: '#eab308' }, symbol: 'none' },
  ],
}))

// === 报量决策 ===
const decisionChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    textStyle: { color: '#1a2332', fontSize: 12 },
  },
  legend: { data: ['申报负荷', '实际负荷', '偏移量'], top: 0, textStyle: { fontSize: 11, color: '#64748b' } },
  grid: { left: 55, right: 20, top: 36, bottom: 28 },
  xAxis: { type: 'category', data: dayData.value.map(r => `${r.period}:00`), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: [
    { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    { type: 'value', name: '偏移MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { show: false } },
  ],
  series: [
    { name: '申报负荷', type: 'line', data: dayData.value.map(r => r.declary_load), smooth: true, lineStyle: { width: 2, color: '#2563eb' }, itemStyle: { color: '#2563eb' }, symbol: 'none' },
    { name: '实际负荷', type: 'line', data: dayData.value.map(r => r.realtime_load), smooth: true, lineStyle: { width: 2, color: '#0d9488', type: 'dashed' }, itemStyle: { color: '#0d9488' }, symbol: 'none' },
    { name: '偏移量', type: 'bar', yAxisIndex: 1, data: dayData.value.map(r => round(r.declary_load - r.realtime_load)), itemStyle: { borderRadius: [3, 3, 0, 0], color: p => p.value >= 0 ? '#2563eb80' : '#dc262680' }, barWidth: '40%' },
  ],
}))

// === 收益结算 ===
const settlementSummary = computed(() => {
  const h = dayData.value
  if (!h.length) return {}
  const gross = h.reduce((s, r) => s + r.strategy_profit, 0)
  const profitH = h.filter(r => r.strategy_profit > 0)
  const lossH = h.filter(r => r.strategy_profit < 0)
  const maxProfit = profitH.length ? Math.max(...profitH.map(r => r.strategy_profit)) : 0
  const maxLoss = lossH.length ? Math.min(...lossH.map(r => r.strategy_profit)) : 0
  return { gross: round(gross), maxProfit: round(maxProfit), maxLoss: round(maxLoss), profitHours: profitH.length, lossHours: lossH.length }
})

// === 历史收益 ===
const monthlyChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    textStyle: { color: '#1a2332', fontSize: 12 },
    formatter: (params) => {
      const m = params[0].axisValue
      let html = `<div style="font-weight:600;margin-bottom:4px">${m}</div>`
      params.forEach(p => {
        const val = p.seriesName === '达成率' || p.seriesName === '方向准确率' ? `${p.value.toFixed(1)}%` : `${(p.value/10000).toFixed(1)}万`
        html += `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${val}</div>`
      })
      return html
    }
  },
  legend: { data: ['毛收益', '偏差考核', '策略收益'], top: 0, textStyle: { fontSize: 11, color: '#64748b' } },
  grid: { left: 60, right: 20, top: 36, bottom: 32 },
  xAxis: { type: 'category', data: simData.monthly.months, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: { type: 'value', name: '元', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/10000).toFixed(0) + '万' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
  series: [
    { name: '毛收益', type: 'bar', data: simData.monthly.gross_profit, itemStyle: { color: '#16a34a', borderRadius: [3, 3, 0, 0] }, barWidth: '20%' },
    { name: '偏差考核', type: 'bar', data: simData.monthly.deviation_penalty.map(v => -v), itemStyle: { color: '#dc2626', borderRadius: [3, 3, 0, 0] }, barWidth: '20%' },
    { name: '策略收益', type: 'bar', data: simData.monthly.strategy_profit, itemStyle: { color: '#2563eb', borderRadius: [3, 3, 0, 0] }, barWidth: '20%' },
  ],
}))

// 月度日收益曲线
const dailyChartOption = computed(() => {
  const md = monthDailyData.value
  return {
    tooltip: { trigger: 'axis', backgroundColor: 'rgba(255,255,255,0.96)', borderColor: '#e2e8f0', textStyle: { color: '#1a2332', fontSize: 12 } },
    legend: { data: ['策略收益', '理论最优'], top: 0, textStyle: { fontSize: 11, color: '#64748b' } },
    grid: { left: 60, right: 20, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: md.days.map(d => d.slice(5)), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', name: '元', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: '策略收益', type: 'bar', data: md.strategy_profit, itemStyle: { borderRadius: [3, 3, 0, 0], color: p => p.value >= 0 ? '#2563eb' : '#dc2626' }, barWidth: '45%' },
      { name: '理论最优', type: 'line', data: md.best_profit, lineStyle: { width: 1.5, color: '#eab308', type: 'dashed' }, itemStyle: { color: '#eab308' }, symbol: 'none' },
    ],
  }
})
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-[22px] font-bold text-[#1a2332] flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
        </svg>
        模拟交易
      </h1>
      <p class="text-[14px] text-[#64748b] mt-1 ml-9">以某售电公司视角体验电力交易，发电、交易中心、终端用户侧待建设</p>
    </div>

    <!-- 角色标签 -->
    <div class="flex items-center gap-2 mb-5">
      <span class="px-4 py-2 text-[13px] rounded-lg bg-[#eff6ff] text-[#2563eb] font-semibold border border-[#2563eb]/20">★ 售电公司</span>
      <span class="px-4 py-2 text-[13px] rounded-lg bg-white text-[#cbd5e1] border border-[#e2e8f0]">🔒 发电侧</span>
      <span class="px-4 py-2 text-[13px] rounded-lg bg-white text-[#cbd5e1] border border-[#e2e8f0]">🔒 交易中心</span>
      <span class="px-4 py-2 text-[13px] rounded-lg bg-white text-[#cbd5e1] border border-[#e2e8f0]">🔒 终端用户</span>
    </div>

    <!-- 子步骤导航 -->
    <div class="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
      <div class="flex items-center border-b border-[#e2e8f0] px-2">
        <button v-for="(step, i) in steps" :key="i" @click="activeStep = i"
          class="flex items-center gap-2 px-4 py-3 text-[13px] border-b-2 transition-colors"
          :class="activeStep === i ? 'text-[#1a2332] font-semibold border-[#eab308]' : 'text-[#94a3b8] border-transparent hover:text-[#64748b]'"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" :stroke="activeStep === i ? '#eab308' : '#cbd5e1'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="step.icon"/>
          </svg>
          {{ step.label }}
        </button>
      </div>

      <div class="p-6">
        <!-- ====== 1. 今日概况 ====== -->
        <div v-if="activeStep === 0">
          <!-- 日期选择 -->
          <div class="flex items-center gap-3 mb-5">
            <label class="text-[13px] text-[#64748b]">选择日期</label>
            <select v-model="selectedMonth" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="m in availableMonths" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-model="selectedDay" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="d in monthDays" :key="d" :value="d">{{ d.slice(5) }}</option>
            </select>
          </div>

          <!-- 指标卡 -->
          <div class="grid grid-cols-4 gap-4 mb-5">
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">当日策略收益</div>
              <div class="text-[22px] font-bold" :class="daySummary.totalProfit >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ daySummary.totalProfit || '--' }}<span class="text-[12px] text-[#94a3b8] ml-1">元</span></div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">DART方向</div>
              <div class="text-[15px] font-bold text-[#1a2332]">{{ daySummary.dartDirection || '--' }}</div>
              <div class="text-[12px] text-[#94a3b8]">正{{ daySummary.dartPositive }} / 负{{ daySummary.dartNegative }}</div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">平均负荷</div>
              <div class="text-[22px] font-bold text-[#1a2332]">{{ daySummary.avgLoad || '--' }}<span class="text-[12px] text-[#94a3b8] ml-1">MW</span></div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">盈亏时段</div>
              <div class="text-[15px] font-bold">
                <span class="text-[#16a34a]">{{ daySummary.profitHours }}盈</span>
                <span class="text-[#94a3b8] mx-1">/</span>
                <span class="text-[#dc2626]">{{ daySummary.lossHours }}亏</span>
              </div>
            </div>
          </div>

          <!-- 24h收益图 -->
          <VChart v-if="dayData.length" :option="dayChartOption" style="height: 260px" autoresize />
          <div v-else class="text-center text-[14px] text-[#94a3b8] py-10">该日期暂无数据</div>
        </div>

        <!-- ====== 2. 报量决策 ====== -->
        <div v-else-if="activeStep === 1">
          <div class="flex items-center gap-3 mb-5">
            <label class="text-[13px] text-[#64748b]">选择日期</label>
            <select v-model="selectedMonth" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="m in availableMonths" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-model="selectedDay" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="d in monthDays" :key="d" :value="d">{{ d.slice(5) }}</option>
            </select>
          </div>

          <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-5 mb-5">
            <h4 class="text-[13px] font-semibold text-[#1a2332] mb-3">三层决策架构</h4>
            <div class="grid grid-cols-3 gap-4">
              <div class="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#0d9488] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <span class="text-[12px] font-semibold">参考日选取</span>
                </div>
                <p class="text-[11px] text-[#64748b]">相似日 + special日期范围</p>
              </div>
              <div class="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <span class="text-[12px] font-semibold">DART方向</span>
                </div>
                <p class="text-[11px] text-[#64748b]">投票机制 · 置信度{{ daySummary.confidence || '--' }}%</p>
              </div>
              <div class="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span class="text-[12px] font-semibold">偏移量</span>
                </div>
                <p class="text-[11px] text-[#64748b]">分档scale + lambda叠加</p>
              </div>
            </div>
          </div>

          <VChart v-if="dayData.length" :option="decisionChartOption" style="height: 280px" autoresize />
          <div v-else class="text-center text-[14px] text-[#94a3b8] py-10">选择日期查看报量决策详情</div>
        </div>

        <!-- ====== 3. 收益结算 ====== -->
        <div v-else-if="activeStep === 2">
          <div class="flex items-center gap-3 mb-5">
            <label class="text-[13px] text-[#64748b]">选择日期</label>
            <select v-model="selectedMonth" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="m in availableMonths" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-model="selectedDay" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="d in monthDays" :key="d" :value="d">{{ d.slice(5) }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4 max-w-[560px] mb-5">
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">当日净收益</div>
              <div class="text-[22px] font-bold" :class="settlementSummary.gross >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ settlementSummary.gross || '--' }}<span class="text-[12px] text-[#94a3b8] ml-1">元</span></div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">盈亏时段</div>
              <div class="text-[18px] font-bold">
                <span class="text-[#16a34a]">{{ settlementSummary.profitHours }}盈</span>
                <span class="text-[#94a3b8] mx-1">/</span>
                <span class="text-[#dc2626]">{{ settlementSummary.lossHours }}亏</span>
              </div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">最大盈利时段</div>
              <div class="text-[18px] font-bold text-[#16a34a]">{{ settlementSummary.maxProfit || '--' }}<span class="text-[12px] text-[#94a3b8] ml-1">元</span></div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[12px] text-[#94a3b8] mb-1">最大亏损时段</div>
              <div class="text-[18px] font-bold text-[#dc2626]">{{ settlementSummary.maxLoss || '--' }}<span class="text-[12px] text-[#94a3b8] ml-1">元</span></div>
            </div>
          </div>

          <VChart v-if="dayData.length" :option="dayChartOption" style="height: 260px" autoresize />
        </div>

        <!-- ====== 4. 深度分析 ====== -->
        <div v-else-if="activeStep === 3">
          <div class="flex items-center gap-3 mb-5">
            <label class="text-[13px] text-[#64748b]">选择日期</label>
            <select v-model="selectedMonth" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="m in availableMonths" :key="m" :value="m">{{ m }}</option>
            </select>
            <select v-model="selectedDay" class="px-3 py-1.5 text-[13px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
              <option v-for="d in monthDays" :key="d" :value="d">{{ d.slice(5) }}</option>
            </select>
          </div>

          <!-- DART vs 收益散点分析 -->
          <div class="grid grid-cols-2 gap-4 mb-5" v-if="dayData.length">
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[13px] font-semibold text-[#1a2332] mb-2">DART方向一致性</div>
              <div class="text-[12px] text-[#64748b] leading-relaxed">
                当日{{ daySummary.dartPositive }}个时段DART为正，{{ daySummary.dartNegative }}个为负，
                方向<span class="font-semibold" :class="daySummary.confidence > 60 ? 'text-[#16a34a]' : 'text-[#ea580c]'">{{ daySummary.confidence > 50 ? '一致' : '分裂' }}</span>，
                置信度{{ daySummary.confidence }}%
              </div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="text-[13px] font-semibold text-[#1a2332] mb-2">偏移策略效果</div>
              <div class="text-[12px] text-[#64748b] leading-relaxed">
                盈利时段{{ daySummary.profitHours }}个，亏损{{ daySummary.lossHours }}个，
                胜率{{ (daySummary.profitHours / (daySummary.profitHours + daySummary.lossHours) * 100).toFixed(0) || '--' }}%
              </div>
            </div>
          </div>

          <VChart v-if="dayData.length" :option="decisionChartOption" style="height: 260px" autoresize />
          <div v-else class="text-center text-[14px] text-[#94a3b8] py-10">选择日期查看深度分析</div>
        </div>

        <!-- ====== 5. 历史收益 ====== -->
        <div v-else-if="activeStep === 4">
          <div class="mb-5">
            <h4 class="text-[14px] font-semibold text-[#1a2332] mb-3">15个月月度收益分解</h4>
            <VChart :option="monthlyChartOption" style="height: 280px" autoresize />
          </div>

          <div v-if="monthDailyData.days.length" class="mt-6">
            <div class="flex items-center justify-between mb-3">
              <h4 class="text-[14px] font-semibold text-[#1a2332]">月度日收益明细</h4>
              <select v-model="historyMonth" class="px-3 py-1 text-[12px] border border-[#e2e8f0] rounded-lg bg-white text-[#1a2332]">
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m }}</option>
              </select>
            </div>
            <VChart :option="dailyChartOption" style="height: 220px" autoresize />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
