import type { Severity } from '@/types/api'
import styles from './Alerts.module.css'

const LABEL: Record<Severity, string> = { high: 'High', medium: 'Medium', low: 'Low' }

/** Severity is shown as text plus colour, never colour alone. */
export function SeverityBadge({ severity }: { severity: Severity }) {
  return <span className={`${styles.severity} ${styles[severity]}`}>{LABEL[severity]}</span>
}
