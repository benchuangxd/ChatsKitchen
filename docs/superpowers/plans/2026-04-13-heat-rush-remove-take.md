# Heat Meter, Rush Orders & Remove !take — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the !take mechanic (all stations auto-collect), add a station-wide heat meter with collective extinguish, and introduce rush orders with higher rewards and shorter patience.

**Architecture:** All game logic lives in `gameReducer.ts` (reducer pattern). Type changes cascade outward — types first, then reducer, then UI. No new files needed; all changes are modifications to existing files.

**Tech Stack:** React 18, TypeScript (strict), Vite, CSS Modules, useReducer state management.

---

## Task 1: Create Branch

**Files:** none

- [ ] Create and switch to the feature branch:
  ```bash
  cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
  git checkout feat/revamped-adventure
  git pull
  git checkout -b feat/heat-rush-remove-take
  ```

---

## Task 2: Update Types (`src/state/types.ts`)

**Files:**
- Modify: `src/state/types.ts`

- [ ] Replace `SlotState` — remove `'done'` and `'onFire'`:
  ```ts
  export type SlotState = 'cooking'
  ```

- [ ] Replace `StationSlot` — remove `burnAt`:
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

- [ ] Replace `Station` — add `heat`, `overheated`, `extinguishVotes`:
  ```ts
  export interface Station {
    id: string
    slots: StationSlot[]
    heat: number
    overheated: boolean
    extinguishVotes: string[]
  }
  ```

- [ ] Replace `Order` — add `isRush` and `rewardMultiplier`:
  ```ts
  export interface Order {
    id: number
    dish: string
    served: boolean
    patienceMax: number
    patienceLeft: number
    spawnTime: number
    isRush: boolean
    rewardMultiplier: number
    outcome?: 'served' | 'lost'
    completedAt?: number
  }
  ```

- [ ] Replace `PlayerStats` — remove `taken`:
  ```ts
  export interface PlayerStats {
    cooked: number
    served: number
    moneyEarned: number
    extinguished: number
    firesCaused: number
  }
  ```

- [ ] Replace `RecipeStep` — remove `burnAt?`:
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

- [ ] Run build to see the full error list — use it as a checklist:
  ```bash
  npm run build 2>&1 | head -80
  ```
  Expected: many errors referencing `burnAt`, `taken`, `onFire`, `done` state — this is the work queue.

---

## Task 3: Strip `burnAt` from Recipe Data (`src/data/recipes.ts`)

**Files:**
- Modify: `src/data/recipes.ts`

- [ ] Remove `burnAt?: number` from the `RecipeStep` interface (already done in types.ts; confirm recipes.ts has its own copy and remove it there too if present — check line 6).

- [ ] Remove every `burnAt: NNNNN` property from all recipe step objects. There are ~20 occurrences. Use search-and-replace: find `burnAt: \d+,?\s*` and delete each line. Affected recipes: `burger`, `fries`, `pasta`, `fish_burger`, `grilled_cheese`, `roasted_veggies`, `fried_rice`, `stir_fried_pork`, `steamed_tofu`, `steamed_buns`, `bulgogi`, `kimchi_jjigae`, `doenjang_jjigae`, `bibimbap`, `sushi_roll`, `tempura`, `chawanmushi`, `salmon_donburi`.

- [ ] Verify build errors related to `burnAt` are gone:
  ```bash
  npm run build 2>&1 | grep burnAt
  ```
  Expected: no output.

---

## Task 4: Reducer — Constants, createInitialState, Remove TAKE (`src/state/gameReducer.ts`)

**Files:**
- Modify: `src/state/gameReducer.ts`

- [ ] Add exported constants after the imports (line 3):
  ```ts
  export const HEAT_PER_COOK = 20
  export const COOL_AMOUNT   = 30
  export const RUSH_CHANCE   = 0.25
  export const RUSH_PATIENCE = 0.5
  export const RUSH_REWARD   = 1.75
  ```

- [ ] Update `createInitialState` — change station initialization (line 25):
  ```ts
  stations[id] = { id, slots: [], heat: 0, overheated: false, extinguishVotes: [] }
  ```

- [ ] Remove `taken: 0` from `EMPTY_STATS` (line 58):
  ```ts
  const EMPTY_STATS: PlayerStats = { cooked: 0, served: 0, moneyEarned: 0, extinguished: 0, firesCaused: 0 }
  ```

