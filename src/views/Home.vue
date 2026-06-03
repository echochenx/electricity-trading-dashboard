<script setup>
import { computed } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent, MarkLineComponent
} from 'echarts/components'
import backtestData from '../data/backtest_data.json'

use([
  CanvasRenderer, LineChart, BarChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, DataZoomComponent, MarkLineComponent
])

const modules = [
  {
    name: '售电知识库',
    path: '/knowledge',
    description: '从发电到用电，全链路理解电力市场与售电模式',
    color: '#0d9488',
    bgColor: '#f0fdfa',
    icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    items: ['电力市场起源与改革', '交易全链路解析', '现货市场实务', '售电公司经营', '数据洞察']
  },
  {
    name: '模拟交易',
    path: '/simulation',
    description: '以某售电公司视角体验电力交易，发电、交易中心、终端用户侧待建设',
    color: '#2563eb',
    bgColor: '#eff6ff',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    items: ['今日概况', '报量决策', '收益结算', '深度分析', '历史收益', '终端用户(待建设)']
  },
  {
    name: '市场洞察',
    path: '/insights',
    description: '交互式图表与核心结论，发现市场规律与模式',
    color: '#7c3aed',
    bgColor: '#f5f3ff',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    items: ['24h供需缺口', '周/月价格模式', '节假日效应', '电源结构', '预测误差']
  }
]

// 真实统计数据
const profitMonths = backtestData.achievement_rate.filter(v => v > 0).length
const maxRate = Math.max(...backtestData.achievement_rate)
const maxRateMonth = backtestData.months[backtestData.achievement_rate.indexOf(maxRate)]
const totalProfit = backtestData.strategy_profit.reduce((a, b) => a + b, 0)

const stats = [
  { label: '数据周期', value: '15个月', sub: '2025.01 - 2026.03' },
  { label: '盈利月占比', value: `${profitMonths}/15`, sub: `${(profitMonths/15*100).toFixed(1)}%` },
  { label: '最高达成率', value: `${maxRate.toFixed(2)}%`, sub: maxRateMonth },
  { label: '累计策略收益', value: `${(totalProfit / 10000).toFixed(0)}万`, sub: '最新策略表现' },
]

// 月度关键数据表现图表配置
const chartOption = computed(() => ({
  tooltip: {
    trigger: 'axis',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderColor: '#e2e8f0',
    borderWidth: 1,
    textStyle: { color: '#1a2332', fontSize: 12 },
    formatter: (params) => {
      const month = params[0].axisValue
      let html = `<div style="font-weight:600;margin-bottom:4px">${month}</div>`
      params.forEach(p => {
        const val = p.seriesName === '策略收益' ? `${(p.value / 10000).toFixed(1)}万` : `${p.value.toFixed(2)}%`
        html += `<div style="display:flex;align-items:center;gap:6px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${val}</div>`
      })
      return html
    }
  },
  legend: {
    data: ['达成率', '方向准确率', '策略收益'],
    top: 0,
    textStyle: { fontSize: 11, color: '#64748b' },
    itemWidth: 14, itemHeight: 8,
  },
  grid: { left: 50, right: 50, top: 36, bottom: 32 },
  xAxis: {
    type: 'category',
    data: backtestData.months,
    axisLabel: { fontSize: 10, color: '#94a3b8', rotate: 30 },
    axisLine: { lineStyle: { color: '#e2e8f0' } },
  },
  yAxis: [
    {
      type: 'value',
      name: '%',
      nameTextStyle: { fontSize: 10, color: '#94a3b8' },
      axisLabel: { fontSize: 10, color: '#94a3b8' },
      splitLine: { lineStyle: { color: '#f1f5f9' } },
    },
    {
      type: 'value',
      name: '元',
      nameTextStyle: { fontSize: 10, color: '#94a3b8' },
      axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/10000).toFixed(0) + '万' },
      splitLine: { show: false },
    },
  ],
  series: [
    {
      name: '达成率',
      type: 'bar',
      data: backtestData.achievement_rate,
      itemStyle: {
        borderRadius: [4, 4, 0, 0],
        color: (params) => params.value >= 0 ? '#2563eb' : '#dc2626',
      },
      barWidth: '35%',
    },
    {
      name: '方向准确率',
      type: 'line',
      data: backtestData.direction_accuracy,
      smooth: true,
      lineStyle: { width: 2, color: '#0d9488' },
      itemStyle: { color: '#0d9488' },
      symbol: 'circle',
      symbolSize: 5,
      markLine: {
        silent: true,
        data: [{ yAxis: 50, lineStyle: { color: '#dc262640', type: 'dashed', width: 1 }, label: { show: true, formatter: '50%线', fontSize: 10, color: '#dc262680' } }],
      },
    },
    {
      name: '策略收益',
      type: 'line',
      yAxisIndex: 1,
      data: backtestData.strategy_profit,
      smooth: true,
      lineStyle: { width: 2, color: '#eab308' },
      itemStyle: { color: '#eab308' },
      symbol: 'circle',
      symbolSize: 5,
      areaStyle: { color: '#eab30810' },
    },
  ],
}))
</script>

