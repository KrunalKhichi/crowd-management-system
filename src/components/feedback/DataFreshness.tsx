import { useNow } from '@/hooks/useNow'
import { formatRelative } from '@/utils/format'
import styles from './feedback.module.css'

interface DataFreshnessProps {
  /** TanStack Query `dataUpdatedAt` (0 when never loaded). */
  updatedAt: number
  isFetching: boolean
  /** A background refetch failed while older data is still shown. */
  isStale?: boolean
}

/** "Updated 2m ago" / "Refreshing…" / "Showing data from 5m ago" note for cached data. */
export function DataFreshness({ updatedAt, isFetching, isStale = false }: DataFreshnessProps) {
  const now = useNow(15_000)
  if (!updatedAt) return null
  const relative = formatRelative(updatedAt, now)
  return (
    <p className={isStale ? styles.freshnessStale : styles.freshness} aria-live="polite">
      {isFetching
        ? 'Refreshing…'
        : isStale
          ? `Couldn’t refresh · showing data from ${relative}`
          : `Updated ${relative}`}
    </p>
  )
}
