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
| **During** | Looping ambient track; gameplay/intense music ducked to ~0.15 volume bed |
| **Success** | Ambient fades out, music restores, then one-shot success SFX |
| **Fail** | Ambient fades out, music restores, then one-shot fail SFX (hazard-immediate events omit fail audio — they cannot time out) |

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

// Looping ambient tracks (duck gameplay/intense music while active)
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
private eventSfxSounds: Record<string, Howl> = {}
private eventAmbientSounds: Record<string, Howl> = {}
private activeEventAmbientKey: string | null = null
private ambientDuckingActive: boolean = false
// MUSIC_BED_VOLUME = 0.15 already exists (used by crossfadeToIntense)
```

### New public methods

#### `playEventSfx(key: string): void`
- Plays a one-shot event SFX from the `eventSfxSounds` pool
- Respects `_sfxMuted`
- **Does NOT use `sfxThrottles`** — event stings are already rate-limited by gameplay; throttling would crash because `EVENT_SFX` is a separate map from `SFX` and the existing throttle reads `SFX[name].volume`
- Applies volume as `EVENT_SFX[key].volume * sfxVolume * masterVolume`

#### `startEventAmbient(key: string): void`
- Determines which music track to duck: if `intenseMixActive` is true, duck the intense track; otherwise duck the gameplay track
- Fades the target track down to `MUSIC_BED_VOLUME` (0.15) over 500ms
- Starts looping ambient Howl with 500ms fade-in at `EVENT_AMBIENT[key].volume * musicVolume * masterVolume`
- Sets `activeEventAmbientKey = key` and `ambientDuckingActive = true`

#### `stopEventAmbient(): void`
- **No-ops if `activeEventAmbientKey` is null** — safe to call multiple times (e.g. game end during post-resolution 1500ms window)
- Fades out active ambient over 500ms
- Restores music: if `intenseMixActive`, restore intense track to its full volume; otherwise restore gameplay track to full `musicVolume * masterVolume`
- Clears `activeEventAmbientKey = null` and `ambientDuckingActive = false`

### Volume change guard

`setMusicVolume()` must check `ambientDuckingActive`. When ducking is active, music tracks receive `MUSIC_BED_VOLUME * newVolume * masterVolume` rather than full volume — preserving the duck state across slider adjustments.

#### `crossfadeToIntense()` — amended behaviour

The existing method fades the gameplay track from its current volume (`gameplay.volume()`) rather than from its defined full volume. This means if an event ambient is already ducking the gameplay track, the fade starts from the already-low value — the double-duck is avoided in practice.

The spec formalises this: **if `ambientDuckingActive` is true, skip fading the gameplay track entirely** — it is already at bed level. Set `intenseMixActive = true` and start the intense track as normal.

#### `stopMusic()` — amended behaviour

`stopMusic()` must reset `ambientDuckingActive = false` and `activeEventAmbientKey = null`. This ensures that if the game ends while an event is active, a subsequent game session does not start with stale ducking state on the AudioManager singleton.

### Init

`init()` adds two new loops alongside existing SFX init:
- Iterate `EVENT_SFX` → populate `eventSfxSounds` with `new Howl({ src, volume, loop: false })`
- Iterate `EVENT_AMBIENT` → populate `eventAmbientSounds` with `new Howl({ src, volume, loop: true })`

---

## useKitchenEvents Wiring

`def` is retrieved via `EVENT_DEFS.find(d => d.type === event.type)!` at each call site. This is the simplest approach — `EVENT_DEFS` is already imported in `useKitchenEvents.ts`, and each lookup is O(9). No change to the `KitchenEvent` struct or `types.ts` is needed.

```typescript
// spawnEvent() — def is already in scope as the selected EventDef
const am = getAudioManager()
am.playEventSfx(def.audio.start)
am.startEventAmbient(def.audio.ambient)

// resolveEvent(event)
const def = EVENT_DEFS.find(d => d.type === event.type)!
const am = getAudioManager()
am.stopEventAmbient()
am.playEventSfx(def.audio.success)

// failEvent(event)
const def = EVENT_DEFS.find(d => d.type === event.type)!
const am = getAudioManager()
am.stopEventAmbient()
if (def.audio.fail) am.playEventSfx(def.audio.fail)

// cleanup effect (game ends / events disabled mid-game)
getAudioManager().stopEventAmbient()  // no-ops if already stopped
```

---

## Interaction with Intense Music Mode

When `timeLeft ≤ 30s`, the game crossfades to the intense track (`intenseMixActive = true`, gameplay ducked to 0.15 bed).

- **Event starts during intense mode:** `startEventAmbient` ducks the intense track (not gameplay) to `MUSIC_BED_VOLUME`
- **Event ends during intense mode:** `stopEventAmbient` checks `intenseMixActive` and restores the intense track to full volume — gameplay track stays at bed level
- **Intense mode triggers while event is active:** `crossfadeToIntense` should check `ambientDuckingActive`; if true, only duck from the current (already-ducked) volume, not full volume — avoids an abrupt double-duck. In practice this is a very short timing window (event must be active exactly as timeLeft crosses 30s) and the bed is already 0.15, so the crossfade will be a near-no-op.

---

## Files Changed

| File | Change |
|------|--------|
| `public/audio/events/*.mp3` | 33 new audio files |
| `src/audio/audioAssets.ts` | Add `EVENT_SFX` and `EVENT_AMBIENT` exports |
| `src/audio/AudioManager.ts` | Add `eventSfxSounds`, `eventAmbientSounds`, `ambientDuckingActive`; 3 new methods; guard in `setMusicVolume`; amended `crossfadeToIntense`; amended `stopMusic`; updated `init()` |
| `src/data/kitchenEventDefs.ts` | Add `audio` field to `EventDef` interface + populate all 9 entries |
| `src/hooks/useKitchenEvents.ts` | Wire 4 call points + cleanup |

---

## Out of Scope

- No new audio settings UI — event stings respect existing SFX mute/volume; ambients respect existing music mute/volume
- No per-event audio toggle in GameOptions
