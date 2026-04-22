import { useState } from 'react'
import { GameOptions } from '../state/types'
import { RECIPES, RECIPE_SETS, STATION_DEFS } from '../data/recipes'
import { EVENT_DEFS } from '../data/kitchenEventDefs'
import FoodIcon from './FoodIcon'
import styles from './FreePlaySetup.module.css'

function fmtIngredient(s: string) {
  return s.replace(/_/g, ' ')
}

interface Props {
  options: GameOptions
  onChange: (options: GameOptions) => void
  onStart: () => void
  onBack: () => void
}

const DURATION_MIN = 60000
const DURATION_MAX = 540000  // 9 min = 3× the 3 min default

const SPEED_MIN = 0.25
const SPEED_MAX = 3
const SPEED_STEP = 0.25

const formatSpeed = (v: number) => parseFloat(v.toFixed(2)).toString()
const parseSpeed = (s: string) => { const n = parseFloat(s); return isNaN(n) ? null : n }

interface SliderFieldProps {
  value: number
  min: number
  max: number
  step: number
  format: (v: number) => string
  parse: (s: string) => number | null
  onChange: (v: number) => void
  suffix?: string
}

function SliderField({ value, min, max, step, format, parse, onChange, suffix }: SliderFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)

  const commit = (raw: string) => {
    const parsed = parse(raw)
    if (parsed !== null && parsed >= min && parsed <= max) {
      onChange(parsed)
    }
    setDraft(null)
  }

  return (
    <div className={styles.sliderField}>
      <input
        type="range"
        className={styles.slider}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
          setDraft(null)
          onChange(Number(e.target.value))
        }}
      />
      <div className={styles.inputWrap}>
        <input
          type="text"
          className={styles.numInput}
          value={draft !== null ? draft : format(value)}
          onChange={e => setDraft(e.target.value)}
          onBlur={e => commit(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit((e.target as HTMLInputElement).value)
          }}
        />
        {suffix && <span className={styles.inputSuffix}>{suffix}</span>}
      </div>
    </div>
  )
}

