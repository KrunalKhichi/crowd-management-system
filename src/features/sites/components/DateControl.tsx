import { Icon } from '@/components/ui/Icon'
import styles from './DateControl.module.css'

interface DateControlProps {
  dateKey: string
  todayKey: string
  onChange: (dateKey: string | null) => void
}

/** Day picker in the site's calendar. The analytics API accepts any UTC range, scoped here to one day. */
export function DateControl({ dateKey, todayKey, onChange }: DateControlProps) {
  const isToday = dateKey === todayKey
  return (
    <div className={styles.wrap}>
      <label htmlFor="date-control" className={styles.label}>
        <Icon name="calendar" size={16} />
        <span>{isToday ? 'Today' : 'Day'}</span>
      </label>
      <input
        id="date-control"
        type="date"
        className={styles.input}
        value={dateKey}
        max={todayKey}
        onChange={(e) => {
          onChange(e.target.value || null)
        }}
      />
      {!isToday && (
        <button
          type="button"
          className={styles.today}
          onClick={() => {
            onChange(null)
          }}
        >
          Back to today
        </button>
      )}
    </div>
  )
}
