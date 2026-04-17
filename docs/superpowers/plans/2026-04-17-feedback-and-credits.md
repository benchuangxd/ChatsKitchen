# Feedback Modal & Credits Screen Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Feedback button (opens a Tally embed modal) and a Credits button (opens a full-screen credits page) to the Main Menu's Options row.

**Architecture:** `FeedbackModal` is a self-contained overlay rendered from `App.tsx` via a `showFeedback` boolean; no new screen route needed. `CreditsScreen` follows the `OptionsScreen` pattern — a new `'credits'` value is added to the `Screen` union and rendered conditionally in `App.tsx`. Both are triggered by two new props (`onFeedback`, `onCredits`) added to `MainMenu`.

**Tech Stack:** React 18, TypeScript (strict), CSS Modules, Vite 5. No new dependencies.

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/components/FeedbackModal.tsx` | Create | Modal overlay with Tally iframe embed and script injection |
| `src/components/FeedbackModal.module.css` | Create | Backdrop + panel styles, z-index layering |
| `src/components/CreditsScreen.tsx` | Create | Full-screen credits page with back button and 3 sections |
| `src/components/CreditsScreen.module.css` | Create | Credits layout and section styles |
| `src/components/MainMenu.tsx` | Modify | Add `onFeedback`/`onCredits` props; expand Options row to 3 buttons |
| `src/App.tsx` | Modify | Add `'credits'` to Screen union; add `showFeedback` state; wire new props; render new components |

> **Note on `FeedbackModal` z-index:** The modal uses `z-index: 300` (matching `PauseModal`) safely because `FeedbackModal` is only reachable from the `'menu'` screen, where `PauseModal` is never rendered. No conflict is possible.

---

## Task 1: Create `FeedbackModal` component

**Files:**
- Create: `src/components/FeedbackModal.tsx`
- Create: `src/components/FeedbackModal.module.css`

- [ ] **Step 1: Create `FeedbackModal.tsx`**

```tsx
// src/components/FeedbackModal.tsx
import { useEffect } from 'react'
import styles from './FeedbackModal.module.css'

declare global {
  interface Window {
    Tally?: { loadEmbeds: () => void }
  }
}

interface Props {
  onClose: () => void
}

export default function FeedbackModal({ onClose }: Props) {
  useEffect(() => {
    const TALLY_SRC = 'https://tally.so/widgets/embed.js'
    if (window.Tally) {
      window.Tally.loadEmbeds()
    } else if (!document.querySelector(`script[src="${TALLY_SRC}"]`)) {
      const s = document.createElement('script')
      s.src = TALLY_SRC
      s.onload = () => window.Tally?.loadEmbeds()
      s.onerror = () => window.Tally?.loadEmbeds()
      document.body.appendChild(s)
    }
  }, [])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.panel} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
        <iframe
          data-tally-src="https://tally.so/embed/Bzb124?alignLeft=1&hideTitle=1&transparentBackground=1&dynamicHeight=1"
          loading="lazy"
          width="100%"
          height={753}
          style={{ border: 'none', margin: 0 }}
          title="Let Chat Cook - Feedback"
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `FeedbackModal.module.css`**

```css
/* src/components/FeedbackModal.module.css */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 300;
}

.panel {
  position: relative;
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 14px;
  width: min(560px, 90vw);
  max-height: 85vh;
  overflow-y: auto;
  padding: 24px;
  z-index: 301;
}

.closeBtn {
  position: absolute;
  top: 12px;
  right: 14px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-size: 18px;
  cursor: pointer;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background 0.15s;
}

.closeBtn:hover {
  background: var(--border);
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors related to `FeedbackModal`.

- [ ] **Step 4: Commit**

```bash
git add src/components/FeedbackModal.tsx src/components/FeedbackModal.module.css
git commit -m "feat: add FeedbackModal with Tally embed"
```

---

## Task 2: Create `CreditsScreen` component

**Files:**
- Create: `src/components/CreditsScreen.tsx`
- Create: `src/components/CreditsScreen.module.css`

- [ ] **Step 1: Create `CreditsScreen.tsx`**

```tsx
// src/components/CreditsScreen.tsx
import styles from './CreditsScreen.module.css'

