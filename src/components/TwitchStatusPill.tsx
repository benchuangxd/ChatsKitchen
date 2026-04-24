import { TwitchStatus } from '../hooks/useTwitchChat'
import styles from './TwitchStatusPill.module.css'

interface Props {
  status: TwitchStatus
  channel: string | null
}

export default function TwitchStatusPill({ status, channel }: Props) {
  const label =
    status === 'connected' && channel ? `#${channel}`
    : status === 'connecting'         ? 'Connecting…'
    : status === 'error'              ? 'Connection error'
    :                                   'Not connected'

  return (
    <div className={`${styles.pill} ${styles[status]}`}>
      <span className={styles.dot} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}
