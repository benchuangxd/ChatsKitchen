# Station Readability Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cramped fixed-width text-row slot layout in cooking stations with a bar-dominant design where each slot is a 28px-tall progress bar with username, ingredient, and status overlaid inside it.

**Architecture:** Two files only — `Station.module.css` (rewrite slot styles) and `Station.tsx` (rewrite `SlotRow` component). The bar becomes the primary visual unit for all three slot states: cooking (bar fills with colour), done (bar full, pulses gold or red), on fire (full red/orange pulsing bar). Game logic and state are untouched.

**Tech Stack:** React 18, TypeScript (strict), CSS Modules, Vite 5. No test framework — verification is visual via `npm run dev`.

---

## File Map

| File | Change |
|------|--------|
| `src/components/Station.module.css` | Rewrite slot classes: remove old fixed-width row classes, add bar-dominant classes |
| `src/components/Station.tsx` | Rewrite `SlotRow` to render bar structure for all three states |

No other files change.

---

### Task 1: Create feature branch

**Files:** none (git only)

- [ ] **Step 1: Create and switch to feature branch**

```bash
git checkout -b feat/station-readability
```

Expected: `Switched to a new branch 'feat/station-readability'`

---

### Task 2: Rewrite Station.module.css

**Files:**
- Modify: `src/components/Station.module.css`

Replace all slot-related classes. Station-level classes (`.station`, `.fire`, `.label`, `.capacity`, `.idleStatus`, `.slots`, `@keyframes fireFlash`, responsive block) are **kept unchanged**. Only the slot-level section is replaced.

- [ ] **Step 1: Open `src/components/Station.module.css` and locate the slot section**