<template>
  <div class="space-y-8">
    <!-- Hero区域 -->
    <div class="bg-gradient-to-br from-[#0f172a] via-[#1e3a5f] to-[#0f172a] rounded-2xl p-10 text-white relative overflow-hidden">
      <div class="absolute inset-0 opacity-[0.06]">
        <svg width="100%" height="100%" viewBox="0 0 800 200" preserveAspectRatio="none">
          <line x1="0" y1="60" x2="800" y2="60" stroke="white" stroke-width="1"/>
          <line x1="0" y1="140" x2="800" y2="140" stroke="white" stroke-width="1"/>
          <line x1="100" y1="60" x2="100" y2="140" stroke="white" stroke-width="1.5"/>
          <line x1="250" y1="60" x2="250" y2="140" stroke="white" stroke-width="1.5"/>
          <line x1="400" y1="60" x2="400" y2="140" stroke="white" stroke-width="1.5"/>
          <line x1="550" y1="60" x2="550" y2="140" stroke="white" stroke-width="1.5"/>
          <line x1="700" y1="60" x2="700" y2="140" stroke="white" stroke-width="1.5"/>
          <polygon points="90,60 100,40 110,60" fill="white"/>
          <polygon points="240,60 250,40 260,60" fill="white"/>
          <polygon points="390,60 400,40 410,60" fill="white"/>
          <polygon points="540,60 550,40 560,60" fill="white"/>
          <polygon points="690,60 700,40 710,60" fill="white"/>
        </svg>
      </div>

      <div class="relative">
        <div class="flex items-center gap-3 mb-4">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <h1 class="text-[28px] font-bold tracking-tight">售电交易模拟平台</h1>
        </div>
        <p class="text-[#94a3b8] text-[15px] max-w-[640px] leading-relaxed">
          学习售电知识，模拟交易决策，洞察市场规律。从知识到实践，理解广东电力现货市场的运行逻辑。
        </p>
      </div>
    </div>

    <!-- ==================== 上半部分：功能导航 ==================== -->
    <div>
      <h2 class="text-[15px] font-semibold text-[#1a2332] mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
        功能导航
      </h2>
      <div class="grid grid-cols-3 gap-6">
        <router-link
          v-for="(m, i) in modules"
          :key="m.path"
          :to="m.path"
          class="group bg-white rounded-xl border border-[#e2e8f0] p-6 no-underline hover:shadow-lg hover:border-[#cbd5e1] transition-all relative"
        >
          <!-- 步骤序号 -->
          <span class="absolute top-3 right-4 text-[11px] text-[#cbd5e1] font-medium">0{{ i + 1 }}</span>
          <div class="w-11 h-11 rounded-lg flex items-center justify-center mb-4" :style="{ backgroundColor: m.bgColor }">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" :stroke="m.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="m.icon"/>
            </svg>
          </div>
          <h3 class="text-[16px] font-semibold text-[#1a2332] mb-2 group-hover:text-[#2563eb] transition-colors">{{ m.name }}</h3>
          <p class="text-[13px] text-[#64748b] leading-relaxed mb-4">{{ m.description }}</p>
          <div class="flex flex-wrap gap-1.5">
            <span v-for="item in m.items" :key="item" class="px-2 py-0.5 rounded text-[11px] text-[#64748b] border border-[#e2e8f0]">{{ item }}</span>
          </div>
          <div class="mt-4 flex items-center gap-1 text-[12px] text-[#94a3b8] group-hover:text-[#2563eb] transition-colors">
            <span>进入</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </router-link>
      </div>
    </div>

    <!-- ==================== 下半部分：售电公司模拟交易策略数据预览 ==================== -->
    <div>
      <h2 class="text-[15px] font-semibold text-[#1a2332] mb-4 flex items-center gap-2">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
        </svg>
        售电公司模拟交易策略数据预览
      </h2>

      <!-- 指标卡 -->
      <div class="grid grid-cols-4 gap-5 mb-5">
        <div v-for="stat in stats" :key="stat.label" class="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <div class="text-[12px] text-[#94a3b8] mb-1">{{ stat.label }}</div>
          <div class="text-[22px] font-bold text-[#1a2332]">{{ stat.value }}</div>
          <div class="text-[12px] text-[#94a3b8] mt-0.5">{{ stat.sub }}</div>
        </div>
      </div>

      <!-- 月度关键数据表现 -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6 mb-5">
        <h3 class="text-[14px] font-semibold text-[#1a2332] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
          </svg>
          月度关键数据表现
        </h3>
        <VChart :option="chartOption" style="height: 300px" autoresize />
      </div>

      <!-- 决策框架 -->
      <div class="bg-white rounded-xl border border-[#e2e8f0] p-6">
        <h3 class="text-[14px] font-semibold text-[#1a2332] mb-4 flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          售电公司模拟交易策略决策框架
        </h3>
        <div class="grid grid-cols-3 gap-5">
          <div class="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#0d9488] text-white text-[11px] font-bold flex items-center justify-center">1</span>
              <span class="text-[14px] font-semibold text-[#1a2332]">参考日选取</span>
            </div>
            <p class="text-[13px] text-[#64748b] leading-relaxed">基于历史相似日匹配，结合special日期范围，选取最佳参考日期组合</p>
          </div>
          <div class="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#2563eb] text-white text-[11px] font-bold flex items-center justify-center">2</span>
              <span class="text-[14px] font-semibold text-[#1a2332]">DART方向判断</span>
            </div>
            <p class="text-[13px] text-[#64748b] leading-relaxed">多参考日投票机制决定负荷偏差方向，置信度评分衡量判断可靠性</p>
          </div>
          <div class="bg-[#f8fafc] rounded-lg border border-[#e2e8f0] p-5">
            <div class="flex items-center gap-2 mb-2">
              <span class="w-6 h-6 rounded-full bg-[#7c3aed] text-white text-[11px] font-bold flex items-center justify-center">3</span>
              <span class="text-[14px] font-semibold text-[#1a2332]">负荷预测及偏移量计算</span>
            </div>
            <p class="text-[13px] text-[#64748b] leading-relaxed">基于预测负荷叠加方向偏移量得到报量，报量与实际负荷的差异决定最终盈亏</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
