# Station Capacity Limits & Plating Rework Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable station slot limits (chopping, cooking, plating) with pre-game configuration, make plating a timed station-based action instead of instant, and enforce capacity checks on all cook/plate actions.

**Architecture:** Station capacity is configured pre-game via `GameOptions` and enforced in the reducer. A new `plating` station type is added to `STATION_DEFS` with its own slots and cooking-like behavior. The `PLATE` action becomes a timed operation that blocks the user (like `COOK`), consuming ingredients on start and producing a plated dish when done. The `TICK` action processes plating slots alongside cooking slots.

**Tech Stack:** React, TypeScript, CSS Modules (existing stack — no new dependencies)

---

## File Structure

| File | Action | Responsibility |
|------|--------|---------------|
| `src/state/types.ts` | Modify | Add `StationCapacity` interface, add capacity fields to `GameOptions` and `GameState` |
| `src/data/recipes.ts` | Modify | Add `plating` station definition to `STATION_DEFS` |
| `src/state/gameReducer.ts` | Modify | Add capacity checks to `COOK`, rework `PLATE` to timed station action, process plating in `TICK`, pass capacity to `createInitialState` |
| `src/state/commandProcessor.ts` | Modify | Add `now: Date.now()` to `PLATE` action for timing |
| `src/hooks/useBotSimulation.ts` | Modify | Bot checks station capacity before cooking/plating, handle plating as timed action |
| `src/components/OptionsScreen.tsx` | Modify | Add station capacity controls (chopping, cooking, plating) |
| `src/components/OptionsScreen.module.css` | Modify | Styles for capacity number inputs |
| `src/components/Station.tsx` | Modify | Show slot count vs capacity (e.g. "2/3 slots") |
| `src/components/Kitchen.tsx` | Modify | Render plating station alongside cooking stations |
| `src/components/AssemblyArea.tsx` | Modify | Show plating-in-progress slots (like cooking progress bars) |
| `src/App.tsx` | Modify | Pass capacity options through to `createInitialState` and `RESET` |

---

### Task 1: Add Capacity Types and GameOptions Fields

**Files:**
- Modify: `src/state/types.ts:45-48`

- [x] **Step 1: Add StationCapacity interface and update GameOptions**

In `src/state/types.ts`, add `StationCapacity` to `GameOptions`:

```typescript
export interface StationCapacity {
  chopping: number    // slots for cutting_board
  cooking: number     // slots per cooking station (grill, fryer, stove, oven)
  plating: number     // slots for plating station
}

export interface GameOptions {
  durationMultiplier: number
  shiftDuration: number
  stationCapacity: StationCapacity
}
```

- [x] **Step 2: Add stationCapacity to GameState**

In `src/state/types.ts`, add to `GameState`:

```typescript
export interface GameState {
  // ... existing fields ...
  stationCapacity: StationCapacity
}
```

- [x] **Step 3: Update App.tsx default GameOptions**

In `src/App.tsx:24`, update the initial `gameOptions` state:

```typescript
const [gameOptions, setGameOptions] = useState<GameOptions>({
  durationMultiplier: 1,
  shiftDuration: 120000,
  stationCapacity: { chopping: 2, cooking: 2, plating: 2 },
})
```

- [x] **Step 4: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

Fix any type errors — `createInitialState` and `RESET` will need updating (done in Task 2).

- [x] **Step 5: Commit**

```bash
git add src/state/types.ts src/App.tsx
git commit -m "feat: add StationCapacity type and GameOptions fields"
```

---

### Task 2: Add Plating Station Definition and Update Reducer Initialization

**Files:**
- Modify: `src/data/recipes.ts:72-78`
- Modify: `src/state/gameReducer.ts:15-40,55-58`

- [x] **Step 1: Add plating station to STATION_DEFS**

In `src/data/recipes.ts`, add to `STATION_DEFS`:

