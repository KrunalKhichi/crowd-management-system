import { useState } from 'react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { ErrorState } from '@/components/feedback/ErrorState'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Icon } from '@/components/ui/Icon'
import { Pagination } from '@/components/ui/Pagination'
import { Skeleton } from '@/components/ui/Skeleton'
import { DEFAULT_ENTRIES_PAGE_SIZE, ENTRIES_PAGE_SIZES } from '@/constants/config'
import { DateControl } from '@/features/sites/components/DateControl'
import { useSiteSelection } from '@/features/sites/hooks/useSiteSelection'
import type { Site } from '@/types/api'
import { formatClock, formatCount } from '@/utils/format'
import { rowRange } from '@/utils/pagination'
import { useEntries } from '../hooks/useEntries'
import styles from './CrowdEntriesPage.module.css'
import { EntriesTable } from './EntriesTable'

export default function CrowdEntriesPage() {
  const { site, sitesQuery, dateKey, todayKey, selectDate } = useSiteSelection()
  const [pageSize, setPageSize] = useState<number>(DEFAULT_ENTRIES_PAGE_SIZE)

  return (
    <div className={styles.page}>
      <PageHeader
        title="Crowd Entries"
        subtitle={site ? `${site.name} · times in ${site.timezone}` : undefined}
        actions={<DateControl dateKey={dateKey} todayKey={todayKey} onChange={selectDate} />}
      />
      {sitesQuery.isPending ? (
        <Skeleton height="420px" />
      ) : sitesQuery.isError ? (
        <ErrorState
          error={sitesQuery.error}
          title="Couldn’t load sites"
          onRetry={() => void sitesQuery.refetch()}
        />
      ) : !site ? (
        <EmptyState title="No sites available" />
      ) : (
        // A new site/day/page size starts a fresh, frozen window at page 1.
        <EntriesPanel
          key={`${site.siteId}:${dateKey}:${pageSize}`}
          site={site}
          dateKey={dateKey}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
        />
      )}
    </div>
  )
}

interface EntriesPanelProps {
  site: Site
  dateKey: string
  pageSize: number
  onPageSizeChange: (size: number) => void
}

function EntriesPanel({ site, dateKey, pageSize, onPageSizeChange }: EntriesPanelProps) {
  const { query, page, totalPages, asOf, goToPage, refresh } = useEntries(site, dateKey, pageSize)
  const data = query.data
  const records = data?.records ?? []
  const { first, last } = rowRange(page, pageSize, records.length, data?.totalRecords ?? 0)

  return (
    <Card as="section" aria-labelledby="entries-heading" className={styles.card}>
      <div className={styles.toolbar}>
        <h2 id="entries-heading" className="visually-hidden">
          Visitor records
        </h2>
        <p className={styles.summary} aria-live="polite">
          {data?.totalRecords ? (
            <>
              Showing{' '}
              <strong>
                {formatCount(first)}–{formatCount(last)}
              </strong>{' '}
              of <strong>{formatCount(data.totalRecords)}</strong> visits · as of{' '}
              {formatClock(asOf, site.timezone)}
            </>
          ) : data ? (
            `No visits as of ${formatClock(asOf, site.timezone)}`
          ) : (
            'Loading visits…'
          )}
        </p>
        <div className={styles.controls}>
          <label className={styles.sizeLabel} htmlFor="page-size">
            Rows per page
          </label>
          <select
            id="page-size"
            className={styles.sizeSelect}
            value={pageSize}
            onChange={(e) => {
              onPageSizeChange(Number(e.target.value))
            }}
          >
            {ENTRIES_PAGE_SIZES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <Button
            size="sm"
            onClick={refresh}
            loading={query.isFetching && !query.isPlaceholderData && !query.isPending}
          >
            <Icon name="refresh" size={14} />
            Refresh
          </Button>
        </div>
      </div>

      {query.isError && !data ? (
        <ErrorState
          error={query.error}
          title="Couldn’t load entries"
          onRetry={() => void query.refetch()}
          retrying={query.isFetching}
        />
      ) : data && !data.totalRecords ? (
        <EmptyState
          title="No visits recorded"
          description="No one has entered this site during the selected day."
          minHeight={240}
        />
      ) : (
        <>
          {query.isError && (
            <ErrorState
              compact
              error={query.error}
              title="Couldn’t load that page"
              onRetry={() => void query.refetch()}
            />
          )}
          <EntriesTable
            records={records}
            timeZone={site.timezone}
            loading={query.isPending}
            refreshing={query.isPlaceholderData}
            skeletonRows={pageSize}
          />
          <div className={styles.footer}>
            <Pagination
              page={page}
              totalPages={totalPages}
              onPageChange={goToPage}
              label="Crowd entries pages"
            />
          </div>
        </>
      )}
    </Card>
  )
}
