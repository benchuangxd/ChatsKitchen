# Dynamic Star System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a 3-tier Overcooked-style star rating to Free Play that dynamically computes money thresholds from game settings, visible live on the setup screen, during gameplay, and on game over.

**Architecture:** A pure `computeStarThresholds(options)` function models theoretical max revenue from shift duration, speeds, recipes, player count, and events. Thresholds are computed at game start in `App.tsx`, stored in state, and threaded as optional props to `BottomBar` (live indicator during play) and `GameOver` (final star display). `FreePlaySetup` calls `computeStarThresholds` locally on every render for a live preview. Stars are Free Play only — Adventure mode and PvP mode receive `starThresholds={undefined}`.

**Tech Stack:** React 18, TypeScript, CSS Modules — no new libraries.

---

## File Map

| File | Action | What changes |
|------|--------|-------------|
| `src/data/starThresholds.ts` | **Create** | `computeStarThresholds()` + `getStarCount()` pure functions |
| `src/state/types.ts` | Modify | Add `expectedPlayers` to `GameOptions`; export `RoundRecord` with `playerCount` |
| `src/state/defaultOptions.ts` | Modify | Add `expectedPlayers: 10` |
| `src/App.tsx` | Modify | `starThresholds` state; compute at game start; `playerCount` in history; thread props |
| `src/components/FreePlaySetup.tsx` | Modify | `roundHistory` prop; Expected Players slider; threshold preview block |
| `src/components/FreePlaySetup.module.css` | Modify | Styles for threshold preview |
| `src/components/BottomBar.tsx` | Modify | `starThresholds` prop; live star indicator |
| `src/components/BottomBar.module.css` | Modify | Styles for star indicator |
| `src/components/GameOver.tsx` | Modify | Replace local `RoundRecord` with exported type; `starThresholds` prop; star display |
| `src/components/GameOver.module.css` | Modify | Styles for star display |

---

## Task 1: Algorithm — `src/data/starThresholds.ts`

**Files:**
- Create: `src/data/starThresholds.ts`

Pure revenue-model functions. No React, no side-effects.

**How the algorithm works (summary for implementer):**

1. From `enabledRecipes`, compute `avgReward`, `avgCookTime` (sum of all step durations per recipe), `avgPatience`
2. `totalSpawnableOrders = shiftDuration / (14000 / orderSpawnRate)` — 14 s is the base wave-0 spawn interval
3. `patienceFactor` — drops when patience shrinks close to cook time + 8 s reaction overhead; clamped [0.15, 1.0]
4. `stationSlots` — sum of slot limits for all station types needed by enabled recipes (`cutting_board` uses `stationCapacity.chopping`, everything else uses `stationCapacity.cooking`)
5. `coordinationEfficiency = 0.20 + 0.75 × clamp(expectedPlayers / stationSlots, 0, 1)` — floor 0.20 (solo), ceiling 0.95 (full coverage)
6. `theoreticalMax = totalSpawnableOrders × avgReward × patienceFactor × coordinationEfficiency`
7. Event modifier: if events on and events selected, each hazard type −3%, each opportunity type +2%
8. `[1★, 2★, 3★] = [max × 0.40, max × 0.65, max × 0.88]` rounded to nearest $5

`getStarCount(money, thresholds)` simply returns 0–3 based on which thresholds `money` clears.

- [ ] **Step 1: Create `src/data/starThresholds.ts`**

