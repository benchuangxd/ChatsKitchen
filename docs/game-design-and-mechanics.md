# Let Chat Cook: Game Design And Mechanics

## Overview

Let Chat Cook is a livestream-friendly kitchen coordination game where a streamer and their audience work together to complete food orders in real time. The core fantasy is simple: chat becomes the kitchen crew.

The game is built around short, high-energy rounds where players type commands to prepare ingredients and serve orders before time runs out. It is designed to feel readable on stream, easy to join quickly, and chaotic in a fun way when multiple people are participating.

## Design Goals

### 1. Make chat participation immediate

Players should be able to join by typing a short command without learning a deep control scheme. The game uses simple text verbs such as `chop`, `grill`, `cool`, and `serve`.

### 2. Encourage cooperation

Most dishes require multiple steps across different stations. That means one person can start a task, another can take the finished ingredient, and someone else can plate or serve the final dish.

### 3. Create readable kitchen chaos

The game is meant to be busy, but not unreadable. UI panels, order tickets, the commands panel, the tutorial, and station-specific visuals are all there to keep the chaos understandable.

### 4. Support both sandbox and progression play

The game supports:

- `Free Play`, where the player can tune settings such as speeds and station capacity
- `Adventure`, a roguelike multi-shift run where each shift must hit a money goal to continue

## Core Game Loop

Each round follows the same basic loop:

1. Orders spawn over time.
2. Players read the requested dish and identify the needed ingredients.
3. Players type cooking commands in chat to process those ingredients at the correct stations.
4. Finished ingredients move automatically into the prepared-items pool.
5. A player serves the dish to the correct order number once all required ingredients are ready.
6. The team earns money based on the dish value and how quickly it was delivered.

This loop repeats until the round timer expires.

## Main Modes

## Free Play

Free Play is the flexible mode. Parameters are configured directly in the Free Play setup screen via sliders and editable inputs:

| Parameter | Default | Range | Step |
|-----------|---------|-------|------|
| Duration | 3 min | 1–9 min | 1 min |
| Cooking Speed | 1.0× | 0.25×–3.0× | 0.25× |
| Order Urgency | 1.0× | 0.25×–3.0× | 0.25× |
| Order Frequency | 1.0× | 0.25×–3.0× | 0.25× |
| Auto-Restart | OFF | ON / OFF | — |
| Restart Delay | 60 s | 10–300 s | 10 s |

Station slot capacity can also be toggled and adjusted per station type (chopping: 1–8, cooking: 1–8).

Auto-Restart and Restart Delay are found in the More Options panel. When Auto-Restart is on, the game over screen displays a countdown and automatically begins a new round when it reaches zero. Moderators and the broadcaster can also control this live from chat (see Mod Commands below).

It is the best mode for experimenting, practicing, or playing casually with chat.

## Adventure Mode

Adventure is a roguelike multi-shift run. Each shift has a fixed money goal — meet it to advance to the next shift, fail and the run ends. Recipes and difficulty scale as shifts progress.

Every shift has:

- a shift number
- a money goal that must be reached to continue
- an increasing number of enabled recipes as shifts progress
- a fixed shift duration

The best run (most shifts completed) is saved to the browser.

## Orders And Scoring

An order contains:

- an order number
- the requested dish
- a patience timer
- a money value

Serving an order grants:

- the recipe’s base reward
- a time bonus based on how much patience remained

This means fast service is rewarded, not just successful service.

## Recipes And Food Structure

Recipes are built from step-based ingredient preparation. Each dish defines:

- the visible dish name and emoji
- a base reward
- patience
- a list of cooking/prep steps
- the exact set of prepared ingredients needed for plating

Examples:

- `Burger`: chop lettuce, grill patty, toast bun, then serve
- `Fries`: chop potato → fry potato (requires chopped potato), then serve
- `Bulgogi`: chop beef → grill beef, chop spring onion, then serve
- `Fried Rice`: cook rice → stir rice, chop spring onion, then serve

Some steps require a previously prepared ingredient. For example, fries require chopped potato before frying, and bulgogi requires sliced beef before grilling. These are marked with `→` in the recipe reference.

## Stations

The kitchen is divided into nine station types, each tied to specific commands:

