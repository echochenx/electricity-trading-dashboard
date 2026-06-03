import insightsData from '../../data/insights_data.json'

const d = insightsData

const colors = {
  blue: '#2563eb',
  teal: '#0d9488',
  yellow: '#eab308',
  green: '#16a34a',
  red: '#dc2626',
  orange: '#ea580c',
  purple: '#7c3aed',
  cyan: '#0891b2',
}

export const chartConfigs = [
  // ===== 第一层：供需基本面 =====
  {
    key: 'power',
    title: '电源结构',
    tag: '供给',
    tagColor: colors.teal,
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    description: 'B类市场电源占70%为主力，A类基数电源占30%保底；西电东送约占负荷23%',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['A类电源', 'B类电源', '西电东送'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.power_structure.months, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'k' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: 'A类电源', type: 'bar', stack: 'power', data: d.power_structure.power_a, itemStyle: { color: colors.yellow }, barWidth: '50%' },
        { name: 'B类电源', type: 'bar', stack: 'power', data: d.power_structure.power_b, itemStyle: { color: colors.blue }, barWidth: '50%' },
        { name: '西电东送', type: 'bar', stack: 'power', data: d.power_structure.west_east, itemStyle: { color: colors.cyan }, barWidth: '50%' },
      ],
    },
  },
  {
    key: 'west_east',
    title: '西电东送',
    tag: '供给',
    tagColor: colors.cyan,
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    description: '西电东送占广东负荷约23%，夏季丰水期输送量最高，冬季偏低',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['输送量', '占比'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.west_east.months, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: [
        { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'k' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        { type: 'value', name: '占比%', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { show: false }, max: 40 },
      ],
      series: [
        { name: '输送量', type: 'bar', data: d.west_east.mean, itemStyle: { color: colors.cyan, borderRadius: [4, 4, 0, 0] }, barWidth: '40%' },
        { name: '占比', type: 'line', yAxisIndex: 1, data: d.west_east.ratio, lineStyle: { width: 2, color: colors.orange }, itemStyle: { color: colors.orange }, symbol: 'circle', symbolSize: 5, areaStyle: { color: colors.orange + '10' } },
      ],
    },
  },
  {
    key: 'intraday',
    title: '24h供需缺口模式',
    tag: '需求',
    tagColor: colors.blue,
    icon: 'M13 10V3L4 14h7v7l9-11h-7z',
    description: '日负荷呈M形双峰，晚高峰(18-21时)缺口最大，凌晨(3-5时)最低',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['总负荷', '本地出力', '西电东送', '缺口'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.intraday.hours.map(h => `${h}:00`), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'k' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: '总负荷', type: 'line', data: d.intraday.load, smooth: true, lineStyle: { width: 2.5, color: colors.blue }, itemStyle: { color: colors.blue }, areaStyle: { color: colors.blue + '10' }, symbol: 'none' },
        { name: '本地出力', type: 'line', data: d.intraday.local_power, smooth: true, lineStyle: { width: 1.5, color: colors.teal }, itemStyle: { color: colors.teal }, symbol: 'none' },
        { name: '西电东送', type: 'line', data: d.intraday.west_east, smooth: true, lineStyle: { width: 1.5, color: colors.orange }, itemStyle: { color: colors.orange }, symbol: 'none' },
        { name: '缺口', type: 'line', data: d.intraday.gap, smooth: true, lineStyle: { width: 2, color: colors.red, type: 'dashed' }, itemStyle: { color: colors.red }, symbol: 'none' },
      ],
    },
  },
  {
    key: 'intraday_wknd',
    title: '工作日vs周末缺口对比',
    tag: '需求',
    tagColor: colors.blue,
    icon: 'M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4',
    description: '工作日晚高峰缺口更大、更陡峭；周末负荷整体降低，但上午小高峰更明显',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['工作日负荷', '周末负荷', '工作日缺口', '周末缺口'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.intraday_wknd.hours.map(h => `${h}:00`), axisLabel: { fontSize: 10, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'k' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: '工作日负荷', type: 'line', data: d.intraday_wknd.workday_load, smooth: true, lineStyle: { width: 2.5, color: colors.blue }, itemStyle: { color: colors.blue }, symbol: 'none' },
        { name: '周末负荷', type: 'line', data: d.intraday_wknd.weekend_load, smooth: true, lineStyle: { width: 2.5, color: colors.teal, type: 'dashed' }, itemStyle: { color: colors.teal }, symbol: 'none' },
        { name: '工作日缺口', type: 'line', data: d.intraday_wknd.workday_gap, smooth: true, lineStyle: { width: 1.5, color: colors.red }, itemStyle: { color: colors.red }, symbol: 'none' },
        { name: '周末缺口', type: 'line', data: d.intraday_wknd.weekend_gap, smooth: true, lineStyle: { width: 1.5, color: colors.orange, type: 'dashed' }, itemStyle: { color: colors.orange }, symbol: 'none' },
      ],
    },
  },
  // ===== 第二层：供需如何决定价格 =====
  {
    key: 'margin',
    title: '供需裕度',
    tag: '缺口→价格',
    tagColor: colors.red,
    icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
    description: '裕度为负表示供不应求，夏季裕度最紧张；冬季裕度相对充裕',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      xAxis: { type: 'category', data: d.maintenance.months, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'k' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        {
          name: '供需裕度', type: 'bar', data: d.maintenance.margin,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params) => params.value >= 0 ? colors.green : colors.red,
          },
          barWidth: '45%',
        },
      ],
    },
  },
  {
    key: 'weekly',
    title: '周价格模式',
    tag: '价格规律',
    tagColor: colors.green,
    icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    description: '工作日电价明显高于周末，周日均价最低；日前与实时电价走势同步',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['日前电价', '实时电价', 'DART'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.weekly.days, axisLabel: { fontSize: 11, color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: [
        { type: 'value', name: '元/MWh', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        { type: 'value', name: 'DART', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { show: false } },
      ],
      series: [
        { name: '日前电价', type: 'bar', data: d.weekly.day_ahead_price, itemStyle: { color: colors.blue, borderRadius: [4, 4, 0, 0] }, barWidth: '25%' },
        { name: '实时电价', type: 'bar', data: d.weekly.realtime_price, itemStyle: { color: colors.teal, borderRadius: [4, 4, 0, 0] }, barWidth: '25%' },
        { name: 'DART', type: 'line', yAxisIndex: 1, data: d.weekly.dart, lineStyle: { width: 2, color: colors.yellow }, itemStyle: { color: colors.yellow }, symbol: 'circle', symbolSize: 6 },
      ],
    },
  },
  {
    key: 'monthly',
    title: '月/季价格模式',
    tag: '价格规律',
    tagColor: colors.orange,
    icon: 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z',
    description: '电价与负荷季节分化明显：7月负荷峰值，3月电价最高；DART全年正偏',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['日前电价', '实时电价', '负荷'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.monthly.months, axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: [
        { type: 'value', name: '元/MWh', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
        { type: 'value', name: 'MW', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'k' }, splitLine: { show: false } },
      ],
      series: [
        { name: '日前电价', type: 'line', data: d.monthly.day_ahead_price, smooth: true, lineStyle: { width: 2.5, color: colors.blue }, itemStyle: { color: colors.blue }, symbol: 'circle', symbolSize: 5 },
        { name: '实时电价', type: 'line', data: d.monthly.realtime_price, smooth: true, lineStyle: { width: 2.5, color: colors.teal }, itemStyle: { color: colors.teal }, symbol: 'circle', symbolSize: 5 },
        { name: '负荷', type: 'bar', yAxisIndex: 1, data: d.monthly.load, itemStyle: { color: colors.blue + '20' }, barWidth: '30%' },
      ],
    },
  },
  {
    key: 'holiday',
    title: '节假日效应',
    tag: '价格规律',
    tagColor: colors.purple,
    icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
    description: '春节负荷下降25%，国庆降10%；节假日电价普遍低于工作日',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      legend: { data: ['日前电价', '实时电价'], top: 5, textStyle: { fontSize: 11, color: '#64748b' } },
      xAxis: { type: 'category', data: d.holiday.types, axisLabel: { fontSize: 11, color: '#64748b' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: '元/MWh', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        { name: '日前电价', type: 'bar', data: d.holiday.day_ahead_price, itemStyle: { color: colors.blue, borderRadius: [4, 4, 0, 0] }, barWidth: '30%' },
        { name: '实时电价', type: 'bar', data: d.holiday.realtime_price, itemStyle: { color: colors.teal, borderRadius: [4, 4, 0, 0] }, barWidth: '30%' },
      ],
    },
  },
  // ===== 第三层：策略相关 =====
  {
    key: 'dart_distribution',
    title: 'DART方向与幅度分布',
    tag: '策略基础',
    tagColor: '#7c3aed',
    icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
    description: `DART正偏(日前>实时)占${d.dart_distribution.positive_pct}%，是策略偏移的核心机会；大DART(>20元/MWh)占比约${Math.round(d.dart_distribution.distribution.counts.slice(-2).reduce((a,b)=>a+b,0) / d.dart_distribution.distribution.counts.reduce((a,b)=>a+b,0) * 100)}%，对应高收益时段`,
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: d.dart_distribution.distribution.labels, axisLabel: { fontSize: 9, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: '频次', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        {
          name: 'DART幅度分布', type: 'bar',
          data: d.dart_distribution.distribution.counts,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (params) => {
              const mid = d.dart_distribution.distribution.labels.length / 2
              return params.dataIndex < mid ? colors.red : colors.green
            },
          },
          barWidth: '55%',
        },
      ],
    },
  },
  {
    key: 'error',
    title: '预测误差分布',
    tag: '策略基础',
    tagColor: '#9333ea',
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    description: '预测误差近似正态分布，大部分在±3%以内；MAPE约0.81%，极端误差概率约5%',
    height: '280px',
    option: {
      tooltip: { trigger: 'axis' },
      grid: { left: 50, right: 20, top: 20, bottom: 40 },
      xAxis: { type: 'category', data: d.forecast_error.distribution.labels, axisLabel: { fontSize: 9, color: '#94a3b8' }, axisLine: { lineStyle: { color: '#e2e8f0' } } },
      yAxis: { type: 'value', name: '频次', nameTextStyle: { fontSize: 10, color: '#94a3b8' }, axisLabel: { fontSize: 10, color: '#94a3b8' }, splitLine: { lineStyle: { color: '#f1f5f9' } } },
      series: [
        {
          name: '频次', type: 'bar', data: d.forecast_error.distribution.counts,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: (params) => {
              const colors_list = ['#dc2626', '#ea580c', '#eab308', '#84cc16', '#84cc16', '#eab308', '#ea580c', '#dc2626', '#dc2626']
              return colors_list[params.dataIndex] || '#2563eb'
            },
          },
          barWidth: '60%',
        },
      ],
    },
  },
]