```typescript
import { GameOptions, EventType } from '../state/types'
import { RECIPES, getEnabledStations } from './recipes'

const BASE_SPAWN_INTERVAL_MS = 14000
const REACTION_TIME_MS = 8000
const COORD_FLOOR = 0.20
const COORD_RANGE = 0.75  // ceiling = COORD_FLOOR + COORD_RANGE = 0.95

const HAZARD_TYPES: EventType[] = [
  'rat_invasion', 'angry_chef', 'power_trip', 'smoke_blast', 'glitched_orders',
]
const OPP_TYPES: EventType[] = [
  'chefs_chant', 'mystery_recipe', 'typing_frenzy', 'dance',
]

export function computeStarThresholds(options: GameOptions): [number, number, number] {
  const {
    shiftDuration, cookingSpeed, orderSpeed, orderSpawnRate,
    enabledRecipes, stationCapacity, expectedPlayers,
    kitchenEventsEnabled, enabledKitchenEvents,
  } = options

  const recipes = enabledRecipes.map(k => RECIPES[k]).filter(Boolean)
  if (recipes.length === 0) return [100, 200, 350]

  const avgReward = recipes.reduce((s, r) => s + r.reward, 0) / recipes.length
  const avgCookTime = recipes.reduce(
    (s, r) => s + r.steps.reduce((t, step) => t + step.duration, 0), 0
  ) / recipes.length
  const avgPatience = recipes.reduce((s, r) => s + r.patience, 0) / recipes.length

  const totalSpawnableOrders = shiftDuration / (BASE_SPAWN_INTERVAL_MS / orderSpawnRate)

  const effectiveCookTime = avgCookTime / cookingSpeed
  const effectivePatience = avgPatience / orderSpeed
  const completionTime = REACTION_TIME_MS + effectiveCookTime
  const patienceFactor = Math.min(1.0, Math.max(0.15, effectivePatience / (completionTime * 1.5)))

  // cutting_board, mixing_bowl, grinder, and knead_board all use stationCapacity.chopping
  // (matches the actual slot-limit logic in gameReducer.ts and Kitchen.tsx)
  const CHOPPING_CAPACITY_STATIONS = new Set(['cutting_board', 'mixing_bowl', 'grinder', 'knead_board'])
  const enabledStations = getEnabledStations(enabledRecipes)
  const stationSlots = enabledStations.reduce(
    (sum, id) => sum + (CHOPPING_CAPACITY_STATIONS.has(id) ? stationCapacity.chopping : stationCapacity.cooking),
    0
  )
  const playerFactor = Math.min(1.0, expectedPlayers / Math.max(1, stationSlots))
  const coordinationEfficiency = COORD_FLOOR + COORD_RANGE * playerFactor

  const theoreticalMax = totalSpawnableOrders * avgReward * patienceFactor * coordinationEfficiency

  let eventFactor = 1.0
  if (kitchenEventsEnabled && enabledKitchenEvents.length > 0) {
    const hazardCount = enabledKitchenEvents.filter(e => HAZARD_TYPES.includes(e)).length
    const oppCount = enabledKitchenEvents.filter(e => OPP_TYPES.includes(e)).length
    eventFactor = (1.0 - hazardCount * 0.03) * (1.0 + oppCount * 0.02)
  }

  const adjustedMax = theoreticalMax * eventFactor
  const round5 = (n: number) => Math.round(n / 5) * 5
  return [
    round5(adjustedMax * 0.40),
    round5(adjustedMax * 0.65),
    round5(adjustedMax * 0.88),
  ]
}

export function getStarCount(money: number, thresholds: [number, number, number]): number {
  if (money >= thresholds[2]) return 3
  if (money >= thresholds[1]) return 2
  if (money >= thresholds[0]) return 1
  return 0
}
```

- [ ] **Step 2: Commit**

```bash
git add src/data/starThresholds.ts
git commit -m "feat: add computeStarThresholds and getStarCount pure functions"
```

---

## Task 2: Type updates

**Files:**
- Modify: `src/state/types.ts`
- Modify: `src/state/defaultOptions.ts`

- [ ] **Step 1: Add `expectedPlayers` to `GameOptions` in `src/state/types.ts`**

Inside the `GameOptions` interface, add after `kitchenEventDuration`:

```typescript
  expectedPlayers: number
```

- [ ] **Step 2: Add `RoundRecord` export to `src/state/types.ts`**

Add after the `AdventureBestRun` interface:

```typescript
export interface RoundRecord {
  money: number
  served: number
  lost: number
  playerCount: number
}
```

- [ ] **Step 3: Add `expectedPlayers` default in `src/state/defaultOptions.ts`**

Add to `DEFAULT_GAME_OPTIONS`:

```typescript
  expectedPlayers: 10,
```

- [ ] **Step 4: Verify build**

```bash
npm run build
```

Expected: TypeScript will now surface errors wherever `GameOptions` is constructed without `expectedPlayers` (one location: existing localStorage parsing in `App.tsx` — the spread `{ ...DEFAULT_GAME_OPTIONS, ...parsed }` already handles it because `parsed` may be missing the key and `DEFAULT_GAME_OPTIONS` supplies the fallback). Note any other errors; they will be fixed in subsequent tasks.

- [ ] **Step 5: Commit**

```bash
git add src/state/types.ts src/state/defaultOptions.ts
git commit -m "feat: add expectedPlayers to GameOptions and export RoundRecord with playerCount"
```

---

## Task 3: `src/App.tsx` wiring

**Files:**
- Modify: `src/App.tsx`

Add `starThresholds` state, compute it at game start (Free Play only, not PvP or Adventure), record `playerCount` in round history, and pass new props to child components.

- [ ] **Step 1: Add imports**

Add `computeStarThresholds` to imports near the other data imports:
```typescript
import { computeStarThresholds } from './data/starThresholds'
```

