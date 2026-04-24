# Design Spec: Events Selection Revamp (FreePlay)

**Date:** 2026-04-24
**Branch:** feat/kitchen-events

---

## Overview

Replace the current Kitchen Events chip grid in the FreePlay left column with a categorised 3-column event grid at the bottom of the right column, matching the interaction pattern of the recipe selector: hover an event to see its description in the shared detail panel on the left.

---

## Motivation

The current Kitchen Events card in the left column shows event names as flat chips with no descriptions. Streamers have no way to know what each event does without having played with it first. Additionally, the left column is already content-heavy; moving events to the right column creates a cleaner information hierarchy where the right column is the selection surface and the left column is the settings + detail surface.

---

## Layout Changes

### Right column — split into two sections

The right column gains a second section below recipes:

```
RIGHT COLUMN
├── Recipes section (flex: 1 — takes all remaining space)
│   ├── "🍽️ Recipes" label
│   ├── Selected panel (chips + Remove All / Select All / Random 3)
│   └── Scrollable recipe grid (cuisine sets)
│
├── [divider: 2px solid border]
│
├── Kitchen Events section (flex-shrink: 0 — sized to content)
│   ├── Header: "🍳 Kitchen Events" label + ON / OFF toggle
│   ├── Category row: "⚠ Hazards"
│   ├── 3-column event grid (Hazards: 5 events → 2 rows)
│   ├── Category row: "✨ Opportunities"
│   └── 3-column event grid (Opportunities: 4 events → 2 rows)
│
└── Footer: "▶ Start Shift!" button (full width, pinned)
```

### Left column — Kitchen Events card removed

The `🍳 Kitchen Events` card (toggle + chip grid) is removed from the left column entirely. The left column becomes:

```
LEFT COLUMN
├── Top row: Back button + TwitchStatusPill
├── "Customize Your Shift" title
├── ⏱ Duration card
├── ▼ More Options toggle (event frequency/duration sliders remain here)
└── Shared detail panel (shows recipe or event detail on hover, or empty hint)
```

The ON/OFF toggle for kitchen events moves to the events section header in the right column. The frequency and duration sliders remain in the More Options section unchanged.

---

## Event Grid Design

Each event is a `<button>` with three elements:

1. **Checkbox indicator** — 16×16px rounded square. Green border + green fill square when active; grey border, no fill when inactive. Clicking the button toggles the event on/off.
2. **Emoji** — 15px, the event's `def.emoji`.
3. **Name** — 14px Fredoka, the event's `def.label`.

Button states:
- **Off** — `var(--border)` border, `var(--bg)` background, `var(--text-secondary)` text
- **On** — `#5cb85c` border, `rgba(92,184,92,.1)` background, `var(--text)` text
- **Hovered** — slightly brightened border and background regardless of on/off state

The grid uses `grid-template-columns: 1fr 1fr 1fr` within each category block.

---

## Hover / Detail Interaction

The shared detail panel at the bottom of the left column is used for both recipes and events. Only one can be hovered at a time so there is no conflict.

**On event hover**, the panel shows:
- **Title row** — `emoji + label` in Fredoka 18px bold
- **Category badge** — "⚠ Hazard" (red tint) or "✨ Opportunity" (green tint), Space Mono 9px uppercase
- **Description** — one or two sentences explaining what the event does in gameplay, Space Mono 11px
- **Consequence line** — red panel for penalties (`✗ Fail: …`) or green panel for rewards (`✓ Reward: …`), Space Mono 11px

**On recipe hover** — unchanged from current behaviour (recipe steps panel).

**When nothing is hovered** — placeholder text: "Hover a recipe or event to see details".

---

## Data: Event Descriptions

Each `EventDef` in `kitchenEventDefs.ts` already has `failDescription` / `rewardDescription`. A new `description` field is needed for the hover detail prose (the "what happens" sentence, distinct from the consequence line). This field is added to `EventDef` and populated for all 9 events.

| Event | Category | Description | Consequence |
|---|---|---|---|
| Rat Invasion | hazard-penalty | Rats swarm the kitchen. Chat must shout them out before they steal from the prep tray. | ✗ Fail: lose prepped ingredients |
| Angry Chef | hazard-penalty | The head chef snaps. Chat must apologise before the timer runs out. | ✗ Fail: cooking speed debuff for 15s |
| Power Trip | hazard-immediate | The power goes out. Stations go offline until chat solves a maths equation. | ✗ Active: stations offline until resolved |
| Smoke Blast | hazard-immediate | Smoke floods the kitchen. Chat must clear it by typing together fast. | ✗ Active: kitchen UI obscured until resolved |
| Glitched Orders | hazard-immediate | Order tickets are scrambled. Chat must debug the system to restore them. | ✗ Active: order names scrambled until resolved |
| Chef's Chant | opportunity | Time to rally the brigade! Chat chants together to fire up the kitchen. | ✓ Reward: cooking speed boost for 20s |
| Mystery Recipe | opportunity | A scrambled recipe name appears. Chat must unscramble it to claim the reward. | ✓ Reward: 3 free prepped ingredients |
| Typing Frenzy | opportunity | A random string flashes on screen — chat races to type it exactly. | ✓ Reward: money multiplier ×1.5 for 20s |
| Dance | opportunity | A Simon Says sequence of dance moves — chat memorises and types them in order. | ✓ Reward: all orders gain +15s patience |

---

## Category Grouping

Events are split into two visual groups for display purposes only — the underlying `EventCategory` type is unchanged:

- **⚠ Hazards** — both `hazard-penalty` and `hazard-immediate` events
- **✨ Opportunities** — all `opportunity` events

Order within each group follows the existing order in `EVENT_DEFS`.

---

## State Changes

`GameOptions.enabledKitchenEvents` and `GameOptions.kitchenEventsEnabled` are unchanged — only the UI that reads and writes them changes.

No changes to `GameState`, `gameReducer`, `useKitchenEvents`, or any gameplay logic.

---

## Files Affected

| File | Change |
|---|---|
| `src/data/kitchenEventDefs.ts` | Add `description: string` to `EventDef` interface; populate for all 9 events |
| `src/components/FreePlaySetup.tsx` | Remove Kitchen Events card from left col; add events section to right col with 3-col grid; wire hover to shared detail panel; move toggle to events section header |
| `src/components/FreePlaySetup.module.css` | Remove event chip styles; add event grid, event button, category row, and section styles |

No other files are affected.
