import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { getErrorMessage } from '@/services/api/errors'
import styles from './feedback.module.css'

interface ErrorStateProps {
  error: unknown
  title?: string
  onRetry?: () => void
  retrying?: boolean
  compact?: boolean
}

export function ErrorState({
  error,
  title = 'Couldn’t load data',
  onRetry,
  retrying = false,
  compact = false,
}: ErrorStateProps) {
  return (
    <div className={compact ? styles.errorCompact : styles.error} role="alert">
      <Icon name="alert" size={compact ? 16 : 20} />
      <div className={styles.body}>
        <p className={styles.title}>{title}</p>
        <p className={styles.message}>{getErrorMessage(error)}</p>
      </div>
      {onRetry && (
        <Button size="sm" onClick={onRetry} loading={retrying}>
          Retry
        </Button>
      )}
    </div>
  )
}
