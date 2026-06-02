import insightsData from '../data/insights_data.json'
import backtestData from './backtest_data.json'

export const knowledgeCharts = {
  // M形负荷曲线 - 第5章第1节
  mshape: {
    height: '260px',
    option: {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1a2332', fontSize: 12 },
        formatter: (params) => {
          const p = params[0]
          return `<div style="font-weight:600">${p.axisValue}</div><div>负荷: ${(p.value / 1000).toFixed(0)} GW</div>`
        }
      },
      grid: { left: 55, right: 20, top: 20, bottom: 30 },
      xAxis: {
        type: 'category',
        data: insightsData.intraday.hours.map(h => `${h}:00`),
        axisLabel: { fontSize: 10, color: '#94a3b8', interval: 2 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'GW' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [{
        type: 'line',
        data: insightsData.intraday.load,
        smooth: true,
        lineStyle: { width: 2.5, color: '#2563eb' },
        itemStyle: { color: '#2563eb' },
        symbol: 'none',
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: '#2563eb20' },
              { offset: 1, color: '#2563eb05' },
            ]
          }
        },
        markPoint: {
          data: [
            { coord: ['11:00', insightsData.intraday.load[11]], name: '早高峰', itemStyle: { color: '#eab308' } },
            { coord: ['19:00', insightsData.intraday.load[19]], name: '晚高峰', itemStyle: { color: '#dc2626' } },
          ],
          symbol: 'circle',
          symbolSize: 8,
          label: { show: true, fontSize: 10, color: '#1a2332', position: 'top', formatter: '{b}' },
        }
      }]
    }
  },

  // 鸭脖曲线 - 第5章第2节
  duck: {
    height: '260px',
    option: {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1a2332', fontSize: 12 },
        formatter: (params) => {
          let html = `<div style="font-weight:600">${params[0].axisValue}</div>`
          params.forEach(p => {
            html += `<div>${p.seriesName}: ${(p.value / 1000).toFixed(1)} GW</div>`
          })
          return html
        }
      },
      legend: {
        data: ['总负荷', '净负荷(扣光伏)'],
        top: 0,
        textStyle: { fontSize: 10, color: '#64748b' },
        itemWidth: 14, itemHeight: 8,
      },
      grid: { left: 55, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: insightsData.intraday.hours.map(h => `${h}:00`),
        axisLabel: { fontSize: 10, color: '#94a3b8', interval: 2 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/1000).toFixed(0) + 'GW' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          name: '总负荷',
          type: 'line',
          data: insightsData.intraday.load,
          smooth: true,
          lineStyle: { width: 2, color: '#94a3b8' },
          itemStyle: { color: '#94a3b8' },
          symbol: 'none',
        },
        {
          name: '净负荷(扣光伏)',
          type: 'line',
          data: insightsData.intraday.load.map((v, i) => v - insightsData.intraday.local_power[i]),
          smooth: true,
          lineStyle: { width: 2.5, color: '#f97316' },
          itemStyle: { color: '#f97316' },
          symbol: 'none',
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#f9731615' },
                { offset: 1, color: '#f9731605' },
              ]
            }
          },
        }
      ]
    }
  },

  // DART方向准确率月度 - 第4章第2节
  dart: {
    height: '240px',
    option: {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1a2332', fontSize: 12 },
        formatter: (params) => {
          let html = `<div style="font-weight:600">${params[0].axisValue}</div>`
          params.forEach(p => {
            html += `<div style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${p.value.toFixed(1)}%</div>`
          })
          return html
        }
      },
      grid: { left: 45, right: 20, top: 24, bottom: 30 },
      xAxis: {
        type: 'category',
        data: backtestData.months,
        axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        min: 40,
        max: 80,
        axisLabel: { fontSize: 10, color: '#94a3b8', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          name: '方向准确率',
          type: 'bar',
          data: backtestData.direction_accuracy,
          itemStyle: {
            borderRadius: [3, 3, 0, 0],
            color: (params) => params.value >= 55 ? '#0d9488' : params.value >= 50 ? '#eab308' : '#dc2626',
          },
          barWidth: '50%',
        },
      ],
      markLine: {
        silent: true,
        data: [{ yAxis: 50, lineStyle: { color: '#dc262640', type: 'dashed', width: 1 }, label: { show: true, formatter: '50%', fontSize: 9, color: '#dc262680' } }],
      }
    }
  },

  // 收益构成月度 - 第4章第4节
  profit: {
    height: '280px',
    option: {
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(255,255,255,0.96)',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        textStyle: { color: '#1a2332', fontSize: 12 },
        formatter: (params) => {
          let html = `<div style="font-weight:600">${params[0].axisValue}</div>`
          params.forEach(p => {
            html += `<div style="display:flex;align-items:center;gap:4px"><span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>${p.seriesName}: ${p.value > 0 ? '+' : ''}${(p.value/10000).toFixed(1)}万</div>`
          })
          return html
        }
      },
      legend: {
        data: ['毛收益', '偏差考核', '策略净收益'],
        top: 0,
        textStyle: { fontSize: 10, color: '#64748b' },
        itemWidth: 14, itemHeight: 8,
      },
      grid: { left: 60, right: 20, top: 30, bottom: 30 },
      xAxis: {
        type: 'category',
        data: backtestData.months,
        axisLabel: { fontSize: 9, color: '#94a3b8', rotate: 30 },
        axisLine: { lineStyle: { color: '#e2e8f0' } },
      },
      yAxis: {
        type: 'value',
        axisLabel: { fontSize: 10, color: '#94a3b8', formatter: v => (v/10000).toFixed(0) + '万' },
        splitLine: { lineStyle: { color: '#f1f5f9' } },
      },
      series: [
        {
          name: '毛收益',
          type: 'bar',
          data: backtestData.gross_profit,
          itemStyle: { color: '#0d9488', borderRadius: [3, 3, 0, 0] },
          barWidth: '25%',
        },
        {
          name: '偏差考核',
          type: 'bar',
          data: backtestData.deviation_penalty.map(v => -v),
          itemStyle: { color: '#dc262680', borderRadius: [3, 3, 0, 0] },
          barWidth: '25%',
        },
        {
          name: '策略净收益',
          type: 'line',
          data: backtestData.strategy_profit,
          smooth: true,
          lineStyle: { width: 2, color: '#2563eb' },
          itemStyle: { color: '#2563eb' },
          symbol: 'circle',
          symbolSize: 4,
        }
      ]
    }
  }
}
