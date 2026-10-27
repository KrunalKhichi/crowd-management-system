import { CHART_COLORS } from './chartTheme'

interface ViewBox {
  x?: number
  y?: number
}

/** "LIVE" tag drawn at the top of the current-time reference line. */
export function LiveMarkerLabel({ viewBox }: { viewBox?: ViewBox }) {
  const x = viewBox?.x ?? 0
  const y = viewBox?.y ?? 0
  return (
    <g aria-hidden="true">
      <rect x={x - 17} y={y - 2} width={34} height={16} rx={3} fill={CHART_COLORS.live} />
      <text
        x={x}
        y={y + 9.5}
        textAnchor="middle"
        fill="#fff"
        fontSize={9.5}
        fontWeight={700}
        letterSpacing="0.06em"
      >
        LIVE
      </text>
    </g>
  )
}
