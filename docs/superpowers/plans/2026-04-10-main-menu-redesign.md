# Main Menu Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign MainMenu to a 2-column Hero Split layout using the full 1440px canvas, with a brand/how-to-play left panel and a Twitch connect + game mode action right panel; rename "Play Levels" to "Adventures" throughout.

**Architecture:** Replace the current narrow centered flex column with a `display: grid; grid-template-columns: 560px 1fr` layout matching the pattern used in LevelSelect, FreePlaySetup, and GameOver. Left column: title, 3-step guide with command cheatsheet, footer. Right column: Twitch connect card, Free Play (featured copper button), Adventures (steel blue button), Tutorial + Options (small bottom row). No prop interface changes — only JSX structure and CSS change.

**Tech Stack:** React 18, TypeScript, CSS Modules, Fredoka/Space Mono fonts, CSS custom properties from `src/theme.css`

---

## File Map

| Action | File | Change |
|--------|------|--------|
| Modify | `src/components/LevelSelect.tsx` | Change h1 text from `"Select Level"` → `"Adventures"` |
| Modify | `src/components/MainMenu.module.css` | Full replacement — 2-column grid + all new component classes |
| Modify | `src/components/MainMenu.tsx` | Full JSX restructure — 2-column Hero Split layout |

---

## Task 1: Rename "Select Level" → "Adventures" in LevelSelect

**Files:**
- Modify: `src/components/LevelSelect.tsx:18`

- [ ] **Step 1: Update the h1 text**

In `src/components/LevelSelect.tsx`, change line 18:
```tsx
// Before
        <h1 className={styles.title}>Select Level</h1>

// After
        <h1 className={styles.title}>Adventures</h1>
```

- [ ] **Step 2: Verify**

Run `npm run dev`, navigate to Level Select. Confirm the left panel title now reads **"Adventures"**.

- [ ] **Step 3: Commit**

```bash
git add src/components/LevelSelect.tsx
git commit -m "feat: rename Level Select screen title to Adventures"
```

---

## Task 2: Rewrite MainMenu.module.css

**Files:**
- Modify: `src/components/MainMenu.module.css` (full replacement)

- [ ] **Step 1: Replace the entire file**

Write the following to `src/components/MainMenu.module.css`:

```css
/* ── Layout ── */

.screen {
  display: grid;
  grid-template-columns: 560px 1fr;
  height: 100%;
  background: var(--bg);
  overflow: hidden;
  box-sizing: border-box;
}

.leftCol {
  display: flex;
  flex-direction: column;
  gap: 22px;
  padding: 40px 48px;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  min-height: 0;
}

.rightCol {
  display: flex;
  flex-direction: column;
  gap: 14px;
  padding: 36px 48px 36px 36px;
  overflow: hidden;
  min-height: 0;
}

/* ── Left panel — title ── */

.title {
  font-family: 'Fredoka', sans-serif;
  font-size: 54px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
  letter-spacing: -1px;
  text-shadow:
    0 4px 0 #8b5a2b,
    -2px -2px 0 #b87333,
     2px -2px 0 #b87333,
    -2px  2px 0 #b87333,
     2px  2px 0 #b87333;
}

.subtitle {
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  color: var(--text-secondary);
  margin-top: 8px;
}

.divider {
  height: 1px;
  background: var(--border);
  flex-shrink: 0;
}

/* ── Left panel — How to play ── */

.sectionLabel {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: var(--text-muted);
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.step {
  display: flex;
  gap: 14px;
  align-items: flex-start;
}

.stepNum {
  background: #b87333;
  color: #fff;
  border-radius: 50%;
  width: 26px;
  height: 26px;
  min-width: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Fredoka', sans-serif;
  font-size: 13px;
  font-weight: 700;
  margin-top: 2px;
  flex-shrink: 0;
}

.stepContent {
  flex: 1;
}

.stepTitle {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  font-weight: 700;
  color: var(--text);
}

.stepDesc {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 3px;
}

/* ── Cheatsheet ── */

.cheatsheet {
  background: #0d0c0b;
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 12px 14px;
  margin-top: 10px;
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 5px 16px;
  align-items: baseline;
}

.csSection {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 1px;
  color: var(--text-faint);
  grid-column: 1 / -1;
  margin-bottom: 2px;
}

.csCmd {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  color: #f0c850;
}

.csDesc {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: var(--text-muted);
}

.csDivider {
  height: 1px;
  background: #2a2624;
  grid-column: 1 / -1;
  margin: 4px 0;
}

/* ── Left panel — footer ── */

.leftFooter {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--text-faint);
  margin-top: auto;
}

/* ── Twitch card ── */

.twitchCard {
  background: #1a1128;
  border: 1.5px solid #9146ff;
  border-radius: 12px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  flex-shrink: 0;
}

.twitchLabel {
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  font-weight: 700;
  color: #9146ff;
  letter-spacing: 0.5px;
}

.twitchForm {
  display: flex;
  gap: 8px;
}

.twitchInput {
  flex: 1;
  background: #2a1f3d;
  border: 1.5px solid #9146ff;
  border-radius: 8px;
  padding: 10px 14px;
  color: #fff;
  font-family: 'Fredoka', sans-serif;
  font-size: 15px;
  outline: none;
}

.twitchInput:focus {
  border-color: #bf94ff;
}

.twitchInput:disabled {
  opacity: 0.6;
}

.twitchConnectBtn {
  background: #9146ff;
  border: none;
  border-radius: 8px;
  padding: 10px 22px;
  color: #fff;
  font-family: 'Fredoka', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s;
  white-space: nowrap;
}

.twitchConnectBtn:hover:not(:disabled) {
  filter: brightness(1.15);
}

.twitchConnectBtn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.twitchDisconnectBtn {
  background: #3d2e55;
  border: 1.5px solid #9146ff;
  border-radius: 8px;
  padding: 10px 18px;
  color: #bf94ff;
  font-family: 'Fredoka', sans-serif;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
  transition: filter 0.15s;
  white-space: nowrap;
}

.twitchDisconnectBtn:hover {
  filter: brightness(1.15);
}

.twitchStatus {
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: 'Fredoka', sans-serif;
  font-size: 12px;
  color: var(--text-secondary);
}

.twitchStatusWarning {
  color: #d8b07c;
}

.twitchDot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #5cb85c;
  flex-shrink: 0;
  animation: twitchPulse 1.5s infinite;
}

.twitchDotWarning {
  background: #d94f4f;
  animation: twitchPulse 1.5s infinite;
}

@keyframes twitchPulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}

.twitchChannel {
  color: #9146ff;
  font-weight: 700;
  font-size: 14px;
}

/* ── Game modes ── */

.modes {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-height: 0;
}

/* Free Play — featured */
.modeFreePlay {
  background: #b87333;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 32px;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s, box-shadow 0.1s;
  flex: 1.6;
  min-height: 0;
  box-shadow: 0 4px 0 #8b5a2b;
  text-align: left;
}

.modeFreePlay:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.modeFreePlay:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #8b5a2b;
}

.fpName {
  font-family: 'Fredoka', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #fff;
  letter-spacing: -0.5px;
  line-height: 1;
}

.fpDesc {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.6);
  margin-top: 6px;
}

.fpArrow {
  font-size: 36px;
  color: rgba(255, 255, 255, 0.4);
  flex-shrink: 0;
}

/* Adventures */
.modeAdventures {
  background: #2c5f8a;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 28px;
  cursor: pointer;
  transition: filter 0.15s, transform 0.1s, box-shadow 0.1s;
  flex: 1;
  min-height: 0;
  box-shadow: 0 4px 0 #1e4366;
  text-align: left;
}

.modeAdventures:hover {
  filter: brightness(1.1);
  transform: translateY(-1px);
}

.modeAdventures:active {
  transform: translateY(2px);
  box-shadow: 0 2px 0 #1e4366;
}

.lvName {
  font-family: 'Fredoka', sans-serif;
  font-size: 30px;
  font-weight: 700;
  color: #fff;
  line-height: 1;
}

.lvDesc {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: rgba(255, 255, 255, 0.5);
  margin-top: 4px;
}

.lvArrow {
  font-size: 28px;
  color: rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

/* Tutorial + Options row */
.modeBottomRow {
  display: flex;
  gap: 10px;
  flex: 0 0 64px;
}

.modeTutorial {
  background: #f0c850;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 1;
  transition: filter 0.15s;
  font-family: 'Fredoka', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: #3d2c11;
}

.modeTutorial:hover {
  filter: brightness(1.07);
}

.modeOptions {
  background: var(--surface);
  border: 1.5px solid var(--border);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  flex: 1;
  transition: border-color 0.15s;
  font-family: 'Fredoka', sans-serif;
  font-size: 22px;
  font-weight: 700;
  color: var(--text-secondary);
}

.modeOptions:hover {
  border-color: #5a5248;
}
```

