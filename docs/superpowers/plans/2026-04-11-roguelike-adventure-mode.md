# Roguelike Adventure Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 10-level star system with a roguelike run mode where each shift presents 3 random recipes and a rising money goal — the run ends when a shift fails.

**Architecture:** New `AdventureRun` state lives in `App.tsx` alongside a ref for closure safety. A new `src/data/adventureMode.ts` helper provides pure functions (goal formula, recipe picker, stat merger). Two new full-screen components (`AdventureBriefing`, `AdventureRunEnd`) follow the exact two-column layout pattern of `GameOver`. The `ShiftEnd` component gains optional adventure props with no animation changes.

**Tech Stack:** React 18 + TypeScript (strict), CSS Modules, Vite 5. No new dependencies.

---

## Context & Design Decisions

The existing `levelselect` screen, `LevelSelect.tsx`, `LevelSelect.module.css`, and `src/data/levels.ts` are **deleted** as part of this work.

| Decision | Choice |
|----------|--------|
| Between-shift briefing screen | Yes — show shift, recipes, goal |
| Difficulty scaling | Money goal only; speed stays at 1.0× |
| Recipe uniqueness | Fully random (repeats allowed) |
| Persist best run | Yes — `chatsKitchen_adventureBestRun` in localStorage |
| Shift duration | 180 000 ms (3 minutes) |

**Goal formula:** `$150 + (shift − 1) × $60` → Shift 1: $150, Shift 2: $210, Shift 10: $690

**Screen flow:**
```
menu → adventurebriefing → countdown → playing → shiftend
                               ↑ PASSED          ↓ FAILED
                         adventurebriefing    adventurerunend
```

---

## UI Design System (reference for new components)

| Token | Value |
|-------|-------|
| Screen title | `font-family: 'Lilita One', cursive; font-size: 48px; color: #fff` |
| Button primary | `background: #b87333; border-radius: 10px; font-family: 'Fredoka'; font-size: 18px; font-weight: 700` |
| Button secondary | `background: var(--border); color: var(--text); border-radius: 10px` |
| Money value | `color: #f0c850` |
| Pass / success | `color: #5cb85c` |
| Fail / danger | `color: #d94f4f` |
| Panel | `background: var(--station-bg); border: 2px solid var(--border); border-radius: 10px; padding: 16px` |
| Layout | `display: grid; grid-template-columns: 480px 1fr; height: 100%; background: var(--bg)` |
| Button hover | `transition: transform 0.1s, filter 0.1s` + `hover: scale(1.03), brightness(1.1)` |

---

## Task 1: Add new TypeScript types

**Files:**
- Modify: `src/state/types.ts`

- [ ] **Step 1: Remove `LevelProgress` and add adventure types**

  Open `src/state/types.ts`. Remove the `LevelProgress` interface (lines 74–76). Add these three interfaces at the bottom of the file:

  ```typescript
  export interface ShiftResult {
    shiftNumber: number
    recipes: string[]       // 3 recipe keys for this shift
    goalMoney: number
    moneyEarned: number
    served: number
    lost: number
    passed: boolean
  }

  export interface AdventureRun {
    currentShift: number                              // 1-based; shift being set up or played
    shiftResults: ShiftResult[]                       // completed shifts (appended after shiftend)
    currentRecipes: string[]                          // 3 recipe keys for the current shift
    currentGoal: number                               // money goal for the current shift
    accumulatedPlayerStats: Record<string, PlayerStats>
  }

  export interface AdventureBestRun {
    furthestShift: number   // shift number of the last (failed) shift
    totalMoney: number      // sum of moneyEarned across all shifts
  }
  ```

