# Readability Overhaul — Order Tickets & Prepped Ingredients

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve readability of order tickets and prepped ingredient pills for streaming/broadcast contexts by enlarging emojis, adding ingredient name labels to tickets, and redesigning the prep pill layout.

**Architecture:** CSS-only visual changes to two isolated component modules (`OrderTicket`, `PreparedItems`). Both `.module.css` files are fully rewritten; `.tsx` files receive minimal structural edits (new wrapper element, changed inline style, updated count render). All game logic, animations, and other components are untouched.

**Tech Stack:** React 18, TypeScript (strict), CSS Modules, Vite 5. No test framework — verification is visual (`npm run dev`) + type/lint (`npm run build`, `npm run lint`).

---

## File Map

| File | Change |
|------|--------|
| `src/components/OrderTicket.module.css` | Full rewrite — new ticket aesthetic, punch hole `::before`, perforated tear `::after`, urgency gradient classes, enlarged ingredient tiles. Preserve all animation `@keyframes` and outcome classes. |
| `src/components/OrderTicket.tsx` | Remove `backgroundColor` inline style from header; add `ingredientTile` + `ingredientName` elements inside ingredient loop. |
| `src/components/PreparedItems.module.css` | Full rewrite of pill shape, emoji/count/name sizes. Add `.prepText` class. |
| `src/components/PreparedItems.tsx` | Wrap count+name in `.prepText` div; always render `×N` count. |

---

## Task 1: OrderTicket CSS Rewrite

**Files:**
- Modify: `src/components/OrderTicket.module.css`

### Context

The current file has:
- `.ticket` with `overflow: hidden` (must remove — it clips the new `::before` punch hole)
- `::after` with a zigzag pattern (must be fully replaced by a radial-gradient dot strip)
- `.header` styled only inline in TSX via `backgroundColor` (CSS classes for gradients will be added here)
- `.ingredientEmoji` at 20px (increasing to 24px)
- `.ingredientName` class in `@media` block — dead code, do not carry over

All `@keyframes` and outcome animation classes (`.ticketServed`, `.ticketLost`, `.moneyFloat`, `.fireOverlay`) must be copied verbatim into the new file.

- [ ] **Step 1: Rewrite `OrderTicket.module.css`**

Replace the entire file with the following. The animation blocks (`@keyframes` + `.ticketServed`, `.ticketLost`, `.moneyFloat`, `.fireOverlay`) are copied unchanged from the existing file.