Add `RoundRecord` to the types import line:
```typescript
import { AudioSettings, GameOptions, PlayerStats, AdventureRun, AdventureBestRun, ShiftResult, KitchenEvent, RoundRecord } from './state/types'
```

- [ ] **Step 2: Add `starThresholds` state**

After the `pvpLobby` and `pvpLobbyRef` declarations, add:

```typescript
const [starThresholds, setStarThresholds] = useState<[number, number, number] | null>(null)
```

- [ ] **Step 3: Update `freePlayHistory` state type**

Change the `freePlayHistory` state declaration from its current anonymous type to `RoundRecord[]`, and add a migration for old localStorage entries that lack `playerCount`:

```typescript
const [freePlayHistory, setFreePlayHistory] = useState<RoundRecord[]>(() => {
  try {
    const saved = localStorage.getItem('chatsKitchen_freePlayHistory')
    if (!saved) return []
    return (JSON.parse(saved) as Partial<RoundRecord>[]).map(r => ({
      money: r.money ?? 0,
      served: r.served ?? 0,
      lost: r.lost ?? 0,
      playerCount: r.playerCount ?? 0,
    }))
  } catch { return [] }
})
```

- [ ] **Step 4: Compute `starThresholds` in `startFreePlay`**

In `startFreePlay` (the `useCallback` that calls `dispatch({ type: 'RESET', ... })`), add before the `dispatch` call:

```typescript
// Stars only in non-PvP Free Play
setStarThresholds(pvpLobbyRef.current ? null : computeStarThresholds(gameOptions))
```

The `pvpLobbyRef` is already declared and kept in sync — reading `.current` here is safe inside a `useCallback`.

- [ ] **Step 5: Record `playerCount` in `handleGameOver`**

In `handleGameOver`, inside the `else` branch (Free Play history update), change:

```typescript
const updated = [{ money: s.money, served: s.served, lost: s.lost }, ...prev].slice(0, 5)
```

to:

```typescript
const updated: RoundRecord[] = [
  { money: s.money, served: s.served, lost: s.lost, playerCount: Object.keys(s.playerStats).length },
  ...prev,
].slice(0, 5)
```

- [ ] **Step 6: Pass `roundHistory` to `FreePlaySetup`**

Find the `<FreePlaySetup` JSX block (inside `screen === 'freeplaysetup'`) and add the prop:

```tsx
roundHistory={freePlayHistory}
```

- [ ] **Step 7: Pass `starThresholds` to `BottomBar`**

Find the `<BottomBar` JSX block (inside the `playing` screen layout) and add:

```tsx
starThresholds={starThresholds ?? undefined}
```

- [ ] **Step 8: Pass `starThresholds` to `GameOver`**

Find the `<GameOver` JSX block and add:

```tsx
starThresholds={starThresholds ?? undefined}
```

- [ ] **Step 9: Verify build**

```bash
npm run build
```

