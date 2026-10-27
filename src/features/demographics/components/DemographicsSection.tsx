import { lazy, Suspense, type ReactNode } from 'react'
import { ChartLegend } from '@/components/charts/ChartLegend'
import { CHART_COLORS } from '@/components/charts/chartTheme'
import chartStyles from '@/components/charts/charts.module.css'
import { DataFreshness } from '@/components/feedback/DataFreshness'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Card, CardHeader } from '@/components/ui/Card'
import { Skeleton } from '@/components/ui/Skeleton'
import { useNow } from '@/hooks/useNow'
import type { Site } from '@/types/api'
import { formatAxisHour } from '@/utils/format'
import { HOUR_MS } from '@/utils/time'
import { useDemographics } from '../hooks/useDemographics'
import styles from './Demographics.module.css'

const DemographicsDonut = lazy(() =>
  import('./DemographicsDonut').then((m) => ({ default: m.DemographicsDonut })),
)
const DemographicsTrendChart = lazy(() =>
  import('./DemographicsTrendChart').then((m) => ({ default: m.DemographicsTrendChart })),
)

export function DemographicsSection({
  site,
  dateKey,
  isToday,
}: {
  site: Site
  dateKey: string
  isToday: boolean
}) {
  const q = useDemographics(site, dateKey)
  const now = useNow(60_000)
  const latest = q.data?.buckets.at(-1)

  const body = (render: () => ReactNode, height: number) =>
    q.isPending ? (
      <Skeleton height={`${height}px`} />
    ) : q.isError && !q.data ? (
      <ErrorState
        error={q.error}
        title="Couldn’t load demographics"
        onRetry={() => void q.refetch()}
        retrying={q.isFetching}
      />
    ) : !q.data.buckets.length ? (
      <EmptyState
        title="No demographic data"
        description="Nothing has been recorded for this day yet."
        minHeight={height}
      />
    ) : (
      <Suspense fallback={<Skeleton height={`${height}px`} />}>{render()}</Suspense>
    )

  return (
    <div className={styles.grid}>
      <Card aria-labelledby="demographics-split-title">
        <CardHeader title="Chart of Demographics" titleId="demographics-split-title" />
        <div className={chartStyles.body}>
          {body(
            () =>
              latest && (
                <DemographicsDonut
                  male={latest.male}
                  female={latest.female}
                  caption={`Average for ${formatAxisHour(latest.utc, site.timezone)} – ${formatAxisHour(latest.utc + HOUR_MS, site.timezone)}`}
                />
              ),
            240,
          )}
        </div>
      </Card>

      <Card aria-labelledby="demographics-trend-title">
        <CardHeader
          title="Demographics Analysis"
          titleId="demographics-trend-title"
          actions={
            <ChartLegend
              items={[
                { label: 'Male', color: CHART_COLORS.male },
                { label: 'Female', color: CHART_COLORS.female },
              ]}
            />
          }
        />
        <div className={chartStyles.body}>
          {body(
            () =>
              q.data && (
                <DemographicsTrendChart
                  buckets={q.data.buckets}
                  timeZone={site.timezone}
                  dayStart={q.data.window.dayStart}
                  dayEnd={q.data.window.dayEnd}
                  liveAt={isToday ? now : null}
                />
              ),
            260,
          )}
        </div>
        <div className={chartStyles.footer}>
          <DataFreshness
            updatedAt={q.dataUpdatedAt}
            isFetching={q.isFetching && !q.isPending}
            isStale={q.isRefetchError}
          />
        </div>
      </Card>
    </div>
  )
}
