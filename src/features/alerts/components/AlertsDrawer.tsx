import { useEffect, useRef } from 'react'
import { EmptyState } from '@/components/feedback/EmptyState'
import { Button } from '@/components/ui/Button'
import { Icon } from '@/components/ui/Icon'
import { useNow } from '@/hooks/useNow'
import type { AlertEvent } from '@/services/socket'
import { formatClock, formatRelative } from '@/utils/format'
import styles from './Alerts.module.css'
import { SeverityBadge } from './SeverityBadge'

interface AlertsDrawerProps {
  open: boolean
  onClose: () => void
  alerts: readonly AlertEvent[]
  siteName: string
  timeZone: string
}

/** Native <dialog> provides focus trapping, Esc-to-close and an inert background. */
export function AlertsDrawer({ open, onClose, alerts, siteName, timeZone }: AlertsDrawerProps) {
  const ref = useRef<HTMLDialogElement>(null)
  const now = useNow(10_000)

  useEffect(() => {
    const dialog = ref.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    // Backdrop click is a mouse convenience; keyboard users get native Esc and the close button.
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions
    <dialog
      ref={ref}
      className={styles.drawer}
      aria-labelledby="alerts-title"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose() // backdrop click
      }}
    >
      <div className={styles.drawerInner}>
        <header className={styles.drawerHeader}>
          <div>
            <h2 id="alerts-title" className={styles.drawerTitle}>
              Alerts
            </h2>
            <p className={styles.drawerSub}>Entry and exit events at {siteName}</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close alerts">
            <Icon name="close" />
          </Button>
        </header>
        {alerts.length ? (
          <ol className={styles.list}>
            {alerts.map((a) => (
              <li key={a.eventId} className={`${styles.item} ${styles[`edge_${a.severity}`]}`}>
                <span className={styles.direction} aria-hidden="true">
                  <Icon name={a.direction === 'entry' ? 'entry' : 'exit'} size={16} />
                </span>
                <div className={styles.itemBody}>
                  <p className={styles.itemTitle}>
                    <strong>{a.personName}</strong> {a.direction === 'entry' ? 'entered' : 'exited'}
                  </p>
                  <p className={styles.itemMeta}>{a.zoneName}</p>
                </div>
                <div className={styles.itemSide}>
                  <SeverityBadge severity={a.severity} />
                  <time dateTime={new Date(a.ts).toISOString()} title={formatClock(a.ts, timeZone, true)}>
                    {formatRelative(a.ts, now)}
                  </time>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <EmptyState
            title="No alerts yet"
            description="Entry and exit alerts for this site appear here as they happen."
          />
        )}
      </div>
    </dialog>
  )
}
