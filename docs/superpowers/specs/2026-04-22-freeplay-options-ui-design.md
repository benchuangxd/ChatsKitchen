# FreePlay Options UI — Clean Reorganization

**Date:** 2026-04-22  
**Status:** Approved  
**Scope:** `FreePlaySetup.tsx` + `FreePlaySetup.module.css` only

---

## Problem

The More Options panel in `FreePlaySetup` has three issues:

1. **Nesting bug** — The `🍳 Kitchen Events` section is rendered *inside* the Auto-Restart `moreRow` div rather than as its own sibling row. When Kitchen Events is collapsed (toggle OFF), this looks like a broken extension of the Auto-Restart section. When expanded, the Auto-Restart and Kitchen Events controls run together with no visual separation.

2. **Font size inconsistency** — `eventChip` uses `font-size: 14px` while every other UI element in `FreePlaySetup` uses `18px` (or explicit values at that scale). The chips look noticeably smaller and unrelated to the design system.

3. **Spawn frequency controls** — The Min and Max sliders are rendered as two stacked `slotsRow` divs sharing the `slotsLabel` class. The section label ("Event frequency (seconds between spawns)") is rendered with `slotsLabel` class instead of `hint`, which is inconsistent with every other hint in the panel. There is no empty state when `kitchenEventsEnabled = false`.

---

## Solution — Option B: Clean Reorganization

### 1. Structure fix

Extract Kitchen Events from the Auto-Restart `moreRow` into its own sibling `moreRow`. The resulting JSX hierarchy inside `moreSection`:

```
moreSection
  moreRow  ← ⚡ Cooking Speed
  moreRow  ← 📋 Order Urgency
  moreRow  ← 🌊 Order Frequency
  moreRow  ← 🔧 Station Slots
  moreRow  ← 🔄 Auto-Restart
  moreRow  ← 🍳 Kitchen Events   ← moved here, its own row
```

The `moreRow:last-child` CSS rule already removes the bottom border from the last row, so no CSS changes are needed for the divider behaviour.

### 2. Font size

`eventChip`: `font-size: 14px` → `font-size: 16px`.

Rationale: chips are compact pill-shaped buttons. 18px makes the pill too tall relative to the surrounding content; 16px closes the visual gap without over-sizing. This is the only value that needs to change in the chip rule.

### 3. Spawn frequency layout

Replace the two stacked `slotsRow` divs with a 2-column grid:

```
Event frequency (seconds between spawns)   ← .hint class
┌─────────────────┬─────────────────┐
│  Min            │  Max            │
│  [slider] [30s] │  [slider] [60s] │
└─────────────────┴─────────────────┘
```

A new CSS class `.eventFreqGrid` provides the 2-column layout:

```css
.eventFreqGrid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
```

Each column has a small `freq-col-label` (`MIN` / `MAX`) above a `sliderField`.

To implement this, the two existing `SliderField` components are wrapped in a `div.eventFreqGrid` and each preceded by a small label div using the existing `.slotsLabel` class at reduced scale (or a new `.freqLabel` at 13px monospace).

### 4. Empty state

When `kitchenEventsEnabled === false`, render a single `hint` below the toggle:

```
Enable to configure event types and frequency
```

This replaces the current blank space and makes the section look intentional when collapsed.

---

## Files Changed

| File | Change |
|------|--------|
| `src/components/FreePlaySetup.tsx` | Extract Kitchen Events into own `moreRow`; add empty state hint; wrap spawn sliders in `eventFreqGrid` |
| `src/components/FreePlaySetup.module.css` | `eventChip` font-size 14→16px; add `.eventFreqGrid` class; add `.freqLabel` class |

No other files are touched.

---

## Non-Goals

- No changes to right column (recipe select)
- No changes to the Duration card or `moreToggle` button
- No animation for More Options open/close
- No new options added (e.g. `allowShortformCommands` is out of scope)
- No changes to gameplay logic or state

---

## Acceptance Criteria

- [ ] Kitchen Events `moreRow` is a direct sibling of Auto-Restart `moreRow`, not nested inside it
- [ ] With Kitchen Events ON: event chips, spawn frequency grid, and validation hint all render correctly
- [ ] With Kitchen Events OFF: a single `hint` line reads "Enable to configure event types and frequency"
- [ ] Event chips render at 16px (visually consistent with surrounding controls)
- [ ] Min and Max spawn sliders appear side-by-side in a 2-column grid
- [ ] Section frequency label uses `.hint` class (not `.slotsLabel`)
- [ ] No visual regressions in other `moreRow` sections
- [ ] `npm run build` passes with no TypeScript errors
