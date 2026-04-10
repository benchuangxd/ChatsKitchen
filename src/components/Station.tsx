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

  // ── On fire ──────────────────────────────────────────────────────────────
  if (slot.state === 'onFire') {
    return (
      <div className={styles.slot}>
        <div className={styles.fireBar}>
          <div className={styles.barText}>
            <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
            <span className={styles.barItem}>🔥 !extinguish {stationId.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Done ─────────────────────────────────────────────────────────────────
  if (slot.state === 'done') {
    const burnWindow = slot.burnAt - slot.cookDuration
    const burnElapsed = Math.max(0, elapsed - slot.cookDuration)
    const burnProgress = slot.burnAt < Infinity && burnWindow > 0
      ? Math.min(1, burnElapsed / burnWindow)
      : 0
    const isDanger = burnProgress >= 0.5

    return (
      <div className={`${styles.slot} ${isDanger ? styles.slotDanger : styles.slotDone}`}>
        <div className={styles.slotBar}>
          <div className={styles.barBg} />
          <div
            className={styles.barFill}
            style={{ width: '100%', background: isDanger ? 'rgba(217,79,79,0.55)' : 'rgba(240,200,80,0.38)' }}
          />
          <div className={styles.barText}>
            <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
            <span className={styles.barItem}>{slot.target.replace(/_/g, ' ')}</span>
            <span className={styles.barRight} style={{ color: isDanger ? '#ff8080' : '#f0c850' }}>
              {isDanger ? '⚠ TAKE IT!' : '✓ DONE'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Cooking ───────────────────────────────────────────────────────────────
  const barColor = burnRatio > 0.85
    ? 'rgba(217,79,79,0.55)'
    : burnRatio > 0.65
      ? 'rgba(232,148,58,0.55)'
      : 'rgba(92,184,92,0.42)'

  return (
    <div className={styles.slot}>
      <div className={styles.slotBar}>
        <div className={styles.barBg} />
        <div
          className={styles.barFill}
          style={{ width: `${Math.floor(progress * 100)}%`, background: barColor }}
        />
        <div className={styles.barText}>
          <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
          <span className={styles.barItem}>{slot.target.replace(/_/g, ' ')}</span>
          <span className={styles.barRight} style={{ color: 'rgba(255,255,255,0.55)' }}>
            {Math.floor(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}

interface Props {
  station: StationType
  capacity: number
}

// Per-station accent border colours (fire overrides these)
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

  const hasActiveFire = station.slots.some(s => s.state === 'onFire')
  const borderColor = hasActiveFire ? '#cc2200' : (STATION_ACCENT[station.id] ?? def.color)

  return (
    <div className={`${styles.station} ${hasActiveFire ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>
        <span className={styles.stationEmoji}>{def.emoji}</span>
        <span className={styles.stationName}>{def.name}</span>
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
