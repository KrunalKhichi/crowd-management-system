import type { ReactNode } from 'react'
import styles from './feedback.module.css'

interface EmptyStateProps {
  title: string
  description?: ReactNode
  minHeight?: number
}

export function EmptyState({ title, description, minHeight = 160 }: EmptyStateProps) {
  return (
    <div className={styles.empty} style={{ minHeight }} role="status">
      <p className={styles.title}>{title}</p>
      {description && <p className={styles.message}>{description}</p>}
    </div>
  )
}