```typescript
export const STATION_DEFS: Record<string, StationDef> = {
  cutting_board: { name: 'Chopping Board', emoji: '🔪', color: '#5aad5e', actions: ['chop'] },
  grill:         { name: 'Grill',         emoji: '🔥', color: '#e06840', actions: ['grill'] },
  fryer:         { name: 'Fryer',         emoji: '🫕', color: '#e8943a', actions: ['fry'] },
  stove:         { name: 'Stove',         emoji: '♨️',  color: '#d94f4f', actions: ['boil'] },
  oven:          { name: 'Oven',          emoji: '🧱', color: '#a07862', actions: ['toast'] },
  plating:       { name: 'Plating',       emoji: '🍽️', color: '#b0a090', actions: ['plate'] },
}
```

- [x] **Step 2: Update createInitialState to accept and store capacity**

In `src/state/gameReducer.ts`, update `createInitialState`:

```typescript
import { StationCapacity } from './types'

export function createInitialState(
  shiftDuration = 120000,
  durationMultiplier = 1,
  stationCapacity: StationCapacity = { chopping: 2, cooking: 2, plating: 2 }
): GameState {
  const stations: Record<string, Station> = {}
  for (const id of Object.keys(STATION_DEFS)) {
    stations[id] = { id, slots: [], onFire: false }
  }

  return {
    money: 0,
    served: 0,
    lost: 0,
    shift: 1,
    timeLeft: shiftDuration,
    durationMultiplier,
    stationCapacity,
    stations,
    orders: [],
    preparedItems: [],
    platedDishes: [],
    nextOrderId: 1,
    userCooldowns: {},
    activeUsers: {},
    nextSlotId: 1,
    chatMessages: [],
    nextMessageId: 1,
    playerStats: {},
  }
}
```

- [x] **Step 3: Update RESET action to pass capacity**

In `src/state/gameReducer.ts`, update the `GameAction` type and `RESET` case:

```typescript
export type GameAction =
  | { type: 'TICK'; delta: number; now: number }
  | { type: 'COOK'; user: string; action: string; target: string; now: number }
  | { type: 'TAKE'; user: string; stationId: string }
  | { type: 'PLATE'; user: string; dishKey: string; now: number }
  | { type: 'SERVE'; user: string; orderId: number }
  | { type: 'EXTINGUISH'; user: string }
  | { type: 'SPAWN_ORDER'; now: number }
  | { type: 'ADD_CHAT'; username: string; text: string; msgType: ChatMessage['type'] }
  | { type: 'RESET'; shiftDuration: number; durationMultiplier: number; stationCapacity: StationCapacity }

// ...

case 'RESET':
  return createInitialState(action.shiftDuration, action.durationMultiplier, action.stationCapacity)
```

Note: `PLATE` action now includes `now: number` for timing.

- [x] **Step 4: Update App.tsx dispatch calls for RESET**

In `src/App.tsx`, update `resetGame`:

```typescript
const resetGame = useCallback(() => {
  dispatch({
    type: 'RESET',
    shiftDuration: gameOptions.shiftDuration,
    durationMultiplier: gameOptions.durationMultiplier,
    stationCapacity: gameOptions.stationCapacity,
  })
  setScreen('countdown')
}, [gameOptions])
```

And update `createInitialState` call:

```typescript
const [state, dispatch] = useReducer(gameReducer, undefined, () =>
  createInitialState(gameOptions.shiftDuration, gameOptions.durationMultiplier, gameOptions.stationCapacity)
)
```

- [x] **Step 5: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 6: Commit**

```bash
git add src/data/recipes.ts src/state/gameReducer.ts src/App.tsx
git commit -m "feat: add plating station definition and pass capacity through initialization"
```

---

### Task 3: Add Station Capacity Enforcement to COOK Action

**Files:**
- Modify: `src/state/gameReducer.ts:158-225`

- [x] **Step 1: Add capacity helper function**

In `src/state/gameReducer.ts`, add a helper function after `addStat` (around line 53):

