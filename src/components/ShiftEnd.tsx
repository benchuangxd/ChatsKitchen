import { useEffect, useState } from 'react'
import styles from './ShiftEnd.module.css'

type Phase = 'closing' | 'fading' | 'scoring' | 'opening' | 'done'

interface Props {
  money: number
  served: number
  lost: number
  onDone: () => void
  goalMoney?: number     // adventure mode: the money goal for this shift
  shiftNumber?: number   // adventure mode: displayed as "Shift N" label
}

export default function ShiftEnd({ money, served, lost, onDone, goalMoney, shiftNumber }: Props) {
  const [phase, setPhase] = useState<Phase>('closing')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('fading'),  600),
      setTimeout(() => setPhase('scoring'), 900),
      setTimeout(() => setPhase('opening'), 2400),
      setTimeout(() => setPhase('done'),    3000),
      setTimeout(() => onDone(),            3200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const showTimesUp = phase === 'closing' || phase === 'fading'
  const showScore   = phase === 'scoring' || phase === 'opening' || phase === 'done'

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

      {showTimesUp && (
        <div className={`${styles.centerText} ${phase === 'fading' ? styles.textFading : styles.textVisible}`}>
          Time's Up!
        </div>
      )}

      {showScore && (
        <div className={styles.scoreWrap}>
          <div className={styles.scoreCard}>
            <div className={styles.shiftLabel}>Shift earnings</div>
            <div className={styles.moneyVal}>${money}</div>
            {goalMoney != null && (
              <>
                <div className={styles.shiftLabel} style={{ fontSize: '16px' }}>
                  {shiftNumber != null ? `Shift ${shiftNumber}` : 'Goal'}: ${goalMoney}
                </div>
                <div className={styles.servedRow}>
                  <span
                    className={`${styles.statPill} ${money >= goalMoney ? styles.statServed : styles.statLost}`}
                  >
                    {money >= goalMoney ? '✓ PASSED' : '✗ FAILED'}
                  </span>
                </div>
              </>
            )}
            <div className={styles.servedRow}>
              <span className={`${styles.statPill} ${styles.statServed}`}>✓ {served} served</span>
              <span className={`${styles.statPill} ${styles.statLost}`}>✗ {lost} lost</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
