import { Suspense, useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router'
import { RealtimeProvider } from '@/app/providers/RealtimeProvider'
import { useAuth } from '@/features/auth/authContext'
import { Skeleton } from '@/components/ui/Skeleton'
import { Header } from './Header'
import styles from './AppLayout.module.css'
import { Sidebar } from './Sidebar'

const COLLAPSE_KEY = 'cms.sidebarCollapsed'

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1'
  } catch {
    return false
  }
}

export function AppLayout() {
  const { logout } = useAuth()
  const location = useLocation()
  const [collapsed, setCollapsed] = useState(readCollapsed)
  // The mobile drawer is open only on the path where it was opened, so any navigation closes it.
  const [openOnPath, setOpenOnPath] = useState<string | null>(null)
  const mobileOpen = openOnPath === location.pathname
  const setMobileOpen = (open: boolean) => {
    setOpenOnPath(open ? location.pathname : null)
  }

  useEffect(() => {
    try {
      localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0') // UI preference only, nothing sensitive
    } catch {
      /* storage unavailable */
    }
  }, [collapsed])

  const isMobile = () => window.matchMedia('(max-width: 900px)').matches

  return (
    <RealtimeProvider>
      <a href="#main" className={styles.skip}>
        Skip to content
      </a>
      <div className={styles.shell}>
        <Sidebar
          collapsed={collapsed}
          mobileOpen={mobileOpen}
          onToggle={() => {
            if (isMobile()) setMobileOpen(!mobileOpen)
            else setCollapsed((v) => !v)
          }}
          onNavigate={() => {
            setMobileOpen(false)
          }}
          onLogout={() => {
            logout()
          }}
        />
        {mobileOpen && (
          <div
            className={styles.scrim}
            aria-hidden="true"
            onClick={() => {
              setMobileOpen(false)
            }}
          />
        )}
        <div className={styles.main}>
          <Header
            onOpenNav={() => {
              setMobileOpen(true)
            }}
          />
          <main id="main" className={styles.content} tabIndex={-1}>
            <Suspense fallback={<Skeleton height="320px" />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </div>
    </RealtimeProvider>
  )
}