```typescript
function getStationCapacity(stationId: string, capacity: StationCapacity): number {
  if (stationId === 'cutting_board') return capacity.chopping
  if (stationId === 'plating') return capacity.plating
  return capacity.cooking  // grill, fryer, stove, oven
}
```

- [x] **Step 2: Add capacity check in COOK action**

In the `COOK` case, after the fire check (line 179) and before the recipe step lookup (line 181), add:

```typescript
// Station capacity check
const maxSlots = getStationCapacity(stationId, state.stationCapacity)
if (station.slots.length >= maxSlots) {
  return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is full! Try again later.`, 'error')
}
```

- [x] **Step 3: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 4: Commit**

```bash
git add src/state/gameReducer.ts
git commit -m "feat: enforce station slot capacity limits on COOK action"
```

---

### Task 4: Rework PLATE Action to Timed Station-Based Operation

**Files:**
- Modify: `src/state/gameReducer.ts:116-133`
- Modify: `src/state/commandProcessor.ts:26-27`

- [x] **Step 1: Update commandProcessor to add timestamp to PLATE**

In `src/state/commandProcessor.ts:27`, change:

```typescript
case 'plate':
  return target ? { type: 'PLATE', user, dishKey: expand(target), now: Date.now() } : null
```

- [x] **Step 2: Rework PLATE case in reducer**

Replace the entire `case 'PLATE'` block (lines 116-133) with:

```typescript
case 'PLATE': {
  const { dishKey, user, now } = action
  const recipe = RECIPES[dishKey]
  if (!recipe) return addMsg(state, 'KITCHEN', `Unknown dish: ${dishKey}`, 'error')

  // Cooldown check
  if (state.userCooldowns[user] && now - state.userCooldowns[user] < 1500) return state
  const withCooldown = { ...state, userCooldowns: { ...state.userCooldowns, [user]: now } }

  // Per-user busy check
  const alreadyBusy = withCooldown.activeUsers[user] || Object.values(withCooldown.stations).some(
    s => s.slots.some(slot => slot.state === 'cooking' && slot.user === user)
  )
  if (alreadyBusy) {
    return addMsg(withCooldown, 'KITCHEN', `${user} is already busy!`, 'error')
  }

  // Plating station capacity check
  const platingStation = withCooldown.stations['plating']
  const maxSlots = getStationCapacity('plating', state.stationCapacity)
  if (platingStation.slots.length >= maxSlots) {
    return addMsg(withCooldown, 'KITCHEN', 'Plating station is full! Try again later.', 'error')
  }

  // Check ingredients
  const needed = [...recipe.plate]
  const available = [...withCooldown.preparedItems]
  for (const item of needed) {
    const idx = available.indexOf(item)
    if (idx === -1) return addMsg(withCooldown, 'KITCHEN', `Missing ${item.replace(/_/g, ' ')} for ${recipe.name}!`, 'error')
    available.splice(idx, 1)
  }

  // Plating takes 3 seconds (scaled by speed multiplier)
  const plateDuration = 3000 / state.durationMultiplier

  const newSlot: StationSlot = {
    id: `slot_${withCooldown.nextSlotId}`,
    user,
    target: dishKey,
    produces: dishKey,      // produces the dish key itself
    cookStart: now,
    cookDuration: plateDuration,
    burnAt: Infinity,       // plating doesn't burn
    state: 'cooking',
  }

  const withStat = addStat(withCooldown, user, 'plated', 1)
  return addMsg(
    {
      ...withStat,
      preparedItems: available,  // consume ingredients immediately
      stations: {
        ...withStat.stations,
        plating: { ...platingStation, slots: [...platingStation.slots, newSlot] },
      },
      activeUsers: { ...withStat.activeUsers, [user]: 'plating' },
      nextSlotId: withStat.nextSlotId + 1,
    },
    'KITCHEN', `${user} started plating ${recipe.emoji} ${recipe.name}!`, 'success'
  )
}
```

- [x] **Step 3: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 4: Commit**

```bash
git add src/state/gameReducer.ts src/state/commandProcessor.ts
git commit -m "feat: rework PLATE to timed station-based action with capacity limits"
```

---

### Task 5: Handle Plating Completion in TICK

**Files:**
- Modify: `src/state/gameReducer.ts:250-293` (TICK action)

The existing TICK logic already processes all stations' slots — since we added the `plating` station to `STATION_DEFS`, its slots will be iterated automatically. However, when a plating slot transitions from 'cooking' to 'done', it has `burnAt: Infinity` so it will never burn. We need to **auto-complete** plating: when the slot is done, immediately move the dish to `platedDishes` and remove the slot (no `!take` needed for plating).

- [x] **Step 1: Add auto-complete for plating station in TICK**

In the TICK case, after the slot processing loop (after line 293, before the order patience section), add plating auto-complete logic. The cleanest approach is to handle it inside the existing slot loop. Find the block where `slot.state === 'cooking' && elapsed >= slot.cookDuration` (line 268). The current code marks it as 'done' and frees the user. For the plating station specifically, we should instead remove the slot entirely and add to `platedDishes`.

Modify the TICK handler. After the line `let messages = [...state.chatMessages]` (line 254), add:

```typescript
let platedDishes = [...state.platedDishes]
```

Then inside the slot iteration, change the cooking-done check (lines 268-271) to handle plating specially:

```typescript
if (slot.state === 'cooking' && elapsed >= slot.cookDuration) {
  if (id === 'plating') {
    // Auto-complete: plating doesn't need !take
    delete newActiveUsers[slot.user]
    slotsChanged = true
    const recipe = RECIPES[slot.produces]
    platedDishes.push(slot.produces)
    messages.push({ id: nextMsgId++, username: 'KITCHEN', text: `${slot.user} finished plating ${recipe?.emoji || ''} ${recipe?.name || slot.produces}!`, type: 'success' })
    // Don't add to updatedSlots — slot is consumed
  } else {
    updatedSlots.push({ ...slot, state: 'done' })
    delete newActiveUsers[slot.user]
    slotsChanged = true
  }
}
```

Then in the return statement of TICK (line 323), include `platedDishes`:

```typescript
return { ...state, stations: newStations, activeUsers: newActiveUsers, orders, lost, shift, timeLeft, platedDishes, chatMessages: messages.slice(-200), nextMessageId: nextMsgId }
```

- [x] **Step 2: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 3: Commit**

```bash
git add src/state/gameReducer.ts
git commit -m "feat: auto-complete plating slots in TICK, add dish to platedDishes"
```

---

### Task 6: Update Bot Simulation for Capacity and Timed Plating

**Files:**
- Modify: `src/hooks/useBotSimulation.ts:8-63`

- [x] **Step 1: Add capacity checks and plating busy-awareness to bot logic**

The bot needs to:
1. Check station capacity before cooking
2. Check plating station capacity before plating
3. Not try to `!take` from the plating station (auto-completes)

Update the `pickBotAction` function:

```typescript
function pickBotAction(state: GameState): { name: string; command: string } | null {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]

  // Skip if this bot is already busy
  if (state.activeUsers[name]) return null

  // Fire — any station on fire
  for (const station of Object.values(state.stations)) {
    if (station.onFire) return { name, command: '!extinguish' }
  }

  // Done slots — take bot's own first, then any done slot (skip plating — auto-completes)
  for (const [id, station] of Object.entries(state.stations)) {
    if (id === 'plating') continue
    const doneSlot = station.slots.find(s => s.state === 'done' && s.user === name)
      || station.slots.find(s => s.state === 'done')
    if (doneSlot) return { name, command: `!take ${id}` }
  }

  // Serve
  for (const order of state.orders) {
    if (order.served) continue
    if (state.platedDishes.includes(order.dish)) return { name, command: `!serve ${order.id}` }
  }

  // Plate — check plating station capacity
  const platingStation = state.stations['plating']
  const platingCapacity = state.stationCapacity.plating
  if (platingStation && platingStation.slots.length < platingCapacity) {
    for (const order of state.orders) {
      if (order.served) continue
      const recipe = RECIPES[order.dish]
      const available = [...state.preparedItems]
      let canPlate = true
      for (const item of recipe.plate) {
        const idx = available.indexOf(item)
        if (idx === -1) { canPlate = false; break }
        available.splice(idx, 1)
      }
      if (canPlate) return { name, command: `!plate ${order.dish}` }
    }
  }

  // Cook something needed — check station capacity
  for (const order of state.orders) {
    if (order.served) continue
    const recipe = RECIPES[order.dish]
    for (const step of recipe.steps) {
      const station = state.stations[step.station]
      if (!station || station.onFire) continue

      // Check capacity
      const capacity = step.station === 'cutting_board'
        ? state.stationCapacity.chopping
        : state.stationCapacity.cooking
      if (station.slots.length >= capacity) continue

      if (state.preparedItems.includes(step.produces)) continue
      const alreadyCooking = station.slots.some(s => s.produces === step.produces)
      if (alreadyCooking) continue
      return { name, command: `!${step.action} ${step.target}` }
    }
  }

  // Idle chatter
  return { name, command: CHATTER[Math.floor(Math.random() * CHATTER.length)] }
}
```

Note: Moved `Serve` before `Plate` in bot priority — serve is instant and clears plated dishes, while plating now takes time and occupies a slot. Better to clear inventory first.

- [x] **Step 2: Add StationCapacity import if needed**

The bot reads `state.stationCapacity` which is on `GameState`, so no new import needed — just ensure `GameState` has the field (done in Task 1).

- [x] **Step 3: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 4: Commit**

```bash
git add src/hooks/useBotSimulation.ts
git commit -m "feat: bot respects station capacity and handles timed plating"
```

---

### Task 7: Add Station Capacity Controls to OptionsScreen

**Files:**
- Modify: `src/components/OptionsScreen.tsx`
- Modify: `src/components/OptionsScreen.module.css`

- [x] **Step 1: Add capacity controls to OptionsScreen**

In `src/components/OptionsScreen.tsx`, add a new section after the Round Duration section:

```typescript
import { GameOptions, StationCapacity } from '../state/types'

