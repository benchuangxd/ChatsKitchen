# Kitchen Events Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Kitchen Events system where random timed events (hazards and opportunities) spawn during gameplay and require collective Twitch chat responses to resolve.

**Architecture:** A standalone `useKitchenEvents` hook owns the full event lifecycle (spawn timer, progress, expiry, command matching) and dispatches into `gameReducer` only for gameplay effects (speed modifiers, disabled stations, etc.). Visual overlays (event card, smoke, glitched orders) are driven from hook state. One event active at a time.

**Tech Stack:** React 18, TypeScript (strict), Vite 5. No test framework — verification is `npm run build` (tsc + bundle) plus manual browser smoke test. Project uses `useReducer` + `setInterval`-based tick loops (see `useGameLoop.ts` as the reference pattern).

**Spec:** `docs/superpowers/specs/2026-04-17-kitchen-events-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/state/types.ts` | Modify | Add `KitchenEvent`, `EventType`, `EventCategory`, `GameState` additions, `GameOptions.kitchenEventsEnabled` |
| `src/state/gameReducer.ts` | Modify | Add 7 new actions; update `COOK` (disabled stations + speed modifier), `SERVE` (money multiplier), `TICK` (expire modifiers), `RESET` (clear new fields) |
| `src/hooks/useKitchenEvents.ts` | Create | Event lifecycle hook — spawn timer, 100ms tick, command matching, resolve/fail dispatch |
| `src/data/kitchenEventDefs.ts` | Create | Event definitions, command pools, constants; keeps the hook lean |
| `src/components/EventCardOverlay.tsx` | Create | Renders the floating event card with progress bars |
| `src/components/EventCardOverlay.module.css` | Create | Styles for event card |
| `src/components/SmokeOverlay.tsx` | Create | Frosted fog overlay for Smoke Blast |
| `src/components/SmokeOverlay.module.css` | Create | Styles for smoke |
| `src/components/DiningRoom.tsx` | Modify | Accept `isGlitched` prop; pass it to `OrderTicket` |
| `src/components/OrderTicket.tsx` | Modify | Accept `isGlitched` prop; scramble text when active |
| `src/App.tsx` | Modify | Wire `useKitchenEvents`, `handleEventCommand`, overlays, `kitchenEventsEnabled` |
| `src/components/FreePlaySetup.tsx` | Modify | Add `kitchenEventsEnabled` toggle |
| `src/components/OptionsScreen.tsx` | Modify | Add `kitchenEventsEnabled` toggle (match FreePlaySetup pattern) |

---

## Task 1: Types — KitchenEvent, GameState additions, GameOptions

**Files:**
- Modify: `src/state/types.ts`

- [ ] **Step 1: Add event types and KitchenEvent interface to `types.ts`**

Add after the existing `AdventureBestRun` interface and before `GameState`:

```typescript
export type EventType =
  | 'rat_invasion' | 'angry_chef'
  | 'power_trip' | 'smoke_blast' | 'glitched_orders'
  | 'chefs_chant' | 'mystery_recipe' | 'typing_frenzy' | 'dance'

export type EventCategory = 'hazard-penalty' | 'hazard-immediate' | 'opportunity'

export interface KitchenEvent {
  id: string
  category: EventCategory
  type: EventType
  chosenCommand: string
  progress: number           // 0–100
  threshold: number          // ceil(playerCount × 0.8), min 1
  respondedUsers: string[]   // unused for Dance; Dance uses danceProgress
  timeLeft: number | null    // null for hazard-immediate
  resolved: boolean
  failed: boolean
  payload: {
    disabledStations?: string[]
    anagramAnswer?: string
    typingPhrase?: string
    danceProgress?: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT', string[]>
  }
}
```

- [ ] **Step 2: Add new fields to `GameState` interface**

In the `GameState` interface, add after `playerStats`:

```typescript
  cookingSpeedModifier?: { multiplier: number; expiresAt: number }
  moneyMultiplier?: { multiplier: number; expiresAt: number }
  disabledStations?: string[]
```

- [ ] **Step 3: Add `kitchenEventsEnabled` to `GameOptions`**

In `GameOptions`, add after `autoRestartDelay`:

```typescript
  kitchenEventsEnabled: boolean
```

- [ ] **Step 4: Verify types compile**

```bash
npm run build
```

