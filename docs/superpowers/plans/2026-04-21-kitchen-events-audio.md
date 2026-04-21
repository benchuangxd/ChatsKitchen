# Kitchen Events Audio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 4-phase audio (start sting, ambient loop, success sting, fail sting) to all 9 kitchen events, with gameplay music ducking while any event is active.

**Architecture:** Event audio assets are defined in `audioAssets.ts` alongside existing `SFX`/`MUSIC_TRACKS`. `AudioManager` gains three new methods (`playEventSfx`, `startEventAmbient`, `stopEventAmbient`) and guards on `setMusicVolume`, `crossfadeToIntense`, and `stopMusic`. `kitchenEventDefs.ts` carries audio keys on each `EventDef`. `useKitchenEvents.ts` calls the four audio lifecycle points at spawn, resolve, fail, and cleanup.

**Tech Stack:** React 18, TypeScript strict, Howler.js (already installed), Vite 5. No test framework — verification is manual via `npm run dev`.

**Spec:** `docs/superpowers/specs/2026-04-21-kitchen-events-audio-design.md`

---

## File Map

| File | Change |
|------|--------|
| `public/audio/events/*.mp3` | Create — 33 new royalty-free audio files |
| `src/audio/audioAssets.ts` | Modify — append `EVENT_SFX` and `EVENT_AMBIENT` exports |
| `src/audio/AudioManager.ts` | Modify — new private state, 3 new methods, guards on 3 existing methods, updated `init()` |
| `src/data/kitchenEventDefs.ts` | Modify — `audio` field on `EventDef` interface + populate all 9 entries |
| `src/hooks/useKitchenEvents.ts` | Modify — wire 4 audio call points + cleanup |

---

## Task 1: Source and download 33 royalty-free audio files

**Files:**
- Create: `public/audio/events/` (directory + all 33 `.mp3` files)

- [ ] **Step 1: Create the events audio directory**

```bash
mkdir -p "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen/public/audio/events"
```

- [ ] **Step 2: Download all 33 files**

For each file below, use `WebSearch` to find a suitable royalty-free `.mp3` on Pixabay Sound Effects (`pixabay.com/sound-effects`) or Freesound.org (CC0 license only). Then use `curl -L -o <path> "<url>"` to download it.

Search using Playwright (browser) or WebSearch — navigate to the sound page and find the direct `.mp3` download link. Pixabay sounds are downloaded via the green Download button which resolves to a CDN URL. Freesound previews are at `https://freesound.org/data/previews/<id>/<id>_<variant>-lq.mp3`.

Target directory: `/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen/public/audio/events/`

### 🐀 Rat Invasion (4 files)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `rat_invasion-start.mp3` | `pixabay rat squeak` | Single sharp rat squeak burst, < 3s |
| `rat_invasion-ambient.mp3` | `pixabay rat scurrying loop` OR `freesound mice scurrying` | Scurrying / rustling loop, loopable |
| `rat_invasion-success.mp3` | `pixabay rats fleeing whoosh` OR `pixabay scurry away` | Rats fleeing, receding squeak, < 3s |
| `rat_invasion-fail.mp3` | `pixabay crash bang kitchen` | Kitchen crash + frantic squeaks, < 4s |

### 👨‍🍳 Angry Chef (4 files)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `angry_chef-start.mp3` | `pixabay kitchen crash clatter` | Pots clattering / crash, < 3s |
| `angry_chef-ambient.mp3` | `pixabay tense kitchen ambience loop` OR `freesound kitchen tension loop` | Tense background grumble, loopable |
| `angry_chef-success.mp3` | `pixabay crowd cheer small` OR `pixabay positive jingle` | Short relieved cheer / positive sting, < 3s |
| `angry_chef-fail.mp3` | `pixabay angry pots bang` OR `pixabay kitchen bang fail` | Pots banging angrily, < 3s |

