import { Station as StationType, StationSlot } from '../state/types'
import { STATION_DEFS, NAME_COLORS } from '../data/recipes'
import styles from './Station.module.css'

const SHORT_ID: Record<string, string> = { cutting_board: 'cboard' }

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

function SlotRow({ slot, stationId }: { slot: StationSlot; stationId: string }) {
  const now = Date.now()
  const elapsed = now - slot.cookStart
  const progress = slot.cookDuration > 0 ? Math.min(1, elapsed / slot.cookDuration) : 0

  const burnWindow = slot.burnAt - slot.cookDuration
  const burnElapsed = elapsed - slot.cookDuration
  const burnProgress = slot.state === 'done' && burnWindow > 0
    ? Math.min(1, Math.max(0, burnElapsed / burnWindow)) : 0

  const nameColor = NAME_COLORS[Math.abs(hashStr(slot.user)) % NAME_COLORS.length]
  const shortId = SHORT_ID[stationId] || stationId

  return (
    <div className={styles.slot}>
      <div className={styles.slotHeader}>
        <span className={styles.slotUser} style={{ color: nameColor }}>{slot.user}</span>
        <span className={styles.slotItem}>{slot.target}</span>
      </div>
      <div className={styles.progressBg}>
        <div
          className={styles.progressFill}
          style={{
            width: slot.state === 'cooking' ? `${progress * 100}%` : '100%',
            backgroundColor: slot.state === 'done' ? '#5cb85c' : '#5aad5e',
          }}
        />
      </div>
      {slot.state === 'done' && slot.burnAt > 0 && slot.burnAt < Infinity && (
        <div className={styles.burnBar}>
          <div className={styles.burnLabel}>BURN</div>
          <div className={styles.burnBg}>
            <div className={styles.burnFill} style={{ width: `${burnProgress * 100}%` }} />
          </div>
        </div>
      )}
      <div className={styles.slotStatus} style={{ color: slot.state === 'done' ? '#5cb85c' : '#e8943a' }}>
        {slot.state === 'cooking' ? `${stationId === 'plating' ? 'plating' : 'cooking'} ${Math.floor(progress * 100)}%` : `DONE! !take ${shortId}`}
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

  const borderColor = station.onFire ? '#d94f4f' : def.color

  return (
    <div className={`${styles.station} ${station.onFire ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>{def.emoji} {def.name} <span className={styles.capacity}>{station.slots.length}/{capacity}</span></div>
      {station.onFire ? (
        <div className={styles.fireStatus}>ON FIRE! !extinguish</div>
      ) : station.slots.length === 0 ? (
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
