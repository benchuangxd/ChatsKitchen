# Chat's Kitchen — React Conversion Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convert Chat's Kitchen from a single-file Phaser game to a React app with the same functionality, simpler rendering, and a clean foundation for future iteration.

**Architecture:** Vite + React + TypeScript. Game state lives in a single `useReducer` hook. A `useGameLoop` hook drives timers (cooking, orders, bots). All visuals are DOM elements styled with CSS. No canvas, no game engine.

**Tech Stack:** Vite, React 18, TypeScript, CSS Modules

---

## File Structure

```
chats-kitchen/
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── src/
│   ├── main.tsx                  — React root mount
│   ├── App.tsx                   — Layout: header + kitchen + chat panel
│   ├── App.module.css            — Top-level layout styles
│   ├── data/
│   │   └── recipes.ts            — RECIPES, STATION_DEFS, BOT_NAMES, NAME_COLORS
│   ├── state/
│   │   ├── types.ts              — TypeScript types for all game state
│   │   ├── gameReducer.ts        — useReducer actions: tick, cook, take, plate, serve, clean, extinguish, spawnOrder, expireOrders
│   │   └── commandProcessor.ts   — Parse "!command target" → dispatch reducer action
│   ├── hooks/
│   │   ├── useGameLoop.ts        — setInterval driving tick, order spawning, bot AI
│   │   └── useBotSimulation.ts   — Bot AI logic (smart bot from original)
│   ├── components/
│   │   ├── StatsBar.tsx          — Money, served, lost, rep, shift
│   │   ├── StatsBar.module.css
│   │   ├── Kitchen.tsx           — Grid of Station components + prepared/plated displays
│   │   ├── Kitchen.module.css
│   │   ├── Station.tsx           — Single station card with progress bar
│   │   ├── Station.module.css
│   │   ├── DiningRoom.tsx        — Grid of OrderTicket components
│   │   ├── DiningRoom.module.css
│   │   ├── OrderTicket.tsx       — Single order card with patience bar
│   │   ├── OrderTicket.module.css
│   │   ├── ChatPanel.tsx         — Message list + input + help commands
│   │   └── ChatPanel.module.css
```

---

## Task 1: Scaffold Vite + React project

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `index.html`, `src/main.tsx`, `src/App.tsx`, `src/App.module.css`

- [ ] **Step 1: Initialize Vite project**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
npm create vite@latest . -- --template react-ts
```

If prompted about existing files, choose to overwrite/scaffold in place. The old `chats-kitchen.html` stays as reference.

- [ ] **Step 2: Install dependencies**

```bash
npm install
```

- [ ] **Step 3: Verify dev server starts**

```bash
npm run dev
```

Expected: Vite dev server starts, default React page loads in browser.

- [ ] **Step 4: Clean up boilerplate**

Remove default Vite content from `src/App.tsx`. Replace with a minimal shell:

```tsx
// src/App.tsx
import styles from './App.module.css'

export default function App() {
  return (
    <div className={styles.layout}>
      <div className={styles.gameWrapper}>
        <header className={styles.header}>
          <h1>Chat's Kitchen</h1>
        </header>
        <main className={styles.main}>
          <p>Kitchen goes here</p>
        </main>
      </div>
      <aside className={styles.chatPanel}>
        <p>Chat goes here</p>
      </aside>
    </div>
  )
}
```

```css
/* src/App.module.css */
@import url('https://fonts.googleapis.com/css2?family=Lilita+One&family=Space+Mono:wght@400;700&family=Fredoka:wght@400;600;700&display=swap');

.layout {
  display: flex;
  height: 100vh;
  overflow: hidden;
  background: #1a1117;
  color: #f0e6d3;
  font-family: 'Fredoka', sans-serif;
}

