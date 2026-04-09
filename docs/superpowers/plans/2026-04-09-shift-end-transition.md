# Shift End Transition Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a cinematic end-of-round transition — kitchen doors swing shut showing "Time's Up!", a score summary card fades in, then doors open onto the GameOver screen.

**Architecture:** New `ShiftEnd` component (mirrors `Countdown` structure) with 5 phases driven by `setTimeout`. App.tsx gains a `'shiftend'` screen state between `'playing'` and `'gameover'`; `handleGameOver` routes there instead of directly to `'gameover'`. `useGameAudio` gets a no-op case to keep gameplay music running through the transition.

**Tech Stack:** React 18, TypeScript (strict), CSS Modules, Vite 5. No test framework — verification is visual via `npm run dev`.

---

## File Map

| File | Change |
|------|--------|
| `src/components/ShiftEnd.tsx` | Create — new transition component |
| `src/components/ShiftEnd.module.css` | Create — door styles (copied from Countdown) + score card |
| `src/App.tsx` | Modify — add `'shiftend'` to Screen type, import ShiftEnd, add `handleShiftEndDone`, route `handleGameOver` → `'shiftend'`, render ShiftEnd |
| `src/audio/useGameAudio.ts` | Modify — replace local Screen type, add no-op `'shiftend'` case |

---

### Task 1: Create `ShiftEnd.module.css`

**Files:**
- Create: `src/components/ShiftEnd.module.css`

- [ ] **Step 1: Create the file with the full CSS**

The door styles are copied verbatim from `src/components/Countdown.module.css`. The inner border uses `.door::after` (pseudo-element), not a div. Score card and text animations are new.

