<script setup>
import { ref, computed, watch } from 'vue'
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
  { label: '报量决策', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01' },
  { label: '日收益', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
  { label: '历史收益', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
]

// 日期选择（月份+日期二级选择）
const availableMonths = Object.keys(simData.daily).sort()
const selectedMonth = ref(availableMonths[availableMonths.length - 1] || '2026-03')
const monthDays = computed(() => {
  const md = simData.daily[selectedMonth.value]
  return md ? md.days : []
})
const selectedDay = ref(monthDays.value[monthDays.value.length - 1] || '')

watch(selectedMonth, () => {
  const days = simData.daily[selectedMonth.value]?.days || []
  selectedDay.value = days[days.length - 1] || ''
})

const dayData = computed(() => simData.hourly[selectedDay.value] || [])

// 历史收益Tab的月份选择器
const historyMonth = ref(availableMonths[availableMonths.length - 1] || '2026-03')
const monthDailyData = computed(() => simData.daily[historyMonth.value] || { days: [], strategy_profit: [], best_profit: [], gross_profit: [], deviation_penalty: [] })

function round(v, d = 2) { return Math.round(v * 10**d) / 10**d }

// === 报量决策 ===
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
    declaredLoad: round(h.reduce((s, r) => s + r.declary_load, 0)),
    actualLoad: round(h.reduce((s, r) => s + r.realtime_load, 0)),
    avgDart: round(h.reduce((s, r) => s + r.price_diff, 0) / h.length),
  }
})

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

// === 日收益 ===
const LAMBDA_0 = 0.2
const MU = 1.0

const hourlyDetails = computed(() => {
  return dayData.value.map(h => {
    const dart = h.price_diff
    const offset = h.declary_load - h.realtime_load
    const grossIncome = (h.realtime_price - h.day_ahead_price) * offset
    const devRate = Math.abs(offset) / h.realtime_load
    let devPenalty = 0
    if (h.declary_load > h.realtime_load * (1 + LAMBDA_0) && h.day_ahead_price < h.realtime_price) {
      devPenalty = (h.declary_load - h.realtime_load * (1 + LAMBDA_0)) * (h.realtime_price - h.day_ahead_price) * MU
    } else if (h.declary_load < h.realtime_load * (1 - LAMBDA_0) && h.day_ahead_price > h.realtime_price) {
      devPenalty = (h.realtime_load * (1 - LAMBDA_0) - h.declary_load) * (h.day_ahead_price - h.realtime_price) * MU
    }
    const netProfit = grossIncome - devPenalty
    return {
      period: h.period,
      dayAheadPrice: round(h.day_ahead_price),
      realtimePrice: round(h.realtime_price),
      dart: round(dart),
      declaredLoad: round(h.declary_load),
      actualLoad: round(h.realtime_load),
      offset: round(offset),
      grossIncome: round(grossIncome),
      devRate: round(devRate * 100, 1),
      devPenalty: round(devPenalty),
      netProfit: round(netProfit),
    }
  })
})

const dayProfitSummary = computed(() => {
  const details = hourlyDetails.value
  if (!details.length) return {}
  const totalGross = details.reduce((s, r) => s + r.grossIncome, 0)
  const totalPenalty = details.reduce((s, r) => s + r.devPenalty, 0)
  const totalNet = details.reduce((s, r) => s + r.netProfit, 0)
  const profitH = details.filter(r => r.netProfit > 0).length
  const lossH = details.filter(r => r.netProfit < 0).length
  return { totalGross: round(totalGross), totalPenalty: round(totalPenalty), totalNet: round(totalNet), profitH, lossH }
})