- [ ] Remove `TAKE` from the `GameAction` union (line 7):
  Delete the line: `| { type: 'TAKE'; user: string; ingredient: string }`

- [ ] Add `COOL` to the `GameAction` union after `EXTINGUISH` (line 9):
  ```ts
  | { type: 'COOL'; user: string; stationId: string }
  ```

- [ ] Delete the entire `case 'TAKE':` block (lines 103–152).

- [ ] Verify no remaining `taken` or `TAKE` references in reducer:
  ```bash
  grep -n "taken\|TAKE" src/state/gameReducer.ts
  ```
  Expected: no output.

---

## Task 5: Reducer — Add COOL case

**Files:**
- Modify: `src/state/gameReducer.ts`

- [ ] Add `case 'COOL':` after the `EXTINGUISH` block (before `case 'SERVE':`):
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

---

## Task 6: Reducer — Rework EXTINGUISH (vote-based)

**Files:**
- Modify: `src/state/gameReducer.ts`

- [ ] Replace the entire `case 'EXTINGUISH':` block (lines 79–101) with the vote-based implementation:
  ```ts
  case 'EXTINGUISH': {
    const { user, stationId } = action
    const station = state.stations[stationId]
    if (!station) return addMsg(state, 'KITCHEN', 'Unknown station!', 'error')
    if (!station.overheated) return addMsg(state, 'KITCHEN', `No overheat on the ${STATION_DEFS[stationId]?.name ?? stationId}!`, 'error')
    if (station.extinguishVotes.includes(user)) return addMsg(state, 'KITCHEN', `${user} already voted to extinguish!`, 'error')

    const newVotes = [...station.extinguishVotes, user]
    // playerStats resets to {} on every RESET (new round) — reflects current-round participants only
    const totalPlayers = Math.max(1, Object.keys(state.playerStats).length)
    const needed = Math.max(1, Math.ceil(totalPlayers * 0.3))
    const withStat = addStat(state, user, 'extinguished', 1)

    if (newVotes.length >= needed) {
      const newStations = {
        ...withStat.stations,
        [stationId]: { ...station, slots: [], heat: 0, overheated: false, extinguishVotes: [] },
      }
      return addMsg({ ...withStat, stations: newStations }, 'KITCHEN',
        `🧯 ${STATION_DEFS[stationId].name} extinguished! Station restored.`, 'success')
    } else {
      const newStations = {
        ...withStat.stations,
        [stationId]: { ...station, extinguishVotes: newVotes },
      }
      return addMsg({ ...withStat, stations: newStations }, 'KITCHEN',
        `${user} voted to extinguish ${STATION_DEFS[stationId].name} (${newVotes.length}/${needed})`, 'system')
    }
  }
  ```

---

## Task 7: Reducer — Update SERVE (apply rewardMultiplier)

**Files:**
- Modify: `src/state/gameReducer.ts`

- [ ] In `case 'SERVE':`, find line 175:
  ```ts
  const reward = recipe.reward + timeBonus
  ```
  Replace with:
  ```ts
  const reward = Math.round(recipe.reward * order.rewardMultiplier + timeBonus)
  ```

---

## Task 8: Reducer — Update SPAWN_ORDER (rush logic)

**Files:**
- Modify: `src/state/gameReducer.ts`