```css
/* ── Overlay ─────────────────────────────── */
.overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: var(--bg);
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
}

.stage {
  position: absolute;
  inset: 0;
  display: flex;
  perspective: 1200px;
  z-index: 1;
}

/* ── Door panels ─────────────────────────── */
.door {
  width: 50vw;
  height: 100vh;
  position: relative;
  backface-visibility: hidden;
}

.door::after {
  content: '';
  position: absolute;
  inset: 20px;
  border: 2px solid rgba(255, 255, 255, 0.06);
  border-radius: 4px;
  pointer-events: none;
}

.doorLeft {
  background: linear-gradient(135deg, #b85a1f 0%, #8b4513 40%, #6d3410 100%);
  transform-origin: left center;
  border-right: 3px solid #5a2d0e;
  box-shadow: inset -10px 0 30px rgba(0, 0, 0, 0.3);
}

.doorRight {
  background: linear-gradient(225deg, #b85a1f 0%, #8b4513 40%, #6d3410 100%);
  transform-origin: right center;
  border-left: 3px solid #5a2d0e;
  box-shadow: inset 10px 0 30px rgba(0, 0, 0, 0.3);
}

.doorWindow {
  position: absolute;
  top: 25%;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(28, 25, 23, 0.6) 0%, rgba(28, 25, 23, 0.85) 100%);
  border: 5px solid #a0522d;
  box-shadow: inset 0 0 20px rgba(0, 0, 0, 0.5), 0 0 10px rgba(0, 0, 0, 0.3);
}

.doorLeft .doorWindow  { right: 40px; }
.doorRight .doorWindow { left: 40px; }

.doorHandle {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 14px;
  height: 70px;
  border-radius: 7px;
  background: linear-gradient(180deg, #d4a04a, #b8860b);
  box-shadow: 2px 2px 6px rgba(0, 0, 0, 0.4);
}

.doorLeft .doorHandle  { right: 20px; }
.doorRight .doorHandle { left: 20px; }

/* ── Door phase animations ── */
.doorLeft.closing  { animation: swingLeftClose  0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.doorRight.closing { animation: swingRightClose 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

.doorLeft.fading,
.doorLeft.scoring  { transform: rotateY(0deg); }
.doorRight.fading,
.doorRight.scoring { transform: rotateY(0deg); }

.doorLeft.opening  { animation: swingLeftOpen  0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }
.doorRight.opening { animation: swingRightOpen 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards; }

.doorLeft.done  { transform: rotateY(-95deg); }
.doorRight.done { transform: rotateY(95deg); }

@keyframes swingLeftClose  { 0% { transform: rotateY(-95deg); } 70% { transform: rotateY(5deg); }  100% { transform: rotateY(0deg); } }
@keyframes swingRightClose { 0% { transform: rotateY(95deg); }  70% { transform: rotateY(-5deg); } 100% { transform: rotateY(0deg); } }
@keyframes swingLeftOpen   { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(-95deg); } }
@keyframes swingRightOpen  { 0% { transform: rotateY(0deg); } 100% { transform: rotateY(95deg); } }

/* ── "Time's Up!" text ── */
.centerText {
  position: absolute;
  z-index: 10;
  font-family: 'Fredoka', sans-serif;
  font-size: 56px;
  font-weight: 700;
  text-transform: uppercase;
  color: #fff;
  -webkit-text-stroke: 2px #b87333;
  text-shadow: 3px 3px 0 #8b5a2b, 6px 6px 0 rgba(0, 0, 0, 0.3);
  pointer-events: none;
  white-space: nowrap;
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.textVisible {
  opacity: 1;
  transform: scale(1);
}

.textFading {
  opacity: 0;
  transform: scale(0.9);
}

/* ── Score card ── */
.scoreWrap {
  position: absolute;
  z-index: 10;
  pointer-events: none;
  animation: fadeInScale 0.4s ease-out both;
}

.scoreCard {
  background: #1c1814;
  border: 2px solid #f0c850;
  border-radius: 14px;
  padding: 20px 36px 18px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  text-align: center;
  box-shadow: 0 0 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(240, 200, 80, 0.12);
}

.shiftLabel {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #b0a080;
  text-transform: uppercase;
  animation: fadeInScale 0.35s ease-out 0.1s both;
}

.moneyVal {
  font-family: 'Fredoka', sans-serif;
  font-size: 64px;
  font-weight: 700;
  color: #f0c850;
  line-height: 1;
  text-shadow: 0 0 24px rgba(240, 200, 80, 0.45);
  animation: countPop 0.5s cubic-bezier(0.34, 1.3, 0.64, 1) 0.15s both;
}

.servedRow {
  display: flex;
  gap: 10px;
  animation: slideUp 0.4s ease-out 0.35s both;
}

.statPill {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  padding: 4px 13px;
  border-radius: 6px;
}

.statServed {
  background: rgba(92, 184, 92, 0.18);
  color: #5cb85c;
  border: 1px solid rgba(92, 184, 92, 0.35);
}

.statLost {
  background: rgba(217, 79, 79, 0.18);
  color: #d94f4f;
  border: 1px solid rgba(217, 79, 79, 0.35);
}

@keyframes fadeInScale {
  from { opacity: 0; transform: scale(0.82); }
  to   { opacity: 1; transform: scale(1); }
}

@keyframes countPop {
  0%   { opacity: 0; transform: scale(1.25); }
  70%  { transform: scale(0.96); }
  100% { opacity: 1; transform: scale(1); }
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(14px); }
  to   { opacity: 1; transform: translateY(0); }
}

/* ── Responsive ── */
@media (max-width: 480px) {
  .doorWindow { width: 70px; height: 70px; }
  .doorLeft .doorWindow  { right: 20px; }
  .doorRight .doorWindow { left: 20px; }
  .centerText { font-size: 36px; }
  .moneyVal   { font-size: 48px; }
}
```

- [ ] **Step 2: Verify build still passes (CSS only)**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -4
```

Expected: `✓ built in Xs`

---

### Task 2: Create `ShiftEnd.tsx`

**Files:**
- Create: `src/components/ShiftEnd.tsx`

- [ ] **Step 1: Create the component**

```tsx
import { useEffect, useState } from 'react'
import styles from './ShiftEnd.module.css'

