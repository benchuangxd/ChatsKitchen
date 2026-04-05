# Plan: Add Level/Stage System with Star Ratings

## Context

The game currently has no progression — every play session is identical with user-configured options. Adding a 10-level system with star ratings (1-3 stars based on money earned) gives players a sense of progression. Stars scale with level difficulty. Progress is saved to localStorage.

## Star Threshold Calculation (Level 1 baseline)

With default options (2 min, 1x speeds, capacity 3/2/2):
- Orders spawn every ~14s, so ~8-10 orders in 120s
- Average dish reward ~$45, realistic to serve 5-8 = $225-$360
- **Level 1 thresholds:** 1 star = $100, 2 stars = $200, 3 stars = $350
- **Scaling formula:** each level multiplies thresholds by `1 + (level - 1) * 0.25`
  - Level 5: $200 / $400 / $700
  - Level 10: $325 / $650 / $1138

## Level Difficulty Scaling

Each level increases difficulty to make higher money targets achievable but challenging:
- `orderSpeed`: increases by 0.1 per level (orders come faster / less patience) → level 10 = 1.9x
- `cookingSpeed`: increases by 0.05 per level (cooking is slightly faster to keep up) → level 10 = 1.45x
- `shiftDuration`: stays at 120s (consistent round length)
- `stationCapacity`: stays at defaults

## Data Model

### New file: `src/data/levels.ts`
```typescript
export interface LevelConfig {
  level: number
  stars: [number, number, number] // money thresholds for 1/2/3 stars
  cookingSpeed: number
  orderSpeed: number
  shiftDuration: number
}

export function getLevelConfig(level: number): LevelConfig { ... }
```

### New type in `src/state/types.ts`
```typescript
export interface LevelProgress {
  [level: number]: number // level → best stars (0-3)
}
```

## Changes by File

### 1. `src/data/levels.ts` (NEW)
- `getLevelConfig(level)` — returns computed `LevelConfig` for levels 1-10
- `getStarRating(level, money)` — returns 0-3 stars for given money earned
- Pure functions, no state

### 2. `src/state/types.ts`
- Add `LevelProgress` interface

### 3. `src/App.tsx`
- Add `currentLevel` state (`number | null` — null = free play from Options)
- Add `levelProgress` state loaded from/saved to localStorage
- New screen: `'levelselect'` added to Screen union
- `resetGame` accepts optional level param → uses `getLevelConfig(level)` instead of `gameOptions`
- On game over: compute stars, update `levelProgress` if better, save to localStorage
- Pass level info to GameOver screen
- Wire MainMenu "Levels" button → `'levelselect'` screen

### 4. `src/components/MainMenu.tsx`
- Add "Levels" button (between Play and Options)

### 5. `src/components/LevelSelect.tsx` (NEW)
- Grid of 10 level buttons showing level number + best stars earned (or locked/empty)
- All levels selectable (no unlock gating — user said "up to 10")
- Clicking a level → `onSelectLevel(level)` → starts that level
- Fixed back button (top-left, same style as Options/Twitch pages)

### 6. `src/components/LevelSelect.module.css` (NEW)
- Grid layout for level cards, star display (filled/empty), kitchen color scheme

### 7. `src/components/GameOver.tsx`
- Show star rating (1-3 filled stars) when a level was played
- Show money earned vs thresholds for next star
- Three buttons when level mode:
  - "Next Level" (if level < 10)
  - "Repeat Level"
  - "Main Menu"
- Keep existing "Play Again" + "Main Menu" for free play mode

### 8. `src/components/GameOver.module.css`
- Star display styles, additional button styles

## Screen Flow

```
MainMenu
  ├─ Play (free play, uses gameOptions) → countdown → playing → gameover
  ├─ Levels → LevelSelect → countdown → playing → gameover (with stars)
  ├─ Options
  └─ Twitch
```

## localStorage Schema

Key: `chatsKitchen_levelProgress`
Value: `{ "1": 3, "2": 2, "5": 1 }` (level → best stars)

## Files Summary

| File | Action |
|------|--------|
| `src/data/levels.ts` | CREATE |
| `src/state/types.ts` | MODIFY — add `LevelProgress` |
| `src/App.tsx` | MODIFY — add level state, screen, localStorage |
| `src/components/MainMenu.tsx` | MODIFY — add Levels button |
| `src/components/LevelSelect.tsx` | CREATE |
| `src/components/LevelSelect.module.css` | CREATE |
| `src/components/GameOver.tsx` | MODIFY — stars + level buttons |
| `src/components/GameOver.module.css` | MODIFY — star styles |

## Verification

1. `npm run build` — passes
2. `npm run dev` — test:
   - Main menu shows "Levels" button
   - Level select shows 10 levels, all clickable
   - Playing a level shows star rating on game over
   - Stars persist across page refreshes (localStorage)
   - "Next Level" / "Repeat Level" buttons work
   - Free play ("Play" button) still works without star rating
