import { useEffect, useState } from 'react'
import styles from './Countdown.module.css'

type Phase = 'closing' | 'holding' | 'opening' | 'done'

interface Props {
  onDone: () => void
}

export default function Countdown({ onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('closing')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('holding'), 600),
      setTimeout(() => setPhase('opening'), 1400),
      setTimeout(() => setPhase('done'), 2000),
      setTimeout(() => onDone(), 2200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  return (
    <div className={styles.overlay}>
      <div className={styles.stage}>
        <div className={`${styles.door} ${styles.doorLeft} ${styles[phase]}`}>
          <div className={styles.doorWindow} />
          <div className={styles.doorHandle} />
        </div>
        <div className={`${styles.door} ${styles.doorRight} ${styles[phase]}`}>
          <div className={styles.doorWindow} />
          <div className={styles.doorHandle} />
        </div>
      </div>
      <div className={`${styles.centerText} ${phase === 'holding' ? styles.textVisible : ''}`}>
        Let Chat Cook!
      </div>
    </div>
  )
}
