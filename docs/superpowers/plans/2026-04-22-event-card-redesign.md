# Event Card Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign `EventCardOverlay` from a plain dark card into a thematic kitchen-receipt ticket with per-event colours, a print-from-top entry animation, rubber-stamp outcome, and tear-off exit.

**Architecture:** Three files change — `kitchenEventDefs.ts` gains `color`/`cmdColor` per event, `EventCardOverlay.module.css` is fully rewritten to the receipt theme, and `EventCardOverlay.tsx` is fully rewritten with new JSX structure and animation state. Screen flash and vignette logic is preserved verbatim.

**Tech Stack:** React 18, TypeScript strict, CSS Modules, no test framework (verify with `npm run build` + browser)

---

## File Map

| File | Change |
|------|--------|
| `src/data/kitchenEventDefs.ts` | Add `color` and `cmdColor` fields to `EventDef` interface; populate for all 9 events |
| `src/components/EventCardOverlay.module.css` | Full rewrite — receipt theme, clip, ticket, animations |
| `src/components/EventCardOverlay.tsx` | Full rewrite — new JSX structure, animation state management |

---

## Task 1: Add per-event colour fields to `kitchenEventDefs.ts`

**Files:**
- Modify: `src/data/kitchenEventDefs.ts`

- [ ] **Step 1: Add `color` and `cmdColor` to the `EventDef` interface**

  Open `src/data/kitchenEventDefs.ts`. The `EventDef` interface currently ends at line 38. Replace it with:

  ```typescript
  export interface EventDef {
    type: EventType
    category: EventCategory
    emoji: string
    label: string
    commandPool: string[]
    failDescription?: string
    rewardDescription?: string
    color: string    // accent for time bar fill and header gradient end
    cmdColor: string // darker shade for command box and header gradient start
    audio: {
      ambient: string
      success: string
      fail?: string
    }
  }
  ```

- [ ] **Step 2: Add `color` and `cmdColor` to all 9 event entries in `EVENT_DEFS`**

  Replace the entire `EVENT_DEFS` array with the following (all other fields unchanged, only `color` and `cmdColor` added to each entry):

  ```typescript
  export const EVENT_DEFS: EventDef[] = [
    {
      type: 'rat_invasion',
      category: 'hazard-penalty',
      emoji: '🐀',
      label: 'Rat Invasion',
      commandPool: ['SHOO SHOO SHOO', 'CHASE CHASE CHASE', 'BEGONE BEGONE BEGONE'],
      failDescription: 'Fail: lose prepped ingredients',
      color: '#a0603a',
      cmdColor: '#7a4020',
      audio: { ambient: 'event-rat-ambient', success: 'event-success', fail: 'event-fail' },
    },
    {
      type: 'angry_chef',
      category: 'hazard-penalty',
      emoji: '👨‍🍳',
      label: 'Angry Chef',
      commandPool: ['SORRY CHEF', 'APOLOGIES CHEF', 'MY BAD CHEF'],
      failDescription: 'Fail: cooking speed debuff for 15s',
      color: '#e05020',
      cmdColor: '#c0390a',
      audio: { ambient: 'event-angry-chef-ambient', success: 'event-success', fail: 'event-fail' },
    },
    {
      type: 'power_trip',
      category: 'hazard-immediate',
      emoji: '🔌',
      label: 'Power Trip',
      commandPool: ['RESET', 'REBOOT', 'RESTART'],
      failDescription: 'Stations offline until resolved',
      color: '#2a5acc',
      cmdColor: '#1a3a8a',
      audio: { ambient: 'event-power-trip-ambient', success: 'event-success' },
    },
    {
      type: 'smoke_blast',
      category: 'hazard-immediate',
      emoji: '💨',
      label: 'Smoke Blast',
      commandPool: ['CLEAR', 'VENTILATE', 'BLOW'],
      failDescription: 'Kitchen obscured until resolved',
      color: '#888888',
      cmdColor: '#555555',
      audio: { ambient: 'event-smoke-blast-ambient', success: 'event-success' },
    },
    {
      type: 'glitched_orders',
      category: 'hazard-immediate',
      emoji: '📦',
      label: 'Glitched Orders',
      commandPool: ['FIX', 'DEBUG', 'PATCH'],
      failDescription: 'Orders scrambled until resolved',
      color: '#7a30cc',
      cmdColor: '#4a1a7a',
      audio: { ambient: 'event-glitch-ambient', success: 'event-success' },
    },
    {
      type: 'chefs_chant',
      category: 'opportunity',
      emoji: '📢',
      label: "Chef's Chant",
      commandPool: ['YES CHEF', 'AYE CHEF', 'OF COURSE CHEF'],
      rewardDescription: 'Reward: cooking speed boost for 20s',
      color: '#c09020',
      cmdColor: '#8a6000',
      audio: { ambient: 'event-chant-ambient', success: 'event-success', fail: 'event-fail' },
    },
    {
      type: 'mystery_recipe',
      category: 'opportunity',
      emoji: '🧩',
      label: 'Mystery Recipe',
      commandPool: [],
      rewardDescription: 'Reward: 3 free prepped ingredients',
      color: '#5030a0',
      cmdColor: '#2a1a6a',
      audio: { ambient: 'event-mystery-ambient', success: 'event-success', fail: 'event-fail' },
    },
    {
      type: 'typing_frenzy',
      category: 'opportunity',
      emoji: '⚡',
      label: 'Typing Frenzy',
      commandPool: [],
      rewardDescription: 'Reward: money multiplier ×1.5 for 20s',
      color: '#88cc00',
      cmdColor: '#4a7800',
      audio: { ambient: 'event-frenzy-ambient', success: 'event-success', fail: 'event-fail' },
    },
    {
      type: 'dance',
      category: 'opportunity',
      emoji: '🕺',
      label: 'Dance',
      commandPool: ['UP', 'DOWN', 'LEFT', 'RIGHT'],
      rewardDescription: 'Reward: all orders +15s patience',
      color: '#cc30aa',
      cmdColor: '#7a1a6a',
      audio: { ambient: 'event-dance-ambient', success: 'event-success', fail: 'event-fail' },
    },
  ]
  ```