```css
/* ── Wrapper (unchanged) ───────────────────── */
.ticketWrapper {
  position: relative;
  display: inline-block;
}

/* ── Ticket shell ──────────────────────────── */
.ticket {
  width: 172px;
  position: relative;          /* required for ::before punch hole */
  border-radius: 10px 10px 0 0;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.55), 0 1px 0 rgba(255, 255, 255, 0.06);
  background: #f5f0e8;
  /* NOTE: no overflow: hidden — removed so ::before is not clipped */
}

/* Punch hole at top centre */
.ticket::before {
  content: '';
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 13px;
  height: 13px;
  background: var(--bg-dark);  /* matches page background; adapts to light/dark theme */
  border-radius: 50%;
  z-index: 3;
  border: 2px solid rgba(0, 0, 0, 0.12);
}

/* Perforated tear strip at bottom (replaces old zigzag ::after entirely) */
.ticket::after {
  content: '';
  display: block;
  height: 11px;
  background-color: #f5f0e8;
  background-image: radial-gradient(circle, var(--bg-dark) 3.5px, transparent 3.5px);
  background-size: 16px 11px;
  background-position: 4px center;
  border-top: 1px dashed rgba(0, 0, 0, 0.13);
}

/* ── Urgency states ─────────────────────────── */
/* Header gradient — driven by urgency CSS class on .ticket */
.normal   .header { background: linear-gradient(160deg, #4ea854, #3a8a40); }
.warning  .header { background: linear-gradient(160deg, #e06840, #c85030); }
.critical .header { background: linear-gradient(160deg, #d94f4f, #b83030); }

/* Body tint on urgency (unchanged colours, now explicit per-state) */
.critical .body { background: #f5e8e8; }
.warning  .body { background: #f5f0e0; }
.normal   .body { background: #f5f0e8; }

/* ── Header ─────────────────────────────────── */
.header {
  border-radius: 10px 10px 0 0;
  padding: 17px 10px 8px;          /* extra top padding clears the punch hole */
  font-family: 'Lilita One', cursive;
  font-size: 20px;
  color: #fff;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.4);
  text-align: center;
  line-height: 1.2;
}

/* ── Body ───────────────────────────────────── */
.body {
  background: #f5f0e8;
  padding: 7px 9px 8px;
}

/* ── Ingredient row ─────────────────────────── */
/* flex-wrap: nowrap keeps all tiles on one line (max 3 ingredients across all recipes) */
.ingredients {
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 4px;
}

.ingredientTile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  background: rgba(0, 0, 0, 0.06);
  border-radius: 7px;
  padding: 4px 5px;
  flex: 1;
  min-width: 0;          /* allows tiles to shrink below their content width */
}

.ingredientEmoji {
  font-size: 24px;
  line-height: 1;
}

.ingredientName {
  font-size: 8.5px;
  font-family: 'Space Mono', monospace;
  color: #5a5040;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
  text-align: center;
}

/* ── Patience bar ───────────────────────────── */
.patienceBg {
  background: rgba(0, 0, 0, 0.12);
  border-radius: 4px;
  height: 9px;
  overflow: hidden;
  margin-top: 6px;
}

.patienceFill {
  height: 100%;
  border-radius: 4px;
  transition: width 0.1s linear;
}

/* ── Outcome animations (copied verbatim from original) ─────────── */

@keyframes ticketServedOut {
  0%   { opacity: 1; transform: scale(1); }
  30%  { opacity: 0.7; transform: scale(1.06); }
  100% { opacity: 0; transform: scale(1.15); }
}
.ticketServed {
  animation: ticketServedOut 1s ease-out forwards;
  pointer-events: none;
}

@keyframes moneyFloatUp {
  0%   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
  20%  { opacity: 1; transform: translate(-50%, calc(-50% - 12px)) scale(1.1); }
  100% { opacity: 0; transform: translate(-50%, calc(-50% - 60px)) scale(0.9); }
}
.moneyFloat {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-family: 'Fredoka', sans-serif;
  font-size: 42px;
  font-weight: 700;
  color: #4cd964;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.5), 0 0 12px rgba(76, 217, 100, 0.6);
  white-space: nowrap;
  pointer-events: none;
  z-index: 10;
  animation: moneyFloatUp 1s ease-out forwards;
}

@keyframes ticketLostShake {
  0%   { transform: translateX(0);    filter: brightness(1); }
  10%  { transform: translateX(-4px); filter: brightness(0.85); }
  20%  { transform: translateX(4px);  filter: brightness(0.7); }
  30%  { transform: translateX(-3px); filter: brightness(0.55); }
  40%  { transform: translateX(3px);  filter: brightness(0.4); }
  55%  { transform: translateX(-1px); filter: brightness(0.3); }
  70%  { transform: translateX(1px);  filter: brightness(0.2) sepia(0.6) hue-rotate(-20deg); }
  100% { transform: translateX(0);    filter: brightness(0.1) sepia(1) hue-rotate(-20deg); opacity: 0.15; }
}
.ticketLost {
  animation: ticketLostShake 1s ease-in forwards;
  pointer-events: none;
}

@keyframes fireSweepUp {
  0%   { clip-path: inset(100% 0 0 0); opacity: 0.9; }
  15%  { clip-path: inset(85% 0 0 0);  opacity: 1; }
  60%  { clip-path: inset(20% 0 0 0);  opacity: 1; }
  100% { clip-path: inset(0% 0 0 0);   opacity: 0.85; }
}
@keyframes fireFlicker {
  0%, 100% { background-position: 0% 100%; }
  50%       { background-position: 100% 0%; }
}
.fireOverlay {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    160deg,
    rgba(255, 80, 0, 0.75)  0%,
    rgba(255, 160, 0, 0.6)  20%,
    rgba(255, 60, 0, 0.8)   40%,
    rgba(200, 30, 0, 0.65)  60%,
    rgba(255, 120, 0, 0.7)  80%,
    rgba(255, 80, 0, 0.75)  100%
  );
  background-size: 200% 200%;
  animation:
    fireSweepUp  1s ease-in        forwards,
    fireFlicker  0.25s ease-in-out infinite;
}

/* ── Responsive ──────────────────────────────── */
@media (max-width: 480px) {
  .ticket {
    width: auto;
    min-width: 140px;
  }

  .header {
    font-size: 18px;
  }
}
```

