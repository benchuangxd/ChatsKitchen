import { useEffect, useState } from 'react'
import { AudioSettings, GameOptions } from '../state/types'
import { RECIPES } from '../data/recipes'
import styles from './OptionsScreen.module.css'

interface Props {
  options: GameOptions
  onChange: (options: GameOptions) => void
  audioSettings: AudioSettings
  onAudioChange: (settings: AudioSettings) => void
  onResetAll: () => void
  onBack: () => void
}

const SPEED_PRESETS = [0.5, 0.75, 1, 1.5, 2]
const DURATION_PRESETS = [
  { label: '1 min', value: 60000 },
  { label: '2 min', value: 120000 },
  { label: '3 min', value: 180000 },
  { label: '5 min', value: 300000 },
]

export default function OptionsScreen({ options, onChange, audioSettings, onAudioChange, onResetAll, onBack }: Props) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetComplete, setResetComplete] = useState(false)

  useEffect(() => {
    if (!resetComplete) return
    const timeout = window.setTimeout(() => {
      setResetComplete(false)
      onBack()
    }, 1100)

    return () => window.clearTimeout(timeout)
  }, [resetComplete, onBack])

  const handleConfirmReset = () => {
    onResetAll()
    setConfirmOpen(false)
    setResetComplete(true)
  }

  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={onBack}>{'\u{2190}'} Back</button>
      <h1 className={styles.title}>Options</h1>
      <div className={styles.subtitle}>These options affect Free Play only. Levels have fixed parameters.</div>

      <div className={styles.columns}>
        <div className={styles.column}>
          <div className={styles.section}>
            <div className={styles.label}>Cooking Speed</div>
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
            <div className={styles.hint}>
              Higher = faster cooking and plating
            </div>
          </div>

          <div className={styles.section}>
            <div className={styles.label}>Order Speed</div>
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
            <div className={styles.hint}>
              Higher = less time to fulfill orders
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
        </div>

        <div className={styles.column}>
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

          <div className={styles.section}>
            <div className={styles.label}>Active Recipes</div>
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
                    {recipe.emoji} {recipe.name} <span className={styles.recipeReward}>${recipe.reward}</span>
                  </button>
                )
              })}
            </div>
            <div className={styles.hint}>Only selected recipes will appear as orders in Free Play</div>
          </div>

          <div className={styles.section}>
            <div className={styles.label}>Audio</div>
            <div className={styles.sliderGrid}>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>Music</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(audioSettings.musicVolume * 100)}
                  onChange={e => onAudioChange({ ...audioSettings, musicVolume: Number(e.target.value) / 100 })}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{Math.round(audioSettings.musicVolume * 100)}%</span>
                <button
                  className={`${styles.muteBtn} ${audioSettings.musicMuted ? styles.muteBtnActive : ''}`}
                  onClick={() => onAudioChange({ ...audioSettings, musicMuted: !audioSettings.musicMuted })}
                >
                  {audioSettings.musicMuted ? 'OFF' : 'ON'}
                </button>
              </div>
              <div className={styles.sliderRow}>
                <span className={styles.sliderLabel}>SFX</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={Math.round(audioSettings.sfxVolume * 100)}
                  onChange={e => onAudioChange({ ...audioSettings, sfxVolume: Number(e.target.value) / 100 })}
                  className={styles.slider}
                />
                <span className={styles.sliderValue}>{Math.round(audioSettings.sfxVolume * 100)}%</span>
                <button
                  className={`${styles.muteBtn} ${audioSettings.sfxMuted ? styles.muteBtnActive : ''}`}
                  onClick={() => onAudioChange({ ...audioSettings, sfxMuted: !audioSettings.sfxMuted })}
                >
                  {audioSettings.sfxMuted ? 'OFF' : 'ON'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.resetSection}>
        <button className={styles.resetBtn} onClick={() => setConfirmOpen(true)}>
          Reset Everything To Default
        </button>
        <div className={styles.resetHint}>
          Clears free play settings, audio settings, level progress, and tutorial prompt preferences.
        </div>
      </div>

      {confirmOpen && (
        <div className={styles.overlay}>
          <div className={styles.dialog}>
            <div className={styles.dialogTitle}>Reset Everything?</div>
            <div className={styles.dialogText}>
              This will clear your saved stars, audio preferences, free play settings, and tutorial flags.
            </div>
            <div className={styles.dialogActions}>
              <button className={styles.dialogCancelBtn} onClick={() => setConfirmOpen(false)}>
                Cancel
              </button>
              <button className={styles.dialogConfirmBtn} onClick={handleConfirmReset}>
                Yes, Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {resetComplete && (
        <div className={styles.overlay}>
          <div className={`${styles.dialog} ${styles.successDialog}`}>
            <div className={styles.dialogTitle}>Everything Reset</div>
            <div className={styles.dialogText}>
              Defaults restored. Taking you back to the main menu.
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
