# Spec: Heat Meter, Rush Orders, Remove !take

**Date:** 2026-04-13  
**Branch:** feat/heat-rush-remove-take

---

## Context

Three interlinked mechanics are changing:

1. **Remove `!take`** — the manual collection step after non-chop cooks is removed. All stations auto-collect like the chopping board currently does. This lowers the command barrier for new players and removes the frustrating "item stuck in done slot" failure mode.

2. **Station Heat Meter** — replaces the per-slot `burnAt` burn mechanic. Each station accumulates heat as completed cooks pile up. Heat never decays passively. When it maxes out the station overheats — all active slots are destroyed and the station locks until the community collectively extinguishes it. A new `!cool [station]` command lets players reduce heat before disaster. `!extinguish` is reworked as a collective vote requiring ≥30% of active players.

3. **Rush Orders** — 25% of spawned orders are flagged rush: higher reward (×1.75), half the patience, always sorted to the top of the order queue, with distinct amber/gold visual treatment. Only one rush order can be active at a time — if a rush order is already pending, the spawn roll is skipped and a normal order spawns instead.

---

## Type Changes — `src/state/types.ts`

### SlotState
Remove `'done'` and `'onFire'`. Only `'cooking'` remains:
```ts
export type SlotState = 'cooking'
```

### StationSlot
Remove `burnAt: number`:
```ts
export interface StationSlot {
  id: string
  user: string
  target: string
  produces: string
  cookStart: number
  cookDuration: number
  state: SlotState
}
```

### Station
Add `heat`, `overheated`, `extinguishVotes`:
```ts
export interface Station {
  id: string
  slots: StationSlot[]
  heat: number             // 0–100
  overheated: boolean
  extinguishVotes: string[] // usernames who have voted
}
```

### Order
Add `isRush` and `rewardMultiplier`:
```ts
export interface Order {
  id: number
  dish: string
  served: boolean
  patienceMax: number
  patienceLeft: number
  spawnTime: number
  isRush: boolean
  rewardMultiplier: number  // 1 for normal, 1.75 for rush
  outcome?: 'served' | 'lost'
  completedAt?: number
}
```