- [ ] Replace the order construction in `case 'SPAWN_ORDER':` (lines 274–290):
  ```ts
  const dishKeys = state.enabledRecipes.length > 0 ? state.enabledRecipes : Object.keys(RECIPES)
  const dish = dishKeys[Math.floor(Math.random() * dishKeys.length)]
  const recipe = RECIPES[dish]

  const existingRush = state.orders.some(o => o.isRush && !o.outcome)
  const isRush = !existingRush && Math.random() < RUSH_CHANCE
  const basePatience = recipe.patience / state.orderSpeed
  const patience = basePatience * (isRush ? RUSH_PATIENCE : 1)

  const order: Order = {
    id: state.nextOrderId,
    dish,
    served: false,
    patienceMax: patience,
    patienceLeft: patience,
    spawnTime: action.now,
    isRush,
    rewardMultiplier: isRush ? RUSH_REWARD : 1,
  }
  return addMsg(
    { ...state, orders: [...state.orders, order], nextOrderId: state.nextOrderId + 1 },
    'CUSTOMER',
    `${isRush ? '⚡ RUSH ' : ''}Order #${order.id}: ${recipe.emoji} ${recipe.name}!`,
    'system'
  )
  ```

---

## Task 9: Reducer — Update TICK (unified auto-collect + heat)

**Files:**
- Modify: `src/state/gameReducer.ts`

- [ ] In `case 'TICK':`, replace the entire slot-processing loop body (the `for (const slot of station.slots)` block, currently lines 308–338) with:
  ```ts
  for (const slot of station.slots) {
    const elapsed = now - slot.cookStart

    if (slot.state === 'cooking' && elapsed >= slot.cookDuration) {
      // Auto-collect: all stations work like cutting_board
      newPreparedItems.push(slot.produces)
      delete newActiveUsers[slot.user]
      slotsChanged = true
      messages.push({
        id: nextMsgId++,
        username: 'KITCHEN',
        text: `${slot.user} finished ${slot.target.replace(/_/g, ' ')}!`,
        type: 'success',
      })

      // Heat accumulation
      const stationHeat = (newStations[id].heat ?? 0) + HEAT_PER_COOK
      if (stationHeat >= 100) {
        // Overheat — destroy all slots and lock station
        // addStat needs a full state snapshot; rebuild from accumulated newPlayerStats
        const statSnap = addStat({ ...state, playerStats: newPlayerStats }, slot.user, 'firesCaused', 1)
        newPlayerStats = statSnap.playerStats
        // Free all users assigned to remaining slots
        for (const s of newStations[id].slots) delete newActiveUsers[s.user]
        newStations[id] = { ...newStations[id], slots: [], heat: 100, overheated: true, extinguishVotes: [] }
        messages.push({
          id: nextMsgId++,
          username: 'KITCHEN',
          text: `🔥 ${STATION_DEFS[id].name} OVERHEATED! Type !extinguish ${id.replace(/_/g, ' ')} to restore it!`,
          type: 'system',
        })
        slotsChanged = true
        break // station is locked, skip remaining slots
      } else {
        newStations[id] = { ...newStations[id], heat: stationHeat }
        // slot NOT pushed — removed (auto-collected)
      }
    } else {
      updatedSlots.push(slot)
    }
  }
  ```

- [ ] Also remove the `if (slotsChanged)` guard at the end of the station loop — replace with:
  ```ts
  if (slotsChanged && !newStations[id].overheated) {
    newStations[id] = { ...newStations[id], slots: updatedSlots }
  }
  ```
  *(When overheat fires, slots are already cleared above; the guard prevents stomping that with `updatedSlots`.)*

- [ ] Verify build is clean:
  ```bash
  npm run build 2>&1 | grep -E "error TS"
  ```
  Expected: no output. If errors remain, fix them before continuing.

- [ ] Commit checkpoint:
  ```bash
  git add src/state/types.ts src/state/gameReducer.ts src/data/recipes.ts
  git commit -m "feat: remove !take, add heat meter + COOL action, rush orders (reducer + types)"
  ```

---

## Task 10: Command Processor (`src/state/commandProcessor.ts`)

**Files:**
- Modify: `src/state/commandProcessor.ts`

- [ ] Remove `ta: 'take'` from `COMMAND_ALIASES`.

- [ ] Add `cl: 'cool'` to `COMMAND_ALIASES`.

- [ ] Remove `case 'take':` from the switch statement.

- [ ] Add `case 'cool':` (after `case 'extinguish':`):
  ```ts
  case 'cool':
    return target ? { type: 'COOL', user, stationId: target } : null
  ```

- [ ] Verify:
  ```bash
  npm run build 2>&1 | grep commandProcessor
  ```
  Expected: no output.

---

## Task 11: Bot Simulation (`src/hooks/useBotSimulation.ts`)

**Files:**
- Modify: `src/hooks/useBotSimulation.ts`

- [ ] Replace the `pickBotAction` function with the updated priority order (extinguish overheated → cool hot → serve → cook):
  ```ts
  function pickBotAction(state: GameState): { name: string; command: string } | null {
    const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]

    if (state.activeUsers[name]) return null

    // Extinguish overheated stations
    for (const [id, station] of Object.entries(state.stations)) {
      if (station.overheated) return { name, command: `extinguish ${id}` }
    }

    // Cool hot stations (heat >= 60, not overheated)
    for (const [id, station] of Object.entries(state.stations)) {
      if (!station.overheated && station.heat >= 60) return { name, command: `cool ${id}` }
    }

    // Serve — check if preparedItems has all ingredients for an active order
    for (const order of state.orders) {
      if (order.served) continue
      const recipe = RECIPES[order.dish]
      const available = [...state.preparedItems]
      let canServe = true
      for (const item of recipe.plate) {
        const idx = available.indexOf(item)
        if (idx === -1) { canServe = false; break }
        available.splice(idx, 1)
      }
      if (canServe) return { name, command: `serve ${order.id}` }
    }

    // Cook something needed
    for (const order of state.orders) {
      if (order.served) continue
      const recipe = RECIPES[order.dish]
      for (const step of recipe.steps) {
        const station = state.stations[step.station]
        if (!station || station.overheated) continue
        const capacity = step.station === 'cutting_board'
          ? state.stationCapacity.chopping
          : state.stationCapacity.cooking
        if (station.slots.length >= capacity) continue
        if (state.preparedItems.includes(step.produces)) continue
        const alreadyCooking = station.slots.some(s => s.produces === step.produces)
        if (alreadyCooking) continue
        if (step.requires && !state.preparedItems.includes(step.requires)) continue
        return { name, command: `${step.action} ${step.target}` }
      }
    }

    return { name, command: CHATTER[Math.floor(Math.random() * CHATTER.length)] }
  }
  ```

- [ ] Verify build:
  ```bash
  npm run build 2>&1 | grep -E "error TS"
  ```

---

## Task 12: Audio (`src/audio/useGameAudio.ts`)

**Files:**
- Modify: `src/audio/useGameAudio.ts`

- [ ] Find the line using `sl.state === 'onFire'` (search: `grep -n "onFire" src/audio/useGameAudio.ts`).

- [ ] Replace the fire detection expression with:
  ```ts
  Object.values(state.stations).some(s => s.overheated)
  ```

- [ ] Verify:
  ```bash
  npm run build 2>&1 | grep useGameAudio
  ```

---

## Task 13: Station UI — Heat Bar & Overheat Display

**Files:**
- Modify: `src/components/Station.tsx`
- Modify: `src/components/Station.module.css`

- [ ] In `Station.tsx`, remove the `SlotRow` `onFire` and `done` branches (lines 19–60). The component now only renders cooking slots. Simplify `SlotRow` to just the cooking branch, with bar color based on cook progress only (no burnRatio):
  ```tsx
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
  ```

- [ ] In the `Station` export component, update the fire/border logic to use `station.overheated`:
  ```tsx
  const borderColor = station.overheated ? '#cc2200' : (STATION_ACCENT[station.id] ?? def.color)
  ```
  And the class:
  ```tsx
  <div className={`${styles.station} ${station.overheated ? styles.fire : ''}`} style={{ borderColor }}>
  ```

- [ ] Add the heat bar and overheat overlay. Import `HEAT_PER_COOK` from the reducer:
  ```tsx
  import { HEAT_PER_COOK } from '../state/gameReducer'
  ```
  Then inside the Station component, after the `<div className={styles.label}>` block, add:
  ```tsx
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
  {station.overheated && (
    <div className={styles.overheatOverlay}>
      <span>🔥 OVERHEATED</span>
      <code>!extinguish {station.id.replace(/_/g, ' ')}</code>
      {station.extinguishVotes.length > 0 && (
        <span className={styles.voteProgress}>
          {station.extinguishVotes.length} voting…
        </span>
      )}
    </div>
  )}
  ```
  *(The vote `needed` count requires `playerStats` — pass it as a prop or omit the denominator for now; just showing vote count is sufficient.)*

- [ ] In `Station.module.css`, remove `.slotDone`, `.slotDanger`, `.donePulse`, `.dangerPulse` class definitions. Add:
  ```css
  .heatBar {
    height: 4px;
    background: var(--border);
    border-radius: 2px;
    margin: 4px 0 6px;
    overflow: hidden;
  }

  .heatBarFill {
    height: 100%;
    border-radius: 2px;
    background: #5aad5e;
    transition: width 0.3s ease;
  }

  .heatBarFillWarm {
    background: #e8943a;
  }

  .heatBarFillHot {
    background: #d94f4f;
  }

  .overheatOverlay {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 8px 4px;
    font-family: 'Space Mono', monospace;
    font-size: 13px;
    color: #ff6060;
    text-align: center;
  }

  .overheatOverlay code {
    font-size: 12px;
    color: #f0c850;
    background: rgba(240, 200, 80, 0.1);
    border-radius: 3px;
    padding: 1px 4px;
  }

  .voteProgress {
    font-size: 11px;
    color: var(--text-muted);
  }
  ```

- [ ] Also remove the `SlotRow` `stationId` prop since the fire overlay is now at the station level, not the slot level. Update all `<SlotRow>` call sites accordingly.

- [ ] Verify build:
  ```bash
  npm run build 2>&1 | grep -E "error TS|Station"
  ```

- [ ] Commit:
  ```bash
  git add src/components/Station.tsx src/components/Station.module.css src/hooks/useBotSimulation.ts src/state/commandProcessor.ts src/audio/useGameAudio.ts
  git commit -m "feat: station heat bar, overheat display, cool command, bot heat management"
  ```

---

## Task 14: Order UI — Rush Badge & Sorting

**Files:**
- Modify: `src/components/OrderTicket.tsx`
- Modify: `src/components/OrderTicket.module.css`
- Modify: `src/components/DiningRoom.tsx`

- [ ] In `OrderTicket.tsx`, update the reward display — apply `rewardMultiplier` (display only; actual payout with time bonus is computed in the reducer):
  ```tsx
  const displayReward = Math.round(recipe.reward * order.rewardMultiplier)
  ```
  And replace the reward `<span>` to use `displayReward`:
  ```tsx
  <span className={styles.reward}>${displayReward}</span>
  ```

- [ ] Apply rush class and add ⚡ badge in `OrderTicket.tsx`:
  ```tsx
  return (
    <div className={styles.ticketWrapper}>
      <div className={`${styles.ticket} ${urgencyClass} ${outcomeClass} ${order.isRush ? styles.rush : ''}`}>
        <div className={styles.header}>
          {order.isRush && <span className={styles.rushBadge}>⚡ RUSH</span>}
          <span className={styles.orderNum}>#{orderNumber}</span>
          <span className={styles.dishEmoji}>{recipe.emoji}</span>
          <span className={styles.dishName}>{recipe.name}</span>
        </div>
        ...rest unchanged...
  ```

- [ ] Add to `OrderTicket.module.css`:
  ```css
  .rush {
    box-shadow: 0 0 0 2px rgba(240, 180, 0, 0.6), 0 0 14px rgba(240, 180, 0, 0.3);
    animation: rushPulse 1.2s ease-in-out infinite alternate;
  }

  @keyframes rushPulse {
    from { box-shadow: 0 0 0 2px rgba(240,180,0,0.6), 0 0 10px rgba(240,180,0,0.2); }
    to   { box-shadow: 0 0 0 2px rgba(240,180,0,0.9), 0 0 20px rgba(240,180,0,0.5); }
  }

  .rushBadge {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    color: #f0c850;
    background: rgba(240, 180, 0, 0.15);
    border: 1px solid rgba(240, 180, 0, 0.4);
    border-radius: 4px;
    padding: 1px 5px;
    margin-right: 4px;
  }
  ```

- [ ] In `DiningRoom.tsx`, sort `activeOrders` — rush first, then by spawnTime:
  ```tsx
  const activeOrders = state.orders
    .filter(o => !o.served || o.outcome !== undefined)
    .sort((a, b) => {
      if (a.isRush !== b.isRush) return a.isRush ? -1 : 1
      return a.spawnTime - b.spawnTime
    })
  ```

- [ ] Verify build:
  ```bash
  npm run build 2>&1 | grep -E "error TS|OrderTicket|DiningRoom"
  ```

---

## Task 15: Remove `taken` from Leaderboards

**Files:**
- Modify: `src/components/GameOver.tsx`
- Modify: `src/components/AdventureShiftPassed.tsx`
- Modify: `src/components/AdventureRunEnd.tsx`
- Modify: `src/data/adventureMode.ts`

- [ ] In `GameOver.tsx` (line 36), update `totalActions`:
  ```ts
  const totalActions = (s: PlayerStats) => s.cooked + s.served + s.extinguished - s.firesCaused
  ```
  Then remove the `<span>✋</span>` header cell and the `{stats.taken}` data cell from the leaderboard render.

- [ ] Repeat the same `totalActions` update and column removal in `AdventureShiftPassed.tsx`.

- [ ] Repeat in `AdventureRunEnd.tsx`.

- [ ] In `src/data/adventureMode.ts`, find `mergePlayerStats` and remove `taken: e.taken + s.taken` (or equivalent).

- [ ] Verify:
  ```bash
  npm run build 2>&1 | grep -E "taken"
  ```
  Expected: no output.

---

## Task 16: CommandsStrip, Tutorial & Options Cleanup

**Files:**
- Modify: `src/components/CommandsStrip.tsx`
- Modify: `src/components/TutorialModal.tsx`
- Modify: `src/components/OptionsScreen.tsx`

- [ ] In `CommandsStrip.tsx`, add `!cool [station]` entry before `!extinguish`:
  ```tsx
  groups.push({ label: '!cool', targets: '[station]' })
  groups.push({ label: '!extinguish', targets: '[station]' })
  ```

- [ ] In `TutorialModal.tsx`:
  - Remove the `!take [ingredient]` row from the `commandGrid`
  - Add `!cool [station]` row with station label and `!cl` alias:
    ```tsx
    <span><code>!cool [station]</code><span className={styles.cmdStation}>any station</span><span className={styles.cmdAlias}>!cl</span></span>
    ```
  - Update Quick Play step 2: remove the sentence about `!take`; replace with: `"Finished ingredients go straight to the Prepared Items tray."`
  - Update the fire hazard tip: replace the current text with:
    ```tsx
    <li><strong>Heat hazard:</strong> each completed cook heats up that station. Type <code>!cool [station]</code> to reduce heat before it maxes out. At 100% the station overheats — <code>!extinguish [station]</code> requires 30% of active players to restore it.</li>
    ```

- [ ] In `OptionsScreen.tsx`, shortform grid:
  - Remove `['ta', 'take']`
  - Add `['cl', 'cool']`

- [ ] Final lint and build:
  ```bash
  npm run lint && npm run build
  ```
  Expected: no errors, no warnings.

- [ ] Commit everything:
  ```bash
  git add -p  # stage all remaining modified files
  git commit -m "feat: rush orders UI, leaderboard cleanup, tutorial + options update"
  ```

---

## Task 17: Manual Smoke Test

- [ ] Start dev server: `npm run dev`
- [ ] **Auto-collect:** type `!grill patty` in local chat; wait for cook to finish; confirm `grilled_patty` appears in tray without `!take`.
- [ ] **Heat meter:** cook 5 items on the grill (use bot or type repeatedly); confirm heat bar appears and grows; at 5th cook confirm overheat overlay appears with `!extinguish grill`.
- [ ] **!cool:** cook 3 items on grill; type `!cool grill`; confirm heat bar decreases.
- [ ] **Collective extinguish:** overheat a station; type `!extinguish grill` once; confirm vote count message; with bot enabled, wait for 30% threshold to be reached and station to restore.
- [ ] **Rush orders:** wait for a rush order (⚡ badge, amber glow, top of queue); serve it and confirm reward shows ~1.75× the base dish value.
- [ ] **No `!take`:** confirm `!take lettuce` produces an error or is unrecognised.

- [ ] Final commit if any smoke-test fixes were needed:
  ```bash
  git add .
  git commit -m "fix: smoke test corrections"
  ```

---

## Task 18: Push & PR

- [ ] Push branch:
  ```bash
  git push -u origin feat/heat-rush-remove-take
  ```

- [ ] Create PR:
  ```bash
  gh pr create \
    --title "feat: heat meter, rush orders, remove !take" \
    --base feat/revamped-adventure \
    --body "$(cat <<'EOF'
  ## Summary
  - **Remove !take** — all stations auto-collect on cook completion (like chop already did)
  - **Station heat meter** — heat builds per completed cook; !cool reduces it; overheat at 100% locks station until 30% of players extinguish collectively
  - **Rush orders** — 25% spawn chance, ×1.75 reward, ×0.5 patience, pinned to top of queue with ⚡ badge and amber glow

  ## Test plan
  - [ ] !grill patty auto-collects without !take
  - [ ] 5 cooks on one station → overheat + overlay
  - [ ] !cool reduces heat bar
  - [ ] Collective !extinguish restores station
  - [ ] Rush order appears at top with correct reward
  - [ ] npm run lint && npm run build clean

  🤖 Generated with [Claude Code](https://claude.com/claude-code)
  EOF
  )"
  ```
