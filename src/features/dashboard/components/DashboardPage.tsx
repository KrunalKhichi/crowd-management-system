import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Skeleton } from '@/components/ui/Skeleton'
import { DemographicsSection } from '@/features/demographics/components/DemographicsSection'
import { OccupancyCard } from '@/features/occupancy/components/OccupancyCard'
import { DateControl } from '@/features/sites/components/DateControl'
import { useSiteSelection } from '@/features/sites/hooks/useSiteSelection'
import { formatDay } from '@/utils/format'
import { zonedMidnight } from '@/utils/time'
import { useRealtimeRefresh } from '../hooks/useRealtimeRefresh'
import styles from './DashboardPage.module.css'
import { KpiPanel } from './KpiPanel'

export default function DashboardPage() {
  const { site, sitesQuery, dateKey, todayKey, isToday, selectDate } = useSiteSelection()
  useRealtimeRefresh(site?.siteId ?? null, dateKey, isToday)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Overview"
        subtitle={
          site
            ? `${site.name} · ${formatDay(zonedMidnight(dateKey, site.timezone), site.timezone)} · ${site.timezone}`
            : undefined
        }
        actions={<DateControl dateKey={dateKey} todayKey={todayKey} onChange={selectDate} />}
      />

      {sitesQuery.isPending ? (
        <Skeleton height="120px" />
      ) : sitesQuery.isError ? (
        <ErrorState
          error={sitesQuery.error}
          title="Couldn’t load sites"
          onRetry={() => void sitesQuery.refetch()}
        />
      ) : !site ? (
        <EmptyState title="No sites available" description="Your account has no sites to display." />
      ) : (
        // Keyed by site + day so every panel starts clean when the selection changes.
        <div key={`${site.siteId}:${dateKey}`} className={styles.sections}>
          <section aria-labelledby="occupancy-heading" className={styles.section}>
            <h2 id="occupancy-heading" className={styles.sectionTitle}>
              Occupancy
            </h2>
            <KpiPanel site={site} dateKey={dateKey} isToday={isToday} />
            <OccupancyCard site={site} dateKey={dateKey} isToday={isToday} />
          </section>
          <section aria-labelledby="demographics-heading" className={styles.section}>
            <h2 id="demographics-heading" className={styles.sectionTitle}>
              Demographics
            </h2>
            <DemographicsSection site={site} dateKey={dateKey} isToday={isToday} />
          </section>
        </div>
      )}
    </div>
  )
}
