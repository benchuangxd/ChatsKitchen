# Event Card Redesign — Design Spec

**Date:** 2026-04-22
**Branch:** feat/kitchen-events
**Components affected:** `EventCardOverlay.tsx`, `EventCardOverlay.module.css`
**Data affected:** `kitchenEventDefs.ts` (new `color` / `cmdColor` fields per event)

---

## Goal

Replace the current plain dark-card event overlay with a thematic **kitchen receipt** ticket — visually exciting, immediately readable, and animated from entry through resolution.

---

## 1. Visual Form Factor

The event card is styled as a **paper kitchen ticket** (cream background `#fdf6e8`) hanging from a **metal bulldog clip** at the top. Together the clip + ticket form a single centred overlay unit that sits at `22vh` from the top of the screen.

- **Clip** — small metallic rectangle (~32 × 40 px) with a dark screw/pin hole detail; rendered as a pure CSS shape above the ticket. Fixed in place; only the ticket animates.
- **Ticket body** — cream paper with a subtle drop shadow; `border-radius: 0 0 10px 10px` (top edge is flush against the clip).
- **Perforated bottom edge** — a row of evenly-spaced punch-hole circles rendered via `radial-gradient` on a thin strip, with a dashed top border, to simulate the tear-off perforation.
- **Width** — `max-content` (no fixed width); all text elements use `white-space: nowrap` so the ticket stretches horizontally to fit its longest line without wrapping.

---

## 2. Ticket Header

A coloured gradient band at the top of the ticket body. The gradient and accent colour are **per-event** (see §7).

Contents (left to right, vertically centred):
- **Category badge** — small pill with dark semi-transparent background (Space Mono, 18 px, uppercase, bold). Three possible values driven by `activeEvent.category`:
  - `hazard-penalty` → `⚠ Hazard`
  - `hazard-immediate` → `⚠ Immediate` (communicates there is no countdown timer)
  - `opportunity` → `⚡ Opportunity`
- **Event title** — emoji + label (Lilita One, 19 px, white with text-shadow).
- A thin repeating diagonal stripe at the very top of the header for texture.

---

## 3. Ticket Body

Padding `14px 16px`. All text minimum **18 px**.

### "Type in chat" label
Space Mono, 18 px, muted brown (`#9a7a60`), uppercase, letter-spaced. Static text.

### Command box
The command the player must type (`ev.chosenCommand`). Dashed border, tinted background, and text all use the **event's `cmdColor`** (a dark shade of the event's accent). Space Mono, 18 px bold, `white-space: nowrap`.

Note: two events produce long dynamic commands — `typing_frenzy` uses a phrase like `FIRE IN THE HOLE` and `mystery_recipe` uses an anagram that can be multi-word. With `white-space: nowrap` the ticket will expand to accommodate these; this is intentional — the ticket width is driven by its content.

### Description line
One-line stake reminder ("Fail: lose prepped ingredients" / "Reward: cooking speed boost for 20s"). Space Mono, 18 px, muted (`#8a6a50`), `white-space: nowrap`.

### Progress bars
Two stacked bars, each with a label row (Space Mono, 18 px) and a filled track (16 px tall, `border-radius: 6px`):

- **Time bar** — fill uses a repeating diagonal stripe pattern in the event's accent `color`; shrinks left-to-right as time runs down. Hidden for `hazard-immediate` events (no time limit).
- **Progress bar** — solid green (`#5a8a40`) fill; grows as players respond.

Label rows show `Time / <Xs>` and `Progress / <n> / <threshold>` aligned with `justify-content: space-between`.

---

## 4. Entry Animation — "Print from Top"

When a new event spawns, the ticket **prints downward** from the clip.

**Important — wrapper split required:** `clip-path` clips the element's paint box including its `box-shadow`. Animating `clip-path` and `box-shadow` on the same element causes the shadow to be invisible during entry. To avoid this, apply `clip-path` on an **outer wrapper** div around the ticket, and animate `transform` (the bounce) on the **inner ticket** element. The wrapper has no shadow; the inner ticket carries the shadow.

```css
/* On the outer wrapper — clips the reveal */
@keyframes printReveal {
  0%   { clip-path: inset(0 0 100% 0); }
  60%  { clip-path: inset(0 0 0% 0); }
  100% { clip-path: inset(0 0 0% 0); }
}

/* On the inner ticket — the bounce */
@keyframes printBounce {
  0%   { transform: translateY(-8px); }
  60%  { transform: translateY(6px); }
  80%  { transform: translateY(-3px); }
  100% { transform: translateY(0); }
}
```

Both animations share the same duration `0.55s` and easing `cubic-bezier(0.34, 1.56, 0.64, 1)`, triggered together on mount. `transform-origin: top center` on the inner ticket.

---

## 5. Outcome Animation — Rubber Stamp + Tear-Off

When the event resolves or fails:

1. **Stamp slams in** (at 0 ms): A circular stamp overlay appears centred on the ticket body.
   - Resolved: green border + `✓ RESOLVED` (Lilita One).
   - Failed: red border + `✗ FAILED` (Lilita One).
   - Stamp entrance: `scale(2.5) rotate(-8deg)` → `scale(1) rotate(0deg)`, duration `0.35s`, with an overshoot bounce.
   - The stamp is `position: absolute` inside the ticket body; ticket content remains visible behind it.

2. **Tear-off exit** (after exactly 900 ms delay): The entire clip + ticket assembly translates upward off screen and fades out.

```css
@keyframes tearOff {
  0%   { transform: translateY(0)    rotate(0deg);    opacity: 1; }
  30%  { transform: translateY(-12px) rotate(-1.5deg); opacity: 1; }
  100% { transform: translateY(-340px) rotate(3deg);   opacity: 0; }
}
```

Duration: `0.45s`, easing: `cubic-bezier(0.4, 0, 1, 1)`. Animation completes at ~1350ms; `setActiveEvent(null)` fires at 1500ms (handled by existing `setTimeout` in `useKitchenEvents`), giving 150ms of safe unmount margin.

The existing `screenFlash` (spawn) and pulsing `vignette` (active event) effects are **kept unchanged**.

---

## 6. Typography

| Role | Font | Size |
|------|------|------|
| Header title (emoji + label) | Lilita One | 19 px |
| Stamp text (RESOLVED / FAILED) | Lilita One | 18 px |
| Category badge, command, labels, bar meta | Space Mono | 18 px |
| Description | Space Mono | 18 px |

All sizes ≥ 18 px. Fonts already loaded via Google Fonts in `index.html`.

---

## 7. Per-Event Colour Palette

Each event has two colour values added to `EventDef`:

| Event | `color` (accent / time bar) | `cmdColor` (command box) |
|-------|----------------------------|--------------------------|
| 🐀 Rat Invasion | `#a0603a` | `#7a4020` |
| 👨‍🍳 Angry Chef | `#e05020` | `#c0390a` |
| 🔌 Power Trip | `#2a5acc` | `#1a3a8a` |
| 💨 Smoke Blast | `#888888` | `#555555` |
| 📦 Glitched Orders | `#7a30cc` | `#4a1a7a` |
| 📢 Chef's Chant | `#c09020` | `#8a6000` |
| 🧩 Mystery Recipe | `#5030a0` | `#2a1a6a` |
| ⚡ Typing Frenzy | `#88cc00` | `#4a7800` |
| 🕺 Dance | `#cc30aa` | `#7a1a6a` |

The header gradient is `linear-gradient(135deg, cmdColor, color)` (dark → lighter). Note: for events with dark accent palettes (🐀 Rat `#7a4020→#a0603a`, 🔌 Power `#1a3a8a→#2a5acc`, 💨 Smoke `#555→#888`) the gradient range is narrow. This is acceptable — these events are intentionally moodier. If contrast feels insufficient during implementation, shifting to `linear-gradient(135deg, cmdColor 0%, color 60%, #fff2 100%)` adds a subtle highlight without changing the palette.

These values are added as `color` and `cmdColor` string fields to the `EventDef` interface in `kitchenEventDefs.ts`.

---

## 8. State-Driven Rendering in React

The component receives the existing `activeEvent: KitchenEvent | null` prop. No new props required.

### Mount / unmount strategy

- On `activeEvent` id change → add `print-anim` CSS class to trigger entry animation.
- When `activeEvent.resolved === true` or `activeEvent.failed === true` → show stamp overlay; add `tearing` class to the assembly after 900 ms delay.
- The existing `useKitchenEvents` already calls `setActiveEvent(null)` after 1500 ms, which unmounts the card (the tear animation completes in ~500 ms before unmount).

### Animation class management

Use a local `animState: 'entering' | 'active' | 'stamping' | 'tearing'` state (or equivalent refs) to drive CSS class additions without re-triggering on every render.

---

## 9. Files to Change

| File | Change |
|------|--------|
| `src/components/EventCardOverlay.tsx` | Full rewrite of JSX — clip + ticket structure, stamp overlay, animation class logic |
| `src/components/EventCardOverlay.module.css` | Full rewrite of styles — receipt theme, all animations |
| `src/data/kitchenEventDefs.ts` | Add `color: string` and `cmdColor: string` to `EventDef`; populate for all 9 events |

No changes to `useKitchenEvents.ts`, `gameReducer.ts`, or any other file.

---

## 10. What Stays Unchanged

- Screen flash on spawn (`screenFlash` / `flashHazard` / `flashOpp`) — same logic, same timing.
- Pulsing vignette while active (`vignette` / `vignetteHazard` / `vignetteOpp`) — same logic, same timing.
- The `activeEvent` prop interface — no new props.
- All game logic in `useKitchenEvents.ts` — zero changes.
