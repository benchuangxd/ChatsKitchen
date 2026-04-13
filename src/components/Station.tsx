import { Station as StationType, StationSlot } from '../state/types'
import { STATION_DEFS, NAME_COLORS } from '../data/recipes'
import styles from './Station.module.css'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

function SlotRow({ slot }: { slot: StationSlot }) {
  const now = Date.now()
  const elapsed = now - slot.cookStart
  const progress = slot.cookDuration > 0 ? Math.min(1, elapsed / slot.cookDuration) : 0

  const barColor = progress > 0.85
    ? 'rgba(217,79,79,0.55)'
    : progress > 0.65
      ? 'rgba(232,148,58,0.55)'
      : 'rgba(92,184,92,0.42)'

  const nameColor = NAME_COLORS[Math.abs(hashStr(slot.user)) % NAME_COLORS.length]

  return (
    <div className={styles.slot}>
      <div className={styles.slotBar}>
        <div className={styles.barBg} />
        <div className={styles.barFill} style={{ width: `${Math.floor(progress * 100)}%`, background: barColor }} />
        <div className={styles.barText}>
          <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
          <span className={styles.barItem}>{slot.target.replace(/_/g, ' ')}</span>
          <span className={styles.barRight} style={{ color: 'rgba(255,255,255,0.55)' }}>{Math.floor(progress * 100)}%</span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  station: StationType
  capacity: number
  playerCount: number
}


function heatBorderColor(heat: number, overheated: boolean): string {
  if (overheated) return '#cc2200'
  if (heat > 70)  return '#e8943a'
  if (heat > 40)  return '#d4c43a'
  return '#5aad5e'
}

export default function Station({ station, capacity, playerCount }: Props) {
  const def = STATION_DEFS[station.id]
  if (!def) return null

  const borderColor = heatBorderColor(station.heat, station.overheated)
  const extinguishNeeded = Math.max(1, Math.ceil(Math.max(1, playerCount) * 0.3))

  return (
    <div className={`${styles.station} ${station.overheated ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>
        <span className={styles.stationEmoji}>{def.emoji}</span>
        <span className={styles.stationName}>{def.name}</span>
        <span className={styles.capacity}>
          {capacity === Infinity ? station.slots.length : `${station.slots.length}/${capacity}`}
        </span>
      </div>
      {station.overheated ? (
        <div className={styles.overheatOverlay}>
          <span>🔥 OVERHEATED</span>
          <code>!extinguish {station.id.replace(/_/g, ' ')}</code>
          <span className={styles.voteProgress}>
            {station.extinguishVotes.length}/{extinguishNeeded} extinguishing…
          </span>
        </div>
      ) : station.slots.length === 0 ? (
        <div className={styles.idleStatus}>idle</div>
      ) : (
        <div className={styles.slots}>
          {station.slots.map(slot => (
            <SlotRow key={slot.id} slot={slot} />
          ))}
        </div>
      )}
    </div>
  )
}