### 🔌 Power Trip (3 files — no fail)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `power_trip-start.mp3` | `pixabay electric zap power down` OR `pixabay power outage` | Electrical zap + power-down hum, < 4s |
| `power_trip-ambient.mp3` | `pixabay electrical hum buzz loop` OR `freesound electrical hum loop` | Low electrical buzz / flicker, loopable |
| `power_trip-success.mp3` | `pixabay power on click hum` OR `pixabay electricity restore` | Power-on click + rising hum, < 3s |

### 💨 Smoke Blast (3 files — no fail)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `smoke_blast-start.mp3` | `pixabay hiss steam alarm` OR `pixabay smoke alarm sting` | Hiss + brief alarm sting, < 4s |
| `smoke_blast-ambient.mp3` | `pixabay smoke alarm loop` OR `freesound fire alarm loop` | Alarm / hissing ambient, loopable |
| `smoke_blast-success.mp3` | `pixabay ventilation fan whoosh` OR `pixabay air clear whoosh` | Ventilation whoosh + clear sound, < 3s |

### 📦 Glitched Orders (3 files — no fail)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `glitched_orders-start.mp3` | `pixabay digital glitch error` OR `pixabay data corruption` | Digital glitch / corruption burst, < 3s |
| `glitched_orders-ambient.mp3` | `pixabay digital static loop` OR `freesound glitch static loop` | Digital static / glitchy loop, loopable |
| `glitched_orders-success.mp3` | `pixabay system restore chime` OR `pixabay computer success ding` | Clean system restore chime, < 3s |

### 📢 Chef's Chant (4 files)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `chefs_chant-start.mp3` | `pixabay crowd anticipation cheer` OR `pixabay crowd building` | Crowd building / anticipation sting, < 4s |
| `chefs_chant-ambient.mp3` | `pixabay crowd chant loop` OR `freesound group chant rhythmic loop` | Building rhythmic crowd chant, loopable |
| `chefs_chant-success.mp3` | `pixabay crowd roar cheer` | Big crowd roar / triumph cheer, < 4s |
| `chefs_chant-fail.mp3` | `pixabay crowd disappointed aww` OR `pixabay crowd deflation` | Disappointed crowd groan, < 3s |

### 🧩 Mystery Recipe (4 files)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `mystery_recipe-start.mp3` | `pixabay mystery puzzle sting` OR `pixabay curious jingle` | Short mystery / puzzle sting, < 3s |
| `mystery_recipe-ambient.mp3` | `pixabay mystery ambient loop` OR `freesound thinking puzzle loop` | Curious / thinking music loop, loopable |
| `mystery_recipe-success.mp3` | `pixabay puzzle solved sparkle` OR `pixabay magic sparkle jingle` | Sparkle / solved ding, < 3s |
| `mystery_recipe-fail.mp3` | `pixabay wrong answer buzz` OR `pixabay game show wrong` | Wrong-answer buzzer, < 2s |

### ⚡ Typing Frenzy (4 files)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `typing_frenzy-start.mp3` | `pixabay electric zap excitement` OR `pixabay action sting` | Electric zap + excitement sting, < 3s |
| `typing_frenzy-ambient.mp3` | `pixabay keyboard typing fast loop` OR `freesound typing frantic loop` | Frantic keyboard typing loop, loopable |
| `typing_frenzy-success.mp3` | `pixabay triumph fanfare short` OR `pixabay cash register win` | Triumph fanfare / cash register, < 4s |
| `typing_frenzy-fail.mp3` | `pixabay fail buzzer deflation` OR `pixabay sad trombone` | Deflation buzz / sad tone, < 3s |

### 🕺 Dance (4 files)

| Filename | Search query | Character |
|----------|-------------|-----------|
| `dance-start.mp3` | `pixabay music drop intro` OR `pixabay dance music hit` | Music drop / upbeat intro sting, < 3s |
| `dance-ambient.mp3` | `pixabay upbeat funky loop` OR `freesound dance groove loop` | Upbeat funky / groovy loop, loopable |
| `dance-success.mp3` | `pixabay crowd cheer musical flourish` OR `pixabay victory jingle` | Crowd cheer + musical flourish, < 4s |
| `dance-fail.mp3` | `pixabay record scratch stop` OR `pixabay vinyl scratch` | Record scratch / abrupt stop, < 2s |