- [ ] **Step 3: Verify the build passes**

  ```bash
  npm run build
  ```

  Expected: no TypeScript errors. Any "Property 'color' does not exist" errors mean the interface update from Step 1 wasn't saved.

- [ ] **Step 4: Commit**

  ```bash
  git add src/data/kitchenEventDefs.ts
  git commit -m "feat: add color and cmdColor palette fields to EventDef"
  ```

---

## Task 2: Rewrite `EventCardOverlay.module.css`

**Files:**
- Modify: `src/components/EventCardOverlay.module.css`

This is a complete replacement. The file has no class-name dependencies outside of `EventCardOverlay.tsx`, which is also being fully rewritten in Task 3.

- [ ] **Step 1: Replace the entire file with the receipt theme styles**

  ```css
  /* ── Overlay ── */
  .overlay {
    position: fixed;
    inset: 0;
    z-index: 260;
    pointer-events: none;
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding-top: 22vh;
  }

  /* ── Clip + ticket assembly ── */
  .assembly {
    display: flex;
    flex-direction: column;
    align-items: center;
    width: max-content;
  }

  .assembly.tearing {
    animation: tearOff 0.45s cubic-bezier(0.4, 0, 1, 1) forwards;
  }

  /* ── Metal bulldog clip ── */
  .clip {
    width: 32px;
    height: 40px;
    background: linear-gradient(180deg, #aaa 0%, #777 100%);
    border-radius: 4px 4px 0 0;
    position: relative;
    z-index: 10;
    box-shadow: 0 -2px 6px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.25);
    flex-shrink: 0;
  }

  .clip::before {
    content: '';
    position: absolute;
    top: 6px;
    left: 50%;
    transform: translateX(-50%);
    width: 16px;
    height: 16px;
    background: #555;
    border-radius: 50%;
    border: 2px solid #444;
    box-shadow: inset 0 1px 3px rgba(0,0,0,0.5);
  }

  .clip::after {
    content: '';
    position: absolute;
    bottom: -3px;
    left: 0;
    right: 0;
    height: 6px;
    background: linear-gradient(180deg, #666, #888);
    border-radius: 0 0 2px 2px;
  }

  /*
   * ── Entry animation: wrapper split ──
   * clip-path clips box-shadow, so we split into two elements:
   *   .ticketRevealWrapper  — carries clip-path (printReveal)
   *   .ticket               — carries box-shadow + transform bounce (printBounce)
   * Both animations play together on mount.
   */
  .ticketRevealWrapper {
    width: 100%;
    animation: printReveal 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* ── Ticket body ── */
  .ticket {
    background: #fdf6e8;
    border-radius: 0 0 10px 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.75), 3px 0 0 rgba(0,0,0,0.06), -3px 0 0 rgba(0,0,0,0.06);
    position: relative;
    transform-origin: top center;
    animation: printBounce 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
  }

  /* ── Header ── */
  .header {
    padding: 14px 16px 12px;
    display: flex;
    align-items: center;
    gap: 10px;
    position: relative;
    overflow: hidden;
    /* gradient uses CSS custom properties set by the component */
    background: linear-gradient(135deg, var(--event-cmd-color), var(--event-color));
  }

  .headerStripe {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    opacity: 0.6;
    background: repeating-linear-gradient(
      90deg,
      rgba(255,255,255,0.5) 0,
      rgba(255,255,255,0.5) 6px,
      transparent 6px,
      transparent 12px
    );
  }

  .badge {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 1.5px;
    text-transform: uppercase;
    padding: 3px 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.22);
    color: rgba(255,255,255,0.85);
    flex-shrink: 0;
    white-space: nowrap;
  }

  .title {
    font-family: 'Lilita One', cursive;
    font-size: 19px;
    color: #fff;
    text-shadow: 0 1px 4px rgba(0,0,0,0.35);
    white-space: nowrap;
  }

  /* ── Body ── */
  .body {
    padding: 14px 16px 6px;
    color: #3a2e20;
    position: relative;
  }

  .cmdLabel {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #9a7a60;
    margin-bottom: 5px;
  }

  .cmdBox {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    font-weight: 700;
    padding: 7px 12px;
    border-radius: 6px;
    border-style: dashed;
    border-width: 1.5px;
    border-color: color-mix(in srgb, var(--event-cmd-color) 40%, transparent);
    background: color-mix(in srgb, var(--event-cmd-color) 8%, transparent);
    color: var(--event-cmd-color);
    margin-bottom: 10px;
    letter-spacing: 1px;
    white-space: nowrap;
  }

  .desc {
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    line-height: 1.5;
    color: #8a6a50;
    margin-bottom: 12px;
    white-space: nowrap;
  }

  /* ── Progress bars ── */
  .bars {
    display: flex;
    flex-direction: column;
    gap: 7px;
    margin-bottom: 4px;
  }

  .barMeta {
    display: flex;
    justify-content: space-between;
    gap: 16px;
    font-family: 'Space Mono', monospace;
    font-size: 18px;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #9a7a60;
    margin-bottom: 3px;
    white-space: nowrap;
  }

  .barTrack {
    height: 16px;
    background: rgba(0,0,0,0.1);
    border-radius: 6px;
    overflow: hidden;
  }

  .barFillTime {
    height: 100%;
    border-radius: 6px;
    /* striped fill using event accent colour */
    background: repeating-linear-gradient(
      90deg,
      var(--event-color) 0,
      var(--event-color) 5px,
      rgba(0,0,0,0.15) 5px,
      rgba(0,0,0,0.15) 8px
    );
    transition: width 0.1s linear;
  }

  .barFillProg {
    height: 100%;
    border-radius: 6px;
    background: #5a8a40;
    transition: width 0.15s ease;
  }

  /* ── Perforated bottom edge ── */
  .perf {
    height: 11px;
    background-color: #fdf6e8;
    background-image: radial-gradient(circle, #1c1917 3px, transparent 3px);
    background-size: 16px 11px;
    background-position: 4px center;
    border-top: 1px dashed rgba(0,0,0,0.12);
  }

  /* ── Rubber stamp overlay ── */
  .stamp {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 20;
    background: rgba(253,246,232,0.15);
  }

  .stampCircle {
    width: 130px;
    height: 130px;
    border-radius: 50%;
    border-width: 5px;
    border-style: solid;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-family: 'Lilita One', cursive;
    animation: stampIn 0.35s cubic-bezier(0.34, 1.2, 0.64, 1) forwards;
  }

  .stampResolved {
    border-color: #27ae60;
    color: #27ae60;
    background: rgba(39,174,96,0.08);
  }

  .stampFailed {
    border-color: #c0392b;
    color: #c0392b;
    background: rgba(192,57,43,0.08);
  }

  .stampIcon {
    font-size: 40px;
    line-height: 1;
  }

  .stampText {
    font-size: 18px;
    letter-spacing: 2px;
    text-transform: uppercase;
    margin-top: 2px;
  }

  /* ── Keyframes ── */
  @keyframes printReveal {
    0%   { clip-path: inset(0 0 100% 0); }
    60%  { clip-path: inset(0 0 0% 0); }
    100% { clip-path: inset(0 0 0% 0); }
  }

  @keyframes printBounce {
    0%   { transform: translateY(-8px); }
    60%  { transform: translateY(6px); }
    80%  { transform: translateY(-3px); }
    100% { transform: translateY(0); }
  }

  @keyframes stampIn {
    0%   { transform: scale(2.5) rotate(-8deg); opacity: 0; }
    60%  { transform: scale(0.92) rotate(4deg); opacity: 1; }
    80%  { transform: scale(1.06) rotate(-2deg); opacity: 1; }
    100% { transform: scale(1) rotate(0deg); opacity: 1; }
  }

  @keyframes tearOff {
    0%   { transform: translateY(0) rotate(0deg); opacity: 1; }
    30%  { transform: translateY(-12px) rotate(-1.5deg); opacity: 1; }
    100% { transform: translateY(-340px) rotate(3deg); opacity: 0; }
  }

  /* ── Screen flash on event spawn (unchanged) ── */
  .screenFlash {
    position: fixed;
    inset: 0;
    z-index: 255;
    pointer-events: none;
    animation: flashOut 0.8s ease-out forwards;
  }

  .flashHazard { background: rgba(231, 76, 60, 0.35); }
  .flashOpp    { background: rgba(39, 174, 96, 0.35); }

  @keyframes flashOut {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }

  /* ── Persistent vignette while event is active (unchanged) ── */
  .vignette {
    position: fixed;
    inset: 0;
    z-index: 255;
    pointer-events: none;
    animation: vignetteFlash 1.2s ease-in-out infinite alternate;
  }

  .vignetteHazard {
    box-shadow: inset 0 0 130px 50px rgba(231, 76, 60, 0.55);
  }

  .vignetteOpp {
    box-shadow: inset 0 0 130px 50px rgba(39, 174, 96, 0.55);
  }

  @keyframes vignetteFlash {
    from { opacity: 0.25; }
    to   { opacity: 1; }
  }
  ```

