import { useState } from 'react'
import { GameOptions } from '../state/types'
import { RECIPES } from '../data/recipes'
import styles from './FreePlaySetup.module.css'

interface Props {
  options: GameOptions
  onChange: (options: GameOptions) => void
  onStart: () => void
  onBack: () => void
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.5, 2]
const DURATION_PRESETS = [
  { label: '1 min', value: 60000 },
  { label: '2 min', value: 120000 },
  { label: '3 min', value: 180000 },
  { label: '5 min', value: 300000 },
]

export default function FreePlaySetup({ options, onChange, onStart, onBack }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={onBack}>{'\u{2190}'} Back</button>
      <h1 className={styles.title}>Customize Your Shift</h1>

      <div className={styles.content}>
        <div className={styles.card}>
          <div className={styles.cardLabel}>⏱ Duration</div>
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

        <div className={styles.card}>
          <div className={styles.cardLabel}>🍽️ Recipes</div>
          <div className={styles.recipeGrid}>
            {Object.entries(RECIPES).map(([key, recipe]) => {
              const isEnabled = options.enabledRecipes.includes(key)
              const isLast = options.enabledRecipes.length === 1 && isEnabled
              return (
                <button
                  key={key}
                  className={`${styles.recipeBtn} ${isEnabled ? styles.active : ''}`}
                  disabled={isLast}
                  onClick={() => {
                    const next = isEnabled
                      ? options.enabledRecipes.filter(r => r !== key)
                      : [...options.enabledRecipes, key]
                    onChange({ ...options, enabledRecipes: next })
                  }}
                >
                  <span className={styles.recipeEmoji}>{recipe.emoji}</span>
                  <span className={styles.recipeName}>{recipe.name}</span>
                  <span className={styles.recipeReward}>${recipe.reward}</span>
                </button>
              )
            })}
          </div>
          <div className={styles.hint}>Only selected recipes will appear as orders</div>
        </div>

        <button
          className={styles.moreToggle}
          onClick={() => setMoreOpen(o => !o)}
        >
          {moreOpen ? '▲' : '▼'} More Options
        </button>

        {moreOpen && (
          <div className={styles.moreSection}>
            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>⚡ Cooking Speed</div>
              <div className={styles.presets}>
                {SPEED_PRESETS.map(speed => (
                  <button
                    key={speed}
                    className={`${styles.preset} ${options.cookingSpeed === speed ? styles.active : ''}`}
                    onClick={() => onChange({ ...options, cookingSpeed: speed })}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <div className={styles.hint}>Higher = faster cooking</div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>📋 Order Urgency</div>
              <div className={styles.presets}>
                {SPEED_PRESETS.map(speed => (
                  <button
                    key={speed}
                    className={`${styles.preset} ${options.orderSpeed === speed ? styles.active : ''}`}
                    onClick={() => onChange({ ...options, orderSpeed: speed })}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <div className={styles.hint}>Higher = less time to fulfill orders</div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>🌊 Order Frequency</div>
              <div className={styles.presets}>
                {SPEED_PRESETS.map(speed => (
                  <button
                    key={speed}
                    className={`${styles.preset} ${options.orderSpawnRate === speed ? styles.active : ''}`}
                    onClick={() => onChange({ ...options, orderSpawnRate: speed })}
                  >
                    {speed}x
                  </button>
                ))}
              </div>
              <div className={styles.hint}>Higher = orders arrive more frequently</div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>🔧 Station Slots</div>
              <div className={styles.slotsRow}>
                <span className={styles.slotsLabel}>Restrict Slots</span>
                <button
                  className={`${styles.toggleBtn} ${options.restrictSlots ? styles.toggleBtnOn : ''}`}
                  onClick={() => onChange({ ...options, restrictSlots: !options.restrictSlots })}
                >
                  {options.restrictSlots ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className={`${styles.capacityGrid} ${!options.restrictSlots ? styles.dimmed : ''}`}>
                {([
                  { key: 'chopping' as const, label: '🔪 Chopping' },
                  { key: 'cooking' as const, label: '🍳 Cooking' },
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
                {options.restrictSlots
                  ? 'Slots per station type (cooking applies to each: grill, fryer, stove, oven)'
                  : 'Slot restrictions are off — stations have unlimited slots'}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button className={styles.startBtn} onClick={onStart}>
          ▶ Start Shift!
        </button>
      </div>
    </div>
  )
}
