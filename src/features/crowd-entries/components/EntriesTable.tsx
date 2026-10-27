import { Skeleton } from '@/components/ui/Skeleton'
import type { EntryRecord } from '@/types/api'
import { describeDwell, formatClock, formatDwellClock, initials, PLACEHOLDER } from '@/utils/format'
import styles from './EntriesTable.module.css'

interface EntriesTableProps {
  records: readonly EntryRecord[]
  timeZone: string
  loading: boolean
  /** Showing the previous page while the next one loads. */
  refreshing: boolean
  skeletonRows: number
}

const COLUMNS = ['Name', 'Sex', 'Entry', 'Exit', 'Dwell Time'] as const

const capitalize = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : PLACEHOLDER)

export function EntriesTable({ records, timeZone, loading, refreshing, skeletonRows }: EntriesTableProps) {
  return (
    <div className={styles.scroll}>
      <table
        className={styles.table}
        aria-busy={loading || refreshing}
        data-refreshing={refreshing || undefined}
      >
        <caption className="visually-hidden">
          Visitor entry and exit records. Times shown in {timeZone}.
        </caption>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c} scope="col">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading
            ? Array.from({ length: skeletonRows }, (_, i) => (
                <tr key={i}>
                  {COLUMNS.map((c) => (
                    <td key={c}>
                      <Skeleton width={c === 'Name' ? '70%' : '50%'} />
                    </td>
                  ))}
                </tr>
              ))
            : records.map((r) => (
                <tr key={`${r.personId}-${r.entryUtc}`}>
                  <th scope="row" className={styles.nameCell}>
                    <span className={styles.person}>
                      <span className={styles.avatar} aria-hidden="true">
                        {initials(r.personName)}
                      </span>
                      {r.personName}
                    </span>
                  </th>
                  <td>{capitalize(r.gender)}</td>
                  <td className="tabular">
                    <time dateTime={new Date(r.entryUtc).toISOString()}>
                      {formatClock(r.entryUtc, timeZone)}
                    </time>
                  </td>
                  <td className="tabular">
                    {r.exitUtc !== null ? (
                      <time dateTime={new Date(r.exitUtc).toISOString()}>
                        {formatClock(r.exitUtc, timeZone)}
                      </time>
                    ) : (
                      <span aria-label="Not exited yet" title="Still inside">
                        {PLACEHOLDER}
                      </span>
                    )}
                  </td>
                  <td className="tabular">
                    {r.dwellMinutes !== null ? (
                      <span aria-label={describeDwell(r.dwellMinutes)} title={describeDwell(r.dwellMinutes)}>
                        {formatDwellClock(r.dwellMinutes)}
                      </span>
                    ) : (
                      <span aria-label="Not available">{PLACEHOLDER}</span>
                    )}
                  </td>
                </tr>
              ))}
        </tbody>
      </table>
    </div>
  )
}
