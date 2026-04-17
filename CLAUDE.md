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
│   ├── components/         # 18 React UI components (PascalCase)
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
'menu' | 'adventurebriefing' | 'options' | 'freeplaysetup' | 'countdown' | 'playing' | 'shiftend' | 'gameover' | 'adventureshiftpassed' | 'adventurerunend'
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
  → handleTwitchMessage (App.tsx)       // receives (user, text, isMod)
  → handleMetaCommand (App.tsx)         // handles mod-only shell commands; returns early if consumed
  → parseCommand (commandProcessor.ts)  // returns GameAction or null
  → dispatch(action)
  → gameReducer (returns new GameState)
  → React re-render
```

### Mod / Broadcaster Commands

These commands bypass the game reducer and are handled directly in `App.tsx` (`handleMetaCommand`). They only execute for Twitch moderators, the broadcaster, or the local chat input (always treated as broadcaster).

| Command | Valid Screen(s) | Effect |
|---------|----------------|--------|
| `!start` | `gameover` (Free Play only) | Immediately starts a new round |
| `!onAutoRestart` | `playing`, `gameover` | Enables auto-restart in `gameOptions` |
| `!offAutoRestart` | `playing`, `gameover` | Disables auto-restart, cancels active countdown |
| `!exit` | `playing` | Ends the round via normal shift-end → game-over flow |

A brief toast notification is shown on screen when any mod command fires. System messages are also added to the chat log.

Mod detection uses `tags.mod` and `tags.badges.broadcaster` from tmi.js. The local "You" user is always granted mod access.

### Game Loop (100ms ticks)

`useGameLoop` dispatches `TICK` actions every 100ms while playing:
- Decrements station slot elapsed times via wall-clock `cookStart` timestamps (`elapsed = now - slot.cookStart`)
- Completes cooking when done; auto-collects output into `preparedItems` for all stations
- Applies heat **incrementally during cooking** (proportional to slot progress); `HEAT_PER_COOK` (20) is the total heat applied per full cook — not at completion. Chopping board and mixing bowl are exempt.
- Decrements order patience; expires orders that run out
- Spawns new orders at regular intervals. If the order queue empties mid-game, a new order spawns immediately and the spawn rate doubles for 10 seconds.
- Triggers game over when `timeLeft <= 0`
- On unpause: dispatches `ADJUST_COOK_TIMES` to shift all `cookStart` values forward by pause duration

### Bot Simulation

`useBotSimulation` (when enabled) picks an action every 3 seconds:

Priority order: **extinguish overheated station → cool hot station (heat ≥ 60) → serve → cook**

Bots respect station capacity, skip overheated stations, and skip `cutting_board` and `mixing_bowl` for cooling.

---

## State Shape

```typescript
interface GameState {
  money: number
  served: number
  lost: number
  timeLeft: number                           // ms remaining
  cookingSpeed: number
  orderSpeed: number
  orderSpawnRate: number
  stationCapacity: StationCapacity           // slot limits per station type
  restrictSlots: boolean
  enabledRecipes: string[]
  stations: Record<string, Station>          // id → Station
  orders: Order[]
  preparedItems: string[]                    // e.g. ["chopped_lettuce", "grilled_patty"]
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

`GameOptions` is separate from `GameState` and lives in `App.tsx`. It is persisted to `localStorage` (`chatsKitchen_gameOptions`):

```typescript
interface GameOptions {
  cookingSpeed: number
  orderSpeed: number
  orderSpawnRate: number
  shiftDuration: number
  stationCapacity: StationCapacity
  restrictSlots: boolean
  enabledRecipes: string[]
  allowShortformCommands: boolean
  autoRestart: boolean        // Free Play only — auto-restart after game over
  autoRestartDelay: number    // seconds to count down before restarting (default 60)
}
```

---

## Game Content

### Recipes (27 dishes across 6 cuisine sets + 3 ungrouped)

**Western Classics 🇺🇸** (`burger`, `fish_burger`, `salad`, `roasted_veggies`)

| Dish | Key steps | Value |
|------|-----------|-------|
| Burger 🍔 | `chop lettuce` + `grill patty` + `toast bun` | $65 |
| Fish & Chips 🐟 | `chop potato` → `fry potato` + `fry fish` | $60 |
| Grilled Cheese 🥪 | `grill cheese` + `toast bread` | $40 |
| Roasted Veggies 🫑 | `chop tomato` + `chop pepper` → `roast pepper` | $55 |

**Chinese Kitchen 🇨🇳** (`fried_rice`, `stir_fried_pork`, `steamed_tofu`, `steamed_buns`)

| Dish | Key steps | Value |
|------|-----------|-------|
| Fried Rice 🍳 | `cook rice` → `stir rice` + `stir egg` | $55 |
| Stir-Fried Pork 🍛 | `chop pork` → `stir pork` + `chop spring_onion` | $65 |
| Steamed Tofu 🧈 | `chop tofu` → `steam tofu` + `chop spring_onion` | $45 |
| Steamed Buns 🥟 | `chop cabbage` + `steam bun` | $55 |

**Korean Kitchen 🇰🇷** (`bulgogi`, `kimchi_jjigae`, `korean_fried_chicken`, `tteokbokki`)

| Dish | Key steps | Value |
|------|-----------|-------|
| Bulgogi 🥩 | `chop beef` → `grill beef` + `chop spring_onion` | $70 |
| Kimchi Jjigae 🥘 | `chop kimchi` → `simmer kimchi` + `chop tofu` | $65 |
| Korean Fried Chicken 🍗 | `chop chicken` → `fry chicken` + `mix gochujang` | $75 |
| Tteokbokki 🌶️ | `chop tteok` + `mix gochujang` → `boil tteok` | $65 |

**Japanese Kitchen 🇯🇵** (`sushi_roll`, `tempura`, `chawanmushi`, `salmon_donburi`)

| Dish | Key steps | Value |
|------|-----------|-------|
| Sushi Roll 🍣 | `cook rice` + `chop tuna` + `toast nori` | $70 |
| Tempura 🍤 | `chop shrimp` → `fry shrimp` | $65 |
| Chawanmushi 🥚 | `chop egg` → `steam egg` + `chop shrimp` | $55 |
| Salmon Donburi 🍱 | `cook rice` + `chop salmon` + `chop nori` | $75 |

**Japanese Bakery 🇯🇵** (`shio_pan`, `melon_pan`, `pour_over_coffee`, `matcha_latte`)

| Dish | Key steps | Value |
|------|-----------|-------|
| Shio Pan 🫓 | `knead dough` → `toast bread_dough` | $50 |
| Melon Pan 🍨 | `knead dough` → `toast bread_dough` + `mix cookie_topping` | $65 |
| Pour-Over Coffee ☕ | `grind coffee_beans` + `boil water` | $45 |
| Matcha Latte 🍵 | `mix matcha` + `steam milk` | $55 |

**SG Hawker Breakfast 🇸🇬** (`kaya_toast`, `economic_bee_hoon`, `roti_prata`, `nasi_lemak`)

| Dish | Key steps | Value |
|------|-----------|-------|
| Kaya Toast 🍞 | `toast bread` + `mix kaya` | $40 |
| Economic Bee Hoon 🍜 | `fry chicken_wing` + `stir bee_hoon` + `stir vegetables` + `fry egg` | $65 |
| Roti Prata 🫓 | `knead dough` → `grill bread_dough` + `boil curry` | $55 |
| Nasi Lemak 🍱 | `cook rice` + `mix sambal` + `fry anchovies` + `fry egg` | $75 |

**Ungrouped** (`fries`, `hot_dog`, `salad` — not in any cuisine set)

| Dish | Key steps | Value |
|------|-----------|-------|
| Fries 🍟 | `chop potato` → `fry potato` | $40 |
| Hot Dog 🌭 | `grill sausage` + `chop onion` + `toast bun` | $45 |
| Caesar Salad 🥗 | `chop lettuce` + `chop tomato` + `toast crouton` | $35 |

Steps marked `→` require the prior ingredient in `preparedItems` before starting.

### Stations (10 types)

| Station | Command | Default Capacity | Heat |
|---------|---------|-----------------|------|
| Chopping Board 🔪 | `!chop <ingredient>` | 3 slots | Exempt |
| Grill 🔥 | `!grill <ingredient>` | 2 slots | Yes |
| Fryer 🫕 | `!fry <ingredient>` | 2 slots | Yes |
| Stove ♨️ | `!boil <ingredient>` | 2 slots | Yes |
| Oven 🧱 | `!toast` / `!roast <ingredient>` | 2 slots | Yes |
| Wok 🍳 | `!stir <ingredient>` | 2 slots | Yes |
| Steamer 🫕 | `!steam <ingredient>` | 2 slots | Yes |
| Stone Pot 🍲 | `!simmer <ingredient>` | 2 slots | Yes |
| Rice Pot 🍚 | `!cook <ingredient>` | 2 slots | Yes |
| Mixing Bowl 🥣 | `!mix <ingredient>` | 3 slots | Exempt |
| Grinder ☕ | `!grind <ingredient>` | 3 slots | Exempt |
| Knead Board 🫓 | `!knead <ingredient>` | 3 slots | Exempt |

Only stations needed by the currently enabled recipes are rendered. Station capacities are configurable in Free Play via the More Options panel.

### Heat Mechanic

Heat accumulates **incrementally during cooking** — each tick adds `progress × HEAT_PER_COOK` heat proportional to how far along the slot is. `HEAT_PER_COOK` (20) is the total heat applied per full cook cycle. Chopping Board and Mixing Bowl are exempt from heat.

Players use `!cool <station>` to reduce heat by `COOL_AMOUNT` (30). `!cool` requires the player to not be actively cooking. When heat reaches 100:
- All slots on that station are destroyed; assigned players are freed
- Station is locked (`overheated: true`) until extinguished
- Players vote via `!extinguish <station>`; the station restores when votes reach `ceil(playerCount × 0.5)` (min 1)
- Heat resets to 0 on restore

Station border colour reflects heat: green (0–40%) → yellow (41–70%) → orange (71–99%) → red (overheated).

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
| `src/hooks/useTwitchChat.ts` | tmi.js client lifecycle, connect/disconnect; passes `isMod` (mod/broadcaster) to message handler |
| `src/components/Toast.tsx` | Brief fixed-position toast notification for mod command feedback |
| `src/components/FoodIcon.tsx` | Renders food icons — `<img>` for `/`-prefixed paths, `<span>` for emoji strings |
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
- `2026-03-24-station-capacity-and-plating-rework.md` — Configurable station capacity limits and timed plating mechanics
- `2026-04-05-level-system-with-stars.md` — 10-level system with star thresholds
- `2026-04-06-persist-user-preferences.md` — Browser storage for audio, level progress, and options
- `2026-04-09-readability-overhaul.md` — Gameplay UI visual polish pass
- `2026-04-09-shift-end-transition.md` — Shift end / game-over transition screen
- `2026-04-09-station-readability.md` — Station component readability improvements
- `2026-04-10-main-menu-redesign.md` — 2-column Hero Split MainMenu with cheatsheet
- `2026-04-11-auto-restart-and-mod-commands.md` — Auto-restart toggle for Free Play and mod/broadcaster chat commands
- `2026-04-13-heat-rush-remove-take.md` — Station heat meter, collective extinguish, rush orders, removal of !take

`docs/superpowers/specs/` holds design specs that precede the plans above.

When implementing a new feature of similar scope, create a spec + plan document in these directories first.

---

## Common Pitfalls

1. **Do not mutate `GameState` directly** — the reducer must return a new object for React to detect changes.
2. **Capacity checks must happen before queuing** — always check `station.slots.length < capacity` in `COOK` actions, and reject commands on overheated stations before the capacity check.
3. **User cooldown** — commands are throttled at 1500ms per user (`userCooldowns` in state). Bots use the same cooldown system.
4. **`activeUsers`** — a player cooking at one station cannot simultaneously use another. Check and clear this map correctly on station completion and overheat. `!cool` and `!extinguish` are instant actions that do not set `activeUsers`.
5. **Chat messages are capped at 200** — `ADD_CHAT` slices to `chatMessages.slice(-200)`.
6. **`cookStart` is wall-clock time** — slot progress is `elapsed = now - slot.cookStart`. On unpause, dispatch `ADJUST_COOK_TIMES` to shift all `cookStart` values forward by the pause duration, otherwise paused time counts as elapsed cook time.
7. **`heatApplied` on slots** — each `StationSlot` tracks how much heat it has already contributed (`heatApplied: number`, init 0). The TICK loop applies `progress × HEAT_PER_COOK - heatApplied` each tick. When adding new slot-creating code paths, always initialise `heatApplied: 0`.
8. **Heat-exempt stations** — `cutting_board`, `mixing_bowl`, `grinder`, and `knead_board` are all exempt from heat. Treat them identically in all heat-related checks (TICK heat loop, COOL guard, `getStationCapacity`, bot cool-skip). Both `Kitchen.tsx` and `gameReducer.ts` have local `getStationCapacity` — keep them in sync. All four use `capacity.chopping` for slot limits.

## Workflow

1. Always create a new git branch, do not work on main directly.
2. Every time we plan, use the superpowers skill.