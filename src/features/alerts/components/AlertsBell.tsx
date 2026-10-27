import { useState } from 'react'
import { Icon } from '@/components/ui/Icon'
import type { Site } from '@/types/api'
import { alertsStore } from '../alertsStore'
import { useSiteAlerts } from '../hooks/useSiteAlerts'
import styles from './Alerts.module.css'
import { AlertsDrawer } from './AlertsDrawer'
import { AlertToaster } from './AlertToaster'

export function AlertsBell({ site }: { site: Site | null }) {
  const [open, setOpen] = useState(false)
  const { alerts, unread } = useSiteAlerts(site?.siteId ?? null)
  const badge = unread > 99 ? '99+' : String(unread)
  const openDrawer = () => {
    setOpen(true)
    alertsStore.markAllRead()
  }

  return (
    <>
      <button
        type="button"
        className={styles.bell}
        aria-label={unread ? `Alerts, ${unread} unread` : 'Alerts'}
        aria-haspopup="dialog"
        disabled={!site}
        onClick={openDrawer}
      >
        <Icon name="bell" size={20} />
        {unread > 0 && (
          <span className={styles.badge} aria-hidden="true">
            {badge}
          </span>
        )}
      </button>
      <AlertToaster siteId={site?.siteId ?? null} onOpenAlerts={openDrawer} />
      {site && (
        <AlertsDrawer
          open={open}
          onClose={() => {
            setOpen(false)
            alertsStore.markAllRead()
          }}
          alerts={alerts}
          siteName={site.name}
          timeZone={site.timezone}
        />
      )}
    </>
  )
}
