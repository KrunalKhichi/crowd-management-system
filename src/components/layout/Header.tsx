import { AlertsBell } from '@/features/alerts/components/AlertsBell'
import { ConnectionStatus } from '@/features/alerts/components/ConnectionStatus'
import { useAuth } from '@/features/auth/authContext'
import { SiteSelect } from '@/features/sites/components/SiteSelect'
import { useSiteSelection } from '@/features/sites/hooks/useSiteSelection'
import { Icon } from '@/components/ui/Icon'
import { initials } from '@/utils/format'
import styles from './Header.module.css'

export function Header({ onOpenNav }: { onOpenNav: () => void }) {
  const { session } = useAuth()
  const { site, sites, sitesQuery, selectSite } = useSiteSelection()
  const displayName = session?.name ?? session?.email ?? ''

  return (
    <header className={styles.header}>
      <button
        type="button"
        className={styles.menu}
        onClick={onOpenNav}
        aria-label="Open navigation"
        aria-controls="app-sidebar"
      >
        <Icon name="menu" />
      </button>
      <p className={styles.product}>Crowd Solutions</p>
      <span className={styles.separator} aria-hidden="true" />
      <SiteSelect
        sites={sites}
        value={site?.siteId ?? null}
        onChange={selectSite}
        loading={sitesQuery.isPending}
      />
      <div className={styles.end}>
        <ConnectionStatus />
        <AlertsBell site={site} />
        <span className={styles.avatar} title={session ? `${displayName} (${session.email})` : undefined}>
          <span aria-hidden="true">{initials(displayName) || '?'}</span>
          <span className="visually-hidden">Signed in as {displayName}</span>
        </span>
      </div>
    </header>
  )
}
