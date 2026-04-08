# ChatsKitchen — Let Chat Cook

A browser-based real-time kitchen game where Twitch chat collectively runs a restaurant. Players type commands in chat to chop, grill, fry, and serve dishes before the shift timer runs out.

---

## Features

- **Twitch integration** — connect any channel and chat commands become gameplay actions
- **Cooperative chaos** — 7 recipes, 5 stations, one shared kitchen
- **Fire mechanic** — leave food too long and the station burns; team must `extinguish`
- **Level mode** — 10 fixed-difficulty levels with 1/2/3-star ratings
- **Bot simulation** — optional AI players fill in when chat is quiet
- **Configurable** — tune cooking speed, order speed, station capacity, and more in Options

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
git clone <repo-url>
cd ChatsKitchen
npm install
npm run dev        # → http://localhost:5173
```

Other scripts:

```bash
npm run build      # type-check + production bundle → dist/
npm run preview    # preview production build locally
npm run lint       # ESLint on all .ts/.tsx files
```

---

## How to Play

Type commands by name in chat. Spaces in ingredient names can be written as spaces or underscores. The `!` prefix is also accepted (e.g. `!chop lettuce`).

### Commands

| Command | Syntax | Station |
|---------|--------|---------|
| Chop | `chop <item>` | Chopping Board |
| Grill | `grill <item>` | Grill |
| Fry | `fry <item>` | Fryer |
| Boil | `boil <item>` | Stove |
| Toast | `toast <item>` | Oven |
| Roast | `roast <item>` | Oven |
| Take | `take <ingredient>` | (any station) |
| Serve | `serve <order#>` | — |
| Extinguish | `extinguish <station>` | — |

**Shortform aliases** (enable in Options): `c g f b t r ta s` map to the cooking commands in order above.

**Ingredient shortcuts** (always active): `lett` → `lettuce`, `cboard` → `cutting_board`, `fburger` → `fish_burger`, `msoup` → `mushroom_soup`.

### Gameplay flow

1. An order appears with a dish name and patience timer.
2. Cook the required ingredients at the appropriate stations.
3. Chopping board items finish automatically. All other stations require `take <ingredient>` to move the item to the shared pool.
4. Once all required ingredients are in the pool, type `serve <order#>`.

Each player can only work one station at a time and has a 1.5-second command cooldown.

### Recipes

| Dish | Steps | Reward |
|------|-------|--------|
| 🍔 Burger | `chop lettuce` + `grill patty` + `grill bun` | $60 |
| 🍟 Fries | `chop potato` → `fry potato`* | $50 |
| 🍝 Pasta | `boil pasta` + `chop tomato` + `grill cheese` | $60 |
| 🥗 Salad | `chop lettuce` + `chop tomato` | $20 |
| 🍲 Mushroom Soup | `chop mushroom` → `boil mushroom`* | $50 |
| 🍔 Fish Burger | `fry fish` + `chop lettuce` + `grill bun` | $60 |
| 🥬 Roasted Veggies | `chop tomato` + `chop pepper` + `roast tomato` + `roast pepper` | $70 |

\* Steps marked `→` require the prior ingredient in the pool before they can start.

Each dish also earns a time bonus of up to +$30 based on how much patience the order had remaining when served.

### Fire

Cooking stations (grill, fryer, stove, oven) will catch fire if an item is left too long (~25–28 seconds). Fire blocks the station. Any player can type `extinguish <station>` to clear it and lose the burning ingredient.

The chopping board never burns — items complete automatically.

---

## Game Modes

### Free Play

Sandbox mode. Tune cooking speed, order speed, round duration, station capacity, and which recipes can appear — all in Options. Good for practice and casual streaming.

### Levels

Ten fixed-difficulty challenges. Cooking and order speed scale up each level. Each level has 1-star, 2-star, and 3-star money thresholds. Best star ratings are saved in the browser.

| Level | Cooking | Orders | ⭐ | ⭐⭐ | ⭐⭐⭐ |
|-------|---------|--------|-----|------|-------|
| 1 | 1.00× | 1.0× | $100 | $200 | $350 |
| 5 | 1.20× | 1.4× | $200 | $400 | $700 |
| 10 | 1.45× | 1.9× | $325 | $650 | $1138 |

---

## Twitch Integration

From the Main Menu, go to **Twitch** and enter a channel name. Once connected:

- Live chat messages appear in the game's chat panel.
- Any message starting with `!` is parsed as a game command.
- The UI shows the connected channel and connection status.

The game can also be played locally without Twitch using the built-in chat input.

---

## Options

| Setting | Effect |
|---------|--------|
| Cooking Speed | Multiplier for how fast items cook (higher = faster) |
| Order Speed | Multiplier for how fast order patience drains (higher = faster) |
| Order Spawn Rate | How frequently new orders arrive |
| Round Duration | Length of a free play shift |
| Chopping Slots | Max concurrent items on the chopping board |
| Cooking Slots | Max concurrent items per cooking station |
| Restrict Slots | Enforce slot limits (off = unlimited) |
| Enabled Recipes | Which dishes can appear as orders |
| Shortform Commands | Allow single-letter command aliases |

Audio settings (volume, mute, dark mode) and level progress persist in the browser. A full reset is available at the bottom of Options.

---

## Tech Stack

| | |
|--|--|
| Framework | React 18 + TypeScript |
| Build | Vite 5 |
| State | React `useReducer` (no Redux) |
| Chat | tmi.js |
| Audio | Howler.js |
| Styles | CSS Modules |

No backend, no environment variables, no database. Everything runs in the browser.

---

## Project Structure

```
src/
├── App.tsx                    # Screen routing and top-level state
├── state/
│   ├── gameReducer.ts         # All game logic (single source of truth)
│   ├── commandProcessor.ts    # Parses chat input → GameAction
│   └── types.ts               # TypeScript interfaces
├── hooks/
│   ├── useGameLoop.ts         # 100ms tick loop
│   ├── useTwitchChat.ts       # tmi.js client lifecycle
│   ├── useBotSimulation.ts    # AI bot players
│   └── useGameAudio.ts        # Audio management
├── components/                # React UI components (PascalCase)
└── data/
    ├── recipes.ts             # Recipe and station definitions
    └── levels.ts              # Level configs and star thresholds
docs/
└── game-design-and-mechanics.md  # Full design reference
```

---

## Development

```bash
npm run lint     # run before committing
npm run build    # catches TypeScript errors
```

- Always develop on a branch, never directly on `main`.
- There are no automated tests. [Vitest](https://vitest.dev/) + [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) is the recommended approach when adding them.
- All game logic lives in `src/state/gameReducer.ts`. Never mutate `GameState` directly — the reducer must return a new object.

For a deeper look at design decisions, see [`docs/game-design-and-mechanics.md`](docs/game-design-and-mechanics.md).
