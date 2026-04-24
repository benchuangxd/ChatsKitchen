# Events Selection Revamp (FreePlay) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the flat Kitchen Events chip grid in the FreePlay left column with a categorised 3-column event grid at the bottom of the right column, using the same hover-to-detail interaction pattern as the recipe selector.

**Architecture:** Two-file UI change — add a `description` field to `EventDef` in `kitchenEventDefs.ts`, then restructure `FreePlaySetup.tsx` / `FreePlaySetup.module.css` to move the events UI from the left column card to a new section at the bottom of the right column. The shared detail panel replaces both the old recipe-only panel and the new event hover panel. No state shape changes; `GameOptions.enabledKitchenEvents` and `kitchenEventsEnabled` are unchanged.

**Tech Stack:** React 18, TypeScript (strict), CSS Modules, Vite 5

---

## File Map

| File | What changes |
|------|-------------|
| `src/data/kitchenEventDefs.ts` | Add `description: string` to `EventDef` interface; populate for all 9 events |
| `src/components/FreePlaySetup.tsx` | Remove left-column Kitchen Events card; add right-column events section with categorised 3-col grid; expand detail panel to handle event hovers; move ON/OFF toggle to events section header |
| `src/components/FreePlaySetup.module.css` | Remove `eventGrid`/`eventChip`/`eventChipOn` (now unused); add `eventSection`, `eventSectionHeader`, `eventCategoryRow`, `eventBtnGrid`, `eventBtn`, `eventBtnOn`, `detailPanel`, `detailTitle`, `detailBadge`, `detailBadgeHazard`, `detailBadgeOpportunity`, `detailDesc`, `detailConsequence`, `detailConsequenceFail`, `detailConsequenceReward` |

---

## Task 1: Add `description` to EventDef

**Files:**
- Modify: `src/data/kitchenEventDefs.ts`

- [ ] **Step 1: Add `description` field to the `EventDef` interface**

In `kitchenEventDefs.ts`, find the `EventDef` interface (around line 68) and add `description` between `label` and `commandPool`:

```typescript
export interface EventDef {
  type: EventType
  category: EventCategory
  emoji: string
  label: string
  description: string          // ← new field
  commandPool: string[]
  failDescription?: string
  rewardDescription?: string
  color: string
  cmdColor: string
  audio: {
    ambient: string
    success: string
    fail?: string
  }
}
```

- [ ] **Step 2: Populate `description` for all 9 events in `EVENT_DEFS`**

Add a `description` line to each object in `EVENT_DEFS`. Use the exact prose from the spec table:

| Event type | description |
|---|---|
| `rat_invasion` | `'Rats swarm the kitchen. Chat must shout them out before they steal from the prep tray.'` |
| `angry_chef` | `'The head chef snaps. Chat must apologise before the timer runs out.'` |
| `power_trip` | `'The power goes out. Stations go offline until chat solves a maths equation.'` |
| `smoke_blast` | `'Smoke floods the kitchen. Chat must clear it by typing together fast.'` |
| `glitched_orders` | `'Order tickets are scrambled. Chat must debug the system to restore them.'` |
| `chefs_chant` | `'Time to rally the brigade! Chat chants together to fire up the kitchen.'` |
| `mystery_recipe` | `'A scrambled recipe name appears. Chat must unscramble it to claim the reward.'` |
| `typing_frenzy` | `'A random string flashes on screen — chat races to type it exactly.'` |
| `dance` | `'A Simon Says sequence of dance moves — chat memorises and types them in order.'` |

For example, the `rat_invasion` entry becomes:
```typescript
{
  type: 'rat_invasion',
  category: 'hazard-penalty',
  emoji: '🐀',
  label: 'Rat Invasion',
  description: 'Rats swarm the kitchen. Chat must shout them out before they steal from the prep tray.',
  commandPool: ['SHOO SHOO SHOO', 'CHASE CHASE CHASE', 'BEGONE BEGONE BEGONE'],
  failDescription: 'Fail: lose prepped ingredients',
  ...
}
```