- [ ] **Step 3: Verify all 33 files exist**

```bash
ls "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen/public/audio/events/" | wc -l
# Expected: 33
ls "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen/public/audio/events/"
```

- [ ] **Step 4: Commit audio files**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
git add public/audio/events/
git commit -m "feat: add royalty-free audio assets for kitchen events"
```

---

## Task 2: Add EVENT_SFX and EVENT_AMBIENT to audioAssets.ts

**Files:**
- Modify: `src/audio/audioAssets.ts`

- [ ] **Step 1: Append the two new exports to `src/audio/audioAssets.ts`**

The existing file ends after the `SFX` export. Append the following:

```typescript
export const EVENT_SFX: Record<string, SfxDef> = {
  'event-rat-start':           { src: ['/audio/events/rat_invasion-start.mp3'],        volume: 0.7 },
  'event-rat-success':         { src: ['/audio/events/rat_invasion-success.mp3'],      volume: 0.7 },
  'event-rat-fail':            { src: ['/audio/events/rat_invasion-fail.mp3'],         volume: 0.7 },
  'event-angry-chef-start':    { src: ['/audio/events/angry_chef-start.mp3'],          volume: 0.7 },
  'event-angry-chef-success':  { src: ['/audio/events/angry_chef-success.mp3'],        volume: 0.7 },
  'event-angry-chef-fail':     { src: ['/audio/events/angry_chef-fail.mp3'],           volume: 0.7 },
  'event-power-trip-start':    { src: ['/audio/events/power_trip-start.mp3'],          volume: 0.7 },
  'event-power-trip-success':  { src: ['/audio/events/power_trip-success.mp3'],        volume: 0.7 },
  'event-smoke-blast-start':   { src: ['/audio/events/smoke_blast-start.mp3'],         volume: 0.7 },
  'event-smoke-blast-success': { src: ['/audio/events/smoke_blast-success.mp3'],       volume: 0.7 },
  'event-glitch-start':        { src: ['/audio/events/glitched_orders-start.mp3'],     volume: 0.7 },
  'event-glitch-success':      { src: ['/audio/events/glitched_orders-success.mp3'],   volume: 0.7 },
  'event-chant-start':         { src: ['/audio/events/chefs_chant-start.mp3'],         volume: 0.7 },
  'event-chant-success':       { src: ['/audio/events/chefs_chant-success.mp3'],       volume: 0.8 },
  'event-chant-fail':          { src: ['/audio/events/chefs_chant-fail.mp3'],          volume: 0.6 },
  'event-mystery-start':       { src: ['/audio/events/mystery_recipe-start.mp3'],      volume: 0.7 },
  'event-mystery-success':     { src: ['/audio/events/mystery_recipe-success.mp3'],    volume: 0.7 },
  'event-mystery-fail':        { src: ['/audio/events/mystery_recipe-fail.mp3'],       volume: 0.6 },
  'event-frenzy-start':        { src: ['/audio/events/typing_frenzy-start.mp3'],       volume: 0.7 },
  'event-frenzy-success':      { src: ['/audio/events/typing_frenzy-success.mp3'],     volume: 0.8 },
  'event-frenzy-fail':         { src: ['/audio/events/typing_frenzy-fail.mp3'],        volume: 0.6 },
  'event-dance-start':         { src: ['/audio/events/dance-start.mp3'],               volume: 0.7 },
  'event-dance-success':       { src: ['/audio/events/dance-success.mp3'],             volume: 0.8 },
  'event-dance-fail':          { src: ['/audio/events/dance-fail.mp3'],                volume: 0.6 },
}

