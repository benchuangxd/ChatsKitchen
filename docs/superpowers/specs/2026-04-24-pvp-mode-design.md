# PvP Mode — Design Spec

**Date:** 2026-04-24  
**Status:** Approved

---

## Overview

Add a PvP Mode to ChatsKitchen where Twitch chat splits into two teams (Red vs Blue) competing to earn more money by the end of the shift. The single-kitchen layout is preserved — competition is baked into shared resources (cooking stations, order tickets) while each team owns their own prepared ingredients pool and score.

---

## User Experience

### Entry Point
A new **PvP** button on the Main Menu navigates to the team selection lobby. This is a top-level mode alongside FreePlay and Adventure.

### Screen Flow
```
MainMenu → pvplobby → freeplaysetup → countdown → playing → shiftend → gameover
```

### Lobby (`pvplobby`)
- Players type `!red` or `!blue` in chat to join a team
- Side-by-side roster columns update live as players join
- Streamer mod commands:
  - `!balance` — auto-distributes players evenly between teams
  - `!move red @name` / `!move blue @name` — moves a specific player
- A "Configure & Start →" button advances to the existing `freeplaysetup` options screen
- The lobby carries team assignments through setup into the initial `GameState`

### During Gameplay
- **Shared:** cooking stations (slots, heat, extinguish), order tickets (dining room queue)
- **Per-team:** prepared ingredients pool, money earned, orders served count
- A player's `!cook` / `!chop` etc. routes the produced ingredient into their team's prep pool
- `!serve` checks the serving player's team's prep pool; awards money + served to that team
- Chat usernames are tinted red/blue to show team membership

### Win Condition
Whichever team has more money at shift end wins. Result shown in GameOver screen with a winner banner (🔴 RED WINS! / 🔵 BLUE WINS! / TIE).

---

## Data Model Changes

### `GameOptions` additions
```typescript
pvpMode: boolean           // enables PvP (default false)
pvpAutoBalance: boolean    // auto-balance available in lobby (default true)
```

### `GameState` additions
```typescript
teams: Record<string, 'red' | 'blue'>  // username → team assignment
redPreparedItems: string[]
bluePreparedItems: string[]
redMoney: number
blueMoney: number
redServed: number
blueServed: number
```

### Lobby state in `App.tsx`
```typescript
pvpLobby: { red: string[], blue: string[] } | null
```
Not part of `GameState` — exists only during lobby/setup. Merged into initial `GameState` on game start.

### Screen union
`'pvplobby'` added after `'menu'`.

---

## New Actions

```typescript
{ type: 'JOIN_TEAM';    username: string; team: 'red' | 'blue' }
{ type: 'BALANCE_TEAMS' }
{ type: 'MOVE_TO_TEAM'; username: string; team: 'red' | 'blue' }
```

**Command parsing (`commandProcessor.ts`):**
- `!red` → `JOIN_TEAM { team: 'red' }` (lobby phase only)
- `!blue` → `JOIN_TEAM { team: 'blue' }` (lobby phase only)

**Mod commands (`App.tsx` `handleMetaCommand`, lobby phase):**
- `!balance` → `BALANCE_TEAMS`
- `!move red @username` / `!move blue @username` → `MOVE_TO_TEAM`

---

## Reducer Changes

Only two existing actions need PvP-specific branching:

| Action | PvP behaviour |
|--------|--------------|
| `COOK` | Routes produced ingredient to `redPreparedItems` or `bluePreparedItems` based on `state.teams[username]` |
| `SERVE` | Reads from the serving player's team prep pool; increments `redMoney`/`blueMoney` and `redServed`/`blueServed` |

All other actions (`COOL`, `EXTINGUISH`, `TICK`, kitchen events) remain shared and unchanged.

### Extinguish threshold in PvP
```typescript
const redSize = Object.values(state.teams).filter(t => t === 'red').length
const blueSize = Object.values(state.teams).filter(t => t === 'blue').length
const threshold = Math.ceil(Math.max(redSize, blueSize) * 0.5)
```
No changes to `Station` shape — extinguish votes remain a single shared `string[]`.

---

## UI Components

### `MainMenu.tsx`
New PvP button navigates to `pvplobby`. Minimal change.

### `PvPLobby.tsx` (new)
- Side-by-side Red / Blue roster columns
- Names appear live as players type `!red` / `!blue`
- Hint text shows available mod commands
- "Configure & Start →" button or `!next` mod command advances to `freeplaysetup`
- `ChatPanel` rendered alongside for visibility

### `PreparedItems.tsx`
In PvP mode: two half-width columns separated by a thin divider. Each column header: team name + current score. Filled pill trays glow in team colour (red/blue) instead of yellow. Empty trays unchanged. "Hide names" toggle applies to both columns. Solo mode unchanged.

### `StatsBar.tsx`
Unchanged. Timer and global served/lost counts only. Team scores live in PreparedItems panel.

### `GameOver.tsx`
Winner banner at top: 🔴 RED WINS! / 🔵 BLUE WINS! / TIE, with each team's final money and served count. Existing per-player leaderboard and round history remain below.

### `ChatPanel.tsx`
In PvP mode: username tinted by team colour. No structural changes.

### `AssemblyArea` (inside `Kitchen.tsx`)
Prep items are per-team — assembly display needs to read from the serving player's team pool. Exact changes to be confirmed during implementation.

---

## Verification

1. Lobby: type `!red` / `!blue` — rosters update live
2. `!balance` — players split evenly
3. `!move red @name` — player moves to Red roster
4. Gameplay: Red cook → ingredient appears in Red prep pool only
5. Red serves order → Red money/served increments, Blue unchanged
6. Overheat station → extinguish threshold = `ceil(largerTeamSize × 0.5)`
7. GameOver → correct winner banner with final scores