- `Chopping Board` for `chop`
- `Grill` for `grill`
- `Fryer` for `fry`
- `Stove` for `boil`
- `Oven` for `toast` and `roast`
- `Wok` for `stir`
- `Steamer` for `steam`
- `Stone Pot` for `simmer`
- `Rice Pot` for `cook`

Only stations required by the currently enabled recipes are rendered — unused stations do not appear in the kitchen.

Each station has a slot limit. If a station is full, new actions at that station are rejected until space opens up.

In Free Play, slot capacity can be adjusted in the More Options panel. In gameplay terms, capacity strongly affects how crowded or forgiving the kitchen feels.

## Command System

The command system is the main input method for chat participation. Commands are entered by name — no prefix required. The `!` prefix is also accepted (e.g. `!chop lettuce`), making it natural for Twitch chat users. The currently supported commands are:

| Command | Syntax | Description |
|---------|--------|-------------|
| `chop` | `chop <item>` | Chop an ingredient at the chopping board |
| `grill` | `grill <item>` | Grill an ingredient |
| `fry` | `fry <item>` | Fry an ingredient |
| `boil` | `boil <item>` | Boil an ingredient on the stove |
| `toast` | `toast <item>` | Toast an item in the oven |
| `roast` | `roast <item>` | Roast an item in the oven |
| `stir` | `stir <item>` | Stir-fry an ingredient in the wok |
| `steam` | `steam <item>` | Steam an ingredient |
| `simmer` | `simmer <item>` | Simmer an ingredient in the stone pot |
| `cook` | `cook <item>` | Cook rice in the rice pot |
| `serve` | `serve <order#>` | Serve a completed dish to an order |
| `cool` | `cool <station>` | Reduce a station's heat by 30% |
| `extinguish` | `extinguish <station>` | Vote to restore an overheated station (requires 30% of active players) |

### Mod / Broadcaster Commands

Certain commands are reserved for Twitch moderators and the broadcaster (or the local chat input, which is always granted broadcaster-level access). These commands control the game session rather than the kitchen, and are processed before normal cooking commands.

| Command | Valid during | Effect |
|---------|-------------|--------|
| `!start` | Game over screen (Free Play) | Immediately starts a new round, skipping any remaining countdown |
| `!onAutoRestart` | Playing, Game over | Enables auto-restart |
| `!offAutoRestart` | Playing, Game over | Disables auto-restart and cancels any active countdown |
| `!exit` | Playing | Ends the round and triggers the normal shift-end → game-over flow |

When a mod command fires, a brief toast notification appears on screen for the streamer and viewers to see. The game over screen also always shows the available commands as a reference, regardless of whether auto-restart is on or off.

### Shortform aliases

When shortform commands are enabled in Options, single-letter aliases can be used:

| Alias | Expands to |
|-------|-----------|
| `c` | `chop` |
| `g` | `grill` |
| `f` | `fry` |
| `b` | `boil` |
| `t` | `toast` |
| `r` | `roast` |
| `st` | `stir` |
| `sm` | `steam` |
| `si` | `simmer` |
| `ck` | `cook` |
| `cl` | `cool` |
| `s` | `serve` |

### Command flow

The intended flow is:

1. Start preparation with a cooking command.
2. Wait for the ingredient to finish — completed ingredients are automatically deposited into the prepared-items pool from all stations.
3. Use `serve <order#>` once all required ingredients for that order are in the pool.

## Player Constraints And Team Dynamics

The game intentionally limits what one user can do at once.

### Busy state

A user cannot keep starting new work while already committed to an active station task. This prevents a single chatter from dominating the entire kitchen and pushes the team toward shared execution.

### Cooldown

There is a short per-user command cooldown to reduce spam and accidental repeated actions.

### Shared kitchen state

Prepared ingredients, active stations, and orders all exist in a shared state. This is what makes the game collaborative: everyone is acting on the same kitchen.

## Heat And Failure Pressure

Every completed cook at a non-chopping station adds 20% heat to that station. Heat is visible on the station's border colour: green (cool) → yellow → orange → red (critical).

Players can type `cool <station>` (e.g. `cool grill`) to reduce a station's heat by 30%. There is a per-user cooldown, so the team needs to spread this responsibility.