- [ ] **Step 3: Build check**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
```

Expected: exits 0, no TypeScript errors. If you see "Property 'description' is missing in type" errors, you missed populating one of the 9 event entries.

---

## Task 2: CSS — remove old event chip styles, add new event grid + detail panel styles

**Files:**
- Modify: `src/components/FreePlaySetup.module.css`

- [ ] **Step 1: Remove the old `eventGrid`, `eventChip`, `eventChipOn`, `eventChipOn:hover` rules**

Find and delete these four rules at the bottom of the file (lines ~719–751 in current file):

```css
.eventGrid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.eventChip {
  font-family: 'Fredoka', sans-serif;
  font-size: 16px;
  background: none;
  border: 2px solid var(--border);
  border-radius: 20px;
  padding: 4px 12px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: border-color 0.15s, color 0.15s, background 0.15s;
  white-space: nowrap;
}

.eventChip:hover {
  border-color: var(--text);
  color: var(--text);
}

.eventChipOn {
  border-color: #5cb85c;
  background: rgba(92, 184, 92, 0.15);
  color: #5cb85c;
}

.eventChipOn:hover {
  background: rgba(92, 184, 92, 0.25);
}
```

Note: `eventFreqGrid` and `freqLabel` (the last two rules in the file) are kept — they are still used by the More Options sliders.

- [ ] **Step 2: Append new event section + detail panel styles at the end of the file**

After the `.freqLabel` rule, add:

```css
/* ── Right column layout ── */

.rightColInner {
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;
}

.recipesSection {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
}

.columnDivider {
  flex-shrink: 0;
  height: 2px;
  background: var(--border);
  margin: 12px 0;
}

/* ── Kitchen Events section (right column) ── */

.eventSection {
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding-bottom: 4px;
}

.eventSectionHeader {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.eventCategoryRow {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--text-muted);
  margin-top: 4px;
  margin-bottom: 2px;
}

.eventBtnGrid {
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 6px;
}

.eventBtn {
  display: flex;
  align-items: center;
  gap: 6px;
  border: 2px solid var(--border);
  border-radius: 8px;
  padding: 6px 10px;
  font-family: 'Fredoka', sans-serif;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-secondary);
  background: var(--bg);
  cursor: pointer;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
}

.eventBtn:hover {
  border-color: var(--text-secondary);
  background: rgba(255,255,255,0.05);
  color: var(--text);
}

.eventBtnOn {
  border-color: #5cb85c;
  background: rgba(92, 184, 92, 0.1);
  color: var(--text);
}

.eventBtnOn:hover {
  border-color: #6ed06e;
  background: rgba(92, 184, 92, 0.18);
}

.eventBtnCheck {
  flex-shrink: 0;
  width: 14px;
  height: 14px;
  border-radius: 3px;
  border: 2px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  line-height: 1;
  color: transparent;
  background: transparent;
  transition: border-color 0.12s, background 0.12s, color 0.12s;
}

.eventBtnCheckOn {
  border-color: #5cb85c;
  background: #5cb85c;
  color: #fff;
}

.eventBtnEmoji {
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
}

