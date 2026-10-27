import { realtimeClient, useConnectionStatus, type ConnectionStatus as Status } from '@/services/socket'
import styles from './Alerts.module.css'

const LABELS: Record<Status, string> = {
  idle: 'Offline',
  connecting: 'Connecting…',
  connected: 'Live',
  reconnecting: 'Reconnecting…',
  disconnected: 'Disconnected',
  unauthorized: 'Session expired',
}

export function ConnectionStatus() {
  const status = useConnectionStatus()
  return (
    <div className={styles.connection} data-status={status}>
      <span className={styles.connectionDot} aria-hidden="true" />
      <span role="status" aria-live="polite" className={styles.connectionLabel}>
        <span className="visually-hidden">Live feed: </span>
        {LABELS[status]}
      </span>
      {status === 'disconnected' && (
        <button
          type="button"
          className={styles.reconnect}
          onClick={() => {
            realtimeClient.reconnect()
          }}
        >
          Reconnect
        </button>
      )}
    </div>
  )
}
