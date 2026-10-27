import { NavLink, useSearchParams } from 'react-router'
import { Icon, type IconName } from '@/components/ui/Icon'
import { BrandMark } from './BrandMark'
import styles from './Sidebar.module.css'

const NAV: readonly { to: string; label: string; icon: IconName }[] = [
  { to: '/overview', label: 'Overview', icon: 'home' },
  { to: '/entries', label: 'Crowd Entries', icon: 'entries' },
]

interface SidebarProps {
  collapsed: boolean
  mobileOpen: boolean
  onToggle: () => void
  onNavigate: () => void
  onLogout: () => void
}

export function Sidebar({ collapsed, mobileOpen, onToggle, onNavigate, onLogout }: SidebarProps) {
  // Keep the selected site/day when moving between pages.
  const [params] = useSearchParams()
  const search = params.toString() ? `?${params.toString()}` : ''

  return (
    <aside
      id="app-sidebar"
      className={styles.sidebar}
      data-collapsed={collapsed || undefined}
      data-mobile-open={mobileOpen || undefined}
      aria-label="Main"
    >
      <div className={styles.top}>
        <BrandMark compact={collapsed} />
        <button
          type="button"
          className={styles.toggle}
          onClick={onToggle}
          aria-label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
          aria-expanded={!collapsed}
          aria-controls="app-sidebar"
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} />
        </button>
      </div>
      <nav className={styles.nav}>
        <ul>
          {NAV.map((item) => (
            <li key={item.to}>
              <NavLink
                to={{ pathname: item.to, search }}
                className={({ isActive }) => (isActive ? `${styles.link} ${styles.active}` : styles.link)}
                onClick={onNavigate}
                title={collapsed ? item.label : undefined}
              >
                <Icon name={item.icon} size={20} />
                <span className={styles.label}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <button
        type="button"
        className={`${styles.link} ${styles.logout}`}
        onClick={onLogout}
        title={collapsed ? 'Logout' : undefined}
      >
        <Icon name="logout" size={20} />
        <span className={styles.label}>Logout</span>
      </button>
    </aside>
  )
}