// ... existing code ...

// Inside the component, after the Round Duration section and before the Back button:

<div className={styles.section}>
  <div className={styles.label}>Station Slots</div>
  <div className={styles.capacityGrid}>
    <div className={styles.capacityRow}>
      <span className={styles.capacityLabel}>🔪 Chopping</span>
      <div className={styles.capacityControl}>
        <button
          className={styles.capacityBtn}
          onClick={() => onChange({
            ...options,
            stationCapacity: { ...options.stationCapacity, chopping: Math.max(1, options.stationCapacity.chopping - 1) }
          })}
        >-</button>
        <span className={styles.capacityValue}>{options.stationCapacity.chopping}</span>
        <button
          className={styles.capacityBtn}
          onClick={() => onChange({
            ...options,
            stationCapacity: { ...options.stationCapacity, chopping: Math.min(8, options.stationCapacity.chopping + 1) }
          })}
        >+</button>
      </div>
    </div>
    <div className={styles.capacityRow}>
      <span className={styles.capacityLabel}>🔥 Cooking</span>
      <div className={styles.capacityControl}>
        <button
          className={styles.capacityBtn}
          onClick={() => onChange({
            ...options,
            stationCapacity: { ...options.stationCapacity, cooking: Math.max(1, options.stationCapacity.cooking - 1) }
          })}
        >-</button>
        <span className={styles.capacityValue}>{options.stationCapacity.cooking}</span>
        <button
          className={styles.capacityBtn}
          onClick={() => onChange({
            ...options,
            stationCapacity: { ...options.stationCapacity, cooking: Math.min(8, options.stationCapacity.cooking + 1) }
          })}
        >+</button>
      </div>
    </div>
    <div className={styles.capacityRow}>
      <span className={styles.capacityLabel}>🍽️ Plating</span>
      <div className={styles.capacityControl}>
        <button
          className={styles.capacityBtn}
          onClick={() => onChange({
            ...options,
            stationCapacity: { ...options.stationCapacity, plating: Math.max(1, options.stationCapacity.plating - 1) }
          })}
        >-</button>
        <span className={styles.capacityValue}>{options.stationCapacity.plating}</span>
        <button
          className={styles.capacityBtn}
          onClick={() => onChange({
            ...options,
            stationCapacity: { ...options.stationCapacity, plating: Math.min(8, options.stationCapacity.plating + 1) }
          })}
        >+</button>
      </div>
    </div>
  </div>
  <div className={styles.hint}>
    Slots per station type (cooking applies to each: grill, fryer, stove, oven)
  </div>
