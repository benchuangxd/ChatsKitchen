# Shift End Transition — Design Spec

## Context

The shift ending is abrupt — `timeLeft` hits zero and the GameOver stats screen renders instantly. This spec adds a cinematic end transition that mirrors the round-start Countdown animation: kitchen doors swing shut, "Time's Up!" fades in, a score summary card is shown, then the doors swing open onto the GameOver screen.

---

## Approved Visual Design

Four-beat sequence (~3.2s total):

| Beat | Duration | What happens |
|------|----------|-------------|
| ① closing | 0–600ms | Doors swing shut (same elastic bounce as Countdown). "Time's Up!" text fades in simultaneously. |
| ② fading | 600–900ms | Doors fully closed. "Time's Up!" fades out. |
| ③ scoring | 900–2400ms | Score card animates in (dark card, gold border). Shows `$money`, ✓ served, ✗ lost. Holds ~1.5s. |
| ④ opening | 2400–3200ms | Doors swing open. `onDone()` fires at 3200ms → App transitions to `gameover`. |

---

## Scope

| File | Change |
|------|--------|
| `src/components/ShiftEnd.tsx` | New component — all transition logic |
| `src/components/ShiftEnd.module.css` | New CSS — door styles + score card + animations |
| `src/App.tsx` | Add `'shiftend'` to `Screen` type; change `handleGameOver` to set `'shiftend'`; add `useCallback`-wrapped `onDone`; render `ShiftEnd` |
| `src/audio/useGameAudio.ts` | Add `'shiftend'` to its local `Screen` type; handle audio for the new screen |

No changes to GameOver, Countdown, game logic, or state.

---

## Component: `ShiftEnd`

### Props
```tsx
interface Props {
  money: number
  served: number
  lost: number
  onDone: () => void
}
```

### Phase type
```tsx
type Phase = 'closing' | 'fading' | 'scoring' | 'opening' | 'done'
```

### Timer sequence
```tsx
// In useEffect (mirrors Countdown.tsx pattern):
setTimeout(() => setPhase('fading'),  600)   // doors fully closed
setTimeout(() => setPhase('scoring'), 900)   // text gone, score card in
setTimeout(() => setPhase('opening'), 2400)  // score fades, doors open
setTimeout(() => setPhase('done'),    3000)  // doors finished opening
setTimeout(() => onDone(),            3200)  // hand off to App
```

### Full TSX
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
  const showScore   = phase === 'scoring' || phase === 'opening'

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

---

## CSS: `ShiftEnd.module.css`

Door styles are identical to `Countdown.module.css`. Copy them verbatim and add score card styles.

### Phase-to-CSS mapping for doors

| Phase | `.doorLeft` | `.doorRight` |
|-------|-------------|--------------|
| `closing` | `swingLeftClose` animation | `swingRightClose` animation |
| `fading` | `rotateY(0deg)` (static closed) | `rotateY(0deg)` |
| `scoring` | `rotateY(0deg)` (static closed) | `rotateY(0deg)` |
| `opening` | `swingLeftOpen` animation | `swingRightOpen` animation |
| `done` | `rotateY(-95deg)` (static open) | `rotateY(95deg)` |

### Full CSS
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

/* ── Door panels (identical to Countdown) ── */
.door {
  width: 50vw;
  height: 100vh;
  position: relative;
  backface-visibility: hidden;
}

/* Inner inset border — pseudo-element matching Countdown.module.css exactly */
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

@keyframes swingLeftClose  { 0%{transform:rotateY(-95deg)} 70%{transform:rotateY(5deg)} 100%{transform:rotateY(0deg)} }
@keyframes swingRightClose { 0%{transform:rotateY(95deg)}  70%{transform:rotateY(-5deg)} 100%{transform:rotateY(0deg)} }
@keyframes swingLeftOpen   { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(-95deg)} }
@keyframes swingRightOpen  { 0%{transform:rotateY(0deg)} 100%{transform:rotateY(95deg)} }

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

---

## App.tsx Changes

### 1. Add `'shiftend'` to Screen type (line 23)
```tsx
// Current: 'menu' | 'levelselect' | 'options' | 'countdown' | 'playing' | 'gameover'
type Screen = 'menu' | 'levelselect' | 'options' | 'countdown' | 'playing' | 'shiftend' | 'gameover'
```

### 2. Add import
```tsx
import ShiftEnd from './components/ShiftEnd'
```

### 3. Change `handleGameOver` — replace `setScreen('gameover')` with `setScreen('shiftend')` (line 223)
```tsx
// was: setScreen('gameover')
setScreen('shiftend')
```

### 4. Stabilise `onDone` with `useCallback` and add `ShiftEnd` render block

Add a stable callback near the other `useCallback` declarations in App.tsx:
```tsx
const handleShiftEndDone = useCallback(() => setScreen('gameover'), [])
```

Then add the render block between `countdown` and `gameover` cases (around line 323):
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

Using a stable `useCallback` reference prevents the `useEffect` timer sequence inside `ShiftEnd` from restarting if App re-renders during the 3.2s transition window.

---

## `useGameAudio.ts` Changes

`src/audio/useGameAudio.ts` has its own local `Screen` type that must be **replaced in full**. The existing type still contains `'twitch'` (which is no longer in App.tsx's Screen type) and is missing `'shiftend'`.

**Replace the entire local Screen type** on line 5 of `useGameAudio.ts`:
```ts
// Replace existing local Screen type entirely — removes stale 'twitch', adds 'shiftend':
type Screen = 'menu' | 'levelselect' | 'options' | 'countdown' | 'playing' | 'shiftend' | 'gameover'
```

**Add a no-op case for `'shiftend'`** in the existing switch/if block that selects music tracks. The correct behaviour is: gameplay music keeps running through the transition — no track change, no ref resets. Do NOT copy the `'playing'` case body (which resets audio refs). Add only a bare fall-through or explicit break:
```ts
case 'shiftend':
  // no audio change — gameplay music continues through the door animation
  break
```

The existing `'gameover'` case will start the gameover music track when that screen renders after the transition completes.

---

## Verification

1. Run `npm run dev`, start a free play game
2. Let the timer run to zero — doors should swing shut with "Time's Up!" text
3. Text fades out, score card with `$money`, served, lost animates in
4. Doors swing open onto the GameOver stats screen
5. Confirm no stale state: money/served/lost on score card must match the GameOver screen values
6. Run `npm run build && npm run lint` — zero errors