- [ ] **Step 2: Verify no TypeScript errors**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | head -30
```

Expected: build succeeds (exit 0). If CSS module class name errors appear, check that class names in the new CSS match those referenced in `OrderTicket.tsx` (`.header`, `.body`, `.ingredients`, `.ingredientEmoji`, `.patienceBg`, `.patienceFill`, `.ticket`, `.ticketWrapper`, `.ticketServed`, `.ticketLost`, `.moneyFloat`, `.fireOverlay`, `.normal`, `.warning`, `.critical`).

---

## Task 2: OrderTicket TSX Update

**Files:**
- Modify: `src/components/OrderTicket.tsx`

### Context

Three changes needed:
1. Remove `backgroundColor` from header's inline style (gradient is now set via CSS urgency class)
2. Replace bare `<span className={styles.ingredientEmoji}>` with a tile `<div>` containing emoji + name
3. Remove the `.divider` element (the new design has no dashed divider between header and ingredients — the visual separation comes from the cream body area itself)

The patience fill still uses `style={{ backgroundColor: barColor }}` — this is intentional, keep it.

`barColor` is still needed (for the fill bar). `urgencyClass` is unchanged.

- [ ] **Step 1: Update `src/components/OrderTicket.tsx`**

Replace the file contents with:

```tsx
import { Order } from '../state/types'
import { RECIPES, INGREDIENT_EMOJI } from '../data/recipes'
import styles from './OrderTicket.module.css'

interface Props {
  order: Order
}

const STRIP_PREFIX = /^(chopped|grilled|fried|boiled|roasted)_/

export default function OrderTicket({ order }: Props) {
  const recipe = RECIPES[order.dish]
  const urgency = order.patienceLeft / order.patienceMax
  const barColor = urgency < 0.25 ? '#d94f4f' : urgency < 0.5 ? '#e8943a' : '#5aad5e'
  const urgencyClass = urgency < 0.25 ? styles.critical : urgency < 0.5 ? styles.warning : styles.normal

  const isServed = order.outcome === 'served'
  const isLost = order.outcome === 'lost'
  const reward = recipe.reward + Math.max(0, Math.floor((order.patienceLeft / order.patienceMax) * 30))
  const outcomeClass = isServed ? styles.ticketServed : isLost ? styles.ticketLost : ''

  return (
    <div className={styles.ticketWrapper}>
      <div className={`${styles.ticket} ${urgencyClass} ${outcomeClass}`}>
        <div className={styles.header}>
          #{order.id} {recipe.emoji} {recipe.name}
        </div>
        <div className={styles.body}>
          <div className={styles.ingredients}>
            {recipe.plate.map((item, i) => (
              <div key={i} className={styles.ingredientTile}>
                <span className={styles.ingredientEmoji}>{INGREDIENT_EMOJI[item] || '?'}</span>
                <span className={styles.ingredientName}>
                  {item.replace(STRIP_PREFIX, '')}
                </span>
              </div>
            ))}
          </div>
          <div className={styles.patienceBg}>
            <div
              className={styles.patienceFill}
              style={{ width: `${urgency * 100}%`, backgroundColor: barColor }}
            />
          </div>
        </div>
        {isLost && <div className={styles.fireOverlay} />}
      </div>
      {isServed && <div className={styles.moneyFloat}>+${reward}</div>}
    </div>
  )
}
```

**What changed vs original:**
- `STRIP_PREFIX` regex constant extracted at module level (avoids re-creating on every render)
- Header `<div>` no longer has `style={{ backgroundColor: barColor }}` — gradient comes from CSS urgency class
- `.divider` div removed
- Each ingredient is now a `<div className={styles.ingredientTile}>` containing emoji `<span>` + name `<span>`

- [ ] **Step 2: Run build + lint**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -10 && npm run lint 2>&1 | tail -10
```

Expected: `✓ built in` message, zero lint errors/warnings.

