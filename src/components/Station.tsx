import { Station as StationType, StationSlot } from '../state/types'
import { STATION_DEFS, NAME_COLORS } from '../data/recipes'
import { HEAT_PER_COOK } from '../state/gameReducer'
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
}

// Per-station accent border colours (overheat overrides these)
const STATION_ACCENT: Record<string, string> = {
  cutting_board: '#2a5a3a',
  grill:         '#7a3500',
  fryer:         '#7a6000',
  stove:         '#1a3a6a',
  oven:          '#5a3a10',
  wok:           '#6a2e00',
  steamer:       '#2a5a6a',
  stone_pot:     '#4a3020',
  rice_pot:      '#6a5030',
}

export default function Station({ station, capacity }: Props) {
  const def = STATION_DEFS[station.id]
  if (!def) return null

  const borderColor = station.overheated ? '#cc2200' : (STATION_ACCENT[station.id] ?? def.color)
  // Each cook adds HEAT_PER_COOK — show how many cooks until next overheat threshold
  void HEAT_PER_COOK

  return (
    <div className={`${styles.station} ${station.overheated ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>
        <span className={styles.stationEmoji}>{def.emoji}</span>
        <span className={styles.stationName}>{def.name}</span>
        <span className={styles.capacity}>
          {capacity === Infinity ? station.slots.length : `${station.slots.length}/${capacity}`}
        </span>
      </div>
      {station.heat > 0 && !station.overheated && (
        <div className={styles.heatBar}>
          <div
            className={`${styles.heatBarFill} ${
              station.heat > 70 ? styles.heatBarFillHot
              : station.heat > 40 ? styles.heatBarFillWarm
              : ''
            }`}
            style={{ width: `${station.heat}%` }}
          />
        </div>
      )}
      {station.overheated ? (
        <div className={styles.overheatOverlay}>
          <span>🔥 OVERHEATED</span>
          <code>!extinguish {station.id.replace(/_/g, ' ')}</code>
          {station.extinguishVotes.length > 0 && (
            <span className={styles.voteProgress}>
              {station.extinguishVotes.length} voting…
            </span>
          )}
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