Expected: builds cleanly (or only errors in App.tsx/gameReducer where new fields aren't wired yet — those are fine at this stage).

- [ ] **Step 5: Commit**

```bash
git add src/state/types.ts
git commit -m "feat: add KitchenEvent types and GameState/GameOptions additions"
```

---

## Task 2: Reducer — 7 new actions + updates to COOK, SERVE, TICK, RESET

**Files:**
- Modify: `src/state/gameReducer.ts`

The reducer currently handles: `TICK`, `COOK`, `SERVE`, `EXTINGUISH`, `COOL`, `SPAWN_ORDER`, `ADD_CHAT`, `RESET`, `ADJUST_COOK_TIMES`, `SET_STATION_HEAT`, `OVERHEAT_STATION`.

Reference the existing `COOL` and `EXTINGUISH` cases as style guides. All reducer cases return new state objects — never mutate.

- [ ] **Step 1: Extend `GameAction` union with the 7 new action types**

Add to the `GameAction` union in `gameReducer.ts` (after `OVERHEAT_STATION`):

```typescript
  | { type: 'REMOVE_PREPARED_ITEMS'; count: number }
  | { type: 'SET_COOKING_SPEED_MODIFIER'; multiplier: number; expiresAt: number }
  | { type: 'DISABLE_STATIONS'; stationIds: string[] }
  | { type: 'ENABLE_STATIONS'; stationIds: string[] }
  | { type: 'ADD_MONEY_MULTIPLIER'; multiplier: number; expiresAt: number }
  | { type: 'ADD_PREPARED_ITEMS'; items: string[] }
  | { type: 'EXTEND_ORDER_PATIENCE'; ms: number }
```

- [ ] **Step 2: Add the 7 new reducer cases before the `default` case**

```typescript
case 'REMOVE_PREPARED_ITEMS': {
  const count = Math.min(action.count, state.preparedItems.length)
  if (count === 0) return state
  const items = [...state.preparedItems]
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * items.length)
    items.splice(idx, 1)
  }
  return addMsg({ ...state, preparedItems: items }, 'KITCHEN', `🐀 Rats stole ${count} prepared ingredient(s)!`, 'error')
}

case 'SET_COOKING_SPEED_MODIFIER':
  return { ...state, cookingSpeedModifier: { multiplier: action.multiplier, expiresAt: action.expiresAt } }

case 'DISABLE_STATIONS': {
  const current = state.disabledStations ?? []
  const merged = [...new Set([...current, ...action.stationIds])]
  return { ...state, disabledStations: merged }
}

case 'ENABLE_STATIONS': {
  const current = state.disabledStations ?? []
  const remaining = current.filter(id => !action.stationIds.includes(id))
  return { ...state, disabledStations: remaining.length > 0 ? remaining : undefined }
}

case 'ADD_MONEY_MULTIPLIER':
  return { ...state, moneyMultiplier: { multiplier: action.multiplier, expiresAt: action.expiresAt } }

case 'ADD_PREPARED_ITEMS':
  return addMsg(
    { ...state, preparedItems: [...state.preparedItems, ...action.items] },
    'KITCHEN', `🧩 Mystery solved! ${action.items.length} ingredients added to the tray!`, 'success'
  )

case 'EXTEND_ORDER_PATIENCE': {
  const updatedOrders = state.orders.map(o =>
    o.served ? o : { ...o, patienceLeft: Math.min(o.patienceMax, o.patienceLeft + action.ms) }
  )
  return addMsg({ ...state, orders: updatedOrders }, 'KITCHEN', `🕺 Dance worked! All orders got extra time!`, 'success')
}
```

- [ ] **Step 3: Update `COOK` case to check `disabledStations` and apply speed modifier**

In the `COOK` case, add a disabled station check right after the overheated check (after line `if (station.overheated)`):

```typescript
// Disabled station check (Kitchen Events — Power Trip)
if ((state.disabledStations ?? []).includes(stationId)) {
  return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is offline! Help restore power!`, 'error')
}
```

Then update the `cookDuration` calculation in the new slot (currently `matchedStep.duration / speed`) to apply the speed modifier:

```typescript
// Before:
cookDuration: matchedStep.duration / speed,

// After:
cookDuration: matchedStep.duration / (speed * (state.cookingSpeedModifier?.multiplier ?? 1)),
```

- [ ] **Step 4: Update `SERVE` case to apply `moneyMultiplier`**

Currently: `const reward = Math.round(recipe.reward + timeBonus)`

Replace with:

```typescript
const baseReward = recipe.reward + timeBonus
const multiplier = state.moneyMultiplier?.multiplier ?? 1
const reward = Math.round(baseReward * multiplier)
```

- [ ] **Step 5: Update `TICK` case to expire `cookingSpeedModifier` and `moneyMultiplier`**

In the `TICK` case, just before the `return` statement at the end, add:

```typescript
// Expire timed modifiers
const cookingSpeedModifier = state.cookingSpeedModifier && now < state.cookingSpeedModifier.expiresAt
  ? state.cookingSpeedModifier : undefined
const moneyMultiplier = state.moneyMultiplier && now < state.moneyMultiplier.expiresAt
  ? state.moneyMultiplier : undefined
```

Then include these in the returned state:

```typescript
return { ...state, stations: newStations, activeUsers: newActiveUsers, preparedItems: newPreparedItems,
  playerStats: newPlayerStats, orders, lost, timeLeft,
  chatMessages: messages.slice(-200), nextMessageId: nextMsgId,
  cookingSpeedModifier, moneyMultiplier }
```

- [ ] **Step 6: Update `RESET` case to clear new fields**

`createInitialState` returns the base state — add `disabledStations: undefined, cookingSpeedModifier: undefined, moneyMultiplier: undefined` to the returned object in `createInitialState`:

```typescript
return {
  money: 0,
  // ... existing fields ...
  playerStats: {},
  disabledStations: undefined,
  cookingSpeedModifier: undefined,
  moneyMultiplier: undefined,
}
```

- [ ] **Step 7: Verify build**

```bash
npm run build
```

Expected: compiles cleanly.

- [ ] **Step 8: Commit**

```bash
git add src/state/gameReducer.ts
git commit -m "feat: add kitchen events reducer actions and modifier support"
```

---

## Task 3: Event definitions data file + useKitchenEvents hook

**Files:**
- Create: `src/data/kitchenEventDefs.ts`
- Create: `src/hooks/useKitchenEvents.ts`

### Part A — `kitchenEventDefs.ts`

This file holds all constants and definitions so the hook stays readable.

- [ ] **Step 1: Create `src/data/kitchenEventDefs.ts`**

```typescript
import { EventCategory, EventType } from '../state/types'
import { RECIPES } from './recipes'

// Tunable constants
export const EVENT_SPAWN_MIN_MS = 30_000
export const EVENT_SPAWN_MAX_MS = 60_000
export const RESOLVE_THRESHOLD_RATIO = 0.8
export const ANGRY_CHEF_DEBUFF_MULTIPLIER = 0.7
export const ANGRY_CHEF_DEBUFF_DURATION_MS = 15_000
export const CHEFS_CHANT_BOOST_MULTIPLIER = 1.5
export const CHEFS_CHANT_BOOST_DURATION_MS = 20_000
export const TYPING_FRENZY_MULTIPLIER = 1.5
export const TYPING_FRENZY_DURATION_MS = 20_000
export const DANCE_PATIENCE_BONUS_MS = 15_000
export const RAT_INVASION_ITEMS_STOLEN = 3
export const MYSTERY_RECIPE_ITEMS_REWARDED = 3
export const HAZARD_TIME_LIMIT_MS = 10_000
export const OPPORTUNITY_TIME_LIMIT_MS = 12_000

