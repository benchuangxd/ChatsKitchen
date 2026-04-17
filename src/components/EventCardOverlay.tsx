import { KitchenEvent } from '../state/types'
import { createPortal } from 'react-dom'
import { EVENT_DEFS } from '../data/kitchenEventDefs'
import styles from './EventCardOverlay.module.css'

interface Props {
  activeEvent: KitchenEvent | null
}

export default function EventCardOverlay({ activeEvent }: Props) {
  if (!activeEvent) return null

  const ev = activeEvent
  const isHazard = ev.category !== 'opportunity'
  const def = EVENT_DEFS.find(d => d.type === ev.type)!

  const tagText = isHazard ? '⚠️ Hazard' : '⚡ Opportunity'
  const description = isHazard
    ? (def.failDescription ?? '')
    : (def.rewardDescription ?? '')

  const timePercent = ev.timeLeft !== null
    ? (ev.timeLeft / (ev.category === 'hazard-penalty' ? 10_000 : 12_000)) * 100
    : null

  const cardClass = [
    styles.card,
    isHazard ? styles.cardHazard : styles.cardOpportunity,
    ev.resolved ? styles.cardResolved : '',
    ev.failed ? styles.cardFailed : '',
  ].filter(Boolean).join(' ')

  return createPortal(
    <div className={styles.overlay}>
      <div className={cardClass}>
        <div className={`${styles.tag} ${isHazard ? styles.tagHazard : styles.tagOpportunity}`}>
          {tagText}
        </div>
        <div className={styles.title}>{def.emoji} {def.label}</div>
        <div className={`${styles.cmdHint} ${isHazard ? styles.cmdHintHazard : styles.cmdHintOpportunity}`}>
          <code>{ev.chosenCommand}</code>
        </div>
        <div className={styles.description}>{description}</div>

        {ev.resolved && <div className={`${styles.outcomeMsg} ${styles.outcomeResolved}`}>✓ Resolved!</div>}
        {ev.failed && <div className={`${styles.outcomeMsg} ${styles.outcomeFailed}`}>✗ Failed!</div>}

        {!ev.resolved && !ev.failed && (
          <div className={styles.barsWrap}>
            {timePercent !== null && (
              <div>
                <div className={styles.barLabel}>Time</div>
                <div className={styles.barTrack}>
                  <div className={`${styles.barFill} ${styles.barFillTime}`} style={{ width: `${timePercent}%` }} />
                </div>
              </div>
            )}
            <div>
              <div className={styles.barLabel}>Progress</div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isHazard ? styles.barFillHazard : styles.barFillOpp}`}
                  style={{ width: `${ev.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
