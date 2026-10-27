import type { ReactNode } from 'react'
import { ErrorState } from '@/components/feedback/ErrorState'
import { Skeleton } from '@/components/ui/Skeleton'
import styles from './MetricTile.module.css'

interface MetricTileProps {
  label: string
  value: string
  /** Accessible full reading when `value` is abbreviated (e.g. dwell "22min 05sec"). */
  valueLabel?: string
  trend?: ReactNode
  footnote?: ReactNode
  badge?: ReactNode
  loading?: boolean
  error?: unknown
  onRetry?: () => void
  retrying?: boolean
}

export function MetricTile({
  label,
  value,
  valueLabel,
  trend,
  footnote,
  badge,
  loading = false,
  error,
  onRetry,
  retrying = false,
}: MetricTileProps) {
  return (
    <div className={styles.tile}>
      <div className={styles.head}>
        <h3 className={styles.label}>{label}</h3>
        {badge}
      </div>
      {loading ? (
        <div className={styles.loading} aria-busy="true" aria-label={`Loading ${label}`}>
          <Skeleton width="55%" height="28px" />
          <Skeleton width="80%" height="12px" />
        </div>
      ) : error ? (
        <ErrorState
          compact
          error={error}
          title={`${label} unavailable`}
          {...(onRetry ? { onRetry } : {})}
          retrying={retrying}
        />
      ) : (
        <>
          <p className={styles.value} aria-label={valueLabel}>
            {value}
          </p>
          {trend}
          {footnote && <p className={styles.footnote}>{footnote}</p>}
        </>
      )}
    </div>
  )
}
