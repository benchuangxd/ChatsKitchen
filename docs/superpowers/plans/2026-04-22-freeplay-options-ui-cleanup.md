# FreePlay Options UI Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the Kitchen Events nesting bug, resolve font-size inconsistency on event chips, and replace the awkward stacked spawn-frequency sliders with a clean 2-column grid.

**Architecture:** Two-file change — CSS additions/edits in `FreePlaySetup.module.css`, JSX restructure in `FreePlaySetup.tsx`. No new components, no state changes, no logic changes.

**Tech Stack:** React 18, TypeScript (strict), CSS Modules, Vite 5

---

## File Map

| File | What changes |
|------|-------------|
| `src/components/FreePlaySetup.module.css` | `eventChip` font-size 14→16px; add `.eventFreqGrid`; add `.freqLabel` |
| `src/components/FreePlaySetup.tsx` | Insert row boundary between Auto-Restart and Kitchen Events; replace stacked sliders with `eventFreqGrid` layout; add OFF empty-state hint |

---

## Task 1: CSS changes

**Files:**
- Modify: `src/components/FreePlaySetup.module.css`

- [ ] **Step 1: Change `eventChip` font-size from 14px to 16px**

Find the `.eventChip` rule near the bottom of `FreePlaySetup.module.css`. Change only the font-size line:

```css
/* BEFORE */
.eventChip {
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;

/* AFTER */
.eventChip {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
```

- [ ] **Step 2: Append two new classes at the end of the file**

Add these two rules after the last rule in `FreePlaySetup.module.css` (after `.eventChipOn`):

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

- [ ] **Step 3: Build check**

```bash
npm run build
```

Expected: exits 0, no errors.

---

## Task 2: JSX restructure

**Files:**
- Modify: `src/components/FreePlaySetup.tsx`

The nesting bug: `FreePlaySetup.tsx` lines 206–299 form a single `moreRow` div that contains *both* the Auto-Restart controls *and* all of the Kitchen Events controls. The fix is a surgical insertion of `</div><div className={styles.moreRow}>` at the boundary between the two sections (between the Auto-Restart hint text and the Kitchen Events `moreLabel`). No tags need to be removed — the existing closing `</div>` at line 299 naturally becomes the Kitchen Events row's closing tag after the insertion.

Do all three steps below IN ORDER. Steps 1 and 2 each target specific text that exists in the file right now; doing them out of order will change line numbers and make the other step's context non-unique.

- [ ] **Step 1: Insert the row boundary (fix nesting bug)**

In `FreePlaySetup.tsx`, find this exact block (lines 229–234):

```tsx
              <div className={styles.hint}>
                {options.autoRestart
                  ? 'Automatically starts a new round after the countdown on the game over screen'
                  : 'Game over screen will wait for manual input'}
              </div>
              <div className={styles.moreLabel}>🍳 Kitchen Events</div>
```

Replace it with:

```tsx
              <div className={styles.hint}>
                {options.autoRestart
                  ? 'Automatically starts a new round after the countdown on the game over screen'
                  : 'Game over screen will wait for manual input'}
              </div>
            </div>

            <div className={styles.moreRow}>
              <div className={styles.moreLabel}>🍳 Kitchen Events</div>
```

What changed: The Auto-Restart `moreRow` is now closed right after its hint div. A new sibling `moreRow` is opened for Kitchen Events. The existing `</div>` at the original line 299 now closes this new Kitchen Events row — no further tag changes needed.

- [ ] **Step 2: Replace stacked frequency sliders with 2-column grid**

In `FreePlaySetup.tsx`, find this exact block (lines 265–291 after Step 1, now inside the Kitchen Events moreRow):

```tsx
                  <div className={styles.slotsLabel}>Event frequency (seconds between spawns)</div>
                  <div className={styles.slotsRow}>
                    <span className={styles.slotsLabel}>Min</span>
                    <SliderField
                      value={options.kitchenEventSpawnMin}
                      min={5}
                      max={300}
                      step={5}
                      format={v => String(v)}
                      parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                      onChange={v => onChange({ ...options, kitchenEventSpawnMin: v })}
                      suffix="s"
                    />
                  </div>
                  <div className={styles.slotsRow}>
                    <span className={styles.slotsLabel}>Max</span>
                    <SliderField
                      value={options.kitchenEventSpawnMax}
                      min={5}
                      max={300}
                      step={5}
                      format={v => String(v)}
                      parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                      onChange={v => onChange({ ...options, kitchenEventSpawnMax: v })}
                      suffix="s"
                    />
                  </div>
```

