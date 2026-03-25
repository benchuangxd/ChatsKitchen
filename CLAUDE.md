# CLAUDE.md — ChatsKitchen Codebase Guide

This file provides essential context for AI assistants working in this repository.

---

## Project Overview

**"Let Chat Cook"** is a browser-based real-time cooking game where Twitch chat users collectively manage a restaurant kitchen. Players issue chat commands (`!chop`, `!grill`, `!plate`, `!serve`, etc.) to cook dishes, fill orders, and earn money before the shift timer runs out.

- **Type:** Client-side SPA (no backend)
- **Framework:** React 18 + TypeScript
- **Build Tool:** Vite 5
- **External API:** Twitch Chat via `tmi.js`
- **State Management:** React `useReducer` (no Redux)

---

## Development Commands

```bash
npm run dev       # Start Vite dev server with HMR
npm run build     # Type-check (tsc -b) + production bundle → dist/
npm run lint      # Run ESLint on all .ts/.tsx files
npm run preview   # Preview production build locally
```

---

## Repository Structure

```
ChatsKitchen/
├── src/
│   ├── components/         # 14 React UI components (PascalCase)
│   ├── state/
│   │   ├── gameReducer.ts  # All game logic (Redux-style reducer)
│   │   ├── commandProcessor.ts  # Parses !command input → GameAction
│   │   └── types.ts        # TypeScript interfaces (GameState, Station, Order, etc.)
│   ├── hooks/
│   │   ├── useGameLoop.ts  # 100ms game tick loop
│   │   ├── useTwitchChat.ts # Twitch IRC client lifecycle
│   │   └── useBotSimulation.ts # AI bot player (3s action interval)
│   ├── data/
│   │   └── recipes.ts      # Recipe definitions, station configs, bot names
│   └── main.tsx            # React entry point → App.tsx
├── docs/superpowers/plans/ # Development planning documents
├── index.html              # SPA root
├── vite.config.ts
├── tsconfig.json           # Project references → tsconfig.app.json + tsconfig.node.json
├── eslint.config.js
└── package.json
```

---

## Architecture

### Screen Routing

`App.tsx` owns top-level screen state as a union type:
```
'menu' | 'options' | 'twitch' | 'countdown' | 'playing' | 'gameover'
```
No router library — screens are conditionally rendered components.

### Component Hierarchy (during gameplay)

```
App.tsx
├─ StatsBar         — money, served, lost, timer
├─ DiningRoom       — OrderTicket list (current orders)
├─ Kitchen
│  ├─ Station[]     — 6 cooking stations with slot progress
│  ├─ PreparedItems — ingredient inventory
│  └─ AssemblyArea  — plating in progress + finished dishes
├─ ChatPanel        — message list + local input
└─ InfoBar          — modal command reference
```

### Command Flow

```
Twitch Chat (or local ChatPanel)
  → handleTwitchMessage (App.tsx)
  → parseCommand (commandProcessor.ts)   // returns GameAction or null
  → dispatch(action)
  → gameReducer (returns new GameState)
  → React re-render
```

### Game Loop (100ms ticks)

`useGameLoop` dispatches `TICK` actions every 100ms while playing:
- Decrements station slot elapsed times
- Completes cooking when done; moves output to `preparedItems` or `platedDishes`
- Sets station `onFire` when `burnAt` threshold exceeded
- Decrements order patience; expires orders that run out
- Spawns new orders at intervals scaled by shift difficulty
- Triggers `GAME_OVER` when `timeLeft <= 0`

### Bot Simulation

`useBotSimulation` (when enabled) picks an action every 3 seconds:

Priority order: **extinguish fire → take done items → serve → plate → cook**

Bots respect station capacity and avoid actions while players are active.

---

## State Shape

```typescript
interface GameState {
  money: number
  served: number
  lost: number
  shift: number                              // difficulty wave
  timeLeft: number                           // ms remaining
  durationMultiplier: number
  stationCapacity: StationCapacity           // slot limits per station type
  stations: Record<string, Station>          // id → Station
  orders: Order[]
  preparedItems: string[]                    // e.g. ["chopped_lettuce", "grilled_patty"]
  platedDishes: string[]                     // finished dishes awaiting !serve
  nextOrderId: number
  userCooldowns: Record<string, number>      // last action timestamp per user
  activeUsers: Record<string, string>        // username → stationId, currently busy
  nextSlotId: number
  chatMessages: ChatMessage[]                // last 200 messages
  nextMessageId: number
  playerStats: Record<string, PlayerStats>
}
```

State is **transient** — reset on each new game. Nothing is persisted.

---

## Game Content

### Recipes (5 dishes)

| Dish | Steps | Value |
|------|-------|-------|
| Burger 🍔 | `!chop lettuce` + `!grill patty` + `!toast bun` → `!plate` | $50 |
| Fries 🍟 | `!chop potato` → `!fry` | $30 |
| Pasta 🍝 | `!boil pasta` + `!chop tomato` + `!grill cheese` → `!plate` | $60 |
| Salad 🥗 | `!chop lettuce` + `!chop tomato` → `!plate` | $25 |
| Fish Burger 🐟 | `!fry fish` + `!chop lettuce` + `!toast bun` → `!plate` | $70 |