### PlayerStats
Remove `taken`. Keep `firesCaused` (repurposed: incremented when a player's cook causes a station to overheat — the last cook that pushed heat to 100):
```ts
export interface PlayerStats {
  cooked: number
  served: number
  moneyEarned: number
  extinguished: number
  firesCaused: number
}
```

### RecipeStep
Remove optional `burnAt`:
```ts
export interface RecipeStep {
  action: string
  target: string
  station: string
  duration: number
  produces: string
  requires?: string
}
```

---

## Constants

Define in `gameReducer.ts` (top of file, exported for UI use):

```ts
export const HEAT_PER_COOK = 20      // heat added per completed cook
export const COOL_AMOUNT   = 30      // heat removed per !cool
export const RUSH_CHANCE   = 0.25    // probability of rush order spawn
export const RUSH_PATIENCE = 0.5     // patience multiplier for rush orders
export const RUSH_REWARD   = 1.75    // reward multiplier for rush orders
```

---

## Reducer Changes — `src/state/gameReducer.ts`

### Remove
- `TAKE` from `GameAction` union
- The entire `case 'TAKE':` block
- `taken` from `EMPTY_STATS`

### Add `COOL` to GameAction
```ts
| { type: 'COOL'; user: string; stationId: string }
```

### Add `case 'COOL':`
```ts
case 'COOL': {
  const { user, stationId } = action
  const station = state.stations[stationId]
  if (!station) return addMsg(state, 'KITCHEN', 'Unknown station!', 'error')
  if (station.overheated) return addMsg(state, 'KITCHEN', `${STATION_DEFS[stationId].name} is overheated — extinguish it first!`, 'error')
  if (station.heat === 0) return addMsg(state, 'KITCHEN', `${STATION_DEFS[stationId].name} is already cool.`, 'error')

  const cooldown = state.userCooldowns[user] ?? 0
  if (Date.now() - cooldown < 1500) return addMsg(state, 'KITCHEN', `${user} is on cooldown!`, 'error')

  const newHeat = Math.max(0, station.heat - COOL_AMOUNT)
  const newStations = { ...state.stations, [stationId]: { ...station, heat: newHeat } }
  const withCooldown = { ...state, stations: newStations, userCooldowns: { ...state.userCooldowns, [user]: Date.now() } }
  return addMsg(withCooldown, 'KITCHEN', `${user} cooled the ${STATION_DEFS[stationId].name}! Heat: ${newHeat}%`, 'success')
}
```

### Rework `case 'EXTINGUISH':`
Vote-based. Remove slot-fire logic entirely:
```ts
case 'EXTINGUISH': {
  const { user, stationId } = action
  const station = state.stations[stationId]
  if (!station) return addMsg(state, 'KITCHEN', 'Unknown station!', 'error')
  if (!station.overheated) return addMsg(state, 'KITCHEN', `No overheat on ${STATION_DEFS[stationId].name}!`, 'error')
  if (station.extinguishVotes.includes(user)) return addMsg(state, 'KITCHEN', `${user} already voted to extinguish!`, 'error')

  const newVotes = [...station.extinguishVotes, user]
  // playerStats resets to {} on every RESET (new round), so this count
  // reflects only current-round participants — never accumulates across rounds.
  const totalPlayers = Math.max(1, Object.keys(state.playerStats).length)
  const needed = Math.max(1, Math.ceil(totalPlayers * 0.3))
  const withStat = addStat(state, user, 'extinguished', 1)

  if (newVotes.length >= needed) {
    // Threshold reached — restore station
    const newStations = {
      ...withStat.stations,
      [stationId]: { ...station, slots: [], heat: 0, overheated: false, extinguishVotes: [] }
    }
    return addMsg({ ...withStat, stations: newStations }, 'KITCHEN',
      `🧯 ${STATION_DEFS[stationId].name} extinguished! Station restored.`, 'success')
  } else {
    // Still waiting
    const newStations = {
      ...withStat.stations,
      [stationId]: { ...station, extinguishVotes: newVotes }
    }
    return addMsg({ ...withStat, stations: newStations }, 'KITCHEN',
      `${user} voted to extinguish ${STATION_DEFS[stationId].name} (${newVotes.length}/${needed})`, 'system')
  }
}
```

### Update `case 'TICK':` — slot completion
Replace the current cutting_board special-case + done-state logic with unified auto-collect for all stations. When `elapsed >= slot.cookDuration`:

```ts
// All stations: auto-collect on completion
newPreparedItems.push(slot.produces)
delete newActiveUsers[slot.user]
slotsChanged = true
messages.push({ ... success message ... })

// Add heat to station
const currentHeat = newStations[id].heat + HEAT_PER_COOK
if (currentHeat >= 100) {
  // Overheat! Destroy all slots, lock station
  // Award firesCaused to the user whose cook pushed it over
  newPlayerStats = addStat({ ...state, playerStats: newPlayerStats }, slot.user, 'firesCaused', 1).playerStats
  // Free all users assigned to this station
  for (const s of newStations[id].slots) delete newActiveUsers[s.user]
  newStations[id] = { ...newStations[id], slots: [], heat: 100, overheated: true, extinguishVotes: [] }
  messages.push({ ... 'KITCHEN overheat warning' ... })
  slotsChanged = true
  // Skip appending this slot — station is now locked
} else {
  newStations[id] = { ...newStations[id], heat: currentHeat }
  // slot NOT pushed (auto-collected above)
}
```

Remove the `burnAt` / `'onFire'` branch entirely from the TICK loop.

### Update `case 'SERVE':`
Apply `rewardMultiplier` to reward calculation:
```ts
const reward = Math.round(RECIPES[order.dish].reward * order.rewardMultiplier + timeBonus)
```

### Update `case 'SPAWN_ORDER':`
Add rush logic:
```ts
const existingRush = state.orders.some(o => o.isRush && !o.outcome)
const isRush = !existingRush && Math.random() < RUSH_CHANCE
const patience = (recipe.patience / state.orderSpeed) * (isRush ? RUSH_PATIENCE : 1)
const order: Order = {
  ...existing fields,
  isRush,
  rewardMultiplier: isRush ? RUSH_REWARD : 1,
  patienceMax: patience,
  patienceLeft: patience,
}
```

### Update `createInitialState`
Initialize new Station fields:
```ts
stations[id] = { id, slots: [], heat: 0, overheated: false, extinguishVotes: [] }
```

---

## Command Processor — `src/state/commandProcessor.ts`

- Remove `ta: 'take'` from `COMMAND_ALIASES`
- Remove `case 'take':` from switch
- Add `case 'cool':` → `return target ? { type: 'COOL', user, stationId: target } : null` (null-guard mirrors the `extinguish` pattern — `!cool` with no argument returns null silently)
- Add `cl: 'cool'` to `COMMAND_ALIASES`

---

## Recipe Data — `src/data/recipes.ts`

Strip `burnAt` from every `RecipeStep` in `RECIPES`. The `burnAt?` field also removed from `RecipeStep` interface (covered in types section above).

---

## Bot Simulation — `src/hooks/useBotSimulation.ts`

Update bot priority order. Remove "take done items" step. Add heat management:

New priority: **extinguish if overheated → cool if heat ≥ 60 → serve → cook**

Bot should:
- Check all stations: if any `overheated`, call `!extinguish [stationId]`
- Check all stations: if any `heat >= 60` and not overheated, call `!cool [stationId]`
- Otherwise follow existing serve → cook priority

---

## UI — Station Component

**`src/components/Station.tsx`**

- Remove `done` slot rendering (the ✓ DONE / ⚠ TAKE IT! block)
- Remove `onFire` slot rendering
- Remove `burnRatio` calculation (no burnAt)
- Simplify slot bar: single green→orange→red progress based purely on `elapsed / cookDuration` percentage (visual urgency, no burn risk)
- Add **heat bar** below station header:
  - Width proportional to `station.heat / 100`
  - Color: green (<40%), amber (40–70%), red (>70%)
  - Hidden when heat === 0
- Replace fire overlay with **overheat overlay**:
  - Triggered by `station.overheated` (not slot state)
  - Shows: "🔥 OVERHEATED — `!extinguish [stationId]`"
  - Shows vote progress: `"{votes}/{needed} extinguishing…"`
  - Reuse existing `fireFlash` animation

**`src/components/Station.module.css`**

- Remove `.slotDone`, `.slotDanger`, `.donePulse`, `.dangerPulse` classes
- Add `.heatBar`, `.heatBarFill`, `.heatBarFillWarm`, `.heatBarFillHot`
- Add `.voteProgress` for vote counter display
- Keep `.fire` and `fireFlash` animation (reused for overheat)

---

## UI — Order Components

**`src/components/OrderTicket.tsx`**

- Read `order.isRush` and `order.rewardMultiplier`
- Apply `.rush` class to ticket when `isRush`
- Add ⚡ badge to ticket header when rush
- Display reward with multiplier: `$${Math.round(recipe.reward * order.rewardMultiplier)}`

**`src/components/OrderTicket.module.css`**

- Add `.rush` — amber/gold border glow, `box-shadow: 0 0 12px rgba(240,180,0,0.5)`
- Add `.rushBadge` — small ⚡ pill in top-right of header
- Add `@keyframes rushPulse` for subtle border animation

**`src/components/DiningRoom.tsx`**

Sort active orders: rush first, then by spawnTime:
```ts
const sorted = [...activeOrders].sort((a, b) => {
  if (a.isRush !== b.isRush) return a.isRush ? -1 : 1
  return a.spawnTime - b.spawnTime
})
```

---

## Audio — `src/audio/useGameAudio.ts`

The fire-alarm SFX currently triggers on `sl.state === 'onFire'`. With `SlotState` reduced to `'cooking'` only, update detection to use `station.overheated`:

```ts
// Replace: stations.some(s => s.slots.some(sl => sl.state === 'onFire'))
// With:
Object.values(state.stations).some(s => s.overheated)
```

The `take-item` SFX (`preparedItems.length > prev`) fires correctly with auto-collect and needs no change.

---

## Leaderboard Components

Remove the `✋ Taken` column from all three leaderboard views. The `taken` stat no longer exists on `PlayerStats`.

**Files:** `src/components/GameOver.tsx`, `src/components/AdventureShiftPassed.tsx`, `src/components/AdventureRunEnd.tsx`
- Remove the `taken` header cell (`<span>✋</span>`)
- Remove the `stats.taken` data cell per row
- Update `totalActions` calculation to exclude `taken`

**`src/data/adventureMode.ts`** — remove `taken: e.taken + s.taken` from `mergePlayerStats`.

---

## UI — Commands Strip & Tutorial

**`src/components/CommandsStrip.tsx`**
- Replace `!extinguish [station]` entry logic to still show (unchanged)
- Add `!cool [station]` entry after cooking commands, before extinguish

**`src/components/TutorialModal.tsx`**
- Remove `!take` row from Commands section
- Add `!cool [station]` row with station label "any station" and alias `!cl`
- Update Quick Play step 2: remove mention of `!take`
- Update Tips: update fire hazard description to describe heat meter + overheat + collective extinguish

**`src/components/OptionsScreen.tsx`**
- Remove `['ta', 'take']` entry from shortform grid
- Add `['cl', 'cool']` entry

---

## Files Modified

| File | Change |
|------|--------|
| `src/state/types.ts` | SlotState, StationSlot, Station, Order, PlayerStats, RecipeStep |
| `src/state/gameReducer.ts` | Remove TAKE, add COOL, rework EXTINGUISH, update TICK/SERVE/SPAWN_ORDER/createInitialState |
| `src/state/commandProcessor.ts` | Remove take/ta, add cool/cl |
| `src/data/recipes.ts` | Strip burnAt from all recipe steps |
| `src/hooks/useBotSimulation.ts` | Remove take logic, add cool/extinguish priority |
| `src/audio/useGameAudio.ts` | Replace `sl.state === 'onFire'` SFX detection with `station.overheated` |
| `src/components/Station.tsx` | Heat bar, overheat display, vote counter |
| `src/components/Station.module.css` | Remove done/danger styles, add heat bar styles |
| `src/components/OrderTicket.tsx` | Rush badge, rush styling, adjusted reward display |
| `src/components/OrderTicket.module.css` | Rush styles and animation |
| `src/components/DiningRoom.tsx` | Sort rush orders to top |
| `src/components/CommandsStrip.tsx` | Add !cool |
| `src/components/TutorialModal.tsx` | Remove !take, add !cool, update tips |
| `src/components/OptionsScreen.tsx` | Shortform grid: remove ta, add cl |
| `src/components/GameOver.tsx` | Remove `taken` column from leaderboard |
| `src/components/AdventureShiftPassed.tsx` | Remove `taken` column from leaderboard |
| `src/components/AdventureRunEnd.tsx` | Remove `taken` column from leaderboard |
| `src/data/adventureMode.ts` | Remove `taken` from `mergePlayerStats` |

---

## Verification

1. `npm run dev` — start dev server
2. **Remove take:** cook any non-chop item (e.g. `!grill patty`); when done, item appears in Prepared Items tray without needing `!take`. Player freed automatically.
3. **Heat meter:** cook 5 items on a single station without cooling; station should overheat, all slots destroyed, station locked.
4. **!cool:** cook 3 items on a station, type `!cool grill`; heat bar should decrease by 30.
5. **Collective extinguish:** with multiple simulated players, overheat a station; single `!extinguish` should show vote count; enough votes restores station.
6. **Rush orders:** wait for a rush order to spawn (⚡ badge, amber styling, appears at top of queue); verify it pays ~1.75× normal reward and expires faster.
7. **Bot simulation:** enable bot; confirm bots call `!cool` when heat ≥ 60 and `!extinguish` when overheated.
8. `npm run lint` — clean.
9. `npm run build` — clean TypeScript compile.
