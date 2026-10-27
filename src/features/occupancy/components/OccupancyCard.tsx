import { lazy, Suspense } from 'react'
import { ChartLegend } from '@/components/charts/ChartLegend'
import { CHART_COLORS } from '@/components/charts/chartTheme'
import styles from '@/components/charts/charts.module.css'
import { DataFreshness } from '@/components/feedback/DataFreshness'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useNow } from '@/hooks/useNow'
import type { Site } from '@/types/api'
import { useOccupancySeries } from '../hooks/useOccupancySeries'

const OccupancyChart = lazy(() => import('./OccupancyChart').then((m) => ({ default: m.OccupancyChart })))

const CHART_HEIGHT = 280

export function OccupancyCard({ site, dateKey, isToday }: { site: Site; dateKey: string; isToday: boolean }) {
  const q = useOccupancySeries(site, dateKey)
  const now = useNow(60_000)

  return (
    <Card aria-labelledby="occupancy-title">
      <CardHeader
        title="Overall Occupancy"
        titleId="occupancy-title"
        actions={<ChartLegend items={[{ label: 'Occupancy', color: CHART_COLORS.occupancy }]} />}
      />
      {q.isPending ? (
        <div className={styles.body}>
          <Skeleton height={`${CHART_HEIGHT}px`} />
        </div>
      ) : q.isError && !q.data ? (
        <ErrorState
          error={q.error}
          title="Couldn’t load occupancy"
          onRetry={() => void q.refetch()}
          retrying={q.isFetching}
        />
      ) : !q.data.buckets.length ? (
        <EmptyState
          title="No occupancy recorded"
          description="There is no occupancy data for this day yet."
          minHeight={CHART_HEIGHT}
        />
      ) : (
        <div className={styles.body}>
          <Suspense fallback={<Skeleton height={`${CHART_HEIGHT}px`} />}>
            <OccupancyChart
              buckets={q.data.buckets}
              timeZone={site.timezone}
              dayStart={q.data.window.dayStart}
              dayEnd={q.data.window.dayEnd}
              liveAt={isToday ? now : null}
              height={CHART_HEIGHT}
            />
          </Suspense>
        </div>
      )}
      <div className={styles.footer}>
        <DataFreshness
          updatedAt={q.dataUpdatedAt}
          isFetching={q.isFetching && !q.isPending}
          isStale={q.isRefetchError}
        />
      </div>
    </Card>
  )
}