### Stations (6 types)

| Station | Command | Default Capacity |
|---------|---------|-----------------|
| Chopping Board 🔪 | `!chop <ingredient>` | 3 slots |
| Grill 🔥 | `!grill <ingredient>` | 2 slots |
| Fryer 🫕 | `!fry <ingredient>` | 2 slots |
| Stove ♨️ | `!boil <ingredient>` | 2 slots |
| Oven 🧱 | `!toast <ingredient>` | 2 slots |
| Plating 🍽️ | `!plate <dish>` | 2 slots (timed, ~3s) |

All station capacities are configurable in the OptionsScreen.

### Fire Mechanic

When a slot exceeds its `burnAt` threshold, the station catches fire:
- All slots on that station are destroyed; assigned players are freed
- Any player can `!extinguish` to clear the fire (station ready again)
- Burnt ingredients are lost

### Shift Progression

Every 8 orders served increments the shift counter. Order spawn interval tightens:
```
Math.max(5000, 14000 - shift * 1000) ms
```

---

## TypeScript Conventions

- **Strict mode enabled** (`strict: true`, `noUnusedLocals`, `noUnusedParameters`)
- Target: **ES2020** (app) / ES2022 (Vite config)
- Module resolution: **Bundler** mode (`allowImportingTsExtensions: true`, `noEmit: true`)
- All game actions are a **discriminated union** (`GameAction` in `types.ts`)
- Use `gameReducer` for all state mutations — never mutate state directly

### Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Components | PascalCase | `Kitchen.tsx`, `OrderTicket.tsx` |
| Component styles | `*.module.css` same name | `Kitchen.module.css` |
| Custom hooks | `use` prefix | `useGameLoop` |
| Action types | UPPER_SNAKE_CASE | `TICK`, `COOK`, `PLATE`, `SERVE` |
| Helper functions | camelCase | `parseCommand`, `getStationCapacity` |
| Types/interfaces | PascalCase | `GameState`, `StationCapacity` |

---

## Key Files Reference

| File | Responsibility |
|------|---------------|
| `src/App.tsx` | Screen routing, game state init, Twitch/bot wiring |
| `src/state/gameReducer.ts` | **All game logic** — the single source of truth |
| `src/state/types.ts` | All TypeScript interfaces and types |
| `src/state/commandProcessor.ts` | `parseCommand()` — maps chat text to `GameAction` |
| `src/data/recipes.ts` | `RECIPES`, `STATION_DEFS`, `BOT_NAMES`, color palette |
| `src/hooks/useGameLoop.ts` | 100ms TICK dispatching, order spawning, game-over detection |
| `src/hooks/useTwitchChat.ts` | tmi.js client lifecycle, connect/disconnect |
| `src/hooks/useBotSimulation.ts` | AI player logic, action priority, cooldown awareness |

---

## Linting

ESLint is configured in `eslint.config.js` with:
- `@eslint/js` recommended
- `typescript-eslint` recommended
- `eslint-plugin-react-hooks` (enforces Rules of Hooks)
- `eslint-plugin-react-refresh` (warns on non-component exports from modules)

Run `npm run lint` before committing. The build (`npm run build`) also runs `tsc -b` which catches type errors.

---

## No Tests

There are currently no automated tests. No test framework is installed. When adding tests, **Vitest** (Vite-native) with **React Testing Library** is the recommended approach.

---

## No Backend / No Environment Variables

This is a purely client-side application. There are no:
- Server-side routes or APIs
- Environment variables / `.env` files
- Database schemas or migrations
- Docker or CI/CD configuration

The Twitch channel name is entered by the user in the UI at runtime.

---

## Development Planning Docs

`docs/superpowers/plans/` contains Markdown planning documents for significant features:

- `2026-03-24-react-conversion.md` — Notes on the initial React migration
- `2026-03-24-station-capacity-and-plating-rework.md` — Completed 10-task plan for configurable station capacity limits and timed plating mechanics

When implementing a new feature of similar scope, create a plan document in this directory first.

---

## Common Pitfalls

1. **Do not mutate `GameState` directly** — the reducer must return a new object for React to detect changes.
2. **Capacity checks must happen before queuing** — always check `station.slots.length < capacity` in `COOK`/`PLATE` actions.
3. **User cooldown** — commands are throttled at 1500ms per user (`userCooldowns` in state). Bots use the same cooldown system.
4. **`activeUsers`** — a player cooking at one station cannot simultaneously use another. Check and clear this map correctly on station completion/fire.
5. **Chat messages are capped at 200** — `ADD_CHAT` slices to `chatMessages.slice(-200)`.
6. **Plating is timed** — `!plate` queues a slot in the plating station and consumes ingredients immediately. The dish appears in `platedDishes` automatically when the slot timer completes (no `!take` needed for plating).
