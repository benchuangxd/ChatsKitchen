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

| Event | Command Pool | Time Limit | Fail Effect |
|-------|-------------|-----------|-------------|
| 🐀 Rat Invasion | SHOO, CHASE, BEGONE | 10s | Remove 3 random `preparedItems` |
| 👨‍🍳 Angry Chef | SORRY CHEF, APOLOGIES CHEF, MY BAD CHEF | 10s | `cookingSpeed × 0.7` for 15s |

### Hazard — Immediate Effect Type
Effect fires *immediately on spawn* and lasts until resolved. Shows only a filling community progress bar (no time pressure, but effect persists until resolved).

| Event | Command Pool | Active Effect | On Resolve |
|-------|-------------|--------------|------------|
| 🔌 Power Trip | RESET, REBOOT, RESTART | 2 random non-overheated stations disabled | Re-enable those specific stations |
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

**Mystery Recipe:** anagram drawn from the **step `target` values** of currently enabled recipes (e.g. `lettuce`, `tteok`, `spring_onion` — the ingredient names players use in `!chop`, `!grill` etc. commands). Falls back to all recipe step targets across all recipes if `enabledRecipes` is empty. The `payload.anagramAnswer` holds the original un-anagrammed target string. Answer matching is case-insensitive against `anagramAnswer`. Each unique user's first correct answer counts as one contribution toward the threshold.

**Mystery Recipe reward:** the 3 items added to `preparedItems` are drawn at random from the `produces` values of currently enabled recipe steps (i.e. valid prepared ingredient names like `chopped_lettuce`, `grilled_patty`). This mirrors what players would normally produce at stations.

**Dance Entertainment:** chat types UP, DOWN, LEFT, or RIGHT. Each direction is tracked separately with its own deduplicated user list. `progress = min(UP_count, DOWN_count, LEFT_count, RIGHT_count) / threshold × 100`. Resolve threshold per direction = `ceil(playerCount × 0.8)` (min 1) — consistent with the global threshold rule; the hardcoded `DANCE_DIRECTION_THRESHOLD` constant is removed.

**Typing Frenzy:** one contribution per user per event (same general rule — the "per phrase" exception in earlier drafts was incorrect since only one phrase is active per event instance).

---

## Resolve Threshold

All events resolve when the community contribution count reaches `ceil(playerCount × 0.8)` (minimum 1).

- `playerCount` = `Object.keys(state.playerStats).length` at the time the event spawns; minimum 1
- Each user may contribute **once per event instance** (deduplicated by username)
- **Dance exception:** each user may contribute once *per direction* (four total contributions possible per user), using the same threshold per direction

---

## Spawn Rules

- **Spawn interval:** random 30–60s after the previous event fully ends (resolved or failed)
- **Only one event active at a time** — no overlapping events
- **Event type selection:** random from all 9 types; same type will not repeat back-to-back
- **No spawn during:** paused game, tutorial, or when `kitchenEventsEnabled` is false
- **Chosen command:** one word/phrase picked randomly from the event's command pool at spawn time; shown on the event card

---

## Command Matching

`handleEventCommand(user, text)` is called with the **raw, untrimmed chat text** before any `!`-prefix stripping. Because event commands never start with `!`, there is no collision with `parseCommand`, which only processes `!`-prefixed input.

For all event types except Mystery Recipe: matches when `text.trim().toUpperCase() === activeEvent.chosenCommand`.

**Mystery Recipe exception:** `chosenCommand` holds the displayed anagram (e.g. `TTAECLUE`). Matching instead checks `text.trim().toUpperCase() === payload.anagramAnswer.toUpperCase()` — i.e. the user types the correct unscrambled ingredient name, not the anagram itself.