export const EVENT_AMBIENT: Record<string, SfxDef> = {
  'event-rat-ambient':         { src: ['/audio/events/rat_invasion-ambient.mp3'],      volume: 0.4 },
  'event-angry-chef-ambient':  { src: ['/audio/events/angry_chef-ambient.mp3'],        volume: 0.35 },
  'event-power-trip-ambient':  { src: ['/audio/events/power_trip-ambient.mp3'],        volume: 0.4 },
  'event-smoke-blast-ambient': { src: ['/audio/events/smoke_blast-ambient.mp3'],       volume: 0.4 },
  'event-glitch-ambient':      { src: ['/audio/events/glitched_orders-ambient.mp3'],   volume: 0.4 },
  'event-chant-ambient':       { src: ['/audio/events/chefs_chant-ambient.mp3'],       volume: 0.45 },
  'event-mystery-ambient':     { src: ['/audio/events/mystery_recipe-ambient.mp3'],    volume: 0.35 },
  'event-frenzy-ambient':      { src: ['/audio/events/typing_frenzy-ambient.mp3'],     volume: 0.45 },
  'event-dance-ambient':       { src: ['/audio/events/dance-ambient.mp3'],             volume: 0.5 },
}
```

Note: `EVENT_AMBIENT` reuses the existing `SfxDef` interface (`{ src: string[]; volume: number; loop?: boolean }`). The `loop: true` is set on the Howl instance directly in AudioManager, not in the asset def.

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -5
# Expected: no errors
```

- [ ] **Step 3: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
git add src/audio/audioAssets.ts
git commit -m "feat: add EVENT_SFX and EVENT_AMBIENT asset definitions"
```

---

## Task 3: Update AudioManager.ts

**Files:**
- Modify: `src/audio/AudioManager.ts`

This task touches 5 locations in `AudioManager.ts`: the import line, the class private fields, `init()`, three existing methods (`stopMusic`, `crossfadeToIntense`, `setMusicVolume`), and three new methods. Make all changes, then compile once at the end.

- [ ] **Step 1: Update the import line (line 2)**

Change:
```typescript
import { MUSIC_TRACKS, SFX } from './audioAssets'
```
To:
```typescript
import { MUSIC_TRACKS, SFX, EVENT_SFX, EVENT_AMBIENT } from './audioAssets'
```

- [ ] **Step 2: Add four private fields after `private sfxThrottles` (line 13)**

After the line `private sfxThrottles: Record<string, number> = {}`, add:
```typescript
  private eventSfxSounds: Record<string, Howl> = {}
  private eventAmbientSounds: Record<string, Howl> = {}
  private activeEventAmbientKey: string | null = null
  private ambientDuckingActive = false
```

- [ ] **Step 3: Extend `init()` — add two new loops after the existing SFX loop**

After the closing brace of the `for (const [name, def] of Object.entries(SFX))` loop, add:

```typescript
    for (const [name, def] of Object.entries(EVENT_SFX)) {
      this.eventSfxSounds[name] = new Howl({
        src: def.src,
        volume: def.volume * this.sfxVolume,
        loop: false,
        preload: true,
      })
    }

    for (const [name, def] of Object.entries(EVENT_AMBIENT)) {
      this.eventAmbientSounds[name] = new Howl({
        src: def.src,
        volume: def.volume * this.musicVolume,
        loop: true,
        preload: true,
      })
    }
```

- [ ] **Step 4: Amend `stopMusic()` — reset ambient state on game end**

Replace the existing `stopMusic()` body:
```typescript
  stopMusic() {
    this.init()
    for (const howl of Object.values(this.musicTracks)) {
      howl.stop()
    }
    this.intenseMixActive = false
    this.currentMusicName = null
  }
```
With:
```typescript
  stopMusic() {
    this.init()
    for (const howl of Object.values(this.musicTracks)) {
      howl.stop()
    }
    if (this.activeEventAmbientKey) {
      const ambient = this.eventAmbientSounds[this.activeEventAmbientKey]
      if (ambient) ambient.stop()
    }
    this.intenseMixActive = false
    this.currentMusicName = null
    this.ambientDuckingActive = false
    this.activeEventAmbientKey = null
  }
