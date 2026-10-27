import { formatAxisHour, formatCount } from '@/utils/format'
import { HOUR_MS } from '@/utils/time'
import styles from './charts.module.css'

interface TooltipEntry {
  name?: string | number
  value?: unknown
  color?: string
}

interface ChartTooltipProps {
  active?: boolean
  label?: unknown
  payload?: readonly TooltipEntry[]
  timeZone: string
}

/** Tooltip for hourly buckets: "13:00 – 14:00" plus each series value. */
export function ChartTooltip({ active, label, payload, timeZone }: ChartTooltipProps) {
  if (!active || typeof label !== 'number' || !payload?.length) return null
  return (
    <div className={styles.tooltip}>
      <p className={styles.tooltipTitle}>
        {formatAxisHour(label, timeZone)} – {formatAxisHour(label + HOUR_MS, timeZone)}
      </p>
      {payload.map((entry) => (
        <p key={String(entry.name)} className={styles.tooltipRow}>
          <span className={styles.swatch} style={{ background: entry.color }} aria-hidden="true" />
          {entry.name}: <strong>{typeof entry.value === 'number' ? formatCount(entry.value) : '--'}</strong>
        </p>
      ))}
    </div>
  )
}
