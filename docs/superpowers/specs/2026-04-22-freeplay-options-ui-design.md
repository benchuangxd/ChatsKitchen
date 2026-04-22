# FreePlay Options UI — Clean Reorganization

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** `FreePlaySetup.tsx` + `FreePlaySetup.module.css` only

---

## Problem

The More Options panel in `FreePlaySetup` has three issues:

1. **Nesting bug** — The `🍳 Kitchen Events` section is rendered *inside* the Auto-Restart `moreRow` div (lines 206–299 of `FreePlaySetup.tsx`). The `moreLabel` for Kitchen Events (line 234) and all its controls appear as children of the Auto-Restart `moreRow`, so they share a border-divided block with Auto-Restart instead of being a separate section.

2. **Font size inconsistency** — `eventChip` uses `font-size: 14px` while every other control in `FreePlaySetup` uses `18px` (or explicit values at that scale). The chips look noticeably smaller and disconnected from the rest of the design.

3. **Spawn frequency controls** — The Min and Max sliders are rendered as two stacked `slotsRow` divs. The section label "Event frequency (seconds between spawns)" uses `slotsLabel` class (an inline label class) rather than `hint`. There is no empty state when `kitchenEventsEnabled === false`.

---

## Solution — Clean Reorganization

### 1. Structure fix

Close the Auto-Restart `moreRow` before the `🍳 Kitchen Events` `moreLabel`, and open a new sibling `moreRow` for Kitchen Events. The resulting JSX hierarchy inside `moreSection`:

```jsx
<div className={styles.moreSection}>
  <div className={styles.moreRow}>  {/* ⚡ Cooking Speed */}  </div>
  <div className={styles.moreRow}>  {/* 📋 Order Urgency */}  </div>
  <div className={styles.moreRow}>  {/* 🌊 Order Frequency */}  </div>
  <div className={styles.moreRow}>  {/* 🔧 Station Slots */}  </div>
  <div className={styles.moreRow}>  {/* 🔄 Auto-Restart — ends before Kitchen Events */}  </div>
  <div className={styles.moreRow}>  {/* 🍳 Kitchen Events — its own row */}  </div>
</div>
```

The Kitchen Events `moreRow` starts with the existing `moreLabel` (`🍳 Kitchen Events`) and contains the toggle row, then conditionally (when ON) the chips, frequency grid, and validation hint.

The `moreRow:last-child` CSS rule already removes the bottom border from the last row — no CSS changes needed for dividers.

### 2. Font size

`eventChip`: `font-size: 14px` → `font-size: 16px`.

Chips are compact pill-shaped buttons; 18px makes them too tall relative to surrounding content, but 16px closes the visual gap and looks intentional.

### 3. Spawn frequency layout

Replace the two stacked `slotsRow` divs and the existing `slotsLabel` div on line 265 of the component (which currently renders "Event frequency (seconds between spawns)") with this structure inside the Kitchen Events `moreRow` (rendered only when `kitchenEventsEnabled === true`). Order is: event chips grid → frequency hint → frequency grid → validation warning.

```jsx
{/* event chips grid stays here, unchanged */}
<div className={styles.eventGrid}>...</div>

{/* replace existing slotsLabel div with hint */}
<div className={styles.hint}>Event frequency (seconds between spawns)</div>
<div className={styles.eventFreqGrid}>
  <div>
    <div className={styles.freqLabel}>MIN</div>
    <SliderField ... suffix="s" />
  </div>
  <div>
    <div className={styles.freqLabel}>MAX</div>
    <SliderField ... suffix="s" />
  </div>
</div>
```

Two new CSS classes:

```css
.eventFreqGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.freqLabel {
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 4px;
}
```

### 4. Empty state

When `kitchenEventsEnabled === false`, render a single `hint` directly after the toggle row (as the last child of the Kitchen Events `moreRow`):

```jsx
{!options.kitchenEventsEnabled && (
  <div className={styles.hint}>Enable to configure event types and frequency</div>
)}
```

The full Kitchen Events `moreRow` structure (both ON and OFF states):

```jsx
<div className={styles.moreRow}>
  <div className={styles.moreLabel}>🍳 Kitchen Events</div>
  <div className={styles.slotsRow}>
    <span className={styles.slotsLabel}>Random events during gameplay</span>
    <button className={...} onClick={...}>{options.kitchenEventsEnabled ? 'ON' : 'OFF'}</button>
  </div>
  {options.kitchenEventsEnabled && (
    <>
      <div className={styles.eventGrid}>{/* chips */}</div>
      <div className={styles.hint}>Event frequency (seconds between spawns)</div>
      <div className={styles.eventFreqGrid}>
        <div>
          <div className={styles.freqLabel}>MIN</div>
          <SliderField ... />
        </div>
        <div>
          <div className={styles.freqLabel}>MAX</div>
          <SliderField ... />
        </div>
      </div>
      {options.kitchenEventSpawnMin >= options.kitchenEventSpawnMax && (
        <div className={styles.hint} style={{ color: '#e8943a' }}>
          ⚠ Min ≥ Max — fixed interval of {options.kitchenEventSpawnMin}s will be used
        </div>
      )}
    </>
  )}
  {!options.kitchenEventsEnabled && (
    <div className={styles.hint}>Enable to configure event types and frequency</div>
  )}
</div>
```

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/FreePlaySetup.tsx` | Close Auto-Restart `moreRow` before Kitchen Events; open new sibling `moreRow`; replace stacked sliders with `eventFreqGrid` + `freqLabel` layout; add OFF empty-state hint |
| `src/components/FreePlaySetup.module.css` | `eventChip` font-size 14→16px; add `.eventFreqGrid`; add `.freqLabel` |

No other files are touched.

---

## Non-Goals

- No changes to right column (recipe select)
- No changes to the Duration card or `moreToggle` button
- No animation for More Options open/close
- No new options added (`allowShortformCommands` out of scope)
- No changes to gameplay logic or state

---

## Acceptance Criteria

- [ ] Kitchen Events `moreRow` is a direct sibling of Auto-Restart `moreRow`, not nested inside it
- [ ] Auto-Restart section contains only its own toggle and conditional delay slider — no Kitchen Events content
- [ ] With Kitchen Events ON: event chips, `hint` label, `eventFreqGrid`, and Min≥Max validation warning render correctly
- [ ] With Kitchen Events OFF: a single `hint` reads "Enable to configure event types and frequency"
- [ ] Event chips render at 16px
- [ ] Min and Max spawn sliders appear side-by-side in a 2-column `eventFreqGrid`
- [ ] Each slider column has a `freqLabel` (`MIN` / `MAX`) above it
- [ ] The frequency section label uses `.hint` class (not `.slotsLabel`)
- [ ] No visual regressions in other `moreRow` sections
- [ ] `npm run build` passes with no TypeScript errors