Multi-word commands (e.g. `SORRY CHEF`) are matched against the full trimmed+uppercased string.

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
  progress: number           // 0–100, derived from contribution count / threshold
  threshold: number          // ceil(playerCount × 0.8), min 1
  respondedUsers: string[]   // deduplicated contributors; initialised as [] and unused for Dance (Dance dedup lives in danceProgress)
  timeLeft: number | null    // ms; null for hazard-immediate; decrements only when !paused
  resolved: boolean
  failed: boolean
  payload: {
    disabledStations?: string[]    // Power Trip — exact IDs that were disabled
    anagramAnswer?: string         // Mystery Recipe — the unscrambled answer
    typingPhrase?: string          // Typing Frenzy — the chosen phrase
    danceProgress?: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT', string[]>  // Dance — users per direction
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

### Pause behaviour

`useKitchenEvents` receives a `paused: boolean` prop. The hook's internal tick (via `useRef` + `setInterval` at 100ms, mirroring `useGameLoop`) skips `timeLeft` decrements when `paused` is true. The spawn countdown likewise does not advance while paused.

### `GameState` additions

```typescript
cookingSpeedModifier?: { multiplier: number; expiresAt: number }
moneyMultiplier?: { multiplier: number; expiresAt: number }
disabledStations?: string[]
```

`TICK` clears expired modifiers by comparing `expiresAt` against `now`. `disabledStations` is cleared by `ENABLE_STATIONS`.

---

## New Reducer Actions

| Action | Payload | Effect |
|--------|---------|--------|
| `REMOVE_PREPARED_ITEMS` | `{ count: number }` | Removes up to `count` random items from `preparedItems` (no-op if empty) |
| `SET_COOKING_SPEED_MODIFIER` | `{ multiplier: number; expiresAt: number }` | Sets `cookingSpeedModifier`; replaces any existing modifier; applies to **new slots only** — the `COOK` action multiplies `cookDuration` by `1 / (cookingSpeed * modifier)` |
| `DISABLE_STATIONS` | `{ stationIds: string[] }` | Unions provided IDs into `disabledStations` (additive); disabled stations reject new `COOK` actions with an error message |
| `ENABLE_STATIONS` | `{ stationIds: string[] }` | Removes only the specified IDs from `disabledStations`; does not affect any other disabled stations |
| `ADD_MONEY_MULTIPLIER` | `{ multiplier: number; expiresAt: number }` | Sets `moneyMultiplier`; replaces any existing multiplier; applied in `SERVE` as `reward = Math.round((recipe.reward + timeBonus) * multiplier)` (after time bonus, before rounding) |
| `ADD_PREPARED_ITEMS` | `{ items: string[] }` | Appends items to `preparedItems` |
| `EXTEND_ORDER_PATIENCE` | `{ ms: number }` | Adds `ms` to `patienceLeft` of all active (non-served) orders, capped at their `patienceMax` |

**Power Trip — station selection:** at spawn, 2 stations are chosen at random from stations that are **not** currently `overheated: true`. If fewer than 2 eligible stations exist, Power Trip is skipped and a different event type is re-rolled. Their IDs are stored in `payload.disabledStations` and passed verbatim to both `DISABLE_STATIONS` (on spawn) and `ENABLE_STATIONS` (on resolve), ensuring no other stations are affected.

**`DISABLE_STATIONS` semantics:** sets `disabledStations` to a union of the current value and the provided IDs (additive, not replace-all). This mirrors `ENABLE_STATIONS`'s scoped remove and is safe for future extensibility. Since only one event is active at a time and only Power Trip uses this action, the union always starts from `[]` in practice.

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
When an event spawns, a `system` chat message is added via `dispatch({ type: 'ADD_CHAT', ... })`:
> `🐀 RAT INVASION! Type SHOO in chat to help!`

---

## App.tsx Integration

```
handleTwitchMessage / handleChatSend
  → handleEventCommand(user, text)   // new — raw text, matched uppercase; no ! prefix
  → handleMetaCommand(user, text)    // existing
  → handleCommand(user, text)        // existing — !commands only
```

`useKitchenEvents` is called with `(state, dispatch, isPlaying && !isTutorial && gameOptions.kitchenEventsEnabled, paused)`.

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