- [ ] **Step 3: Visual check in browser**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run dev
```

Open the game and start playing. Verify:
- Tickets have cream body, coloured gradient header, punch hole at top, perforated tear strip at bottom
- Ingredients stay on one row (test Burger / Pasta / Fish Burger — all 3-ingredient)
- Each ingredient shows emoji above a tiny name label
- Patience bar changes colour green → orange → red as patience depletes
- Urgency header colour changes green → orange → red
- Serving a dish plays the fade-out + money float animation correctly
- A dish expiring plays the shake + fire overlay animation correctly

- [ ] **Step 4: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && git add src/components/OrderTicket.module.css src/components/OrderTicket.tsx && git commit -m "feat: redesign order tickets for broadcast readability"
```

---

## Task 3: PreparedItems CSS Rewrite

**Files:**
- Modify: `src/components/PreparedItems.module.css`

### Context

The new pill design:
- Larger emoji (26px, up from 20px)
- Count + name stacked vertically in a `.prepText` wrapper
- Count in Lilita One 18px gold
- Name in Space Mono 10px uppercase
- Pill border: 2px solid gold when filled; `rgba(255,255,255,0.10)` when empty
- Empty pills at `opacity: 0.38`

The `.header`, `.divider`, and `.toggle` classes are unchanged — only the pill and content classes change.

- [ ] **Step 1: Rewrite `src/components/PreparedItems.module.css`**

Replace the entire file with:

```css
.prep {
  padding: 8px 24px 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.06);
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-bottom: 8px;
}

.divider {
  font-family: 'Lilita One', cursive;
  font-size: 22px;
  color: #f0c850;
  padding: 0;
}

.toggle {
  background: none;
  border: 1px solid #f0c85044;
  border-radius: 4px;
  padding: 2px 8px;
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  color: #9a8e82;
  cursor: pointer;
  transition: color 0.15s, border-color 0.15s;
}

.toggle:hover {
  color: #f0c850;
  border-color: #f0c850;
}

.items {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

/* ── Pill shape ─────────────────────────────── */
.tray {
  display: flex;
  align-items: center;
  gap: 7px;
  border-radius: 12px;
  padding: 5px 12px 5px 8px;
  transition: background 0.2s, border-color 0.2s, opacity 0.2s;
}

.trayFilled {
  background: rgba(240, 200, 80, 0.08);
  border: 2px solid #f0c850;
  box-shadow: 0 0 8px rgba(240, 200, 80, 0.10);
}

.trayEmpty {
  background: rgba(255, 255, 255, 0.02);
  border: 2px solid rgba(255, 255, 255, 0.10);
  opacity: 0.38;
}

/* ── Pill content ───────────────────────────── */
.emoji {
  font-size: 26px;
  line-height: 1;
}

/* Vertical stack: count on top, name below */
.prepText {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.count {
  font-family: 'Lilita One', cursive;
  font-size: 18px;
  color: #f0c850;
  line-height: 1.1;
  text-shadow: 0 0 6px rgba(240, 200, 80, 0.30);
}

.name {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  color: #b0a890;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ── Responsive ─────────────────────────────── */
@media (max-width: 480px) {
  .divider {
    font-size: 22px;
  }

  .toggle {
    font-size: 15px;
    padding: 3px 10px;
  }
}
```

- [ ] **Step 2: Verify build still passes**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -10
```

Expected: `✓ built in` — no errors. If CSS module errors appear, check that `.prepText` is referenced in the TSX update (Task 4 adds it).

---

## Task 4: PreparedItems TSX Update

**Files:**
- Modify: `src/components/PreparedItems.tsx`

### Context

Two changes:
1. Wrap count + name in `<div className={styles.prepText}>` for vertical stacking
2. Always render `×N` count (remove the `count > 1` condition and the `filled &&` guard on the count span — so `×0` shows for empty trays, maintaining consistent pill height)

The `showNames` toggle still controls only the name span visibility (unchanged behaviour).

- [ ] **Step 1: Update `src/components/PreparedItems.tsx`**

Replace the file contents with:

```tsx
import { useState } from 'react'
import { INGREDIENT_EMOJI, RECIPES } from '../data/recipes'
import styles from './PreparedItems.module.css'

interface Props {
  items: string[]
  enabledRecipes: string[]
}