- [ ] **Step 2: Verify the build passes**

  ```bash
  npm run build
  ```

  Expected: no errors. CSS Modules doesn't validate class names at build time, so TypeScript errors here would come from Task 3 (not yet written). This step just ensures no syntax issues were introduced.

- [ ] **Step 3: Commit**

  ```bash
  git add src/components/EventCardOverlay.module.css
  git commit -m "feat: rewrite EventCardOverlay styles — receipt theme with animations"
  ```

---

## Task 3: Rewrite `EventCardOverlay.tsx`

**Files:**
- Modify: `src/components/EventCardOverlay.tsx`

The component receives `activeEvent: KitchenEvent | null`. The `KitchenEvent` type (in `src/state/types.ts`) has these fields used here:
- `id: string`
- `category: EventCategory` — `'hazard-penalty' | 'hazard-immediate' | 'opportunity'`
- `type: EventType`
- `chosenCommand: string`
- `progress: number` — 0–100
- `threshold: number`
- `respondedUsers: string[]`
- `timeLeft: number | null` — ms remaining, null for hazard-immediate
- `resolved: boolean`
- `failed: boolean`

Animation lifecycle:
1. New event spawns → `key={ev.id}` on `.assembly` forces remount → CSS entry animations play automatically on mount (`animation:` always-on in CSS, `fill-mode: forwards`)
2. `resolved` or `failed` becomes true → `setAnimState('stamping')` → stamp appears → after exactly 900ms → `setAnimState('tearing')` → tear animation plays
3. `useKitchenEvents` already calls `setActiveEvent(null)` after 1500ms → component unmounts (tear animation finishes at ~1350ms, 150ms safety margin)

