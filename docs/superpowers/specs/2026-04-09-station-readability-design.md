# Station Readability Overhaul — Design Spec

## Context

Cooking station slots are unreadable at Twitch broadcast resolution. Username is 13px, ingredient name is 12px, and the progress bar is only 10px tall — all in a cramped horizontal row with fixed-width columns. At 10+ simultaneous players per station, the station panel becomes a wall of tiny text.

Inspired by stream-native game design (Words on Stream): the progress bar becomes the visual unit, with all text living inside it as overlaid labels.

---

## Scope

Two files only:
- `src/components/Station.tsx`
- `src/components/Station.module.css`

No changes to game logic, state, recipes, or other components.

---

## Approved Design: Bar-Dominant Slots

Each slot becomes a **28px-tall progress bar** with username, ingredient name, and a status label absolutely positioned inside it. No separate fixed-width text columns.

### State ①: Cooking

- Bar fills left → right showing cook progress
- Fill colour: green `rgba(92,184,92,0.42)` → orange `rgba(232,148,58,0.55)` → red `rgba(217,79,79,0.55)` driven by `burnRatio` (same thresholds as current: >0.85 red, >0.65 orange)
- Left label: username (13px bold Space Mono, hashed colour)
- Centre label: ingredient name, underscores → spaces (12px white, `flex:1`, truncated)
- Right label: `XX%` (11px, muted white)

### State ①-done: Done — safe burn window

- Bar stays **full width** (100%), no draining
- Fill colour: gold `rgba(240,200,80,0.38)`
- Slot wrapper: `donePulse` glow animation (gold, 1.2s)
- Right label: `✓ DONE` in `#f0c850`
- Threshold: `burnProgress < 0.5` (where `burnProgress = burnElapsed / burnWindow`)

### State ①-danger: Done — burning soon

- Bar stays **full width** (100%), no draining
- Fill colour: red `rgba(217,79,79,0.55)`
- Slot wrapper: `dangerPulse` glow animation (red, 0.6s — faster than done pulse)
- Right label: `⚠ TAKE IT!` in `#ff8080`
- Threshold: `burnProgress >= 0.5`

Items with no burn timer (`burnAt === Infinity`) always show state ①-done (gold, "✓ DONE") when done — no danger state.

The `0.5` threshold replaces the existing 3-tier colour system (`0.4` / `0.75`) because in the new design the cooking bar already communicates urgency via colour during cooking. The done state only needs a binary safe/danger signal — gold means "take it soon", red means "take it NOW".

**Zero-duration slots**: Recipes with `duration === 0` never create a station slot — they go directly to `preparedItems` in the reducer. The `SlotRow` component will never render a `cookDuration === 0` slot, so no edge-case handling is needed here.

### State ③: On Fire

- Full-width bar, pulsing red/orange gradient (`firePulse` 0.5s)
- Left label: username (hashed colour, `#ffddaa` tint fallback on dark bg)
- Right label: `🔥 !extinguish [station name]` (12px bold white)
- Replaces old `slotFireFlash` background animation on the row

---

## CSS Architecture

### Classes removed
- `.slotUser` (fixed-width column → replaced by `.barUser` inside bar)
- `.slotItem` (fixed-width column → replaced by `.barItem` inside bar)
- `.progressBg` (10px progress container → replaced by `.barBg` at 28px)
- `.progressFill` (bar fill → replaced by `.barFill`)
- `.slotPct` (percentage label → replaced by `.barRight`)
- `.slotDoneLabel` ("DONE" text → replaced by `.barRight` content)
- `.burnLabel` ("BURN" text → removed; colour change covers this)
- `.slotFireLabel` (fire label → replaced by `.barItem` inside `.fireBar`)
- `.slotOnFire` / `@keyframes slotFireFlash` (replaced by `.fireBar` + `@keyframes firePulse`)