// 收益计算器
const calc = ref({
  forecastLoad: 1000,
  contractPrice: 320,
  dayAheadPrice: 350,
  realtimePrice: 300,
  offsetPct: 20,
  followDart: true, // true=跟随DART方向, false=反向偏移
})
const calcResults = computed(() => {
  const { forecastLoad, contractPrice, dayAheadPrice, realtimePrice, offsetPct, followDart } = calc.value
  const dart = dayAheadPrice - realtimePrice
  const dartDir = dart > 0 ? 1 : -1
  const direction = followDart ? dartDir : -dartDir
  const offset = forecastLoad * (offsetPct / 100) * direction
  const reportQty = forecastLoad + offset
  const actualLoad = forecastLoad
  const conservativeCost = actualLoad * dayAheadPrice
  const conservativeRevenue = actualLoad * contractPrice
  const conservativeNet = conservativeRevenue - conservativeCost
  const dayAheadCost = reportQty * dayAheadPrice
  const realtimeDiff = (reportQty - actualLoad) * realtimePrice
  const totalCost = dayAheadCost - realtimeDiff
  const strategyRevenue = actualLoad * contractPrice
  const strategyNet = strategyRevenue - totalCost
  const incremental = strategyNet - conservativeNet
  const deviationRate = Math.abs(actualLoad - reportQty) / actualLoad
  const penalty = deviationRate > LAMBDA_0 ? Math.abs(actualLoad - reportQty) * 50 : 0
  return {
    dart,
    direction: direction > 0 ? '正偏移(多报)' : '负偏移(少报)',
    offset: offset.toFixed(0),
    reportQty: reportQty.toFixed(0),
    conservativeNet,
    strategyNet,
    incremental,
    incrementalStr: incremental >= 0 ? `+${(incremental/10000).toFixed(2)}万` : `${(incremental/10000).toFixed(2)}万`,
    deviationRate: (deviationRate * 100).toFixed(1),
    penalty,
    sameAsDart: direction === dartDir,
  }
})

