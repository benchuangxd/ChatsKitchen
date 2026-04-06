import { Station as StationType, StationSlot } from '../state/types'
import { STATION_DEFS, NAME_COLORS } from '../data/recipes'
import styles from './Station.module.css'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

function SlotRow({ slot, stationId }: { slot: StationSlot; stationId: string }) {
  const now = Date.now()
  const elapsed = now - slot.cookStart
  const progress = slot.cookDuration > 0 ? Math.min(1, elapsed / slot.cookDuration) : 0
  const burnRatio = slot.burnAt > 0 && slot.burnAt < Infinity ? elapsed / slot.burnAt : 0

  const nameColor = NAME_COLORS[Math.abs(hashStr(slot.user)) % NAME_COLORS.length]

  if (slot.state === 'onFire') {
    return (
      <div className={`${styles.slot} ${styles.slotOnFire}`}>
        <span className={styles.slotUser} style={{ color: nameColor }}>{slot.user}</span>
        <span className={styles.slotItem}>{slot.target.replace(/_/g, ' ')}</span>
        <span className={styles.slotFireLabel}>🔥 !extinguish {stationId.replace(/_/g, ' ')}</span>
      </div>
    )
  }

  if (slot.state === 'done') {
    const burnWindow = slot.burnAt - slot.cookDuration
    const burnElapsed = Math.max(0, elapsed - slot.cookDuration)
    const burnProgress = slot.burnAt > 0 && slot.burnAt < Infinity && burnWindow > 0
      ? Math.min(1, burnElapsed / burnWindow)
      : 0
    const burnBarColor = burnProgress > 0.75 ? '#d94f4f' : burnProgress > 0.4 ? '#e8943a' : '#f0c850'

    return (
      <div className={`${styles.slot} ${styles.slotDone}`}>
        <span className={styles.slotUser} style={{ color: nameColor }}>{slot.user}</span>
        <span className={styles.slotItem}>{slot.target.replace(/_/g, ' ')}</span>
        <span className={styles.slotDoneLabel}>DONE</span>
        {burnProgress > 0 && (
          <>
            <span className={styles.burnLabel}>BURN</span>
            <div className={styles.progressBg}>
              <div
                className={styles.progressFill}
                style={{ width: `${Math.floor(burnProgress * 100)}%`, background: burnBarColor }}
              />
            </div>
          </>
        )}
      </div>
    )
  }

  // cooking slot — color bar based on burn proximity
  const barColor = burnRatio > 0.85 ? '#d94f4f' : burnRatio > 0.65 ? '#e8943a' : '#5cb85c'

  return (
    <div className={styles.slot}>
      <span className={styles.slotUser} style={{ color: nameColor }}>{slot.user}</span>
      <span className={styles.slotItem}>{slot.target.replace(/_/g, ' ')}</span>
      <div className={styles.progressBg}>
        <div
          className={styles.progressFill}
          style={{ width: `${Math.floor(progress * 100)}%`, background: barColor }}
        />
      </div>
    </div>
  )
}

interface Props {
  station: StationType
  capacity: number
}

export default function Station({ station, capacity }: Props) {
  const def = STATION_DEFS[station.id]
  if (!def) return null

  const hasActiveFire = station.slots.some(s => s.state === 'onFire')
  const borderColor = hasActiveFire ? '#d94f4f' : def.color

  return (
    <div className={`${styles.station} ${hasActiveFire ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>
        {def.emoji} {def.name}
        <span className={styles.capacity}>
          {capacity === Infinity ? station.slots.length : `${station.slots.length}/${capacity}`}
        </span>
      </div>
      {station.slots.length === 0 ? (
        <div className={styles.idleStatus}>idle</div>
      ) : (
        <div className={styles.slots}>
          {station.slots.map(slot => (
            <SlotRow key={slot.id} slot={slot} stationId={station.id} />
          ))}
        </div>
      )}
    </div>
  )
}