```

- [ ] **Step 5: Amend `crossfadeToIntense()` — skip gameplay duck if ambient already ducking**

Replace the comment + fade at the bottom of `crossfadeToIntense()`:
```typescript
    // Fade gameplay down to a bed
    const gpVol = gameplay.volume() as number
    gameplay.fade(gpVol, 0.15 * this.musicVolume, 2000)
```
With:
```typescript
    // Fade gameplay down to a bed (skip if ambient is already ducking it)
    if (!this.ambientDuckingActive) {
      const gpVol = gameplay.volume() as number
      gameplay.fade(gpVol, 0.15 * this.musicVolume * this.masterVolume, 2000)
    }
```

- [ ] **Step 6: Amend `setMusicVolume()` — preserve duck state across slider changes**

Replace the existing `setMusicVolume()`:
```typescript
  setMusicVolume(v: number) {
    this.musicVolume = v
    const effective = v * this.masterVolume
    // Update currently playing music
    if (this.intenseMixActive) {
      const gameplay = this.musicTracks['gameplay']
      const intense = this.musicTracks['intense']
      if (gameplay?.playing()) gameplay.volume(0.15 * effective)
      if (intense?.playing()) intense.volume(MUSIC_TRACKS['intense'].volume * effective)
    } else if (this.currentMusicName) {
      const current = this.musicTracks[this.currentMusicName]
      if (current?.playing()) {
        current.volume(MUSIC_TRACKS[this.currentMusicName].volume * effective)
      }
    }
  }
```
With:
```typescript
  setMusicVolume(v: number) {
    this.musicVolume = v
    const effective = v * this.masterVolume
    if (this.intenseMixActive) {
      const gameplay = this.musicTracks['gameplay']
      const intense = this.musicTracks['intense']
      if (gameplay?.playing()) gameplay.volume(0.15 * effective)
      // Keep intense at bed volume if ambient is ducking it
      if (intense?.playing()) {
        intense.volume(this.ambientDuckingActive
          ? 0.15 * effective
          : MUSIC_TRACKS['intense'].volume * effective)
      }
    } else if (this.currentMusicName) {
      const current = this.musicTracks[this.currentMusicName]
      if (current?.playing()) {
        current.volume(this.ambientDuckingActive
          ? 0.15 * effective
          : MUSIC_TRACKS[this.currentMusicName].volume * effective)
      }
    }
    // Also update active ambient volume
    if (this.activeEventAmbientKey) {
      const ambient = this.eventAmbientSounds[this.activeEventAmbientKey]
      const def = EVENT_AMBIENT[this.activeEventAmbientKey]
      if (ambient?.playing() && def) ambient.volume(def.volume * effective)
    }
  }