interface Props {
  onBack: () => void
}

export default function CreditsScreen({ onBack }: Props) {
  return (
    <div className={styles.screen}>
      <button className={styles.backBtn} onClick={onBack}>← Back</button>
      <h1 className={styles.title}>Credits</h1>

      <div className={styles.content}>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Contributors</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <span className={styles.name}>THIANzeren</span>
              <span className={styles.role}>Game Design & Development</span>
            </li>
            <li className={styles.item}>
              <span className={styles.name}>[Contributor Name]</span>
              <span className={styles.role}>[Role]</span>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Art Credits</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <span className={styles.name}>[Artist Name]</span>
              <span className={styles.role}>[Asset description]</span>
            </li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Music Credits</h2>
          <ul className={styles.list}>
            <li className={styles.item}>
              <span className={styles.name}>[Track Title]</span>
              <span className={styles.role}>[Artist / Source]</span>
            </li>
          </ul>
        </section>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Create `CreditsScreen.module.css`**

```css
/* src/components/CreditsScreen.module.css */
.screen {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--bg);
  padding: 80px 56px 40px; /* top padding clears the absolute back button */
  box-sizing: border-box;
  position: relative;
}

.backBtn {
  position: absolute;
  top: 32px;
  left: 56px;
  background: none;
  border: none;
  color: var(--text-secondary);
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 10px;
  border-radius: 6px;
  transition: background 0.15s;
}

.backBtn:hover {
  background: var(--surface);
}

.title {
  font-family: 'Fredoka', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  margin: 0 0 32px 0;
  text-align: center;
}

.content {
  flex: 1;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 36px;
  max-width: 640px;
  margin: 0 auto;
  width: 100%;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.sectionTitle {
  font-family: 'Fredoka', sans-serif;
  font-size: 22px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 0;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.item {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
}

.name {
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  color: #fff;
}

.role {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--text-secondary);
  text-align: right;
}
```

- [ ] **Step 3: Verify build passes**

```bash
npm run build
```

Expected: no TypeScript errors related to `CreditsScreen`.

- [ ] **Step 4: Commit**

```bash
git add src/components/CreditsScreen.tsx src/components/CreditsScreen.module.css
git commit -m "feat: add CreditsScreen with placeholder content"
```

---

## Task 3: Update `MainMenu` and `App.tsx` atomically

**Files:**
- Modify: `src/components/MainMenu.tsx`
- Modify: `src/App.tsx`

> These two changes are done together in one task so the build is never left in a broken state. `MainMenu` adds new required props; `App.tsx` must provide them in the same commit.

- [ ] **Step 1: Add `onFeedback` and `onCredits` to the `Props` interface and function signature in `MainMenu.tsx`**

In `src/components/MainMenu.tsx`, update the `Props` interface (lines 5–16) and the function signature (line 18):

```tsx
interface Props {
  onPlay: () => void
  onAdventure: () => void
  onOptions: () => void
  onFeedback: () => void
  onCredits: () => void
  onTutorial: () => void
  onStartTutorial: () => void
  twitchChannel: string | null
  twitchStatus: TwitchStatus
  twitchError: string | undefined
  onTwitchConnect: (channel: string) => void
  onTwitchDisconnect: () => void
}

export default function MainMenu({ onPlay, onAdventure, onOptions, onFeedback, onCredits, onTutorial, onStartTutorial, twitchChannel, twitchStatus, twitchError, onTwitchConnect, onTwitchDisconnect }: Props) {
```

- [ ] **Step 2: Expand the Options `modeBottomRow` to 3 buttons**

Replace the bottom `modeBottomRow` div (lines 163–165) with:

```tsx
<div className={styles.modeBottomRow}>
  <button className={styles.modeOptions} onClick={onOptions}>Options</button>
  <button className={styles.modeOptions} onClick={onFeedback}>Feedback</button>
  <button className={styles.modeOptions} onClick={onCredits}>Credits</button>
</div>
```

- [ ] **Step 3: Add `'credits'` to the `Screen` union type in `App.tsx` (line 34)**

```ts
type Screen = 'menu' | 'adventurebriefing' | 'options' | 'freeplaysetup' | 'countdown' | 'playing' | 'shiftend' | 'gameover' | 'adventureshiftpassed' | 'adventurerunend' | 'credits'
```

- [ ] **Step 4: Add imports for the two new components at the top of `App.tsx` (after existing component imports)**

```tsx
import FeedbackModal from './components/FeedbackModal'
import CreditsScreen from './components/CreditsScreen'
```

- [ ] **Step 5: Add `showFeedback` state near other local state declarations in `App.tsx`**

```ts
const [showFeedback, setShowFeedback] = useState(false)
```

- [ ] **Step 6: Add `onFeedback` and `onCredits` props to the `<MainMenu />` render block (around line 489–503)**

```tsx
<MainMenu
  onPlay={() => handleMenuPlay('freeplaysetup')}
  onAdventure={startAdventure}
  onOptions={() => setScreen('options')}
  onFeedback={() => setShowFeedback(true)}
  onCredits={() => setScreen('credits')}
  onTutorial={handleMenuTutorial}
  onStartTutorial={startTutorial}
  twitchChannel={twitchChannel}
  twitchStatus={twitchChat.status}
  twitchError={twitchChat.error}
  onTwitchConnect={(ch) => setTwitchChannel(ch)}
  onTwitchDisconnect={() => setTwitchChannel(null)}
/>
```

- [ ] **Step 7: Add the `CreditsScreen` branch to the screen conditional chain (after the `'options'` branch around line 513)**

```tsx
} else if (screen === 'credits') {
  content = <CreditsScreen onBack={() => setScreen('menu')} />
```

- [ ] **Step 8: Render `FeedbackModal` conditionally — add near other modal renders at the end of the return JSX**

```tsx
{showFeedback && <FeedbackModal onClose={() => setShowFeedback(false)} />}
```

- [ ] **Step 9: Verify full build passes with no TypeScript errors**

```bash
npm run build
```

Expected: clean build, no errors.

- [ ] **Step 10: Commit**

```bash
git add src/components/MainMenu.tsx src/App.tsx
git commit -m "feat: wire FeedbackModal and CreditsScreen into App and MainMenu"
```

---

## Task 4: Manual smoke test

No automated tests exist in this codebase. Verify the following manually in the browser (`npm run dev`):

- [ ] Main menu renders — Options row now shows **Options**, **Feedback**, **Credits** buttons side by side
- [ ] Clicking **Feedback** opens the modal overlay; Tally form loads inside it
- [ ] Clicking the **✕** button closes the modal
- [ ] Clicking the backdrop (outside the panel) closes the modal
- [ ] Re-opening Feedback does not append duplicate `<script>` tags (check DevTools → Elements → `<body>`)
- [ ] Clicking **Credits** navigates to the credits screen
- [ ] Credits screen shows all 3 sections (Contributors, Art Credits, Music Credits) with placeholder text
- [ ] **← Back** button on credits screen returns to the main menu
- [ ] All other main menu buttons (Tutorial, How To Play, Free Play, Adventure, Options) still work correctly

- [ ] **Commit if any fixes were made during testing**

---

## Task 5: Push and raise PR

- [ ] **Push branch to remote**

```bash
git push -u origin feat/feedback-and-credits
```

- [ ] **Raise PR**

```bash
gh pr create --title "feat: feedback modal and credits screen" --body "$(cat <<'EOF'
## Summary
- Adds **Feedback** button to the Options row in Main Menu — opens a Tally form modal overlay
- Adds **Credits** button to the Options row — navigates to a new Credits screen
- Credits screen shows Contributors, Art Credits, Music Credits sections (placeholder content)

## Test plan
- [ ] Options row shows three buttons: Options, Feedback, Credits
- [ ] Feedback modal opens, Tally form loads, backdrop + ✕ both close it
- [ ] No duplicate script tags on re-open (check DevTools)
- [ ] Credits screen renders all 3 sections and back button works
- [ ] Existing menu buttons unaffected

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```