When heat reaches 100%, the station **overheats**:

- all active slots are destroyed and assigned players are freed
- the station is locked and cannot accept new commands
- players must collectively type `extinguish <station>` — at least 30% of that round's active players must vote before the station is restored
- the station returns to 0% heat once extinguished

The chopping board is exempt from heat accumulation and never overheats.

This mechanic adds pressure and team coordination beyond recipe execution. Ignoring heat forces the whole team to stop and extinguish together.

## Rush Orders

Any order spawn has a 25% chance of being a rush order (capped at one active rush at a time). Rush orders are marked with a ⚡ badge and an amber glow.

Rush order properties compared to a standard order of the same dish:

- Patience is halved (50% of normal)
- Reward is multiplied by 1.75×
- Rush orders pin to the top of the order queue

Rush orders are high-risk, high-reward: they expire faster but pay out significantly more if served quickly.

## UI Structure

The game is designed to remain understandable even during busy rounds.

### Main Menu

The Main Menu is the hub for:

- connecting Twitch
- entering Adventure or Free Play
- starting the tutorial
- changing Options

### Tutorial Flow

The tutorial system is meant to lower the learning curve without forcing a long onboarding sequence.

Current tutorial behavior:

- clicking `Adventure` or `Free Play` first shows a tutorial prompt for new players
- `Play Tutorial` starts the interactive tutorial round
- `Skip` continues into the selected mode
- `Don't Show Again` suppresses the prompt for future sessions
- clicking `Tutorial` on the main menu starts the tutorial directly

### Gameplay HUD

The gameplay screen includes:

- the main game logo
- a mode indicator showing either `Level X` or `Free Play`
- score and round stats
- Twitch connection indicator
- chat toggle
- bot toggle
- audio controls
- an exit button

### Commands & Recipes panel

An expandable reference panel shows valid commands, shorthand hints, and recipe breakdowns. This helps first-time chat participants join quickly without leaving the game view.

## Twitch Integration

Twitch integration is a major part of the design identity.

When connected:

- live Twitch chat messages are read into the game
- commands from chat become gameplay actions
- the UI shows connected-channel status
- moderators and the broadcaster have access to session-control commands (`!start`, `!exit`, `!onAutoRestart`, `!offAutoRestart`)

When disconnected:

- the game can still be played locally
- the UI warns that Twitch should be connected before playing with a community
- the local chat input is always treated as broadcaster-level for mod commands

## Audio And Feedback

Audio settings are split into music and sound effects. This lets streamers balance the game against their broadcast mix.

The game also gives frequent textual feedback through kitchen messages such as:

- action success
- missing ingredient errors
- station full errors
- fire warnings
- serve rewards

These messages reinforce what the team should do next.

## Reset And Persistence Model

The project currently uses lightweight local browser storage.

Persisted data includes:

- audio settings
- level progress
- Free Play game options (duration, speeds, recipes, station slots, auto-restart settings)

Session-level or resettable state includes:

- tutorial prompt suppression
- Twitch connection state

There is also a full reset flow in Options that restores the game to a clean default state.

## Recipe Reference

Steps marked `→` require the prior ingredient in the prepared-items pool before they can start. Steps joined by `+` can be done in any order.

### Western Classics 🇺🇸

| Dish | Steps | Reward | Patience |
|------|-------|--------|---------|
| 🍔 Burger | `chop lettuce` + `grill patty` + `toast bun` | $65 | 80s |
| 🐟 Fish & Chips | `chop potato` → `fry potato` + `fry fish` | $60 | 75s |
| 🧀 Grilled Cheese | `grill cheese` + `toast bread` | $40 | 55s |
| 🫑 Roasted Veggies | `chop tomato` + `chop pepper` → `roast pepper` | $55 | 75s |

### Chinese Kitchen 🇨🇳

| Dish | Steps | Reward | Patience |
|------|-------|--------|---------|
| 🍳 Fried Rice | `cook rice` → `stir rice` + `chop spring_onion` | $55 | 75s |
| 🥢 Stir-Fried Pork | `chop pork` → `stir pork` + `chop cabbage` | $65 | 80s |
| 🧈 Steamed Tofu | `chop tofu` → `steam tofu` + `chop spring_onion` | $45 | 65s |
| 🥟 Steamed Buns | `chop pork` → `stir pork` + `steam bun` | $55 | 70s |