```

- [ ] **Step 7: Add three new public methods before `setMasterVolume`**

Insert the following three methods before the existing `setMasterVolume(v: number)` method:

```typescript
  playEventSfx(key: string) {
    if (this._sfxMuted) return
    this.init()
    const sound = this.eventSfxSounds[key]
    const def = EVENT_SFX[key]
    if (!sound || !def) return
    sound.volume(def.volume * this.sfxVolume * this.masterVolume)
    sound.play()
  }

  startEventAmbient(key: string) {
    this.init()
    const def = EVENT_AMBIENT[key]
    const ambient = this.eventAmbientSounds[key]
    if (!def || !ambient) return

    // Duck whichever music track is currently prominent
    if (this.intenseMixActive) {
      const intense = this.musicTracks['intense']
      if (intense?.playing()) {
        const vol = intense.volume() as number
        intense.fade(vol, 0.15 * this.musicVolume * this.masterVolume, 500)
      }
    } else if (this.currentMusicName) {
      const current = this.musicTracks[this.currentMusicName]
      if (current?.playing()) {
        const vol = current.volume() as number
        current.fade(vol, 0.15 * this.musicVolume * this.masterVolume, 500)
      }
    }

    // Fade in ambient loop
    const targetVol = def.volume * this.musicVolume * this.masterVolume
    ambient.volume(0)
    ambient.play()
    ambient.fade(0, targetVol, 500)

    this.activeEventAmbientKey = key
    this.ambientDuckingActive = true
  }

  stopEventAmbient() {
    if (!this.activeEventAmbientKey) return

    const key = this.activeEventAmbientKey
    const ambient = this.eventAmbientSounds[key]

    // Fade out ambient
    if (ambient?.playing()) {
      const vol = ambient.volume() as number
      ambient.fade(vol, 0, 500)
      setTimeout(() => ambient.stop(), 600)
    }

    // Restore ducked music track
    const restoreEffective = this.musicVolume * this.masterVolume
    if (this.intenseMixActive) {
      const intense = this.musicTracks['intense']
      if (intense?.playing()) {
        const vol = intense.volume() as number
        intense.fade(vol, MUSIC_TRACKS['intense'].volume * restoreEffective, 800)
      }
    } else if (this.currentMusicName) {
      const current = this.musicTracks[this.currentMusicName]
      if (current?.playing()) {
        const vol = current.volume() as number
        current.fade(vol, MUSIC_TRACKS[this.currentMusicName].volume * restoreEffective, 800)
      }
    }

    this.activeEventAmbientKey = null
    this.ambientDuckingActive = false
  }
```

- [ ] **Step 8: Verify TypeScript compiles**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -10
# Expected: no type errors
```

