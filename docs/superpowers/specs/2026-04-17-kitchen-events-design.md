# Kitchen Events — Design Spec
**Date:** 2026-04-17
**Branch:** feat/kitchen-events

---

## Overview

Kitchen Events are time-limited in-game occurrences that require collective Twitch chat participation to resolve. They come in two categories: **Hazards** (disruptions that penalise chat if ignored) and **Opportunities** (bonuses rewarding fast coordination). Only one event is active at a time. Events appear in both Free Play and Adventure mode and can be toggled off in game options.

---

## Event Categories

### Hazard — Penalty Type
Effect fires *on failure* (time runs out without enough responses). Shows both a draining time bar and a filling community progress bar.

| Event | Command Pool | Fail Effect |
|-------|-------------|-------------|
| 🐀 Rat Invasion | SHOO, CHASE, BEGONE | Remove 3 random `preparedItems` |
| 👨‍🍳 Angry Chef | SORRY CHEF, APOLOGIES CHEF, MY BAD CHEF | `cookingSpeed × 0.7` for 15s |

### Hazard — Immediate Effect Type
Effect fires *immediately on spawn* and lasts until resolved. Shows only a filling community progress bar (no time pressure, but effect persists until resolved).

| Event | Command Pool | Active Effect | On Resolve |
|-------|-------------|--------------|------------|
| 🔌 Power Trip | RESET, REBOOT, RESTART | 2 random stations disabled | Re-enable stations |
| 💨 Smoke Blast | CLEAR, VENTILATE, BLOW | Frosted fog overlay on kitchen (opacity fades as progress fills) | Overlay removed |
| 📦 Glitched Orders | FIX, DEBUG, PATCH | Order ticket names and ingredients scrambled | Unscramble tickets |

### Opportunity
Reward fires on successful resolution before time runs out. Shows both a draining time bar and a filling community progress bar.

| Event | Command Pool | Time Limit | Reward |
|-------|-------------|-----------|--------|
| 📢 Chef's Chant | YES CHEF, AYE CHEF, OF COURSE CHEF | 12s | `cookingSpeed × 1.5` for 20s |
| 🧩 Mystery Recipe | Anagram of a random enabled ingredient | 12s | Add 3 random `preparedItems` |
| ⚡ Typing Frenzy | Exact phrase from a pool of 8 game-flavoured phrases | 12s | `moneyMultiplier × 1.5` for 20s |
| 🕺 Dance | UP, DOWN, LEFT, RIGHT | 12s | All active orders +15s patience |

**Typing Frenzy phrase pool:** FIRE IN THE HOLE, ORDER UP, YES CHEF, TABLE FOR TWO, BEHIND YOU, ON THE FLY, HEARD THAT, MISE EN PLACE

**Mystery Recipe:** anagram drawn from the ingredient names used by currently enabled recipes. Answer matching is case-insensitive. Multiple users can submit the correct answer; each counts as one contribution.

**Dance Entertainment:** chat types UP, DOWN, LEFT, or RIGHT. Each direction is tracked separately. Progress is the minimum count across all four directions — requires 8 of *each* direction to resolve.

---

## Resolve Threshold

All events resolve when `respondedUsers.length >= ceil(playerCount × 0.8)` (minimum 1).

- `playerCount` = `Object.keys(state.playerStats).length` at the time the event spawns
- Each user may contribute **once per event instance** (deduplicated by username)
- Exception: **Dance Entertainment** and **Typing Frenzy** — one contribution per correct message per user (still deduplicated per direction/phrase)

---

## Spawn Rules

- **Spawn interval:** random 30–60s after the previous event fully ends (resolved or failed)
- **Only one event active at a time** — no overlapping events
- **Event type selection:** random from all 9 types; same type will not repeat back-to-back
- **No spawn during:** paused game, tutorial, or when `kitchenEventsEnabled` is false
- **Chosen command:** one word/phrase picked randomly from the event's command pool at spawn time; shown on the event card

---

## State Shape

### `useKitchenEvents` hook (internal state)

```typescript
type EventType =
  | 'rat_invasion' | 'angry_chef'
  | 'power_trip' | 'smoke_blast' | 'glitched_orders'
  | 'chefs_chant' | 'mystery_recipe' | 'typing_frenzy' | 'dance'

type EventCategory = 'hazard-penalty' | 'hazard-immediate' | 'opportunity'

interface KitchenEvent {
  id: string
  category: EventCategory
  type: EventType
  chosenCommand: string
  progress: number           // 0–100, derived from respondedUsers / threshold
  threshold: number          // ceil(playerCount × 0.8), min 1
  respondedUsers: string[]   // deduplicated contributors
  timeLeft: number | null    // ms; null for hazard-immediate
  resolved: boolean
  failed: boolean
  payload: {
    disabledStations?: string[]   // Power Trip
    anagramAnswer?: string        // Mystery Recipe (the unscrambled answer)
    typingPhrase?: string         // Typing Frenzy
    danceProgress?: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT', string[]>  // Dance (users per direction)
  }
}
```