The slot section starts at `.slot {` (after `.slots {`) and runs to the end of the file (including the `@media` block's slot overrides). You will replace everything from `.slot {` to the end of the file with the new code below.

- [ ] **Step 2: Replace the slot section with the new bar-dominant styles**

Remove these classes entirely (they will no longer exist):
- `.slot` old flex rule, `.slot:first-child`
- `.slotUser`, `.slotItem`
- `.progressBg`, `.progressFill`
- `.slotPct`
- `.slotDone` (old empty rule)
- `.slotDoneLabel`, `.burnLabel`
- `.slotOnFire`, `@keyframes slotFireFlash`
- `.slotFireLabel`
- The `@media (max-width: 480px)` slot overrides for `.slotUser` and `.slotItem`

Add this in their place (append after `.slots {}`):

```css
/* ── Slot wrapper ──────────────────────────────── */
.slot {
  margin-bottom: 6px;
}

/* ── Bar shell (cooking + done states) ──────────── */
.slotBar {
  position: relative;
  height: 28px;
  border-radius: 7px;
  overflow: hidden;
}

.barBg {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  border-radius: 7px;
}

.barFill {
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  border-radius: 7px;
  transition: width 0.1s linear;
}

.barText {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  padding: 0 10px;
  gap: 8px;
  z-index: 2;
}

.barUser {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  font-weight: 700;
  flex-shrink: 0;
  max-width: 95px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.barItem {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: #fff;
  opacity: 0.9;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

.barRight {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  flex-shrink: 0;
  text-shadow: 0 1px 3px rgba(0, 0, 0, 0.9);
}

/* ── Done state — gold pulse ─────────────────────── */
.slotDone {
  border-radius: 7px;
  animation: donePulse 1.2s ease-in-out infinite;
}

/* ── Danger state — red pulse (faster) ───────────── */
.slotDanger {
  border-radius: 7px;
  animation: dangerPulse 0.6s ease-in-out infinite;
}

@keyframes donePulse {
  0%, 100% { box-shadow: 0 0 0 rgba(240, 200, 80, 0); }
  50%       { box-shadow: 0 0 12px rgba(240, 200, 80, 0.6); }
}

@keyframes dangerPulse {
  0%, 100% { box-shadow: 0 0 0 rgba(217, 79, 79, 0); }
  50%       { box-shadow: 0 0 12px rgba(217, 79, 79, 0.7); }
}

/* ── Fire state ──────────────────────────────────── */
.fireBar {
  position: relative;
  height: 28px;
  border-radius: 7px;
  overflow: hidden;
  background: linear-gradient(
    90deg,
    rgba(217, 79, 79, 0.95)  0%,
    rgba(232, 148, 58, 0.9)  50%,
    rgba(217, 79, 79, 0.95)  100%
  );
  animation: firePulse 0.5s ease-in-out infinite;
}

@keyframes firePulse {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.65; }
}
```

Also update the `@media (max-width: 480px)` block — remove the `.slotUser` and `.slotItem` overrides. The responsive block should now only contain the `.station` min-width rule:

```css
@media (max-width: 480px) {
  .station {
    min-width: 200px;
  }
}
```

- [ ] **Step 3: Verify the build compiles**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
```

Expected: build succeeds (CSS-only change, no TS errors). Ignore any warnings about unused CSS classes — those will be cleared in Task 3.

---

### Task 3: Rewrite SlotRow in Station.tsx

**Files:**
- Modify: `src/components/Station.tsx`

Replace the entire `SlotRow` function body. The function signature, imports, `hashStr`, and `Station` component are unchanged.

- [ ] **Step 1: Locate the `SlotRow` function in `src/components/Station.tsx`**

It starts at line 11: `function SlotRow({ slot, stationId }...` and ends at line 72 (closing `}`).

- [ ] **Step 2: Replace the full SlotRow function with the new implementation**

```tsx
function SlotRow({ slot, stationId }: { slot: StationSlot; stationId: string }) {
  const now = Date.now()
  const elapsed = now - slot.cookStart
  const progress = slot.cookDuration > 0 ? Math.min(1, elapsed / slot.cookDuration) : 0
  const burnRatio = slot.burnAt > 0 && slot.burnAt < Infinity ? elapsed / slot.burnAt : 0

  const nameColor = NAME_COLORS[Math.abs(hashStr(slot.user)) % NAME_COLORS.length]

  // ── On fire ──────────────────────────────────────────────────────────────
  if (slot.state === 'onFire') {
    return (
      <div className={styles.slot}>
        <div className={styles.fireBar}>
          <div className={styles.barText}>
            <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
            <span className={styles.barItem}>🔥 !extinguish {stationId.replace(/_/g, ' ')}</span>
          </div>
        </div>
      </div>
    )
  }

  // ── Done (take it!) ───────────────────────────────────────────────────────
  if (slot.state === 'done') {
    const burnWindow = slot.burnAt - slot.cookDuration
    const burnElapsed = Math.max(0, elapsed - slot.cookDuration)
    const burnProgress = slot.burnAt < Infinity && burnWindow > 0
      ? Math.min(1, burnElapsed / burnWindow)
      : 0
    const isDanger = burnProgress >= 0.5

    return (
      <div className={`${styles.slot} ${isDanger ? styles.slotDanger : styles.slotDone}`}>
        <div className={styles.slotBar}>
          <div className={styles.barBg} />
          <div
            className={styles.barFill}
            style={{ width: '100%', background: isDanger ? 'rgba(217,79,79,0.55)' : 'rgba(240,200,80,0.38)' }}
          />
          <div className={styles.barText}>
            <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
            <span className={styles.barItem}>{slot.target.replace(/_/g, ' ')}</span>
            <span className={styles.barRight} style={{ color: isDanger ? '#ff8080' : '#f0c850' }}>
              {isDanger ? '⚠ TAKE IT!' : '✓ DONE'}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // ── Cooking ───────────────────────────────────────────────────────────────
  const barColor = burnRatio > 0.85
    ? 'rgba(217,79,79,0.55)'
    : burnRatio > 0.65
      ? 'rgba(232,148,58,0.55)'
      : 'rgba(92,184,92,0.42)'

  return (
    <div className={styles.slot}>
      <div className={styles.slotBar}>
        <div className={styles.barBg} />
        <div
          className={styles.barFill}
          style={{ width: `${Math.floor(progress * 100)}%`, background: barColor }}
        />
        <div className={styles.barText}>
          <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
          <span className={styles.barItem}>{slot.target.replace(/_/g, ' ')}</span>
          <span className={styles.barRight} style={{ color: 'rgba(255,255,255,0.55)' }}>
            {Math.floor(progress * 100)}%
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Verify build and lint**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build && npm run lint
```

Expected: zero TypeScript errors, zero lint errors. Build output shows `✓ built in Xs`.

- [ ] **Step 4: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && git add src/components/Station.tsx src/components/Station.module.css && git commit -m "feat: bar-dominant station slots for broadcast readability"
```

---

### Task 4: Visual verification

**Files:** none (read-only dev server)

- [ ] **Step 1: Start the dev server**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run dev
```

Open the game in the browser and enable bot simulation (OptionsScreen).

- [ ] **Step 2: Verify cooking state**

Start a game with bots. Watch a cooking station (e.g. Grill). Confirm:
- Each slot is a 28px-tall bar (not a text row)
- Bar fills left to right as cooking progresses
- Colour is green early, shifts to orange then red as burnAt approaches
- Username shows on the left (coloured), ingredient name in the middle, `XX%` on the right

- [ ] **Step 3: Verify done state**

Wait for a slot to finish cooking. Confirm:
- Bar stays full (no draining)
- Gold fill with pulsing gold glow
- Right label shows `✓ DONE` in gold
- After passing 50% of burn window: bar turns red, glow pulses faster, label changes to `⚠ TAKE IT!`

- [ ] **Step 4: Verify fire state**

Let a done slot expire without taking. Confirm:
- Bar becomes full-width pulsing red/orange gradient
- Left: username, Right: `🔥 !extinguish [station name]`
- No separate text rows visible

- [ ] **Step 5: Verify scale (10 slots)**

In OptionsScreen, set station capacity high and spawn many bots. Confirm 10 simultaneous slots on one station remain readable — bars stack vertically, text truncates gracefully, no horizontal overflow.

---

## Verification Summary

| Check | Command | Expected |
|-------|---------|----------|
| TypeScript | `npm run build` | Zero errors |
| Lint | `npm run lint` | Zero errors |
| Visual | `npm run dev` + bots | All 4 states render correctly |