- [ ] **Step 9: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
git add src/audio/AudioManager.ts
git commit -m "feat: add event audio methods and ducking logic to AudioManager"
```

---

## Task 4: Add audio field to EventDef and populate all 9 entries

**Files:**
- Modify: `src/data/kitchenEventDefs.ts`

- [ ] **Step 1: Add `audio` field to the `EventDef` interface**

The current interface (lines 25–33) is:
```typescript
export interface EventDef {
  type: EventType
  category: EventCategory
  emoji: string
  label: string
  commandPool: string[]
  failDescription?: string
  rewardDescription?: string
}
```

Replace with:
```typescript
export interface EventDef {
  type: EventType
  category: EventCategory
  emoji: string
  label: string
  commandPool: string[]
  failDescription?: string
  rewardDescription?: string
  audio: {
    start: string
    ambient: string
    success: string
    fail?: string
  }
}
```

- [ ] **Step 2: Add `audio` block to each of the 9 EVENT_DEFS entries**

Add an `audio` property to each entry. The complete updated `EVENT_DEFS` array:

```typescript
export const EVENT_DEFS: EventDef[] = [
  {
    type: 'rat_invasion',
    category: 'hazard-penalty',
    emoji: '🐀',
    label: 'Rat Invasion',
    commandPool: ['SHOO SHOO SHOO', 'CHASE CHASE CHASE', 'BEGONE BEGONE BEGONE'],
    failDescription: 'Fail: lose prepped ingredients',
    audio: {
      start:   'event-rat-start',
      ambient: 'event-rat-ambient',
      success: 'event-rat-success',
      fail:    'event-rat-fail',
    },
  },
  {
    type: 'angry_chef',
    category: 'hazard-penalty',
    emoji: '👨‍🍳',
    label: 'Angry Chef',
    commandPool: ['SORRY CHEF', 'APOLOGIES CHEF', 'MY BAD CHEF'],
    failDescription: 'Fail: cooking speed debuff for 15s',
    audio: {
      start:   'event-angry-chef-start',
      ambient: 'event-angry-chef-ambient',
      success: 'event-angry-chef-success',
      fail:    'event-angry-chef-fail',
    },
  },
  {
    type: 'power_trip',
    category: 'hazard-immediate',
    emoji: '🔌',
    label: 'Power Trip',
    commandPool: ['RESET', 'REBOOT', 'RESTART'],
    failDescription: 'Stations are offline until resolved',
    audio: {
      start:   'event-power-trip-start',
      ambient: 'event-power-trip-ambient',
      success: 'event-power-trip-success',
    },
  },
  {
    type: 'smoke_blast',
    category: 'hazard-immediate',
    emoji: '💨',
    label: 'Smoke Blast',
    commandPool: ['CLEAR', 'VENTILATE', 'BLOW'],
    failDescription: 'Kitchen is obscured until resolved',
    audio: {
      start:   'event-smoke-blast-start',
      ambient: 'event-smoke-blast-ambient',
      success: 'event-smoke-blast-success',
    },
  },
  {
    type: 'glitched_orders',
    category: 'hazard-immediate',
    emoji: '📦',
    label: 'Glitched Orders',
    commandPool: ['FIX', 'DEBUG', 'PATCH'],
    failDescription: 'Orders scrambled until resolved',
    audio: {
      start:   'event-glitch-start',
      ambient: 'event-glitch-ambient',
      success: 'event-glitch-success',
    },
  },
  {
    type: 'chefs_chant',
    category: 'opportunity',
    emoji: '📢',
    label: "Chef's Chant",
    commandPool: ['YES CHEF', 'AYE CHEF', 'OF COURSE CHEF'],
    rewardDescription: 'Reward: cooking speed boost for 20s',
    audio: {
      start:   'event-chant-start',
      ambient: 'event-chant-ambient',
      success: 'event-chant-success',
      fail:    'event-chant-fail',
    },
  },
  {
    type: 'mystery_recipe',
    category: 'opportunity',
    emoji: '🧩',
    label: 'Mystery Recipe',
    commandPool: [],
    rewardDescription: 'Reward: 3 free prepped ingredients',
    audio: {
      start:   'event-mystery-start',
      ambient: 'event-mystery-ambient',
      success: 'event-mystery-success',
      fail:    'event-mystery-fail',
    },
  },
  {
    type: 'typing_frenzy',
    category: 'opportunity',
    emoji: '⚡',
    label: 'Typing Frenzy',
    commandPool: [],
    rewardDescription: 'Reward: money multiplier × 1.5 for 20s',
    audio: {
      start:   'event-frenzy-start',
      ambient: 'event-frenzy-ambient',
      success: 'event-frenzy-success',
      fail:    'event-frenzy-fail',
    },
  },
  {
    type: 'dance',
    category: 'opportunity',
    emoji: '🕺',
    label: 'Dance',
    commandPool: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
    rewardDescription: 'Reward: all orders +15s patience',
    audio: {
      start:   'event-dance-start',
      ambient: 'event-dance-ambient',
      success: 'event-dance-success',
      fail:    'event-dance-fail',
    },
  },
]
```

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -10
# Expected: no errors — TypeScript will enforce audio field on all EventDef entries
```

- [ ] **Step 4: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
git add src/data/kitchenEventDefs.ts
git commit -m "feat: add audio field to EventDef and populate all 9 event entries"
```

---

## Task 5: Wire audio into useKitchenEvents.ts

**Files:**
- Modify: `src/hooks/useKitchenEvents.ts`

- [ ] **Step 1: Add AudioManager import**

After the existing imports at the top of the file, add:
```typescript
import { getAudioManager } from '../audio/AudioManager'
```

- [ ] **Step 2: Wire audio at event spawn — end of `spawnEvent()`**

In `spawnEvent()`, the last two lines before the closing brace are:
```typescript
    concludingEventIdRef.current = null
    setActiveEvent(event)
```

Add audio calls after `setActiveEvent(event)`:
```typescript
    concludingEventIdRef.current = null
    setActiveEvent(event)

    const am = getAudioManager()
    am.playEventSfx(def.audio.start)
    am.startEventAmbient(def.audio.ambient)