- [ ] **Step 1: Replace the entire file with the new component**

  ```tsx
  import { useEffect, useRef, useState } from 'react'
  import { KitchenEvent, EventCategory } from '../state/types'
  import { createPortal } from 'react-dom'
  import { EVENT_DEFS } from '../data/kitchenEventDefs'
  import styles from './EventCardOverlay.module.css'

  interface Props {
    activeEvent: KitchenEvent | null
  }

  function badgeText(category: EventCategory): string {
    if (category === 'hazard-penalty') return '⚠ Hazard'
    if (category === 'hazard-immediate') return '⚠ Immediate'
    return '⚡ Opportunity'
  }

  type AnimState = 'idle' | 'stamping' | 'tearing'

  export default function EventCardOverlay({ activeEvent }: Props) {
    const prevIdRef = useRef<string | null>(null)
    const flashCategoryRef = useRef<EventCategory>('hazard-penalty')
    const [flashing, setFlashing] = useState(false)
    const [animState, setAnimState] = useState<AnimState>('idle')
    const tearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    // Screen flash on new event spawn (unchanged behaviour)
    useEffect(() => {
      if (activeEvent && activeEvent.id !== prevIdRef.current) {
        prevIdRef.current = activeEvent.id
        flashCategoryRef.current = activeEvent.category
        setFlashing(true)
        setAnimState('idle')
        if (tearTimerRef.current) clearTimeout(tearTimerRef.current)
        const t = setTimeout(() => setFlashing(false), 800)
        return () => clearTimeout(t)
      }
    }, [activeEvent])

    // Stamp → tear when event concludes
    useEffect(() => {
      if (!activeEvent || (!activeEvent.resolved && !activeEvent.failed)) return
      setAnimState('stamping')
      tearTimerRef.current = setTimeout(() => setAnimState('tearing'), 900)
      return () => {
        if (tearTimerRef.current) clearTimeout(tearTimerRef.current)
      }
    }, [activeEvent?.resolved, activeEvent?.failed])

    if (!activeEvent && !flashing) return null

    const flashIsHazard = flashCategoryRef.current !== 'opportunity'

    return createPortal(
      <>
        {flashing && (
          <div className={`${styles.screenFlash} ${flashIsHazard ? styles.flashHazard : styles.flashOpp}`} />
        )}
        {activeEvent && !activeEvent.resolved && !activeEvent.failed && (
          <div className={`${styles.vignette} ${activeEvent.category !== 'opportunity' ? styles.vignetteHazard : styles.vignetteOpp}`} />
        )}
        {activeEvent && (() => {
          const ev = activeEvent
          const def = EVENT_DEFS.find(d => d.type === ev.type)!
          const isHazard = ev.category !== 'opportunity'
          const description = isHazard ? (def.failDescription ?? '') : (def.rewardDescription ?? '')
          const timePercent = ev.timeLeft !== null
            ? (ev.timeLeft / (ev.category === 'hazard-penalty' ? 10_000 : 12_000)) * 100
            : null
          const timeSeconds = ev.timeLeft !== null ? (ev.timeLeft / 1000).toFixed(1) : null
          const showStamp = animState === 'stamping' || animState === 'tearing'

          return (
            <div className={styles.overlay}>
              {/* key={ev.id} forces full remount on each new event, restarting CSS entry animations */}
              <div key={ev.id} className={`${styles.assembly} ${animState === 'tearing' ? styles.tearing : ''}`}>
                <div className={styles.clip} />
                {/* ticketRevealWrapper carries clip-path; ticket carries box-shadow + bounce */}
                <div className={styles.ticketRevealWrapper}>
                  <div
                    className={styles.ticket}
                    style={{
                      '--event-color': def.color,
                      '--event-cmd-color': def.cmdColor,
                    } as React.CSSProperties}
                  >
                    <div className={styles.header}>
                      <div className={styles.headerStripe} />
                      <span className={styles.badge}>{badgeText(ev.category)}</span>
                      <span className={styles.title}>{def.emoji} {def.label}</span>
                    </div>
                    <div className={styles.body}>
                      <div className={styles.cmdLabel}>Type in chat</div>
                      <div className={styles.cmdBox}>{ev.chosenCommand}</div>
                      <div className={styles.desc}>{description}</div>
                      {!ev.resolved && !ev.failed && (
                        <div className={styles.bars}>
                          {timePercent !== null && (
                            <div>
                              <div className={styles.barMeta}>
                                <span>Time</span>
                                <span>{timeSeconds}s</span>
                              </div>
                              <div className={styles.barTrack}>
                                <div className={styles.barFillTime} style={{ width: `${timePercent}%` }} />
                              </div>
                            </div>
                          )}
                          <div>
                            <div className={styles.barMeta}>
                              <span>Progress</span>
                              <span>{ev.respondedUsers.length} / {ev.threshold}</span>
                            </div>
                            <div className={styles.barTrack}>
                              <div className={styles.barFillProg} style={{ width: `${ev.progress}%` }} />
                            </div>
                          </div>
                        </div>
                      )}
                      {showStamp && (
                        <div className={styles.stamp}>
                          <div className={`${styles.stampCircle} ${ev.resolved ? styles.stampResolved : styles.stampFailed}`}>
                            <div className={styles.stampIcon}>{ev.resolved ? '✓' : '✗'}</div>
                            <div className={styles.stampText}>{ev.resolved ? 'Resolved' : 'Failed'}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={styles.perf} />
                  </div>
                </div>
              </div>
            </div>
          )
        })()}
      </>,
      document.body
    )
  }
  ```

