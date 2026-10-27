import type { HTMLAttributes, ReactNode } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLElement> {
  as?: 'section' | 'div' | 'article'
}

export function Card({ as: Tag = 'section', className, ...rest }: CardProps) {
  return <Tag className={[styles.card, className].filter(Boolean).join(' ')} {...rest} />
}

interface CardHeaderProps {
  title: ReactNode
  titleId?: string
  actions?: ReactNode
}

export function CardHeader({ title, titleId, actions }: CardHeaderProps) {
  return (
    <header className={styles.header}>
      <h3 id={titleId} className={styles.title}>
        {title}
      </h3>
      {actions && <div className={styles.actions}>{actions}</div>}
    </header>
  )
}
