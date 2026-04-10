# Main Menu Redesign — Design Spec

## Goal

Redesign the MainMenu component to make full use of the 1440px horizontal canvas, improve UX through clear visual hierarchy, and surface the game's "how to play" content for new streamers and viewers directly on the menu screen.

## Context

The current MainMenu is a narrow centered flex column (~280px wide) that wastes nearly all of the 1440px canvas space. On 16:9 monitors the internal canvas height is fixed at 810px — a wide horizontal layout is the right fit. The redesign follows the same Hero Split pattern already applied to LevelSelect, FreePlaySetup, and GameOver screens.

The "Play Levels" button/screen is being renamed to **"Adventures"** throughout the UI.

---

## Layout: Hero Split

Two-column grid: `560px | 1fr`

```
┌─────────────────────────────┬───────────────────────────────────────┐
│         LEFT PANEL          │            RIGHT PANEL                │
│         (560px)             │            (~880px)                   │
│                             │                                       │
│  Title                      │  [Twitch Connect Card]                │
│  Subtitle                   │                                       │
│  ─────                      │  [Free Play]  ← featured, tall        │
│  How to play                │                                       │
│    1. Connect Twitch        │  [Adventures] ← medium, steel blue    │
│    2. Chat commands  ←      │                                       │
│       cheatsheet            │  [Tutorial] [Options] ← small row     │
│    3. Serve orders          │                                       │
│  ─────                      │                                       │
│  Footer                     │                                       │
└─────────────────────────────┴───────────────────────────────────────┘
```

---

## Left Panel

**Structure (flex column, gap: 22px, padding: 40px 48px, `overflow-y: auto`, `min-height: 0`):**
Content may exceed 810px on smaller displays — the panel scrolls internally rather than clipping. No `justify-content: center` (content starts from top with padding).

1. **Title block**
   - `"Let Chat Cook"` — 54px, weight 900, white with copper (`#b87333`) text-stroke/shadow (existing style)
   - Subtitle: `"A Livestream Chat Restaurant Game — v0.1"` — 14px monospace, `var(--text-secondary)`

2. **Horizontal rule** — `1px solid var(--border)`

3. **"How to play" section** — section label (12px uppercase, spaced), then 3 numbered steps:
   - Step number circles: 26px, copper background
   - Step title: 16px bold, `var(--text)`
   - Step description: 13px, `var(--text-muted)`

   **Step 2 includes a cheatsheet panel (always visible, static — no toggle):**
   ```
   ┌─────────────────────────────────────┐
   │  PREPARE                            │
   │  !chop [ingredient]   chopping board│
   │  !grill [ingredient]  grill station │
   │  !fry [ingredient]    fryer         │
   │  !boil [ingredient]   stove         │
   │  !toast [ingredient]  oven          │
   │  !extinguish          put out a fire│
   │  ─────────────────────────────────  │
   │  DELIVER                            │
   │  !serve [order#]      deliver table │
   └─────────────────────────────────────┘
   ```
   - Dark background `#0d0c0b`, 1px border, 6px radius
   - Commands: 12px monospace, `#f0c850`
   - Descriptions: 12px monospace, `var(--text-muted)`

4. **Horizontal rule**

5. **Footer** — `"created by THIANzeren · work in progress — progress may reset"` — 11px monospace, `var(--text-faint)`

---

## Right Panel

**Structure (flex column, gap: 14px, padding: 36px 48px 36px 36px, `overflow: hidden`, `min-height: 0`):**

### Twitch Connect Card
- Background: `#1a1128` (dark purple), border: `1.5px solid #9146ff`, radius: 12px
- Label: `"TWITCH CONNECT"` — 12px bold, `#9146ff`
- Input row: channel name input + Connect button (purple, `#9146ff`)
- Status row: green dot + `"Connected as streamername"` + disconnect link
- When disconnected: shows input + Connect button only; status row hidden

### Game Mode Buttons (flex column, `flex: 1`)

**Free Play** — featured, tallest (`flex: 1.6`)
- Background: `#b87333` (copper), shadow: `0 4px 0 #8b5a2b`
- Name: 42px, weight 900, white
- Description: 15px, `rgba(255,255,255,0.6)`
- Arrow `▶` at right: 36px, `rgba(255,255,255,0.4)`
- Hover: brightness(1.1) + translateY(-1px)

**Adventures** — medium (`flex: 1`)
- Background: `#2c5f8a` (steel blue), shadow: `0 4px 0 #1e4366`
- Name: 30px, weight 800, white
- Description: 13px, `rgba(255,255,255,0.5)`
- Arrow `→` at right: 28px, `rgba(255,255,255,0.3)`
- Hover: brightness(1.1) + translateY(-1px)

**Tutorial + Options** — small bottom row (`flex: 0 0 64px`, side by side)
- Tutorial: `#f0c850` background, 22px bold, `#3d2c11` text
- Options: `var(--surface)` background, `var(--border)` border, 22px bold, `var(--text-secondary)` text

---

## "Adventures" Rename

`onLevels` prop and handler in `App.tsx` remain unchanged (internal naming). Only display labels and CSS class names change:
- `MainMenu.tsx`: button label `"Adventures"` (was `"Play Levels"`); CSS class `.btnAdventures` (was `.btnLevels`)
- `LevelSelect.tsx`: change h1 from `"Select Level"` → `"Adventures"` (the h1 in the left column)

---

## Files to Modify

| File | Change |
|------|--------|
| `src/components/MainMenu.tsx` | Full JSX restructure to 2-column Hero Split layout |
| `src/components/MainMenu.module.css` | Replace single-column styles with 2-column grid + all new classes |
| `src/components/LevelSelect.tsx` | Change h1 title from `"Select Level"` to `"Adventures"` |

---

## Constraints

- Internal canvas: 1440×810px (fixed by `useViewportScale` hook — do not use `vh`/`vw` units)
- Use `height: 100%` not `height: 100vh`
- All `overflow: hidden` on the `.screen` root; columns may use `overflow-y: auto` if content is tall
- Follow existing CSS Module pattern (`*.module.css` co-located with component)
- No new dependencies
- Preserve all existing prop types on `MainMenu` — no changes to `App.tsx` wiring

---

## Verification

1. `npm run dev` — navigate to Main Menu
2. Confirm left panel shows title, 3-step guide, and cheatsheet without overflow
3. Confirm right panel shows Twitch card + 3 mode sections (Free Play, Adventures, Tutorial/Options)
4. Disconnect Twitch — confirm status row hides, input + Connect button visible
5. Connect Twitch — confirm green dot + channel name appear
6. Click each button — confirm navigation works (Free Play → FreePlaySetup, Adventures → LevelSelect, Tutorial → modal, Options → OptionsScreen)
7. `npm run build` — 0 TypeScript errors