export const TYPING_FRENZY_PHRASES = [
  'FIRE IN THE HOLE', 'ORDER UP', 'YES CHEF', 'TABLE FOR TWO',
  'BEHIND YOU', 'ON THE FLY', 'HEARD THAT', 'MISE EN PLACE',
]

export interface EventDef {
  type: EventType
  category: EventCategory
  emoji: string
  label: string
  commandPool: string[]
  failDescription?: string    // shown on hazard-penalty cards
  rewardDescription?: string  // shown on opportunity cards
}

export const EVENT_DEFS: EventDef[] = [
  {
    type: 'rat_invasion',
    category: 'hazard-penalty',
    emoji: '🐀',
    label: 'Rat Invasion',
    commandPool: ['SHOO', 'CHASE', 'BEGONE'],
    failDescription: 'Fail: lose prepped ingredients',
  },
  {
    type: 'angry_chef',
    category: 'hazard-penalty',
    emoji: '👨‍🍳',
    label: 'Angry Chef',
    commandPool: ['SORRY CHEF', 'APOLOGIES CHEF', 'MY BAD CHEF'],
    failDescription: 'Fail: cooking speed debuff for 15s',
  },
  {
    type: 'power_trip',
    category: 'hazard-immediate',
    emoji: '🔌',
    label: 'Power Trip',
    commandPool: ['RESET', 'REBOOT', 'RESTART'],
    failDescription: 'Stations are offline until resolved',
  },
  {
    type: 'smoke_blast',
    category: 'hazard-immediate',
    emoji: '💨',
    label: 'Smoke Blast',
    commandPool: ['CLEAR', 'VENTILATE', 'BLOW'],
    failDescription: 'Kitchen is obscured until resolved',
  },
  {
    type: 'glitched_orders',
    category: 'hazard-immediate',
    emoji: '📦',
    label: 'Glitched Orders',
    commandPool: ['FIX', 'DEBUG', 'PATCH'],
    failDescription: 'Orders scrambled until resolved',
  },
  {
    type: 'chefs_chant',
    category: 'opportunity',
    emoji: '📢',
    label: "Chef's Chant",
    commandPool: ['YES CHEF', 'AYE CHEF', 'OF COURSE CHEF'],
    rewardDescription: 'Reward: cooking speed boost for 20s',
  },
  {
    type: 'mystery_recipe',
    category: 'opportunity',
    emoji: '🧩',
    label: 'Mystery Recipe',
    commandPool: [],  // dynamically generated as anagram at spawn
    rewardDescription: 'Reward: 3 free prepped ingredients',
  },
  {
    type: 'typing_frenzy',
    category: 'opportunity',
    emoji: '⚡',
    label: 'Typing Frenzy',
    commandPool: [],  // chosen from TYPING_FRENZY_PHRASES at spawn
    rewardDescription: 'Reward: money multiplier × 1.5 for 20s',
  },
  {
    type: 'dance',
    category: 'opportunity',
    emoji: '🕺',
    label: 'Dance',
    commandPool: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    rewardDescription: 'Reward: all orders +15s patience',
  },
]

// Returns all unique step target values from the given recipe keys.
// Falls back to all recipes if the list is empty.
export function getIngredientTargets(enabledRecipes: string[]): string[] {
  const keys = enabledRecipes.length > 0 ? enabledRecipes : Object.keys(RECIPES)
  const targets = new Set<string>()
  for (const key of keys) {
    const recipe = RECIPES[key]
    if (!recipe) continue
    for (const step of recipe.steps) targets.add(step.target)
  }
  return [...targets]
}

// Returns all unique step produces values from the given recipe keys.
export function getProducesValues(enabledRecipes: string[]): string[] {
  const keys = enabledRecipes.length > 0 ? enabledRecipes : Object.keys(RECIPES)
  const produces = new Set<string>()
  for (const key of keys) {
    const recipe = RECIPES[key]
    if (!recipe) continue
    for (const step of recipe.steps) produces.add(step.produces)
  }
  return [...produces]
}

// Produces a simple character-shuffle anagram of the input string.
// Guaranteed to differ from the original (retries up to 10 times).
export function makeAnagram(word: string): string {
  const chars = word.toUpperCase().split('')
  for (let attempt = 0; attempt < 10; attempt++) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]]
    }
    const result = chars.join('')
    if (result !== word.toUpperCase()) return result
  }
  return chars.join('')  // return last attempt even if identical (edge case: single char)
}

// Stable character scramble seeded by a number (for glitched order tickets).
// Same seed → same result across renders.
export function seededScramble(text: string, seed: number): string {
  const chars = text.split('')
  let s = seed
  for (let i = chars.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) & 0xffffffff
    const j = Math.abs(s) % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]]
  }
  return chars.join('')
}
```

### Part B — `useKitchenEvents.ts`

- [ ] **Step 2: Create `src/hooks/useKitchenEvents.ts`**

```typescript
import { useEffect, useRef, useState, useCallback } from 'react'
import { GameState, KitchenEvent, EventType } from '../state/types'
import { GameAction } from '../state/gameReducer'
import {
  EVENT_DEFS, EVENT_SPAWN_MIN_MS, EVENT_SPAWN_MAX_MS,
  RESOLVE_THRESHOLD_RATIO,
  ANGRY_CHEF_DEBUFF_MULTIPLIER, ANGRY_CHEF_DEBUFF_DURATION_MS,
  CHEFS_CHANT_BOOST_MULTIPLIER, CHEFS_CHANT_BOOST_DURATION_MS,
  TYPING_FRENZY_MULTIPLIER, TYPING_FRENZY_DURATION_MS,
  TYPING_FRENZY_PHRASES, DANCE_PATIENCE_BONUS_MS,
  RAT_INVASION_ITEMS_STOLEN, MYSTERY_RECIPE_ITEMS_REWARDED,
  HAZARD_TIME_LIMIT_MS, OPPORTUNITY_TIME_LIMIT_MS,
  getIngredientTargets, getProducesValues, makeAnagram,
} from '../data/kitchenEventDefs'

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function calcThreshold(playerCount: number): number {
  return Math.max(1, Math.ceil(playerCount * RESOLVE_THRESHOLD_RATIO))
}