- [ ] **Step 2: Verify TypeScript compiles**

  Run: `npm run build`
  Expected: Build succeeds (may have errors from `LevelProgress` usages — that's expected and will be fixed in Task 4)

---

## Task 2: Create `src/data/adventureMode.ts`

**Files:**
- Create: `src/data/adventureMode.ts`

- [ ] **Step 1: Write the helper module**

  Create `src/data/adventureMode.ts` with the following content:

  ```typescript
  import { RECIPES } from './recipes'
  import { PlayerStats } from '../state/types'

  export const ADVENTURE_SHIFT_DURATION = 180_000   // 3 min per shift
  export const ADVENTURE_BASE_GOAL      = 150
  export const ADVENTURE_GOAL_INCREMENT = 60

  export function getAdventureGoal(shift: number): number {
    return ADVENTURE_BASE_GOAL + (shift - 1) * ADVENTURE_GOAL_INCREMENT
  }

  export function pickAdventureRecipes(): string[] {
    const keys = Object.keys(RECIPES)
    return [...keys].sort(() => Math.random() - 0.5).slice(0, 3)
  }

  export function mergePlayerStats(
    base: Record<string, PlayerStats>,
    incoming: Record<string, PlayerStats>
  ): Record<string, PlayerStats> {
    const result = { ...base }
    for (const [user, s] of Object.entries(incoming)) {
      const e = result[user] ?? {
        cooked: 0, taken: 0, served: 0,
        moneyEarned: 0, extinguished: 0, firesCaused: 0,
      }
      result[user] = {
        cooked:       e.cooked       + s.cooked,
        taken:        e.taken        + s.taken,
        served:       e.served       + s.served,
        moneyEarned:  e.moneyEarned  + s.moneyEarned,
        extinguished: e.extinguished + s.extinguished,
        firesCaused:  e.firesCaused  + s.firesCaused,
      }
    }
    return result
  }
  ```

- [ ] **Step 2: Verify it compiles**

  Run: `npm run build`
  Expected: Module compiles cleanly (ignore pre-existing LevelProgress errors for now)

---

## Task 3: Update `ShiftEnd.tsx` with adventure props

**Files:**
- Modify: `src/components/ShiftEnd.tsx`

- [ ] **Step 1: Add optional props to the interface**

  In `src/components/ShiftEnd.tsx`, update the `Props` interface (currently lines 7–11) to:

  ```typescript
  interface Props {
    money: number
    served: number
    lost: number
    onDone: () => void
    goalMoney?: number     // adventure mode: the money goal for this shift
    shiftNumber?: number   // adventure mode: displayed as "Shift N" label
  }
  ```

  Update the function signature to destructure the new props:
  ```typescript
  export default function ShiftEnd({ money, served, lost, onDone, goalMoney, shiftNumber }: Props) {
  ```

- [ ] **Step 2: Render goal and pass/fail inside the score card**

  In the `showScore` block (currently inside `{showScore && (...)}`), find the `.scoreCard` div and add after the `.moneyVal` div:

  ```tsx
  {goalMoney != null && (
    <>
      <div className={styles.shiftLabel} style={{ fontSize: '16px' }}>
        {shiftNumber != null ? `Shift ${shiftNumber}` : 'Goal'}: ${goalMoney}
      </div>
      <div className={styles.servedRow}>
        <span
          className={`${styles.statPill} ${money >= goalMoney ? styles.statServed : styles.statLost}`}
        >
          {money >= goalMoney ? '✓ PASSED' : '✗ FAILED'}
        </span>
      </div>
    </>
  )}
  ```

  Note: `statServed` (green) and `statLost` (red) are already defined in `ShiftEnd.module.css`. No new CSS needed.

- [ ] **Step 3: Verify in dev server**

  Run: `npm run dev`
  Open in browser. Play a Free Play round — ShiftEnd should look identical to before (no goal shown).

---

## Task 4: Create `AdventureBriefing` component

**Files:**
- Create: `src/components/AdventureBriefing.tsx`
- Create: `src/components/AdventureBriefing.module.css`

- [ ] **Step 1: Write `AdventureBriefing.tsx`**

  ```tsx
  import { AdventureRun, AdventureBestRun } from '../state/types'
  import { RECIPES } from '../data/recipes'
  import styles from './AdventureBriefing.module.css'

  interface Props {
    run: AdventureRun
    bestRun: AdventureBestRun | null
    onStart: () => void
    onMenu: () => void
  }

  export default function AdventureBriefing({ run, bestRun, onStart, onMenu }: Props) {
    const lastResult = run.shiftResults.length > 0
      ? run.shiftResults[run.shiftResults.length - 1]
      : null

    return (
      <div className={styles.screen}>
        {/* ── LEFT ── */}
        <div className={styles.leftCol}>
          <h1 className={styles.shiftTitle}>Shift {run.currentShift}</h1>
          <div className={styles.goalLine}>Goal: ${run.currentGoal}</div>

          {lastResult && (
            <div className={styles.prevResult}>
              Previous: ${lastResult.moneyEarned} / ${lastResult.goalMoney}
              {' · '}
              <span style={{ color: '#5cb85c' }}>PASSED</span>
            </div>
          )}

          {bestRun && (
            <div className={styles.bestChip}>
              Best run: Shift {bestRun.furthestShift} · ${bestRun.totalMoney}
            </div>
          )}

          <div className={styles.buttons}>
            <button className={styles.startBtn} onClick={onStart}>START</button>
            <button className={styles.menuBtn} onClick={onMenu}>Main Menu</button>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className={styles.rightCol}>
          <div className={styles.menuPanel}>
            <div className={styles.panelTitle}>This Shift's Menu</div>
            {run.currentRecipes.map((key, i) => {
              const recipe = RECIPES[key]
              if (!recipe) return null
              return (
                <div key={key} className={`${styles.recipeCard} ${i > 0 ? styles.recipeCardBorder : ''}`}>
                  <span className={styles.recipeEmoji}>{recipe.emoji}</span>
                  <span className={styles.recipeName}>{recipe.name}</span>
                  <span className={styles.recipeReward}>${recipe.reward}</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Write `AdventureBriefing.module.css`**

  ```css
  .screen {
    display: grid;
    grid-template-columns: 480px 1fr;
    height: 100%;
    background: var(--bg);
    overflow: hidden;
    box-sizing: border-box;
  }

  .leftCol {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    height: 100%;
    padding: 40px 32px 40px 48px;
    border-right: 1px solid var(--border);
    overflow: hidden;
  }

  .rightCol {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    padding: 40px 48px 40px 16px;
    overflow: hidden;
    min-height: 0;
  }

  .shiftTitle {
    font-family: 'Lilita One', cursive;
    font-size: 48px;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
  }

  .goalLine {
    font-family: 'Lilita One', cursive;
    font-size: 36px;
    color: #f0c850;
  }

  .prevResult {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
  }

  .bestChip {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
  }

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 240px;
    margin-top: 8px;
  }

  .startBtn {
    border: none;
    border-radius: 10px;
    padding: 14px 24px;
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    background: #b87333;
    color: #fff;
    cursor: pointer;
    transition: transform 0.1s, filter 0.1s;
  }

  .startBtn:hover {
    transform: scale(1.03);
    filter: brightness(1.1);
  }

  .menuBtn {
    border: none;
    border-radius: 10px;
    padding: 14px 24px;
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    background: var(--border);
    color: var(--text);
    cursor: pointer;
    transition: transform 0.1s, filter 0.1s;
  }

  .menuBtn:hover {
    transform: scale(1.03);
    filter: brightness(1.2);
  }

  /* ── Recipe panel ── */

  .menuPanel {
    background: var(--station-bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .panelTitle {
    font-family: 'Lilita One', cursive;
    font-size: 18px;
    color: var(--text-warm);
    text-align: center;
    margin-bottom: 12px;
  }

  .recipeCard {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
  }

  .recipeCardBorder {
    border-top: 1px solid var(--border);
  }

  .recipeEmoji {
    font-size: 28px;
    flex-shrink: 0;
  }

  .recipeName {
    font-family: 'Fredoka', sans-serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--text);
    flex: 1;
  }

  .recipeReward {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: #f0c850;
    margin-left: auto;
    flex-shrink: 0;
  }
  ```

---

## Task 5: Create `AdventureRunEnd` component

**Files:**
- Create: `src/components/AdventureRunEnd.tsx`
- Create: `src/components/AdventureRunEnd.module.css`

- [ ] **Step 1: Write `AdventureRunEnd.tsx`**

  ```tsx
  import { AdventureRun, AdventureBestRun, PlayerStats } from '../state/types'
  import { RECIPES, NAME_COLORS } from '../data/recipes'
  import styles from './AdventureRunEnd.module.css'

  function hashStr(s: string): number {
    let h = 0
    for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0
    return h
  }

  function totalActions(s: PlayerStats): number {
    return s.cooked + s.taken + s.served + s.extinguished - s.firesCaused
  }

  interface Props {
    run: AdventureRun
    bestRun: AdventureBestRun | null
    isNewBestRun: boolean
    onPlayAgain: () => void
    onMenu: () => void
  }

  export default function AdventureRunEnd({ run, bestRun, isNewBestRun, onPlayAgain, onMenu }: Props) {
    const passedShifts = run.shiftResults.filter(r => r.passed).length
    const totalMoney   = run.shiftResults.reduce((sum, r) => sum + r.moneyEarned, 0)
    const totalServed  = run.shiftResults.reduce((sum, r) => sum + r.served, 0)
    const totalLost    = run.shiftResults.reduce((sum, r) => sum + r.lost, 0)

    const leaderboard = Object.entries(run.accumulatedPlayerStats)
      .sort(([, a], [, b]) => totalActions(b) - totalActions(a))

    return (
      <div className={styles.screen}>
        {/* ── LEFT ── */}
        <div className={styles.leftCol}>
          <h1 className={styles.title}>Run Over</h1>

          <div className={styles.stats}>
            <div className={styles.stat}>
              <div className={styles.statValue}>{passedShifts}</div>
              <div className={styles.statLabel}>Shifts Survived</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>${totalMoney}</div>
              <div className={styles.statLabel}>Total Earned</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{totalServed}</div>
              <div className={styles.statLabel}>Served</div>
            </div>
            <div className={styles.stat}>
              <div className={styles.statValue}>{totalLost}</div>
              <div className={styles.statLabel}>Lost</div>
            </div>
          </div>

          {isNewBestRun && (
            <div className={styles.newBest}>New Best Run!</div>
          )}

          {bestRun && !isNewBestRun && (
            <div className={styles.bestChip}>
              Best run: Shift {bestRun.furthestShift} · ${bestRun.totalMoney}
            </div>
          )}

          {/* Shift history */}
          <div className={styles.historyPanel}>
            <div className={styles.panelTitle}>Shift History</div>
            <div className={styles.historyHeader}>
              <span className={styles.historyShift}>#</span>
              <span className={styles.historyRecipes}>Recipes</span>
              <span className={styles.historyGoal}>Goal</span>
              <span className={styles.historyEarned}>Earned</span>
              <span className={styles.historyResult}>Result</span>
            </div>
            {run.shiftResults.map(r => (
              <div
                key={r.shiftNumber}
                className={`${styles.historyRow} ${!r.passed ? styles.historyRowFail : ''}`}
              >
                <span className={styles.historyShift}>{r.shiftNumber}</span>
                <span className={styles.historyRecipes}>
                  {r.recipes.map(k => RECIPES[k]?.emoji ?? '?').join(' ')}
                </span>
                <span className={styles.historyGoal}>${r.goalMoney}</span>
                <span className={styles.historyEarned}>${r.moneyEarned}</span>
                <span className={r.passed ? styles.resultPass : styles.resultFail}>
                  {r.passed ? 'PASS' : 'FAIL'}
                </span>
              </div>
            ))}
          </div>

          <div className={styles.buttons}>
            <button className={styles.playAgainBtn} onClick={onPlayAgain}>Play Again</button>
            <button className={styles.menuBtn} onClick={onMenu}>Main Menu</button>
          </div>
        </div>

        {/* ── RIGHT ── */}
        <div className={styles.rightCol}>
          <div className={styles.leaderboard}>
            <div className={styles.lbStickyHead}>
              <div className={styles.lbTitle}>Leaderboard</div>
              <div className={styles.lbHeader}>
                <span className={styles.lbRank}>#</span>
                <span className={styles.lbName}>Player</span>
                <span className={styles.lbDetail} title="Cooked">🍳</span>
                <span className={styles.lbDetail} title="Taken">✋</span>
                <span className={styles.lbDetail} title="Served">✅</span>
                <span className={styles.lbDetail} title="Extinguished">🧯</span>
                <span className={styles.lbDetail} title="Fires Caused">🔥</span>
                <span className={styles.lbTotal}>Total</span>
              </div>
            </div>
            {leaderboard.length === 0 ? (
              <div className={styles.lbEmpty}>No players this run</div>
            ) : (
              leaderboard.map(([name, s], i) => {
                const color = NAME_COLORS[Math.abs(hashStr(name)) % NAME_COLORS.length]
                const isYou = name === 'You'
                return (
                  <div key={name} className={`${styles.lbRow} ${isYou ? styles.lbYou : ''}`}>
                    <span className={styles.lbRank}>{i + 1}</span>
                    <span className={styles.lbName} style={{ color }}>{name}</span>
                    <span className={styles.lbDetail}>{s.cooked}</span>
                    <span className={styles.lbDetail}>{s.taken}</span>
                    <span className={styles.lbDetail}>{s.served}</span>
                    <span className={styles.lbDetail}>{s.extinguished}</span>
                    <span className={styles.lbDetail} style={{ color: '#d94f4f' }}>{s.firesCaused}</span>
                    <span className={styles.lbTotal}>{totalActions(s)}</span>
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Write `AdventureRunEnd.module.css`**

  ```css
  .screen {
    display: grid;
    grid-template-columns: 480px 1fr;
    height: 100%;
    background: var(--bg);
    overflow: hidden;
    box-sizing: border-box;
  }

  .leftCol {
    display: flex;
    flex-direction: column;
    justify-content: center;
    gap: 20px;
    height: 100%;
    padding: 40px 32px 40px 48px;
    overflow-y: auto;
    min-height: 0;
  }

  .rightCol {
    display: flex;
    flex-direction: column;
    gap: 16px;
    height: 100%;
    padding: 40px 48px 40px 16px;
    overflow: hidden;
    min-height: 0;
  }

  .title {
    font-family: 'Lilita One', cursive;
    font-size: 48px;
    color: #ffffff;
    margin: 0;
    text-shadow: 0 0 40px rgba(255, 255, 255, 0.15);
  }

  .stats {
    display: flex;
    gap: 24px;
    flex-wrap: wrap;
  }

  .stat {
    text-align: center;
  }

  .statValue {
    font-family: 'Lilita One', cursive;
    font-size: 36px;
    color: #f0c850;
  }

  .statLabel {
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    color: var(--text-secondary);
    margin-top: 4px;
  }

  .newBest {
    font-family: 'Lilita One', cursive;
    font-size: 28px;
    color: #f0c850;
    text-shadow: 0 0 20px rgba(240, 200, 80, 0.5);
    animation: pulse 0.8s ease-in-out infinite alternate;
  }

  @keyframes pulse {
    from { transform: scale(1); }
    to   { transform: scale(1.05); }
  }

  .bestChip {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
  }

  /* ── Shift history panel ── */

  .historyPanel {
    background: var(--station-bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    flex-shrink: 0;
  }

  .panelTitle {
    font-family: 'Lilita One', cursive;
    font-size: 18px;
    color: var(--text-warm);
    text-align: center;
    margin-bottom: 10px;
  }

  .historyHeader {
    display: flex;
    gap: 4px;
    padding: 4px 6px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }

  .historyHeader span {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
    font-weight: 700;
  }

  .historyRow {
    display: flex;
    gap: 4px;
    padding: 5px 6px;
    border-radius: 4px;
  }

  .historyRow:nth-child(odd) {
    background: rgba(255, 255, 255, 0.02);
  }

  .historyRowFail {
    background: rgba(217, 79, 79, 0.08) !important;
    border: 1px solid rgba(217, 79, 79, 0.25);
  }

  .historyShift {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-secondary);
    width: 28px;
    text-align: center;
    flex-shrink: 0;
  }

  .historyRecipes {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .historyGoal {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
    width: 52px;
    text-align: right;
    flex-shrink: 0;
  }

  .historyEarned {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: #f0c850;
    font-weight: 700;
    width: 60px;
    text-align: right;
    flex-shrink: 0;
  }

  .historyResult {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    width: 40px;
    text-align: right;
    flex-shrink: 0;
  }

  .resultPass {
    color: #5cb85c;
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    width: 40px;
    text-align: right;
    flex-shrink: 0;
  }

  .resultFail {
    color: #d94f4f;
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    width: 40px;
    text-align: right;
    flex-shrink: 0;
  }

  /* ── Buttons ── */

  .buttons {
    display: flex;
    flex-direction: column;
    gap: 12px;
    width: 240px;
  }

  .playAgainBtn {
    border: none;
    border-radius: 10px;
    padding: 14px 24px;
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    background: #b87333;
    color: #fff;
    cursor: pointer;
    transition: transform 0.1s, filter 0.1s;
  }

  .playAgainBtn:hover {
    transform: scale(1.03);
    filter: brightness(1.1);
  }

  .menuBtn {
    border: none;
    border-radius: 10px;
    padding: 14px 24px;
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    background: var(--border);
    color: var(--text);
    cursor: pointer;
    transition: transform 0.1s, filter 0.1s;
  }

  .menuBtn:hover {
    transform: scale(1.03);
    filter: brightness(1.2);
  }

  /* ── Leaderboard (matches GameOver.module.css exactly) ── */

  .leaderboard {
    background: var(--station-bg);
    border: 2px solid var(--border);
    border-radius: 10px;
    padding: 16px;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
  }

  .lbEmpty {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
    text-align: center;
    padding: 12px 0;
    font-style: italic;
  }

  .lbStickyHead {
    position: sticky;
    top: 0;
    background: var(--station-bg);
    z-index: 1;
  }

  .lbTitle {
    font-family: 'Lilita One', cursive;
    font-size: 18px;
    color: var(--text-warm);
    text-align: center;
    padding-bottom: 8px;
    padding-top: 2px;
  }

  .lbHeader {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 4px 8px;
    border-bottom: 1px solid var(--border);
    margin-bottom: 4px;
  }

  .lbHeader span {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-muted);
    font-weight: 700;
  }

  .lbRow {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 5px 8px;
    border-radius: 4px;
  }

  .lbRow:nth-child(odd) {
    background: rgba(255, 255, 255, 0.02);
  }

  .lbYou {
    background: rgba(184, 115, 51, 0.1) !important;
    border: 1px solid rgba(184, 115, 51, 0.25);
  }

  .lbRank {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-secondary);
    font-weight: 700;
    width: 32px;
    text-align: center;
    flex-shrink: 0;
  }

  .lbName {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: var(--text);
  }

  .lbDetail {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-secondary);
    width: 36px;
    text-align: center;
    flex-shrink: 0;
  }

  .lbTotal {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    color: #f0c850;
    width: 52px;
    text-align: right;
    flex-shrink: 0;
  }
  ```

---

## Task 6: Update `MainMenu.tsx`

**Files:**
- Modify: `src/components/MainMenu.tsx`

- [ ] **Step 1: Replace `onLevels` with `onAdventure` in the Props interface**

  Change:
  ```typescript
  interface Props {
    onPlay: () => void
    onLevels: () => void   // ← remove this
    ...
  }
  ```
  To:
  ```typescript
  interface Props {
    onPlay: () => void
    onAdventure: () => void   // ← add this
    ...
  }
  ```

  Update the function signature destructuring accordingly:
  ```typescript
  export default function MainMenu({ onPlay, onAdventure, onOptions, onTutorial, ... }: Props) {
  ```

- [ ] **Step 2: Update the Adventures button**

  Find the `modeAdventures` button (currently `onClick={onLevels}`). Change:
  ```tsx
  <button className={styles.modeAdventures} onClick={onLevels}>
    <div>
      <div className={styles.lvName}>Adventures</div>
      <div className={styles.lvDesc}>10 escalating challenges — earn stars on each</div>
    </div>
    ...
  </button>
  ```
  To:
  ```tsx
  <button className={styles.modeAdventures} onClick={onAdventure}>
    <div>
      <div className={styles.lvName}>Adventures</div>
      <div className={styles.lvDesc}>Roguelike runs — how many shifts can you survive?</div>
    </div>
    ...
  </button>
  ```

---

## Task 7: Rewrite `App.tsx` — state, logic, and screen renders

**Files:**
- Modify: `src/App.tsx`

This is the largest task. Complete each sub-step in order.

- [ ] **Step 1: Update imports — remove old, add new**

  Remove these imports:
  ```typescript
  import LevelSelect from './components/LevelSelect'
  import { getLevelConfig, getStarRating } from './data/levels'
  import { LevelProgress } from './state/types'
  ```

  Add these imports:
  ```typescript
  import AdventureBriefing from './components/AdventureBriefing'
  import AdventureRunEnd from './components/AdventureRunEnd'
  import {
    AdventureRun, AdventureBestRun, ShiftResult,
  } from './state/types'
  import {
    ADVENTURE_SHIFT_DURATION, getAdventureGoal, pickAdventureRecipes, mergePlayerStats,
  } from './data/adventureMode'
  ```

- [ ] **Step 2: Update the `Screen` type**

  Change line 28 from:
  ```typescript
  type Screen = 'menu' | 'levelselect' | 'options' | 'freeplaysetup' | 'countdown' | 'playing' | 'shiftend' | 'gameover'
  ```
  To:
  ```typescript
  type Screen = 'menu' | 'adventurebriefing' | 'options' | 'freeplaysetup' | 'countdown' | 'playing' | 'shiftend' | 'gameover' | 'adventurerunend'
  ```

- [ ] **Step 3: Remove level state, add adventure state**

  Remove these state declarations:
  ```typescript
  const currentLevelRef = useRef<number | null>(null)
  const [currentLevel, setCurrentLevel] = useState<number | null>(null)
  const [levelProgress, setLevelProgress] = useState<LevelProgress>(...)
  ```

  Remove this line:
  ```typescript
  currentLevelRef.current = currentLevel
  ```

  Add after the `autoRestartSignal` state:
  ```typescript
  const [adventureRun, setAdventureRun]   = useState<AdventureRun | null>(null)
  const adventureRunRef                   = useRef<AdventureRun | null>(null)
  const [adventureBestRun, setAdventureBestRun] = useState<AdventureBestRun | null>(() => {
    try {
      const saved = localStorage.getItem('chatsKitchen_adventureBestRun')
      return saved ? JSON.parse(saved) : null
    } catch { return null }
  })
  const [isNewBestAdventureRun, setIsNewBestAdventureRun] = useState(false)
  ```

  In the "Keep refs in sync" section, add:
  ```typescript
  adventureRunRef.current = adventureRun
  ```

- [ ] **Step 4: Add `startAdventure()` callback**

  Add after `startFreePlay`:
  ```typescript
  const startAdventure = useCallback(() => {
    setIsNewBestAdventureRun(false)
    const recipes = pickAdventureRecipes()
    const shift   = 1
    const run: AdventureRun = {
      currentShift: shift,
      shiftResults: [],
      currentRecipes: recipes,
      currentGoal: getAdventureGoal(shift),
      accumulatedPlayerStats: {},
    }
    setAdventureRun(run)
    dispatch({
      type: 'RESET',
      shiftDuration: ADVENTURE_SHIFT_DURATION,
      cookingSpeed: 1, orderSpeed: 1, orderSpawnRate: 1,
      stationCapacity: DEFAULT_GAME_OPTIONS.stationCapacity,
      restrictSlots: false,
      enabledRecipes: recipes,
    })
    setScreen('adventurebriefing')
  }, [])
  ```

- [ ] **Step 5: Rewrite `handleGameOver()`**

  Replace the existing `handleGameOver` with:
  ```typescript
  const handleGameOver = useCallback(() => {
    const s = stateRef.current
    setFinalStats({ money: s.money, served: s.served, lost: s.lost, playerStats: s.playerStats })

    if (adventureRunRef.current) {
      setAdventureRun(prev => prev
        ? { ...prev, accumulatedPlayerStats: mergePlayerStats(prev.accumulatedPlayerStats, s.playerStats) }
        : prev)
    } else {
      // Free Play: existing high-score + history logic (unchanged)
      setFreePlayHighScore(prev => {
        if (s.money > prev) {
          try { localStorage.setItem('chatsKitchen_freePlayHighScore', String(s.money)) } catch { /* ignore */ }
          setIsNewHighScore(true)
          return s.money
        }
        setIsNewHighScore(false)
        return prev
      })
      setFreePlayHistory(prev => {
        const updated = [{ money: s.money, served: s.served, lost: s.lost }, ...prev].slice(0, 5)
        try { localStorage.setItem('chatsKitchen_freePlayHistory', JSON.stringify(updated)) } catch { /* ignore */ }
        return updated
      })
    }
    setScreen('shiftend')
  }, [])
  ```

  Note: Remove `currentLevel` and `levelProgress` from the deps array (now empty `[]`).

- [ ] **Step 6: Rewrite `handleShiftEndDone()`**

  Replace the one-liner with:
  ```typescript
  const handleShiftEndDone = useCallback(() => {
    const run = adventureRunRef.current
    if (!run) { setScreen('gameover'); return }

    const passed = finalStats.money >= run.currentGoal
    const result: ShiftResult = {
      shiftNumber: run.currentShift,
      recipes:     run.currentRecipes,
      goalMoney:   run.currentGoal,
      moneyEarned: finalStats.money,
      served:      finalStats.served,
      lost:        finalStats.lost,
      passed,
    }
    const updatedRun: AdventureRun = {
      ...run,
      shiftResults: [...run.shiftResults, result],
    }

    if (passed) {
      const nextShift   = run.currentShift + 1
      const nextRecipes = pickAdventureRecipes()
      setAdventureRun({
        ...updatedRun,
        currentShift:   nextShift,
        currentRecipes: nextRecipes,
        currentGoal:    getAdventureGoal(nextShift),
      })
      dispatch({
        type: 'RESET',
        shiftDuration: ADVENTURE_SHIFT_DURATION,
        cookingSpeed: 1, orderSpeed: 1, orderSpawnRate: 1,
        stationCapacity: DEFAULT_GAME_OPTIONS.stationCapacity,
        restrictSlots: false,
        enabledRecipes: nextRecipes,
      })
      setScreen('adventurebriefing')
    } else {
      setAdventureRun(updatedRun)
      const totalMoney = updatedRun.shiftResults.reduce((sum, r) => sum + r.moneyEarned, 0)
      setAdventureBestRun(prev => {
        const isNew = !prev
          || updatedRun.currentShift > prev.furthestShift
          || (updatedRun.currentShift === prev.furthestShift && totalMoney > prev.totalMoney)
        if (isNew) {
          const best: AdventureBestRun = { furthestShift: updatedRun.currentShift, totalMoney }
          try { localStorage.setItem('chatsKitchen_adventureBestRun', JSON.stringify(best)) } catch {}
          setIsNewBestAdventureRun(true)
          return best
        }
        return prev
      })
      setScreen('adventurerunend')
    }
  }, [finalStats])
  ```

- [ ] **Step 7: Remove `startLevel()` callback entirely**

  Delete the `startLevel` callback — it is replaced by `startAdventure`.

- [ ] **Step 8: Update `handleMetaCommand()` — remove level references**

  In `handleMetaCommand`, remove the check `currentLevelRef.current == null` from the `!start` guard (it was Free Play only anyway). The `!start` command should remain gated to `currentLevelRef == null` logic — since `currentLevel` no longer exists, simplify: `!start` fires when `adventureRunRef.current == null` (i.e., Free Play mode). Update accordingly:

  ```typescript
  if (cmd === '!start' && s === 'gameover' && adventureRunRef.current == null) {
    startFreePlay()
    showToast(`▶ Starting now (${user})`)
    return
  }
  ```

- [ ] **Step 9: Update `handleResetAll()` — remove level progress, add adventure**

  Remove:
  ```typescript
  setLevelProgress({})
  localStorage.removeItem('chatsKitchen_levelProgress')
  ```
  Add:
  ```typescript
  setAdventureBestRun(null)
  try { localStorage.removeItem('chatsKitchen_adventureBestRun') } catch {}
  ```

- [ ] **Step 10: Update the content rendering section**

  Replace:
  ```tsx
  } else if (screen === 'levelselect') {
    content = (
      <LevelSelect
        progress={levelProgress}
        onSelectLevel={startLevel}
        onBack={() => setScreen('menu')}
        twitchChannel={twitchChannel}
        twitchConnected={twitchChat.status === 'connected'}
      />
    )
  ```
  With:
  ```tsx
  } else if (screen === 'adventurebriefing') {
    content = (
      <AdventureBriefing
        run={adventureRun!}
        bestRun={adventureBestRun}
        onStart={() => setScreen('countdown')}
        onMenu={() => { setAdventureRun(null); setScreen('menu') }}
      />
    )
  ```

  Update the `shiftend` render to pass adventure context:
  ```tsx
  } else if (screen === 'shiftend') {
    content = (
      <ShiftEnd
        money={finalStats.money}
        served={finalStats.served}
        lost={finalStats.lost}
        goalMoney={adventureRun?.currentGoal}
        shiftNumber={adventureRun?.currentShift}
        onDone={handleShiftEndDone}
      />
    )
  ```

  Update the `gameover` render — remove level-specific props:
  ```tsx
  } else if (screen === 'gameover') {
    content = (
      <GameOver
        money={finalStats.money}
        served={finalStats.served}
        lost={finalStats.lost}
        playerStats={finalStats.playerStats}
        level={null}
        highScore={freePlayHighScore}
        isNewHighScore={isNewHighScore}
        roundHistory={freePlayHistory}
        autoRestart={gameOptions.autoRestart}
        autoRestartDelay={gameOptions.autoRestartDelay}
        autoRestartSignal={autoRestartSignal}
        onPlayAgain={startFreePlay}
        onNextLevel={undefined}
        onMenu={() => setScreen('menu')}
      />
    )
  ```

  Add after the `gameover` block:
  ```tsx
  } else if (screen === 'adventurerunend') {
    content = (
      <AdventureRunEnd
        run={adventureRun!}
        bestRun={adventureBestRun}
        isNewBestRun={isNewBestAdventureRun}
        onPlayAgain={startAdventure}
        onMenu={() => { setAdventureRun(null); setScreen('menu') }}
      />
    )
  ```

  Update the `MainMenu` render to use `onAdventure`:
  ```tsx
  <MainMenu
    onPlay={() => handleMenuPlay('freeplaysetup')}
    onAdventure={startAdventure}
    onOptions={() => setScreen('options')}
    onTutorial={handleMenuTutorial}
    ...
  />
  ```

  Also update `continueFromTutorial` — remove the `'levelselect'` destination case. The `TutorialDestination` type needs updating:
  ```typescript
  type TutorialDestination = 'menu' | 'freeplaysetup'
  ```
  Remove `| 'levelselect'` from the type AND hunt down every call site that passes `'levelselect'` as a destination (search for `'levelselect'` in `App.tsx` — there is one in `handleMenuPlay`). Remove or update those call sites. TypeScript will surface any missed instances at the Step 11 build check.

- [ ] **Step 11: Compile check**

  Run: `npm run build`
  Expected: 0 TypeScript errors

---

## Task 8: Delete removed files

**Files:**
- Delete: `src/components/LevelSelect.tsx`
- Delete: `src/components/LevelSelect.module.css`
- Delete: `src/data/levels.ts`

- [ ] **Step 1: Delete the files**

  Run from the repository root (`/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen`):
  ```bash
  rm src/components/LevelSelect.tsx
  rm src/components/LevelSelect.module.css
  rm src/data/levels.ts
  ```

- [ ] **Step 2: Final build check**

  Run: `npm run build`
  Expected: Clean build with 0 errors and 0 warnings about missing imports.

---

## Task 9: End-to-end verification

- [ ] **Step 1: Start dev server**

  Run: `npm run dev`

- [ ] **Step 2: Test main menu**

  - Main menu loads without errors
  - "Adventures" button description reads "Roguelike runs — how many shifts can you survive?"
  - Clicking Adventures navigates to the briefing screen (Shift 1, $150 goal, 3 recipe cards shown)

- [ ] **Step 3: Test PASS path (earn ≥ $150)**

  - Click Start on briefing → 3-2-1 countdown → 3-minute gameplay
  - End shift (use bot or earn money)
  - ShiftEnd shows earnings + "Goal: $150" + green "✓ PASSED" pill (if passed) or red "✗ FAILED" (if failed)
  - If passed: briefing for Shift 2 shows $210 goal and 3 (possibly new) recipes
  - Continue through a few shifts and verify goal increases by $60 each time

- [ ] **Step 4: Test FAIL path**

  - Fail a shift (earn < goal) — ShiftEnd shows red "✗ FAILED"
  - AdventureRunEnd screen appears with:
    - Correct shifts survived (passed shifts count only)
    - Total money earned
    - Shift history table: all rows, correct PASS/FAIL colors, red tint on failed row
    - Player leaderboard with accumulated stats from all shifts
  - "Play Again" → fresh Shift 1 run starts

- [ ] **Step 5: Test best run persistence**

  - Complete a run (reach at least Shift 2 then fail)
  - "New Best Run!" badge appears on AdventureRunEnd
  - Reload the browser
  - Click Adventures → briefing shows "Best run: Shift X · $Y" chip
  - Complete another run with a shorter path → no badge on run-end
  - Complete a longer run → badge appears again

- [ ] **Step 6: Test Free Play is unaffected**

  - Free Play → setup → play → ShiftEnd shows normal earnings (no goal line)
  - GameOver shows round history + leaderboard as before

- [ ] **Step 7: Final build**

  Run: `npm run build`
  Expected: Successful production build, no TypeScript errors.

---

## Key Design Notes

- **`adventureRunRef`** — mirrors the `currentLevelRef` pattern already in the codebase. Allows `handleShiftEndDone` and `handleMetaCommand` (stable callbacks) to read fresh run state without stale closures.
- **`handleShiftEndDone` dep on `[finalStats]`** — `finalStats` is always set in `handleGameOver` before `ShiftEnd` even mounts, so it's current when the 3200 ms callback fires. Adding it to the dep array ensures correctness.
- **ShiftEnd animation unchanged** — the new goal/pass-fail content is additive within the existing `.scoreCard` div; no CSS animation timing changes.
- **`LevelProgress` removal** — no migration needed; localStorage is simply no longer written to or read from for that key.