export default function PreparedItems({ items, enabledRecipes }: Props) {
  const [showNames, setShowNames] = useState(true)

  const allowedIngredients = new Set(
    enabledRecipes.flatMap(key => RECIPES[key]?.steps.map(s => s.produces) ?? [])
  )
  const visibleIngredients = Object.keys(INGREDIENT_EMOJI).filter(i => allowedIngredients.has(i))

  const counts: Record<string, number> = {}
  for (const item of items) {
    counts[item] = (counts[item] || 0) + 1
  }

  return (
    <div className={styles.prep}>
      <div className={styles.header}>
        <div className={styles.divider}>🥘 PREPPED INGREDIENTS</div>
        <button className={styles.toggle} onClick={() => setShowNames(s => !s)}>
          {showNames ? 'Hide names' : 'Show names'}
        </button>
      </div>
      <div className={styles.items}>
        {visibleIngredients.map((item) => {
          const count = counts[item] || 0
          const filled = count > 0
          return (
            <div key={item} className={`${styles.tray} ${filled ? styles.trayFilled : styles.trayEmpty}`}>
              <span className={styles.emoji}>{INGREDIENT_EMOJI[item]}</span>
              <div className={styles.prepText}>
                <span className={styles.count}>×{count}</span>
                {showNames && <span className={styles.name}>{item}</span>}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
```

**What changed vs original:**
- Count is now `×{count}` unconditionally (always renders, even `×0`) — no `count > 1` condition, no `filled &&` guard
- Count + name are wrapped in `<div className={styles.prepText}>`
- Name display changed from `item.replace(/_/g, ' ')` to raw `item` (e.g. `chopped_lettuce`) — displayed uppercase via CSS `text-transform`

- [ ] **Step 2: Run build + lint**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build 2>&1 | tail -10 && npm run lint 2>&1 | tail -10
```

Expected: `✓ built in`, zero lint errors.

- [ ] **Step 3: Visual check in browser**

With `npm run dev` still running:
- Prep pills are larger with chunky gold borders
- Emoji is 26px
- Count shows in Lilita One below emoji (e.g. `×0`, `×2`)
- Name shows in 10px uppercase mono (e.g. `CHOPPED_LETTUCE`)
- Empty pills are visibly dimmed (38% opacity)
- "Hide names" toggle hides name spans; "Show names" restores them
- Filled pills glow subtly gold; empty pills have a faint white border

- [ ] **Step 4: Commit**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && git add src/components/PreparedItems.module.css src/components/PreparedItems.tsx && git commit -m "feat: redesign prepped ingredient pills for broadcast readability"
```

---

## Task 5: Final Verification Pass

**Files:** None (read-only verification)

- [ ] **Step 1: Full build + lint clean**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build && npm run lint
```

Expected: zero errors, zero warnings.

- [ ] **Step 2: Stress-test in-game**

Start a game with all recipes enabled. Verify:

| Scenario | Expected |
|----------|----------|
| Burger order ticket (3 ingredients) | Single row, no wrap, all 3 tiles visible |
| Pasta order ticket (3 ingredients) | Single row, no wrap, all 3 tiles visible |
| Roasted Veggies ticket (2 ingredients) | Single row, tiles slightly wider |
| Fries / Soup ticket (1 ingredient) | Single wide tile |
| Patience depletes: green → orange → red | Header gradient + bar fill both change colour |
| Dish served | Ticket fades out + money float animates |
| Order expires | Ticket shakes + fire overlay sweeps up |
| Station catches fire | `!extinguish` command clears it; unrelated to ticket rendering |
| Prep pill with count > 1 | Shows `×2`, `×3` etc. in gold |
| Prep pill with count = 1 | Shows `×1` (not empty string) |
| Prep pill with count = 0 | Shows `×0`, dimmed, no glow border |
| Toggle "Hide names" | Name span hidden; count + emoji remain |

- [ ] **Step 3: Light theme check (if applicable)**

If the game has a light mode toggle, switch to light theme and verify the punch hole on tickets blends with the light page background (uses `var(--bg-dark)` which resolves to `#f0ece8` in light theme).

- [ ] **Step 4: Done**

Both features complete. No further commits needed unless issues were found in Step 2.