- [ ] **Step 2: Verify no lint errors**

```bash
npm run lint
```

Expected: 0 errors (2 pre-existing warnings in App.tsx and useGameAudio.ts are acceptable).

- [ ] **Step 3: Commit**

```bash
git add src/components/MainMenu.module.css
git commit -m "feat: rewrite MainMenu CSS for 2-column Hero Split layout"
```

---

## Task 3: Rewrite MainMenu.tsx

**Files:**
- Modify: `src/components/MainMenu.tsx` (full replacement)

- [ ] **Step 1: Replace the entire file**

Write the following to `src/components/MainMenu.tsx`:

```tsx
import { useState } from 'react'
import { TwitchStatus } from '../hooks/useTwitchChat'
import styles from './MainMenu.module.css'

interface Props {
  onPlay: () => void
  onLevels: () => void
  onOptions: () => void
  onTutorial: () => void
  twitchChannel: string | null
  twitchStatus: TwitchStatus
  twitchError: string | undefined
  onTwitchConnect: (channel: string) => void
  onTwitchDisconnect: () => void
}

export default function MainMenu({ onPlay, onLevels, onOptions, onTutorial, twitchChannel, twitchStatus, twitchError, onTwitchConnect, onTwitchDisconnect }: Props) {
  const [twitchInput, setTwitchInput] = useState(twitchChannel || '')
  const isConnected = twitchStatus === 'connected'
  const isConnecting = twitchStatus === 'connecting'

  const handleConnect = () => {
    if (!twitchInput.trim()) return
    onTwitchConnect(twitchInput.trim())
  }

  return (
    <div className={styles.screen}>

      {/* ── LEFT PANEL ── */}
      <div className={styles.leftCol}>

        <div>
          <div className={styles.title}>Let Chat Cook</div>
          <div className={styles.subtitle}>A Livestream Chat Restaurant Game — v0.1</div>
        </div>

        <div className={styles.divider} />

        <div className={styles.steps}>
          <div className={styles.sectionLabel}>How to play</div>

          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Connect your Twitch channel</div>
              <div className={styles.stepDesc}>Your chat becomes the kitchen crew</div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Chat types commands to cook</div>
              <div className={styles.stepDesc}>Each viewer controls one action at a time</div>
              <div className={styles.cheatsheet}>
                <div className={styles.csSection}>Prepare</div>
                <div className={styles.csCmd}>!chop [ingredient]</div><div className={styles.csDesc}>chopping board</div>
                <div className={styles.csCmd}>!grill [ingredient]</div><div className={styles.csDesc}>grill station</div>
                <div className={styles.csCmd}>!fry [ingredient]</div><div className={styles.csDesc}>fryer</div>
                <div className={styles.csCmd}>!boil [ingredient]</div><div className={styles.csDesc}>stove</div>
                <div className={styles.csCmd}>!toast [ingredient]</div><div className={styles.csDesc}>oven</div>
                <div className={styles.csCmd}>!extinguish</div><div className={styles.csDesc}>put out a fire</div>
                <div className={styles.csDivider} />
                <div className={styles.csSection}>Deliver</div>
                <div className={styles.csCmd}>!serve [order#]</div><div className={styles.csDesc}>deliver to a table</div>
              </div>
            </div>
          </div>

          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <div className={styles.stepContent}>
              <div className={styles.stepTitle}>Serve orders before time's up</div>
              <div className={styles.stepDesc}>Earn money, climb the leaderboard</div>
            </div>
          </div>
        </div>

        <div className={styles.divider} />

        <div className={styles.leftFooter}>
          created by THIANzeren &nbsp;·&nbsp; work in progress — progress may reset
        </div>

      </div>

      {/* ── RIGHT PANEL ── */}
      <div className={styles.rightCol}>

        {/* Twitch Connect Card */}
        <div className={styles.twitchCard}>
          <div className={styles.twitchLabel}>TWITCH CONNECT</div>
          <div className={styles.twitchForm}>
            <input
              className={styles.twitchInput}
              value={twitchInput}
              onChange={e => setTwitchInput(e.target.value)}
              placeholder="channel name"
              disabled={isConnecting || isConnected}
              onKeyDown={e => e.key === 'Enter' && handleConnect()}
            />
            {isConnected ? (
              <button className={styles.twitchDisconnectBtn} onClick={onTwitchDisconnect}>
                Disconnect
              </button>
            ) : (
              <button
                className={styles.twitchConnectBtn}
                onClick={handleConnect}
                disabled={isConnecting || !twitchInput.trim()}
              >
                {isConnecting ? '...' : 'Connect'}
              </button>
            )}
          </div>
          {isConnected && twitchChannel && (
            <div className={styles.twitchStatus}>
              <span className={styles.twitchDot} />
              Welcome <span className={styles.twitchChannel}>{twitchChannel}</span> and your community!
            </div>
          )}
          {!isConnected && twitchStatus === 'error' && (
            <div className={`${styles.twitchStatus} ${styles.twitchStatusWarning}`}>
              <span className={`${styles.twitchDot} ${styles.twitchDotWarning}`} />
              {twitchError || 'Connection failed'}
            </div>
          )}
        </div>

        {/* Game modes */}
        <div className={styles.modes}>

          <button className={styles.modeFreePlay} onClick={onPlay}>
            <div>
              <div className={styles.fpName}>Free Play</div>
              <div className={styles.fpDesc}>Pick recipes, set duration &amp; difficulty</div>
            </div>
            <div className={styles.fpArrow}>▶</div>
          </button>

          <button className={styles.modeAdventures} onClick={onLevels}>
            <div>
              <div className={styles.lvName}>Adventures</div>
              <div className={styles.lvDesc}>10 escalating challenges — earn stars on each</div>
            </div>
            <div className={styles.lvArrow}>→</div>
          </button>

          <div className={styles.modeBottomRow}>
            <button className={styles.modeTutorial} onClick={onTutorial}>Tutorial</button>
            <button className={styles.modeOptions} onClick={onOptions}>Options</button>
          </div>

        </div>

      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify lint and build**

```bash
npm run lint && npm run build
```

Expected: 0 errors. The 2 pre-existing warnings in `App.tsx` and `useGameAudio.ts` are acceptable.

- [ ] **Step 3: Commit**

```bash
git add src/components/MainMenu.tsx
git commit -m "feat: redesign MainMenu to 2-column Hero Split layout with Adventures rename"
```

---

## Task 4: Visual verification

- [ ] **Step 1: Run dev server**

```bash
npm run dev
```

- [ ] **Step 2: Check all states**

Navigate to Main Menu and verify:

1. **Layout** — Left panel (560px) shows title, 3-step guide, cheatsheet, footer. Right panel shows Twitch card + 3 mode sections. No overflow, no scrollbar on the page.
2. **Cheatsheet** — All 6 prepare commands visible (`!chop`, `!grill`, `!fry`, `!boil`, `!toast`, `!extinguish`). Divider above Deliver section. `!serve [order#]` shown.
3. **Twitch disconnected** — Input and Connect button visible. No status row shown.
4. **Twitch connecting** — Connect button shows `...` and is disabled. Input disabled.
5. **Twitch connected** — Input disabled, Disconnect button replaces Connect, green dot + "Welcome [channel] and your community!" shown below.
6. **Twitch error** — Red dot + error message shown below input.
7. **Navigation** — Free Play → FreePlaySetup, Adventures → LevelSelect (now titled "Adventures"), Tutorial → modal, Options → OptionsScreen.
8. **LevelSelect title** — Left column h1 reads "Adventures" not "Select Level".
9. **Hover states** — Free Play button lifts on hover, Adventures button lifts on hover, Tutorial brightens, Options border highlights.
