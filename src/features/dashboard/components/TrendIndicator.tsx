import { Icon } from '@/components/ui/Icon'
import { formatPercent, percentChange } from '@/utils/format'
import styles from './MetricTile.module.css'

interface TrendIndicatorProps {
  /** % change; null when no meaningful baseline exists. */
  change: number | null
  comparedTo: string
}

/** Direction is conveyed by icon, colour and text, never colour alone. */
export function TrendIndicator({ change, comparedTo }: TrendIndicatorProps) {
  if (change === null) return <p className={styles.trendNeutral}>No comparison data for {comparedTo}</p>
  const rounded = Math.round(change)
  if (rounded === 0) return <p className={styles.trendNeutral}>Same as {comparedTo}</p>
  const up = rounded > 0
  return (
    <p className={up ? styles.trendUp : styles.trendDown}>
      <Icon name={up ? 'trendUp' : 'trendDown'} size={16} />
      <span>
        {formatPercent(Math.abs(rounded))} {up ? 'more' : 'less'} than {comparedTo}
      </span>
    </p>
  )
}

interface ComparisonTrendProps {
  current: number | undefined
  previous: number | undefined
  /** The comparison query is still loading (it starts after the primary value). */
  pending: boolean
  failed: boolean
  comparedTo: string
}

/** Trend line for a metric whose comparison window loads separately from its value. */
export function ComparisonTrend({ current, previous, pending, failed, comparedTo }: ComparisonTrendProps) {
  if (current === undefined) return null
  if (previous === undefined) {
    if (failed) return <p className={styles.trendNeutral}>Comparison with {comparedTo} unavailable</p>
    if (pending) return <p className={styles.trendNeutral}>Comparing with {comparedTo}…</p>
    return null
  }
  return <TrendIndicator change={percentChange(current, previous)} comparedTo={comparedTo} />
}
