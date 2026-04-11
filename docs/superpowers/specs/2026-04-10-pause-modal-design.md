# Pause Modal — Design Spec
**Date:** 2026-04-10
**Branch:** feat/main-menu-redesign

---

## Overview

Replace the in-game settings gear button dropdown with a full-screen pause modal. When open, the modal freezes the game clock. The modal uses a two-column layout: settings/actions on the left, active recipes scrollable on the right.

---

## Motivation

The current settings dropdown is a small overlay with small text and no pausing. Players have to manage live game state while reading settings. The pause modal gives players a calm moment to adjust settings and review recipes mid-game.

---

## Component

**New files:**
- `src/components/PauseModal.tsx`
- `src/components/PauseModal.module.css`

**Modified files:**
- `src/App.tsx` — replace dropdown with modal, add `paused` state
- `src/hooks/useGameLoop.ts` — accept `paused: boolean` param, skip TICK when true

---

## Pause Mechanic

`App.tsx` holds `const [paused, setPaused] = useState(false)`.

`useGameLoop` gains a `paused` parameter. Inside the `setInterval` callback, if `paused` is true, the TICK dispatch is skipped (interval still runs, clock just doesn't advance). This is the minimal, safe approach — no interval teardown/restart needed.

Gear button click: `setPaused(true)` (opens modal).
Resume button or Escape key: `setPaused(false)` (closes modal).

---

## Layout — Two Column

```
┌─────────────────────────────────────────────────┐
│  ⏸ PAUSED                          [game context]│
├──────────────────────┬──────────────────────────┤
│  LEFT (~220px fixed) │  RIGHT (flex: 1, scroll) │
│                      │                          │
│  🎵 Music  [ON]      │  ACTIVE RECIPES          │
│  🔊 SFX    [ON]      │  ┌──────────────────┐   │
│  💬 Chat   [OFF]     │  │ 🍔 Burger        │   │
│  🤖 Bots   [ON]      │  │ chop lettuce +   │   │
│                      │  │ grill patty +    │   │
│  ──────────────────  │  │ toast bun        │   │
│                      │  └──────────────────┘   │
│  [Exit to Menu]      │  ┌──────────────────┐   │
│  [▶ Resume Game]     │  │ 🍳 Fried Rice    │   │
│                      │  │ cook rice →      │   │
│                      │  │ stir rice +      │   │
│                      │  │ chop spring_onion│   │
│                      │  └──────────────────┘   │
│                      │  ↕ scroll for more       │
└──────────────────────┴──────────────────────────┘
```

**Overlay:** full-screen dark semi-transparent backdrop (`rgba(0,0,0,0.7)`), `z-index: 300`, does not close on backdrop click (intentional — game is paused, no accidental resume).

**Modal:** centered, `~780px` wide, `max-height: 90vh`, `border-radius: 14px`, styled with existing CSS variable palette (`--station-bg`, `--border`, `--text`, etc.).

---

## Left Column — Settings

- Header: "⏸ PAUSED" in gold (`#f0c850`), `font-size: 20px`
- Four toggle buttons, one per row:
  - 🎵 Music | 🔊 SFX | 💬 Chat | 🤖 Bots
  - ON state: green border + text (`#5cb85c`)
  - OFF state: muted text (`var(--text-secondary)`)
  - Font size: 18px minimum (Fredoka)
- Divider
- **Exit to Menu** button — red style (`#d94f4f`), full width, 18px
- **▶ Resume Game** button — gold/primary style, full width, 18px, visually prominent

---

## Right Column — Active Recipes

- Section label: "ACTIVE RECIPES" in small-caps Space Mono, `var(--text-secondary)`
- Scrollable list of recipe cards for each key in `gameOptions.enabledRecipes`
- Each card:
  - Recipe name with emoji — **18px**, Fredoka bold, `var(--text)`
  - Steps line — **18px**, Space Mono, `var(--text-secondary)`, steps joined with ` + ` or ` → ` based on `step.requires`
  - Light background card (`rgba(255,255,255,0.04)`), `border-radius: 8px`, `padding: 10px 12px`
- `overflow-y: auto` on the column, `max-height` inherited from modal

---

## Props Interface

```typescript
interface PauseModalProps {
  gameOptions: GameOptions
  audioSettings: AudioSettings
  onAudioChange: (s: AudioSettings) => void
  onChatToggle: () => void
  onBotsToggle: () => void
  onResume: () => void
  onExit: () => void
  enabledRecipes: string[]
}
```

---

## Keyboard Handling

`useEffect` in `PauseModal` — `keydown` listener for `Escape` → calls `onResume()`. Cleaned up on unmount.

---

## App.tsx Changes

1. Remove: `settingsOpen` state, `settingsWrapper`/`settingsDropdown`/`settingsBackdrop` JSX and associated CSS classes.
2. Add: `paused` state (`useState(false)`).
3. Gear button: `onClick={() => setPaused(true)}`.
4. Render `<PauseModal ... />` when `paused === true` (only during `playing` screen).
5. Pass `paused` to `useGameLoop`.

---

## useGameLoop.ts Changes

```typescript
// Before
export function useGameLoop({ onTick, onSpawnOrder, onGameOver }: Props)

// After
export function useGameLoop({ onTick, onSpawnOrder, onGameOver, paused }: Props)
```

Inside the interval callback:
```typescript
if (paused) return
// ... existing TICK dispatch logic
```

---

## Removal

The following are removed entirely:
- `settingsOpen` state in App.tsx
- `settingsBackdrop` div
- `settingsDropdown` div and all its children (inline JSX)
- CSS classes: `.settingsBackdrop`, `.settingsDropdown`, `.settingsHeader`, `.settingsBrand`, `.settingsLogo`, `.settingsLevel`, `.settingsClose`, `.settingsTwitch`, `.settingsItem`, `.settingsItemOn`, `.settingsItemOff`, `.settingsDivider`, `.settingsExit`, `.settingsRecipeLabel`, `.settingsRecipeList`, `.settingsRecipeItem`, `.settingsRecipeName`, `.settingsRecipeSteps`, `.twitchDot`

`settingsBtn` and `settingsWrapper`/`settingsWrapperChatOpen` are kept — the button remains, it just now opens the modal instead of a dropdown.

---

## Out of Scope

- Commands reference tab (not in the approved design)
- Saving settings mid-modal (changes apply immediately as before)
- Animation/transition on modal open (keep it simple)
