import styles from './BrandMark.module.css'

/** Neutral product wordmark. Swap in the official logo asset when one is supplied. */
export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={styles.brand}>
      <svg width="26" height="26" viewBox="0 0 32 32" aria-hidden="true" focusable="false">
        <circle cx="16" cy="16" r="15" fill="currentColor" opacity="0.18" />
        <circle cx="11" cy="13" r="3.2" fill="currentColor" />
        <circle cx="21" cy="13" r="3.2" fill="currentColor" opacity="0.7" />
        <path
          d="M5.5 25c.6-3.6 2.9-6 5.5-6s4.9 2.4 5.5 6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M15.5 25c.6-3.6 2.9-6 5.5-6s4.9 2.4 5.5 6"
          stroke="currentColor"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          opacity="0.7"
        />
      </svg>
      {!compact && <span className={styles.name}>Crowd Management</span>}
    </span>
  )
}