```

- [ ] **Step 3: Wire audio at event resolve — start of `resolveEvent()`**

In `resolveEvent()`, find the section after all game-state dispatches but before `setActiveEvent`. The last dispatch before setActiveEvent is the `dance` block:
```typescript
    if (event.type === 'dance') {
      dispatch({ type: 'EXTEND_ORDER_PATIENCE', ms: DANCE_PATIENCE_BONUS_MS })
    }

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, resolved: true, progress: 100 } : prev)
```

Add audio calls between the dance block and `setActiveEvent`:
```typescript
    if (event.type === 'dance') {
      dispatch({ type: 'EXTEND_ORDER_PATIENCE', ms: DANCE_PATIENCE_BONUS_MS })
    }

    const def = EVENT_DEFS.find(d => d.type === event.type)!
    const am = getAudioManager()
    am.stopEventAmbient()
    setTimeout(() => am.playEventSfx(def.audio.success), 500)

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, resolved: true, progress: 100 } : prev)
```

- [ ] **Step 4: Wire audio at event fail — start of `failEvent()`**

In `failEvent()`, add audio calls after the angry_chef block and before `setActiveEvent`:
```typescript
    if (event.type === 'angry_chef') {
      dispatch({ type: 'SET_COOKING_SPEED_MODIFIER', multiplier: ANGRY_CHEF_DEBUFF_MULTIPLIER, expiresAt: now + ANGRY_CHEF_DEBUFF_DURATION_MS })
      dispatch({ type: 'ADD_CHAT', username: 'KITCHEN', text: `👨‍🍳 Chef is angry! Cooking speed reduced for 15s!`, msgType: 'error' })
    }

    const def = EVENT_DEFS.find(d => d.type === event.type)!
    const am = getAudioManager()
    am.stopEventAmbient()
    if (def.audio.fail) setTimeout(() => am.playEventSfx(def.audio.fail!), 500)

    setActiveEvent(prev => prev?.id === event.id ? { ...prev, failed: true } : prev)
```

- [ ] **Step 5: Wire audio at cleanup — inside the `!active` effect**

In the cleanup `useEffect` (lines 284–294), add `getAudioManager().stopEventAmbient()` after `setActiveEvent(null)`:

```typescript
  useEffect(() => {
    if (!active) {
      const ev = activeEventRef.current
      if (ev?.type === 'power_trip' && ev.payload.disabledStations) {
        dispatch({ type: 'ENABLE_STATIONS', stationIds: ev.payload.disabledStations })
      }
      setActiveEvent(null)
      getAudioManager().stopEventAmbient()
      spawnTimerRef.current = 0
      concludingEventIdRef.current = null
    }
  }, [active, dispatch])
```

- [ ] **Step 6: Verify TypeScript compiles cleanly**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -10
# Expected: no errors
```

- [ ] **Step 7: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen"
git add src/hooks/useKitchenEvents.ts
git commit -m "feat: wire kitchen event audio at spawn, resolve, fail, and cleanup"
```

---

## Task 6: Manual verification

- [ ] **Step 1: Start the dev server**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run dev
```

Open `http://localhost:5173` in a browser. Start a Free Play game with kitchen events enabled and spawn interval set to 5s min / 10s max (for fast testing).

- [ ] **Step 2: Verify event audio lifecycle**

For each category, trigger an event and confirm:

| Check | Expected |
|-------|----------|
| Event spawns | Start sting plays; gameplay music ducks within ~500ms |
| Event active | Ambient loop plays continuously |
| Music volume slider moved during event | Ducked music stays ducked; ambient adjusts volume proportionally |
| Event resolved (type threshold commands in chat) | Ambient fades out; gameplay music restores; success sting plays |
| Event fails (let timer expire — use hazard-penalty event) | Ambient fades out; music restores; fail sting plays |
| Game ends mid-event | Ambient stops cleanly; no stale duck on next game |
| Event during intense music (wait until <30s, trigger event) | Intense music ducks; ambient plays; on resolve intense restores |

- [ ] **Step 3: Verify no console errors**

Open browser DevTools console. Confirm no `Cannot read properties of undefined` errors on any audio key lookups.

- [ ] **Step 4: Final type-check**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
# Expected: clean build, 0 errors
```
