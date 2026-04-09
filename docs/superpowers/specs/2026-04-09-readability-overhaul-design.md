# Readability Overhaul — Order Tickets & Prepped Ingredients

**Date:** 2026-04-09  
**Status:** Approved

---

## Problem

The order sheet (order tickets) and prepped ingredients display are difficult to read at streaming resolution. Emojis are too small (19–20px), text labels are undersized (14–17px), and ingredient names on tickets are invisible (emojis only, no labels). When viewed via a compressed Twitch stream the UI becomes unreadable for both the streamer and viewers.

---

## Goal

Improve readability for broadcast/streaming contexts while preserving the existing dark-themed, warm-colour game aesthetic. Inspired by the bold overlay style of stream-native games like "Words on Stream": large emojis, chunky text, high-contrast labels.

---

## Scope

Two components only:

1. **`OrderTicket.tsx` + `OrderTicket.module.css`** — ticket card redesign
2. **`PreparedItems.tsx` + `PreparedItems.module.css`** — ingredient pill redesign

No changes to stations, chat panel, stats bar, game logic, or `DiningRoom` (its ticket row uses `flex-wrap: nowrap; overflow-x: auto` which absorbs the small width increase without changes).

> **Note:** The codebase has **7 recipes** (not 5 as the CLAUDE.md table suggests — that table is out of date). The worst-case ingredient row is **3 items** (Burger: lettuce + patty + bun; Pasta: pasta + tomato + cheese; Fish Burger: fish + lettuce + bun). Roasted Veggies has only 2 final plated ingredients (roasted tomato + roasted pepper). All layout decisions must accommodate a 3-tile row without wrapping.

---

## Design

### Order Tickets

**Visual appearance**
- **Paper-receipt aesthetic**: cream/warm `#f5f0e8` body, coloured gradient header, rounded top corners (`10px`)
- **Punch hole**: small dark circle centred at top (CSS `::before` pseudo-element, ~13px, background matches page dark colour)
- **Perforated tear strip**: at bottom — `radial-gradient` dot pattern on a dashed border-top, ~11px tall (CSS `::after` pseudo-element)
- **Coloured header gradient** (matches existing urgency logic):
  - Normal/green: `linear-gradient(160deg, #4ea854, #3a8a40)`
  - Warning/orange: `linear-gradient(160deg, #e06840, #c85030)`
  - Critical/red: `linear-gradient(160deg, #d94f4f, #b83030)`

**Typography & sizing**
- Header font: **Lilita One 20–22px** (up from Fredoka 18px), white, `text-shadow: 0 2px 4px rgba(0,0,0,0.4)`
- Ingredient emoji: **24–26px** (up from 20px)
- Ingredient name label (new): **8.5px Space Mono, uppercase, bold**, truncated with ellipsis if overflow

**Ingredient layout** (critical fix)
- `flex-wrap: nowrap` — ingredients never wrap to a second line
- Each ingredient gets an equal `flex: 1` tile with `min-width: 0`
- Tile: small rounded card (`background: rgba(0,0,0,0.06); border-radius: 7px; padding: 4–5px`)
- **Name label source:** Strip the verb prefix from the `produces` key using a simple JS replace: `produces.replace(/^(chopped|grilled|fried|boiled|roasted)_/, '')`. This yields "lettuce", "patty", "tomato", "bun", "potato", "fish", "pasta", "cheese", "mushroom", "pepper". No lookup map needed.
- Truncation is handled purely by CSS: `white-space: nowrap; overflow: hidden; text-overflow: ellipsis; width: 100%` on the name element
- Ticket labels are **always visible** — they are not subject to the `showNames` toggle in `PreparedItems`

**Patience bar**
- Height: 9px (unchanged)
- `rgba(0,0,0,0.12)` background (on cream body)
- Bar fill colours match urgency gradient

**Ticket width**: 172px (up from 160px)

