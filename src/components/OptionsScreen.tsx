import { useEffect, useState } from 'react'
import { AudioSettings, GameOptions } from '../state/types'
import { EVENT_DEFS } from '../data/kitchenEventDefs'
import styles from './OptionsScreen.module.css'

interface Props {
  options: GameOptions
  onChange: (options: GameOptions) => void
  audioSettings: AudioSettings
  onAudioChange: (settings: AudioSettings) => void
  onResetAll: () => void
  onBack: () => void
}

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

      <div className={styles.columns}>
          <div className={styles.column}>
            <div className={styles.section}>
              <div className={styles.label}>Audio</div>
              <div className={styles.sliderGrid}>
                <div className={styles.sliderRow}>
                  <span className={styles.sliderLabel}>Master</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(audioSettings.masterVolume * 100)}
                    onChange={e => onAudioChange({ ...audioSettings, masterVolume: Number(e.target.value) / 100 })}
                    className={styles.slider}
                  />
                  <span className={styles.sliderValue}>{Math.round(audioSettings.masterVolume * 100)}%</span>
                  <div className={styles.sliderMuteSpacer} />
                </div>
                <div className={styles.sliderDivider} />
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
                <div className={styles.sliderDivider} />
                <div className={styles.trackGrid}>
                  {([
                    { key: 'menu' as const, label: 'Menu' },
                    { key: 'gameplay' as const, label: 'Gameplay' },
                    { key: 'gameover' as const, label: 'Game Over' },
                  ]).map(({ key, label }) => {
                    const enabled = audioSettings.trackEnabled[key]
                    return (
                      <div key={key} className={styles.trackRow}>
                        <span className={styles.trackLabel}>{label}</span>
                        <button
                          className={`${styles.muteBtn} ${enabled ? styles.trackBtnOn : ''}`}
                          onClick={() => onAudioChange({
                            ...audioSettings,
                            trackEnabled: { ...audioSettings.trackEnabled, [key]: !enabled }
                          })}
                        >
                          {enabled ? 'ON' : 'OFF'}
                        </button>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className={styles.column}>
            <div className={styles.section}>
              <div className={styles.label}>Appearance</div>
              <div className={styles.capacityRow}>
                <span className={styles.capacityLabel}>Theme</span>
                <button
                  className={`${styles.themeToggle} ${audioSettings.darkMode ? styles.themeToggleDark : styles.themeToggleLight}`}
                  onClick={() => onAudioChange({ ...audioSettings, darkMode: !audioSettings.darkMode })}
                >
                  {audioSettings.darkMode ? '🌙 Dark' : '☀️ Light'}
                </button>
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.shortformHeader}>
                <div className={styles.label} style={{ marginBottom: 0 }}>Shortform Commands</div>
                <button
                  className={`${styles.muteBtn} ${options.allowShortformCommands ? styles.muteBtnActive : ''}`}
                  onClick={() => onChange({ ...options, allowShortformCommands: !options.allowShortformCommands })}
                >
                  {options.allowShortformCommands ? 'ON' : 'OFF'}
                </button>
              </div>
              <div className={`${styles.shortformGrid} ${options.allowShortformCommands ? '' : styles.shortformDimmed}`}>
                {([
                  ['c', 'chop'], ['g', 'grill'], ['f', 'fry'], ['b', 'boil'],
                  ['t', 'toast'], ['r', 'roast'], ['st', 'stir'], ['sm', 'steam'],
                  ['si', 'simmer'], ['ck', 'cook'], ['cl', 'cool'], ['s', 'serve'],
                ] as [string, string][]).map(([alias, cmd]) => (
                  <div key={alias} className={styles.shortformEntry}>
                    <span className={styles.shortformAlias}>!{alias}</span>
                    <span className={styles.shortformCmd}>{cmd}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className={styles.section}>
              <div className={styles.shortformHeader}>
                <div className={styles.label} style={{ marginBottom: 0 }}>Kitchen Events</div>
                <button
                  className={`${styles.muteBtn} ${options.kitchenEventsEnabled ? styles.muteBtnActive : ''}`}
                  onClick={() => onChange({ ...options, kitchenEventsEnabled: !options.kitchenEventsEnabled })}
                >
                  {options.kitchenEventsEnabled ? 'ON' : 'OFF'}
                </button>
              </div>
              {options.kitchenEventsEnabled && (
                <>
                  <div className={styles.eventGrid}>
                    {EVENT_DEFS.map(def => {
                      const on = options.enabledKitchenEvents.includes(def.type)
                      return (
                        <button
                          key={def.type}
                          className={`${styles.eventChip} ${on ? styles.eventChipOn : ''}`}
                          onClick={() => {
                            const next = on
                              ? options.enabledKitchenEvents.filter(t => t !== def.type)
                              : [...options.enabledKitchenEvents, def.type]
                            onChange({ ...options, enabledKitchenEvents: next })
                          }}
                        >
                          {def.emoji} {def.label}
                        </button>
                      )
                    })}
                  </div>
                  <div className={styles.sliderLabel} style={{ marginTop: 10 }}>Frequency range (seconds between events)</div>
                  <div className={styles.sliderRow}>
                    <span className={styles.sliderLabel}>Min</span>
                    <input
                      type="range"
                      className={styles.slider}
                      min={5}
                      max={300}
                      step={5}
                      value={options.kitchenEventSpawnMin}
                      onChange={e => onChange({ ...options, kitchenEventSpawnMin: Number(e.target.value) })}
                    />
                    <span className={styles.sliderValue}>{options.kitchenEventSpawnMin}s</span>
                  </div>
                  <div className={styles.sliderRow}>
                    <span className={styles.sliderLabel}>Max</span>
                    <input
                      type="range"
                      className={styles.slider}
                      min={5}
                      max={300}
                      step={5}
                      value={options.kitchenEventSpawnMax}
                      onChange={e => onChange({ ...options, kitchenEventSpawnMax: Number(e.target.value) })}
                    />
                    <span className={styles.sliderValue}>{options.kitchenEventSpawnMax}s</span>
                  </div>
                </>
              )}
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
