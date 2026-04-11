# Plan: Auto-Restart and Mod/Broadcaster Commands

**Date:** 2026-04-11
**Branch:** feat/pause-modal-close-btn

---

## Context

Streamers running Free Play sessions want continuous gameplay without manually clicking "Play Again" after each round. This feature adds:

1. An **auto-restart toggle** in Free Play's More Options panel — when enabled, the game over screen counts down and automatically starts a new round.
2. A set of **mod/broadcaster chat commands** for live session control, usable from Twitch chat (mods/broadcaster only) or the local chat panel (always treated as broadcaster).

---

## Features

### Auto-Restart (Free Play only)

- Toggle in More Options: **🔄 Auto-Restart** (OFF by default)
- When ON, a configurable **Restart Delay** slider appears (10–300 s, 10 s steps, default 60 s)
- Game over screen always shows the auto-restart section for Free Play:
  - **ON:** "Auto-restarting in Xs…" (large countdown) + `!start` / `!offAutoRestart` hint + Cancel button
  - **OFF:** "Auto-restart is OFF" + `!start` / `!onAutoRestart` hint
- Clicking **Cancel** stops the countdown without ending the session
- Settings persist to `localStorage` via `chatsKitchen_gameOptions`

### Mod / Broadcaster Commands

Processed in `handleMetaCommand` (App.tsx) before normal cooking commands. Auth gate: `tags.mod || tags.badges.broadcaster === '1'` from tmi.js; local "You" is always granted access.

| Command | Screen(s) | Effect |
|---------|-----------|--------|
| `!start` | `gameover` (Free Play) | Calls `startFreePlay()` immediately |
| `!onAutoRestart` | `playing`, `gameover` | Sets `gameOptions.autoRestart = true` |
| `!offAutoRestart` | `playing`, `gameover` | Sets `gameOptions.autoRestart = false`, cancels countdown |
| `!exit` | `playing` | Calls `handleGameOver()` → normal ShiftEnd → GameOver flow |

A **Toast** notification (fixed-position, 2.5 s auto-dismiss) confirms each command to the streamer.

---

## Files Changed

| File | Change |
|------|--------|
| `src/state/types.ts` | Added `autoRestart: boolean` and `autoRestartDelay: number` to `GameOptions` |
| `src/App.tsx` | Updated defaults, added `showToast`, `handleMetaCommand`, updated `handleTwitchMessage` / `handleChatSend`, wired `autoRestart` prop to `GameOver` from live `gameOptions` |
| `src/hooks/useTwitchChat.ts` | Callback now receives `isMod: boolean` (derived from tmi.js tags) |
| `src/components/FreePlaySetup.tsx` | Auto-Restart toggle + conditional Restart Delay slider in More Options |
| `src/components/GameOver.tsx` | Countdown driven by `autoRestart` prop via `useEffect`; always renders auto-restart section for Free Play |
| `src/components/GameOver.module.css` | Added `.autoRestartBar`, `.autoRestartText`, `.countdownNum`, `.autoRestartHint`, `.cancelBtn` |
| `src/components/Toast.tsx` | New: fixed-position toast component |
| `src/components/Toast.module.css` | New: slide-up fade-in animation, 18px Fredoka, z-index 500 |

---

## Key Design Decisions

- **`autoRestart` is passed from live `gameOptions`**, not snapshotted in `finalStats` — this allows mod commands to take effect immediately on the active game over screen.
- **Countdown is prop-driven** in `GameOver`: a `useEffect` watching `autoRestart` resets or clears the countdown whenever the prop changes, so `!onAutoRestart` and `!offAutoRestart` work in real time.
- **`handleMetaCommand` uses refs** (`screenRef`, `gameOptionsRef`, `currentLevelRef`) for the mutable values it reads, keeping it stable and avoiding stale closures without deep dep arrays.
- **`!exit` goes through the normal flow** (ShiftEnd animation → GameOver) rather than jumping directly, for consistency.