Expected: TypeScript errors for `roundHistory`, `starThresholds` not yet accepted by child component prop types — those are resolved in Tasks 4–6. All other errors should be gone.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire starThresholds and playerCount round history in App.tsx"
```

---

## Task 4: `FreePlaySetup` — Expected Players slider + threshold preview

**Files:**
- Modify: `src/components/FreePlaySetup.tsx`
- Modify: `src/components/FreePlaySetup.module.css`

The Expected Players slider goes in the More Options panel (left column). The threshold preview goes in the `footer` div in the right column, above the start warning and start button.

- [ ] **Step 1: Add imports and `roundHistory` prop**

At the top of `FreePlaySetup.tsx`, add:

```typescript
import { computeStarThresholds } from '../data/starThresholds'
import { RoundRecord } from '../state/types'
```

Add `roundHistory` to the `Props` interface:

```typescript
interface Props {
  options: GameOptions
  onChange: (options: GameOptions) => void
  onStart: () => void
  onBack: () => void
  twitchStatus: TwitchStatus
  twitchChannel: string | null
  roundHistory?: RoundRecord[]
}
```

Update the function signature destructuring to include `roundHistory`:

```typescript
export default function FreePlaySetup({ options, onChange, onStart, onBack, twitchStatus, twitchChannel, roundHistory }: Props) {
```

- [ ] **Step 2: Add Expected Players slider in the More Options section**

Inside the `moreOpen && !hoveredRecipe && !hoveredEvent` block (the `<div className={styles.moreSection}>` contents), add the following row **after the Auto-Restart row** and **before the closing `</div>` of `moreSection`**:

```tsx
<div className={styles.moreRow}>
  <div className={styles.moreLabel}>👥 Expected Players</div>
  <SliderField
    value={options.expectedPlayers}
    min={1}
    max={200}
    step={1}
    format={v => String(v)}
    parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
    onChange={v => onChange({ ...options, expectedPlayers: v })}
    suffix="players"
  />
  {roundHistory && roundHistory.length > 0 && (
    <div className={styles.hint}>
      Recent: {roundHistory.slice(0, 3).map(r => r.playerCount).join(' · ')} players
    </div>
  )}
  <div className={styles.hint}>Used to calibrate star thresholds — set to your typical active chat size</div>
</div>
```

- [ ] **Step 3: Add threshold preview in the footer**

Find the `<div className={styles.footer} style={{ padding: '0 0 8px 0' }}>` block at the bottom of the right column (the one containing `startWarning` and `startBtn`). **Replace the entire footer div** with the following:

```tsx
<div className={styles.footer} style={{ padding: '0 0 8px 0' }}>
  {/* ── Star threshold preview ── */}
  {(() => {
    if (options.enabledRecipes.length === 0) return null
    const thresholds = computeStarThresholds(options)
    return (
      <div className={styles.starPreview}>
        <div className={styles.starPreviewLabel}>Star Thresholds</div>
        <div className={styles.starPreviewRows}>
          {(['⭐', '⭐⭐', '⭐⭐⭐'] as const).map((stars, i) => (
            <div key={i} className={styles.starPreviewRow}>
              <span className={styles.starPreviewStars}>{stars}</span>
              <span className={styles.starPreviewValue}>${thresholds[i].toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  })()}

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
```

- [ ] **Step 4: Add CSS in `FreePlaySetup.module.css`**

Append to the end of the file:

```css
/* ── Star threshold preview ── */

.starPreview {
  background: var(--surface);
  border: 2px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px 10px;
  margin-bottom: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.starPreviewLabel {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.07em;
}

.starPreviewRows {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.starPreviewRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.starPreviewStars {
  font-size: 16px;
  letter-spacing: 1px;
}

.starPreviewValue {
  font-family: 'Lilita One', cursive;
  font-size: 19px;
  color: var(--text);
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: No TypeScript errors for `FreePlaySetup`. Remaining errors (if any) are in `BottomBar`/`GameOver` — fixed in Tasks 5–6.

- [ ] **Step 6: Commit**

```bash
git add src/components/FreePlaySetup.tsx src/components/FreePlaySetup.module.css
git commit -m "feat: add Expected Players slider and star threshold preview to FreePlaySetup"
```

---

## Task 5: `BottomBar` — Live star indicator

**Files:**
- Modify: `src/components/BottomBar.tsx`
- Modify: `src/components/BottomBar.module.css`

The existing `BottomBar` shows money, served, lost, Twitch status, and a settings hint. The star indicator is inserted between the `lost` stat and the `.right` div, only when `starThresholds` is provided.

- [ ] **Step 1: Update `BottomBar.tsx`**

Add import at top:

```typescript
import { getStarCount } from '../data/starThresholds'
```

Update the `Props` interface:

```typescript
interface Props {
  money: number
  served: number
  lost: number
  twitchStatus: TwitchStatus
  twitchChannel: string | null
  starThresholds?: [number, number, number]
}
```

Update function signature:

```typescript
export default function BottomBar({ money, served, lost, twitchStatus, twitchChannel, starThresholds }: Props) {
```

Inside the `<div className={styles.bar}>`, add the star indicator **after the `lost` stat's closing `</div>` and its following `<div className={styles.divider} />`**, and **before** `<div className={styles.right}>`:

```tsx
{starThresholds && (() => {
  const stars = getStarCount(money, starThresholds)
  const starStr = '★'.repeat(stars) + '☆'.repeat(3 - stars)
  const nextThreshold = stars < 3 ? starThresholds[stars] : null
  return (
    <>
      <div className={styles.divider} />
      <div className={styles.starIndicator}>
        <span className={styles.starIcons}>{starStr}</span>
        {nextThreshold !== null ? (
          <span className={styles.starNext}>→ ${nextThreshold.toLocaleString()}</span>
        ) : (
          <span className={styles.starNext}>🎉</span>
        )}
      </div>
    </>
  )
})()}
```

- [ ] **Step 2: Add CSS in `BottomBar.module.css`**

Append to the file:

```css
.starIndicator {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 14px;
}

.starIcons {
  font-size: 20px;
  color: #f0c850;
  letter-spacing: 1px;
}

.starNext {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  color: #6a6258;
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/BottomBar.tsx src/components/BottomBar.module.css
git commit -m "feat: add live star indicator to BottomBar"
```

---

## Task 6: `GameOver` — Final star display

**Files:**
- Modify: `src/components/GameOver.tsx`
- Modify: `src/components/GameOver.module.css`

Replace the local `RoundRecord` definition with the exported type from `types.ts`, add `starThresholds` prop, and render a prominent star display in the left column above the money/served/lost stats.

- [ ] **Step 1: Update imports in `GameOver.tsx`**

Remove the local `RoundRecord` interface (the one at the top of the file with `money`, `served`, `lost`).

Change the existing types import to include `RoundRecord`:

```typescript
import { PlayerStats, RoundRecord } from '../state/types'
```

Add the star helper import:

```typescript
import { getStarCount } from '../data/starThresholds'
```

- [ ] **Step 2: Add `starThresholds` to the `Props` interface**

```typescript
interface Props {
  money: number
  served: number
  lost: number
  playerStats: Record<string, PlayerStats>
  level: number | null
  highScore?: number
  isNewHighScore?: boolean
  roundHistory?: RoundRecord[]
  autoRestart?: boolean
  autoRestartDelay?: number
  autoRestartSignal?: number
  pvpResult?: PvpResult
  starThresholds?: [number, number, number]
  onPlayAgain: () => void
  onNextLevel?: () => void
  onMenu: () => void
  onRecipeSelect?: () => void
}
```

Update the function signature destructuring to include `starThresholds`:

```typescript
export default function GameOver({ money, served, lost, playerStats, level, highScore, isNewHighScore, roundHistory, autoRestart, autoRestartDelay, autoRestartSignal, pvpResult, starThresholds, onPlayAgain, onNextLevel, onMenu, onRecipeSelect }: Props) {
```

- [ ] **Step 3: Add star display JSX in the left column**

In the left column, **after the PvP banner block** and **before** `<h1 className={styles.title}>`, add:

```tsx
{starThresholds && level === null && (() => {
  const stars = getStarCount(money, starThresholds)
  return (
    <div className={styles.starDisplay}>
      <div className={styles.starRow}>
        {[0, 1, 2].map(i => (
          <span key={i} className={i < stars ? styles.starFilled : styles.starEmpty}>
            {i < stars ? '★' : '☆'}
          </span>
        ))}
      </div>
      <div className={styles.starThresholds}>
        {starThresholds.map((t, i) => (
          <span key={i} className={money >= t ? styles.thresholdMet : styles.thresholdUnmet}>
            {'★'.repeat(i + 1)} ${t.toLocaleString()}
          </span>
        ))}
      </div>
    </div>
  )
})()}
```

- [ ] **Step 4: Add CSS in `GameOver.module.css`**

Append to the file:

```css
/* ── Star display ── */

.starDisplay {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 4px 0 8px;
}

.starRow {
  display: flex;
  gap: 4px;
}

.starFilled {
  font-size: 52px;
  color: #f0c850;
  text-shadow: 0 0 14px rgba(240, 200, 80, 0.45);
  line-height: 1;
}

.starEmpty {
  font-size: 52px;
  color: #2e2a26;
  line-height: 1;
}

.starThresholds {
  display: flex;
  gap: 16px;
}

.thresholdMet {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  color: #f0c850;
}

.thresholdUnmet {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  color: #3a3530;
}
```

- [ ] **Step 5: Full build + lint**

```bash
npm run build
```

Expected: Clean build, no TypeScript errors, no lint errors.

- [ ] **Step 6: Manual verification**

Run `npm run dev` and walk through the full golden path:

1. Open FreePlay setup → star threshold preview is visible in the footer area above the Start button
2. Move the Duration slider → thresholds update live
3. Move Expected Players slider → thresholds update live (fewer players = lower thresholds)
4. Move Cooking Speed slider → thresholds update (faster = higher ceiling)
5. Open More Options, change Order Urgency to 3× → thresholds drop (hard patience → lower ceiling)
6. Enable a hazard event → thresholds drop slightly; enable an opportunity event → thresholds rise
7. Start a round → BottomBar shows `☆☆☆ → $X` initially
8. Earn past 1★ threshold → BottomBar updates to `★☆☆ → $Y`
9. Earn past 2★ and 3★ → BottomBar shows `★★★ 🎉`
10. End round → GameOver shows large star icons (correct count filled) + threshold breakdown
11. Play again → FreePlaySetup "Recent:" tracker shows the previous round's player count

- [ ] **Step 7: Commit**

```bash
git add src/components/GameOver.tsx src/components/GameOver.module.css
git commit -m "feat: add final star display to GameOver screen"
```
