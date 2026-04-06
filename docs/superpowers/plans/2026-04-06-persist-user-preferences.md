# Persist User Preferences Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist `gameOptions`, `twitchChannel`, and `hideTutorialPrompt` to `localStorage` so they survive page refreshes.

**Architecture:** All changes are in `src/App.tsx` only. Each value gets a lazy `useState` initializer that reads from `localStorage` on mount, and a save point that writes on change — identical to the existing `audioSettings` pattern. `handleResetAll` is extended to clear all three new keys.

**Tech Stack:** React 18 `useState` lazy initializer, `localStorage` API, `useCallback`

---

## File Map

| File | Change |
|---|---|
| `src/App.tsx` | All edits — lazy initialisers, save handlers, JSX prop updates, `handleResetAll` extension |

No new files.

---

### Task 1: Persist `gameOptions`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the plain `gameOptions` useState with a lazy initializer**

In `src/App.tsx`, replace line 47:

```ts
// BEFORE
const [gameOptions, setGameOptions] = useState<GameOptions>(DEFAULT_GAME_OPTIONS)
```

```ts
// AFTER
const [gameOptions, setGameOptions] = useState<GameOptions>(() => {
  try {
    const saved = localStorage.getItem('chatsKitchen_gameOptions')
    return saved ? { ...DEFAULT_GAME_OPTIONS, ...JSON.parse(saved) } : DEFAULT_GAME_OPTIONS
  } catch {
    return DEFAULT_GAME_OPTIONS
  }
})
```

The default-spread (`{ ...DEFAULT_GAME_OPTIONS, ...parsed }`) means any new field added to `GameOptions` in the future still gets its default value for users with old saved data.

- [ ] **Step 2: Add `handleGameOptionsChange` callback**

In `src/App.tsx`, add the following immediately after `handleAudioChange` (after line 173):

```ts
const handleGameOptionsChange = useCallback((options: GameOptions) => {
  setGameOptions(options)
  localStorage.setItem('chatsKitchen_gameOptions', JSON.stringify(options))
}, [])
```

- [ ] **Step 3: Wire `handleGameOptionsChange` into OptionsScreen**

In `src/App.tsx`, find line 225:

```tsx
// BEFORE
content = <OptionsScreen options={gameOptions} onChange={setGameOptions} audioSettings={audioSettings} onAudioChange={handleAudioChange} onResetAll={handleResetAll} onBack={() => setScreen('menu')} />
```

```tsx
// AFTER
content = <OptionsScreen options={gameOptions} onChange={handleGameOptionsChange} audioSettings={audioSettings} onAudioChange={handleAudioChange} onResetAll={handleResetAll} onBack={() => setScreen('menu')} />
```

- [ ] **Step 4: Clear `chatsKitchen_gameOptions` in `handleResetAll`**

In `src/App.tsx`, find the `handleResetAll` try block (around line 185). Add the new `removeItem` call:

```ts
// BEFORE
    try {
      localStorage.setItem('audioSettings', JSON.stringify(DEFAULT_AUDIO_SETTINGS))
      localStorage.removeItem('chatsKitchen_levelProgress')
    } catch {
      // Ignore storage failures and keep the in-memory reset behavior.
    }
```

```ts
// AFTER
    try {
      localStorage.setItem('audioSettings', JSON.stringify(DEFAULT_AUDIO_SETTINGS))
      localStorage.removeItem('chatsKitchen_levelProgress')
      localStorage.removeItem('chatsKitchen_gameOptions')
    } catch {
      // Ignore storage failures and keep the in-memory reset behavior.
    }
```

- [ ] **Step 5: Verify manually**

Run: `npm run dev`

1. Open the app → go to **Options**
2. Change **Cooking Speed** to **2x** and **Round Duration** to **1 min**
3. Refresh the page (F5)
4. Go back to **Options** — confirm **2x** and **1 min** are still selected
5. Open **Options → Reset Everything To Default**
6. Confirm the reset dialog → go back to **Options** — confirm values returned to **1x** and **2 min**

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persist gameOptions to localStorage"
```

---

### Task 2: Persist `twitchChannel`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the plain `twitchChannel` useState with a lazy initializer**

In `src/App.tsx`, replace line 53:

```ts
// BEFORE
const [twitchChannel, setTwitchChannel] = useState<string | null>(null)
```

```ts
// AFTER
const [twitchChannel, setTwitchChannel] = useState<string | null>(() => {
  try {
    return localStorage.getItem('chatsKitchen_twitchChannel')
  } catch {
    return null
  }
})
```

`localStorage.getItem` returns `null` when the key is absent, which matches the original default exactly.

- [ ] **Step 2: Add `handleTwitchChannelChange` wrapper**

In `src/App.tsx`, add the following immediately after `handleGameOptionsChange` (after the callback added in Task 1 Step 2):

```ts
const handleTwitchChannelChange = useCallback((ch: string | null) => {
  setTwitchChannel(ch)
  try {
    if (ch) localStorage.setItem('chatsKitchen_twitchChannel', ch)
    else localStorage.removeItem('chatsKitchen_twitchChannel')
  } catch {}
}, [])
```

Passing `null` removes the key (explicit disconnect won't auto-reconnect on next refresh). Passing a string saves it (auto-reconnects on next refresh).

- [ ] **Step 3: Update `TwitchConnect` JSX props**

In `src/App.tsx`, find the `TwitchConnect` JSX (around line 228). Replace the inline lambdas:

```tsx
// BEFORE
        onConnect={(ch) => setTwitchChannel(ch)}
        onDisconnect={() => setTwitchChannel(null)}
