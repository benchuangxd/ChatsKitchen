# Kitchen Events Audio — Design Spec

**Date:** 2026-04-21
**Branch:** feat/kitchen-events
**Scope:** Add 4-phase audio (start sting, ambient loop, success sting, fail sting) to all 9 kitchen events.

---

## Overview

Every kitchen event fires audio at four lifecycle moments:

| Moment | Behaviour |
|--------|-----------|
| **Start** | One-shot SFX sting on event spawn |
| **During** | Looping ambient track; gameplay music ducked to ~0.15 volume bed |
| **Success** | Gameplay music restored, then one-shot success SFX |
| **Fail** | Gameplay music restored, then one-shot fail SFX (hazard-immediate events omit fail audio — they cannot time out) |

---

## Audio Files

**Location:** `/public/audio/events/`

**Naming convention:**
```
<eventType>-start.mp3
<eventType>-ambient.mp3
<eventType>-success.mp3
<eventType>-fail.mp3      ← omitted for power_trip, smoke_blast, glitched_orders
```

**Total files:** 33

**Source:** Pixabay Sound Effects (royalty-free, no attribution) and Freesound.org (CC0 only).

### Per-event sound character

| Event | Start | Ambient Loop | Success | Fail |
|-------|-------|-------------|---------|------|
| 🐀 `rat_invasion` | Rat squeak burst | Scurrying / rustling | Rats fleeing whoosh | Crash + frantic squeaks |
| 👨‍🍳 `angry_chef` | Kitchen crash + shout | Tense grumbling loop | Relieved sigh / cheer | Pots banging |
| 🔌 `power_trip` | Electrical zap + shutdown | Electrical hum / flicker | Power-on click + hum rise | — |
| 💨 `smoke_blast` | Hiss + alarm sting | Smoke alarm loop | Ventilation whoosh | — |
| 📦 `glitched_orders` | Digital glitch / corruption | Digital static loop | System restore chime | — |
| 📢 `chefs_chant` | Crowd anticipation sting | Building chant loop | Crowd roar | Disappointed crowd |
| 🧩 `mystery_recipe` | Mystery / puzzle sting | Curious thinking loop | Sparkle / puzzle solved | Wrong answer buzz |
| ⚡ `typing_frenzy` | Electric zap + excitement | Frantic keyboard loop | Triumph fanfare | Deflation buzz |
| 🕺 `dance` | Music drop intro | Upbeat funky loop | Crowd cheer + flourish | Record scratch |

---

## Data Model Changes

### `src/data/kitchenEventDefs.ts`

Add `audio` field to `EventDef` interface:

```typescript
interface EventDef {
  // ... existing fields
  audio: {
    start: string     // key into EVENT_SFX
    ambient: string   // key into EVENT_AMBIENT
    success: string   // key into EVENT_SFX
    fail?: string     // optional — omitted for hazard-immediate events
  }
}
```

Each entry in `EVENT_DEFS` gets a populated `audio` block, e.g.:

```typescript
{
  type: 'rat_invasion',
  audio: {
    start:   'event-rat-start',
    ambient: 'event-rat-ambient',
    success: 'event-rat-success',
    fail:    'event-rat-fail',
  }
}
```

### `src/audio/audioAssets.ts`

Two new exports added alongside existing `MUSIC_TRACKS` and `SFX`:

