import { Icon } from '@/components/ui/Icon'
import type { Site } from '@/types/api'
import styles from './SiteSelect.module.css'

interface SiteSelectProps {
  sites: Site[]
  value: string | null
  onChange: (siteId: string) => void
  loading: boolean
}

export function SiteSelect({ sites, value, onChange, loading }: SiteSelectProps) {
  return (
    <div className={styles.wrap}>
      <label htmlFor="site-select" className="visually-hidden">
        Site
      </label>
      <Icon name="pin" size={16} className={styles.pin} />
      <select
        id="site-select"
        className={styles.select}
        value={value ?? ''}
        disabled={!sites.length}
        onChange={(e) => {
          onChange(e.target.value)
        }}
      >
        {!sites.length && <option value="">{loading ? 'Loading sites…' : 'No sites available'}</option>}
        {sites.map((s) => (
          <option key={s.siteId} value={s.siteId}>
            {s.name}
          </option>
        ))}
      </select>
      <Icon name="chevronDown" size={16} className={styles.chevron} />
    </div>
  )
}
