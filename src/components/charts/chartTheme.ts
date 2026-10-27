/** Chart colours mirror the CSS tokens in styles/global.css (Recharts needs literal values). */
export const CHART_COLORS = {
  occupancy: '#2a948e',
  male: '#3f8f89',
  female: '#8ccbc5',
  grid: '#eaefef',
  axis: '#6f7c7b',
  live: '#c0392b',
} as const

export const AXIS_TICK = { fill: CHART_COLORS.axis, fontSize: 12 } as const
export const AXIS_LABEL = { fill: '#4a5756', fontSize: 12 } as const