### Classes added
| Class | Purpose |
|-------|---------|
| `.slotBar` | Slot wrapper — `position: relative; border-radius: 7px; overflow: hidden; height: 28px;` |
| `.barBg` | Dark background — `position: absolute; inset: 0; background: rgba(0,0,0,0.45)` |
| `.barFill` | Colour fill — `position: absolute; left:0; top:0; height:100%; border-radius:7px; transition: width 0.1s linear` |
| `.barText` | Overlay row — `position: absolute; inset: 0; display:flex; align-items:center; padding:0 10px; gap:8px; z-index:2` |
| `.barUser` | Username inside bar — 13px bold Space Mono, `flex-shrink:0; max-width:95px; overflow:hidden; text-overflow:ellipsis; text-shadow:0 1px 3px rgba(0,0,0,0.9)` |
| `.barItem` | Ingredient inside bar — 12px Space Mono white, `flex:1; overflow:hidden; text-overflow:ellipsis; opacity:0.9; text-shadow:...` |
| `.barRight` | Right status label — 11px bold Space Mono, `flex-shrink:0; text-shadow:...` |
| `.slotDone` | Gold pulse wrapper class |
| `.slotDanger` | Red pulse wrapper class (faster) |
| `.fireBar` | Fire state full bar — gradient + `firePulse` animation |

### Keyframes added
```css
@keyframes donePulse {
  0%,100% { box-shadow: 0 0 0 rgba(240,200,80,0); }
  50%      { box-shadow: 0 0 12px rgba(240,200,80,0.6); }
}
@keyframes dangerPulse {
  0%,100% { box-shadow: 0 0 0 rgba(217,79,79,0); }
  50%      { box-shadow: 0 0 12px rgba(217,79,79,0.7); }
}
@keyframes firePulse {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.65; }
}
```

### Classes modified
- `.slot` — **remove** `display:flex`, `align-items:center`, `gap:8px`, `padding:3px 0`, `border-top:1px solid #ffffff10`. Replace with just `margin-bottom:6px`. It is now a plain block wrapper around `.slotBar` or `.fireBar`. The `.slot:first-child` rule is also removed.
- `.slots` — gap stays `4px` (current value; the 28px bars provide enough visual separation)

### Full CSS for new bar label classes
```css
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
```

---

## TSX Changes (`Station.tsx` — `SlotRow` function)

### On-fire state
```tsx
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
```

### Done state
```tsx
const burnWindow = slot.burnAt - slot.cookDuration
const burnElapsed = Math.max(0, elapsed - slot.cookDuration)
const burnProgress = slot.burnAt < Infinity && burnWindow > 0
  ? Math.min(1, burnElapsed / burnWindow) : 0
const isDanger = burnProgress >= 0.5

return (
  <div className={`${styles.slot} ${isDanger ? styles.slotDanger : styles.slotDone}`}>
    <div className={styles.slotBar}>
      <div className={styles.barBg} />
      <div className={styles.barFill} style={{ width: '100%', background: isDanger ? 'rgba(217,79,79,0.55)' : 'rgba(240,200,80,0.38)' }} />
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
```

### Cooking state
```tsx
const barColor = burnRatio > 0.85 ? 'rgba(217,79,79,0.55)' : burnRatio > 0.65 ? 'rgba(232,148,58,0.55)' : 'rgba(92,184,92,0.42)'

return (
  <div className={styles.slot}>
    <div className={styles.slotBar}>
      <div className={styles.barBg} />
      <div className={styles.barFill} style={{ width: `${Math.floor(progress * 100)}%`, background: barColor }} />
      <div className={styles.barText}>
        <span className={styles.barUser} style={{ color: nameColor }}>{slot.user}</span>
        <span className={styles.barItem}>{slot.target.replace(/_/g, ' ')}</span>
        <span className={styles.barRight}>{Math.floor(progress * 100)}%</span>
      </div>
    </div>
  </div>
)
```

---

## Scale Consideration

At 10 slots × 28px bars + 4px gaps = ~320px of vertical slot content. Station `min-width` stays at 260px — the bar fills the full available width, so username/ingredient truncate gracefully at any width. No horizontal overflow.

---

## Verification

1. Run `npm run dev` and connect to a Twitch channel or enable bots
2. Confirm cooking slots show bar filling with colour changes (green → orange → red)
3. Confirm done slots show gold pulse + "✓ DONE"
4. Let a done slot approach burn time — confirm it shifts to red pulse + "⚠ TAKE IT!"
5. Let a slot burn — confirm pulsing red/orange fire bar with `!extinguish` instruction
6. Run `npm run build` — zero TypeScript errors
7. Run `npm run lint` — zero lint errors