// 24h收益图（日收益Tab用）
const dayChartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    textStyle: { color: '#1a2332', fontSize: 12 },
    formatter: (params) => {
      const hour = params[0].axisValue
      let html = `<div style="font-weight:600;margin-bottom:4px">${hour}</div>`
      params.forEach(p => {
        let val
        if (p.seriesName === 'DART') {
          val = `${p.value.toFixed(1)} 元/MWh`
        } else {
          val = `${p.value.toFixed(0)} 元`
        }
        html += `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${val}</div>`
      })
      return html
    }
  },
  legend: { data: ['毛收益', '偏差考核', '净收益', 'DART'], top: 0, textStyle: { fontSize: 11, color: '#64748b' }, itemWidth: 14, itemHeight: 8 },
  grid: { left: 55, right: 50, top: 36, bottom: 28 },
  xAxis: { type: 'category', data: dayData.value.map(r => `${r.period}:00`), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: [
    { type: 'value', name: '元', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    { type: 'value', name: '元/MWh', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { show: false } },
  ],
  series: [
    { name: '毛收益', type: 'bar', data: hourlyDetails.value.map(r => r.grossIncome), itemStyle: { color: '#16a34a', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
    { name: '偏差考核', type: 'bar', data: hourlyDetails.value.map(r => -r.devPenalty), itemStyle: { color: '#dc2626', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
    { name: '净收益', type: 'bar', data: hourlyDetails.value.map(r => r.netProfit), itemStyle: { color: '#2563eb', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
    { name: 'DART', type: 'line', yAxisIndex: 1, data: dayData.value.map(r => r.price_diff), lineStyle: { width: 1.5, color: '#eab308' }, itemStyle: { color: '#eab308' }, symbol: 'none' },
  ],
}))

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
        let val
        if (p.seriesName === '收益达成率') {
          val = `${p.value.toFixed(1)}%`
        } else {
          val = `${(p.value/10000).toFixed(1)}万`
        }
        html += `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${val}</div>`
      })
      return html
    }
  },
  legend: { data: ['毛收益', '偏差考核', '策略净收益', '理论最优', '收益达成率'], top: 0, textStyle: { fontSize: 11, color: '#64748b' }, itemWidth: 14, itemHeight: 8 },
  grid: { left: 60, right: 50, top: 36, bottom: 32 },
  xAxis: { type: 'category', data: simData.monthly.months, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
  yAxis: [
    { type: 'value', name: '元', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/10000).toFixed(0) + '万' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    { type: 'value', name: '%', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { show: false }, min: -10, max: 70 },
  ],
  series: [
    { name: '毛收益', type: 'bar', data: simData.monthly.gross_profit, itemStyle: { color: '#16a34a', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
    { name: '偏差考核', type: 'bar', data: simData.monthly.deviation_penalty.map(v => -v), itemStyle: { color: '#dc2626', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
    { name: '策略净收益', type: 'bar', data: simData.monthly.strategy_profit, itemStyle: { color: '#2563eb', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
    { name: '理论最优', type: 'line', data: simData.monthly.best_profit, lineStyle: { width: 2, color: '#eab308', type: 'dashed' }, itemStyle: { color: '#eab308' }, symbol: 'circle', symbolSize: 5 },
    { name: '收益达成率', type: 'line', yAxisIndex: 1, data: simData.monthly.achievement_rate, lineStyle: { width: 2, color: '#7c3aed' }, itemStyle: { color: '#7c3aed' }, symbol: 'circle', symbolSize: 5, areaStyle: { color: '#7c3aed10' } },
  ],
}))

const dailyChartOption = computed(() => {
  const md = monthDailyData.value
  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(255,255,255,0.96)',
      borderColor: '#e2e8f0',
      textStyle: { color: '#1a2332', fontSize: 12 },
      formatter: (params) => {
        const day = params[0].axisValue
        let html = `<div style="font-weight:600;margin-bottom:4px">${day}</div>`
        params.forEach(p => {
          const val = `${(p.value/10000).toFixed(1)}万`
          html += `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${val}</div>`
        })
        return html
      }
    },
    legend: { data: ['毛收益', '偏差考核', '策略净收益', '理论最优'], top: 0, textStyle: { fontSize: 11, color: '#64748b' }, itemWidth: 14, itemHeight: 8 },
    grid: { left: 60, right: 20, top: 36, bottom: 28 },
    xAxis: { type: 'category', data: md.days.map(d => d.slice(5)), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
    yAxis: { type: 'value', name: '元', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/10000).toFixed(0) + '万' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
    series: [
      { name: '毛收益', type: 'bar', data: md.gross_profit, itemStyle: { color: '#16a34a', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
      { name: '偏差考核', type: 'bar', data: md.deviation_penalty.map(v => -v), itemStyle: { color: '#dc2626', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
      { name: '策略净收益', type: 'bar', data: md.strategy_profit, itemStyle: { color: '#2563eb', borderRadius: [3, 3, 0, 0] }, barWidth: '15%' },
      { name: '理论最优', type: 'line', data: md.best_profit, lineStyle: { width: 2, color: '#eab308', type: 'dashed' }, itemStyle: { color: '#eab308' }, symbol: 'none' },
    ],
  }
})

// 历史收益Tab的分析指标
const historyStats = computed(() => {
  const m = historyMonth.value
  const md = simData.daily[m]
  if (!md) return {}
  const idx = simData.monthly.months.indexOf(m)
  if (idx < 0) return {}
  return {
    achievementRate: simData.monthly.achievement_rate[idx],
    directionAccuracy: simData.monthly.direction_accuracy[idx],
    profitDays: md.strategy_profit.filter(v => v > 0).length,
    totalDays: md.days.length,
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
          class="flex items-center gap-2 px-5 py-3 text-[13px] border-b-2 transition-colors"
          :class="activeStep === i ? 'text-[#1a2332] font-semibold border-[#eab308]' : 'text-[#94a3b8] border-transparent hover:text-[#64748b]'"
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" :stroke="activeStep === i ? '#eab308' : '#cbd5e1'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path :d="step.icon"/>
          </svg>
          {{ step.label }}
        </button>
      </div>

      <div class="p-6">
        <!-- ====== 1. 报量决策 ====== -->
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

          <!-- 三层递进：预测负荷 → DART方向 → 偏移量 → 申报电量 -->
          <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-5 mb-5">
            <h4 class="text-[13px] font-semibold text-[#1a2332] mb-3">当前策略报量决策流程</h4>
            <div class="grid grid-cols-4 gap-3 mb-4">
              <!-- Step 1: 预测负荷 -->
              <div class="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#0d9488] text-white text-[10px] font-bold flex items-center justify-center">1</span>
                  <span class="text-[12px] font-semibold">预测负荷</span>
                </div>
                <p class="text-[11px] text-[#64748b]">7天/4周/1年三组历史相似日加权预测，special日期范围单独处理</p>
              </div>
              <!-- Step 2: DART方向 -->
              <div class="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#2563eb] text-white text-[10px] font-bold flex items-center justify-center">2</span>
                  <span class="text-[12px] font-semibold">DART方向判断</span>
                </div>
                <p class="text-[11px] text-[#64748b]">3个参考日投票决定偏移方向，投票越一致说明方向越可靠（当前日{{ daySummary.confidence || '--' }}%一致）</p>
              </div>
              <!-- Step 3: 偏移量 -->
              <div class="bg-white rounded-lg p-3 border border-[#e2e8f0]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#7c3aed] text-white text-[10px] font-bold flex items-center justify-center">3</span>
                  <span class="text-[12px] font-semibold">计算偏移量</span>
                </div>
                <p class="text-[11px] text-[#64748b]">分档scale(按|DART|) × 置信度lambda，确定时进取、不确定时保守</p>
              </div>
              <!-- Step 4: 申报电量 -->
              <div class="bg-white rounded-lg p-3 border border-[#eab308]/30 bg-[#fffbeb]">
                <div class="flex items-center gap-2 mb-1.5">
                  <span class="w-5 h-5 rounded-full bg-[#eab308] text-white text-[10px] font-bold flex items-center justify-center">4</span>
                  <span class="text-[12px] font-semibold text-[#92400e]">提交申报电量</span>
                </div>
                <p class="text-[11px] text-[#92400e]">申报量 = 预测负荷 + 偏移量</p>
              </div>
            </div>

            <!-- 策略说明 -->
            <div class="bg-white rounded-lg border border-[#e2e8f0] p-4">
              <div class="flex items-center gap-2 mb-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
                <span class="text-[12px] font-semibold text-[#1a2332]">当前售电公司策略说明</span>
              </div>
              <div class="text-[11px] text-[#64748b] space-y-1.5 leading-relaxed">
                <p><strong class="text-[#1a2332]">投票机制</strong>：选取7天前、4周前、1年前三个参考日，计算各自DART方向，多数一致即为预测方向，投票越一致方向越可靠，这个一致程度就是置信度。</p>
                <p><strong class="text-[#1a2332]">置信度lambda</strong>：3个参考日全投同一边=100%置信度，偏移力度最大；2:1分裂=67%，适度偏移；各投各的=低置信度，不偏移。实现"确定时进取、不确定时保守"。</p>
                <p><strong class="text-[#1a2332]">分档scale</strong>：按|DART|大小分5档(5-20元/MWh)，DART越大偏移越大，捕捉大幅价差机会。</p>
                <p class="text-[#ea580c]"><strong>核心教训</strong>：加大偏移力度(scale 1.0→1.1)在方向对时多赚一点，但方向错时多亏更多，净效果为负。优先"减少错误时亏损"而非"增加正确时盈利"。</p>
                <p class="text-[#94a3b8] italic">当前采用规则+投票机制而非机器学习，是因为售电市场仍处发展前期，历史数据量不足以支撑海量数据驱动的预测模型，规则机制是现阶段更务实的选择。</p>
              </div>
            </div>
          </div>

          <!-- 当日报量概况 -->
          <div v-if="dayData.length" class="grid grid-cols-5 gap-3 mb-5">
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">DART方向</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="DART=日前电价-实时电价，正值表示日前贵应多报，负值表示实时贵应少报">?</span>
              </div>
              <div class="text-[14px] font-bold text-[#1a2332]">{{ daySummary.dartDirection }}</div>
              <div class="text-[11px] text-[#94a3b8]">正{{ daySummary.dartPositive }}/负{{ daySummary.dartNegative }}</div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">投票一致度(置信度)</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="3个参考日投票决定偏移方向，投票越一致说明方向越可靠，一致比例即为置信度">?</span>
              </div>
              <div class="text-[18px] font-bold" :class="daySummary.confidence > 60 ? 'text-[#16a34a]' : 'text-[#ea580c]'">{{ daySummary.confidence }}%</div>
              <div class="text-[11px] text-[#94a3b8]">{{ daySummary.confidence >= 80 ? '高度一致，可大胆偏移' : daySummary.confidence >= 60 ? '方向较一致，适度偏移' : '方向分裂，谨慎为好' }}</div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">日申报电量</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="售电公司向交易中心申报的负荷量=预测负荷+偏移量，决定日前市场结算基准">?</span>
              </div>
              <div class="text-[16px] font-bold text-[#2563eb]">{{ daySummary.declaredLoad }}<span class="text-[11px] text-[#94a3b8] ml-1">MW</span></div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">日实际负荷</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="实际发生的用电负荷，与申报量的偏差决定偏差考核">?</span>
              </div>
              <div class="text-[16px] font-bold text-[#0d9488]">{{ daySummary.actualLoad }}<span class="text-[11px] text-[#94a3b8] ml-1">MW</span></div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">平均DART</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="当日24小时DART的均值，正值越大说明日前比实时贵越多，偏移空间越大">?</span>
              </div>
              <div class="text-[16px] font-bold" :class="daySummary.avgDart >= 0 ? 'text-[#dc2626]' : 'text-[#0d9488]'">{{ daySummary.avgDart }}<span class="text-[11px] text-[#94a3b8] ml-1">元</span></div>
            </div>
          </div>

          <VChart v-if="dayData.length" :option="decisionChartOption" style="height: 280px" class="mb-5" autoresize />
          <div v-else class="text-center text-[14px] text-[#94a3b8] py-10">该日期暂无数据</div>

          <!-- 收益计算器（报量时推演收益变化） -->
          <div v-if="dayData.length" class="bg-[#eff6ff] rounded-xl border border-[#bfdbfe] p-6">
            <div class="flex items-center gap-2 mb-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>
              <span class="text-[14px] font-semibold text-[#1e3a5f]">报量推演器</span>
              <span class="text-[11px] text-[#64748b]">调整偏移比例，推演不同申报量的收益变化</span>
            </div>
            <div class="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
              <div>
                <label class="text-[12px] text-[#64748b] mb-1 block">预测负荷 (MW)</label>
                <input v-model.number="calc.forecastLoad" type="number" class="w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#bfdbfe] bg-white focus:outline-none focus:border-[#2563eb]" />
              </div>
              <div>
                <label class="text-[12px] text-[#64748b] mb-1 block">偏移方向</label>
                <div class="flex gap-2">
                  <button @click="calc.followDart = true" class="flex-1 px-3 py-1.5 text-[12px] rounded-lg border transition-colors" :class="calc.followDart ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#64748b] border-[#bfdbfe]'">跟随DART</button>
                  <button @click="calc.followDart = false" class="flex-1 px-3 py-1.5 text-[12px] rounded-lg border transition-colors" :class="!calc.followDart ? 'bg-[#dc2626] text-white border-[#dc2626]' : 'bg-white text-[#64748b] border-[#bfdbfe]'">反向偏移</button>
                </div>
              </div>
              <div>
                <label class="text-[12px] text-[#64748b] mb-1 block">偏移比例 (%)</label>
                <input v-model.number="calc.offsetPct" type="range" min="0" max="30" step="1" class="w-full accent-[#2563eb]" />
                <div class="text-[12px] text-[#2563eb] text-center">{{ calc.offsetPct }}%</div>
              </div>
              <div>
                <label class="text-[12px] text-[#64748b] mb-1 block">合同电价 (元/MWh)</label>
                <input v-model.number="calc.contractPrice" type="number" class="w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#bfdbfe] bg-white focus:outline-none focus:border-[#2563eb]" />
              </div>
              <div>
                <label class="text-[12px] text-[#64748b] mb-1 block">日前电价 (元/MWh)</label>
                <input v-model.number="calc.dayAheadPrice" type="number" class="w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#bfdbfe] bg-white focus:outline-none focus:border-[#2563eb]" />
              </div>
              <div>
                <label class="text-[12px] text-[#64748b] mb-1 block">实时电价 (元/MWh)</label>
                <input v-model.number="calc.realtimePrice" type="number" class="w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#bfdbfe] bg-white focus:outline-none focus:border-[#2563eb]" />
              </div>
            </div>
            <div class="bg-white rounded-lg border border-[#bfdbfe] p-4 space-y-2.5">
              <div class="flex justify-between text-[13px]">
                <span class="text-[#64748b]">DART</span>
                <span :class="calcResults.dart > 0 ? 'text-[#dc2626]' : 'text-[#0d9488]'">{{ calcResults.dart.toFixed(0) }} 元/MWh ({{ calcResults.direction }})</span>
              </div>
              <div class="flex justify-between text-[13px]">
                <span class="text-[#64748b]">方向判断</span>
                <span :class="calcResults.sameAsDart ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ calcResults.sameAsDart ? '与DART一致，方向正确' : '与DART相反，方向错误' }}</span>
              </div>
              <div class="flex justify-between text-[13px]">
                <span class="text-[#64748b]">报量</span>
                <span class="text-[#1a2332] font-medium">{{ calcResults.reportQty }} MW</span>
              </div>
              <div class="flex justify-between text-[13px]">
                <span class="text-[#64748b]">偏差率</span>
                <span :class="parseFloat(calcResults.deviationRate) > LAMBDA_0*100 ? 'text-[#dc2626]' : 'text-[#1a2332]'">{{ calcResults.deviationRate }}%{{ parseFloat(calcResults.deviationRate) > LAMBDA_0*100 ? ' (超阈值，有考核)' : '' }}</span>
              </div>
              <div class="border-t border-[#e2e8f0] pt-2.5 flex justify-between text-[14px]">
                <span class="text-[#64748b] font-medium">策略增量收益</span>
                <span class="font-bold" :class="calcResults.incremental >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ calcResults.incrementalStr }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ====== 2. 日收益 ====== -->
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

          <template v-if="dayData.length">
            <!-- 收益公式说明 -->
            <div class="bg-[#eff6ff] rounded-xl border border-[#bfdbfe] p-5 mb-5">
              <h4 class="text-[13px] font-semibold text-[#1e3a5f] mb-2">收益计算公式</h4>
              <div class="text-[12px] text-[#1e3a5f] space-y-1.5 leading-relaxed font-mono">
                <p>毛收益 = (实时电价 - 日前电价) × (申报负荷 - 实际负荷)</p>
                <p>偏差考核 = |申报-实际|/实际 > {{ LAMBDA_0*100 }}%时，超出部分收益被回收(系数μ={{ MU }})</p>
                <p class="font-sans font-semibold text-[#2563eb]">时段净收益 = 毛收益 - 偏差考核</p>
              </div>
            </div>

            <!-- 当日汇总卡 -->
            <div class="grid grid-cols-4 gap-4 mb-5">
              <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] text-[#94a3b8]">毛收益合计</span>
                  <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="(实时电价-日前电价)×(申报负荷-实际负荷)，不考虑偏差考核的原始收益">?</span>
                </div>
                <div class="text-[18px] font-bold text-[#16a34a]">{{ dayProfitSummary.totalGross }}<span class="text-[11px] text-[#94a3b8] ml-1">元</span></div>
              </div>
              <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] text-[#94a3b8]">偏差考核合计</span>
                  <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="当|申报-实际|/实际>20%时，超出部分收益被回收，是对申报偏差的惩罚">?</span>
                </div>
                <div class="text-[18px] font-bold text-[#dc2626]">-{{ dayProfitSummary.totalPenalty }}<span class="text-[11px] text-[#94a3b8] ml-1">元</span></div>
              </div>
              <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] text-[#94a3b8]">日净收益</span>
                  <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="毛收益-偏差考核，是售电公司最终到手收益">?</span>
                </div>
                <div class="text-[22px] font-bold" :class="dayProfitSummary.totalNet >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ dayProfitSummary.totalNet }}<span class="text-[11px] text-[#94a3b8] ml-1">元</span></div>
              </div>
              <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
                <div class="flex items-center justify-between mb-1">
                  <span class="text-[11px] text-[#94a3b8]">盈亏时段</span>
                  <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="24个时段中净收益>0的为盈、<0的为亏">?</span>
                </div>
                <div class="text-[16px] font-bold">
                  <span class="text-[#16a34a]">{{ dayProfitSummary.profitH }}盈</span>
                  <span class="text-[#94a3b8] mx-1">/</span>
                  <span class="text-[#dc2626]">{{ dayProfitSummary.lossH }}亏</span>
                </div>
              </div>
            </div>

            <!-- 24h收益图 -->
            <VChart :option="dayChartOption" style="height: 240px" class="mb-5" autoresize />

            <!-- 逐时段明细表 -->
            <div class="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden mb-5">
              <div class="px-4 py-3 bg-[#f8fafc] border-b border-[#e2e8f0] flex items-center justify-between">
                <h4 class="text-[13px] font-semibold text-[#1a2332]">逐时段收益计算明细</h4>
                <span class="text-[11px] text-[#94a3b8]">偏差考核阈值 {{ LAMBDA_0*100 }}%</span>
              </div>
              <div class="overflow-x-auto max-h-[400px] overflow-y-auto">
                <table class="w-full text-[11px]">
                  <thead class="sticky top-0 bg-[#f8fafc] z-10">
                    <tr class="border-b border-[#e2e8f0]">
                      <th class="px-2 py-2 text-left text-[#94a3b8] font-medium">时段</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">日前价</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">实时价</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">DART</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">申报</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">实际</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">偏移</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">毛收益</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">偏差率</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">考核</th>
                      <th class="px-2 py-2 text-right text-[#94a3b8] font-medium">净收益</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="r in hourlyDetails" :key="r.period" class="border-b border-[#f1f5f9] hover:bg-[#f8fafc]">
                      <td class="px-2 py-1.5 text-[#1a2332] font-medium">{{ r.period }}:00</td>
                      <td class="px-2 py-1.5 text-right text-[#64748b]">{{ r.dayAheadPrice }}</td>
                      <td class="px-2 py-1.5 text-right text-[#64748b]">{{ r.realtimePrice }}</td>
                      <td class="px-2 py-1.5 text-right font-medium" :class="r.dart >= 0 ? 'text-[#dc2626]' : 'text-[#0d9488]'">{{ r.dart }}</td>
                      <td class="px-2 py-1.5 text-right text-[#2563eb]">{{ r.declaredLoad }}</td>
                      <td class="px-2 py-1.5 text-right text-[#0d9488]">{{ r.actualLoad }}</td>
                      <td class="px-2 py-1.5 text-right" :class="r.offset >= 0 ? 'text-[#2563eb]' : 'text-[#dc2626]'">{{ r.offset }}</td>
                      <td class="px-2 py-1.5 text-right" :class="r.grossIncome >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ r.grossIncome }}</td>
                      <td class="px-2 py-1.5 text-right" :class="r.devRate > LAMBDA_0*100 ? 'text-[#dc2626] font-semibold' : 'text-[#64748b]'">{{ r.devRate }}%</td>
                      <td class="px-2 py-1.5 text-right text-[#dc2626]">{{ r.devPenalty > 0 ? '-' + r.devPenalty : '0' }}</td>
                      <td class="px-2 py-1.5 text-right font-semibold" :class="r.netProfit >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ r.netProfit }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </template>
          <div v-else class="text-center text-[14px] text-[#94a3b8] py-10">该日期暂无数据</div>
        </div>

        <!-- ====== 3. 历史收益 ====== -->
        <div v-else-if="activeStep === 2">
          <!-- 月度收益分解 -->
          <div class="mb-5">
            <h4 class="text-[14px] font-semibold text-[#1a2332] mb-3">月度收益分解</h4>
            <VChart :option="monthlyChartOption" style="height: 280px" autoresize />
          </div>

          <!-- 分析指标卡 -->
          <div v-if="historyStats.achievementRate !== undefined" class="grid grid-cols-3 gap-4 mb-5">
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">{{ historyMonth }} 收益达成率</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="策略净收益÷理论最优收益，反映策略捕捉价差机会的能力">?</span>
              </div>
              <div class="text-[20px] font-bold" :class="historyStats.achievementRate >= 0 ? 'text-[#16a34a]' : 'text-[#dc2626]'">{{ historyStats.achievementRate.toFixed(1) }}%</div>
              <div class="text-[11px] text-[#94a3b8]">策略净收益 / 理论最优</div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">{{ historyMonth }} 方向准确率</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="策略预测的偏移方向与实际最优方向一致的比例，>50%说明方向判断有效">?</span>
              </div>
              <div class="text-[20px] font-bold" :class="historyStats.directionAccuracy >= 55 ? 'text-[#16a34a]' : 'text-[#ea580c]'">{{ historyStats.directionAccuracy.toFixed(1) }}%</div>
              <div class="text-[11px] text-[#94a3b8]">预测方向与最优方向一致</div>
            </div>
            <div class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4">
              <div class="flex items-center justify-between mb-1">
                <span class="text-[11px] text-[#94a3b8]">{{ historyMonth }} 盈利天数</span>
                <span class="cursor-help text-[#cbd5e1] hover:text-[#94a3b8] transition-colors" title="当月日净收益>0的天数，反映策略的胜率">?</span>
              </div>
              <div class="text-[20px] font-bold text-[#1a2332]">{{ historyStats.profitDays }}<span class="text-[12px] text-[#94a3b8]"> / {{ historyStats.totalDays }}天</span></div>
              <div class="text-[11px] text-[#94a3b8]">{{ (historyStats.profitDays / historyStats.totalDays * 100).toFixed(0) }}%天盈利</div>
            </div>
          </div>

          <!-- 月内每日收益明细 -->
          <div v-if="monthDailyData.days.length" class="mt-4">
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
