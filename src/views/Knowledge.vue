<script setup>
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import VChart from 'vue-echarts'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, BarChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, MarkPointComponent, MarkLineComponent
} from 'echarts/components'
import { chapters } from '../data/knowledge.js'
import { knowledgeCharts } from '../data/knowledge_charts.js'
import { renderMarkdown } from '../utils/markdown.js'

use([
  CanvasRenderer, LineChart, BarChart,
  TitleComponent, TooltipComponent, GridComponent,
  LegendComponent, MarkPointComponent, MarkLineComponent
])

const activeChapter = ref(0)
const activeSection = ref(0)
const searchQuery = ref('')
const showSearch = ref(false)
const readSections = ref(new Set())

const currentChapter = computed(() => chapters[activeChapter.value])
const currentSection = computed(() => currentChapter.value.sections[activeSection.value])
const renderedContent = computed(() => renderMarkdown(currentSection.value.content))

// 当前小节内嵌的图表ID列表
const embeddedCharts = computed(() => {
  const chartIds = []
  const sectionId = currentSection.value.id
  // 根据section id决定嵌入哪些图表
  const chartMapping = {
    'mshape': ['mshape'],
    'duck': ['duck'],
    'dart': ['dart'],
    'profit': ['profit'],
  }
  if (chartMapping[sectionId]) {
    chartIds.push(...chartMapping[sectionId])
  }
  return chartIds
})

// 收益计算器
const showCalculator = computed(() => currentSection.value.id === 'profit')
const calc = ref({
  forecastLoad: 1000,
  contractPrice: 320,
  dayAheadPrice: 350,
  realtimePrice: 300,
  offsetPct: 20,
})
const calcResults = computed(() => {
  const { forecastLoad, contractPrice, dayAheadPrice, realtimePrice, offsetPct } = calc.value
  const dart = dayAheadPrice - realtimePrice
  const direction = dart > 0 ? 1 : -1
  const offset = forecastLoad * (offsetPct / 100) * direction
  const reportQty = forecastLoad + offset
  const actualLoad = forecastLoad

  // 保守（不偏移）
  const conservativeCost = actualLoad * dayAheadPrice
  const conservativeRevenue = actualLoad * contractPrice
  const conservativeNet = conservativeRevenue - conservativeCost

  // 策略（偏移）
  const dayAheadCost = reportQty * dayAheadPrice
  const realtimeDiff = (reportQty - actualLoad) * realtimePrice
  const totalCost = dayAheadCost - realtimeDiff
  const strategyRevenue = actualLoad * contractPrice
  const strategyNet = strategyRevenue - totalCost

  // 增量收益
  const incremental = strategyNet - conservativeNet

  // 偏差考核
  const deviationRate = Math.abs(actualLoad - reportQty) / actualLoad
  const penalty = deviationRate > 0.05 ? Math.abs(actualLoad - reportQty) * 50 : 0

  return {
    dart,
    direction: direction > 0 ? '日前贵(正偏移)' : '实时贵(负偏移)',
    offset: offset.toFixed(0),
    reportQty: reportQty.toFixed(0),
    conservativeNet,
    strategyNet,
    incremental,
    incrementalStr: incremental >= 0 ? `+${(incremental/10000).toFixed(2)}万` : `${(incremental/10000).toFixed(2)}万`,
    deviationRate: (deviationRate * 100).toFixed(1),
    penalty,
  }
})

// 上一节/下一节（跨章节）
const prevSection = computed(() => {
  const ch = activeChapter.value, sec = activeSection.value
  if (sec > 0) return { ch, sec: sec - 1 }
  if (ch > 0) return { ch: ch - 1, sec: chapters[ch - 1].sections.length - 1 }
  return null
})
const nextSection = computed(() => {
  const ch = activeChapter.value, sec = activeSection.value
  if (sec < chapters[ch].sections.length - 1) return { ch, sec: sec + 1 }
  if (ch < chapters.length - 1) return { ch: ch + 1, sec: 0 }
  return null
})

function goToSection(ch, sec) {
  activeChapter.value = ch
  activeSection.value = sec
  readSections.value.add(`${ch}-${sec}`)
}

// 搜索
const searchResults = computed(() => {
  if (!searchQuery.value.trim()) return []
  const q = searchQuery.value.toLowerCase()
  const results = []
  chapters.forEach((ch, ci) => {
    ch.sections.forEach((sec, si) => {
      if (sec.title.toLowerCase().includes(q) || sec.content.toLowerCase().includes(q)) {
        results.push({ ch: ci, sec: si, chapterTitle: ch.title, sectionTitle: sec.title })
      }
    })
  })
  return results.slice(0, 20)
})