**Implementation notes for `OrderTicket.tsx`**
- The current header uses an **inline style** `style={{ backgroundColor: barColor }}`. This must change to `style={{ background: gradientString }}` (or be replaced by urgency CSS classes) since `backgroundColor` cannot render a `linear-gradient`.
- `.ticket` must have `position: relative` set (it currently does not) so the `::before` punch hole pseudo-element can be absolutely positioned correctly.
- The existing `::after` in `OrderTicket.module.css` (zigzag torn-edge pattern) must be **fully replaced** by the new `radial-gradient` dot perforated strip. Do not append a new `::after` — overwrite the existing rule entirely.

---

### Prepped Ingredients

**Pill shape** (replaces existing rounded pill)
- `border-radius: 12px` (down from 20px — more rectangular, chunky)
- `border: 2px solid #f0c850` when filled; `rgba(255,255,255,0.1)` when empty
- Filled background: `rgba(240,200,80,0.08)` + subtle gold glow `box-shadow: 0 0 8px rgba(240,200,80,0.1)`
- Empty: `opacity: 0.38`, no glow

**Content layout** (horizontal: emoji | [count stacked over name])
- Emoji: **26px** (up from 20px)
- Count: **Lilita One 18px, gold** (`#f0c850`) with faint text-shadow glow
- Name: **Space Mono 10px, uppercase, bold**, muted colour `#b0a890`
- Count and name stack vertically as a `.prep-text` flex column

**Name display**
- Display the full `produces` key (e.g. `chopped_lettuce`, `grilled_patty`) — the `10px` font fits these comfortably within pill width
- CSS `overflow: hidden` + `text-overflow: ellipsis` on the name element handles any edge case overflow

**Count display**
- Always render the count as `×N` (e.g. `×1`, `×2`) regardless of value — this ensures the `.prepText` flex column is visually consistent and avoids empty-string layout issues. This is a change from the current behaviour where `count === 1` renders an empty string.

---

## Files to Change

| File | Change |
|------|--------|
| `src/components/OrderTicket.module.css` | Full rewrite of ticket, header, body, ingredient, bar, and pseudo-element styles. Replace existing `::after` (zigzag) entirely — do not keep it. Remove orphaned `.ingredientName` class from the `@media` block. |
| `src/components/OrderTicket.tsx` | Add ingredient name label (`<span>` below emoji in each tile) using prefix-strip helper. Change `style={{ backgroundColor }}` to `style={{ background: gradient }}` or urgency CSS classes. |
| `src/components/PreparedItems.module.css` | Rewrite `.tray`, `.trayFilled`, `.trayEmpty`, `.emoji`, `.count`, `.name` styles; add `.prepText` wrapper class for vertical stack. |
| `src/components/PreparedItems.tsx` | Wrap count + name in `.prepText` div for vertical stacking. Update count render to always show `×N` (remove the `count > 1` condition). |

---

## What Does NOT Change

- Game logic, state, reducer — untouched
- Station components
- Chat panel
- Stats bar / DiningRoom header
- Animations (served/lost ticket animations, fire overlay) — kept as-is, just resized
- The `showNames` toggle button in `PreparedItems` — kept, still controls name label visibility for prepped ingredient pills only. It has **no effect** on the ingredient name labels inside order tickets (those are always shown).

---

## Verification

1. Run `npm run dev` and start a game
2. Check order tickets: ingredients stay in one row for 3-ingredient dishes (Burger, Pasta, Fish Burger) — this is the worst case
3. Check prep pills: all ingredient names visible and readable at 10px; counts prominent in gold
4. Toggle the names button — name labels should hide/show correctly
5. Trigger urgency states (let orders age) — green/orange/red header gradients apply correctly
6. Trigger a fire — ticket lost animation (shake + fire overlay) still plays correctly
7. Serve a dish — ticket served animation (fade + money float) still plays correctly
8. Run `npm run build` — no TypeScript errors
9. Run `npm run lint` — no ESLint warnings
