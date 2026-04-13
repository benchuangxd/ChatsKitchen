# Plan: Interactive Tutorial Round

**Branch:** `feat/tutorial-round` (already created from main)

---

## Context

The existing "tutorial" is a static text modal (TutorialModal). The goal is an **interactive in-game tutorial round** that walks players through the full cooking loop step-by-step on the actual game screen. It teaches: reading orders, cooking with dependencies, the prepared-items tray, serving, and the heat mechanic.

Recipe used: **Fries** (`!chop potato` → `!fry potato` → `!serve 1`)  
- 2 steps, 1 dependency (`chopped_potato` required before frying)  
- 2 distinct stations (cutting_board → fryer)  
- Fast: ~3.5s chop + 4.5s fry at 2× cooking speed  
- No parallel complexity — ideal for learning

---

## Architecture

### Game state for tutorial
Tutorial runs as a real game session with special params dispatched via `RESET`:
```
shiftDuration:  600_000   // 10 min — won't expire
cookingSpeed:   2         // halves cook times for faster feedback
orderSpeed:     0.05      // 20× patience — orders never expire
orderSpawnRate: 0.001     // effectively disables auto-spawn (interval = 13M ms); first order still spawns after 2s
enabledRecipes: ['fries']
```
The first order (always fries) auto-spawns 2 seconds after game starts via the existing `firstOrderSpawned` logic in `useGameLoop`.

### Tutorial state (App.tsx only)
```
tutorialStep: number | null   // null = not in tutorial; 0–10 = step index
isTutorial = tutorialStep !== null
```
This is UI state only — no changes to `GameState` or `types.ts`.

### Highlight system
Each highlighted component receives an `isHighlighted: boolean` prop. When true, a CSS `outline` (not `box-shadow` — avoids `overflow:hidden` clipping) creates a pulsing gold border. No DOM measurements needed.

Components that accept `isHighlighted`:
- `DiningRoom` — highlights the orders panel
- `PreparedItems` — highlights the ingredient tray
- `Station` — highlights an individual station

`Kitchen` accepts `tutorialHighlight: string | null` and distributes it to its children.

### Overlay structure
`TutorialOverlay` is `position: fixed; inset: 0; pointer-events: none`. It renders:
1. **Backdrop**: `rgba(0,0,0,0.45)` full-screen dim (pointer-events: none)
2. **Card**: Centered bottom (`bottom: 60px`), `pointer-events: all`. Contains: step counter, title, body, optional `commandHint` (copyable code block), action buttons (Next / Skip Tutorial, or Finish)
3. **Auto-advance**: `useEffect` on `state` prop; when `step.advanceCondition(state)` returns true, calls `onNext()`

---

## Tutorial Steps (11 total, index 0–10)

| # | Title | Highlight | Advance |
|---|-------|-----------|---------|
| 0 | Welcome to the Kitchen! | none | button |
| 1 | 📋 Orders | orders | button |
| 2 | Tonight's dish: Fries! | orders | button |
| 3 | 🍳 Stations | none | button |
| 4 | Step 1 — Chop the potato | cutting_board | auto: slot appears or chopped_potato in tray |
| 5 | Chopping in progress… | cutting_board | auto: chopped_potato in preparedItems |
| 6 | 🥘 Prepared Ingredients | prepared | button |
| 7 | Step 2 — Fry the potato | fryer | auto: fry slot appears or fried_potato in tray |
| 8 | Frying in progress… | fryer | auto: fried_potato in preparedItems |
| 9 | 🍟 Serve the order! | orders | auto: fries order has outcome 'served' |
| 10 | Great work! 🎉 | none | finish button → menu |

Steps 4, 7, 9 show a `commandHint` (`!chop potato`, `!fry potato`, `!serve 1`). Steps 5 and 8 show no hint (just watch and wait).

---

## Entry Points

**TutorialPrompt** (shown before first Free Play):
- Add `onStartTutorial` prop
- "Play Tutorial" (primary) → `onStartTutorial()`
- "Skip" (was "No") → `onNo()`
- "Don't Show Again" unchanged

**MainMenu**:
- Add `onStartTutorial` prop
- Add a secondary button (alongside "How To Play") labelled "Tutorial"

**After tutorial completes**: call `onComplete` → `setTutorialStep(null)` + `setScreen('menu')`  
**Skip tutorial**: same as complete

---

## Files

### New files
- `src/data/tutorialData.ts` — `TutorialStep` interface + `TUTORIAL_STEPS` array
- `src/components/TutorialOverlay.tsx` — overlay component
- `src/components/TutorialOverlay.module.css` — overlay styles