export default function FreePlaySetup({ options, onChange, onStart, onBack }: Props) {
  const [moreOpen, setMoreOpen] = useState(false)
  const [startWarning, setStartWarning] = useState(false)
  const [hoveredRecipe, setHoveredRecipe] = useState<string | null>(null)

  return (
    <div className={styles.screen}>
      <div className={styles.leftCol}>
        <button className={styles.backBtn} onClick={onBack}>{'\u{2190}'} Back</button>
        <h1 className={styles.title}>Customize Your Shift</h1>

        <div className={styles.card}>
          <div className={styles.cardLabel}>⏱ Duration</div>
          <SliderField
            value={options.shiftDuration}
            min={DURATION_MIN}
            max={DURATION_MAX}
            step={DURATION_MIN}
            format={v => String(v / 60000)}
            parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n * 60000 }}
            onChange={v => onChange({ ...options, shiftDuration: v })}
            suffix="min"
          />
        </div>

        <button
          className={styles.moreToggle}
          onClick={() => setMoreOpen(o => !o)}
        >
          {moreOpen ? '▲' : '▼'} More Options
        </button>

        {moreOpen && !hoveredRecipe && (
          <div className={styles.moreSection}>
            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>⚡ Cooking Speed</div>
              <SliderField
                value={options.cookingSpeed}
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                format={formatSpeed}
                parse={parseSpeed}
                onChange={v => onChange({ ...options, cookingSpeed: v })}
                suffix="x"
              />
              <div className={styles.hint}>Higher = faster cooking</div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>📋 Order Urgency</div>
              <SliderField
                value={options.orderSpeed}
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                format={formatSpeed}
                parse={parseSpeed}
                onChange={v => onChange({ ...options, orderSpeed: v })}
                suffix="x"
              />
              <div className={styles.hint}>Higher = less time to fulfill orders</div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>🌊 Order Frequency</div>
              <SliderField
                value={options.orderSpawnRate}
                min={SPEED_MIN}
                max={SPEED_MAX}
                step={SPEED_STEP}
                format={formatSpeed}
                parse={parseSpeed}
                onChange={v => onChange({ ...options, orderSpawnRate: v })}
                suffix="x"
              />
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

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>🔄 Auto-Restart</div>
              <div className={styles.slotsRow}>
                <span className={styles.slotsLabel}>Restart after round ends</span>
                <button
                  className={`${styles.toggleBtn} ${options.autoRestart ? styles.toggleBtnOn : ''}`}
                  onClick={() => onChange({ ...options, autoRestart: !options.autoRestart })}
                >
                  {options.autoRestart ? 'ON' : 'OFF'}
                </button>
              </div>
              {options.autoRestart && (
                <SliderField
                  value={options.autoRestartDelay}
                  min={10}
                  max={300}
                  step={10}
                  format={v => String(v)}
                  parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                  onChange={v => onChange({ ...options, autoRestartDelay: v })}
                  suffix="s"
                />
              )}
              <div className={styles.hint}>
                {options.autoRestart
                  ? 'Automatically starts a new round after the countdown on the game over screen'
                  : 'Game over screen will wait for manual input'}
              </div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>🍳 Kitchen Events</div>
              <div className={styles.slotsRow}>
                <span className={styles.slotsLabel}>Random events during gameplay</span>
                <button
                  className={`${styles.toggleBtn} ${options.kitchenEventsEnabled ? styles.toggleBtnOn : ''}`}
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
                  <div className={styles.hint}>Event frequency (seconds between spawns)</div>
                  <div className={styles.eventFreqGrid}>
                    <div>
                      <div className={styles.freqLabel}>MIN</div>
                      <SliderField
                        value={options.kitchenEventSpawnMin}
                        min={5}
                        max={300}
                        step={5}
                        format={v => String(v)}
                        parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                        onChange={v => onChange({ ...options, kitchenEventSpawnMin: v })}
                        suffix="s"
                      />
                    </div>
                    <div>
                      <div className={styles.freqLabel}>MAX</div>
                      <SliderField
                        value={options.kitchenEventSpawnMax}
                        min={5}
                        max={300}
                        step={5}
                        format={v => String(v)}
                        parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                        onChange={v => onChange({ ...options, kitchenEventSpawnMax: v })}
                        suffix="s"
                      />
                    </div>
                  </div>
                  {options.kitchenEventSpawnMin >= options.kitchenEventSpawnMax && (
                    <div className={styles.hint} style={{ color: '#e8943a' }}>
                      ⚠ Min ≥ Max — fixed interval of {options.kitchenEventSpawnMin}s will be used
                    </div>
                  )}
                </>
              )}
              {!options.kitchenEventsEnabled && (
                <div className={styles.hint}>Enable to configure event types and frequency</div>
              )}
            </div>
          </div>
        )}

        {/* ── Recipe detail panel ── */}
        {hoveredRecipe && (() => {
          const recipe = RECIPES[hoveredRecipe]
          if (!recipe) return null
          return (
            <div className={styles.recipeDetail}>
              <div className={styles.recipeDetailHeader}>
                <FoodIcon icon={recipe.emoji} size={24} />
                <span className={styles.recipeDetailName}>{recipe.name}</span>
                <span className={styles.recipeDetailReward}>${recipe.reward}</span>
              </div>
              <div className={styles.recipeDetailSteps}>
                {recipe.steps.map((step, i) => {
                  const station = STATION_DEFS[step.station]
                  return (
                    <div key={i} className={styles.recipeDetailStep}>
                      <span className={styles.stepNum}>{i + 1}.</span>
                      {step.requires && (
                        <span className={styles.stepRequires}>needs {fmtIngredient(step.requires)} →</span>
                      )}
                      <span className={styles.stepStation}>{station?.emoji}</span>
                      <code className={styles.stepCmd}>!{step.action} {step.target}</code>
                      <span className={styles.stepArrow}>→</span>
                      <span className={styles.stepProduces}>{fmtIngredient(step.produces)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
      </div>

      <div className={styles.rightCol}>
        <div className={styles.cardLabel}>🍽️ Recipes</div>

        {/* ── Selected panel ── */}
        <div className={styles.selectedPanel}>
          <div className={styles.selectedHeader}>
            <span className={styles.selectedLabel}>Selected ({options.enabledRecipes.length})</span>
            <div className={styles.selectedActions}>
              <button
                className={styles.actionBtn}
                onClick={() => onChange({ ...options, enabledRecipes: [] })}
              >Remove All</button>
              <button
                className={styles.actionBtn}
                onClick={() => onChange({ ...options, enabledRecipes: Object.keys(RECIPES) })}
              >Select All</button>
              <button
                className={`${styles.actionBtn} ${styles.actionBtnRandom}`}
                onClick={() => {
                  const all = Object.keys(RECIPES)
                  const shuffled = [...all].sort(() => Math.random() - 0.5)
                  onChange({ ...options, enabledRecipes: shuffled.slice(0, 3) })
                }}
              >Random 3</button>
            </div>
          </div>
          <div className={styles.selectedChips}>
            {options.enabledRecipes.length === 0 ? (
              <span className={styles.selectedEmpty}>No recipes selected</span>
            ) : (
              options.enabledRecipes.map(key => {
                const recipe = RECIPES[key]
                if (!recipe) return null
                return (
                  <div key={key} className={styles.selectedChip}>
                    <FoodIcon icon={recipe.emoji} size={16} />
                    <span className={styles.selectedChipName}>{recipe.name}</span>
                    <button
                      className={styles.selectedChipRemove}
                      onClick={() => onChange({ ...options, enabledRecipes: options.enabledRecipes.filter(r => r !== key) })}
                    >×</button>
                  </div>
                )
              })
            )}
          </div>
        </div>

        <div className={styles.recipeScroll}>
        {(() => {
          const allSetKeys = new Set(RECIPE_SETS.flatMap(s => s.recipeKeys))
          const orphanKeys = Object.keys(RECIPES).filter(k => !allSetKeys.has(k))

          const renderRecipeBtn = (key: string) => {
            const recipe = RECIPES[key]
            if (!recipe) return null
            const isEnabled = options.enabledRecipes.includes(key)
            return (
              <button
                key={key}
                className={`${styles.recipeBtn} ${isEnabled ? styles.active : ''}`}
                onClick={() => {
                  const next = isEnabled
                    ? options.enabledRecipes.filter(r => r !== key)
                    : [...options.enabledRecipes, key]
                  onChange({ ...options, enabledRecipes: next })
                }}
                onMouseEnter={() => setHoveredRecipe(key)}
                onMouseLeave={() => setHoveredRecipe(null)}
              >
                <FoodIcon icon={recipe.emoji} size={22} className={styles.recipeEmoji} />
                <span className={styles.recipeName}>{recipe.name}</span>
                <span className={styles.recipeReward}>${recipe.reward}</span>
              </button>
            )
          }

          const renderSection = (label: string, flag: string | null, keys: string[]) => {
            const validKeys = keys.filter(k => RECIPES[k])
            if (validKeys.length === 0) return null
            const enabledCount = validKeys.filter(k => options.enabledRecipes.includes(k)).length
            const allOn = enabledCount === validKeys.length
            const toggleAll = () => {
              if (allOn) {
                const next = options.enabledRecipes.filter(k => !validKeys.includes(k))
                onChange({ ...options, enabledRecipes: next })
              } else {
                const next = [...new Set([...options.enabledRecipes, ...validKeys])]
                onChange({ ...options, enabledRecipes: next })
              }
            }
            return (
              <div key={label} className={styles.setSection}>
                <div className={styles.setSectionHeader}>
                  <span className={styles.setSectionLabel}>
                    {flag && <span className={styles.setSectionFlag}>{flag}</span>}
                    {label}
                  </span>
                  <button
                    className={`${styles.setSectionToggle} ${allOn ? styles.setSectionToggleOn : ''}`}
                    onClick={toggleAll}
                  >
                    {allOn ? '✓ All' : `${enabledCount}/${validKeys.length}`}
                  </button>
                </div>
                <div className={styles.recipeGrid}>
                  {validKeys.map(renderRecipeBtn)}
                </div>
              </div>
            )
          }

          return (
            <>
              {RECIPE_SETS.map(set => renderSection(set.name, set.flag, set.recipeKeys))}
              {renderSection('Others', null, orphanKeys)}
            </>
          )
        })()}

        <div className={styles.hint}>Only selected recipes will appear as orders</div>
        </div>

        <div className={styles.footer}>
          <div className={styles.startWarning} style={{ visibility: startWarning ? 'visible' : 'hidden' }}>
            Select at least one recipe to start.
          </div>
          <button
            className={styles.startBtn}
            onClick={() => {
              if (options.enabledRecipes.length === 0) {
                setStartWarning(true)
              } else {
                setStartWarning(false)
                onStart()
              }
            }}
          >
            ▶ Start Shift!
          </button>
        </div>
      </div>
    </div>
  )
}