// 阅读进度
const totalSections = computed(() => chapters.reduce((sum, ch) => sum + ch.sections.length, 0))
const readProgress = computed(() => Math.round(readSections.value.size / totalSections.value * 100))

// 切换章节时重置小节
watch(activeChapter, () => {
  activeSection.value = 0
  nextTick(() => {
    const el = document.getElementById('section-content')
    if (el) el.scrollTop = 0
  })
})

// 切换小节时滚动到顶部
watch(activeSection, () => {
  nextTick(() => {
    const el = document.getElementById('section-content')
    if (el) el.scrollTop = 0
  })
  readSections.value.add(`${activeChapter.value}-${activeSection.value}`)
})

// 标记初始节为已读
readSections.value.add('0-0')
</script>

<template>
  <div>
    <!-- 页面标题 -->
    <div class="mb-6">
      <h1 class="text-[22px] font-bold text-[#1a2332] flex items-center gap-2.5">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#0d9488" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"/>
        </svg>
        售电知识库
      </h1>
      <p class="text-[14px] text-[#64748b] mt-1 ml-9">从发电到用电，全链路理解电力市场与售电模式</p>
    </div>

    <div class="flex gap-8">
      <!-- 左侧导航 -->
      <div class="w-[260px] shrink-0">
        <div class="sticky top-[72px]">
          <!-- 搜索框 -->
          <div class="mb-3">
            <div class="relative">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                v-model="searchQuery"
                @focus="showSearch = true"
                @blur="setTimeout(() => showSearch = false, 200)"
                type="text"
                placeholder="搜索知识库..."
                class="w-full pl-8 pr-3 py-2 text-[13px] rounded-lg border border-[#e2e8f0] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#2563eb]/20 transition-all"
              />
            </div>
            <!-- 搜索结果 -->
            <div v-if="showSearch && searchResults.length" class="absolute z-10 w-[260px] mt-1 bg-white rounded-lg border border-[#e2e8f0] shadow-lg max-h-[300px] overflow-y-auto">
              <button
                v-for="r in searchResults"
                :key="`${r.ch}-${r.sec}`"
                @click="goToSection(r.ch, r.sec)"
                class="w-full text-left px-3 py-2.5 text-[12px] hover:bg-[#f8fafc] border-b border-[#f1f5f9] last:border-0 transition-colors"
              >
                <div class="text-[#1a2332] font-medium truncate">{{ r.sectionTitle }}</div>
                <div class="text-[#94a3b8] text-[11px]">第{{ r.ch + 1 }}章 · {{ r.chapterTitle }}</div>
              </button>
            </div>
          </div>

          <!-- 阅读进度 -->
          <div class="mb-4 px-3 py-2 bg-[#f0fdf4] rounded-lg border border-[#dcfce7]">
            <div class="flex items-center justify-between text-[11px]">
              <span class="text-[#15803d] font-medium">阅读进度</span>
              <span class="text-[#16a34a]">{{ readSections.size }}/{{ totalSections }} · {{ readProgress }}%</span>
            </div>
            <div class="mt-1.5 h-1.5 bg-[#dcfce7] rounded-full overflow-hidden">
              <div class="h-full bg-[#16a34a] rounded-full transition-all duration-300" :style="{ width: readProgress + '%' }"></div>
            </div>
          </div>

          <!-- 章节列表 -->
          <div class="space-y-1 mb-4">
            <button
              v-for="(ch, i) in chapters"
              :key="i"
              @click="activeChapter = i"
              class="w-full text-left px-3 py-2.5 rounded-lg text-[13px] transition-all flex items-center gap-2.5"
              :class="activeChapter === i
                ? 'bg-white text-[#1a2332] font-semibold shadow-sm border border-[#e2e8f0]'
                : 'text-[#64748b] hover:text-[#1a2332] hover:bg-white/60'"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" :stroke="activeChapter === i ? ch.color : '#94a3b8'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="ch.icon"/>
              </svg>
              <div class="flex-1 min-w-0">
                <div>{{ ch.title }}</div>
                <div class="text-[11px] mt-0.5" :class="activeChapter === i ? 'text-[#94a3b8]' : 'text-[#cbd5e1]'">{{ ch.sections.length }} 小节</div>
              </div>
              <svg v-if="ch.sections.every((_, si) => readSections.has(`${i}-${si}`))" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>
            </button>
          </div>

          <!-- 小节列表 -->
          <div class="border-t border-[#e2e8f0] pt-3">
            <div class="text-[11px] text-[#94a3b8] font-medium uppercase tracking-wider px-3 mb-2">本章节</div>
            <div class="space-y-0.5">
              <button
                v-for="(sec, i) in currentChapter.sections"
                :key="sec.id"
                @click="activeSection = i"
                class="w-full text-left px-3 py-2 rounded-md text-[13px] transition-colors flex items-center gap-2"
                :class="activeSection === i
                  ? 'text-[#1a2332] font-medium bg-[#eff6ff]'
                  : 'text-[#64748b] hover:text-[#1a2332] hover:bg-[#f8fafc]'"
              >
                <span class="w-5 h-5 rounded-full text-[11px] flex items-center justify-center shrink-0"
                  :class="activeSection === i ? 'bg-[#2563eb] text-white' : readSections.has(`${activeChapter}-${i}`) ? 'bg-[#dcfce7] text-[#16a34a]' : 'bg-[#f1f5f9] text-[#94a3b8]'"
                >{{ activeSection === i ? i + 1 : readSections.has(`${activeChapter}-${i}`) ? '✓' : i + 1 }}</span>
                <span class="truncate">{{ sec.title }}</span>
                <span v-if="sec.locked" class="text-[10px] text-[#cbd5e1] shrink-0">待建设</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧内容区 -->
      <div class="flex-1 min-w-0">
        <div class="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden">
          <!-- 内容头 -->
          <div class="px-8 py-4 border-b border-[#e2e8f0] bg-[#f8fafc] flex items-center gap-3">
            <span class="w-8 h-8 rounded-lg flex items-center justify-center" :style="{ backgroundColor: currentChapter.color + '15' }">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" :stroke="currentChapter.color" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path :d="currentChapter.icon"/>
              </svg>
            </span>
            <div>
              <div class="text-[12px] text-[#94a3b8]">第{{ activeChapter + 1 }}章 · 第{{ activeSection + 1 }}节</div>
              <div class="text-[16px] font-semibold text-[#1a2332]">{{ currentSection.title }}</div>
            </div>
          </div>

          <!-- Markdown内容 -->
          <div id="section-content" class="px-8 py-6 max-h-[calc(100vh-290px)] overflow-y-auto">
            <div class="prose-custom" v-html="renderedContent"></div>

            <!-- 嵌入式图表 -->
            <div v-if="embeddedCharts.length" class="mt-6 space-y-4">
              <div
                v-for="chartId in embeddedCharts"
                :key="chartId"
                class="bg-[#f8fafc] rounded-xl border border-[#e2e8f0] p-4"
              >
                <div class="flex items-center gap-2 mb-3">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                  <span class="text-[13px] font-medium text-[#1a2332]">
                    {{ chartId === 'mshape' ? '24小时负荷曲线（真实数据）' :
                       chartId === 'duck' ? '总负荷 vs 净负荷（扣光伏）' :
                       chartId === 'dart' ? '月度DART方向准确率' :
                       chartId === 'profit' ? '月度收益构成' : '' }}
                  </span>
                </div>
                <VChart :option="knowledgeCharts[chartId].option" :style="{ height: knowledgeCharts[chartId].height }" autoresize />
              </div>
            </div>

            <!-- 收益计算器 -->
            <div v-if="showCalculator" class="mt-6 bg-[#eff6ff] rounded-xl border border-[#bfdbfe] p-6">
              <div class="flex items-center gap-2 mb-4">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="8" y1="10" x2="10" y2="10"/><line x1="14" y1="10" x2="16" y2="10"/><line x1="8" y1="14" x2="10" y2="14"/><line x1="14" y1="14" x2="16" y2="14"/><line x1="8" y1="18" x2="10" y2="18"/><line x1="14" y1="18" x2="16" y2="18"/></svg>
                <span class="text-[14px] font-semibold text-[#1e3a5f]">收益计算器</span>
                <span class="text-[11px] text-[#64748b]">拖动参数查看不同场景下的策略收益</span>
              </div>

              <div class="grid grid-cols-2 gap-x-6 gap-y-3 mb-5">
                <div>
                  <label class="text-[12px] text-[#64748b] mb-1 block">预测负荷 (MW)</label>
                  <input v-model.number="calc.forecastLoad" type="number" class="w-full px-3 py-1.5 text-[13px] rounded-lg border border-[#bfdbfe] bg-white focus:outline-none focus:border-[#2563eb]" />
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

              <!-- 计算结果 -->
              <div class="bg-white rounded-lg border border-[#bfdbfe] p-4 space-y-2.5">
                <div class="flex justify-between text-[13px]">
                  <span class="text-[#64748b]">DART</span>
                  <span :class="calcResults.dart > 0 ? 'text-[#dc2626]' : 'text-[#0d9488]'">{{ calcResults.dart.toFixed(0) }} 元/MWh ({{ calcResults.direction }})</span>
                </div>
                <div class="flex justify-between text-[13px]">
                  <span class="text-[#64748b]">报量</span>
                  <span class="text-[#1a2332] font-medium">{{ calcResults.reportQty }} MW</span>
                </div>
                <div class="flex justify-between text-[13px]">
                  <span class="text-[#64748b]">偏差率</span>
                  <span :class="parseFloat(calcResults.deviationRate) > 5 ? 'text-[#dc2626]' : 'text-[#1a2332]'">{{ calcResults.deviationRate }}%{{ parseFloat(calcResults.deviationRate) > 5 ? ' (超5%阈值，有考核)' : '' }}</span>
                </div>
                <div class="border-t border-[#e2e8f0] pt-2.5 flex justify-between text-[14px]">
                  <span class="text-[#64748b] font-medium">策略增量收益</span>
                  <span class="font-bold" :class="calcResults.incremental >= 0 ? 'text-[#0d9488]' : 'text-[#dc2626]'">{{ calcResults.incrementalStr }}</span>
                </div>
              </div>
            </div>

            <!-- 上下节导航 -->
            <div class="flex items-center justify-between mt-8 pt-6 border-t border-[#e2e8f0]">
              <button
                v-if="prevSection"
                @click="goToSection(prevSection.ch, prevSection.sec)"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-[13px] text-[#64748b] hover:text-[#2563eb] hover:border-[#2563eb]/30 hover:bg-[#eff6ff] transition-all"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                <div class="text-left">
                  <div class="text-[11px] text-[#94a3b8]">上一节</div>
                  <div class="truncate max-w-[180px]">{{ chapters[prevSection.ch].sections[prevSection.sec].title }}</div>
                </div>
              </button>
              <div v-else></div>
              <button
                v-if="nextSection"
                @click="goToSection(nextSection.ch, nextSection.sec)"
                class="flex items-center gap-2 px-4 py-2.5 rounded-lg border border-[#e2e8f0] text-[13px] text-[#64748b] hover:text-[#2563eb] hover:border-[#2563eb]/30 hover:bg-[#eff6ff] transition-all"
              >
                <div class="text-right">
                  <div class="text-[11px] text-[#94a3b8]">下一节</div>
                  <div class="truncate max-w-[180px]">{{ chapters[nextSection.ch].sections[nextSection.sec].title }}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style>
.prose-custom {
  color: #1a2332;
  line-height: 1.8;
  font-size: 14px;
}

.prose-custom h2 {
  font-size: 20px;
  font-weight: 700;
  color: #1a2332;
  margin-top: 0;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #e2e8f0;
}

.prose-custom h3 {
  font-size: 16px;
  font-weight: 600;
  color: #1a2332;
  margin-top: 24px;
  margin-bottom: 12px;
}

.prose-custom p {
  margin-bottom: 12px;
}

.prose-custom ul, .prose-custom ol {
  margin-bottom: 12px;
  padding-left: 20px;
}

.prose-custom li {
  margin-bottom: 4px;
}

.prose-custom strong {
  color: #1a2332;
  font-weight: 600;
}

.prose-custom code {
  background: #f1f5f9;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  color: #dc2626;
  font-family: 'SF Mono', Monaco, 'Cascadia Code', monospace;
}

.prose-custom pre {
  background: #0f172a;
  color: #e2e8f0;
  padding: 16px 20px;
  border-radius: 10px;
  overflow-x: auto;
  margin-bottom: 16px;
  font-size: 13px;
  line-height: 1.6;
}

.prose-custom pre code {
  background: none;
  color: inherit;
  padding: 0;
  font-size: inherit;
}

.prose-custom blockquote {
  border-left: 3px solid #eab308;
  background: #fffbeb;
  padding: 12px 16px;
  margin-bottom: 16px;
  border-radius: 0 8px 8px 0;
  color: #92400e;
  font-size: 13px;
}

.prose-custom blockquote p {
  margin-bottom: 0;
}

.prose-custom table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 16px;
  font-size: 13px;
}

.prose-custom th {
  background: #f8fafc;
  font-weight: 600;
  text-align: left;
  padding: 8px 12px;
  border-bottom: 2px solid #e2e8f0;
  color: #1a2332;
}

.prose-custom td {
  padding: 8px 12px;
  border-bottom: 1px solid #f1f5f9;
  color: #475569;
}

.prose-custom tr:hover td {
  background: #f8fafc;
}

.prose-custom hr {
  border: none;
  border-top: 1px solid #e2e8f0;
  margin: 24px 0;
}
</style>
