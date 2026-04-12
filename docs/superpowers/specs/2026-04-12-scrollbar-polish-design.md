# Scrollbar Polish — Design Spec

**Date:** 2026-04-12

---

## Goal

Make all scrollbars across the app thin and visually consistent with the existing orange-accent theme. Scrollbars should always be visible (not hidden on idle) so users know an area is scrollable.

---

## Scope

All scrollable areas in the app. Current count: 12 containers with `overflow-y: auto` across the following files:

| Component | Scrollable element |
|---|---|
| `ChatPanel` | `.messages` |
| `DiningRoom` | orders list |
| `Kitchen` | station list |
| `OptionsScreen` | tab content |
| `FreePlaySetup` | main content + recipe list |
| `MainMenu` | content column |
| `GameOver` | leaderboard |
| `PauseModal` | content |
| `TutorialModal` | `.scrollArea` |
| `AdventureBriefing` | content |
| `AdventureShiftPassed` | content |
| `AdventureRunEnd` | content (two areas) |

---

## Approach

Global scrollbar rules in `src/theme.css`. One block covers every current and future scrollable element. No per-component changes needed.

---

## Visual Design

- **Width:** 4px
- **Thumb colour:** `rgba(200, 132, 26, 0.35)` at rest — the existing orange accent at low opacity
- **Thumb hover:** `rgba(200, 132, 26, 0.6)` — more vivid on hover
- **Track:** `rgba(0, 0, 0, 0.15)` — dark, barely-there background
- **Border radius:** `4px` on both thumb and track ends — softly rounded

The orange matches `--brand` / `#c8841a` already used throughout the UI. Low opacity at rest keeps it unobtrusive; hover brightens it for feedback.

---

## Changes

### `src/theme.css`
Add at the bottom:

```css
/* ── Global scrollbar ── */
* {
  scrollbar-width: thin;
  scrollbar-color: rgba(200,132,26,0.35) rgba(0,0,0,0.15);
}
*::-webkit-scrollbar       { width: 4px; }
*::-webkit-scrollbar-track { background: rgba(0,0,0,0.15); border-radius: 4px; }
*::-webkit-scrollbar-thumb { background: rgba(200,132,26,0.35); border-radius: 4px; }
*::-webkit-scrollbar-thumb:hover { background: rgba(200,132,26,0.6); }
```

### `src/components/ChatPanel.module.css`
Remove the existing one-off scrollbar rules (lines 67–68):
```css
/* remove these: */
scrollbar-width: thin;
scrollbar-color: #c8841a33 transparent;
```

The global style replaces them. Track changes from `transparent` to `rgba(0,0,0,0.15)` which is more consistent with the rest of the app.

---

## Files Touched

| File | Change |
|---|---|
| `src/theme.css` | Add global scrollbar block |
| `src/components/ChatPanel.module.css` | Remove 2 duplicate lines |

No other files are modified.

---

## Non-Goals

- Light theme scrollbar override (the orange thumb works fine on the light theme's surfaces)
- Horizontal scrollbars (none exist in the app)
- Animated fade-out on idle