### Korean Kitchen 🇰🇷

| Dish | Steps | Reward | Patience |
|------|-------|--------|---------|
| 🥩 Bulgogi | `chop beef` → `grill beef` + `chop spring_onion` | $70 | 85s |
| Kimchi Jjigae | `chop kimchi` → `simmer kimchi` + `chop tofu` | $65 | 80s |
| Doenjang Jjigae | `chop zucchini` → `simmer zucchini` + `chop tofu` | $60 | 75s |
| 🍱 Bibimbap | `cook rice` + `chop beef` → `simmer beef` | $75 | 90s |

### Japanese Kitchen 🇯🇵

| Dish | Steps | Reward | Patience |
|------|-------|--------|---------|
| 🍣 Sushi Roll | `cook rice` + `chop tuna` + `chop nori` | $70 | 85s |
| 🍤 Tempura | `chop shrimp` → `fry shrimp` + `chop zucchini` | $65 | 80s |
| 🥚 Chawanmushi | `chop egg` → `steam egg` + `chop shrimp` | $55 | 70s |
| 🍱 Salmon Donburi | `cook rice` + `chop salmon` + `chop nori` | $75 | 90s |

### Others (ungrouped)

| Dish | Steps | Reward | Patience |
|------|-------|--------|---------|
| 🍟 Fries | `chop potato` → `fry potato` | $40 | 55s |
| 🌭 Hot Dog | `grill sausage` + `chop onion` + `toast bun` | $45 | 55s |
| 🥗 Caesar Salad | `chop lettuce` + `chop tomato` + `toast crouton` | $35 | 50s |

## Station Reference

| Station | Command(s) | Heat | Default slots |
|---------|-----------|------|---------------|
| 🔪 Chopping Board | `chop` | exempt — never overheats | 3 |
| 🔥 Grill | `grill` | +20% per cook | 2 |
| 🫕 Fryer | `fry` | +20% per cook | 2 |
| ♨️ Stove | `boil` | +20% per cook | 2 |
| 🧱 Oven | `toast` / `roast` | +20% per cook | 2 |
| 🥘 Wok | `stir` | +20% per cook | 2 |
| 🫕 Steamer | `steam` | +20% per cook | 2 |
| 🍲 Stone Pot | `simmer` | +20% per cook | 2 |
| 🍚 Rice Pot | `cook` | +20% per cook | 2 |

All cooking stations reach overheat after 5 completed cooks without cooling. The border colour of each station reflects current heat level. Use `cool <station>` (-30% heat) to prevent lockouts.

Slot limits apply separately to the chopping board and to each cooking station type. In Free Play, both limits are configurable in the More Options panel (chopping: 1–8 slots, cooking: 1–8 slots per station type).

## Adventure Mode Reference

Each Adventure shift has a fixed money goal. Recipes available increase as shifts progress, keeping early shifts accessible while later shifts demand broader coordination. The best run (most shifts survived) is saved to the browser and persists between sessions.

## Player Stats

The game tracks per-player statistics during each round:

| Stat | Description |
|------|-------------|
| `cooked` | Number of cooking actions completed |
| `served` | Number of orders served |
| `moneyEarned` | Total money earned from serves |
| `extinguished` | Number of overheat votes cast |
| `firesCaused` | Number of times this player's cook triggered an overheat |

## Why The Game Works

The game works because it combines:

- very simple individual inputs
- a shared cooperative objective
- visible time pressure
- messy but readable coordination

Each individual command is easy, but running the whole kitchen well requires teamwork, timing, and awareness. That makes it especially well suited for chat-driven play.

## Future Design Expansion Ideas

Natural extension points for the design include:

- more recipes and station types
- modifiers per level
- special event orders
- stronger player identity or contribution summaries
- stream-specific scoring or audience challenges
- persistent progression beyond level stars

Even without these additions, the current design already delivers a clear loop: read the order, coordinate the kitchen, beat the timer, and let chat cook.