### Modified files
- `src/App.tsx` — tutorial state, `startTutorial` callback, overlay rendering, highlight prop wiring
- `src/components/TutorialPrompt.tsx` — add `onStartTutorial` prop + "Play Tutorial" button
- `src/components/MainMenu.tsx` — add `onStartTutorial` prop + "Tutorial" button
- `src/components/DiningRoom.tsx` — add `isHighlighted?: boolean` prop, apply `.highlighted` class to `.dining`
- `src/components/DiningRoom.module.css` — add `.highlighted` + `@keyframes tutorialPulse`
- `src/components/Kitchen.tsx` — add `tutorialHighlight?: string | null` prop, thread to children
- `src/components/PreparedItems.tsx` — add `isHighlighted?: boolean` prop, apply `.highlighted` class to `.prep`
- `src/components/PreparedItems.module.css` — add `.highlighted`
- `src/components/Station.tsx` — add `isHighlighted?: boolean` prop, apply `.highlighted` class to `.station`
- `src/components/Station.module.css` — add `.highlighted` + animation

---

## Step 1 — Tutorial data (`src/data/tutorialData.ts`)

```ts
import { GameState } from '../state/types'

export interface TutorialStep {
  title: string
  body: string
  highlight: 'none' | 'orders' | 'cutting_board' | 'fryer' | 'prepared'
  advanceMode: 'button' | 'auto'
  advanceCondition?: (state: GameState) => boolean
  commandHint?: string
}

export const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: "Welcome to the Kitchen! 👨‍🍳",
    body: "You're the chef — your Twitch chat is your kitchen crew. Together you'll cook dishes and fill orders before time runs out. Let's learn with a simple dish: Fries!",
    highlight: 'none',
    advanceMode: 'button',
  },
  {
    title: "📋 Orders",
    body: "The left panel shows active orders. Each ticket has an order number and a patience bar. If the bar runs out before you serve the dish, the order is lost!",
    highlight: 'orders',
    advanceMode: 'button',
  },
  {
    title: "Tonight's dish: Fries! 🍟",
    body: "A customer ordered Fries. To make them:\n① !chop potato  (adds chopped potato to the tray)\n② !fry potato  (needs the chopped potato first — look for the → in recipes)\nThen serve the order.",
    highlight: 'orders',
    advanceMode: 'button',
  },
  {
    title: "🍳 Stations",
    body: "The centre panel is your kitchen. Each station handles different actions — the Chopping Board preps ingredients, the Fryer cooks in oil. Only one station at a time per player.",
    highlight: 'none',
    advanceMode: 'button',
  },
  {
    title: "Step 1 — Chop the potato 🔪",
    body: "Type the command below in the chat box and press Enter.",
    highlight: 'cutting_board',
    advanceMode: 'auto',
    commandHint: '!chop potato',
    advanceCondition: (state) =>
      (state.stations['cutting_board']?.slots.some(s => s.target === 'potato') ?? false) ||
      state.preparedItems.includes('chopped_potato'),
  },
  {
    title: "Chopping in progress…",
    body: "Watch the progress bar fill up. In a real game, multiple players can prep different ingredients simultaneously — coordination is key!",
    highlight: 'cutting_board',
    advanceMode: 'auto',
    advanceCondition: (state) => state.preparedItems.includes('chopped_potato'),
  },
  {
    title: "🥘 Prepared Ingredients",
    body: "Finished ingredients appear in the tray at the top of the kitchen. The chopped potato is ready — it can now be used in the next step.",
    highlight: 'prepared',
    advanceMode: 'button',
  },
  {
    title: "Step 2 — Fry the potato 🫕",
    body: "The fryer needs the chopped potato first (the → arrow in recipes means this). Type:",
    highlight: 'fryer',
    advanceMode: 'auto',
    commandHint: '!fry potato',
    advanceCondition: (state) =>
      (state.stations['fryer']?.slots.some(s => s.target === 'potato') ?? false) ||
      state.preparedItems.includes('fried_potato'),
  },
  {
    title: "Frying in progress…",
    body: "When done, the fried potato appears in the tray and the order is ready to serve.",
    highlight: 'fryer',
    advanceMode: 'auto',
    advanceCondition: (state) => state.preparedItems.includes('fried_potato'),
  },
  {
    title: "🍟 Serve the order!",
    body: "All ingredients are in the tray! Serve order #1 by typing:",
    highlight: 'orders',
    advanceMode: 'auto',
    commandHint: '!serve 1',
    advanceCondition: (state) =>
      state.orders.some(o => o.dish === 'fries' && o.served),
  },
  {
    title: "Order served! 🎉",
    body: "You completed your first order! In real play, your entire Twitch chat types commands together. The more you coordinate across stations, the more you earn before time runs out. Good luck, chef!",
    highlight: 'none',
    advanceMode: 'button',
  },
]
```