</div>
```

- [x] **Step 2: Add capacity styles to OptionsScreen.module.css**

Append to `src/components/OptionsScreen.module.css`:

```css
.capacityGrid {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-items: center;
}

.capacityRow {
  display: flex;
  align-items: center;
  gap: 14px;
  width: 240px;
  justify-content: space-between;
}

.capacityLabel {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: #f5efe6;
  min-width: 100px;
}

.capacityControl {
  display: flex;
  align-items: center;
  gap: 8px;
}

.capacityBtn {
  width: 32px;
  height: 32px;
  border: 2px solid #3d3632;
  border-radius: 6px;
  background: #2e2926;
  color: #f5efe6;
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: border-color 0.15s, background 0.15s;
}

.capacityBtn:hover {
  border-color: #e86a2a;
  background: #3d3632;
}

.capacityValue {
  font-family: 'Space Mono', monospace;
  font-size: 18px;
  font-weight: 700;
  color: #e86a2a;
  min-width: 24px;
  text-align: center;
}
```

- [x] **Step 3: Verify the project compiles and renders**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 4: Commit**

```bash
git add src/components/OptionsScreen.tsx src/components/OptionsScreen.module.css
git commit -m "feat: add station capacity controls to options screen"
```

---

### Task 8: Update Station Component to Show Capacity

**Files:**
- Modify: `src/components/Station.tsx:60-82`
- Modify: `src/components/Kitchen.tsx:1-27`

- [x] **Step 1: Pass capacity to Station component**

In `src/components/Station.tsx`, update the Props and component:

```typescript
interface Props {
  station: StationType
  capacity: number
}