Replace it with:

```tsx
                  <div className={styles.hint}>Event frequency (seconds between spawns)</div>
                  <div className={styles.eventFreqGrid}>
                    <div>
                      <div className={styles.freqLabel}>MIN</div>
                      <SliderField
                        value={options.kitchenEventSpawnMin}
                        min={5}
                        max={300}
                        step={5}
                        format={v => String(v)}
                        parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                        onChange={v => onChange({ ...options, kitchenEventSpawnMin: v })}
                        suffix="s"
                      />
                    </div>
                    <div>
                      <div className={styles.freqLabel}>MAX</div>
                      <SliderField
                        value={options.kitchenEventSpawnMax}
                        min={5}
                        max={300}
                        step={5}
                        format={v => String(v)}
                        parse={s => { const n = parseInt(s, 10); return isNaN(n) ? null : n }}
                        onChange={v => onChange({ ...options, kitchenEventSpawnMax: v })}
                        suffix="s"
                      />
                    </div>
                  </div>
```

- [ ] **Step 3: Add empty-state hint when Kitchen Events is OFF**

In `FreePlaySetup.tsx`, find this exact block — use the Min≥Max warning text as the unique anchor (it is the last thing inside the `kitchenEventsEnabled` conditional):

```tsx
                  {options.kitchenEventSpawnMin >= options.kitchenEventSpawnMax && (
                    <div className={styles.hint} style={{ color: '#e8943a' }}>
                      ⚠ Min ≥ Max — fixed interval of {options.kitchenEventSpawnMin}s will be used
                    </div>
                  )}
                </>
              )}
            </div>
```

Replace with (insert the empty-state between the `)}` that closes the `kitchenEventsEnabled` conditional and the `</div>` that closes the `moreRow`):

```tsx
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

Note: The existing Min≥Max validation warning stays inside the `kitchenEventsEnabled` conditional — it is not moved or changed.

- [ ] **Step 4: Build check**

```bash
npm run build
```

Expected: exits 0, no TypeScript errors. If you see JSX tag-balance errors, count the `<div className={styles.moreRow}>` opening tags and their matching `</div>` closing tags in the `moreSection` — there should be exactly 6 pairs (Cooking Speed, Order Urgency, Order Frequency, Station Slots, Auto-Restart, Kitchen Events).

---

## Task 3: Visual verification

- [ ] **Step 1: Start dev server and navigate to Free Play Setup**

```bash
npm run dev
```

Open in browser → main menu → Free Play → the setup screen loads.

- [ ] **Step 2: Verify events ON state**

Click "▼ More Options". Scroll to the bottom. Confirm all of the following:
- Auto-Restart section ends cleanly with a horizontal divider below it
- Kitchen Events is a separate section below the divider
- Event chips are visually close in size to surrounding text (16px, not tiny 14px)
- "Event frequency (seconds between spawns)" appears as muted text above two sliders
- Min and Max sliders appear side-by-side in two columns with MIN / MAX labels above them

- [ ] **Step 3: Verify events OFF state**

Toggle Kitchen Events to OFF. Confirm:
- Section shows only: label, toggle row, and the hint "Enable to configure event types and frequency"
- No chips, no sliders visible
- Auto-Restart section above is unchanged

- [ ] **Step 4: Verify Auto-Restart is isolated**

Toggle Auto-Restart ON. Confirm its delay slider appears. Toggle OFF. Confirm no Kitchen Events content is visible inside the Auto-Restart section.

- [ ] **Step 5: Verify Min ≥ Max warning**

With Kitchen Events ON, set Min to 60 and Max to 30. Confirm the warning "⚠ Min ≥ Max — fixed interval of 60s will be used" appears in orange below the grid.

---

## Task 4: Commit

- [ ] **Commit**

```bash
git add src/components/FreePlaySetup.tsx src/components/FreePlaySetup.module.css
git commit -m "fix: clean up FreePlay options panel — fix Kitchen Events nesting, font size, freq layout"
```