.gameWrapper {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.header {
  background: linear-gradient(135deg, #2d1b2e 0%, #1a1117 100%);
  border-bottom: 3px solid #ff6b35;
  padding: 8px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header h1 {
  font-family: 'Lilita One', cursive;
  font-size: 24px;
  color: #ff6b35;
  text-shadow: 2px 2px 0 #1a1117;
  margin: 0;
}

.main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #12090f;
  padding: 20px;
}

.chatPanel {
  width: 320px;
  background: linear-gradient(180deg, #1e1428 0%, #18101e 100%);
  border-left: 3px solid #9146ff;
  flex-shrink: 0;
}
```

Delete `src/App.css` and `src/index.css` if they exist. Update `src/main.tsx` to remove the index.css import.

- [ ] **Step 5: Verify shell renders**

```bash
npm run dev
```

Expected: Dark layout with header "Chat's Kitchen" on left, chat placeholder on right.

- [ ] **Step 6: Commit**

```bash
git init
echo "node_modules\ndist" > .gitignore
git add .
git commit -m "feat: scaffold Vite React project with layout shell"
```

---

## Task 2: Extract game data and types

**Files:**
- Create: `src/data/recipes.ts`, `src/state/types.ts`

- [ ] **Step 1: Create game data file**

Extract from `chats-kitchen.html` lines 235-299. Port to TypeScript with proper types:

```ts
// src/data/recipes.ts

export interface RecipeStep {
  action: string
  target: string
  station: string
  duration: number
  burnAt?: number
  produces: string
}

export interface Recipe {
  name: string
  emoji: string
  reward: number
  patience: number
  steps: RecipeStep[]
  plate: string[]
}

export interface StationDef {
  name: string
  emoji: string
  color: string  // CSS hex color
  actions: string[]
}

export const RECIPES: Record<string, Recipe> = {
  burger: {
    name: 'Burger', emoji: '\u{1F354}', reward: 50, patience: 45000,
    steps: [
      { action: 'chop', target: 'lettuce', station: 'cutting_board', duration: 0, produces: 'chopped_lettuce' },
      { action: 'grill', target: 'patty', station: 'grill', duration: 4000, burnAt: 9000, produces: 'grilled_patty' },
      { action: 'toast', target: 'bun', station: 'oven', duration: 3000, burnAt: 8000, produces: 'toasted_bun' },
    ],
    plate: ['chopped_lettuce', 'grilled_patty', 'toasted_bun']
  },
  fries: {
    name: 'Fries', emoji: '\u{1F35F}', reward: 30, patience: 35000,
    steps: [
      { action: 'chop', target: 'potato', station: 'cutting_board', duration: 0, produces: 'chopped_potato' },
      { action: 'fry', target: 'potato', station: 'fryer', duration: 4000, burnAt: 9000, produces: 'fried_potato' },
    ],
    plate: ['chopped_potato', 'fried_potato']
  },
  pasta: {
    name: 'Pasta', emoji: '\u{1F35D}', reward: 60, patience: 55000,
    steps: [
      { action: 'boil', target: 'pasta', station: 'stove', duration: 5000, burnAt: 11000, produces: 'boiled_pasta' },
      { action: 'chop', target: 'tomato', station: 'cutting_board', duration: 0, produces: 'chopped_tomato' },
      { action: 'grill', target: 'cheese', station: 'grill', duration: 2000, burnAt: 6000, produces: 'melted_cheese' },
    ],
    plate: ['boiled_pasta', 'chopped_tomato', 'melted_cheese']
  },
  salad: {
    name: 'Salad', emoji: '\u{1F957}', reward: 25, patience: 30000,
    steps: [
      { action: 'chop', target: 'lettuce', station: 'cutting_board', duration: 0, produces: 'chopped_lettuce' },
      { action: 'chop', target: 'tomato', station: 'cutting_board', duration: 0, produces: 'chopped_tomato' },
    ],
    plate: ['chopped_lettuce', 'chopped_tomato']
  },
  fish_tacos: {
    name: 'Fish Tacos', emoji: '\u{1F32E}', reward: 70, patience: 50000,
    steps: [
      { action: 'fry', target: 'fish', station: 'fryer', duration: 5000, burnAt: 10000, produces: 'fried_fish' },
      { action: 'chop', target: 'lettuce', station: 'cutting_board', duration: 0, produces: 'chopped_lettuce' },
      { action: 'toast', target: 'bun', station: 'oven', duration: 2000, burnAt: 7000, produces: 'toasted_bun' },
    ],
    plate: ['fried_fish', 'chopped_lettuce', 'toasted_bun']
  }
}

export const STATION_DEFS: Record<string, StationDef> = {
  cutting_board: { name: 'Cutting Board', emoji: '\u{1F52A}', color: '#66bb6a', actions: ['chop'] },
  grill:         { name: 'Grill',         emoji: '\u{1F525}', color: '#ff7043', actions: ['grill'] },
  fryer:         { name: 'Fryer',         emoji: '\u{1FAD5}', color: '#ffa726', actions: ['fry'] },
  stove:         { name: 'Stove',         emoji: '\u{2668}\u{FE0F}',  color: '#ef5350', actions: ['boil'] },
  oven:          { name: 'Oven',          emoji: '\u{1F9F1}', color: '#8d6e63', actions: ['toast'] },
  plate_station: { name: 'Plating',       emoji: '\u{1F37D}\u{FE0F}',  color: '#78909c', actions: ['plate'] },
}

export const BOT_NAMES = [
  'ChefChat42', 'SoupLord', 'BurgerBoss', 'PastaKing99', 'FryQueen',
  'TacoMaster', 'GrillGod', 'NoodleNinja', 'SaladSam', 'DishDash',
  'FlipperFred', 'CookieMonsta', 'SpicyMike', 'UmamiQueen', 'ChopChop77',
  'WokStar', 'RamenRanger', 'SizzleSis', 'PlateUp_Pro', 'OvenMitt'
]

export const NAME_COLORS = [
  '#ff6b6b', '#ffa06b', '#ffe66b', '#6bff8a', '#6bd1ff',
  '#a16bff', '#ff6bb5', '#ff9146', '#46ffc3', '#c39bff'
]
```

- [ ] **Step 2: Create types file**

```ts
// src/state/types.ts

export type StationState = 'idle' | 'cooking' | 'done' | 'on_fire' | 'dirty'

export interface Station {
  id: string
  state: StationState
  currentItem: { target: string; produces: string; duration: number; burnAt: number } | null
  cookStart: number
  cookDuration: number
  burnAt: number
}

export interface Order {
  id: number
  dish: string
  table: number
  served: boolean
  patienceMax: number
  patienceLeft: number
  spawnTime: number
}

export interface ChatMessage {
  id: number
  username: string
  text: string
  type: 'normal' | 'system' | 'error' | 'success'
}

export interface GameState {
  money: number
  served: number
  lost: number
  reputation: number
  shift: number
  stations: Record<string, Station>
  orders: Order[]
  preparedItems: string[]
  platedDishes: string[]
  nextOrderId: number
  userCooldowns: Record<string, number>
  fire: boolean
  dirty: Record<string, boolean>
  chatMessages: ChatMessage[]
  nextMessageId: number
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 4: Commit**

```bash
git add src/data src/state
git commit -m "feat: extract game data and types to TypeScript"
```

---

## Task 3: Game state reducer

**Files:**
- Create: `src/state/gameReducer.ts`

- [ ] **Step 1: Create the reducer**

This is the core game logic. Port all command handling from `chats-kitchen.html` lines 373-537 and the update/tick logic from lines 804-996 into a pure reducer function.

```ts
// src/state/gameReducer.ts
import { GameState, Station, Order, ChatMessage } from './types'
import { RECIPES, STATION_DEFS } from '../data/recipes'

export type GameAction =
  | { type: 'TICK'; delta: number; now: number }
  | { type: 'COOK'; user: string; action: string; target: string; now: number }
  | { type: 'TAKE'; user: string; stationId: string }
  | { type: 'PLATE'; user: string; dishKey: string }
  | { type: 'SERVE'; user: string; tableNum: number }
  | { type: 'CLEAN'; user: string; stationId: string }
  | { type: 'EXTINGUISH'; user: string }
  | { type: 'SPAWN_ORDER'; now: number }
  | { type: 'ADD_CHAT'; username: string; text: string; msgType: ChatMessage['type'] }

export function createInitialState(): GameState {
  const stations: Record<string, Station> = {}
  for (const id of Object.keys(STATION_DEFS)) {
    stations[id] = {
      id,
      state: 'idle',
      currentItem: null,
      cookStart: 0,
      cookDuration: 0,
      burnAt: 0,
    }
  }

  return {
    money: 0,
    served: 0,
    lost: 0,
    reputation: 3,
    shift: 1,
    stations,
    orders: [],
    preparedItems: [],
    platedDishes: [],
    nextOrderId: 1,
    userCooldowns: {},
    fire: false,
    dirty: {},
    chatMessages: [],
    nextMessageId: 1,
  }
}

function addMsg(state: GameState, username: string, text: string, msgType: ChatMessage['type'] = 'normal'): GameState {
  const msg: ChatMessage = { id: state.nextMessageId, username, text, type: msgType }
  const messages = [...state.chatMessages, msg].slice(-200)
  return { ...state, chatMessages: messages, nextMessageId: state.nextMessageId + 1 }
}

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'ADD_CHAT':
      return addMsg(state, action.username, action.text, action.msgType)

    case 'EXTINGUISH': {
      if (!state.fire) return addMsg(state, 'KITCHEN', 'No fire to extinguish!', 'error')
      let s = { ...state, fire: false, stations: { ...state.stations }, dirty: { ...state.dirty } }
      for (const [id, station] of Object.entries(s.stations)) {
        if (station.state === 'on_fire') {
          s.stations[id] = { ...station, state: 'dirty', currentItem: null }
          s.dirty[id] = true
        }
      }
      return addMsg(s, 'KITCHEN', `${action.user} put out the fire!`, 'success')
    }

    case 'CLEAN': {
      const { stationId, user } = action
      if (stationId && state.stations[stationId] && state.dirty[stationId]) {
        const newDirty = { ...state.dirty }
        delete newDirty[stationId]
        return addMsg(
          { ...state, stations: { ...state.stations, [stationId]: { ...state.stations[stationId], state: 'idle' } }, dirty: newDirty },
          'KITCHEN', `${user} cleaned the ${STATION_DEFS[stationId]?.name}!`, 'success'
        )
      }
      return addMsg(state, 'KITCHEN', 'Nothing to clean there!', 'error')
    }

    case 'TAKE': {
      const { stationId, user } = action
      const station = state.stations[stationId]
      if (station?.state === 'done' && station.currentItem) {
        return addMsg(
          {
            ...state,
            preparedItems: [...state.preparedItems, station.currentItem.produces],
            stations: { ...state.stations, [stationId]: { ...station, state: 'idle', currentItem: null } }
          },
          'KITCHEN', `${user} took ${station.currentItem.produces.replace(/_/g, ' ')}!`, 'success'
        )
      }
      return addMsg(state, 'KITCHEN', 'Nothing ready to take there!', 'error')
    }

    case 'PLATE': {
      const { dishKey, user } = action
      const recipe = RECIPES[dishKey]
      if (!recipe) return addMsg(state, 'KITCHEN', `Unknown dish: ${dishKey}`, 'error')

      const needed = [...recipe.plate]
      const available = [...state.preparedItems]
      for (const item of needed) {
        const idx = available.indexOf(item)
        if (idx === -1) return addMsg(state, 'KITCHEN', `Missing ${item.replace(/_/g, ' ')} for ${recipe.name}!`, 'error')
        available.splice(idx, 1)
      }
      return addMsg(
        { ...state, preparedItems: available, platedDishes: [...state.platedDishes, dishKey] },
        'KITCHEN', `${user} plated a ${recipe.emoji} ${recipe.name}! Ready to serve!`, 'success'
      )
    }

    case 'SERVE': {
      const { tableNum, user } = action
      const orderIdx = state.orders.findIndex(o => o.table === tableNum && !o.served)
      if (orderIdx === -1) return addMsg(state, 'KITCHEN', `No order at table ${tableNum}!`, 'error')

      const order = state.orders[orderIdx]
      const dishIdx = state.platedDishes.indexOf(order.dish)
      if (dishIdx === -1) return addMsg(state, 'KITCHEN', `No plated ${RECIPES[order.dish].name} ready!`, 'error')

      const newPlated = [...state.platedDishes]
      newPlated.splice(dishIdx, 1)
      const newOrders = state.orders.map((o, i) => i === orderIdx ? { ...o, served: true } : o)
      const timeBonus = Math.max(0, Math.floor((order.patienceLeft / order.patienceMax) * 30))
      const reward = RECIPES[order.dish].reward + timeBonus

      return addMsg(
        { ...state, platedDishes: newPlated, orders: newOrders, money: state.money + reward, served: state.served + 1 },
        'KITCHEN', `${user} served ${RECIPES[order.dish].emoji} to table ${tableNum}! +$${reward}`, 'success'
      )
    }

    case 'COOK': {
      const { user, action: cookAction, target, now } = action

      // Cooldown check
      if (state.userCooldowns[user] && now - state.userCooldowns[user] < 1500) return state
      const withCooldown = { ...state, userCooldowns: { ...state.userCooldowns, [user]: now } }

      const stationEntry = Object.entries(STATION_DEFS).find(([, def]) => def.actions.includes(cookAction))
      if (!stationEntry) return withCooldown

      const [stationId] = stationEntry
      const station = withCooldown.stations[stationId]

      if (station.state === 'on_fire') return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is on fire! Type !extinguish first!`, 'error')
      if (station.state === 'dirty') return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is dirty! Type !clean ${stationId} first!`, 'error')
      if (station.state !== 'idle') return addMsg(withCooldown, 'KITCHEN', `The ${STATION_DEFS[stationId].name} is busy!`, 'error')

      let matchedStep = null
      for (const recipe of Object.values(RECIPES)) {
        for (const step of recipe.steps) {
          if (step.action === cookAction && step.target === target) { matchedStep = step; break }
        }
        if (matchedStep) break
      }
      if (!matchedStep) return addMsg(withCooldown, 'KITCHEN', `Can't ${cookAction} ${(target || '').replace(/_/g, ' ')} there!`, 'error')

      const PAST_TENSE: Record<string, string> = { chop: 'chopped', grill: 'grilled', fry: 'fried', boil: 'boiled', toast: 'toasted' }
      if (matchedStep.duration === 0) {
        return addMsg(
          { ...withCooldown, preparedItems: [...withCooldown.preparedItems, matchedStep.produces] },
          'KITCHEN', `${user} ${PAST_TENSE[cookAction] || cookAction + 'ed'} ${target.replace(/_/g, ' ')}!`, 'success'
        )
      }

      return addMsg(
        {
          ...withCooldown,
          stations: {
            ...withCooldown.stations,
            [stationId]: {
              ...station,
              state: 'cooking',
              currentItem: { target: matchedStep.target, produces: matchedStep.produces, duration: matchedStep.duration, burnAt: matchedStep.burnAt || Infinity },
              cookStart: now,
              cookDuration: matchedStep.duration,
              burnAt: matchedStep.burnAt || Infinity,
            }
          }
        },
        'KITCHEN', `${user} started ${cookAction}ing ${target.replace(/_/g, ' ')}!`, 'success'
      )
    }

    case 'SPAWN_ORDER': {
      const dishKeys = Object.keys(RECIPES)
      const dish = dishKeys[Math.floor(Math.random() * dishKeys.length)]
      const recipe = RECIPES[dish]
      const usedTables = state.orders.filter(o => !o.served).map(o => o.table)
      let table = 0
      for (let t = 1; t <= 5; t++) {
        if (!usedTables.includes(t)) { table = t; break }
      }
      if (table === 0) return state

      const order: Order = {
        id: state.nextOrderId,
        dish,
        table,
        served: false,
        patienceMax: recipe.patience,
        patienceLeft: recipe.patience,
        spawnTime: action.now,
      }
      return addMsg(
        { ...state, orders: [...state.orders, order], nextOrderId: state.nextOrderId + 1 },
        'CUSTOMER', `Table ${table} wants a ${recipe.emoji} ${recipe.name}!`, 'system'
      )
    }

    case 'TICK': {
      const { delta, now } = action
      let s = { ...state, stations: { ...state.stations }, orders: [...state.orders] }
      let messages = [...s.chatMessages]
      let nextMsgId = s.nextMessageId

      // Update cooking stations
      for (const [id, station] of Object.entries(s.stations)) {
        if (station.state === 'cooking' && station.currentItem) {
          const elapsed = now - station.cookStart
          if (elapsed >= station.burnAt) {
            s.stations[id] = { ...station, state: 'on_fire', currentItem: null }
            s.fire = true
            s.dirty = { ...s.dirty, [id]: true }
            messages.push({ id: nextMsgId++, username: 'KITCHEN', text: `THE ${STATION_DEFS[id].name.toUpperCase()} IS ON FIRE! Type !extinguish!`, type: 'system' })
          } else if (elapsed >= station.cookDuration) {
            s.stations[id] = { ...station, state: 'done' }
          }
        }
      }

      // Update order patience + expire
      let lost = s.lost
      let reputation = s.reputation
      s.orders = s.orders.map(order => {
        if (order.served) return order
        const newPatience = order.patienceLeft - delta
        if (newPatience <= 0) {
          lost++
          reputation = Math.max(0, reputation - 1)
          messages.push({ id: nextMsgId++, username: 'CUSTOMER', text: `Table ${order.table} left angry! Lost a ${RECIPES[order.dish].emoji}!`, type: 'error' })
          return { ...order, served: true, patienceLeft: 0 }
        }
        return { ...order, patienceLeft: newPatience }
      })

      // Clean up old served orders
      s.orders = s.orders.filter(o => !o.served || (now - o.spawnTime < 2000))

      // Shift progression
      let shift = s.shift
      if (s.served > 0 && s.served % 8 === 0 && shift < Math.ceil(s.served / 8) + 1) {
        shift = Math.ceil(s.served / 8) + 1
        messages.push({ id: nextMsgId++, username: 'KITCHEN', text: `SHIFT ${shift} — Things are heating up!`, type: 'system' })
      }

      return { ...s, lost, reputation, shift, chatMessages: messages.slice(-200), nextMessageId: nextMsgId }
    }

    default:
      return state
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

Expected: No errors.

- [ ] **Step 3: Commit**

```bash
git add src/state/gameReducer.ts
git commit -m "feat: game state reducer with all command logic"
```

---

## Task 4: Command processor

**Files:**
- Create: `src/state/commandProcessor.ts`

- [ ] **Step 1: Create command processor**

```ts
// src/state/commandProcessor.ts
import { GameAction } from './gameReducer'

export function parseCommand(user: string, text: string): GameAction | null {
  if (!text.startsWith('!')) return null

  const parts = text.slice(1).toLowerCase().split(/\s+/)
  const action = parts[0]
  const target = parts.slice(1).join('_') || ''

  switch (action) {
    case 'extinguish':
      return { type: 'EXTINGUISH', user }
    case 'clean':
      return target ? { type: 'CLEAN', user, stationId: target } : null
    case 'take':
      return target ? { type: 'TAKE', user, stationId: target } : null
    case 'plate':
      return target ? { type: 'PLATE', user, dishKey: target } : null
    case 'serve': {
      const match = target.match(/table(\d+)/)
      return match ? { type: 'SERVE', user, tableNum: parseInt(match[1]) } : null
    }
    case 'chop':
    case 'grill':
    case 'fry':
    case 'boil':
    case 'toast':
      return target ? { type: 'COOK', user, action, target, now: Date.now() } : null
    default:
      return null
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add src/state/commandProcessor.ts
git commit -m "feat: command parser translates chat commands to actions"
```

---

## Task 5: Game loop and bot simulation hooks

**Files:**
- Create: `src/hooks/useGameLoop.ts`, `src/hooks/useBotSimulation.ts`

- [ ] **Step 1: Create useGameLoop hook**

```ts
// src/hooks/useGameLoop.ts
import { useEffect, useRef } from 'react'
import { GameAction } from '../state/gameReducer'
import { GameState } from '../state/types'

export function useGameLoop(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
) {
  const lastTimeRef = useRef(Date.now())
  const gameTimeRef = useRef(0)
  const orderTimerRef = useRef(0)
  const firstOrderSpawned = useRef(false)

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now()
      const delta = now - lastTimeRef.current
      lastTimeRef.current = now
      gameTimeRef.current += delta

      // Tick game state (cooking timers, patience, etc.)
      dispatch({ type: 'TICK', delta, now })

      // Spawn orders
      orderTimerRef.current += delta
      const orderInterval = Math.max(5000, 14000 - state.shift * 1000)

      if (!firstOrderSpawned.current && gameTimeRef.current > 2000) {
        dispatch({ type: 'SPAWN_ORDER', now })
        firstOrderSpawned.current = true
        orderTimerRef.current = 0
      } else if (orderTimerRef.current > orderInterval) {
        dispatch({ type: 'SPAWN_ORDER', now })
        orderTimerRef.current = 0
      }
    }, 100) // 10 ticks per second is plenty for this game

    return () => clearInterval(interval)
  }, [dispatch, state.shift])
}
```

- [ ] **Step 2: Create useBotSimulation hook**

Port the smart bot AI from `chats-kitchen.html` lines 551-627.

```ts
// src/hooks/useBotSimulation.ts
import { useEffect, useRef } from 'react'
import { GameAction } from '../state/gameReducer'
import { GameState } from '../state/types'
import { RECIPES, BOT_NAMES } from '../data/recipes'

const CHATTER = ["let's go!", 'waiting for orders...', 'COOK COOK COOK', 'we got this chat!', 'any orders?']

function pickBotAction(state: GameState): { name: string; command: string } | null {
  const name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)]

  // Fire
  if (state.fire) return { name, command: '!extinguish' }

  // Dirty stations
  for (const id of Object.keys(state.dirty)) {
    if (state.dirty[id]) return { name, command: `!clean ${id}` }
  }

  // Done stations
  for (const [id, station] of Object.entries(state.stations)) {
    if (station.state === 'done') return { name, command: `!take ${id}` }
  }

  // Plate
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

  // Serve
  for (const order of state.orders) {
    if (order.served) continue
    if (state.platedDishes.includes(order.dish)) return { name, command: `!serve table${order.table}` }
  }

  // Cook something needed
  for (const order of state.orders) {
    if (order.served) continue
    const recipe = RECIPES[order.dish]
    for (const step of recipe.steps) {
      if (state.stations[step.station]?.state !== 'idle') continue
      if (state.preparedItems.includes(step.produces)) continue
      return { name, command: `!${step.action} ${step.target}` }
    }
  }

  // Idle chatter
  return { name, command: CHATTER[Math.floor(Math.random() * CHATTER.length)] }
}

export function useBotSimulation(
  state: GameState,
  dispatch: React.Dispatch<GameAction>,
  onCommand: (user: string, text: string) => void,
) {
  const stateRef = useRef(state)
  useEffect(() => { stateRef.current = state }, [state])

  useEffect(() => {
    const interval = setInterval(() => {
      const action = pickBotAction(stateRef.current)
      if (action) {
        dispatch({ type: 'ADD_CHAT', username: action.name, text: action.command, msgType: 'normal' })
        onCommand(action.name, action.command)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [dispatch, onCommand])
}
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add src/hooks
git commit -m "feat: game loop and bot simulation hooks"
```

---

## Task 6: ChatPanel component

**Files:**
- Create: `src/components/ChatPanel.tsx`, `src/components/ChatPanel.module.css`

- [ ] **Step 1: Create ChatPanel**

```tsx
// src/components/ChatPanel.tsx
import { useRef, useEffect, useState } from 'react'
import { ChatMessage } from '../state/types'
import { NAME_COLORS } from '../data/recipes'
import styles from './ChatPanel.module.css'

function hashStr(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
  return h
}

interface Props {
  messages: ChatMessage[]
  onSend: (text: string) => void
}

export default function ChatPanel({ messages, onSend }: Props) {
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const handleSend = () => {
    if (!input.trim()) return
    onSend(input.trim())
    setInput('')
  }

  return (
    <aside className={styles.panel}>
      <div className={styles.header}>
        <span className={styles.dot} /> TWITCH CHAT (Simulated)
      </div>
      <div className={styles.messages}>
        {messages.map(msg => (
          <div key={msg.id} className={`${styles.msg} ${styles[msg.type] || ''}`}>
            {msg.type === 'system' ? (
              <span className={styles.text}>{msg.text}</span>
            ) : (
              <>
                <span
                  className={styles.username}
                  style={{ color: NAME_COLORS[Math.abs(hashStr(msg.username)) % NAME_COLORS.length] }}
                >
                  {msg.username}:
                </span>
                <span className={styles.text}>{msg.text}</span>
              </>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className={styles.help}>
        <strong>Commands:</strong><br />
        !chop [item] — !grill [item]<br />
        !fry [item] — !boil [item]<br />
        !toast [item] — !take [station]<br />
        !plate [dish] — !serve table[N]<br />
        !clean [station] — !extinguish<br />
        <br />
        <strong>Items:</strong> lettuce, tomato, patty, bun, potato, pasta, cheese, egg, bacon, rice, fish, shrimp
      </div>
      <div className={styles.inputArea}>
        <input
          className={styles.input}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type !command here..."
        />
        <button className={styles.sendBtn} onClick={handleSend}>Send</button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Create ChatPanel styles**

```css
/* src/components/ChatPanel.module.css */
.panel {
  width: 320px;
  background: linear-gradient(180deg, #1e1428 0%, #18101e 100%);
  border-left: 3px solid #9146ff;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

.header {
  background: #9146ff;
  padding: 10px 16px;
  font-family: 'Lilita One', cursive;
  font-size: 16px;
  color: #fff;
  display: flex;
  align-items: center;
  gap: 8px;
}

.dot {
  width: 8px; height: 8px;
  background: #66ff88;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.messages {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  scrollbar-width: thin;
  scrollbar-color: #9146ff33 transparent;
}

.msg {
  line-height: 1.4;
  padding: 2px 0;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(4px); }
  to { opacity: 1; transform: translateY(0); }
}

.username { font-weight: 700; margin-right: 4px; }
.text { color: #d4c8b8; }
.system .text { color: #ffe066; font-style: italic; }
.error .text { color: #ff6b6b; }
.success .text { color: #66ff88; }

.help {
  padding: 8px 10px;
  border-top: 1px solid #ffffff10;
  font-size: 11px;
  color: #6b5f80;
  font-family: 'Space Mono', monospace;
  line-height: 1.5;
  max-height: 140px;
  overflow-y: auto;
}

.help strong { color: #9146ff; }

.inputArea {
  padding: 10px;
  border-top: 1px solid #ffffff15;
  display: flex;
  gap: 8px;
}

.input {
  flex: 1;
  background: #0d0a10;
  border: 2px solid #9146ff44;
  border-radius: 6px;
  padding: 8px 12px;
  color: #f0e6d3;
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  outline: none;
  transition: border-color 0.2s;
}

.input:focus { border-color: #9146ff; }

.sendBtn {
  background: #9146ff;
  border: none;
  border-radius: 6px;
  color: #fff;
  padding: 8px 14px;
  font-family: 'Fredoka', sans-serif;
  font-weight: 600;
  font-size: 13px;
  cursor: pointer;
  transition: background 0.2s;
}

.sendBtn:hover { background: #a66bff; }
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ChatPanel.tsx src/components/ChatPanel.module.css
git commit -m "feat: ChatPanel component with messages and input"
```

---

## Task 7: StatsBar, Station, and Kitchen components

**Files:**
- Create: `src/components/StatsBar.tsx`, `src/components/StatsBar.module.css`, `src/components/Station.tsx`, `src/components/Station.module.css`, `src/components/Kitchen.tsx`, `src/components/Kitchen.module.css`

- [ ] **Step 1: Create StatsBar**

```tsx
// src/components/StatsBar.tsx
import styles from './StatsBar.module.css'

interface Props {
  money: number
  served: number
  lost: number
  reputation: number
  shift: number
}

export default function StatsBar({ money, served, lost, reputation, shift }: Props) {
  const rep = Math.max(0, Math.min(5, reputation))
  return (
    <div className={styles.bar}>
      <div className={styles.stat}><span className={styles.label}>MONEY</span><span className={styles.value}>${money}</span></div>
      <div className={styles.stat}><span className={styles.label}>SERVED</span><span className={styles.value}>{served}</span></div>
      <div className={styles.stat}><span className={styles.label}>LOST</span><span className={styles.value}>{lost}</span></div>
      <div className={styles.stat}><span className={styles.label}>REP</span><span className={`${styles.value} ${styles.rep}`}>{'★'.repeat(rep) + '☆'.repeat(5 - rep)}</span></div>
      <div className={styles.stat}><span className={styles.label}>SHIFT</span><span className={styles.value}>{shift}</span></div>
    </div>
  )
}
```

```css
/* src/components/StatsBar.module.css */
.bar {
  display: flex;
  gap: 20px;
  align-items: center;
}

.stat {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.label { color: #8a7a6b; }
.value { color: #ffe066; font-weight: 700; }
.rep { color: #66ff88; }
```

- [ ] **Step 2: Create Station component**

```tsx
// src/components/Station.tsx
import { Station as StationType } from '../state/types'
import { STATION_DEFS } from '../data/recipes'
import styles from './Station.module.css'

interface Props {
  station: StationType
}

export default function Station({ station }: Props) {
  const def = STATION_DEFS[station.id]
  if (!def) return null

  const now = Date.now()
  const elapsed = station.state === 'cooking' && station.currentItem
    ? now - station.cookStart : 0
  const progress = station.cookDuration > 0 ? Math.min(1, elapsed / station.cookDuration) : 0
  const burnProgress = station.burnAt > 0 && station.burnAt < Infinity ? elapsed / station.burnAt : 0

  const barColor = burnProgress > 0.7 ? '#ff5252' : burnProgress > 0.4 ? '#ffa726' : '#66bb6a'

  let statusText = 'idle'
  let statusColor = '#8a7a6b'
  let itemText = ''

  switch (station.state) {
    case 'cooking':
      statusText = `cooking... ${Math.floor(progress * 100)}%`
      statusColor = '#ffa726'
      itemText = station.currentItem?.target || ''
      break
    case 'done':
      statusText = `DONE! !take ${station.id}`
      statusColor = '#66ff88'
      itemText = station.currentItem?.produces.replace(/_/g, ' ') || ''
      break
    case 'on_fire':
      statusText = 'ON FIRE!'
      statusColor = '#ff5252'
      itemText = '!extinguish'
      break
    case 'dirty':
      statusText = `DIRTY! !clean ${station.id}`
      statusColor = '#8d6e63'
      break
  }

  const borderColor = station.state === 'on_fire' ? '#ff5252'
    : station.state === 'dirty' ? '#8d6e63' : def.color

  return (
    <div className={`${styles.station} ${station.state === 'on_fire' ? styles.fire : ''}`} style={{ borderColor }}>
      <div className={styles.label}>{def.emoji} {def.name}</div>
      <div className={styles.status} style={{ color: statusColor }}>{statusText}</div>
      <div className={styles.progressBg}>
        <div
          className={styles.progressFill}
          style={{
            width: station.state === 'cooking' ? `${progress * 100}%`
              : station.state === 'done' ? '100%' : '0%',
            backgroundColor: station.state === 'done' ? '#66ff88' : barColor,
          }}
        />
      </div>
      {itemText && <div className={styles.itemText}>{itemText}</div>}
    </div>
  )
}
```

```css
/* src/components/Station.module.css */
.station {
  background: rgba(26, 17, 23, 0.85);
  border: 2px solid;
  border-radius: 8px;
  padding: 10px;
  width: 150px;
  text-align: center;
}

.fire {
  animation: fireFlash 0.3s infinite alternate;
}

@keyframes fireFlash {
  from { background: rgba(74, 16, 16, 0.85); }
  to { background: rgba(26, 17, 23, 0.85); }
}

.label {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: bold;
  color: #f0e6d3;
  margin-bottom: 4px;
}

.status {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  margin-bottom: 6px;
}

.progressBg {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 4px;
  height: 10px;
  overflow: hidden;
}

.progressFill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.1s linear;
}

.itemText {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: #ffe066;
  margin-top: 4px;
}
```

- [ ] **Step 3: Create Kitchen component**

```tsx
// src/components/Kitchen.tsx
import { GameState } from '../state/types'
import { STATION_DEFS, RECIPES } from '../data/recipes'
import Station from './Station'
import styles from './Kitchen.module.css'

interface Props {
  state: GameState
}

export default function Kitchen({ state }: Props) {
  const stationIds = Object.keys(STATION_DEFS)

  return (
    <div className={styles.kitchen}>
      <div className={styles.stations}>
        {stationIds.map(id => (
          <Station key={id} station={state.stations[id]} />
        ))}
      </div>
      <div className={styles.inventory}>
        <div className={styles.inventorySection}>
          <span className={styles.inventoryLabel}>Prepared:</span>
          <span className={styles.inventoryItems}>
            {state.preparedItems.length > 0
              ? state.preparedItems.map(i => i.replace(/_/g, ' ')).join(', ')
              : 'none'}
          </span>
        </div>
        <div className={styles.inventorySection}>
          <span className={styles.inventoryLabelGreen}>Plated:</span>
          <span className={styles.inventoryItems}>
            {state.platedDishes.length > 0
              ? state.platedDishes.map(d => `${RECIPES[d].emoji} ${RECIPES[d].name}`).join(', ')
              : 'none'}
          </span>
        </div>
      </div>
    </div>
  )
}
```

```css
/* src/components/Kitchen.module.css */
.kitchen {
  padding: 20px;
}

.stations {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 20px;
}

.inventory {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.inventorySection {
  display: flex;
  gap: 8px;
  align-items: baseline;
}

.inventoryLabel {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  color: #ffe066;
  font-weight: bold;
  white-space: nowrap;
}

.inventoryLabelGreen {
  composes: inventoryLabel;
  color: #66ff88;
}

.inventoryItems {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: #d4c8b8;
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add src/components/StatsBar.tsx src/components/StatsBar.module.css src/components/Station.tsx src/components/Station.module.css src/components/Kitchen.tsx src/components/Kitchen.module.css
git commit -m "feat: StatsBar, Station, and Kitchen components"
```

---

## Task 8: DiningRoom and OrderTicket components

**Files:**
- Create: `src/components/OrderTicket.tsx`, `src/components/OrderTicket.module.css`, `src/components/DiningRoom.tsx`, `src/components/DiningRoom.module.css`

- [ ] **Step 1: Create OrderTicket**

```tsx
// src/components/OrderTicket.tsx
import { Order } from '../state/types'
import { RECIPES } from '../data/recipes'
import styles from './OrderTicket.module.css'

interface Props {
  order: Order
  hasPlatedDish: boolean
  preparedItems: string[]
}

export default function OrderTicket({ order, hasPlatedDish, preparedItems }: Props) {
  const recipe = RECIPES[order.dish]
  const urgency = order.patienceLeft / order.patienceMax
  const barColor = urgency < 0.25 ? '#ff5252' : urgency < 0.5 ? '#ffa726' : '#66bb6a'
  const borderColor = barColor

  const urgencyClass = urgency < 0.25 ? styles.critical : urgency < 0.5 ? styles.warning : ''

  return (
    <div className={`${styles.ticket} ${urgencyClass}`} style={{ borderColor }}>
      <div className={styles.tableLabel}>Table {order.table}</div>
      <div className={styles.dishName}>{recipe.emoji} {recipe.name}</div>
      <div className={styles.ingredients}>
        {recipe.plate.map((item, i) => {
          const have = preparedItems.includes(item) || hasPlatedDish
          return <span key={i}>{have ? '\u2705' : '\u2B1C'}</span>
        })}
      </div>
      <div className={styles.patienceBg}>
        <div className={styles.patienceFill} style={{ width: `${urgency * 100}%`, backgroundColor: barColor }} />
      </div>
      {hasPlatedDish && <div className={styles.serveHint}>!serve table{order.table}</div>}
    </div>
  )
}
```

```css
/* src/components/OrderTicket.module.css */
.ticket {
  background: rgba(26, 17, 23, 0.9);
  border: 2px solid;
  border-radius: 8px;
  padding: 10px;
  width: 155px;
  text-align: center;
}

.critical { background: rgba(74, 16, 16, 0.9); }
.warning { background: rgba(62, 42, 16, 0.9); }

.tableLabel {
  font-family: 'Fredoka', sans-serif;
  font-size: 13px;
  color: #f0e6d3;
  font-weight: bold;
}

.dishName {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  color: #ffe066;
  font-weight: bold;
  margin: 4px 0;
}

.ingredients {
  font-size: 14px;
  margin-bottom: 6px;
  display: flex;
  justify-content: center;
  gap: 4px;
}

.patienceBg {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 3px;
  height: 8px;
  overflow: hidden;
}

.patienceFill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.1s linear;
}

.serveHint {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: #66ff88;
  margin-top: 4px;
}
```

- [ ] **Step 2: Create DiningRoom**

```tsx
// src/components/DiningRoom.tsx
import { GameState } from '../state/types'
import OrderTicket from './OrderTicket'
import styles from './DiningRoom.module.css'

interface Props {
  state: GameState
}

export default function DiningRoom({ state }: Props) {
  const activeOrders = state.orders.filter(o => !o.served)

  return (
    <div className={styles.dining}>
      <div className={styles.divider}>— DINING ROOM —</div>
      <div className={styles.tables}>
        {activeOrders.map(order => (
          <OrderTicket
            key={order.id}
            order={order}
            hasPlatedDish={state.platedDishes.includes(order.dish)}
            preparedItems={state.preparedItems}
          />
        ))}
        {activeOrders.length === 0 && (
          <div className={styles.empty}>No customers yet...</div>
        )}
      </div>
    </div>
  )
}
```

```css
/* src/components/DiningRoom.module.css */
.dining {
  padding: 0 20px 20px;
}

.divider {
  font-family: 'Lilita One', cursive;
  font-size: 13px;
  color: #8d6e63;
  text-align: center;
  padding: 8px 0;
  border-top: 3px solid #795548;
  margin-bottom: 12px;
}

.tables {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.empty {
  color: #6b5f80;
  font-size: 13px;
  font-style: italic;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/OrderTicket.tsx src/components/OrderTicket.module.css src/components/DiningRoom.tsx src/components/DiningRoom.module.css
git commit -m "feat: DiningRoom and OrderTicket components"
```

---

## Task 9: Wire everything together in App.tsx

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update App.tsx to wire all components and hooks**

```tsx
// src/App.tsx
import { useReducer, useCallback } from 'react'
import { gameReducer, createInitialState } from './state/gameReducer'
import { parseCommand } from './state/commandProcessor'
import { useGameLoop } from './hooks/useGameLoop'
import { useBotSimulation } from './hooks/useBotSimulation'
import StatsBar from './components/StatsBar'
import Kitchen from './components/Kitchen'
import DiningRoom from './components/DiningRoom'
import ChatPanel from './components/ChatPanel'
import styles from './App.module.css'

export default function App() {
  const [state, dispatch] = useReducer(gameReducer, undefined, createInitialState)

  const handleCommand = useCallback((user: string, text: string) => {
    const action = parseCommand(user, text)
    if (action) dispatch(action)
  }, [])

  const handleChatSend = useCallback((text: string) => {
    dispatch({ type: 'ADD_CHAT', username: 'You', text, msgType: 'normal' })
    handleCommand('You', text)
  }, [handleCommand])

  useGameLoop(state, dispatch)
  useBotSimulation(state, dispatch, handleCommand)

  return (
    <div className={styles.layout}>
      <div className={styles.gameWrapper}>
        <header className={styles.header}>
          <h1>Chat's Kitchen</h1>
          <StatsBar
            money={state.money}
            served={state.served}
            lost={state.lost}
            reputation={state.reputation}
            shift={state.shift}
          />
        </header>
        <main className={styles.main}>
          <Kitchen state={state} />
          <DiningRoom state={state} />
        </main>
      </div>
      <ChatPanel messages={state.chatMessages} onSend={handleChatSend} />
    </div>
  )
}
```

- [ ] **Step 2: Verify app runs**

```bash
npm run dev
```

Expected: Full game running — stations render, orders spawn, bots chat and cook, you can type commands.

- [ ] **Step 3: Smoke test the game**

Manually verify:
- Orders spawn after ~2 seconds
- Bots start cooking/plating/serving
- Typing `!chop lettuce` works in the chat input
- Station progress bars animate
- Patience bars drain on order tickets
- Money increases on successful serves
- Fire/dirty states work

- [ ] **Step 4: Commit**

```bash
git add src/App.tsx
git commit -m "feat: wire all components together — game fully playable"
```

---

## Task 10: Cleanup and polish

**Files:**
- Delete: leftover Vite boilerplate files if any remain
- Modify: `src/main.tsx` (ensure clean), `index.html` (title)

- [ ] **Step 1: Update index.html title**

Set `<title>Chat's Kitchen — Twitch Chat Restaurant Game</title>` in `index.html`.

- [ ] **Step 2: Clean up any leftover boilerplate**

Remove any unused files: `src/assets/`, `public/vite.svg`, `src/App.css`, `src/index.css`, default SVG imports in `main.tsx`.

- [ ] **Step 3: Verify clean build**

```bash
npm run build
```

Expected: Build succeeds with no errors or warnings.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "chore: cleanup boilerplate, finalize React conversion"
```

---

## Summary

| Task | What it produces |
|------|-----------------|
| 1 | Working Vite + React shell with layout |
| 2 | Game data and TypeScript types |
| 3 | Game state reducer (all logic) |
| 4 | Command parser |
| 5 | Game loop + bot hooks |
| 6 | ChatPanel component |
| 7 | StatsBar + Station + Kitchen components |
| 8 | DiningRoom + OrderTicket components |
| 9 | Full wiring — game is playable |
| 10 | Cleanup and production build |

Each task builds on the last. The game is fully playable after Task 9. No tests are included in this first pass — the game is verified by running it. Tests can be added in a follow-up iteration once the game loop stabilizes.
