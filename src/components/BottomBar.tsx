import { TwitchStatus } from '../hooks/useTwitchChat'
import TwitchStatusPill from './TwitchStatusPill'
import styles from './BottomBar.module.css'

interface Props {
  money: number
  served: number
  lost: number
  twitchStatus: TwitchStatus
  twitchChannel: string | null
}

export default function BottomBar({ money, served, lost, twitchStatus, twitchChannel }: Props) {
  return (
    <div className={styles.bar}>
      <div className={styles.stat}>
        <span className={styles.value} style={{ color: '#50d870' }}>${money}</span>
        <span className={styles.label}>EARNED</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={styles.value} style={{ color: '#78c8f0' }}>{served}</span>
        <span className={styles.label}>SERVED</span>
      </div>
      <div className={styles.divider} />
      <div className={styles.stat}>
        <span className={styles.value} style={{ color: '#f07860' }}>{lost}</span>
        <span className={styles.label}>LOST</span>
      </div>
      <div className={styles.right}>
        <TwitchStatusPill status={twitchStatus} channel={twitchChannel} />
        <span className={styles.hint}>Recipes &amp; config → ⚙️</span>
      </div>
    </div>
  )
}