export function useKitchenEvents(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  active: boolean,
  paused: boolean,
) {
  const [activeEvent, setActiveEvent] = useState<KitchenEvent | null>(null)

  const activeEventRef = useRef(activeEvent)
  activeEventRef.current = activeEvent
  const stateRef = useRef(state)
  stateRef.current = state
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const activeRef = useRef(active)
  activeRef.current = active
  const lastEventTypeRef = useRef<EventType | null>(null)
  const spawnTimerRef = useRef(0)
  const spawnIntervalRef = useRef(
    EVENT_SPAWN_MIN_MS + Math.random() * (EVENT_SPAWN_MAX_MS - EVENT_SPAWN_MIN_MS)
  )

  // ── Spawn a new event ──────────────────────────────────────────────────────
  const spawnEvent = useCallback(() => {
    const s = stateRef.current
    const playerCount = Object.keys(s.playerStats).length
    const threshold = calcThreshold(playerCount)

    // Build candidate pool — exclude last event type to prevent back-to-back
    let candidates = EVENT_DEFS.filter(d => d.type !== lastEventTypeRef.current)

    // Power Trip: needs at least 2 non-overheated stations
    const eligibleStations = Object.values(s.stations).filter(st => !st.overheated)
    if (eligibleStations.length < 2) {
      candidates = candidates.filter(d => d.type !== 'power_trip')
    }

    // Safety fallback — preserve the power_trip eligibility filter even when resetting
    if (candidates.length === 0) {
      candidates = eligibleStations.length < 2
        ? EVENT_DEFS.filter(d => d.type !== 'power_trip')
        : EVENT_DEFS
    }
    if (candidates.length === 0) candidates = EVENT_DEFS  // absolute last resort

    const def = pickRandom(candidates)
    lastEventTypeRef.current = def.type

    const id = `evt_${Date.now()}`
    const timeLeft = def.category === 'hazard-immediate' ? null
      : def.category === 'hazard-penalty' ? HAZARD_TIME_LIMIT_MS
      : OPPORTUNITY_TIME_LIMIT_MS

    let chosenCommand = pickRandom(def.commandPool.length > 0 ? def.commandPool : [''])
    const payload: KitchenEvent['payload'] = {}

    // Event-specific payload setup
    if (def.type === 'power_trip') {
      const shuffled = [...eligibleStations].sort(() => Math.random() - 0.5)
      const toDisable = shuffled.slice(0, 2).map(st => st.id)
      payload.disabledStations = toDisable
      dispatch({ type: 'DISABLE_STATIONS', stationIds: toDisable })
    }

    if (def.type === 'mystery_recipe') {
      const targets = getIngredientTargets(s.enabledRecipes)
      const answer = pickRandom(targets)
      payload.anagramAnswer = answer
      chosenCommand = makeAnagram(answer)
    }

    if (def.type === 'typing_frenzy') {
      const phrase = pickRandom(TYPING_FRENZY_PHRASES)
      payload.typingPhrase = phrase
      chosenCommand = phrase
    }

    if (def.type === 'dance') {
      payload.danceProgress = { UP: [], DOWN: [], LEFT: [], RIGHT: [] }
      chosenCommand = 'UP / DOWN / LEFT / RIGHT'
    }

    const event: KitchenEvent = {
      id,
      category: def.category,
      type: def.type,
      chosenCommand,
      progress: 0,
      threshold,
      respondedUsers: [],
      timeLeft,
      resolved: false,
      failed: false,
      payload,
    }

    // Announce in chat
    const def2 = EVENT_DEFS.find(d => d.type === def.type)!
    const cmdDisplay = def.type === 'dance' ? 'UP / DOWN / LEFT / RIGHT'
      : def.type === 'mystery_recipe' ? chosenCommand
      : chosenCommand
    const label = def2.category === 'opportunity' ? '⚡ Opportunity' : '⚠️ Hazard'
    dispatch({
      type: 'ADD_CHAT',
      username: 'KITCHEN',
      text: `${label}: ${def2.emoji} ${def2.label}! Type ${cmdDisplay} in chat to help!`,
      msgType: 'system',
    })

    setActiveEvent(event)
  }, [dispatch])

  // ── Resolve an event ──────────────────────────────────────────────────────
  const resolveEvent = useCallback((event: KitchenEvent) => {
    const s = stateRef.current
    const now = Date.now()

    if (event.type === 'power_trip' && event.payload.disabledStations) {
      dispatch({ type: 'ENABLE_STATIONS', stationIds: event.payload.disabledStations })
    }
    if (event.type === 'chefs_chant') {
      dispatch({ type: 'SET_COOKING_SPEED_MODIFIER', multiplier: CHEFS_CHANT_BOOST_MULTIPLIER, expiresAt: now + CHEFS_CHANT_BOOST_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `📢 YES CHEF! Cooking speed boosted for 20s!`, msgType: 'success' })
    }
    if (event.type === 'mystery_recipe') {
      const produces = getProducesValues(s.enabledRecipes)
      const items: string[] = []
      for (let i = 0; i < MYSTERY_RECIPE_ITEMS_REWARDED; i++) {
        items.push(pickRandom(produces))
      }
      dispatch({ type: 'ADD_PREPARED_ITEMS', items })
    }
    if (event.type === 'typing_frenzy') {
      dispatch({ type: 'ADD_MONEY_MULTIPLIER', multiplier: TYPING_FRENZY_MULTIPLIER, expiresAt: now + TYPING_FRENZY_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `⚡ Money multiplier × 1.5 active for 20s!`, msgType: 'success' })
    }
    if (event.type === 'dance') {
      dispatch({ type: 'EXTEND_ORDER_PATIENCE', ms: DANCE_PATIENCE_BONUS_MS })
    }

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, resolved: true, progress: 100 } : prev)
    // Clear after brief display
    setTimeout(() => setActiveEvent(null), 1500)
  }, [dispatch])

  // ── Fail an event ─────────────────────────────────────────────────────────
  const failEvent = useCallback((event: KitchenEvent) => {
    const now = Date.now()
    if (event.type === 'rat_invasion') {
      dispatch({ type: 'REMOVE_PREPARED_ITEMS', count: RAT_INVASION_ITEMS_STOLEN })
    }
    if (event.type === 'angry_chef') {
      dispatch({ type: 'SET_COOKING_SPEED_MODIFIER', multiplier: ANGRY_CHEF_DEBUFF_MULTIPLIER, expiresAt: now + ANGRY_CHEF_DEBUFF_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `👨‍🍳 Chef is angry! Cooking speed reduced for 15s!`, msgType: 'error' })
    }

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, failed: true } : prev)
    setTimeout(() => setActiveEvent(null), 1500)
  }, [dispatch])

  // ── 100ms tick ────────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!activeRef.current) return

      const ev = activeEventRef.current
      const isPaused = pausedRef.current

      // Advance spawn timer when no event active
      if (!ev) {
        if (!isPaused) {
          spawnTimerRef.current += 100
          if (spawnTimerRef.current >= spawnIntervalRef.current) {
            spawnTimerRef.current = 0
            spawnIntervalRef.current = EVENT_SPAWN_MIN_MS + Math.random() * (EVENT_SPAWN_MAX_MS - EVENT_SPAWN_MIN_MS)
            spawnEvent()
          }
        }
        return
      }

      // Skip resolved/failed events (waiting for setTimeout clearance)
      if (ev.resolved || ev.failed) return

      // Decrement timeLeft for timed events
      if (ev.timeLeft !== null && !isPaused) {
        const newTimeLeft = ev.timeLeft - 100
        if (newTimeLeft <= 0) {
          failEvent(ev)
          return
        }
        setActiveEvent(prev => prev?.id === ev.id ? { ...prev, timeLeft: newTimeLeft } : prev)
      }
    }, 100)

    return () => clearInterval(interval)
  }, [spawnEvent, failEvent])

  // ── Command handler ────────────────────────────────────────────────────────
  const handleEventCommand = useCallback((user: string, text: string) => {
    const ev = activeEventRef.current
    if (!ev || ev.resolved || ev.failed) return

    const normalized = text.trim().toUpperCase()

    // Dance: any of the 4 directions
    if (ev.type === 'dance') {
      const dir = normalized as 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
      if (!['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(dir)) return
      const prog = ev.payload.danceProgress!
      if (prog[dir].includes(user)) return  // already contributed this direction

      const newProg = { ...prog, [dir]: [...prog[dir], user] }
      const minCount = Math.min(...Object.values(newProg).map(arr => arr.length))
      const progress = Math.min(100, Math.round(minCount / ev.threshold * 100))

      if (minCount >= ev.threshold) {
        resolveEvent({ ...ev, payload: { ...ev.payload, danceProgress: newProg }, progress: 100 })
      } else {
        setActiveEvent(prev => prev?.id === ev.id
          ? { ...prev, progress, payload: { ...prev.payload, danceProgress: newProg } }
          : prev)
      }
      return
    }

    // Mystery Recipe: match against anagramAnswer, not chosenCommand
    const matchTarget = ev.type === 'mystery_recipe'
      ? ev.payload.anagramAnswer!.toUpperCase()
      : ev.chosenCommand

    if (normalized !== matchTarget) return
    if (ev.respondedUsers.includes(user)) return  // already contributed

    const newUsers = [...ev.respondedUsers, user]
    const progress = Math.min(100, Math.round(newUsers.length / ev.threshold * 100))

    if (newUsers.length >= ev.threshold) {
      resolveEvent({ ...ev, respondedUsers: newUsers, progress: 100 })
    } else {
      setActiveEvent(prev => prev?.id === ev.id
        ? { ...prev, respondedUsers: newUsers, progress }
        : prev)
    }
  }, [resolveEvent])

  // Stop events when deactivated (e.g. game ends)
  useEffect(() => {
    if (!active) {
      const ev = activeEventRef.current
      // Re-enable any disabled stations
      if (ev?.type === 'power_trip' && ev.payload.disabledStations) {
        dispatch({ type: 'ENABLE_STATIONS', stationIds: ev.payload.disabledStations })
      }
      setActiveEvent(null)
      spawnTimerRef.current = 0
    }
  }, [active, dispatch])

  return { activeEvent, handleEventCommand }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: builds cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/data/kitchenEventDefs.ts src/hooks/useKitchenEvents.ts
git commit -m "feat: add kitchenEventDefs and useKitchenEvents hook"
```

---

## Task 4: EventCardOverlay + SmokeOverlay UI components

**Files:**
- Create: `src/components/EventCardOverlay.tsx`
- Create: `src/components/EventCardOverlay.module.css`
- Create: `src/components/SmokeOverlay.tsx`
- Create: `src/components/SmokeOverlay.module.css`

Z-index reference from existing codebase: 100 (settings btn), 200 (countdown overlay), 300 (PauseModal), 500 (TutorialOverlay). Use **250** for SmokeOverlay (above kitchen, below PauseModal) and **260** for EventCardOverlay (above smoke, below PauseModal).

### Part A — EventCardOverlay

- [ ] **Step 1: Create `src/components/EventCardOverlay.module.css`**

```css
.overlay {
  position: fixed;
  inset: 0;
  z-index: 260;
  pointer-events: none;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 14vh;
}

.card {
  pointer-events: all;
  background: #252836;
  border-radius: 14px;
  padding: 20px 26px;
  min-width: 280px;
  max-width: 340px;
  text-align: center;
  animation: pulseGlow 1.2s ease-in-out infinite alternate;
}

.cardHazard {
  border: 2px solid #e74c3c;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(231, 76, 60, 0.2);
}

.cardOpportunity {
  border: 2px solid #27ae60;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(39, 174, 96, 0.2);
}

.cardResolved {
  opacity: 0.6;
  animation: none;
}

.cardFailed {
  opacity: 0.6;
  animation: none;
}

@keyframes pulseGlow {
  from { box-shadow: 0 8px 40px rgba(0, 0, 0, 0.75), 0 0 15px rgba(231, 76, 60, 0.15); }
  to   { box-shadow: 0 8px 40px rgba(0, 0, 0, 0.75), 0 0 40px rgba(231, 76, 60, 0.45); }
}

.tag {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 2px;
  margin-bottom: 8px;
}

.tagHazard   { color: #e74c3c; }
.tagOpportunity { color: #27ae60; }

.title {
  font-family: 'Lilita One', cursive;
  font-size: 22px;
  color: #fff;
  margin-bottom: 14px;
}

.cmdHint {
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
}

.cmdHintHazard {
  background: rgba(231, 76, 60, 0.08);
  border: 1px solid rgba(231, 76, 60, 0.35);
}

.cmdHintOpportunity {
  background: rgba(39, 174, 96, 0.08);
  border: 1px solid rgba(39, 174, 96, 0.35);
}

.cmdHint code {
  font-family: 'Space Mono', monospace;
  font-size: 22px;
  font-weight: 700;
  letter-spacing: 2px;
}

.cmdHintHazard code    { color: #e74c3c; }
.cmdHintOpportunity code { color: #27ae60; }

.description {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: #8a8fa8;
  margin-bottom: 16px;
  min-height: 18px;
}

.barsWrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.barLabel {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: #666;
  text-align: left;
  margin-bottom: 2px;
}

.barTrack {
  height: 18px;
  background: #1a1a1a;
  border-radius: 9px;
  overflow: hidden;
}

.barFill {
  height: 100%;
  border-radius: 9px;
  transition: width 0.15s ease;
}

.barFillTime    { background: #555; }
.barFillHazard  { background: #e74c3c; }
.barFillOpp     { background: #27ae60; }

.outcomeMsg {
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  font-weight: 600;
  margin-top: 10px;
}

.outcomeResolved { color: #27ae60; }
.outcomeFailed   { color: #e74c3c; }
```

- [ ] **Step 2: Create `src/components/EventCardOverlay.tsx`**

```typescript
import { KitchenEvent } from '../state/types'
import { createPortal } from 'react-dom'
import styles from './EventCardOverlay.module.css'

interface Props {
  activeEvent: KitchenEvent | null
}

export default function EventCardOverlay({ activeEvent }: Props) {
  if (!activeEvent) return null

  const ev = activeEvent
  const isHazard = ev.category !== 'opportunity'
  const colorKey = isHazard ? 'Hazard' : 'Opportunity'

  const tagText = isHazard ? '⚠️ Hazard' : '⚡ Opportunity'

  const description = isHazard
    ? (ev.category === 'hazard-penalty' ? `Fail: ${ev.type === 'rat_invasion' ? 'lose prepped ingredients' : 'cooking speed debuff for 15s'}` : `Effect active — type to resolve`)
    : (ev.type === 'chefs_chant' ? 'Reward: cooking speed boost for 20s'
      : ev.type === 'mystery_recipe' ? 'Reward: 3 free prepped ingredients'
      : ev.type === 'typing_frenzy' ? 'Reward: money × 1.5 for 20s'
      : 'Reward: all orders +15s patience')

  const timePercent = ev.timeLeft !== null && ev.category !== 'hazard-immediate'
    ? (ev.timeLeft / (ev.category === 'hazard-penalty' ? 10_000 : 12_000)) * 100
    : null

  const cmdDisplay = ev.type === 'dance' ? 'UP / DOWN / LEFT / RIGHT'
    : ev.type === 'mystery_recipe' ? ev.chosenCommand
    : ev.chosenCommand

  const cardClass = [
    styles.card,
    isHazard ? styles.cardHazard : styles.cardOpportunity,
    ev.resolved ? styles.cardResolved : '',
    ev.failed ? styles.cardFailed : '',
  ].filter(Boolean).join(' ')

  return createPortal(
    <div className={styles.overlay}>
      <div className={cardClass}>
        <div className={`${styles.tag} ${isHazard ? styles.tagHazard : styles.tagOpportunity}`}>
          {tagText}
        </div>
        <div className={styles.title}>{ev.type === 'rat_invasion' ? '🐀 Rat Invasion'
          : ev.type === 'angry_chef' ? '👨‍🍳 Angry Chef'
          : ev.type === 'power_trip' ? '🔌 Power Trip'
          : ev.type === 'smoke_blast' ? '💨 Smoke Blast'
          : ev.type === 'glitched_orders' ? '📦 Glitched Orders'
          : ev.type === 'chefs_chant' ? "📢 Chef's Chant"
          : ev.type === 'mystery_recipe' ? '🧩 Mystery Recipe'
          : ev.type === 'typing_frenzy' ? '⚡ Typing Frenzy'
          : '🕺 Dance'}
        </div>
        <div className={`${styles.cmdHint} ${isHazard ? styles.cmdHintHazard : styles.cmdHintOpportunity}`}>
          <code>{cmdDisplay}</code>
        </div>
        <div className={styles.description}>{description}</div>

        {ev.resolved && <div className={`${styles.outcomeMsg} ${styles.outcomeResolved}`}>✓ Resolved!</div>}
        {ev.failed && <div className={`${styles.outcomeMsg} ${styles.outcomeFailed}`}>✗ Failed!</div>}

        {!ev.resolved && !ev.failed && (
          <div className={styles.barsWrap}>
            {timePercent !== null && (
              <div>
                <div className={styles.barLabel}>Time</div>
                <div className={styles.barTrack}>
                  <div className={`${styles.barFill} ${styles.barFillTime}`} style={{ width: `${timePercent}%` }} />
                </div>
              </div>
            )}
            <div>
              <div className={styles.barLabel}>Progress</div>
              <div className={styles.barTrack}>
                <div
                  className={`${styles.barFill} ${isHazard ? styles.barFillHazard : styles.barFillOpp}`}
                  style={{ width: `${ev.progress}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  )
}
```

### Part B — SmokeOverlay

- [ ] **Step 3: Create `src/components/SmokeOverlay.module.css`**

```css
.smoke {
  position: fixed;
  inset: 0;
  z-index: 250;
  pointer-events: none;
  background: radial-gradient(ellipse at center, rgba(220, 220, 220, 0.55) 0%, rgba(240, 240, 240, 0.82) 100%);
  backdrop-filter: blur(6px);
  transition: opacity 0.3s ease;
}
```

- [ ] **Step 4: Create `src/components/SmokeOverlay.tsx`**

```typescript
import styles from './SmokeOverlay.module.css'

interface Props {
  progress: number  // 0–100; opacity = 1 - progress/100
}

export default function SmokeOverlay({ progress }: Props) {
  const opacity = 1 - progress / 100
  return <div className={styles.smoke} style={{ opacity }} />
}
```

- [ ] **Step 5: Verify build**

```bash
npm run build
```

Expected: builds cleanly.

- [ ] **Step 6: Commit**

```bash
git add src/components/EventCardOverlay.tsx src/components/EventCardOverlay.module.css \
        src/components/SmokeOverlay.tsx src/components/SmokeOverlay.module.css
git commit -m "feat: add EventCardOverlay and SmokeOverlay components"
```

---

## Task 5: Glitched Orders — DiningRoom + OrderTicket

**Files:**
- Modify: `src/components/DiningRoom.tsx`
- Modify: `src/components/OrderTicket.tsx`

- [ ] **Step 1: Add `isGlitched` prop to `OrdersBar` and thread it to `OrderTicket`**

In `DiningRoom.tsx`, update the `Props` interface:

```typescript
interface Props {
  state: GameState
  isHighlighted?: boolean
  isGlitched?: boolean
}
```

Update the function signature: `export default function OrdersBar({ state, isHighlighted, isGlitched }: Props)`

Pass the prop to each `OrderTicket`:

```tsx
<OrderTicket
  key={order.id}
  order={order}
  orderNumber={order.id}
  simple={simpleTickets}
  isGlitched={isGlitched}
/>
```

- [ ] **Step 2: Add `isGlitched` prop and scramble logic to `OrderTicket`**

Import `seededScramble` from `kitchenEventDefs`:

```typescript
import { seededScramble } from '../data/kitchenEventDefs'
```

Update the `Props` interface in `OrderTicket.tsx`:

```typescript
interface Props {
  order: Order
  orderNumber: number
  simple?: boolean
  isGlitched?: boolean
}
```

Update the function signature: `export default function OrderTicket({ order, orderNumber, simple = false, isGlitched = false }: Props)`

Add scramble helpers inside the component (before the `if (simple)` branch):

```typescript
const GLITCH_EMOJIS = ['🌀', '❓', '⚡', '🔀', '💢']
const glitchEmoji = GLITCH_EMOJIS[order.id % GLITCH_EMOJIS.length]
const glitchName = isGlitched ? seededScramble(recipe.name, order.id) : recipe.name
const glitchEmoji2 = isGlitched ? glitchEmoji : recipe.emoji

// Scramble each plate ingredient string
const glitchedPlate = isGlitched
  ? recipe.plate.map((item, i) => seededScramble(item.replace(/_/g, ' '), order.id + i + 1))
  : recipe.plate.map(item => item.replace(STRIP_PREFIX, '').replace(/_/g, ' '))
```

In the **simple** render, replace `recipe.emoji` with `glitchEmoji2` in the `FoodIcon` call. The simple view shows only icons (no text labels) — no other changes needed in that branch.

In the **detailed** render:
- Replace `recipe.emoji` with `glitchEmoji2` in `FoodIcon`
- Replace `recipe.name` text with `glitchName`
- Replace ingredient `item.replace(STRIP_PREFIX, '').replace(/_/g, ' ')` with `glitchedPlate[i]`

Add a CSS class `.glitched` to the ticket container when `isGlitched` is true. Add to `OrderTicket.module.css`:

```css
.glitched {
  border-color: rgba(231, 76, 60, 0.3) !important;
  animation: ticketGlitch 0.4s infinite;
}

@keyframes ticketGlitch {
  0%   { opacity: 1; }
  50%  { opacity: 0.85; transform: translateX(1px); }
  100% { opacity: 1; }
}
```

- [ ] **Step 3: Verify build**

```bash
npm run build
```

Expected: builds cleanly.

- [ ] **Step 4: Commit**

```bash
git add src/components/DiningRoom.tsx src/components/OrderTicket.tsx src/components/OrderTicket.module.css
git commit -m "feat: add isGlitched prop to OrdersBar and OrderTicket"
```

---

## Task 6: App.tsx integration + settings toggles

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/FreePlaySetup.tsx`
- Modify: `src/components/OptionsScreen.tsx`

### Part A — App.tsx

- [ ] **Step 1: Import new components and hook in `App.tsx`**

Add to imports:

```typescript
import { useKitchenEvents } from './hooks/useKitchenEvents'
import EventCardOverlay from './components/EventCardOverlay'
import SmokeOverlay from './components/SmokeOverlay'
```

- [ ] **Step 2: Add `kitchenEventsEnabled: true` to `DEFAULT_GAME_OPTIONS`**

```typescript
const DEFAULT_GAME_OPTIONS: GameOptions = {
  // ... existing fields ...
  autoRestartDelay: 60,
  kitchenEventsEnabled: true,
}
```

- [ ] **Step 3: Call `useKitchenEvents` after `useGameLoop`**

```typescript
const { activeEvent, handleEventCommand } = useKitchenEvents(
  state,
  dispatch,
  isPlaying && !isTutorial && gameOptions.kitchenEventsEnabled,
  paused,
)
```

- [ ] **Step 4: Add `handleEventCommand` to both message handlers**

In `handleTwitchMessage`:

```typescript
const handleTwitchMessage = useCallback((user: string, text: string, isMod: boolean) => {
  dispatch({ type: 'ADD_CHAT', username: user, text, msgType: 'normal' })
  handleEventCommand(user, text)        // ← add this line (before handleMetaCommand)
  handleMetaCommand(user, text, isMod)
  if (!isTutorialRef.current) handleCommand(user, text)
}, [handleCommand, handleEventCommand, handleMetaCommand])
```

In `handleChatSend`:

```typescript
const handleChatSend = useCallback((text: string) => {
  dispatch({ type: 'ADD_CHAT', username: 'You', text, msgType: 'normal' })
  handleEventCommand('You', text)        // ← add this line
  handleMetaCommand('You', text, true)
  handleCommand('You', text)
}, [handleCommand, handleEventCommand, handleMetaCommand])
```

- [ ] **Step 5: Add overlays to the playing layout**

In the `else` branch (playing screen), add before the closing `</div>` of `styles.body`:

```tsx
{activeEvent?.type === 'smoke_blast' && !activeEvent.resolved && !activeEvent.failed && (
  <SmokeOverlay progress={activeEvent.progress} />
)}
```

And add `EventCardOverlay` just before the `{paused && <PauseModal ...` block:

```tsx
<EventCardOverlay activeEvent={activeEvent} />
```

- [ ] **Step 6: Pass `isGlitched` to `OrdersBar`**

```tsx
<OrdersBar
  state={state}
  isHighlighted={tutorialHighlight === 'orders'}
  isGlitched={activeEvent?.type === 'glitched_orders' && !activeEvent.resolved && !activeEvent.failed}
/>
```

### Part B — FreePlaySetup toggle

- [ ] **Step 7: Add `kitchenEventsEnabled` toggle to `FreePlaySetup.tsx`**

Find where the `autoRestart` toggle button is rendered (around line 210) and add a similar toggle below it (follow the exact same button pattern):

```tsx
<div className={styles.optionRow}>
  <span className={styles.optionLabel}>Kitchen Events</span>
  <button
    className={`${styles.toggleBtn} ${options.kitchenEventsEnabled ? styles.toggleBtnOn : ''}`}
    onClick={() => onChange({ ...options, kitchenEventsEnabled: !options.kitchenEventsEnabled })}
  >
    {options.kitchenEventsEnabled ? 'ON' : 'OFF'}
  </button>
</div>
```

### Part C — OptionsScreen toggle

- [ ] **Step 8: Add the same toggle to `OptionsScreen.tsx`**

Find where `autoRestart` is toggled in `OptionsScreen.tsx` (grep for `autoRestart` to locate the section) and add an identical block for `kitchenEventsEnabled` using the same toggle button pattern.

- [ ] **Step 9: Verify build with no type errors**

```bash
npm run build
```

Expected: exits 0 with no errors.

- [ ] **Step 10: Commit**

```bash
git add src/App.tsx src/components/FreePlaySetup.tsx src/components/OptionsScreen.tsx
git commit -m "feat: wire useKitchenEvents into App, add settings toggle"
```

---

## Task 7: Manual smoke test

No automated tests exist in this project (Vitest not installed). Verify by running the dev server and exercising each event type.

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser.

- [ ] **Step 2: Test via local chat**

Start a Free Play game. Use the chat panel (You = broadcaster, always gets events). Wait 30–60s for the first event, or reduce `EVENT_SPAWN_MIN_MS` temporarily to `3_000` in `kitchenEventDefs.ts` for fast testing.

Checklist per category:

**Hazard — penalty (Rat Invasion, Angry Chef):**
- [ ] Card appears with correct title, command hint badge, draining time bar + filling progress bar
- [ ] Typing the correct command (e.g. `SHOO`) increments progress
- [ ] Resolving fills progress to 100 and card shows "✓ Resolved!" then disappears
- [ ] Letting time run out triggers fail effect (ingredients removed / speed debuff applied)
- [ ] Card shows "✗ Failed!" then disappears

**Hazard — immediate (Power Trip, Smoke Blast, Glitched Orders):**
- [ ] Power Trip: 2 stations shown as disabled in kitchen; `!chop` on disabled station shows error; resolving re-enables them
- [ ] Smoke Blast: white fog overlay appears over kitchen; fades as progress fills; fully gone on resolve
- [ ] Glitched Orders: ticket names and ingredients scrambled; unscrambled on resolve

**Opportunities (Chef's Chant, Mystery Recipe, Typing Frenzy, Dance):**
- [ ] Each shows draining time bar + filling progress bar
- [ ] Correct responses increment progress and reward fires on resolve
- [ ] Mystery Recipe: anagram shown in command badge; typing the unscrambled ingredient resolves it
- [ ] Dance: UP/DOWN/LEFT/RIGHT all count; progress only advances when minimum direction count increases
- [ ] Time running out ends event without reward

**General:**
- [ ] Only one event active at a time — next event spawns 30–60s after previous ends
- [ ] Events pause when game is paused (PauseModal open)
- [ ] Toggling "Kitchen Events" OFF in FreePlaySetup prevents any events
- [ ] No events during tutorial mode

- [ ] **Step 3: Reset `EVENT_SPAWN_MIN_MS` if changed**

```bash
# Restore constant to 30_000 in src/data/kitchenEventDefs.ts if you changed it for testing
```

- [ ] **Step 4: Final build check**

```bash
npm run build && npm run lint
```

Expected: exits 0 with no errors or warnings.

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: kitchen events system — 9 event types, useKitchenEvents hook, UI overlays"
```
