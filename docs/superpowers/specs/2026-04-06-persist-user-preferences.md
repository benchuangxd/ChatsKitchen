# Persist User Preferences Across Page Refreshes

**Date:** 2026-04-06
**Status:** Approved

---

## Problem

Three pieces of user-configurable state are lost on every page refresh:

- **`gameOptions`** — cooking speed, order speed, round duration, station slots, active recipes
- **`twitchChannel`** — the Twitch channel name entered by the user
- **`hideTutorialPrompt`** — whether the user clicked "Don't show again" on the tutorial prompt

`audioSettings` and `levelProgress` are already persisted to `localStorage` correctly. This spec brings the remaining three values in line.

---

## Approach

**Option A — Inline localStorage (chosen).** Load from `localStorage` in each `useState` initializer; save in each handler. Identical to the existing `audioSettings` and `levelProgress` pattern. No new files, no new abstractions.

Options B (custom hook) and C (merged prefs object) were considered and rejected: B adds complexity around schema evolution for nested objects; C couples unrelated concerns.

---

## Design

### All changes in `src/App.tsx` only.

---

### 1. `gameOptions`

**Load** — replace the plain `useState(DEFAULT_GAME_OPTIONS)` initializer with a lazy initializer:

```ts
const [gameOptions, setGameOptions] = useState<GameOptions>(() => {
  try {
    const saved = localStorage.getItem('chatsKitchen_gameOptions')
    return saved ? { ...DEFAULT_GAME_OPTIONS, ...JSON.parse(saved) } : DEFAULT_GAME_OPTIONS
  } catch {
    return DEFAULT_GAME_OPTIONS
  }
})
```

The default-spread (`{ ...DEFAULT_GAME_OPTIONS, ...parsed }`) ensures any new fields added to `GameOptions` in the future still receive their defaults for users with old saved data.

**Save** — add a `handleGameOptionsChange` callback (mirrors `handleAudioChange`):

```ts
const handleGameOptionsChange = useCallback((options: GameOptions) => {
  setGameOptions(options)
  localStorage.setItem('chatsKitchen_gameOptions', JSON.stringify(options))
}, [])
```

Pass `handleGameOptionsChange` to `OptionsScreen`'s `onChange` prop instead of the bare `setGameOptions`.

**localStorage key:** `chatsKitchen_gameOptions`

---

### 2. `twitchChannel`

**Load** — replace the plain `useState<string | null>(null)` initializer:

```ts
const [twitchChannel, setTwitchChannel] = useState<string | null>(() => {
  try {
    return localStorage.getItem('chatsKitchen_twitchChannel')
  } catch {
    return null
  }
})
```

On load, if a channel is saved, `useTwitchChat` will auto-connect (same as current live behaviour — this just survives a refresh).

**Save / clear** — add a `handleTwitchChannelChange` wrapper:

```ts
const handleTwitchChannelChange = useCallback((ch: string | null) => {
  setTwitchChannel(ch)
  try {
    if (ch) localStorage.setItem('chatsKitchen_twitchChannel', ch)
    else localStorage.removeItem('chatsKitchen_twitchChannel')
  } catch {}
}, [])
```

Replace all `setTwitchChannel(...)` call sites (connect, disconnect, reset) with `handleTwitchChannelChange(...)`.

**Disconnect behaviour:** explicit disconnect calls `handleTwitchChannelChange(null)`, which removes the key. The channel will not auto-reconnect next refresh. This is intentional — explicit disconnect should be respected.

**localStorage key:** `chatsKitchen_twitchChannel`

---

### 3. `hideTutorialPrompt`

**Load** — replace the plain `useState(false)` initializer:

```ts
const [hideTutorialPrompt, setHideTutorialPrompt] = useState(() => {
  try {
    return localStorage.getItem('chatsKitchen_hideTutorialPrompt') === 'true'
  } catch {
    return false
  }
})
```

**Save** — in `disableTutorialPrompt`, after `setHideTutorialPrompt(true)`, add:

```ts
localStorage.setItem('chatsKitchen_hideTutorialPrompt', 'true')
```

No dedicated handler needed — this flag is only ever set to `true` in one place.

**localStorage key:** `chatsKitchen_hideTutorialPrompt`

---

### 4. `handleResetAll` updates

The existing reset already clears `audioSettings` and `chatsKitchen_levelProgress`. Extend it to also remove the three new keys:

```ts
localStorage.removeItem('chatsKitchen_gameOptions')
localStorage.removeItem('chatsKitchen_twitchChannel')
localStorage.removeItem('chatsKitchen_hideTutorialPrompt')
```

`handleResetAll` also calls `setTwitchChannel(null)` (already present) — change this to `handleTwitchChannelChange(null)` so the localStorage removal is handled consistently through the wrapper.

---

## localStorage Key Summary

| Key | Type | Cleared by Reset |
|---|---|---|
| `audioSettings` | `AudioSettings` (JSON) | ✅ already |
| `chatsKitchen_levelProgress` | `LevelProgress` (JSON) | ✅ already |
| `chatsKitchen_gameOptions` | `GameOptions` (JSON) | ✅ new |
| `chatsKitchen_twitchChannel` | `string` | ✅ new |
| `chatsKitchen_hideTutorialPrompt` | `"true"` | ✅ new |

---

## Scope

- **Files changed:** `src/App.tsx` only
- **Net lines added:** ~25
- **New files:** none
- **Tests:** none (project has no test framework)
