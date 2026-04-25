# Dynamic Star System — Design Spec

**Date:** 2026-04-25
**Branch:** feat/dynamic-star-system

---

## Goal

Add a 3-tier Overcooked-style star rating to Free Play mode. Star thresholds are computed dynamically from the current game settings — shift duration, speeds, recipes, player count, and kitchen events — so a near-perfect performance always earns 3 stars regardless of how the session is configured.

Stars are shown in three places: live on the setup screen (preview), live during gameplay (StatsBar indicator), and prominently on the game over screen.

---

## Scope

Free Play mode only. Adventure mode is unaffected — it has its own fixed goal system.

---

## Algorithm

### New file: `src/data/starThresholds.ts`

A single pure exported function:

```typescript
export function computeStarThresholds(options: GameOptions): [number, number, number]
```

**Inputs used from `GameOptions`:**

| Field | Role |
|-------|------|
| `shiftDuration` | Total time available (ms) |
| `cookingSpeed` | Divides step durations |
| `orderSpeed` | Divides order patience |
| `orderSpawnRate` | Multiplies spawn frequency |
| `enabledRecipes` | Source of avg reward, avg cook time, avg patience |
| `stationCapacity` | Slot counts used to compute saturation point |
| `expectedPlayers` | *(new field)* Drives coordination efficiency |
| `kitchenEventsEnabled` | Gate for event modifier |
| `enabledKitchenEvents` | Which event types apply hazard/opportunity modifiers |

**Steps:**

#### 1. Recipe metrics
From `enabledRecipes`, compute:
- `avgReward` — mean of `recipe.reward` across enabled recipes
- `avgCookTime` — mean of total step duration per recipe (`sum(step.duration)`)
- `avgPatience` — mean of `recipe.patience`

#### 2. Total spawnable orders
```
BASE_SPAWN_INTERVAL_MS = 14000
effectiveSpawnInterval = BASE_SPAWN_INTERVAL_MS / orderSpawnRate
totalSpawnableOrders = shiftDuration / effectiveSpawnInterval
```

The base interval of 14 s is the wave-0 spawn rate. Using it as a constant gives a conservative (slightly low) order count, making the thresholds achievable rather than theoretical.

#### 3. Patience factor
Captures the fraction of orders that can realistically be completed before expiry:
```
REACTION_TIME_MS = 8000   // coordination lag: seeing order → issuing commands
effectiveCookTime = avgCookTime / cookingSpeed
effectivePatience = avgPatience / orderSpeed
completionTime = REACTION_TIME_MS + effectiveCookTime
patienceFactor = clamp(effectivePatience / (completionTime * 1.5), 0.15, 1.0)
```
`patienceFactor` is 1.0 when patience is comfortably larger than completion time; drops toward 0.15 as orders expire before they can be served.

#### 4. Coordination efficiency
Models how much of theoretical throughput the kitchen achieves given player count:
```
// Count total station slots needed by enabled recipes.
// StationCapacity has exactly two fields:
//   chopping — slot limit for cutting_board
//   cooking  — slot limit for every other station type (grill, fryer, oven, wok, etc.)
stationSlots = (cuttingBoardNeeded ? capacity.chopping : 0)
             + capacity.cooking × (distinct non-chopping station types needed by enabled recipes)

playerFactor = clamp(expectedPlayers / stationSlots, 0, 1.0)
coordinationEfficiency = 0.20 + 0.75 × playerFactor
```

| expectedPlayers vs slots | coordinationEfficiency |
|--------------------------|------------------------|
| 1 / 9 (≈0.11) | ≈ 0.28 |
| 5 / 9 (≈0.56) | ≈ 0.62 |
| 9 / 9 (1.00) | 0.95 (max) |
| 20 / 9 (capped at 1.0) | 0.95 (max) |

0.20 is the solo-player floor; 0.95 is the large-chat ceiling (coordination overhead always exists).

#### 5. Theoretical maximum
```
theoreticalMax = totalSpawnableOrders × avgReward × patienceFactor × coordinationEfficiency
```

#### 6. Event modifier
Only applied when `kitchenEventsEnabled = true`. `enabledKitchenEvents` is a non-empty array of specific event types the player has toggled on — an empty array means no events are selected (same as disabled), which yields `eventFactor = 1.0`.

```
HAZARD_TYPES = ['rat_invasion', 'angry_chef', 'power_trip', 'smoke_blast', 'glitched_orders']
OPP_TYPES    = ['chefs_chant', 'mystery_recipe', 'typing_frenzy', 'dance']

hazardCount = count of HAZARD_TYPES present in enabledKitchenEvents
oppCount    = count of OPP_TYPES present in enabledKitchenEvents

eventFactor = (1.0 − hazardCount × 0.03) × (1.0 + oppCount × 0.02)
```

Hazard events lower the estimated ceiling (thresholds drop, making stars easier to reach when the game is harder). Opportunity events raise it (thresholds rise, since players can boost their earnings).

```
adjustedMax = theoreticalMax × eventFactor
```

If `kitchenEventsEnabled = false` or `enabledKitchenEvents` is empty, `eventFactor = 1.0` and `adjustedMax = theoreticalMax`.