```

```tsx
// AFTER
        onConnect={(ch) => handleTwitchChannelChange(ch)}
        onDisconnect={() => handleTwitchChannelChange(null)}
```

- [ ] **Step 4: Update `handleResetAll` to use the wrapper and fix its deps**

In `src/App.tsx`, find `handleResetAll`. Make two changes:

1. Replace `setTwitchChannel(null)` with `handleTwitchChannelChange(null)` (this also removes the localStorage key via the wrapper):

```ts
// BEFORE
    setTwitchChannel(null)
```

```ts
// AFTER
    handleTwitchChannelChange(null)
```

2. Add `handleTwitchChannelChange` to the `useCallback` dependency array:

```ts
// BEFORE
  }, [])
```

```ts
// AFTER
  }, [handleTwitchChannelChange])
```

Note: `handleTwitchChannelChange` has `[]` deps so it is stable — `handleResetAll` will not re-create unnecessarily.

- [ ] **Step 5: Verify manually**

Run: `npm run dev`

1. Go to **Twitch** → enter a channel name (e.g. `testchannel`) → click **Connect**
2. Refresh the page — confirm the app auto-connects to `testchannel` without re-entering it
3. Go to **Twitch** → click **Disconnect**
4. Refresh — confirm it does NOT auto-connect (channel is cleared)
5. Connect again → go to **Options → Reset Everything To Default** → confirm
6. Refresh — confirm the channel is no longer saved

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persist twitchChannel to localStorage"
```

---

### Task 3: Persist `hideTutorialPrompt`

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Replace the plain `hideTutorialPrompt` useState with a lazy initializer**

In `src/App.tsx`, replace line 72:

```ts
// BEFORE
const [hideTutorialPrompt, setHideTutorialPrompt] = useState(false)
```

```ts
// AFTER
const [hideTutorialPrompt, setHideTutorialPrompt] = useState(() => {
  try {
    return localStorage.getItem('chatsKitchen_hideTutorialPrompt') === 'true'
  } catch {
    return false
  }
})
```

- [ ] **Step 2: Save the flag when the user clicks "Don't show again"**

In `src/App.tsx`, find `disableTutorialPrompt` (around line 107). Add the `localStorage.setItem` call immediately after `setHideTutorialPrompt(true)`:

```ts
// BEFORE
  const disableTutorialPrompt = useCallback(() => {
    setHideTutorialPrompt(true)
    setShowTutorialPrompt(false)
    continueFromTutorial(tutorialDestination)
  }, [continueFromTutorial, tutorialDestination])
```

```ts
// AFTER
  const disableTutorialPrompt = useCallback(() => {
    setHideTutorialPrompt(true)
    localStorage.setItem('chatsKitchen_hideTutorialPrompt', 'true')
    setShowTutorialPrompt(false)
    continueFromTutorial(tutorialDestination)
  }, [continueFromTutorial, tutorialDestination])
```

- [ ] **Step 3: Clear `chatsKitchen_hideTutorialPrompt` in `handleResetAll`**

In `src/App.tsx`, find the `handleResetAll` try block. Add the new `removeItem` call (it should now have all three new keys):

```ts
// BEFORE
    try {
      localStorage.setItem('audioSettings', JSON.stringify(DEFAULT_AUDIO_SETTINGS))
      localStorage.removeItem('chatsKitchen_levelProgress')
      localStorage.removeItem('chatsKitchen_gameOptions')
    } catch {
      // Ignore storage failures and keep the in-memory reset behavior.
    }
```

```ts
// AFTER
    try {
      localStorage.setItem('audioSettings', JSON.stringify(DEFAULT_AUDIO_SETTINGS))
      localStorage.removeItem('chatsKitchen_levelProgress')
      localStorage.removeItem('chatsKitchen_gameOptions')
      localStorage.removeItem('chatsKitchen_hideTutorialPrompt')
    } catch {
      // Ignore storage failures and keep the in-memory reset behavior.
    }
```

- [ ] **Step 4: Verify manually**

Run: `npm run dev`

1. From the main menu, click **Play** (or **Levels**) — the tutorial prompt appears
2. Click **Don't show again**
3. Refresh the page
4. Click **Play** again — confirm the tutorial prompt does NOT appear
5. Go to **Options → Reset Everything To Default** → confirm
6. Refresh → click **Play** — confirm the tutorial prompt appears again

- [ ] **Step 5: Run the build to confirm no TypeScript errors**

```bash
npm run build
```

Expected: build completes with no type errors and no lint errors.

- [ ] **Step 6: Commit**

```bash
git add src/App.tsx
git commit -m "feat: persist hideTutorialPrompt to localStorage"
```

---

## Final localStorage Key Inventory

| Key | Written by | Cleared by |
|---|---|---|
| `audioSettings` | `handleAudioChange` | `handleResetAll` |
| `chatsKitchen_levelProgress` | `handleGameOver` | `handleResetAll` |
| `chatsKitchen_gameOptions` | `handleGameOptionsChange` | `handleResetAll` |
| `chatsKitchen_twitchChannel` | `handleTwitchChannelChange` | `handleTwitchChannelChange(null)` via `handleResetAll` |
| `chatsKitchen_hideTutorialPrompt` | `disableTutorialPrompt` | `handleResetAll` |
