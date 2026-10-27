import { useEffect, useRef, useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import { TOAST_COALESCE_MS, TOAST_VISIBLE_MS } from '@/constants/config'
import type { AlertEvent } from '@/services/socket'
import { alertsStore } from '../alertsStore'
import styles from './Alerts.module.css'

interface Toast {
  latest: AlertEvent
  count: number
}

/**
 * Pops a toast only for HIGH-severity alerts at the selected site, and coalesces bursts:
 * alerts within TOAST_COALESCE_MS update a single toast ("3 high-severity alerts").
 * Lower severities still reach the bell and drawer, avoiding notification noise.
 */
export function AlertToaster({ siteId, onOpenAlerts }: { siteId: string | null; onOpenAlerts?: () => void }) {
  const [toast, setToast] = useState<Toast | null>(null)
  const burst = useRef({ startedAt: 0, count: 0 })

  useEffect(() => {
    if (!siteId) return undefined
    return alertsStore.onAdded((alert) => {
      if (alert.siteId !== siteId || alert.severity !== 'high') return
      const now = Date.now()
      if (now - burst.current.startedAt >= TOAST_COALESCE_MS) burst.current = { startedAt: now, count: 0 }
      burst.current.count += 1
      setToast({ latest: alert, count: burst.current.count })
    })
  }, [siteId])

  const dismiss = () => {
    burst.current = { startedAt: 0, count: 0 }
    setToast(null)
  }

  useEffect(() => {
    if (!toast) return undefined
    const id = setTimeout(() => {
      burst.current = { startedAt: 0, count: 0 }
      setToast(null)
    }, TOAST_VISIBLE_MS)
    return () => {
      clearTimeout(id)
    }
  }, [toast])

  const message = toast
    ? toast.count > 1
      ? `${toast.count} high-severity alerts · latest: ${toast.latest.personName} ${toast.latest.direction === 'entry' ? 'entered' : 'exited'} ${toast.latest.zoneName}`
      : `High-severity alert: ${toast.latest.personName} ${toast.latest.direction === 'entry' ? 'entered' : 'exited'} ${toast.latest.zoneName}`
    : ''

  return (
    // The live region is always mounted so assistive tech reliably announces changes.
    <div className={styles.toastRegion} role="status" aria-live="polite" aria-atomic="true">
      {toast && (
        <div className={styles.toast}>
          <Icon name="alert" size={18} className={styles.toastIcon} />
          <p className={styles.toastText}>{message}</p>
          {onOpenAlerts && (
            <button
              type="button"
              className={styles.toastAction}
              onClick={() => {
                dismiss()
                onOpenAlerts()
              }}
            >
              View
            </button>
          )}
          <button type="button" className={styles.toastClose} aria-label="Dismiss alert" onClick={dismiss}>
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
    </div>
  )
}