#### 7. Star thresholds
```
[1★, 2★, 3★] = [adjustedMax × 0.40, adjustedMax × 0.65, adjustedMax × 0.88]
```
Each rounded to the nearest $5.

**Calibration at default settings** (3 min, 1× all speeds, 10 players, Western Classics, default events):
- `avgReward ≈ $54`, `avgCookTime ≈ 23 s`, `avgPatience ≈ 70 s`
- `totalSpawnableOrders ≈ 13`, `patienceFactor ≈ 1.0`, `coordinationEfficiency ≈ 0.95`
- `theoreticalMax ≈ $665`, `adjustedMax ≈ $640` (with default event mix)
- **Thresholds: 1★ ≈ $255 · 2★ ≈ $415 · 3★ ≈ $565**
- 3 stars requires serving ≈ 85% of all spawned orders — near-perfect play.

---

## Data Model Changes

### `GameOptions` — new field (`src/state/types.ts`)
```typescript
expectedPlayers: number   // default: 10
```
Persisted to localStorage with the rest of `GameOptions`.

### Default value (`src/state/defaultOptions.ts`)
```typescript
expectedPlayers: 10,
```

### `RoundRecord` — new field (`src/state/types.ts`)
```typescript
interface RoundRecord {
  money: number
  served: number
  lost: number
  playerCount: number   // Object.keys(playerStats).length at game end
}
```

---

## Data Flow

**Computed once per session** in `App.tsx` when the game starts:
```typescript
const starThresholds = computeStarThresholds(gameOptions)  // [number, number, number]
```
Stored as `starThresholds: [number, number, number] | null` in `App.tsx` state (`null` during Adventure mode, always set for Free Play).

**Also computed live** in `FreePlaySetup` as a local derived value — re-runs on every option change to power the preview. `computeStarThresholds` is a pure function so this is free.

**Prop threading:**
- `FreePlaySetup` — receives `options` (already passed); calls `computeStarThresholds(options)` internally, no new prop needed
- `StatsBar` — receives new optional prop `starThresholds?: [number, number, number]`
- `GameOver` — receives new optional prop `starThresholds?: [number, number, number]`

`roundHistory` entries gain `playerCount` — populated in `App.tsx` at game end: `Object.keys(finalPlayerStats).length`.

---

## UI

### FreePlaySetup — Expected Players slider + threshold preview

**New slider:** "Expected Players" added to the settings panel. Range 1–200, step 1, default 10.

**Player history tracker:** below or beside the slider, a compact read-only line showing player counts from the last 3 rounds pulled from `roundHistory`:
```
Recent rounds: 12 · 8 · 5 players
```
If fewer than 3 rounds exist, show however many are available. If none, omit the line.

**Threshold preview:** a 3-row block that updates live as any setting changes:
```
⭐          $255
⭐⭐         $415
⭐⭐⭐        $565
```
Positioned near the bottom of the settings panel, above the Start button. Styled in the existing card/section pattern.

---

### StatsBar — Live star indicator

A compact star display added to `StatsBar` alongside the existing money / served / lost / timer stats. Only rendered when `starThresholds` is present.

Shows the current star tier the chat has reached based on `state.money`, plus the next threshold to aim for:
```
★★  →  ★★★ at $565
```
When 3 stars are already reached, show:
```
★★★  🎉
```
When no stars yet:
```
☆☆☆  →  ★ at $255
```

Star icons: filled ★ for earned, hollow ☆ for unearned.

---

### GameOver — Final star display

A prominent star row displayed at the top of the left column, above the money / served / lost stats block. Only shown when `starThresholds` is present.

Three large star icons (filled or hollow) based on thresholds hit. Below them, a compact threshold reference line:
```
★★★

$487 earned

★ $255   ★★ $415   ★★★ $565
```

If a new high score was also set, the existing "🏆 New High Score!" badge remains below the star block.

---

## Files Changed

| File | Action | What changes |
|------|--------|-------------|
| `src/data/starThresholds.ts` | **Create** | `computeStarThresholds()` pure function |
| `src/state/types.ts` | Modify | Add `expectedPlayers` to `GameOptions`; add `playerCount` to `RoundRecord` |
| `src/state/defaultOptions.ts` | Modify | Add `expectedPlayers: 10` |
| `src/App.tsx` | Modify | Compute `starThresholds` at game start; populate `playerCount` in round history; thread `starThresholds` to `StatsBar` and `GameOver` |
| `src/components/FreePlaySetup.tsx` | Modify | Add Expected Players slider, player history tracker, threshold preview |
| `src/components/FreePlaySetup.module.css` | Modify | Styles for slider, tracker, preview block |
| `src/components/StatsBar.tsx` | Modify | Add optional `starThresholds` prop; render live star indicator |
| `src/components/StatsBar.module.css` | Modify | Styles for star indicator |
| `src/components/GameOver.tsx` | Modify | Add optional `starThresholds` prop; render final star display |
| `src/components/GameOver.module.css` | Modify | Styles for star display |

---

## Out of Scope

- Adventure mode — uses its own fixed goal system, unaffected
- PvP mode — no stars (each team has its own money total; star rating over combined money would be misleading)
- Persisting best-stars-earned per session — thresholds change with every settings change, so a "best result" against a specific threshold set has no meaningful cross-session comparison
- Leaderboard or sharing — out of scope for this feature
