<script setup>
import { useRoute } from 'vue-router'
const route = useRoute()

const tabs = [
  { path: '/', label: '平台概览', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
  { path: '/knowledge', label: '售电知识库', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
  { path: '/simulation', label: '模拟交易', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
  { path: '/insights', label: '市场洞察', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
]
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- 顶部导航栏 -->
    <header class="bg-gradient-to-r from-[#0f172a] to-[#1e3a5f] sticky top-0 z-50 shadow-md">
      <div class="max-w-[1200px] mx-auto px-8 flex items-center h-14">
        <!-- Logo: 闪电 + 站名 -->
        <router-link to="/" class="flex items-center gap-2.5 text-white no-underline mr-8">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#eab308" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span class="font-semibold text-[15px] tracking-wide">售电交易模拟</span>
        </router-link>

        <!-- 导航链接 -->
        <nav class="flex items-center">
          <router-link
            v-for="tab in tabs"
            :key="tab.path"
            :to="tab.path"
            class="flex items-center gap-1.5 px-4 py-[16px] text-[13px] no-underline border-b-2 transition-colors"
            :class="route.path === tab.path
              ? 'text-white font-medium border-[#eab308]'
              : 'text-[#94a3b8] border-transparent hover:text-white hover:border-[#475569]'"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path :d="tab.icon"/>
            </svg>
            {{ tab.label }}
          </router-link>
        </nav>

        <!-- 右侧 -->
        <div class="ml-auto flex items-center gap-3">
          <span class="text-[12px] text-[#64748b]">广东现货市场 · 报量不报价</span>
        </div>
      </div>
    </header>

    <!-- 内容区 -->
    <main class="flex-1 bg-[#f8fafc]">
      <div class="max-w-[1200px] mx-auto px-8 py-8">
        <router-view />
      </div>
    </main>

    <!-- 底部 -->
    <footer class="border-t border-[#e2e8f0] py-5 bg-white">
      <div class="max-w-[1200px] mx-auto px-8 flex items-center justify-between text-[12px] text-[#94a3b8]">
        <div class="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
          </svg>
          <span>售电交易模拟策略平台</span>
        </div>
        <span>V16.4 · 广东电力现货市场</span>
      </div>
    </footer>
  </div>
</template>