### Hook public interface

```typescript
{
  activeEvent: KitchenEvent | null
  handleEventCommand: (user: string, text: string) => void
}
```

### `GameState` additions

```typescript
cookingSpeedModifier?: { multiplier: number; expiresAt: number }
moneyMultiplier?: { multiplier: number; expiresAt: number }
disabledStations?: string[]
```

`TICK` clears expired modifiers by checking `expiresAt` against `now`.

---

## New Reducer Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `REMOVE_PREPARED_ITEMS` | `{ count: number }` | Removes `count` random items from `preparedItems` |
| `SET_COOKING_SPEED_MODIFIER` | `{ multiplier: number; expiresAt: number }` | Sets `cookingSpeedModifier`; applies to all cook durations |
| `DISABLE_STATIONS` | `{ stationIds: string[] }` | Sets `disabledStations`; disabled stations reject new COOK actions |
| `ENABLE_STATIONS` | `{}` | Clears `disabledStations` |
| `ADD_MONEY_MULTIPLIER` | `{ multiplier: number; expiresAt: number }` | Sets `moneyMultiplier`; applied in SERVE payout calculation |
| `ADD_PREPARED_ITEMS` | `{ items: string[] }` | Appends items to `preparedItems` |
| `EXTEND_ORDER_PATIENCE` | `{ ms: number }` | Adds `ms` to `patienceLeft` of all active (non-served) orders |

---

## UI Components

### `EventCardOverlay`
- Fixed position, horizontally centred, ~30% from top of viewport
- Single card (one event at a time)
- Card style matches tutorial card aesthetic: `#252836` background, coloured border (red = hazard, green = opportunity), `border-radius: 14px`
- Content (top to bottom):
  - Tag line: `⚠️ Hazard` or `⚡ Opportunity` (Space Mono, 11px, uppercase)
  - Event title with emoji (Lilita One, 22px)
  - Command hint badge (tutorial-style: coloured background tint, coloured border, Space Mono 22px bold)
  - Fail/reward description (Fredoka, 14px, muted)
  - Progress bar(s): 18px tall, rounded
    - `hazard-penalty` + `opportunity`: draining time bar on top, filling community bar below
    - `hazard-immediate`: filling community bar only
- Pulsing glow animation on card border (1.2s alternate)

### `SmokeOverlay`
- Fixed inset, `pointer-events: none`, z-index above kitchen but below event card
- `background: radial-gradient(ellipse at center, rgba(220,220,220,0.55), rgba(240,240,240,0.82))`
- `backdrop-filter: blur(6px)`
- Opacity = `1 - (activeEvent.progress / 100)` — fades as community resolves
- Only rendered when `activeEvent?.type === 'smoke_blast'`

### Glitched Orders
- `OrdersBar` receives `isGlitched: boolean` prop
- Each `OrderTicket` shuffles its dish name characters and ingredient strings when `isGlitched` is true
- Emoji replaced with a slowly rotating random emoji (🌀, ❓, ⚡)
- Scramble is stable per-render (seeded by `order.id`) to avoid flickering on every tick

### Chat System Message
When an event spawns, a `system` chat message is added:
> `🐀 RAT INVASION! Type SHOO in chat to help!`

---

## App.tsx Integration

```
handleTwitchMessage / handleChatSend
  → handleEventCommand(user, text)   // new — event responses (no ! prefix)
  → handleMetaCommand(user, text)    // existing
  → handleCommand(user, text)        // existing — !commands
```

`useKitchenEvents` is called with `(state, dispatch, isPlaying && !isTutorial && gameOptions.kitchenEventsEnabled)`.

`GameOptions` gains: `kitchenEventsEnabled: boolean` (default `true`). Exposed as a toggle in the FreePlay setup and Options screen.

---

## Constants (tunable)

```typescript
const EVENT_SPAWN_MIN_MS = 30_000
const EVENT_SPAWN_MAX_MS = 60_000
const RESOLVE_THRESHOLD_RATIO = 0.8
const ANGRY_CHEF_DEBUFF_MULTIPLIER = 0.7
const ANGRY_CHEF_DEBUFF_DURATION_MS = 15_000
const CHEFS_CHANT_BOOST_MULTIPLIER = 1.5
const CHEFS_CHANT_BOOST_DURATION_MS = 20_000
const TYPING_FRENZY_MULTIPLIER = 1.5
const TYPING_FRENZY_DURATION_MS = 20_000
const DANCE_PATIENCE_BONUS_MS = 15_000
const DANCE_DIRECTION_THRESHOLD = 8
const RAT_INVASION_ITEMS_STOLEN = 3
const MYSTERY_RECIPE_ITEMS_REWARDED = 3
const HAZARD_TIME_LIMIT_MS = 10_000
const OPPORTUNITY_TIME_LIMIT_MS = 12_000
```

---

## Out of Scope

- Events do not affect bot simulation (bots ignore event commands)
- Events are not persisted across game resets
- No event history or stats tracking in this version
- No audio cues (deferred to a future audio pass)