---

## Step 2 — Highlight CSS (Station, PreparedItems, DiningRoom)

### `Station.module.css` — add at bottom:
```css
.highlighted {
  outline: 3px solid #f0c850;
  outline-offset: 3px;
  animation: tutorialPulse 1.4s ease-in-out infinite;
}

@keyframes tutorialPulse {
  0%, 100% { outline-color: #f0c850; }
  50%       { outline-color: rgba(240, 200, 80, 0.35); }
}
```

### `PreparedItems.module.css` — add at bottom (same CSS, class `.highlighted` on `.prep`)
### `DiningRoom.module.css` — add at bottom (same CSS, class `.highlighted` on `.dining`)

---

## Step 3 — Component prop additions (small, additive changes)

### `Station.tsx`
- Add `isHighlighted?: boolean` to Props
- Apply `${isHighlighted ? styles.highlighted : ''}` to the root `.station` div

### `PreparedItems.tsx`
- Add `isHighlighted?: boolean` to Props
- Apply `${isHighlighted ? styles.highlighted : ''}` to the root `.prep` div

### `DiningRoom.tsx`
- Add `isHighlighted?: boolean` to Props
- Apply `${isHighlighted ? styles.highlighted : ''}` to the root `.dining` div

### `Kitchen.tsx`
- Add `tutorialHighlight?: string | null` to Props
- Pass `isHighlighted={tutorialHighlight === 'prepared'}` to `<PreparedItems>`
- Pass `isHighlighted={tutorialHighlight === id}` to each `<Station>` (highlights by station id)

---

## Step 4 — `TutorialOverlay.tsx`

```tsx
import { useEffect } from 'react'
import { GameState } from '../state/types'
import { TUTORIAL_STEPS } from '../data/tutorialData'
import styles from './TutorialOverlay.module.css'

interface Props {
  stepIndex: number
  state: GameState
  onNext: () => void
  onSkip: () => void
}

export default function TutorialOverlay({ stepIndex, state, onNext, onSkip }: Props) {
  const step = TUTORIAL_STEPS[stepIndex]
  const isLast = stepIndex === TUTORIAL_STEPS.length - 1

  // Auto-advance
  useEffect(() => {
    if (step.advanceMode === 'auto' && step.advanceCondition?.(state)) {
      onNext()
    }
  }, [state, step, onNext])

  return (
    <div className={styles.overlay}>
      <div className={styles.card}>
        <div className={styles.stepCounter}>{stepIndex + 1} / {TUTORIAL_STEPS.length}</div>
        <div className={styles.title}>{step.title}</div>
        <div className={styles.body}>{step.body}</div>
        {step.commandHint && (
          <div className={styles.commandHint}>
            <code>{step.commandHint}</code>
          </div>
        )}
        <div className={styles.actions}>
          {!isLast && (
            <button className={styles.skipBtn} onClick={onSkip}>Skip Tutorial</button>
          )}
          {step.advanceMode === 'button' && (
            <button className={styles.nextBtn} onClick={isLast ? onSkip : onNext}>
              {isLast ? 'Start Playing!' : 'Next →'}
            </button>
          )}
          {step.advanceMode === 'auto' && !isLast && (
            <span className={styles.waitingHint}>Waiting for action…</span>
          )}
        </div>
      </div>
    </div>
  )
}
```

### `TutorialOverlay.module.css`
```css
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  z-index: 500;
  pointer-events: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 60px;
}

.card {
  pointer-events: all;
  background: var(--station-bg);
  border: 2px solid #f0c850;
  border-radius: 14px;
  padding: 18px 24px;
  max-width: 480px;
  width: 100%;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.75), 0 0 30px rgba(240, 200, 80, 0.15);
}

.stepCounter {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  margin-bottom: 6px;
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.title {
  font-family: 'Lilita One', cursive;
  font-size: 20px;
  color: #f0c850;
  margin-bottom: 8px;
}

.body {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  color: var(--text-dim);
  line-height: 1.5;
  white-space: pre-line;
  margin-bottom: 12px;
}

.commandHint {
  background: rgba(240, 200, 80, 0.08);
  border: 1px solid rgba(240, 200, 80, 0.3);
  border-radius: 8px;
  padding: 8px 14px;
  margin-bottom: 14px;
  text-align: center;
}

.commandHint code {
  font-family: 'Space Mono', monospace;
  font-size: 20px;
  color: #f0c850;
  font-weight: 700;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
  justify-content: flex-end;
}

.nextBtn {
  font-family: 'Lilita One', cursive;
  font-size: 16px;
  background: #f0c850;
  color: #1c1917;
  border: none;
  border-radius: 8px;
  padding: 8px 20px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.nextBtn:hover { opacity: 0.85; }

.skipBtn {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  background: none;
  color: var(--text-muted);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 6px 12px;
  cursor: pointer;
  transition: color 0.15s;
}

.skipBtn:hover { color: var(--text-secondary); }

.waitingHint {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
  font-style: italic;
  margin-right: auto;
}
```

