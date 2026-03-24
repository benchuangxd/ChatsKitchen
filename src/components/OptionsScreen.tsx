import { GameOptions } from '../state/types'
import styles from './OptionsScreen.module.css'

interface Props {
  options: GameOptions
  onChange: (options: GameOptions) => void
  onBack: () => void
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.5, 2]
const DURATION_PRESETS = [
  { label: '1 min', value: 60000 },
  { label: '2 min', value: 120000 },
  { label: '3 min', value: 180000 },
  { label: '5 min', value: 300000 },
]

export default function OptionsScreen({ options, onChange, onBack }: Props) {
  return (
    <div className={styles.screen}>
      <h1 className={styles.title}>Options</h1>

      <div className={styles.section}>
        <div className={styles.label}>Game Speed</div>
        <div className={styles.presets}>
          {SPEED_PRESETS.map(speed => (
            <button
              key={speed}
              className={`${styles.preset} ${options.durationMultiplier === speed ? styles.active : ''}`}
              onClick={() => onChange({ ...options, durationMultiplier: speed })}
            >
              {speed}x
            </button>
          ))}
        </div>
        <div className={styles.hint}>
          Higher = faster cooking, faster orders
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Round Duration</div>
        <div className={styles.presets}>
          {DURATION_PRESETS.map(({ label, value }) => (
            <button
              key={value}
              className={`${styles.preset} ${options.shiftDuration === value ? styles.active : ''}`}
              onClick={() => onChange({ ...options, shiftDuration: value })}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.label}>Station Slots</div>
        <div className={styles.capacityGrid}>
          {([
            { key: 'chopping' as const, label: '\u{1F52A} Chopping' },
            { key: 'cooking' as const, label: '\u{1F525} Cooking' },
            { key: 'plating' as const, label: '\u{1F37D}\u{FE0F} Plating' },
          ]).map(({ key, label }) => (
            <div key={key} className={styles.capacityRow}>
              <span className={styles.capacityLabel}>{label}</span>
              <div className={styles.capacityControl}>
                <button
                  className={styles.capacityBtn}
                  onClick={() => onChange({
                    ...options,
                    stationCapacity: { ...options.stationCapacity, [key]: Math.max(1, options.stationCapacity[key] - 1) }
                  })}
                >-</button>
                <span className={styles.capacityValue}>{options.stationCapacity[key]}</span>
                <button
                  className={styles.capacityBtn}
                  onClick={() => onChange({
                    ...options,
                    stationCapacity: { ...options.stationCapacity, [key]: Math.min(8, options.stationCapacity[key] + 1) }
                  })}
                >+</button>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.hint}>
          Slots per station type (cooking applies to each: grill, fryer, stove, oven)
        </div>
      </div>

      <button className={styles.backBtn} onClick={onBack}>Back</button>
    </div>
  )
}