export default function Station({ station, capacity }: Props) {
  const def = STATION_DEFS[station.id]
  if (!def) return null

  const borderColor = station.onFire ? '#d94f4f' : def.color
  const slotsUsed = station.slots.length

  return (
    <div className={`${styles.station} ${station.onFire ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>
        {def.emoji} {def.name}
        <span className={styles.capacity}>{slotsUsed}/{capacity}</span>
      </div>
      {station.onFire ? (
        <div className={styles.fireStatus}>ON FIRE! !extinguish</div>
      ) : station.slots.length === 0 ? (
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
```

- [x] **Step 2: Add capacity badge style**

In `src/components/Station.module.css`, add:

```css
.capacity {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: #9a8e82;
  margin-left: 6px;
}
```

- [x] **Step 3: Update Kitchen.tsx to pass capacity and render plating station**

In `src/components/Kitchen.tsx`, update to pass capacity and separate plating:

```typescript
import { GameState } from '../state/types'
import { STATION_DEFS } from '../data/recipes'
import Station from './Station'
import PreparedItems from './PreparedItems'
import AssemblyArea from './AssemblyArea'
import styles from './Kitchen.module.css'

interface Props {
  state: GameState
}

function getStationCapacity(stationId: string, cap: GameState['stationCapacity']): number {
  if (stationId === 'cutting_board') return cap.chopping
  if (stationId === 'plating') return cap.plating
  return cap.cooking
}

export default function Kitchen({ state }: Props) {
  // Separate plating from cooking stations
  const cookingStationIds = Object.keys(STATION_DEFS).filter(id => id !== 'plating')

  return (
    <div className={styles.kitchen}>
      <div className={styles.divider}>— STATIONS —</div>
      <div className={styles.stations}>
        {cookingStationIds.map(id => (
          <Station
            key={id}
            station={state.stations[id]}
            capacity={getStationCapacity(id, state.stationCapacity)}
          />
        ))}
      </div>
      <PreparedItems items={state.preparedItems} />
      <div className={styles.divider}>— PLATING —</div>
      <div className={styles.stations}>
        <Station
          station={state.stations['plating']}
          capacity={state.stationCapacity.plating}
        />
      </div>
      <AssemblyArea state={state} />
    </div>
  )
}
```

- [x] **Step 4: Update SlotRow for plating station specifics**

In the `SlotRow` component in `src/components/Station.tsx`, the `!take` hint should not show for plating slots (they auto-complete). Update the status line:

```typescript
<div className={styles.slotStatus} style={{ color: slot.state === 'done' ? '#5cb85c' : '#e8943a' }}>
  {slot.state === 'cooking'
    ? `${stationId === 'plating' ? 'plating' : 'cooking'} ${Math.floor(progress * 100)}%`
    : `DONE! !take ${shortId}`}
</div>
```

Since plating auto-completes, slots will never reach 'done' state in the UI (they get removed in TICK). The 'cooking' label change to 'plating' is the only needed UI tweak.

- [x] **Step 5: Verify the project compiles**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npx tsc --noEmit 2>&1 | head -30`

- [x] **Step 6: Commit**

```bash
git add src/components/Station.tsx src/components/Station.module.css src/components/Kitchen.tsx
git commit -m "feat: show station capacity in UI and render plating station"
```

---

### Task 9: Update InfoBar with Plating Station Info

**Files:**
- Modify: `src/components/InfoBar.tsx` (if it references plating as instant)

- [x] **Step 1: Read InfoBar.tsx to check current content**

Read `src/components/InfoBar.tsx` and update any references to plating to reflect that it's now a timed action. The command is still `!plate [dish]` so the command reference should be fine, but any description saying "instant" should be updated.

- [x] **Step 2: Make necessary updates**

Update any text that describes plating as instant. If the InfoBar lists commands, ensure `!plate [dish]` is still listed correctly.

- [x] **Step 3: Commit**

```bash
git add src/components/InfoBar.tsx
git commit -m "feat: update InfoBar to reflect timed plating mechanic"
```

---

### Task 10: Manual Testing and Final Verification

- [x] **Step 1: Run the dev server**

Run: `cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run dev`

- [x] **Step 2: Test station capacity limits**

1. Go to Options, set chopping to 1, cooking to 1, plating to 1
2. Start a game
3. Type `!chop lettuce` — should succeed
4. Enable bots or type another cook command — should get "station is full" error
5. Wait for chop to finish, `!take cboard`
6. Repeat for grill, fryer, etc.

- [x] **Step 3: Test plating flow**

1. Cook all ingredients for a burger (chop lettuce, grill patty, toast bun)
2. Take all items
3. `!plate burger` — should show "started plating" message
4. Player should be blocked (can't cook while plating)
5. After ~3 seconds, dish should auto-complete and appear in assembly area
6. `!serve [order#]` — should work as before

- [x] **Step 4: Test capacity scaling**

1. Go to Options, set all stations to 4
2. Start game with bots enabled
3. Verify multiple bots can cook at same station (up to 4)
4. Verify bots respect capacity limits

- [x] **Step 5: Test edge cases**

1. Try to plate when plating station is full → error message
2. Try to plate without ingredients → error message (ingredients not consumed)
3. Try to cook when station full → error message
4. Fire on a station → extinguish still works normally

- [x] **Step 6: Final commit if any fixes needed**

```bash
git add -A
git commit -m "fix: address issues found during manual testing"
```
