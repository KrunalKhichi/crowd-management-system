import { LIVE_STALE_AFTER_MS } from '@/constants/config'
import { useLiveOccupancy } from '@/features/occupancy/liveOccupancyStore'
import { useNow } from '@/hooks/useNow'
import { useConnectionStatus } from '@/services/socket'
import type { Site } from '@/types/api'
import { describeDwell, formatClock, formatCount, formatDwellLong } from '@/utils/format'
import { useDwell, useFootfall } from '../hooks/useMetricQueries'
import styles from './KpiPanel.module.css'
import { MetricTile } from './MetricTile'
import tileStyles from './MetricTile.module.css'
import { ComparisonTrend } from './TrendIndicator'

interface KpiPanelProps {
  site: Site
  dateKey: string
  isToday: boolean
}

const compareLabel = (isToday: boolean) => (isToday ? 'yesterday' : 'the previous day')

export function KpiPanel({ site, dateKey, isToday }: KpiPanelProps) {
  return (
    <div className={styles.grid}>
      <div className={`${styles.group} ${styles.wide}`}>
        <LiveOccupancyTile site={site} isToday={isToday} />
        <div className={styles.divider} aria-hidden="true" />
        <FootfallTile site={site} dateKey={dateKey} isToday={isToday} />
      </div>
      <div className={styles.group}>
        <DwellTile site={site} dateKey={dateKey} isToday={isToday} />
      </div>
    </div>
  )
}

/**
 * Live occupancy comes only from the socket (`live_occupancy.siteOccupancy`).
 * It has no backend history to compare against, so no trend is shown.
 */
function LiveOccupancyTile({ site, isToday }: { site: Site; isToday: boolean }) {
  const live = useLiveOccupancy(site.siteId)
  const status = useConnectionStatus()
  const now = useNow(5_000)

  if (!isToday) {
    return (
      <MetricTile
        label="Live Occupancy"
        value={formatCount(null)}
        footnote="Live occupancy is only available for today."
      />
    )
  }

  const stale = live !== null && (now - live.ts > LIVE_STALE_AFTER_MS || status !== 'connected')
  const badge =
    live && !stale ? (
      <span className={tileStyles.liveBadge}>
        <span className={tileStyles.dot} />
        Live
      </span>
    ) : live && stale ? (
      <span className={tileStyles.staleBadge}>
        <span className={tileStyles.dot} />
        Stale
      </span>
    ) : null

  const footnote = live
    ? `${stale ? 'Last update' : 'Updated'} ${formatClock(live.ts, site.timezone, true)} · ${formatCount(live.genderCount.male)} male, ${formatCount(live.genderCount.female)} female`
    : status === 'connected'
      ? 'Waiting for the first live update…'
      : 'Connecting to the live feed…'

  // Deliberately not an aria-live region: it changes every few seconds and would flood screen readers.
  return (
    <MetricTile
      label="Live Occupancy"
      value={formatCount(live?.siteOccupancy)}
      badge={badge}
      footnote={footnote}
    />
  )
}

function FootfallTile({ site, dateKey, isToday }: KpiPanelProps) {
  const { current, previous } = useFootfall(site, dateKey)
  const value = current.data?.footfall
  return (
    <MetricTile
      label={isToday ? 'Today’s Footfall' : 'Footfall'}
      value={formatCount(value)}
      loading={current.isPending}
      error={current.isError && !current.data ? current.error : undefined}
      onRetry={() => void current.refetch()}
      retrying={current.isFetching}
      trend={
        <ComparisonTrend
          current={value}
          previous={previous.data?.footfall}
          pending={previous.isPending}
          failed={previous.isError}
          comparedTo={compareLabel(isToday)}
        />
      }
      footnote={isToday ? 'Entries since midnight (site time)' : 'Entries during the day'}
    />
  )
}

function DwellTile({ site, dateKey, isToday }: KpiPanelProps) {
  const { current, previous } = useDwell(site, dateKey)
  const minutes = current.data?.avgDwellMinutes
  return (
    <MetricTile
      label="Avg Dwell Time"
      value={formatDwellLong(minutes)}
      {...(minutes != null ? { valueLabel: describeDwell(minutes) } : {})}
      loading={current.isPending}
      error={current.isError && !current.data ? current.error : undefined}
      onRetry={() => void current.refetch()}
      retrying={current.isFetching}
      trend={
        <ComparisonTrend
          current={minutes}
          previous={previous.data?.avgDwellMinutes}
          pending={previous.isPending}
          failed={previous.isError}
          comparedTo={compareLabel(isToday)}
        />
      }
      footnote={
        current.data ? `Across ${formatCount(current.data.dwellRecords)} completed visits` : undefined
      }
    />
  )
}