type Phase = 'closing' | 'fading' | 'scoring' | 'opening' | 'done'

interface Props {
  money: number
  served: number
  lost: number
  onDone: () => void
}

export default function ShiftEnd({ money, served, lost, onDone }: Props) {
  const [phase, setPhase] = useState<Phase>('closing')

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase('fading'),  600),
      setTimeout(() => setPhase('scoring'), 900),
      setTimeout(() => setPhase('opening'), 2400),
      setTimeout(() => setPhase('done'),    3000),
      setTimeout(() => onDone(),            3200),
    ]
    return () => timers.forEach(clearTimeout)
  }, [onDone])

  const showTimesUp = phase === 'closing' || phase === 'fading'
  const showScore   = phase === 'scoring' || phase === 'opening' || phase === 'done'

  return (
    <div className={styles.overlay}>
      <div className={styles.stage}>
        <div className={`${styles.door} ${styles.doorLeft} ${styles[phase]}`}>
          <div className={styles.doorWindow} />
          <div className={styles.doorHandle} />
        </div>
        <div className={`${styles.door} ${styles.doorRight} ${styles[phase]}`}>
          <div className={styles.doorWindow} />
          <div className={styles.doorHandle} />
        </div>
      </div>

      {showTimesUp && (
        <div className={`${styles.centerText} ${phase === 'fading' ? styles.textFading : styles.textVisible}`}>
          Time's Up!
        </div>
      )}

      {showScore && (
        <div className={styles.scoreWrap}>
          <div className={styles.scoreCard}>
            <div className={styles.shiftLabel}>Shift earnings</div>
            <div className={styles.moneyVal}>${money}</div>
            <div className={styles.servedRow}>
              <span className={`${styles.statPill} ${styles.statServed}`}>✓ {served} served</span>
              <span className={`${styles.statPill} ${styles.statLost}`}>✗ {lost} lost</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify build and lint pass**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -4 && npm run lint 2>&1 | tail -4
```

Expected: `✓ built in Xs`, zero errors (2 pre-existing warnings in `useGameAudio.ts` are fine).

---

### Task 3: Update `useGameAudio.ts`

**Files:**
- Modify: `src/audio/useGameAudio.ts:5` — replace local Screen type
- Modify: `src/audio/useGameAudio.ts:47` — add no-op case before `'gameover'`

- [ ] **Step 1: Replace the local Screen type on line 5**

Old:
```ts
type Screen = 'menu' | 'levelselect' | 'options' | 'twitch' | 'countdown' | 'playing' | 'gameover'
```

New (removes stale `'twitch'`, adds `'shiftend'`):
```ts
type Screen = 'menu' | 'levelselect' | 'options' | 'countdown' | 'playing' | 'shiftend' | 'gameover'
```

- [ ] **Step 2: Remove the stale `case 'twitch':` fall-through line from the switch**

`useGameAudio.ts` has a `case 'twitch':` fall-through that grouped with `case 'options':`. Since `'twitch'` is no longer in the `Screen` type (removed in Step 1), this case must be deleted to avoid a TypeScript error.

Delete this line from the switch:
```ts
  case 'twitch':
```

- [ ] **Step 3: Add a no-op `'shiftend'` case in the switch (between `'playing'` and `'gameover'`)**

Do NOT copy the `'playing'` case body. Gameplay music should continue unchanged through the transition. Add only:

```ts
      case 'shiftend':
        // no audio change — gameplay music continues through the door animation
        break
```

The switch after all three edits should look like:
```ts
switch (screen) {
  case 'menu':
  case 'levelselect':
  case 'options':
    if (trackEnabled.menu) audio.playMusic('menu')
    else audio.stopMusic()
    break
  case 'countdown':
    audio.stopMusic()
    break
  case 'playing':
    if (trackEnabled.gameplay) audio.playMusic('gameplay')
    else audio.stopMusic()
    intenseFired.current = false
    frenziedFired.current = false
    prevServed.current = state.served
    prevLost.current = state.lost
    prevFireCount.current = 0
    prevCookingCount.current = 0
    prevPreparedCount.current = state.preparedItems.length
    prevOrderCount.current = state.orders.filter(o => !o.served).length
    prevMsgCount.current = state.chatMessages.length
    break
  case 'shiftend':
    // no audio change — gameplay music continues through the door animation
    break
  case 'gameover':
    audio.stopAllSfx()
    audio.stopMusic()
    if (trackEnabled.gameover) audio.playMusic('gameover')
    audio.playSfx('round-over')
    break
}
```

- [ ] **Step 4: Verify build and lint**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -4 && npm run lint 2>&1 | tail -4
```

Expected: zero errors.

---

### Task 4: Wire `ShiftEnd` into `App.tsx`

**Files:**
- Modify: `src/App.tsx`

Four edits in total.

- [ ] **Step 1: Add `'shiftend'` to the `Screen` type (line 23)**

Old:
```ts
type Screen = 'menu' | 'levelselect' | 'options' | 'countdown' | 'playing' | 'gameover'
```

New:
```ts
type Screen = 'menu' | 'levelselect' | 'options' | 'countdown' | 'playing' | 'shiftend' | 'gameover'
```

- [ ] **Step 2: Add the `ShiftEnd` import (with the other component imports, around line 11)**

```tsx
import ShiftEnd from './components/ShiftEnd'
```

- [ ] **Step 3: Change `setScreen('gameover')` to `setScreen('shiftend')` in `handleGameOver` (line 223)**

Old:
```ts
    setScreen('gameover')
```

New:
```ts
    setScreen('shiftend')
```

- [ ] **Step 4: Add `handleShiftEndDone` callback near the other `useCallback` declarations (after `handleGameOver`, around line 224)**

```tsx
  const handleShiftEndDone = useCallback(() => setScreen('gameover'), [])
```

- [ ] **Step 5: Add the `ShiftEnd` render block between the `countdown` and `gameover` cases (around line 323)**

```tsx
  } else if (screen === 'shiftend') {
    content = (
      <ShiftEnd
        money={finalStats.money}
        served={finalStats.served}
        lost={finalStats.lost}
        onDone={handleShiftEndDone}
      />
    )
  } else if (screen === 'gameover') {
```

- [ ] **Step 6: Verify build and lint**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -4 && npm run lint 2>&1 | tail -4
```

Expected: zero errors.

- [ ] **Step 7: Commit all changes**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && git add src/components/ShiftEnd.tsx src/components/ShiftEnd.module.css src/App.tsx src/audio/useGameAudio.ts && git commit -m "feat: add shift end transition with doors and score card"
```

---

### Task 5: Visual verification

**Files:** none (dev server only)

- [ ] **Step 1: Start the dev server**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run dev
```

- [ ] **Step 2: Trigger the end transition**

Start a free play game. Enable bots (settings ⚙️ → Bots: ON). Wait for the timer to hit zero, or temporarily set `shiftDuration` to a low value in OptionsScreen.

- [ ] **Step 3: Verify the 4-beat sequence**

| Beat | Expected |
|------|----------|
| ① 0–600ms | Kitchen doors swing shut with elastic bounce. "Time's Up!" in Fredoka font fades in simultaneously. |
| ② 600–900ms | Doors closed. "Time's Up!" fades out and shrinks slightly. |
| ③ 900–2400ms | Dark card with gold border fades in. Shows `$NNN`, ✓ N served, ✗ N lost. Score card stays visible as doors begin opening. |
| ④ 2400–3200ms | Doors swing open. Score card still visible as doors part. Transitions to GameOver stats screen at ~3200ms. |

- [ ] **Step 4: Verify score values match**

Confirm that `$money`, served count, and lost count on the score card match exactly what the GameOver screen shows.

- [ ] **Step 5: Verify audio**

Gameplay music (or intense/frenzied variant) continues through the transition. `round-over` SFX and gameover music start when the GameOver screen appears — not during the door animation.