.eventBtnName {
  font-size: 13px;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* ── Shared detail panel (left column, replaces recipe-only panel) ── */

.detailPanel {
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.detailEmpty {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: var(--text-faint);
  text-align: center;
  padding: 8px 0;
}

.detailTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: 'Fredoka', sans-serif;
  font-size: 18px;
  font-weight: 700;
  color: var(--text);
}

.detailBadge {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  border-radius: 4px;
  padding: 2px 6px;
  align-self: flex-start;
}

.detailBadgeHazard {
  background: rgba(208, 64, 64, 0.15);
  color: #d04040;
  border: 1px solid rgba(208, 64, 64, 0.3);
}

.detailBadgeOpportunity {
  background: rgba(92, 184, 92, 0.12);
  color: #5cb85c;
  border: 1px solid rgba(92, 184, 92, 0.3);
}

.detailDesc {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  color: var(--text-secondary);
  line-height: 1.5;
}

.detailConsequence {
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  border-radius: 6px;
  padding: 6px 10px;
  line-height: 1.4;
}

.detailConsequenceFail {
  background: rgba(208, 64, 64, 0.1);
  color: #d04040;
  border: 1px solid rgba(208, 64, 64, 0.2);
}

.detailConsequenceReward {
  background: rgba(92, 184, 92, 0.08);
  color: #5cb85c;
  border: 1px solid rgba(92, 184, 92, 0.2);
}
```

- [ ] **Step 3: Build check**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
```

Expected: exits 0. The build may warn that `eventGrid`, `eventChip`, `eventChipOn` are now unused — these should be gone because we removed them in Step 1. If you still see "unused selector" warnings, double-check Step 1 removed all four rules.

---

## Task 3: JSX restructure — left column

**Files:**
- Modify: `src/components/FreePlaySetup.tsx`

### Context on current left column structure (lines 91–363)

The left column (`leftCol`) currently contains:
1. `topRow` (Back button + TwitchStatusPill) — **keep unchanged**
2. `h1.title` — **keep unchanged**
3. `card` with ⏱ Duration — **keep unchanged**
4. `card` with 🍳 Kitchen Events (toggle + eventGrid) — **REMOVE this entire card**
5. `moreToggle` button — **keep unchanged**
6. `moreSection` (More Options panel) — **keep unchanged**, the Kitchen Events moreRow inside it is also unchanged
7. Recipe detail panel (`hoveredRecipe` conditional) — **replace** with new unified `detailPanel`

### Step 1: Update state hooks

- [ ] Add `hoveredEvent` state variable alongside `hoveredRecipe`:

Find line 89:
```tsx
  const [hoveredRecipe, setHoveredRecipe] = useState<string | null>(null)
```

Replace with:
```tsx
  const [hoveredRecipe, setHoveredRecipe] = useState<string | null>(null)
  const [hoveredEvent, setHoveredEvent] = useState<string | null>(null)
```

### Step 2: Remove the Kitchen Events card from the left column

- [ ] Find and delete the entire Kitchen Events card block (lines ~114–149 in current file):

```tsx
        <div className={styles.card}>
          <div className={styles.cardLabel}>🍳 Kitchen Events</div>
          <div className={styles.slotsRow}>
            <span className={styles.slotsLabel}>Random events during gameplay</span>
            <button
              className={`${styles.toggleBtn} ${options.kitchenEventsEnabled ? styles.toggleBtnOn : ''}`}
              onClick={() => onChange({ ...options, kitchenEventsEnabled: !options.kitchenEventsEnabled })}
            >
              {options.kitchenEventsEnabled ? 'ON' : 'OFF'}
            </button>
          </div>
          {options.kitchenEventsEnabled && (
            <div className={styles.eventGrid}>
              {EVENT_DEFS.map(def => {
                const on = options.enabledKitchenEvents.includes(def.type)
                return (
                  <button
                    key={def.type}
                    className={`${styles.eventChip} ${on ? styles.eventChipOn : ''}`}
                    onClick={() => {
                      const next = on
                        ? options.enabledKitchenEvents.filter(t => t !== def.type)
                        : [...options.enabledKitchenEvents, def.type]
                      onChange({ ...options, enabledKitchenEvents: next })
                    }}
                  >
                    {def.emoji} {def.label}
                  </button>
                )
              })}
            </div>
          )}
          {!options.kitchenEventsEnabled && (
            <div className={styles.hint}>Enable to configure event types and frequency</div>
          )}
        </div>
```

Replace the entire block with nothing (delete it). The left column will now go directly from the Duration card to the More Options toggle.

### Step 3: Replace recipe detail panel with unified detail panel

- [ ] Find the recipe detail section at the bottom of the left column (lines ~332–362 in current file):

```tsx
        {/* ── Recipe detail panel ── */}
        {hoveredRecipe && (() => {
          const recipe = RECIPES[hoveredRecipe]
          if (!recipe) return null
          return (
            <div className={styles.recipeDetail}>
              <div className={styles.recipeDetailHeader}>
                <FoodIcon icon={recipe.emoji} size={24} />
                <span className={styles.recipeDetailName}>{recipe.name}</span>
                <span className={styles.recipeDetailReward}>${recipe.reward}</span>
              </div>
              <div className={styles.recipeDetailSteps}>
                {recipe.steps.map((step, i) => {
                  const station = STATION_DEFS[step.station]
                  return (
                    <div key={i} className={styles.recipeDetailStep}>
                      <span className={styles.stepNum}>{i + 1}.</span>
                      {step.requires && (
                        <span className={styles.stepRequires}>needs {fmtIngredient(step.requires)} →</span>
                      )}
                      <span className={styles.stepStation}>{station?.emoji}</span>
                      <code className={styles.stepCmd}>!{step.action} {step.target}</code>
                      <span className={styles.stepArrow}>→</span>
                      <span className={styles.stepProduces}>{fmtIngredient(step.produces)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })()}
```

Replace with the new unified detail panel:

```tsx
        {/* ── Shared detail panel ── */}
        {(() => {
          // Recipe hover
          if (hoveredRecipe) {
            const recipe = RECIPES[hoveredRecipe]
            if (!recipe) return null
            return (
              <div className={styles.detailPanel}>
                <div className={styles.detailTitle}>
                  <FoodIcon icon={recipe.emoji} size={24} />
                  <span className={styles.recipeDetailName}>{recipe.name}</span>
                  <span className={styles.recipeDetailReward}>${recipe.reward}</span>
                </div>
                <div className={styles.recipeDetailSteps}>
                  {recipe.steps.map((step, i) => {
                    const station = STATION_DEFS[step.station]
                    return (
                      <div key={i} className={styles.recipeDetailStep}>
                        <span className={styles.stepNum}>{i + 1}.</span>
                        {step.requires && (
                          <span className={styles.stepRequires}>needs {fmtIngredient(step.requires)} →</span>
                        )}
                        <span className={styles.stepStation}>{station?.emoji}</span>
                        <code className={styles.stepCmd}>!{step.action} {step.target}</code>
                        <span className={styles.stepArrow}>→</span>
                        <span className={styles.stepProduces}>{fmtIngredient(step.produces)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }

          // Event hover
          if (hoveredEvent) {
            const def = EVENT_DEFS.find(d => d.type === hoveredEvent)
            if (!def) return null
            const isHazard = def.category === 'hazard-penalty' || def.category === 'hazard-immediate'
            return (
              <div className={styles.detailPanel}>
                <div className={styles.detailTitle}>
                  <span>{def.emoji}</span>
                  <span>{def.label}</span>
                </div>
                <span className={`${styles.detailBadge} ${isHazard ? styles.detailBadgeHazard : styles.detailBadgeOpportunity}`}>
                  {isHazard ? '⚠ Hazard' : '✨ Opportunity'}
                </span>
                <div className={styles.detailDesc}>{def.description}</div>
                {def.failDescription && (
                  <div className={`${styles.detailConsequence} ${styles.detailConsequenceFail}`}>
                    ✗ {def.failDescription}
                  </div>
                )}
                {def.rewardDescription && (
                  <div className={`${styles.detailConsequence} ${styles.detailConsequenceReward}`}>
                    ✓ {def.rewardDescription}
                  </div>
                )}
              </div>
            )
          }

          // Nothing hovered — show hint only when more options is closed (left col has space)
          return (
            <div className={styles.detailPanel}>
              <div className={styles.detailEmpty}>Hover a recipe or event to see details</div>
            </div>
          )
        })()}
```

### Step 4: Update the `moreOpen` guard condition

- [ ] The current code hides the More Options panel (and shows nothing) when `hoveredRecipe` is true:

```tsx
        {moreOpen && !hoveredRecipe && (
```

Now that the detail panel is always visible (not just on hover), and the more section occupies the left col, we should not hide it on hover. Update the condition to only depend on `moreOpen`:

```tsx
        {moreOpen && (
```

- [ ] **Step 5: Build check**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
```

Expected: exits 0, no errors. If you see "recipeDetail is defined but never used in CSS" — that class was in the old panel and can be removed from CSS too (it's replaced by `detailPanel`). For now leave it; it won't cause a build error.

---

## Task 4: JSX restructure — right column

**Files:**
- Modify: `src/components/FreePlaySetup.tsx`

### Context on current right column structure (lines ~365–507)

The right column (`rightCol`) currently contains:
1. `cardLabel` "🍽️ Recipes" — **keep**
2. `selectedPanel` — **keep**
3. `recipeScroll` with recipe grid — **keep**, but wrap in a containing div for the new layout
4. hint "Only selected recipes will appear as orders" — **keep** (it's inside recipeScroll)
5. `footer` — **keep**

We need to:
- Wrap recipes content in a `recipesSection` div
- Add a `columnDivider` after it
- Add the new `eventSection` below the divider (before the footer)
- Wrap everything in a `rightColInner` flex column

### Step 1: Restructure the right column

- [ ] Replace the entire right column JSX. Find:

```tsx
      <div className={styles.rightCol}>
        <div className={styles.cardLabel}>🍽️ Recipes</div>

        {/* ── Selected panel ── */}
        <div className={styles.selectedPanel}>
```

And replace through to the closing `</div>` of `rightCol` (line ~507 `      </div>` just before the screen's closing `</div>`). The new right column is:

```tsx
      <div className={styles.rightCol}>
        <div className={styles.rightColInner}>
          {/* ── Recipes section ── */}
          <div className={styles.recipesSection}>
            <div className={styles.cardLabel}>🍽️ Recipes</div>

            {/* ── Selected panel ── */}
            <div className={styles.selectedPanel}>
              <div className={styles.selectedHeader}>
                <span className={styles.selectedLabel}>Selected ({options.enabledRecipes.length})</span>
                <div className={styles.selectedActions}>
                  <button
                    className={styles.actionBtn}
                    onClick={() => onChange({ ...options, enabledRecipes: [] })}
                  >Remove All</button>
                  <button
                    className={styles.actionBtn}
                    onClick={() => onChange({ ...options, enabledRecipes: Object.keys(RECIPES) })}
                  >Select All</button>
                  <button
                    className={`${styles.actionBtn} ${styles.actionBtnRandom}`}
                    onClick={() => {
                      const all = Object.keys(RECIPES)
                      const shuffled = [...all].sort(() => Math.random() - 0.5)
                      onChange({ ...options, enabledRecipes: shuffled.slice(0, 3) })
                    }}
                  >Random 3</button>
                </div>
              </div>
              <div className={styles.selectedChips}>
                {options.enabledRecipes.length === 0 ? (
                  <span className={styles.selectedEmpty}>No recipes selected</span>
                ) : (
                  options.enabledRecipes.map(key => {
                    const recipe = RECIPES[key]
                    if (!recipe) return null
                    return (
                      <div key={key} className={styles.selectedChip}>
                        <FoodIcon icon={recipe.emoji} size={16} />
                        <span className={styles.selectedChipName}>{recipe.name}</span>
                        <button
                          className={styles.selectedChipRemove}
                          onClick={() => onChange({ ...options, enabledRecipes: options.enabledRecipes.filter(r => r !== key) })}
                        >×</button>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            <div className={styles.recipeScroll}>
            {(() => {
              const allSetKeys = new Set(RECIPE_SETS.flatMap(s => s.recipeKeys))
              const orphanKeys = Object.keys(RECIPES).filter(k => !allSetKeys.has(k))

              const renderRecipeBtn = (key: string) => {
                const recipe = RECIPES[key]
                if (!recipe) return null
                const isEnabled = options.enabledRecipes.includes(key)
                return (
                  <button
                    key={key}
                    className={`${styles.recipeBtn} ${isEnabled ? styles.active : ''}`}
                    onClick={() => {
                      const next = isEnabled
                        ? options.enabledRecipes.filter(r => r !== key)
                        : [...options.enabledRecipes, key]
                      onChange({ ...options, enabledRecipes: next })
                    }}
                    onMouseEnter={() => { setHoveredRecipe(key); setHoveredEvent(null) }}
                    onMouseLeave={() => setHoveredRecipe(null)}
                  >
                    <FoodIcon icon={recipe.emoji} size={22} className={styles.recipeEmoji} />
                    <span className={styles.recipeName}>{recipe.name}</span>
                    <span className={styles.recipeReward}>${recipe.reward}</span>
                  </button>
                )
              }

              const renderSection = (label: string, flag: string | null, keys: string[]) => {
                const validKeys = keys.filter(k => RECIPES[k])
                if (validKeys.length === 0) return null
                const enabledCount = validKeys.filter(k => options.enabledRecipes.includes(k)).length
                const allOn = enabledCount === validKeys.length
                const toggleAll = () => {
                  if (allOn) {
                    const next = options.enabledRecipes.filter(k => !validKeys.includes(k))
                    onChange({ ...options, enabledRecipes: next })
                  } else {
                    const next = [...new Set([...options.enabledRecipes, ...validKeys])]
                    onChange({ ...options, enabledRecipes: next })
                  }
                }
                return (
                  <div key={label} className={styles.setSection}>
                    <div className={styles.setSectionHeader}>
                      <span className={styles.setSectionLabel}>
                        {flag && <span className={styles.setSectionFlag}>{flag}</span>}
                        {label}
                      </span>
                      <button
                        className={`${styles.setSectionToggle} ${allOn ? styles.setSectionToggleOn : ''}`}
                        onClick={toggleAll}
                      >
                        {allOn ? '✓ All' : `${enabledCount}/${validKeys.length}`}
                      </button>
                    </div>
                    <div className={styles.recipeGrid}>
                      {validKeys.map(renderRecipeBtn)}
                    </div>
                  </div>
                )
              }

              return (
                <>
                  {RECIPE_SETS.map(set => renderSection(set.name, set.flag, set.recipeKeys))}
                  {renderSection('Others', null, orphanKeys)}
                </>
              )
            })()}

            <div className={styles.hint}>Only selected recipes will appear as orders</div>
            </div>
          </div>

          {/* ── Divider ── */}
          <div className={styles.columnDivider} />

          {/* ── Kitchen Events section ── */}
          <div className={styles.eventSection}>
            <div className={styles.eventSectionHeader}>
              <div className={styles.cardLabel}>🍳 Kitchen Events</div>
              <button
                className={`${styles.toggleBtn} ${options.kitchenEventsEnabled ? styles.toggleBtnOn : ''}`}
                onClick={() => onChange({ ...options, kitchenEventsEnabled: !options.kitchenEventsEnabled })}
              >
                {options.kitchenEventsEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            {options.kitchenEventsEnabled && (() => {
              const hazards = EVENT_DEFS.filter(d =>
                d.category === 'hazard-penalty' || d.category === 'hazard-immediate'
              )
              const opportunities = EVENT_DEFS.filter(d => d.category === 'opportunity')

              const renderEventBtn = (def: (typeof EVENT_DEFS)[number]) => {
                const on = options.enabledKitchenEvents.includes(def.type)
                return (
                  <button
                    key={def.type}
                    className={`${styles.eventBtn} ${on ? styles.eventBtnOn : ''}`}
                    onClick={() => {
                      const next = on
                        ? options.enabledKitchenEvents.filter(t => t !== def.type)
                        : [...options.enabledKitchenEvents, def.type]
                      onChange({ ...options, enabledKitchenEvents: next })
                    }}
                    onMouseEnter={() => { setHoveredEvent(def.type); setHoveredRecipe(null) }}
                    onMouseLeave={() => setHoveredEvent(null)}
                  >
                    <span className={`${styles.eventBtnCheck} ${on ? styles.eventBtnCheckOn : ''}`}>✓</span>
                    <span className={styles.eventBtnEmoji}>{def.emoji}</span>
                    <span className={styles.eventBtnName}>{def.label}</span>
                  </button>
                )
              }

              return (
                <>
                  <div className={styles.eventCategoryRow}>⚠ Hazards</div>
                  <div className={styles.eventBtnGrid}>
                    {hazards.map(renderEventBtn)}
                  </div>
                  <div className={styles.eventCategoryRow}>✨ Opportunities</div>
                  <div className={styles.eventBtnGrid}>
                    {opportunities.map(renderEventBtn)}
                  </div>
                </>
              )
            })()}

            {!options.kitchenEventsEnabled && (
              <div className={styles.hint}>Enable to configure event types and frequency</div>
            )}
          </div>

          {/* ── Footer ── */}
          <div className={styles.footer}>
            <div className={styles.startWarning} style={{ visibility: startWarning ? 'visible' : 'hidden' }}>
              Select at least one recipe to start.
            </div>
            <button
              className={styles.startBtn}
              onClick={() => {
                if (options.enabledRecipes.length === 0) {
                  setStartWarning(true)
                } else {
                  setStartWarning(false)
                  onStart()
                }
              }}
            >
              ▶ Start Shift!
            </button>
          </div>
        </div>
      </div>
```

### Step 2: Build check

- [ ] Run:

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
```

Expected: exits 0, no TypeScript errors. Common issues:
- "Property 'type' does not exist on EventDef" — you may be using `def` before the `EVENT_DEFS` import is in scope (it already is from line 4).
- JSX tag balance errors — count your `<div className={styles.rightCol}>` opening against all `</div>` closings in the right column.

---

## Task 5: CSS cleanup — remove now-unused recipe detail classes

**Files:**
- Modify: `src/components/FreePlaySetup.module.css`

The old `.recipeDetail` class (and only `.recipeDetail` — all `.recipeDetailHeader`, `.recipeDetailName`, `.recipeDetailReward`, `.recipeDetailSteps`, `.recipeDetailStep` are still used inside the new `detailPanel`) is now superseded by `.detailPanel`. Remove it:

- [ ] **Step 1: Remove `.recipeDetail` rule**

Find:
```css
.recipeDetail {
  flex-shrink: 0;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 12px 16px;
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
```

Delete it. The `.detailPanel` class in Task 2 replaces it with the same visual appearance.

- [ ] **Step 2: Build check**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run build
```

Expected: exits 0.

---

## Task 6: Visual verification

- [ ] **Step 1: Start dev server**

```bash
cd "/Users/nicholasthian/Desktop/Code Repo/ChatsKitchen" && npm run dev
```

Open in browser → main menu → Free Play → setup screen loads.

- [ ] **Step 2: Left column — Kitchen Events card is gone**

Confirm the left column shows: Back button + TwitchStatusPill, "Customize Your Shift" title, Duration card, ▼ More Options toggle, then the detail panel at the bottom. No Kitchen Events card.

- [ ] **Step 3: Right column — events section appears below recipes**

Confirm the right column shows: Recipes label, selected panel, scrollable recipe grid, then a horizontal divider, then "🍳 Kitchen Events" header with ON/OFF toggle, then Hazards category + 3-col grid, then Opportunities category + 3-col grid, then Start Shift button.

- [ ] **Step 4: Event toggle**

Click the Kitchen Events ON/OFF toggle. When OFF, only the header and hint text appear. When ON, both category grids appear.

- [ ] **Step 5: Event button states**

Click an event button to toggle it off. Confirm:
- When ON: green border, light green background, green checkmark ✓
- When OFF: grey border, no background fill, no checkmark fill

- [ ] **Step 6: Event hover → detail panel**

Hover over an event button. Confirm the detail panel in the left column shows:
- Title row: `emoji + label` in bold
- Category badge: red "⚠ Hazard" or green "✨ Opportunity"
- Description sentence in Space Mono
- Red "✗ Fail: …" panel (for hazards) or green "✓ Reward: …" panel (for opportunities)

- [ ] **Step 7: Recipe hover → detail panel**

Hover over a recipe button in the right column. Confirm the detail panel switches to showing the recipe steps (emoji, name, $reward, numbered steps).

- [ ] **Step 8: Nothing hovered → placeholder**

Move the mouse out of all recipe and event buttons. Confirm the detail panel shows "Hover a recipe or event to see details".

- [ ] **Step 9: More Options still works**

Click ▼ More Options. Confirm the More Options section opens in the left column. Confirm the Kitchen Events subsection inside More Options (duration/frequency sliders) still works and is not duplicated with the new events grid.

---

## Task 7: Commit

- [ ] **Commit**

```bash
git add src/data/kitchenEventDefs.ts src/components/FreePlaySetup.tsx src/components/FreePlaySetup.module.css
git commit -m "feat: move Kitchen Events selector to right column with categorised grid and hover detail panel"
```