- [ ] **Step 2: Verify the build passes with no TypeScript errors**

  ```bash
  npm run build
  ```

  Expected: clean build. Common errors to watch for:
  - `Property 'color' does not exist on type 'EventDef'` → Task 1 interface update wasn't saved correctly
  - `Type '{ '--event-color': string; }' is not assignable to type 'CSSProperties'` → the `as React.CSSProperties` cast handles this; if it still fails, ensure both custom properties are in the same object literal with the cast

- [ ] **Step 3: Start the dev server and test visually in the browser**

  ```bash
  npm run dev
  ```

  Open the game, start a session in Free Play, and trigger kitchen events. Verify:
  - [ ] Ticket prints down from the clip when an event spawns
  - [ ] Header colour matches the event (brown for rat, orange-red for angry chef, etc.)
  - [ ] Command box shows the correct command in the event's dark colour
  - [ ] Description line is visible below the command box
  - [ ] Time bar (striped, event colour) shrinks for hazard-penalty / opportunity events; absent for hazard-immediate events (`power_trip`, `smoke_blast`, `glitched_orders`)
  - [ ] Progress bar (green) fills as players respond
  - [ ] Rubber stamp slams in on resolve (green ✓ RESOLVED) or fail (red ✗ FAILED)
  - [ ] Ticket tears upward off screen ~900ms after stamp
  - [ ] Screen flash still fires on spawn
  - [ ] Pulsing vignette still shows while event is active
  - [ ] Typing Frenzy and Mystery Recipe events: ticket is wider than usual (long command) — this is correct

- [ ] **Step 4: Commit**

  ```bash
  git add src/components/EventCardOverlay.tsx
  git commit -m "feat: rewrite EventCardOverlay — kitchen receipt ticket with animations"
  ```
