<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { chapters } from '../data/knowledge.js'
import { renderMarkdown } from '../utils/markdown.js'

const activeChapter = ref(0)
const activeSection = ref(0)

const currentChapter = computed(() => chapters[activeChapter.value])
const currentSection = computed(() => currentChapter.value.sections[activeSection.value])
const renderedContent = computed(() => renderMarkdown(currentSection.value.content))

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
})
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
      <div class="w-[240px] shrink-0">
        <div class="sticky top-[72px]">
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
              <div>
                <div>{{ ch.title }}</div>
                <div class="text-[11px] mt-0.5" :class="activeChapter === i ? 'text-[#94a3b8]' : 'text-[#cbd5e1]'">{{ ch.sections.length }} 小节</div>
              </div>
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
                  :class="activeSection === i ? 'bg-[#2563eb] text-white' : 'bg-[#f1f5f9] text-[#94a3b8]'"
                >{{ i + 1 }}</span>
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
          <div id="section-content" class="px-8 py-6 max-h-[calc(100vh-220px)] overflow-y-auto">
            <div class="prose-custom" v-html="renderedContent"></div>
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