---

## Step 5 — App.tsx changes

### New state
```ts
const [tutorialStep, setTutorialStep] = useState<number | null>(null)
const isTutorial = tutorialStep !== null
```

### `startTutorial` callback
```ts
const startTutorial = useCallback(() => {
  dispatch({
    type: 'RESET',
    shiftDuration: 600_000,
    cookingSpeed: 2,
    orderSpeed: 0.05,
    orderSpawnRate: 0.001,
    stationCapacity: { chopping: 3, cooking: 2 },
    restrictSlots: false,
    enabledRecipes: ['fries'],
  })
  setShowTutorialPrompt(false)
  setTutorialOpen(false)
  setTutorialStep(0)
  setChatOpen(true)
  setScreen('playing')
}, [dispatch])
```

### Tutorial-aware game-over handler
Pass to `useGameLoop`:
```ts
useGameLoop(
  state,
  dispatch,
  isPlaying ? (isTutorial ? () => { setTutorialStep(null); setScreen('menu') } : handleGameOver) : undefined,
  paused
)
```
(memoize with useCallback to avoid re-creating on every render)

### Tutorial step handlers
```ts
const handleTutorialNext = useCallback(() => {
  setTutorialStep(s => (s !== null && s < TUTORIAL_STEPS.length - 1 ? s + 1 : s))
}, [])

const handleTutorialComplete = useCallback(() => {
  setTutorialStep(null)
  setScreen('menu')
}, [])
```

### TutorialOverlay rendering (inside the `playing` screen block):
```tsx
{isTutorial && tutorialStep !== null && (
  <TutorialOverlay
    stepIndex={tutorialStep}
    state={state}
    onNext={handleTutorialNext}
    onSkip={handleTutorialComplete}
  />
)}
```

### Pass highlight props to playing screen:
```tsx
const tutorialHighlight = isTutorial && tutorialStep !== null
  ? TUTORIAL_STEPS[tutorialStep].highlight
  : null

// Pass tutorialHighlight to Kitchen:
<Kitchen state={state} tutorialHighlight={tutorialHighlight} />

// Pass isHighlighted to DiningRoom:
<OrdersBar state={state} isHighlighted={tutorialHighlight === 'orders'} />
```

### Wire `startTutorial` to entry points:
- Pass `onStartTutorial={startTutorial}` to `<MainMenu>`
- Pass `onStartTutorial={startTutorial}` to `<TutorialPrompt>` (replacing `onYes` which previously opened the text modal)
- Update `TutorialPrompt`'s `onYes` → rename `onStartTutorial` in the Prompt component

---

## Step 6 — Entry point components

### `TutorialPrompt.tsx`
- Replace `onYes` prop with `onStartTutorial`
- Rename button: "Play Tutorial" (primary)
- "Skip" (was "No")
- Keep "Don't Show Again"
- Update header text: "New to ChatsKitchen?"
- Body: "Jump into a guided tutorial round to learn the basics — it only takes 2 minutes."

### `MainMenu.tsx`
- Add `onStartTutorial: () => void` to Props
- Add a secondary-style "Tutorial" button next to the existing "How To Play" button (same row in `.modeBottomRow`)

---

## Verification

1. `npm run dev`
2. Click "How To Play" on main menu → text guide still opens (unchanged)
3. Click "Tutorial" on main menu → game starts with fries only, tutorial overlay appears
4. Step 0: Welcome card visible, game screen dimmed, Next button works
5. Step 1 & 2: Orders panel has gold pulse outline
6. Step 4: Cutting board has gold outline, type `!chop potato` → overlay advances to step 5
7. Step 5: Auto-advances when chop completes (~3.5s)
8. Step 7: Fryer has gold outline, type `!fry potato` → advances to step 8
9. Step 8: Auto-advances when fry completes (~4.5s)
10. Step 9: Type `!serve 1` → advances to step 10
11. Step 10: "Start Playing!" returns to main menu, tutorial state cleared
12. Skip Tutorial at any step → returns to menu
13. First-time Play (when hideTutorialPrompt is false) → TutorialPrompt shows "Play Tutorial" / "Skip" / "Don't Show Again"
14. "Play Tutorial" from TutorialPrompt → starts tutorial round
15. `npm run build` — clean TypeScript, no unused-var errors
