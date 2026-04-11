# Pause Modal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the in-game settings dropdown with a full-screen pause modal that freezes the game clock while open.

**Architecture:** Add a `paused` state to App.tsx, thread it into `useGameLoop` to skip TICKs, and render a new `PauseModal` component (two-column layout: toggles left, scrollable recipe list right) instead of the old `settingsDropdown` JSX. The old dropdown and all its CSS classes are deleted.

**Tech Stack:** React 18, TypeScript, CSS Modules, Fredoka + Space Mono fonts, existing CSS variables (`--station-bg`, `--border`, `--text`, `--text-secondary`, `--bg`).

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/PauseModal.tsx` | **Create** | Full-screen pause overlay — toggle buttons, recipe list, resume/exit |
| `src/components/PauseModal.module.css` | **Create** | All styles for the pause modal |
| `src/hooks/useGameLoop.ts` | **Modify** | Accept `paused` boolean; skip TICK dispatch when true |
| `src/App.tsx` | **Modify** | Add `paused` state; wire gear btn → modal open; remove dropdown JSX/state |
| `src/App.module.css` | **Modify** | Remove all `settings*` + `twitchDot` classes (dropdown is gone) |

---

## Task 1: Add `paused` param to `useGameLoop`

**Files:**
- Modify: `src/hooks/useGameLoop.ts`

- [ ] **Step 1: Add `paused` to the Props + skip TICK when true**

  Open `src/hooks/useGameLoop.ts`. The function currently accepts `(state, dispatch, onGameOver?)`. Add `paused?: boolean` as a fourth parameter and guard the TICK dispatch:

  ```typescript
  export function useGameLoop(
    state: GameState,
    dispatch: React.Dispatch<GameAction>,
    onGameOver?: () => void,
    paused?: boolean,
  ) {
  ```

  Inside the `setInterval` callback, right after the game-over check and before `dispatch({ type: 'TICK', ... })`, add:

  ```typescript
  if (paused) return
  ```

  Also guard order spawning (it comes after TICK) — the `return` above covers both since they're in the same callback block. Verify the structure: the `if (paused) return` should be placed after the game-over check so we still detect game-over even while paused. Actually, for correctness also skip order spawning; the single `return` after the game-over guard already handles this since TICK + order spawning both come after.

  Full diff target in `useGameLoop.ts`:
  ```typescript
  // After the game-over check block, before dispatch TICK:
  if (paused) return

  // Tick game state
  dispatch({ type: 'TICK', delta, now })
  ```

- [ ] **Step 2: Run type-check to confirm no errors**

  ```bash
  npm run build 2>&1 | head -30
  ```
  Expected: no TypeScript errors for `useGameLoop.ts`.

- [ ] **Step 3: Commit**

  ```bash
  git add src/hooks/useGameLoop.ts
  git commit -m "feat: add paused param to useGameLoop to skip TICK dispatch"
  ```

---

## Task 2: Create `PauseModal` component + styles

**Files:**
- Create: `src/components/PauseModal.tsx`
- Create: `src/components/PauseModal.module.css`

- [ ] **Step 1: Create `PauseModal.tsx`**

  ```tsx
  import { useEffect } from 'react'
  import { AudioSettings, GameOptions } from '../state/types'
  import { RECIPES } from '../data/recipes'
  import styles from './PauseModal.module.css'

  interface PauseModalProps {
    gameOptions: GameOptions
    audioSettings: AudioSettings
    onAudioChange: (s: AudioSettings) => void
    chatOpen: boolean
    onChatToggle: () => void
    botsEnabled: boolean
    onBotsToggle: () => void
    onResume: () => void
    onExit: () => void
  }

  export default function PauseModal({
    gameOptions,
    audioSettings,
    onAudioChange,
    chatOpen,
    onChatToggle,
    botsEnabled,
    onBotsToggle,
    onResume,
    onExit,
  }: PauseModalProps) {
    useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onResume()
      }
      window.addEventListener('keydown', handler)
      return () => window.removeEventListener('keydown', handler)
    }, [onResume])

    return (
      <div className={styles.backdrop}>
        <div className={styles.modal}>
          {/* LEFT COLUMN */}
          <div className={styles.left}>
            <div className={styles.pausedHeader}>⏸ PAUSED</div>

            <button
              className={`${styles.toggle} ${!audioSettings.musicMuted ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => onAudioChange({ ...audioSettings, musicMuted: !audioSettings.musicMuted })}
            >
              🎵 Music &nbsp; {audioSettings.musicMuted ? 'OFF' : 'ON'}
            </button>
            <button
              className={`${styles.toggle} ${!audioSettings.sfxMuted ? styles.toggleOn : styles.toggleOff}`}
              onClick={() => onAudioChange({ ...audioSettings, sfxMuted: !audioSettings.sfxMuted })}
            >
              🔊 SFX &nbsp; {audioSettings.sfxMuted ? 'OFF' : 'ON'}
            </button>
            <button
              className={`${styles.toggle} ${chatOpen ? styles.toggleOn : styles.toggleOff}`}
              onClick={onChatToggle}
            >
              💬 Chat &nbsp; {chatOpen ? 'ON' : 'OFF'}
            </button>
            <button
              className={`${styles.toggle} ${botsEnabled ? styles.toggleOn : styles.toggleOff}`}
              onClick={onBotsToggle}
            >
              🤖 Bots &nbsp; {botsEnabled ? 'ON' : 'OFF'}
            </button>

            <div className={styles.divider} />

            <button className={styles.exitBtn} onClick={onExit}>
              Exit to Menu
            </button>
            <button className={styles.resumeBtn} onClick={onResume}>
              ▶ Resume Game
            </button>
          </div>

          {/* RIGHT COLUMN */}
          <div className={styles.right}>
            <div className={styles.recipeLabel}>Active Recipes</div>
            {gameOptions.enabledRecipes.map(key => {
              const recipe = RECIPES[key]
              if (!recipe) return null
              return (
                <div key={key} className={styles.recipeCard}>
                  <div className={styles.recipeName}>{recipe.emoji} {recipe.name}</div>
                  <div className={styles.recipeSteps}>
                    {recipe.steps.map((step, i) => (
                      <span key={i}>
                        {step.action} {step.target}
                        {i < recipe.steps.length - 1
                          ? (recipe.steps[i + 1].requires ? ' → ' : ' + ')
                          : ''}
                      </span>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }
  ```

- [ ] **Step 2: Create `PauseModal.module.css`**

  ```css
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    z-index: 300;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .modal {
    display: flex;
    width: 780px;
    max-height: 90vh;
    background: var(--station-bg);
    border: 1px solid var(--border);
    border-radius: 14px;
    overflow: hidden;
    box-shadow: 0 8px 40px rgba(0, 0, 0, 0.7);
  }

  /* LEFT COLUMN */
  .left {
    width: 220px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 24px 16px;
    border-right: 1px solid var(--border);
  }

  .pausedHeader {
    font-family: 'Fredoka', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #f0c850;
    margin-bottom: 4px;
  }

  .toggle {
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 600;
    background: rgba(255, 255, 255, 0.04);
    border: 1px solid transparent;
    border-radius: 8px;
    padding: 8px 12px;
    text-align: left;
    cursor: pointer;
    transition: background 0.1s;
    width: 100%;
  }

  .toggle:hover {
    background: rgba(255, 255, 255, 0.08);
  }

  .toggleOn {
    border-color: #5cb85c66;
    color: #5cb85c;
  }

  .toggleOff {
    color: var(--text-secondary);
  }

  .divider {
    height: 1px;
    background: var(--border);
    margin: 4px 0;
  }

  .exitBtn {
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 600;
    width: 100%;
    padding: 9px 12px;
    border-radius: 8px;
    border: 1px solid rgba(217, 79, 79, 0.35);
    background: rgba(217, 79, 79, 0.15);
    color: #d94f4f;
    cursor: pointer;
    transition: background 0.1s;
  }

  .exitBtn:hover {
    background: rgba(217, 79, 79, 0.28);
  }

  .resumeBtn {
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    width: 100%;
    padding: 10px 12px;
    border-radius: 8px;
    border: 1px solid rgba(240, 200, 80, 0.4);
    background: rgba(240, 200, 80, 0.18);
    color: #f0c850;
    cursor: pointer;
    transition: background 0.1s;
  }

  .resumeBtn:hover {
    background: rgba(240, 200, 80, 0.3);
  }

  /* RIGHT COLUMN */
  .right {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 24px 18px;
    overflow-y: auto;
  }

  .recipeLabel {
    font-family: 'Space Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--text-secondary);
    margin-bottom: 4px;
  }

  .recipeCard {
    background: rgba(255, 255, 255, 0.04);
    border-radius: 8px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .recipeName {
    font-family: 'Fredoka', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text);
  }

  .recipeSteps {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    color: var(--text-secondary);
    line-height: 1.5;
  }
  ```

- [ ] **Step 3: Run type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```
  Expected: no errors.

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/PauseModal.tsx src/components/PauseModal.module.css
  git commit -m "feat: add PauseModal component — two-column pause overlay"
  ```

---

## Task 3: Wire PauseModal into App.tsx + remove old dropdown

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Add `paused` state + import PauseModal**

  Add import at the top of `App.tsx`:
  ```tsx
  import PauseModal from './components/PauseModal'
  ```

  Replace the `settingsOpen` state declaration:
  ```tsx
  // Remove:
  const [settingsOpen, setSettingsOpen] = useState(false)
  // Add:
  const [paused, setPaused] = useState(false)
  ```

- [ ] **Step 2: Pass `paused` to `useGameLoop`**

  ```tsx
  // Before:
  useGameLoop(state, dispatch, isPlaying ? handleGameOver : undefined)
  // After:
  useGameLoop(state, dispatch, isPlaying ? handleGameOver : undefined, paused)
  ```

- [ ] **Step 3: Replace the settings dropdown JSX with gear btn → modal**

  In the `playing` screen block (the `else` branch, lines ~377–445), replace the entire `<div className={styles.settingsWrapper}>` block with:

  ```tsx
  <div className={`${styles.settingsWrapper} ${chatOpen ? styles.settingsWrapperChatOpen : ''}`}>
    <button className={styles.settingsBtn} onClick={() => setPaused(true)}>⚙️</button>
  </div>
  ```

  Then render `<PauseModal>` when `paused` is true. Add it inside the `else` content just before the closing of the returned `<div className={styles.layout}>` wrapper (or as a sibling just before the `</div>`):

  ```tsx
  {paused && (
    <PauseModal
      gameOptions={gameOptions}
      audioSettings={audioSettings}
      onAudioChange={handleAudioChange}
      chatOpen={chatOpen}
      onChatToggle={() => setChatOpen(o => !o)}
      botsEnabled={botsEnabled}
      onBotsToggle={() => setBotsEnabled(b => !b)}
      onResume={() => setPaused(false)}
      onExit={() => { setPaused(false); setScreen('menu') }}
    />
  )}
  ```

  Place this inside the `layout` div, after the `settingsWrapper` div — the modal has `position: fixed` so it doesn't matter where it sits in the DOM relative to other layout elements.

- [ ] **Step 4: Run type-check**

  ```bash
  npm run build 2>&1 | head -30
  ```
  Expected: no errors.

- [ ] **Step 5: Commit**

  ```bash
  git add src/App.tsx
  git commit -m "feat: wire PauseModal into App — gear btn opens pause overlay"
  ```

---

## Task 4: Remove old dropdown CSS from `App.module.css`

**Files:**
- Modify: `src/App.module.css`

- [ ] **Step 1: Delete all dropdown-only classes**

  Remove the following class blocks entirely from `src/App.module.css` (keep `.settingsWrapper`, `.settingsWrapperChatOpen`, `.settingsBtn`, `.settingsBtn:hover`):

  - `.settingsBackdrop`
  - `.settingsDropdown`
  - `.settingsHeader`
  - `.settingsBrand`
  - `.settingsLogo`
  - `.settingsLevel`
  - `.settingsClose`, `.settingsClose:hover`
  - `.settingsTwitch`
  - `.settingsItem` + `.settingsItem:hover`
  - `.settingsItemOn`
  - `.settingsItemOff`
  - `.settingsDivider`
  - `.settingsExit`, `.settingsExit:hover`
  - `.settingsRecipeLabel`
  - `.settingsRecipeList`
  - `.settingsRecipeItem`
  - `.settingsRecipeName`
  - `.settingsRecipeSteps`
  - `.twitchDot` + `@keyframes twitchPulse`

- [ ] **Step 2: Run lint + type-check**

  ```bash
  npm run lint 2>&1 | head -20
  npm run build 2>&1 | head -20
  ```
  Expected: no errors or warnings about unused CSS classes (CSS Modules don't warn on unused classes, so just ensure TypeScript is clean).

- [ ] **Step 3: Commit**

  ```bash
  git add src/App.module.css
  git commit -m "chore: remove old settings dropdown CSS — replaced by PauseModal"
  ```

---

## Task 5: Manual smoke test

- [ ] **Step 1: Start dev server**

  ```bash
  npm run dev
  ```

- [ ] **Step 2: Open browser and verify**

  1. Start a Free Play game → reach the playing screen.
  2. Click ⚙️ — pause modal should open full-screen.
  3. Timer in StatsBar should be frozen while modal is open.
  4. Toggle Music / SFX / Chat / Bots — each should update state visually (ON/OFF label + color change).
  5. Press Escape → modal closes, game resumes.
  6. Click ⚙️ again → click "▶ Resume Game" → modal closes, game resumes.
  7. Click ⚙️ → click "Exit to Menu" → modal closes and returns to main menu.
  8. Verify recipe list on the right shows all enabled recipes with correct steps.
  9. Open Chat panel (toggle ON in modal) — verify `.settingsWrapperChatOpen` still shifts the gear button left.

- [ ] **Step 3: Final commit if any fixes were needed**

  ```bash
  git add -p
  git commit -m "fix: pause modal smoke test fixes"
  ```