```typescript
// One-shot event stings (start / success / fail)
export const EVENT_SFX: Record<string, { src: string[]; volume: number }> = {
  'event-rat-start':             { src: ['/audio/events/rat_invasion-start.mp3'],          volume: 0.7 },
  'event-rat-success':           { src: ['/audio/events/rat_invasion-success.mp3'],        volume: 0.7 },
  'event-rat-fail':              { src: ['/audio/events/rat_invasion-fail.mp3'],           volume: 0.7 },
  'event-angry-chef-start':      { src: ['/audio/events/angry_chef-start.mp3'],            volume: 0.7 },
  'event-angry-chef-success':    { src: ['/audio/events/angry_chef-success.mp3'],          volume: 0.7 },
  'event-angry-chef-fail':       { src: ['/audio/events/angry_chef-fail.mp3'],             volume: 0.7 },
  'event-power-trip-start':      { src: ['/audio/events/power_trip-start.mp3'],            volume: 0.7 },
  'event-power-trip-success':    { src: ['/audio/events/power_trip-success.mp3'],          volume: 0.7 },
  'event-smoke-blast-start':     { src: ['/audio/events/smoke_blast-start.mp3'],           volume: 0.7 },
  'event-smoke-blast-success':   { src: ['/audio/events/smoke_blast-success.mp3'],         volume: 0.7 },
  'event-glitch-start':          { src: ['/audio/events/glitched_orders-start.mp3'],       volume: 0.7 },
  'event-glitch-success':        { src: ['/audio/events/glitched_orders-success.mp3'],     volume: 0.7 },
  'event-chant-start':           { src: ['/audio/events/chefs_chant-start.mp3'],           volume: 0.7 },
  'event-chant-success':         { src: ['/audio/events/chefs_chant-success.mp3'],         volume: 0.8 },
  'event-chant-fail':            { src: ['/audio/events/chefs_chant-fail.mp3'],            volume: 0.6 },
  'event-mystery-start':         { src: ['/audio/events/mystery_recipe-start.mp3'],        volume: 0.7 },
  'event-mystery-success':       { src: ['/audio/events/mystery_recipe-success.mp3'],      volume: 0.7 },
  'event-mystery-fail':          { src: ['/audio/events/mystery_recipe-fail.mp3'],         volume: 0.6 },
  'event-frenzy-start':          { src: ['/audio/events/typing_frenzy-start.mp3'],         volume: 0.7 },
  'event-frenzy-success':        { src: ['/audio/events/typing_frenzy-success.mp3'],       volume: 0.8 },
  'event-frenzy-fail':           { src: ['/audio/events/typing_frenzy-fail.mp3'],          volume: 0.6 },
  'event-dance-start':           { src: ['/audio/events/dance-start.mp3'],                 volume: 0.7 },
  'event-dance-success':         { src: ['/audio/events/dance-success.mp3'],               volume: 0.8 },
  'event-dance-fail':            { src: ['/audio/events/dance-fail.mp3'],                  volume: 0.6 },
}

// Looping ambient tracks (duck gameplay music while active)
export const EVENT_AMBIENT: Record<string, { src: string[]; volume: number }> = {
  'event-rat-ambient':           { src: ['/audio/events/rat_invasion-ambient.mp3'],        volume: 0.4 },
  'event-angry-chef-ambient':    { src: ['/audio/events/angry_chef-ambient.mp3'],          volume: 0.35 },
  'event-power-trip-ambient':    { src: ['/audio/events/power_trip-ambient.mp3'],          volume: 0.4 },
  'event-smoke-blast-ambient':   { src: ['/audio/events/smoke_blast-ambient.mp3'],         volume: 0.4 },
  'event-glitch-ambient':        { src: ['/audio/events/glitched_orders-ambient.mp3'],     volume: 0.4 },
  'event-chant-ambient':         { src: ['/audio/events/chefs_chant-ambient.mp3'],         volume: 0.45 },
  'event-mystery-ambient':       { src: ['/audio/events/mystery_recipe-ambient.mp3'],      volume: 0.35 },
  'event-frenzy-ambient':        { src: ['/audio/events/typing_frenzy-ambient.mp3'],       volume: 0.45 },
  'event-dance-ambient':         { src: ['/audio/events/dance-ambient.mp3'],               volume: 0.5 },
}
```

---

## AudioManager Changes

### New private state

```typescript
private eventAmbientSounds: Record<string, Howl> = {}
private activeEventAmbientKey: string | null = null
private MUSIC_BED_VOLUME = 0.15   // existing constant, already used by crossfadeToIntense
```

### New public methods

```typescript
playEventSfx(key: string): void
```
- Plays a one-shot event SFX from `eventSfxSounds` pool
- Respects `_sfxMuted` and `sfxThrottles` (same as `playSfx`)

```typescript
startEventAmbient(key: string): void
```
- Fades gameplay music down to `MUSIC_BED_VOLUME` (0.15) over 500ms — mirrors existing crossfadeToIntense ducking
- Starts looping ambient Howl with 500ms fade-in
- Stores key in `activeEventAmbientKey`
- No-ops if intense mode is active (time < 30s) — intense music already ducked

```typescript
stopEventAmbient(): void
```
- Fades out active ambient over 500ms
- Restores gameplay music to full music volume over 800ms (unless intense mode active — restores to intense instead)
- Clears `activeEventAmbientKey`

### Init

`init()` loads `EVENT_SFX` into `eventSfxSounds` (Record<string, Howl>) and `EVENT_AMBIENT` into `eventAmbientSounds` — same lazy-init pattern as existing `sfxSounds`.

---

## useKitchenEvents Wiring

```typescript
// spawnEvent()
const am = getAudioManager()
am.playEventSfx(def.audio.start)
am.startEventAmbient(def.audio.ambient)

// resolveEvent()
const am = getAudioManager()
am.stopEventAmbient()
am.playEventSfx(def.audio.success)

// failEvent()
const am = getAudioManager()
am.stopEventAmbient()
if (def.audio.fail) am.playEventSfx(def.audio.fail)

// cleanup effect (game ends / events disabled)
getAudioManager().stopEventAmbient()
```

The `def` reference in each lifecycle function is obtained by looking up `EVENT_DEFS.find(d => d.type === event.type)`.

---

## Interaction with Intense Music Mode

When `timeLeft ≤ 30s`, the game crossfades to the intense music track. If a kitchen event is active during this window:

- `startEventAmbient` checks if intense mode is active; if so, it ducks the intense track instead of the gameplay track
- `stopEventAmbient` checks `intenseMixActive` flag and restores the correct track

This is handled by reading the existing `intenseMixActive` private flag in AudioManager.

---

## Files Changed

| File | Change |
|------|--------|
| `public/audio/events/*.mp3` | 33 new audio files |
| `src/audio/audioAssets.ts` | Add `EVENT_SFX` and `EVENT_AMBIENT` exports |
| `src/audio/AudioManager.ts` | Add `eventSfxSounds`, `eventAmbientSounds`, 3 new methods, updated `init()` |
| `src/data/kitchenEventDefs.ts` | Add `audio` field to `EventDef` interface + populate all 9 entries |
| `src/hooks/useKitchenEvents.ts` | Wire 4 call points + cleanup |

---

## Out of Scope

- No new audio settings UI — event audio respects existing SFX mute/volume controls (stings) and music volume controls (ambients)
- No per-event audio toggle in GameOptions
